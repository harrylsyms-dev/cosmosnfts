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

    // Build filter
    const where: any = {
      status: 'AVAILABLE',
    };

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

    // Badge filter
    if (badge && badge !== 'All') {
      const badgeRanges: Record<string, { min: number; max: number }> = {
        LEGENDARY: { min: 450, max: 500 },
        ELITE: { min: 425, max: 449 },
        PREMIUM: { min: 400, max: 424 },
        EXCEPTIONAL: { min: 375, max: 399 },
        STANDARD: { min: 250, max: 374 },
      };
      const range = badgeRanges[badge as string];
      if (range) {
        where.totalScore = { gte: range.min, lte: range.max };
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

    const [total, nfts, seriesMultiplier] = await Promise.all([
      prisma.nFT.count({ where }),
      prisma.nFT.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
      getCurrentSeriesMultiplier(prisma),
    ]);

    res.status(200).json({
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      seriesMultiplier,
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
