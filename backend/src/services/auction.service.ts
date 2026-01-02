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

  /**
   * Auto-populate auctions for a phase
   * Runs every other phase (1, 3, 5, 7, etc.)
   * Selects top-scoring NFTs from that phase
   */
  async autoPopulateAuctions(phase: number, count: number = 5): Promise<number> {
    // Only run on odd phases (1, 3, 5, 7, etc.)
    if (phase % 2 === 0) {
      logger.info(`Phase ${phase} is even - skipping auction auto-population`);
      return 0;
    }

    // Calculate ID range for this phase
    let minId: number, maxId: number;
    if (phase === 1) {
      minId = 1;
      maxId = 1000;
    } else {
      minId = 1001 + (phase - 2) * 250;
      maxId = minId + 249;
    }

    // Get top-scoring available NFTs from this phase
    const topNFTs = await prisma.nFT.findMany({
      where: {
        id: { gte: minId, lte: maxId },
        status: 'AVAILABLE',
      },
      orderBy: { totalScore: 'desc' },
      take: count,
    });

    if (topNFTs.length === 0) {
      logger.info(`No available NFTs found for phase ${phase} auctions`);
      return 0;
    }

    let createdCount = 0;

    for (const nft of topNFTs) {
      try {
        // Calculate starting bid based on score (higher score = higher starting bid)
        // Base: $500 for average score (~350), scales with score
        const scoreMultiplier = nft.totalScore / 350;
        const startingBidCents = Math.round(50000 * scoreMultiplier); // Base $500

        await this.createAuction({
          tokenId: nft.tokenId,
          nftName: nft.name,
          startingBidCents,
          durationDays: 7, // 7-day auctions
        });

        createdCount++;
        logger.info(`Auto-created auction for ${nft.name} (Token #${nft.tokenId})`);
      } catch (error) {
        logger.error(`Failed to auto-create auction for ${nft.name}:`, error);
      }
    }

    logger.info(`Auto-populated ${createdCount} auctions for phase ${phase}`);
    return createdCount;
  }

  /**
   * Get NFTs reserved for upcoming auctions
   * Returns high-scoring NFTs that will be auctioned in future phases
   */
  async getReservedForAuction(phase: number, count: number = 5) {
    // Calculate ID range for the phase
    let minId: number, maxId: number;
    if (phase === 1) {
      minId = 1;
      maxId = 1000;
    } else {
      minId = 1001 + (phase - 2) * 250;
      maxId = minId + 249;
    }

    // Get top-scoring available NFTs (these will be auctioned)
    const topNFTs = await prisma.nFT.findMany({
      where: {
        id: { gte: minId, lte: maxId },
        status: 'AVAILABLE',
      },
      orderBy: { totalScore: 'desc' },
      take: count,
      select: {
        id: true,
        tokenId: true,
        name: true,
        totalScore: true,
        badgeTier: true,
      },
    });

    return topNFTs;
  }

  /**
   * Get upcoming auction schedule
   * Shows which phases will have auctions
   */
  async getUpcomingAuctionSchedule() {
    // Get current phase
    const activeTier = await prisma.tier.findFirst({
      where: { active: true },
      orderBy: { phase: 'asc' },
    });

    const currentPhase = activeTier?.phase || 1;

    // Next 5 auction phases (odd numbers)
    const upcomingPhases: number[] = [];
    let phase = currentPhase;
    while (upcomingPhases.length < 5) {
      if (phase % 2 === 1) {
        upcomingPhases.push(phase);
      }
      phase++;
    }

    // Get reserved NFTs for each upcoming phase
    const schedule = await Promise.all(
      upcomingPhases.map(async (p) => {
        const reserved = await this.getReservedForAuction(p, 5);
        return {
          phase: p,
          nftCount: reserved.length,
          topNFTs: reserved.slice(0, 3).map((n) => n.name),
        };
      })
    );

    return schedule;
  }

  /**
   * Get auction stats for admin dashboard
   */
  async getAuctionStats() {
    const [active, ended, finalized, totalBids, totalRevenue] = await Promise.all([
      prisma.auction.count({ where: { status: 'ACTIVE' } }),
      prisma.auction.count({ where: { status: 'ENDED' } }),
      prisma.auction.count({ where: { status: 'FINALIZED' } }),
      prisma.auctionBid.count(),
      prisma.auctionHistory.aggregate({
        _sum: { finalPriceCents: true },
      }),
    ]);

    return {
      active,
      ended,
      finalized,
      total: active + ended + finalized,
      totalBids,
      totalRevenue: (totalRevenue._sum.finalPriceCents || 0) / 100,
    };
  }
}

export const auctionService = new AuctionService();
