import { prisma } from '../config/database';
import { blockchainService } from './blockchain.service';
import { emailService } from './email.service';
import { logger } from '../utils/logger';

interface CreateAuctionParams {
  tokenId: number;
  nftName: string;
  startingBidCents: number;
  durationDays: number;
}

interface PlaceBidParams {
  auctionId: string;
  bidderAddress: string;
  bidderEmail?: string;
  bidAmountCents: number;
  paymentIntentId?: string;
}

class AuctionService {
  /**
   * Create a new auction for a high-profile NFT
   */
  async createAuction(params: CreateAuctionParams) {
    const { tokenId, nftName, startingBidCents, durationDays } = params;

    // Verify NFT exists and is available
    const nft = await prisma.nFT.findUnique({
      where: { tokenId },
    });

    if (!nft) {
      throw new Error('NFT not found');
    }

    if (nft.status !== 'AVAILABLE') {
      throw new Error('NFT is not available for auction');
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Create auction in database
    const auction = await prisma.auction.create({
      data: {
        tokenId,
        nftName,
        startingBidCents,
        currentBidCents: startingBidCents,
        status: 'ACTIVE',
        startTime,
        endTime,
      },
    });

    // Update NFT status
    await prisma.nFT.update({
      where: { tokenId },
      data: { status: 'AUCTIONED' },
    });

    // Create auction on blockchain
    try {
      await blockchainService.createAuction(
        tokenId,
        startingBidCents,
        durationDays
      );
    } catch (error) {
      logger.error('Failed to create auction on blockchain:', error);
      // Continue - blockchain sync can be retried
    }

    logger.info(`Auction created for ${nftName} (Token #${tokenId})`);

    return auction;
  }

  /**
   * Get all active auctions
   */
  async getActiveAuctions() {
    const auctions = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endTime: {
          gt: new Date(),
        },
      },
      include: {
        nft: true,
        bids: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
      orderBy: { endTime: 'asc' },
    });

