import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// 20% royalty to creator, 80% to seller
const CREATOR_ROYALTY_PERCENT = 20;
const SELLER_PERCENT = 80;

export interface RoyaltySplit {
  totalCents: number;
  creatorRoyaltyCents: number;
  sellerProceedsCents: number;
}

export interface ListingInput {
  tokenId: number;
  sellerAddress: string;
  priceCents: number;
  expiresAt?: Date;
}

export interface OfferInput {
  tokenId: number;
  offererAddress: string;
  offererEmail?: string;
  offerAmountCents: number;
  expiryDays?: number;
}

class MarketplaceService {
  /**
   * Check if marketplace trading is enabled
   */
  async isMarketplaceEnabled(): Promise<boolean> {
    const settings = await prisma.marketplaceSettings.findUnique({
      where: { id: 'main' },
    });
    return settings?.tradingEnabled ?? false;
  }

  /**
   * Get marketplace settings
   */
  async getSettings() {
    let settings = await prisma.marketplaceSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      settings = await prisma.marketplaceSettings.create({
        data: {
          id: 'main',
          tradingEnabled: false,
          listingsEnabled: false,
          offersEnabled: false,
          creatorRoyaltyPercent: CREATOR_ROYALTY_PERCENT,
          platformFeePercent: 0,
        },
      });
    }

