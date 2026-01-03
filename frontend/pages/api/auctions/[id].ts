import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Auction ID is required' });
    }

    // Fetch the auction with related data
    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        nft: {
          select: {
            id: true,
            tokenId: true,
            name: true,
            description: true,
            image: true,
            imageIpfsHash: true,
            metadataIpfsHash: true,
            objectType: true,
            constellation: true,
            distance: true,
            distanceLy: true,
            totalScore: true,
            cosmicScore: true,
            badgeTier: true,
            fameVisibility: true,
            scientificSignificance: true,
            rarity: true,
            discoveryRecency: true,
            culturalImpact: true,
            discoveryYear: true,
            ownerAddress: true,
            status: true,
          },
        },
        bids: {
          orderBy: { timestamp: 'desc' },
          select: {
            id: true,
            bidAmountCents: true,
            bidderAddress: true,
            timestamp: true,
            status: true,
          },
        },
      },
    });

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    const now = new Date();
    const isActive =
      auction.status === 'ACTIVE' &&
      auction.startTime <= now &&
      auction.endTime > now;

    // Format the response
    const formattedAuction = {
      id: auction.id,
      tokenId: auction.tokenId,
      nftName: auction.nftName,
      startingBidCents: auction.startingBidCents,
      currentBidCents: auction.currentBidCents,
      highestBidderAddress: auction.highestBidderAddress,
      status: auction.status,
      isActive,
      startTime: auction.startTime.toISOString(),
      endTime: auction.endTime.toISOString(),
      timeRemaining: isActive
        ? Math.max(0, auction.endTime.getTime() - now.getTime())
        : 0,
      createdAt: auction.createdAt.toISOString(),
      totalBids: auction.bids.length,
      minimumNextBidCents: calculateMinimumBid(auction.currentBidCents),
      nft: auction.nft
        ? {
            id: auction.nft.id,
            tokenId: auction.nft.tokenId,
            name: auction.nft.name,
            description: auction.nft.description,
            image:
              auction.nft.image ||
              (auction.nft.imageIpfsHash
                ? `https://gateway.pinata.cloud/ipfs/${auction.nft.imageIpfsHash}`
                : null),
            metadataIpfsHash: auction.nft.metadataIpfsHash,
            objectType: auction.nft.objectType,
            constellation: auction.nft.constellation,
            distance: auction.nft.distance,
            distanceLy: auction.nft.distanceLy,
            cosmicScore: auction.nft.cosmicScore || auction.nft.totalScore,
            badgeTier: auction.nft.badgeTier,
            discoveryYear: auction.nft.discoveryYear,
            ownerAddress: auction.nft.ownerAddress,
            nftStatus: auction.nft.status,
            scores: {
              fame: auction.nft.fameVisibility || 0,
              significance: auction.nft.scientificSignificance || 0,
              rarity: auction.nft.rarity || 0,
              discoveryRecency: auction.nft.discoveryRecency || 0,
              culturalImpact: auction.nft.culturalImpact || 0,
            },
          }
        : null,
      bidHistory: auction.bids.map((bid: { id: string; bidAmountCents: number; bidderAddress: string | null; timestamp: Date; status: string }) => ({
        id: bid.id,
        amountCents: bid.bidAmountCents,
        bidderAddress: bid.bidderAddress
          ? `${bid.bidderAddress.slice(0, 6)}...${bid.bidderAddress.slice(-4)}`
          : null,
        fullBidderAddress: bid.bidderAddress,
        timestamp: bid.timestamp.toISOString(),
        status: bid.status,
      })),
    };

    res.json({
      success: true,
      auction: formattedAuction,
    });
  } catch (error: any) {
    console.error('Error fetching auction details:', error);
    res.status(500).json({
      error: 'Failed to fetch auction details',
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
