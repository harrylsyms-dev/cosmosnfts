import { prisma } from '../config/database';
import { logger } from '../utils/logger';

class AnalyticsService {
  /**
   * Get sales overview metrics
   */
  async getSalesOverview(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const purchases = await prisma.purchase.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
    });

    const totalRevenue = purchases.reduce((sum, p) => sum + p.totalAmountCents, 0) / 100;
    const totalSales = purchases.length;

    // Count total NFTs sold (parse nftIds from each purchase)
    let totalNFTsSold = 0;
    for (const p of purchases) {
      try {
        const nftIds = JSON.parse(p.nftIds || '[]');
        totalNFTsSold += nftIds.length;
      } catch {
        totalNFTsSold += 1;
      }
    }

    // Revenue by day
    const revenueByDay: { date: string; revenue: number; sales: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayPurchases = purchases.filter((p) => {
        const pDate = new Date(p.createdAt);
        return pDate >= date && pDate < nextDate;
      });

      revenueByDay.push({
        date: date.toISOString().split('T')[0],
        revenue: dayPurchases.reduce((sum, p) => sum + p.totalAmountCents, 0) / 100,
        sales: dayPurchases.length,
      });
    }

    // Calculate benefactor share (30%)
    const benefactorShare = totalRevenue * 0.3;

    // Average order value
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Conversion funnel (if we track cart data)
    const cartsCreated = await prisma.cart.count({
      where: { createdAt: { gte: startDate } },
    });
    const conversionRate = cartsCreated > 0 ? (totalSales / cartsCreated) * 100 : 0;

    return {
      totalRevenue,
      totalSales,
      totalNFTsSold,
      benefactorShare,
      avgOrderValue,
      conversionRate,
      revenueByDay,
    };
  }

  /**
   * Get auction analytics
   */
  async getAuctionAnalytics() {
    const auctions = await prisma.auction.findMany({
      include: { bids: true },
    });

    const completedAuctions = auctions.filter((a) => a.status === 'COMPLETED');
    const activeAuctions = auctions.filter((a) => a.status === 'ACTIVE');

    // Total revenue from auctions
    const auctionRevenue = completedAuctions.reduce(
      (sum, a) => sum + (a.currentBidCents || a.startingBidCents),
      0
    ) / 100;

    // Average bid count
    const totalBids = auctions.reduce((sum, a) => sum + a.bids.length, 0);
    const avgBidsPerAuction = completedAuctions.length > 0
      ? totalBids / completedAuctions.length
      : 0;

    // Bid success rate (won vs total bids)
    const uniqueBidders = new Set(
      auctions.flatMap((a) => a.bids.map((b) => b.bidderAddress))
    ).size;

    // Average winning bid vs starting price
    const avgBidIncrease = completedAuctions.length > 0
      ? completedAuctions.reduce((sum, a) => {
          const increase = ((a.currentBidCents || 0) - a.startingBidCents) / a.startingBidCents;
          return sum + increase;
        }, 0) / completedAuctions.length * 100
      : 0;

    return {
      totalAuctions: auctions.length,
      completedAuctions: completedAuctions.length,
      activeAuctions: activeAuctions.length,
      auctionRevenue,
      totalBids,
      avgBidsPerAuction,
      uniqueBidders,
      avgBidIncrease,
    };
  }

  /**
   * Get marketplace analytics
   */
  async getMarketplaceAnalytics() {
    const listings = await prisma.listing.findMany();
    const trades = await prisma.trade.findMany();

    const activeListings = listings.filter((l) => l.status === 'ACTIVE');
    const soldListings = listings.filter((l) => l.status === 'SOLD');

    // Floor price
    const floorPrice = activeListings.length > 0
      ? Math.min(...activeListings.map((l) => l.priceCents)) / 100
      : 0;

    // Average listing price
    const avgListingPrice = activeListings.length > 0
      ? activeListings.reduce((sum, l) => sum + l.priceCents, 0) / activeListings.length / 100
      : 0;

    // Total marketplace volume
    const marketplaceVolume = trades.reduce((sum, t) => sum + t.priceCents, 0) / 100;

    // Creator royalties earned
    const totalRoyalties = trades.reduce((sum, t) => sum + t.creatorRoyaltyCents, 0) / 100;

    // Listing to sale ratio
    const listingToSaleRatio = listings.length > 0
      ? (soldListings.length / listings.length) * 100
      : 0;

    // Recent sales
    const recentSales = trades
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      totalListings: listings.length,
      activeListings: activeListings.length,
      soldListings: soldListings.length,
      floorPrice,
      avgListingPrice,
      marketplaceVolume,
      totalRoyalties,
      listingToSaleRatio,
      recentSales: recentSales.map((t) => ({
        tokenId: t.tokenId,
        price: t.priceCents / 100,
        type: t.tradeType,
        date: t.createdAt,
      })),
    };
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics() {
    const users = await prisma.user.findMany();
    const purchases = await prisma.purchase.findMany({
      where: { status: 'COMPLETED' },
    });

    // Users with purchases
    const buyerAddresses = new Set(purchases.map((p) => p.walletAddress));
    const buyerCount = buyerAddresses.size;

    // New users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = users.filter((u) => new Date(u.createdAt) >= thirtyDaysAgo).length;

    // Users with email
    const usersWithEmail = users.filter((u) => u.email).length;

    // Top buyers
    const buyerSpending = new Map<string, number>();
    for (const p of purchases) {
      if (p.walletAddress) {
        const current = buyerSpending.get(p.walletAddress) || 0;
        buyerSpending.set(p.walletAddress, current + p.totalAmountCents);
      }
    }

    const topBuyers = Array.from(buyerSpending.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([address, amountCents]) => ({
        address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown',
        spent: amountCents / 100,
      }));

    return {
      totalUsers: users.length,
      newUsers,
      buyerCount,
      usersWithEmail,
      emailPercentage: users.length > 0 ? (usersWithEmail / users.length) * 100 : 0,
      topBuyers,
    };
  }

  /**
   * Get inventory analytics (NFT distribution)
   */
  async getInventoryAnalytics() {
    const nfts = await prisma.nFT.findMany();
    const tiers = await prisma.tier.findMany({
      orderBy: { phase: 'asc' },
    });

    // Status breakdown
    const available = nfts.filter((n) => n.status === 'AVAILABLE').length;
    const sold = nfts.filter((n) => n.status === 'SOLD').length;
    const reserved = nfts.filter((n) => n.status === 'RESERVED').length;

    // Badge distribution
    const elite = nfts.filter((n) => n.cosmicScore >= 425).length;
    const premium = nfts.filter((n) => n.cosmicScore >= 400 && n.cosmicScore < 425).length;
    const exceptional = nfts.filter((n) => n.cosmicScore >= 375 && n.cosmicScore < 400).length;
    const standard = nfts.filter((n) => n.cosmicScore < 375).length;

    // Object type distribution
    const typeDistribution = new Map<string, number>();
    for (const nft of nfts) {
      const type = nft.objectType || 'Unknown';
      typeDistribution.set(type, (typeDistribution.get(type) || 0) + 1);
    }

    // Current phase
    const currentPhase = tiers.find((t) => t.active);

    // Phase progress
    const completedPhases = tiers.filter((t) => !t.active && t.quantitySold > 0).length;

    return {
      totalNFTs: nfts.length,
      available,
      sold,
      reserved,
      badges: {
        elite,
        premium,
        exceptional,
        standard,
      },
      objectTypes: Array.from(typeDistribution.entries()).map(([type, count]) => ({
        type,
        count,
      })),
      currentPhase: currentPhase?.phase || 1,
      completedPhases,
      totalPhases: tiers.length,
    };
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData() {
    const [sales, auctions, marketplace, users, inventory] = await Promise.all([
      this.getSalesOverview(30),
      this.getAuctionAnalytics(),
      this.getMarketplaceAnalytics(),
      this.getUserAnalytics(),
      this.getInventoryAnalytics(),
    ]);

    return {
      sales,
      auctions,
      marketplace,
      users,
      inventory,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const analyticsService = new AnalyticsService();
