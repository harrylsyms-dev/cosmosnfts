import { Router, Request, Response } from 'express';
import { marketplaceService } from '../services/marketplace.service';
import { requireAdmin } from '../middleware/adminAuth';
import { verifyWalletOwnership } from '../middleware/walletAuth';
import { logger } from '../utils/logger';

const router = Router();

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/marketplace/listings
 * Browse active listings
 */
router.get('/listings', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      minPrice,
      maxPrice,
      objectType,
      sortBy = 'newest',
    } = req.query;

    const result = await marketplaceService.getActiveListings({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      objectType: objectType as string | undefined,
      sortBy: sortBy as 'price_asc' | 'price_desc' | 'newest' | 'score_desc',
    });

    res.json(result);
  } catch (error) {
    logger.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

/**
 * GET /api/marketplace/listings/:id
 * Get single listing by ID
 */
router.get('/listings/:id', async (req: Request, res: Response) => {
  try {
    const listing = await marketplaceService.getListingById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ listing });
  } catch (error) {
    logger.error('Error fetching listing:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

/**
 * GET /api/marketplace/nft/:tokenId
 * Get listing by token ID
 */
router.get('/nft/:tokenId', async (req: Request, res: Response) => {
  try {
    const tokenId = parseInt(req.params.tokenId);
    const listing = await marketplaceService.getListingByTokenId(tokenId);

    res.json({ listing: listing || null });
  } catch (error) {
    logger.error('Error fetching listing by token:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

/**
 * GET /api/marketplace/floor-price
 * Get floor price statistics
 */
router.get('/floor-price', async (req: Request, res: Response) => {
  try {
    const stats = await marketplaceService.getFloorPrice();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching floor price:', error);
    res.status(500).json({ error: 'Failed to fetch floor price' });
  }
});

/**
 * GET /api/marketplace/recent-sales
 * Get recent trades
 */
router.get('/recent-sales', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const sales = await marketplaceService.getRecentSales(limit);
    res.json({ sales });
  } catch (error) {
    logger.error('Error fetching recent sales:', error);
    res.status(500).json({ error: 'Failed to fetch recent sales' });
  }
});

/**
 * GET /api/marketplace/settings
 * Get marketplace settings (public view)
 */
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await marketplaceService.getSettings();
    res.json({
      tradingEnabled: settings.tradingEnabled,
      listingsEnabled: settings.listingsEnabled,
      offersEnabled: settings.offersEnabled,
      creatorRoyaltyPercent: settings.creatorRoyaltyPercent,
    });
  } catch (error) {
    logger.error('Error fetching marketplace settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// ==================== AUTHENTICATED ROUTES ====================
// These require wallet authentication via session token or signature

/**
 * POST /api/marketplace/listings
 * Create a new listing
 */
router.post('/listings', verifyWalletOwnership, async (req: Request, res: Response) => {
  try {
    const { tokenId, sellerAddress, priceCents, expiresAt } = req.body;

    if (!tokenId || !sellerAddress || !priceCents) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Use verified wallet address from middleware
    const verifiedSeller = req.verifiedWallet!;

    const listing = await marketplaceService.createListing({
      tokenId,
      sellerAddress: verifiedSeller,
      priceCents,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(201).json({ listing });
  } catch (error: any) {
    logger.error('Error creating listing:', error);
    res.status(400).json({ error: error.message || 'Failed to create listing' });
  }
});

/**
 * DELETE /api/marketplace/listings/:id
 * Cancel a listing
 */
router.delete('/listings/:id', verifyWalletOwnership, async (req: Request, res: Response) => {
  try {
    const { sellerAddress } = req.body;

    if (!sellerAddress) {
      return res.status(400).json({ error: 'Seller address required' });
    }

    // Use verified wallet from middleware
    const verifiedSeller = req.verifiedWallet!;

    const listing = await marketplaceService.cancelListing(req.params.id, verifiedSeller);
    res.json({ listing });
  } catch (error: any) {
    logger.error('Error cancelling listing:', error);
    res.status(400).json({ error: error.message || 'Failed to cancel listing' });
  }
});

/**
 * POST /api/marketplace/buy/:listingId
 * Buy now
 */
router.post('/buy/:listingId', verifyWalletOwnership, async (req: Request, res: Response) => {
  try {
    const { buyerAddress, transactionHash } = req.body;

    if (!buyerAddress || !transactionHash) {
      return res.status(400).json({ error: 'Buyer address and transaction hash required' });
    }

    // Use verified wallet from middleware
    const verifiedBuyer = req.verifiedWallet!;

    // TODO: Also verify transaction on blockchain matches the buyer

    const result = await marketplaceService.buyNow(
      req.params.listingId,
      verifiedBuyer,
      transactionHash
    );

    res.json(result);
  } catch (error: any) {
    logger.error('Error processing purchase:', error);
    res.status(400).json({ error: error.message || 'Failed to process purchase' });
  }
});

/**
 * POST /api/marketplace/offers
 * Make an offer
 */
router.post('/offers', verifyWalletOwnership, async (req: Request, res: Response) => {
  try {
    const { tokenId, offererAddress, offererEmail, offerAmountCents, expiryDays } = req.body;

    if (!tokenId || !offererAddress || !offerAmountCents) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Use verified wallet from middleware
    const verifiedOfferer = req.verifiedWallet!;

    const offer = await marketplaceService.makeOffer({
      tokenId,
      offererAddress: verifiedOfferer,
      offererEmail,
      offerAmountCents,
      expiryDays,
    });

    res.status(201).json({ offer });
  } catch (error: any) {
    logger.error('Error creating offer:', error);
    res.status(400).json({ error: error.message || 'Failed to create offer' });
  }
});

/**
 * POST /api/marketplace/offers/:id/accept
 * Accept an offer
 */
router.post('/offers/:id/accept', verifyWalletOwnership, async (req: Request, res: Response) => {
  try {
    const { sellerAddress, transactionHash } = req.body;

    if (!sellerAddress || !transactionHash) {
      return res.status(400).json({ error: 'Seller address and transaction hash required' });
    }

    // Use verified wallet from middleware
    const verifiedSeller = req.verifiedWallet!;

    // TODO: Also verify transaction on blockchain matches the seller

    const result = await marketplaceService.acceptOffer(
      req.params.id,
      verifiedSeller,
      transactionHash
    );

    res.json(result);
  } catch (error: any) {
    logger.error('Error accepting offer:', error);
    res.status(400).json({ error: error.message || 'Failed to accept offer' });
  }
});

/**
 * POST /api/marketplace/offers/:id/counter
 * Counter an offer
 */
router.post('/offers/:id/counter', verifyWalletOwnership, async (req: Request, res: Response) => {
  try {
    const { sellerAddress, counterAmountCents } = req.body;

    if (!sellerAddress || !counterAmountCents) {
      return res.status(400).json({ error: 'Seller address and counter amount required' });
    }

    // Use verified wallet from middleware
    const verifiedSeller = req.verifiedWallet!;

    const offer = await marketplaceService.counterOffer(
      req.params.id,
      verifiedSeller,
      counterAmountCents
    );

    res.json({ offer });
  } catch (error: any) {
    logger.error('Error countering offer:', error);
    res.status(400).json({ error: error.message || 'Failed to counter offer' });
  }
});

/**
 * POST /api/marketplace/offers/:id/reject
 * Reject an offer
 */
router.post('/offers/:id/reject', verifyWalletOwnership, async (req: Request, res: Response) => {
  try {
    const { sellerAddress } = req.body;

    if (!sellerAddress) {
      return res.status(400).json({ error: 'Seller address required' });
    }

    // Use verified wallet from middleware
    const verifiedSeller = req.verifiedWallet!;

    const offer = await marketplaceService.rejectOffer(req.params.id, verifiedSeller);
    res.json({ offer });
  } catch (error: any) {
    logger.error('Error rejecting offer:', error);
    res.status(400).json({ error: error.message || 'Failed to reject offer' });
  }
});

/**
 * GET /api/marketplace/my-offers
 * Get user's sent offers
 */
router.get('/my-offers', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const offers = await marketplaceService.getMyOffers(walletAddress as string);
    res.json({ offers });
  } catch (error) {
    logger.error('Error fetching user offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

/**
 * GET /api/marketplace/offers-received
 * Get offers received on user's NFTs
 */
router.get('/offers-received', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const offers = await marketplaceService.getOffersReceived(walletAddress as string);
    res.json({ offers });
  } catch (error) {
    logger.error('Error fetching received offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

/**
 * GET /api/marketplace/my-listings
 * Get user's listings
 */
router.get('/my-listings', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const listings = await marketplaceService.getMyListings(walletAddress as string);
    res.json({ listings });
  } catch (error) {
    logger.error('Error fetching user listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/marketplace/admin/settings
 * Get full marketplace settings (admin only)
 */
router.get('/admin/settings', requireAdmin, async (req: Request, res: Response) => {
  try {
    const settings = await marketplaceService.getSettings();
    res.json({ settings });
  } catch (error) {
    logger.error('Error fetching admin settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/marketplace/admin/settings
 * Update marketplace settings (admin only)
 */
router.put('/admin/settings', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      tradingEnabled,
      listingsEnabled,
      offersEnabled,
      creatorRoyaltyPercent,
      platformFeePercent,
    } = req.body;

    const settings = await marketplaceService.updateSettings({
      tradingEnabled,
      listingsEnabled,
      offersEnabled,
      creatorRoyaltyPercent,
      platformFeePercent,
    });

    res.json({ settings });
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
