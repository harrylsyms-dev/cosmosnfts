import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

// Calculate current phase based on NFTs sold
async function getCurrentPhaseInfo() {
  try {
    // Get site settings for phase pause state
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });

    // Get scoring config for base price per point
    const scoringConfig = await prisma.scoringConfig.findUnique({ where: { id: 'main' } });
    const basePricePerPoint = scoringConfig?.basePricePerPoint || 0.10;

    // Get active tier info
    const activeTier = await prisma.tier.findFirst({
      where: { active: true },
      orderBy: { phase: 'asc' },
    });

    // Calculate phase multiplier (7.5% increase per phase after phase 1)
    const phaseIncreasePercent = settings?.phaseIncreasePercent || 7.5;
    const currentPhase = activeTier?.phase || 1;
    const phaseMultiplier = currentPhase === 1 ? 1 : Math.pow(1 + (phaseIncreasePercent / 100), currentPhase - 1);

    return {
      currentPhase,
      phaseMultiplier,
      basePricePerPoint,
      isPaused: settings?.phasePaused || false,
    };
  } catch {
    return { currentPhase: 1, phaseMultiplier: 1, basePricePerPoint: 0.10, isPaused: false };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set headers
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
    // Verify admin token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Parse query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const badge = req.query.badge as string;
    const objectType = req.query.objectType as string;

    // Build where clause
    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (badge && badge !== 'all') {
      where.badgeTier = badge;
    }

    if (objectType && objectType !== 'all') {
      where.objectType = objectType;
    }

    // Get total count
    const total = await prisma.nFT.count({ where });

    // Get current phase info for dynamic pricing
    const phaseInfo = await getCurrentPhaseInfo();

    // Get NFTs with pagination
    const nfts = await prisma.nFT.findMany({
      where,
      orderBy: { id: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        tokenId: true,
        name: true,
        description: true,
        objectType: true,
        totalScore: true,
        badgeTier: true,
        status: true,
        currentPrice: true,
        image: true,
      },
    });

    // Calculate dynamic prices for each NFT
    const nftsWithDynamicPricing = nfts.map((nft: any) => {
      // Dynamic price = basePricePerPoint × score × phaseMultiplier
      const dynamicPrice = phaseInfo.basePricePerPoint * nft.totalScore * phaseInfo.phaseMultiplier;
      const displayPrice = `$${dynamicPrice.toFixed(2)}`;
      const priceFormula = phaseInfo.currentPhase === 1
        ? `$${phaseInfo.basePricePerPoint.toFixed(2)} × ${nft.totalScore}`
        : `$${phaseInfo.basePricePerPoint.toFixed(2)} × ${nft.totalScore} × ${phaseInfo.phaseMultiplier.toFixed(3)}`;

      return {
        ...nft,
        currentPrice: dynamicPrice,
        displayPrice,
        priceFormula,
      };
    });

    res.json({
      success: true,
      items: nftsWithDynamicPricing,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      phaseInfo: {
        currentPhase: phaseInfo.currentPhase,
        phaseMultiplier: phaseInfo.phaseMultiplier.toFixed(3),
        basePricePerPoint: phaseInfo.basePricePerPoint,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch NFTs:', error);
    res.status(500).json({ error: 'Failed to fetch NFTs', details: error?.message });
  }
}
