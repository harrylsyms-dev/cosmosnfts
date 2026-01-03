import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

function getBadgeForScore(score: number): string {
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

    const [nfts, siteSettings] = await Promise.all([
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
      prisma.siteSettings.findUnique({ where: { id: 'main' } }),
    ]);

    // Get current phase multiplier with dynamic percentage
    const activeTier = await prisma.tier.findFirst({ where: { active: true } });
    const currentPhase = activeTier?.phase || 1;
    const increasePercent = siteSettings?.phaseIncreasePercent || 7.5;
    const phaseMultiplier = Math.pow(1 + (increasePercent / 100), currentPhase - 1);

    res.status(200).json({
      query: q,
      count: nfts.length,
      currentPhase,
      items: nfts.map((nft) => {
        const score = nft.totalScore || nft.cosmicScore || 0;
        const price = 0.10 * score * phaseMultiplier;
        return {
          id: nft.id,
          name: nft.name,
          image: nft.image || (nft.imageIpfsHash ? `https://gateway.pinata.cloud/ipfs/${nft.imageIpfsHash}` : null),
          score,
          badge: nft.badgeTier || getBadgeForScore(score),
          displayPrice: `$${price.toFixed(2)}`,
        };
      }),
    });
  } catch (error) {
    console.error('Error searching NFTs:', error);
    res.status(500).json({ error: 'Failed to search NFTs' });
  }
}
