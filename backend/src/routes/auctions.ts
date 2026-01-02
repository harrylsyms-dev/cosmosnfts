import express from 'express';
import { auctionService } from '../services/auction.service';
import { requireAdmin } from '../middleware/adminAuth';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { AUCTION_SCHEDULE, getCurrentWeek } from '../jobs/auctionDeploy.job';

const router = express.Router();

/**
 * GET /api/auctions/active
 * Get all active auctions
 */
router.get('/active', async (req, res) => {
  try {
    const auctions = await auctionService.getActiveAuctions();

    res.json({
      success: true,
      auctions: auctions.map((auction) => ({
        id: auction.id,
        tokenId: auction.tokenId,
        nftName: auction.nftName,
        image: auction.nft?.imageIpfsHash
          ? `https://gateway.pinata.cloud/ipfs/${auction.nft.imageIpfsHash}`
          : null,
        startingBid: auction.startingBidCents,
        currentBid: auction.currentBidCents,
        displayCurrentBid: `$${(auction.currentBidCents / 100).toFixed(2)}`,
        highestBidder: auction.highestBidderAddress
          ? `${auction.highestBidderAddress.slice(0, 6)}...${auction.highestBidderAddress.slice(-4)}`
          : null,
        bidCount: auction.bidCount,
        startTime: auction.startTime,
        endTime: auction.endTime,
        timeRemaining: auction.timeRemaining,
        status: auction.status,
      })),
    });
  } catch (error) {
    logger.error('Error fetching active auctions:', error);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
});

/**
 * GET /api/auctions/history
 * Get past auction history
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await auctionService.getAuctionHistory(limit);

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    logger.error('Error fetching auction history:', error);
    res.status(500).json({ error: 'Failed to fetch auction history' });
  }
});

/**
 * GET /api/auctions/:auctionId
 * Get single auction details
 */
router.get('/:auctionId', async (req, res) => {
  try {
    const { auctionId } = req.params;
    const auction = await auctionService.getAuction(auctionId);

    res.json({
      success: true,
      auction: {
        id: auction.id,
        tokenId: auction.tokenId,
        nftName: auction.nftName,
        nft: auction.nft
          ? {
              name: auction.nft.name,
              description: auction.nft.description,
              image: auction.nft.imageIpfsHash
                ? `https://gateway.pinata.cloud/ipfs/${auction.nft.imageIpfsHash}`
                : null,
              totalScore: auction.nft.totalScore,
              badgeTier: auction.nft.badgeTier,
              scores: {
                fame: auction.nft.fameScore,
                significance: auction.nft.significanceScore,
                rarity: auction.nft.rarityScore,
                discoveryRecency: auction.nft.discoveryRecencyScore,
                culturalImpact: auction.nft.culturalImpactScore,
              },
            }
          : null,
        startingBid: auction.startingBidCents,
        currentBid: auction.currentBidCents,
        displayCurrentBid: `$${(auction.currentBidCents / 100).toFixed(2)}`,
        minimumNextBid: Math.ceil(
          auction.currentBidCents + Math.max(auction.currentBidCents * 0.05, 2500)
        ),
        displayMinimumNextBid: `$${(
          (auction.currentBidCents + Math.max(auction.currentBidCents * 0.05, 2500)) /
          100
        ).toFixed(2)}`,
        highestBidder: auction.highestBidderAddress,
        bidCount: auction.bidCount,
        bids: auction.bids.slice(0, 10).map((bid) => ({
          bidder: `${bid.bidderAddress.slice(0, 6)}...${bid.bidderAddress.slice(-4)}`,
          amount: bid.bidAmountCents,
          displayAmount: `$${(bid.bidAmountCents / 100).toFixed(2)}`,
          timestamp: bid.timestamp,
        })),
        startTime: auction.startTime,
        endTime: auction.endTime,
        timeRemaining: auction.timeRemaining,
        isEnded: auction.isEnded,
        status: auction.status,
      },
    });
  } catch (error) {
    logger.error('Error fetching auction:', error);
    res.status(500).json({ error: 'Failed to fetch auction' });
  }
});

/**
 * GET /api/auctions/:auctionId/bids
 * Get bid history for an auction
 */
router.get('/:auctionId/bids', async (req, res) => {
  try {
    const { auctionId } = req.params;
    const bids = await auctionService.getBidHistory(auctionId);

    res.json({
      success: true,
      bids,
    });
  } catch (error) {
    logger.error('Error fetching bid history:', error);
    res.status(500).json({ error: 'Failed to fetch bid history' });
  }
});

/**
 * POST /api/auctions/:auctionId/bid
 * Place a bid on an auction
 */
router.post('/:auctionId/bid', async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { bidderAddress, bidderEmail, bidAmountCents, paymentIntentId } = req.body;

    if (!bidderAddress) {
      return res.status(400).json({ error: 'Bidder address is required' });
    }

    if (!bidAmountCents || bidAmountCents <= 0) {
      return res.status(400).json({ error: 'Valid bid amount is required' });
    }

    const bid = await auctionService.placeBid({
      auctionId,
      bidderAddress,
      bidderEmail,
      bidAmountCents,
      paymentIntentId,
    });

    res.json({
      success: true,
      bid: {
        id: bid.id,
        amount: bid.bidAmountCents,
        displayAmount: `$${(bid.bidAmountCents / 100).toFixed(2)}`,
        timestamp: bid.timestamp,
      },
      message: 'Bid placed successfully',
    });
  } catch (error: any) {
    logger.error('Error placing bid:', error);
    res.status(400).json({ error: error.message || 'Failed to place bid' });
  }
});

