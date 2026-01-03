import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [
      totalNfts,
      availableNfts,
      soldNfts,
      avgScore,
      withImages,
      badgeCounts,
    ] = await Promise.all([
      prisma.nFT.count(),
      prisma.nFT.count({ where: { status: 'AVAILABLE' } }),
      prisma.nFT.count({ where: { status: 'SOLD' } }),
      prisma.nFT.aggregate({ _avg: { totalScore: true } }),
      prisma.nFT.count({ where: { imageIpfsHash: { not: null } } }),
      prisma.nFT.groupBy({
        by: ['badgeTier'],
        _count: true,
        where: { status: 'AVAILABLE' },
      }),
    ]);

    // Calculate badge distribution from actual badgeTier field
    const badges: Record<string, number> = { LEGENDARY: 0, ELITE: 0, PREMIUM: 0, EXCEPTIONAL: 0, STANDARD: 0 };
    badgeCounts.forEach((item) => {
      const tier = item.badgeTier as string;
      if (tier && badges[tier] !== undefined) {
        badges[tier] += item._count;
      }
    });

    res.status(200).json({
      total: totalNfts,
      available: availableNfts,
      sold: soldNfts,
      reserved: totalNfts - availableNfts - soldNfts,
      averageScore: Math.round(avgScore._avg.totalScore || 0),
      withImages,
      badgeDistribution: badges,
    });
  } catch (error) {
    console.error('Error fetching NFT stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
