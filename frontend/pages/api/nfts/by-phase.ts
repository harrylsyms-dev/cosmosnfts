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

    const [total, nfts, seriesMultiplier] = await Promise.all([
      prisma.nFT.count({ where }),
      prisma.nFT.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: offsetNum,
        take: limitNum,
      }),
      getCurrentSeriesMultiplier(prisma),
    ]);

    res.status(200).json({
      phase: phaseNum,
      seriesMultiplier,
      idRange: { min: actualMinId, max: actualMaxId },
      total,
      limit: limitNum,
      offset: offsetNum,
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
          badge,
          objectType: nft.objectType,
          constellation: nft.constellation,
          distance: nft.distance,
          status: nft.status,
          displayPrice: `$${priceCalc.priceUsd.toFixed(2)}`,
          priceFormula: `$${BASE_PRICE_PER_SCORE.toFixed(2)} x ${score} x ${tierMultiplier} x ${seriesMultiplier}`,
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching NFTs by phase:', error);
    res.status(500).json({ error: 'Failed to fetch NFTs by phase' });
  }
}