    return settings;
  }

  /**
   * Update marketplace settings (admin only)
   */
  async updateSettings(updates: {
    tradingEnabled?: boolean;
    listingsEnabled?: boolean;
    offersEnabled?: boolean;
    auctionsEnabled?: boolean;
    creatorRoyaltyPercent?: number;
    platformFeePercent?: number;
  }) {
    const settings = await prisma.marketplaceSettings.upsert({
      where: { id: 'main' },
      update: updates,
      create: {
        id: 'main',
        ...updates,
      },
    });

    logger.info('Marketplace settings updated:', updates);
    return settings;
  }

  /**
   * Calculate royalty split for a sale
   */
  calculateRoyaltySplit(priceCents: number): RoyaltySplit {
    const creatorRoyaltyCents = Math.floor((priceCents * CREATOR_ROYALTY_PERCENT) / 100);
    const sellerProceedsCents = priceCents - creatorRoyaltyCents;

    return {
      totalCents: priceCents,
      creatorRoyaltyCents,
      sellerProceedsCents,
    };
  }

  /**
   * Check if an address is banned
   */
  async isAddressBanned(walletAddress: string): Promise<boolean> {
    const banned = await prisma.bannedAddress.findUnique({
      where: { walletAddress },
    });
    return !!banned;
  }

  /**
   * Create a marketplace listing
   */
  async createListing(input: ListingInput) {
    const settings = await this.getSettings();
    if (!settings.listingsEnabled) {
      throw new Error('Listings are currently disabled');
    }

    // Check if seller is banned
    if (await this.isAddressBanned(input.sellerAddress)) {
      throw new Error('This wallet address is banned from the marketplace');
    }

    // Check if NFT exists and is owned by the seller
    const nft = await prisma.nFT.findUnique({
      where: { tokenId: input.tokenId },
    });

    if (!nft) {
      throw new Error('NFT not found');
    }

    if (nft.ownerAddress?.toLowerCase() !== input.sellerAddress.toLowerCase()) {
      throw new Error('You do not own this NFT');
    }

    // Check for existing active listing
    const existingListing = await prisma.listing.findUnique({
      where: { tokenId: input.tokenId },
    });

    if (existingListing && existingListing.status === 'ACTIVE') {
      throw new Error('This NFT already has an active listing');
    }

    // Create listing
    const listing = await prisma.listing.upsert({
      where: { tokenId: input.tokenId },
      update: {
        sellerAddress: input.sellerAddress,
        priceCents: input.priceCents,
        status: 'ACTIVE',
        expiresAt: input.expiresAt || null,
        createdAt: new Date(),
      },
      create: {
        tokenId: input.tokenId,
        sellerAddress: input.sellerAddress,
        priceCents: input.priceCents,
        status: 'ACTIVE',
        expiresAt: input.expiresAt || null,
      },
    });

    logger.info(`Listing created: tokenId=${input.tokenId}, price=$${(input.priceCents / 100).toFixed(2)}`);
    return listing;
  }

  /**
   * Cancel a listing
   */
  async cancelListing(listingId: string, sellerAddress: string) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.sellerAddress.toLowerCase() !== sellerAddress.toLowerCase()) {
      throw new Error('You can only cancel your own listings');
    }

    if (listing.status !== 'ACTIVE') {
      throw new Error('This listing is not active');
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'CANCELLED' },
    });

    logger.info(`Listing cancelled: ${listingId}`);
    return updated;
  }

  /**
   * Get active listings with filtering and pagination
   */
  async getActiveListings(options: {
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    objectType?: string;
    sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'score_desc';
  } = {}) {
    const {
      page = 1,
      limit = 20,
      minPrice,
      maxPrice,
      objectType,
      sortBy = 'newest',
    } = options;

    const where: any = {
      status: 'ACTIVE',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (minPrice) where.priceCents = { ...where.priceCents, gte: minPrice * 100 };
    if (maxPrice) where.priceCents = { ...where.priceCents, lte: maxPrice * 100 };

    const orderBy: any = {};
    switch (sortBy) {
      case 'price_asc':
        orderBy.priceCents = 'asc';
        break;
      case 'price_desc':
        orderBy.priceCents = 'desc';
        break;
      case 'newest':
        orderBy.createdAt = 'desc';
        break;
      case 'score_desc':
        // Will need to join with NFT
        orderBy.createdAt = 'desc';
        break;
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          nft: true,
        },
      }),
      prisma.listing.count({ where }),
    ]);

    // Filter by objectType if specified (after fetch since it's on related model)
    let filtered = listings;
    if (objectType) {
      filtered = listings.filter((l) => l.nft.objectType === objectType);
    }

    return {
      listings: filtered,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get floor price statistics
   */
  async getFloorPrice() {
    const lowestListing = await prisma.listing.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { priceCents: 'asc' },
      include: { nft: true },
    });

    const activeListingsCount = await prisma.listing.count({
      where: {
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    const avgPrice = await prisma.listing.aggregate({
      where: {
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      _avg: { priceCents: true },
    });

    return {
      floorPriceCents: lowestListing?.priceCents || 0,
      floorPrice: lowestListing ? (lowestListing.priceCents / 100).toFixed(2) : '0.00',
      lowestListing,
      activeListingsCount,
      averagePriceCents: Math.round(avgPrice._avg.priceCents || 0),
      averagePrice: ((avgPrice._avg.priceCents || 0) / 100).toFixed(2),
    };
  }

  /**
   * Buy an NFT from a listing
   */
  async buyNow(listingId: string, buyerAddress: string, transactionHash: string) {
    const settings = await this.getSettings();
    if (!settings.tradingEnabled) {
      throw new Error('Trading is currently disabled');
    }

    // Check if buyer is banned
    if (await this.isAddressBanned(buyerAddress)) {
      throw new Error('This wallet address is banned from the marketplace');
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { nft: true },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.status !== 'ACTIVE') {
      throw new Error('This listing is no longer active');
    }

    if (listing.expiresAt && listing.expiresAt < new Date()) {
      throw new Error('This listing has expired');
    }

    if (listing.sellerAddress.toLowerCase() === buyerAddress.toLowerCase()) {
      throw new Error('You cannot buy your own listing');
    }

    const royaltySplit = this.calculateRoyaltySplit(listing.priceCents);

    // Update listing status
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'SOLD' },
    });

    // Update NFT ownership
    await prisma.nFT.update({
      where: { tokenId: listing.tokenId },
      data: {
        ownerAddress: buyerAddress,
        transactionHash,
      },
    });

    // Create trade record
    const trade = await prisma.trade.create({
      data: {
        tokenId: listing.tokenId,
        tradeType: 'LISTING_SALE',
        sellerAddress: listing.sellerAddress,
        buyerAddress,
        priceCents: listing.priceCents,
        creatorRoyaltyCents: royaltySplit.creatorRoyaltyCents,
        sellerProceedsCents: royaltySplit.sellerProceedsCents,
        transactionHash,
      },
    });

    logger.info(`NFT sold: tokenId=${listing.tokenId}, buyer=${buyerAddress}, price=$${(listing.priceCents / 100).toFixed(2)}`);

    return { listing, trade, royaltySplit };
  }

  /**
   * Make an offer on an NFT
   */
  async makeOffer(input: OfferInput) {
    const settings = await this.getSettings();
    if (!settings.offersEnabled) {
      throw new Error('Offers are currently disabled');
    }

    // Check if offerer is banned
    if (await this.isAddressBanned(input.offererAddress)) {
      throw new Error('This wallet address is banned from the marketplace');
    }

    // Check if NFT exists
    const nft = await prisma.nFT.findUnique({
      where: { tokenId: input.tokenId },
    });

    if (!nft) {
      throw new Error('NFT not found');
    }

    // Calculate expiry (default 7 days)
    const expiryDays = input.expiryDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Get listing if exists
    const listing = await prisma.listing.findUnique({
      where: { tokenId: input.tokenId },
    });

    const offer = await prisma.offer.create({
      data: {
        listingId: listing?.status === 'ACTIVE' ? listing.id : null,
        tokenId: input.tokenId,
        offererAddress: input.offererAddress,
        offererEmail: input.offererEmail,
        offerAmountCents: input.offerAmountCents,
        status: 'PENDING',
        expiresAt,
      },
    });

    logger.info(`Offer created: tokenId=${input.tokenId}, amount=$${(input.offerAmountCents / 100).toFixed(2)}`);
    return offer;
  }

  /**
   * Accept an offer
   */
  async acceptOffer(offerId: string, sellerAddress: string, transactionHash: string) {
    const settings = await this.getSettings();
    if (!settings.tradingEnabled) {
      throw new Error('Trading is currently disabled');
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new Error('Offer not found');
    }

    if (offer.status !== 'PENDING') {
      throw new Error('This offer is no longer pending');
    }

    if (offer.expiresAt < new Date()) {
      throw new Error('This offer has expired');
    }

    // Check NFT ownership
    const nft = await prisma.nFT.findUnique({
      where: { tokenId: offer.tokenId },
    });

    if (!nft) {
      throw new Error('NFT not found');
    }

    if (nft.ownerAddress?.toLowerCase() !== sellerAddress.toLowerCase()) {
      throw new Error('You do not own this NFT');
    }

    const royaltySplit = this.calculateRoyaltySplit(offer.offerAmountCents);

    // Update offer status
    await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'ACCEPTED' },
    });

    // Cancel any active listing for this NFT
    await prisma.listing.updateMany({
      where: { tokenId: offer.tokenId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    // Update NFT ownership
    await prisma.nFT.update({
      where: { tokenId: offer.tokenId },
      data: {
        ownerAddress: offer.offererAddress,
        transactionHash,
      },
    });

    // Create trade record
    const trade = await prisma.trade.create({
      data: {
        tokenId: offer.tokenId,
        tradeType: 'OFFER_ACCEPTED',
        sellerAddress,
        buyerAddress: offer.offererAddress,
        priceCents: offer.offerAmountCents,
        creatorRoyaltyCents: royaltySplit.creatorRoyaltyCents,
        sellerProceedsCents: royaltySplit.sellerProceedsCents,
        transactionHash,
      },
    });

    // Reject all other pending offers for this NFT
    await prisma.offer.updateMany({
      where: {
        tokenId: offer.tokenId,
        status: 'PENDING',
        id: { not: offerId },
      },
      data: { status: 'REJECTED' },
    });

    logger.info(`Offer accepted: offerId=${offerId}, tokenId=${offer.tokenId}`);
    return { offer, trade, royaltySplit };
  }

  /**
   * Counter an offer
   */
  async counterOffer(offerId: string, sellerAddress: string, counterAmountCents: number) {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new Error('Offer not found');
    }

    if (offer.status !== 'PENDING') {
      throw new Error('This offer is no longer pending');
    }

    // Check NFT ownership
    const nft = await prisma.nFT.findUnique({
      where: { tokenId: offer.tokenId },
    });

    if (!nft) {
      throw new Error('NFT not found');
    }

    if (nft.ownerAddress?.toLowerCase() !== sellerAddress.toLowerCase()) {
      throw new Error('You do not own this NFT');
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: 'COUNTERED',
        counterOfferCents: counterAmountCents,
      },
    });

    logger.info(`Counter offer: offerId=${offerId}, counter=$${(counterAmountCents / 100).toFixed(2)}`);
    return updated;
  }

  /**
   * Reject an offer
   */
  async rejectOffer(offerId: string, sellerAddress: string) {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new Error('Offer not found');
    }

    if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
      throw new Error('This offer cannot be rejected');
    }

    // Check NFT ownership
    const nft = await prisma.nFT.findUnique({
      where: { tokenId: offer.tokenId },
    });

    if (!nft) {
      throw new Error('NFT not found');
    }

    if (nft.ownerAddress?.toLowerCase() !== sellerAddress.toLowerCase()) {
      throw new Error('You do not own this NFT');
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'REJECTED' },
    });

    logger.info(`Offer rejected: offerId=${offerId}`);
    return updated;
  }

  /**
   * Get offers made by a user
   */
  async getMyOffers(walletAddress: string) {
    return prisma.offer.findMany({
      where: { offererAddress: walletAddress },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get offers received on NFTs owned by a user
   */
  async getOffersReceived(walletAddress: string) {
    // Get all NFTs owned by this wallet
    const ownedNFTs = await prisma.nFT.findMany({
      where: { ownerAddress: walletAddress },
      select: { tokenId: true },
    });

    const tokenIds = ownedNFTs.map((n) => n.tokenId);

    return prisma.offer.findMany({
      where: {
        tokenId: { in: tokenIds },
        status: { in: ['PENDING', 'COUNTERED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get recent trades/sales
   */
  async getRecentSales(limit: number = 20) {
    return prisma.trade.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get user's listings
   */
  async getMyListings(walletAddress: string) {
    return prisma.listing.findMany({
      where: { sellerAddress: walletAddress },
      orderBy: { createdAt: 'desc' },
      include: { nft: true },
    });
  }

  /**
   * Get listing by ID
   */
  async getListingById(listingId: string) {
    return prisma.listing.findUnique({
      where: { id: listingId },
      include: { nft: true, offers: true },
    });
  }

  /**
   * Get listing by token ID
   */
  async getListingByTokenId(tokenId: number) {
    return prisma.listing.findUnique({
      where: { tokenId },
      include: { nft: true, offers: true },
    });
  }
}

export const marketplaceService = new MarketplaceService();
