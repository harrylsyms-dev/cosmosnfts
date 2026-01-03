import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Auction ID is required' });
    }

    const { bidAmountCents, bidderAddress, bidderEmail } = req.body;

    // Validate required fields
    if (!bidAmountCents || typeof bidAmountCents !== 'number') {
      return res.status(400).json({ error: 'Valid bid amount in cents is required' });
    }

    if (!bidderAddress || typeof bidderAddress !== 'string') {
      return res.status(400).json({ error: 'Bidder wallet address is required' });
    }

    // Validate wallet address format (basic Ethereum address validation)
    if (!/^0x[a-fA-F0-9]{40}$/.test(bidderAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Fetch the auction
    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        bids: {
          orderBy: { bidAmountCents: 'desc' },
          take: 1,
        },
      },
    });

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    const now = new Date();

    // Check if auction is active
    if (auction.status !== 'ACTIVE') {
      return res.status(400).json({
        error: 'Auction is not active',
        auctionStatus: auction.status,
      });
    }

    // Check if auction has started
    if (auction.startTime > now) {
      return res.status(400).json({
        error: 'Auction has not started yet',
        startTime: auction.startTime.toISOString(),
      });
    }

    // Check if auction has ended
    if (auction.endTime <= now) {
      return res.status(400).json({
        error: 'Auction has ended',
        endTime: auction.endTime.toISOString(),
      });
    }

    // Calculate minimum bid
    const minimumBidCents = calculateMinimumBid(auction.currentBidCents);

    // Validate bid amount meets minimum
    if (bidAmountCents < minimumBidCents) {
      return res.status(400).json({
        error: 'Bid amount is too low',
        currentBidCents: auction.currentBidCents,
        minimumBidCents,
        yourBidCents: bidAmountCents,
      });
    }

    // Check if bidder is trying to outbid themselves
    if (
      auction.highestBidderAddress &&
      auction.highestBidderAddress.toLowerCase() === bidderAddress.toLowerCase()
    ) {
      return res.status(400).json({
        error: 'You are already the highest bidder',
      });
    }

    // Check if bidder is banned
    try {
      const bannedAddress = await prisma.bannedAddress.findUnique({
        where: { walletAddress: bidderAddress.toLowerCase() },
      });

      if (bannedAddress) {
        return res.status(403).json({
          error: 'This wallet address is not allowed to participate in auctions',
        });
      }
    } catch {
      // BannedAddress table might not exist
    }

    // Store the previous highest bidder for outbid notification
    const previousHighestBidder = auction.highestBidderAddress;
    const previousBidAmount = auction.currentBidCents;

    // Create the bid and update the auction in a transaction
    const [newBid, updatedAuction] = await prisma.$transaction([
      prisma.auctionBid.create({
        data: {
          auctionId: id,
          bidderAddress: bidderAddress.toLowerCase(),
          bidderEmail: bidderEmail || null,
          bidAmountCents,
          status: 'CONFIRMED',
        },
      }),
      prisma.auction.update({
        where: { id },
        data: {
          currentBidCents: bidAmountCents,
          highestBidderAddress: bidderAddress.toLowerCase(),
        },
      }),
    ]);

    // Extend auction if bid placed in final minutes (anti-sniping)
    const timeRemaining = auction.endTime.getTime() - now.getTime();
    const ANTI_SNIPE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
    const ANTI_SNIPE_EXTENSION_MS = 5 * 60 * 1000; // Extend by 5 minutes

    let auctionExtended = false;
    let newEndTime = auction.endTime;

    if (timeRemaining < ANTI_SNIPE_THRESHOLD_MS) {
      newEndTime = new Date(now.getTime() + ANTI_SNIPE_EXTENSION_MS);
      await prisma.auction.update({
        where: { id },
        data: { endTime: newEndTime },
      });
      auctionExtended = true;
    }

    // Log outbid event for notification system (if there was a previous bidder)
    if (previousHighestBidder && previousHighestBidder !== bidderAddress.toLowerCase()) {
      try {
        await prisma.emailLog.create({
          data: {
            recipient: previousHighestBidder,
            emailType: 'AUCTION_OUTBID',
            status: 'SENT',
          },
        });
      } catch {
        // Email log is optional
      }
    }

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      bid: {
        id: newBid.id,
        auctionId: newBid.auctionId,
        bidAmountCents: newBid.bidAmountCents,
        bidderAddress: `${newBid.bidderAddress.slice(0, 6)}...${newBid.bidderAddress.slice(-4)}`,
        timestamp: newBid.timestamp.toISOString(),
        status: newBid.status,
      },
      auction: {
        id: updatedAuction.id,
        currentBidCents: updatedAuction.currentBidCents,
        highestBidderAddress: updatedAuction.highestBidderAddress
          ? `${updatedAuction.highestBidderAddress.slice(0, 6)}...${updatedAuction.highestBidderAddress.slice(-4)}`
          : null,
        endTime: newEndTime.toISOString(),
        auctionExtended,
        minimumNextBidCents: calculateMinimumBid(bidAmountCents),
      },
      outbidNotification: previousHighestBidder
        ? {
            previousBidder: `${previousHighestBidder.slice(0, 6)}...${previousHighestBidder.slice(-4)}`,
            previousAmountCents: previousBidAmount,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error placing bid:', error);
    res.status(500).json({
      error: 'Failed to place bid',
      details: error?.message,
    });
  }
}

/**
 * Calculate the minimum next bid based on current bid
 * Implements a tiered increment system:
 * - Under $100: $5 minimum increment
 * - $100-$500: $10 minimum increment
 * - $500-$1000: $25 minimum increment
 * - $1000-$5000: $50 minimum increment
 * - Over $5000: $100 minimum increment
 */
function calculateMinimumBid(currentBidCents: number): number {
  let incrementCents: number;

  if (currentBidCents < 10000) {
    // Under $100
    incrementCents = 500; // $5
  } else if (currentBidCents < 50000) {
    // $100-$500
    incrementCents = 1000; // $10
  } else if (currentBidCents < 100000) {
    // $500-$1000
    incrementCents = 2500; // $25
  } else if (currentBidCents < 500000) {
    // $1000-$5000
    incrementCents = 5000; // $50
  } else {
    // Over $5000
    incrementCents = 10000; // $100
  }

  return currentBidCents + incrementCents;
}
