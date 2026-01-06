import type { NextApiRequest, NextApiResponse } from 'next';
import { BadgeTier } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import {
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
    const { q, limit = '20' } = req.query;

    if (!q || (q as string).length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const [nfts, seriesMultiplier] = await Promise.all([
      prisma.nFT.findMany({
        where: {
          name: {
            contains: q as string,
            mode: 'insensitive',
          },
          status: 'AVAILABLE',
        },
        take: Math.min(parseInt(limit as string), 50),
        orderBy: { totalScore: 'desc' },
      }),
      getCurrentSeriesMultiplier(prisma),
    ]);

    res.status(200).json({
      query: q,
      count: nfts.length,
      seriesMultiplier,
      items: nfts.map((nft: { id: number; name: string; image: string | null; imageIpfsHash: string | null; totalScore: number | null; cosmicScore: number | null; badgeTier: string | null }) => {
        const score = nft.totalScore || nft.cosmicScore || 0;
        const badge = (nft.badgeTier as BadgeTier) || getBadgeForScore(score);
        const priceCalc = calculatePrice(score, badge, seriesMultiplier);
        return {
          id: nft.id,
          name: nft.name,
          image: nft.image || (nft.imageIpfsHash ? `https://gateway.pinata.cloud/ipfs/${nft.imageIpfsHash}` : null),
          score,
          badge,
          displayPrice: `$${priceCalc.priceUsd.toFixed(2)}`,
        };
      }),
    });
  } catch (error) {
    console.error('Error searching NFTs:', error);
    res.status(500).json({ error: 'Failed to search NFTs' });
  }
}
