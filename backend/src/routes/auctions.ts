import express from 'express';
import { auctionService } from '../services/auction.service';
import { logger } from '../utils/logger';

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
 * POST /api/auctions/create (Admin only)
 * Create a new auction
 */
router.post('/create', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
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
router.post('/:auctionId/finalize', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
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