    return auctions.map((auction) => ({
      ...auction,
      timeRemaining: Math.max(0, auction.endTime.getTime() - Date.now()),
      bidCount: auction.bids.length,
    }));
  }

  /**
   * Get single auction by ID
   */
  async getAuction(auctionId: string) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        nft: true,
        bids: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    return {
      ...auction,
      timeRemaining: Math.max(0, auction.endTime.getTime() - Date.now()),
      isEnded: new Date() > auction.endTime,
      bidCount: auction.bids.length,
    };
  }

  /**
   * Place a bid on an auction
   */
  async placeBid(params: PlaceBidParams) {
    const { auctionId, bidderAddress, bidderEmail, bidAmountCents, paymentIntentId } = params;

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { bids: true },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    if (auction.status !== 'ACTIVE') {
      throw new Error('Auction is not active');
    }

    if (new Date() > auction.endTime) {
      throw new Error('Auction has ended');
    }

    // Minimum bid: current + 5% or $25, whichever is higher
    const minIncrement = Math.max(auction.currentBidCents * 0.05, 2500);
    const minBid = auction.currentBidCents + minIncrement;

    if (bidAmountCents < minBid) {
      throw new Error(`Bid must be at least $${(minBid / 100).toFixed(2)}`);
    }

    // Get previous highest bidder for outbid notification
    const previousBidder = auction.highestBidderAddress;
    const previousBidderEmail = auction.bids[0]?.bidderEmail;

    // Create bid record
    const bid = await prisma.auctionBid.create({
      data: {
        auctionId,
        bidderAddress,
        bidderEmail,
        bidAmountCents,
        paymentIntentId,
        status: 'CONFIRMED',
      },
    });

    // Update auction
    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        currentBidCents: bidAmountCents,
        highestBidderAddress: bidderAddress,
      },
    });

    // Notify previous bidder they've been outbid
    if (previousBidder && previousBidderEmail && previousBidder !== bidderAddress) {
      await emailService.sendOutbidNotification(
        previousBidderEmail,
        auction.nftName,
        bidAmountCents
      );
    }

    logger.info(`Bid placed: $${(bidAmountCents / 100).toFixed(2)} on ${auction.nftName}`);

    return bid;
  }

  /**
   * Get bid history for an auction
   */
  async getBidHistory(auctionId: string) {
    const bids = await prisma.auctionBid.findMany({
      where: { auctionId },
      orderBy: { timestamp: 'desc' },
    });

    return bids.map((bid) => ({
      bidder: `${bid.bidderAddress.slice(0, 6)}...${bid.bidderAddress.slice(-4)}`,
      amount: bid.bidAmountCents,
      displayAmount: `$${(bid.bidAmountCents / 100).toFixed(2)}`,
      timestamp: bid.timestamp,
    }));
  }

  /**
   * Finalize ended auctions
   */
  async finalizeEndedAuctions() {
    const endedAuctions = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endTime: {
          lt: new Date(),
        },
      },
      include: { nft: true },
    });

    for (const auction of endedAuctions) {
      try {
        await this.finalizeAuction(auction.id);
      } catch (error) {
        logger.error(`Failed to finalize auction ${auction.id}:`, error);
      }
    }

    return endedAuctions.length;
  }

  /**
   * Finalize a single auction
   */
  async finalizeAuction(auctionId: string) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { nft: true, bids: true },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    if (new Date() <= auction.endTime) {
      throw new Error('Auction has not ended yet');
    }

    if (auction.status === 'FINALIZED') {
      throw new Error('Auction already finalized');
    }

    if (!auction.highestBidderAddress) {
      // No bids - mark as ended without winner
      await prisma.auction.update({
        where: { id: auctionId },
        data: { status: 'ENDED' },
      });

      await prisma.nFT.update({
        where: { tokenId: auction.tokenId },
        data: { status: 'AVAILABLE' },
      });

      logger.info(`Auction ${auctionId} ended with no bids`);
      return null;
    }

    // Finalize on blockchain
    const txHash = await blockchainService.finalizeAuction(auction.tokenId);

    // Update auction status
    await prisma.auction.update({
      where: { id: auctionId },
      data: { status: 'FINALIZED' },
    });

    // Update NFT
    await prisma.nFT.update({
      where: { tokenId: auction.tokenId },
      data: {
        status: 'MINTED',
        ownerAddress: auction.highestBidderAddress,
        transactionHash: txHash,
        mintedAt: new Date(),
        soldAt: new Date(),
      },
    });

    // Record in auction history
    const winnerBid = auction.bids.find(
      (b) => b.bidderAddress === auction.highestBidderAddress
    );

    await prisma.auctionHistory.create({
      data: {
        tokenId: auction.tokenId,
        nftName: auction.nftName,
        finalPriceCents: auction.currentBidCents,
        winnerAddress: auction.highestBidderAddress,
        winnerEmail: winnerBid?.bidderEmail,
        auctionDate: new Date(),
        blockchainHash: txHash,
      },
    });

    // Record royalty split (70/30)
    const totalAmount = auction.currentBidCents;
    const creatorShare = Math.floor(totalAmount * 0.7);
    const tpsShare = totalAmount - creatorShare;

    await prisma.royaltySplit.create({
      data: {
        transactionId: auctionId,
        transactionType: 'AUCTION',
        totalAmountCents: totalAmount,
        creatorShareCents: creatorShare,
        planetarySocietyShareCents: tpsShare,
      },
    });

    // Send winner notification
    if (winnerBid?.bidderEmail) {
      await emailService.sendAuctionWonNotification(
        winnerBid.bidderEmail,
        auction.nftName,
        auction.currentBidCents,
        txHash
      );
    }

    logger.info(
      `Auction finalized: ${auction.nftName} sold for $${(auction.currentBidCents / 100).toFixed(2)}`
    );

    return {
      winner: auction.highestBidderAddress,
      finalPrice: auction.currentBidCents,
      txHash,
    };
  }

  /**
   * Get auction history (past auctions)
   */
  async getAuctionHistory(limit = 20) {
    const history = await prisma.auctionHistory.findMany({
      orderBy: { auctionDate: 'desc' },
      take: limit,
    });

    return history.map((h) => ({
      ...h,
      displayPrice: `$${(h.finalPriceCents / 100).toFixed(2)}`,
      winnerDisplay: `${h.winnerAddress.slice(0, 6)}...${h.winnerAddress.slice(-4)}`,
    }));
  }
}

export const auctionService = new AuctionService();
