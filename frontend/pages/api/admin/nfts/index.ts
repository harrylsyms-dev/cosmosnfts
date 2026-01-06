import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';
import { calculatePrice, getCurrentSeriesMultiplier, TIER_MULTIPLIERS } from '../../../../lib/pricing';
import { BadgeTier } from '@prisma/client';

// Get current series pricing info
async function getSeriesPricingInfo() {
  try {
    // Get current series multiplier (1.0 for Series 1)
    const seriesMultiplier = await getCurrentSeriesMultiplier(prisma);

    return {
      seriesMultiplier,
    };
  } catch {
    return { seriesMultiplier: 1.0 };
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

    // Get current series pricing info
    const pricingInfo = await getSeriesPricingInfo();

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

    // Calculate prices for each NFT using correct Series-based pricing
    // Formula: Price = $0.10 × Score × Tier Multiplier × Series Multiplier
    const nftsWithDynamicPricing = nfts.map((nft: any) => {
      const badgeTier = (nft.badgeTier as BadgeTier) || 'STANDARD';
      const tierMultiplier = TIER_MULTIPLIERS[badgeTier];
      const priceCalc = calculatePrice(nft.totalScore, badgeTier, pricingInfo.seriesMultiplier);
      const displayPrice = `$${priceCalc.priceUsd.toFixed(2)}`;
      const priceFormula = pricingInfo.seriesMultiplier === 1.0
        ? `$0.10 × ${nft.totalScore} × ${tierMultiplier}x (${badgeTier})`
        : `$0.10 × ${nft.totalScore} × ${tierMultiplier}x (${badgeTier}) × ${pricingInfo.seriesMultiplier}x`;

      return {
        ...nft,
        currentPrice: priceCalc.priceUsd,
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
      pricingInfo: {
        seriesMultiplier: pricingInfo.seriesMultiplier.toFixed(2),
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch NFTs:', error);
    res.status(500).json({ error: 'Failed to fetch NFTs', details: error?.message });
  }
}
