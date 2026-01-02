import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// Badge assignment based on score
function getBadgeForScore(score: number): string {
  if (score >= 425) return 'ELITE';
  if (score >= 400) return 'PREMIUM';
  if (score >= 375) return 'EXCEPTIONAL';
  return 'STANDARD';
}

// GET /api/nfts/available - Get available NFTs with filtering
router.get('/available', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      offset,
      minScore,
      maxScore,
      badge,
      type,
      search,
      sortBy = 'score',
      sortOrder = 'desc',
      order,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = offset ? parseInt(offset as string) : (pageNum - 1) * limitNum;
    const actualOrder = order || sortOrder;

    // Build filter
    const where: any = {
      status: 'AVAILABLE',
    };

    if (minScore) {
      where.cosmicScore = { ...where.cosmicScore, gte: parseInt(minScore as string) };
    }
    if (maxScore) {
      where.cosmicScore = { ...where.cosmicScore, lte: parseInt(maxScore as string) };
    }

    // Object type filter
    if (type && type !== 'All') {
      where.objectType = type as string;
    }

    // Search filter
    if (search) {
      where.name = { contains: search as string };
    }

    // Badge filter
    if (badge && badge !== 'All') {
      const badgeRanges: Record<string, { min: number; max: number }> = {
        ELITE: { min: 425, max: 500 },
        PREMIUM: { min: 400, max: 424 },
        EXCEPTIONAL: { min: 375, max: 399 },
        STANDARD: { min: 250, max: 374 },
      };
      const range = badgeRanges[badge as string];
      if (range) {
        where.cosmicScore = { gte: range.min, lte: range.max };
      }
    }

    // Sort options
    const orderBy: any = {};
    switch (sortBy) {
      case 'score':
        orderBy.cosmicScore = actualOrder;
        break;
      case 'price':
        orderBy.currentPrice = actualOrder;
        break;
      case 'name':
        orderBy.name = actualOrder;
        break;
      default:
        orderBy.cosmicScore = 'desc';
    }

    const [total, nfts] = await Promise.all([
      prisma.nFT.count({ where }),
      prisma.nFT.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
    ]);

    res.json({
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      items: nfts.map((nft) => ({
        id: nft.id,
        name: nft.name,
        image: nft.image,
        score: nft.cosmicScore,
        cosmicScore: nft.cosmicScore,
        badge: getBadgeForScore(nft.cosmicScore),
        currentPrice: nft.currentPrice,
        displayPrice: `$${nft.currentPrice.toFixed(2)}`,
        objectType: nft.objectType,
        status: nft.status,
      })),
    });
  } catch (error) {
    logger.error('Error fetching available NFTs:', error);
    res.status(500).json({ error: 'Failed to fetch NFTs' });
  }
});

// GET /api/nfts/search - Search NFTs by name
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = '20' } = req.query;

    if (!q || (q as string).length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const nfts = await prisma.nFT.findMany({
      where: {
        name: {
          contains: q as string,
        },
        status: 'AVAILABLE',
      },
      take: Math.min(parseInt(limit as string), 50),
      orderBy: { cosmicScore: 'desc' },
    });

    res.json({
      query: q,
      count: nfts.length,
      items: nfts.map((nft) => ({
        id: nft.id,
        name: nft.name,
        image: nft.image,
        score: nft.cosmicScore,
        badge: getBadgeForScore(nft.cosmicScore),
        displayPrice: `$${nft.currentPrice.toFixed(2)}`,
      })),
    });
  } catch (error) {
    logger.error('Error searching NFTs:', error);
    res.status(500).json({ error: 'Failed to search NFTs' });
  }
});

