import type { NextApiRequest, NextApiResponse } from 'next';
import { BadgeTier } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import {
  BASE_PRICE_PER_SCORE,
  TIER_MULTIPLIERS,
  calculatePrice,
  getCurrentSeriesMultiplier,
} from '../../../lib/pricing';

function getBadgeForScore(score: number): BadgeTier {
  if (score >= 450) return 'LEGENDARY';
  if (score >= 425) return 'ELITE';
  if (score >= 400) return 'PREMIUM';
  if (score >= 375) return 'EXCEPTIONAL';
  return 'STANDARD';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const actualOrder = (order || sortOrder) as 'asc' | 'desc';

    // Get current active phase
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
      select: { currentPhaseId: true },
    });

    const currentPhaseId = siteSettings?.currentPhaseId;

    // Build filter - only show NFTs from current phase
    const where: any = {
      status: 'AVAILABLE',
    };

    // If series is initialized, only show current phase NFTs
    if (currentPhaseId) {
      where.phaseId = currentPhaseId;
    } else {
      // No series initialized - don't show any NFTs to customers
      // Or show a limited preview (optional)
      return res.status(200).json({
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
        seriesMultiplier: 1,
        items: [],
        message: 'Sales have not started yet. Check back soon!',
        seriesNotInitialized: true,
      });
    }

    if (minScore) {
      where.totalScore = { ...where.totalScore, gte: parseInt(minScore as string) };
    }
    if (maxScore) {
      where.totalScore = { ...where.totalScore, lte: parseInt(maxScore as string) };
    }

    // Object type filter
    if (type && type !== 'All') {
      where.objectType = type as string;
    }

    // Search filter
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    // Badge filter - uses the actual badgeTier field (rank-based assignment)
    if (badge && badge !== 'All') {
      const validTiers = ['MYTHIC', 'LEGENDARY', 'ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD'];
      if (validTiers.includes(badge as string)) {
        where.badgeTier = badge as string;
      }
    }

    // Sort options
    const orderBy: any = {};
    switch (sortBy) {
      case 'score':
        orderBy.totalScore = actualOrder;
        break;
      case 'price':
        orderBy.currentPrice = actualOrder;
        break;
      case 'name':
        orderBy.name = actualOrder;
        break;
      default:
        orderBy.totalScore = 'desc';
    }

    const [total, nfts, seriesMultiplier, currentPhase] = await Promise.all([
      prisma.nFT.count({ where }),
      prisma.nFT.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
      getCurrentSeriesMultiplier(prisma),
      currentPhaseId ? prisma.phase.findUnique({
        where: { id: currentPhaseId },
        include: { series: true },
      }) : null,
    ]);

    res.status(200).json({
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      seriesMultiplier,
      currentSeries: currentPhase?.series?.seriesNumber || null,
      currentPhase: currentPhase?.phaseNumber || null,
      items: nfts.map((nft: { id: number; name: string; image: string | null; imageIpfsHash: string | null; totalScore: number | null; cosmicScore: number | null; badgeTier: string | null; objectType: string | null; constellation: string | null; distance: string | null; status: string }) => {
        const score = nft.totalScore || nft.cosmicScore || 0;
        const badge = (nft.badgeTier as BadgeTier) || getBadgeForScore(score);
        const priceCalc = calculatePrice(score, badge, seriesMultiplier);
        const tierMultiplier = TIER_MULTIPLIERS[badge];
        return {
          id: nft.id,
          name: nft.name,
          image: nft.image || (nft.imageIpfsHash ? `https://gateway.pinata.cloud/ipfs/${nft.imageIpfsHash}` : null),
          score,
          cosmicScore: score,
          badge,
          currentPrice: priceCalc.priceUsd,
          displayPrice: `$${priceCalc.priceUsd.toFixed(2)}`,
          priceFormula: `$${BASE_PRICE_PER_SCORE.toFixed(2)} x ${score} x ${tierMultiplier} x ${seriesMultiplier}`,
          objectType: nft.objectType,
          constellation: nft.constellation,
          distance: nft.distance,
          status: nft.status,
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching available NFTs:', error);
    res.status(500).json({ error: 'Failed to fetch NFTs' });
  }
}