/**
 * GET /api/auctions/admin/scheduled (Admin only)
 * Get all 20 scheduled auctions with NFT details
 */
router.get('/admin/scheduled', requireAdmin, async (req, res) => {
  try {
    const currentWeek = await getCurrentWeek();

    // Get all NFTs that are AUCTION_RESERVED
    const reservedNFTs = await prisma.nFT.findMany({
      where: { status: 'AUCTION_RESERVED' },
      select: {
        id: true,
        tokenId: true,
        name: true,
        cosmicScore: true,
        objectType: true,
        imageIpfsHash: true,
        description: true,
        fameVisibility: true,
        scientificSignificance: true,
        rarity: true,
        discoveryRecency: true,
        culturalImpact: true,
      },
    });

    // Get existing auctions to check status
    const existingAuctions = await prisma.auction.findMany({
      select: {
        nftName: true,
        status: true,
        id: true,
        startTime: true,
        endTime: true,
        currentBidCents: true,
      },
    });

    // Get price overrides
    const priceOverrides = await prisma.auctionScheduleOverride.findMany();
    const overrideMap = new Map(priceOverrides.map((o) => [o.name.toLowerCase(), o.startingBidCents]));

    // Map auction schedule with NFT details
    const schedule = AUCTION_SCHEDULE.map((item) => {
      // Find matching NFT (case insensitive search)
      const nft = reservedNFTs.find(
        (n) =>
          n.name.toLowerCase() === item.name.toLowerCase() ||
          n.name.toLowerCase().includes(item.name.toLowerCase())
      );

      // Check if auction already exists
      const existingAuction = existingAuctions.find(
        (a) =>
          a.nftName.toLowerCase() === item.name.toLowerCase() ||
          a.nftName.toLowerCase().includes(item.name.toLowerCase())
      );

      // Use override price if available, otherwise use default
      const effectivePrice = overrideMap.get(item.name.toLowerCase()) ?? item.startingBidCents;

      return {
        name: item.name,
        week: item.week,
        startingBidCents: effectivePrice,
        startingBidDisplay: `$${(effectivePrice / 100).toLocaleString()}`,
        weeksUntil: Math.max(0, item.week - currentWeek),
        status: existingAuction
          ? existingAuction.status
          : item.week <= currentWeek
          ? 'READY'
          : 'SCHEDULED',
        existingAuctionId: existingAuction?.id || null,
        nft: nft
          ? {
              id: nft.id,
              tokenId: nft.tokenId,
              name: nft.name,
              cosmicScore: nft.cosmicScore,
              objectType: nft.objectType,
              image: nft.imageIpfsHash
                ? `https://gateway.pinata.cloud/ipfs/${nft.imageIpfsHash}`
                : null,
              description: nft.description,
              scores: {
                fame: nft.fameVisibility,
                significance: nft.scientificSignificance,
                rarity: nft.rarity,
                discoveryRecency: nft.discoveryRecency,
                culturalImpact: nft.culturalImpact,
              },
            }
          : null,
      };
    });

    res.json({
      success: true,
      currentWeek,
      totalScheduled: AUCTION_SCHEDULE.length,
      schedule,
    });
  } catch (error) {
    logger.error('Error fetching scheduled auctions:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled auctions' });
  }
});

/**
 * PUT /api/auctions/admin/scheduled/price (Admin only)
 * Update the starting bid for a scheduled auction
 */
router.put('/admin/scheduled/price', requireAdmin, async (req, res) => {
  try {
    const { name, startingBidCents } = req.body;

    if (!name || typeof startingBidCents !== 'number') {
      return res.status(400).json({ error: 'Name and startingBidCents are required' });
    }

    if (startingBidCents < 100) {
      return res.status(400).json({ error: 'Starting bid must be at least $1.00' });
    }

    // Check if the name is in our schedule
    const scheduledItem = AUCTION_SCHEDULE.find(
      (a) => a.name.toLowerCase() === name.toLowerCase()
    );

    if (!scheduledItem) {
      return res.status(404).json({ error: 'Auction not found in schedule' });
    }

    // Upsert the override
    const override = await prisma.auctionScheduleOverride.upsert({
      where: { name: name },
      update: { startingBidCents },
      create: { name, startingBidCents },
    });

    logger.info(`Updated auction starting bid: ${name} -> $${(startingBidCents / 100).toFixed(2)}`);

    res.json({
      success: true,
      override: {
        name: override.name,
        startingBidCents: override.startingBidCents,
        startingBidDisplay: `$${(override.startingBidCents / 100).toLocaleString()}`,
      },
    });
  } catch (error) {
    logger.error('Error updating auction price:', error);
    res.status(500).json({ error: 'Failed to update auction price' });
  }
});