// GET /api/nfts/stats - Get NFT statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalNfts,
      availableNfts,
      soldNfts,
      avgScore,
      badgeCounts,
    ] = await Promise.all([
      prisma.nFT.count(),
      prisma.nFT.count({ where: { status: 'AVAILABLE' } }),
      prisma.nFT.count({ where: { status: 'SOLD' } }),
      prisma.nFT.aggregate({ _avg: { cosmicScore: true } }),
      prisma.nFT.groupBy({
        by: ['cosmicScore'],
        _count: true,
        where: { status: 'AVAILABLE' },
      }),
    ]);

    // Calculate badge distribution
    const badges = { ELITE: 0, PREMIUM: 0, EXCEPTIONAL: 0, STANDARD: 0 };
    badgeCounts.forEach((item) => {
      const badge = getBadgeForScore(item.cosmicScore);
      badges[badge as keyof typeof badges] += item._count;
    });

    res.json({
      total: totalNfts,
      available: availableNfts,
      sold: soldNfts,
      reserved: totalNfts - availableNfts - soldNfts,
      averageScore: Math.round(avgScore._avg.cosmicScore || 0),
      badgeDistribution: badges,
    });
  } catch (error) {
    logger.error('Error fetching NFT stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/nfts/by-phase - Get NFTs by phase (ID range)
router.get('/by-phase', async (req: Request, res: Response) => {
  try {
    const {
      phase = '1',
      minId,
      maxId,
      limit = '50',
      offset = '0',
    } = req.query;

    const phaseNum = parseInt(phase as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offsetNum = parseInt(offset as string);

    // Calculate ID range if not provided
    let actualMinId = minId ? parseInt(minId as string) : 1;
    let actualMaxId = maxId ? parseInt(maxId as string) : 1000;

    if (!minId || !maxId) {
      if (phaseNum === 1) {
        actualMinId = 1;
        actualMaxId = 1000;
      } else {
        actualMinId = 1001 + (phaseNum - 2) * 250;
        actualMaxId = actualMinId + 249;
      }
    }

    const where = {
      id: {
        gte: actualMinId,
        lte: actualMaxId,
      },
    };

    const [total, nfts] = await Promise.all([
      prisma.nFT.count({ where }),
      prisma.nFT.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: offsetNum,
        take: limitNum,
      }),
    ]);

    // Calculate phase price
    const basePrice = 350;
    const phasePrice = basePrice * Math.pow(1.075, phaseNum - 1);

    res.json({
      phase: phaseNum,
      phasePrice: `$${phasePrice.toFixed(2)}`,
      idRange: { min: actualMinId, max: actualMaxId },
      total,
      limit: limitNum,
      offset: offsetNum,
      items: nfts.map((nft) => ({
        id: nft.id,
        name: nft.name,
        image: nft.image,
        score: nft.cosmicScore,
        badge: getBadgeForScore(nft.cosmicScore),
        objectType: nft.objectType,
        status: nft.status,
        displayPrice: `$${nft.currentPrice.toFixed(2)}`,
      })),
    });
  } catch (error) {
    logger.error('Error fetching NFTs by phase:', error);
    res.status(500).json({ error: 'Failed to fetch NFTs by phase' });
  }
});

// GET /api/nfts/:nftId - Get single NFT details (must be last to avoid catching other routes)
router.get('/:nftId', async (req: Request, res: Response) => {
  try {
    const { nftId } = req.params;

    const nft = await prisma.nFT.findUnique({
      where: { id: parseInt(nftId) },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Calculate price projections
    const basePrice = nft.cosmicScore;
    const projections = [1, 2, 5, 10, 20, 30].map((phase) => ({
      phase,
      price: `$${(basePrice * Math.pow(1.075, phase - 1)).toFixed(2)}`,
    }));

    res.json({
      nftId: nft.id,
      name: nft.name,
      description: nft.description,
      image: nft.image,
      score: nft.cosmicScore,
      badge: getBadgeForScore(nft.cosmicScore),
      fameVisibility: nft.fameVisibility,
      scientificSignificance: nft.scientificSignificance,
      rarity: nft.rarity,
      discoveryRecency: nft.discoveryRecency,
      culturalImpact: nft.culturalImpact,
      basePrice: (nft.cosmicScore * 1e18).toString(),
      currentPhasePrice: (nft.currentPrice * 1e18).toString(),
      displayPrice: `$${nft.currentPrice.toFixed(2)}`,
      status: nft.status,
      availablePhases: projections,
    });
  } catch (error) {
    logger.error('Error fetching NFT:', error);
    res.status(500).json({ error: 'Failed to fetch NFT' });
  }
});

export default router;