/**
 * GET /api/auctions/schedule
 * Get upcoming auction schedule (public)
 */
router.get('/schedule', async (req, res) => {
  try {
    const schedule = await auctionService.getUpcomingAuctionSchedule();

    res.json({
      success: true,
      schedule,
    });
  } catch (error) {
    logger.error('Error fetching auction schedule:', error);
    res.status(500).json({ error: 'Failed to fetch auction schedule' });
  }
});

/**
 * GET /api/auctions/admin/stats (Admin only)
 * Get auction statistics for admin dashboard
 */
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await auctionService.getAuctionStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Error fetching auction stats:', error);
    res.status(500).json({ error: 'Failed to fetch auction stats' });
  }
});

/**
 * GET /api/auctions/admin/reserved/:phase (Admin only)
 * Get NFTs reserved for auction in a specific phase
 */
router.get('/admin/reserved/:phase', requireAdmin, async (req, res) => {
  try {
    const phase = parseInt(req.params.phase);
    const count = parseInt(req.query.count as string) || 5;

    if (isNaN(phase) || phase < 1) {
      return res.status(400).json({ error: 'Invalid phase number' });
    }

    const reserved = await auctionService.getReservedForAuction(phase, count);

    res.json({
      success: true,
      phase,
      reserved,
      isAuctionPhase: phase % 2 === 1,
    });
  } catch (error) {
    logger.error('Error fetching reserved NFTs:', error);
    res.status(500).json({ error: 'Failed to fetch reserved NFTs' });
  }
});

/**
 * POST /api/auctions/admin/auto-populate (Admin only)
 * Trigger auction auto-population for a phase
 */
router.post('/admin/auto-populate', requireAdmin, async (req, res) => {
  try {
    const { phase, count = 5 } = req.body;

    if (!phase || isNaN(parseInt(phase))) {
      return res.status(400).json({ error: 'Phase number is required' });
    }

    const phaseNum = parseInt(phase);

    if (phaseNum % 2 === 0) {
      return res.status(400).json({
        error: 'Auctions only run on odd-numbered phases (1, 3, 5, etc.)',
        phase: phaseNum,
      });
    }

    const createdCount = await auctionService.autoPopulateAuctions(phaseNum, count);

    res.json({
      success: true,
      phase: phaseNum,
      auctionsCreated: createdCount,
      message: `Created ${createdCount} auctions for Phase ${phaseNum}`,
    });
  } catch (error: any) {
    logger.error('Error auto-populating auctions:', error);
    res.status(500).json({ error: error.message || 'Failed to auto-populate auctions' });
  }
});

/**
 * POST /api/auctions/create (Admin only)
 * Create a new auction
 */
router.post('/create', requireAdmin, async (req, res) => {
  try {
    const { tokenId, nftName, startingBidCents, durationDays } = req.body;

    if (!tokenId || !nftName || !startingBidCents || !durationDays) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const auction = await auctionService.createAuction({
      tokenId,
      nftName,
      startingBidCents,
      durationDays,
    });

    res.json({
      success: true,
      auction: {
        id: auction.id,
        tokenId: auction.tokenId,
        nftName: auction.nftName,
        startingBid: auction.startingBidCents,
        endTime: auction.endTime,
      },
      message: 'Auction created successfully',
    });
  } catch (error: any) {
    logger.error('Error creating auction:', error);
    res.status(400).json({ error: error.message || 'Failed to create auction' });
  }
});

/**
 * POST /api/auctions/:auctionId/finalize (Admin only)
 * Manually finalize an ended auction
 */
router.post('/:auctionId/finalize', requireAdmin, async (req, res) => {
  try {
    const { auctionId } = req.params;

    const result = await auctionService.finalizeAuction(auctionId);

    if (!result) {
      return res.json({
        success: true,
        message: 'Auction ended with no bids',
      });
    }

    res.json({
      success: true,
      result: {
        winner: result.winner,
        finalPrice: result.finalPrice,
        displayFinalPrice: `$${(result.finalPrice / 100).toFixed(2)}`,
        txHash: result.txHash,
      },
      message: 'Auction finalized successfully',
    });
  } catch (error: any) {
    logger.error('Error finalizing auction:', error);
    res.status(400).json({ error: error.message || 'Failed to finalize auction' });
  }
});

export default router;
