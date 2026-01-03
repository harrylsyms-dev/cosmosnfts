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

    const [total, nfts, siteSettings] = await Promise.all([
      prisma.nFT.count({ where }),
      prisma.nFT.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: offsetNum,
        take: limitNum,
      }),
      prisma.siteSettings.findUnique({ where: { id: 'main' } }),
    ]);

    // Calculate phase price multiplier with dynamic percentage
    const increasePercent = siteSettings?.phaseIncreasePercent || 7.5;
    const phaseMultiplier = Math.pow(1 + (increasePercent / 100), phaseNum - 1);

    res.status(200).json({
      phase: phaseNum,
      phaseMultiplier: phaseMultiplier.toFixed(4),
      idRange: { min: actualMinId, max: actualMaxId },
      total,
      limit: limitNum,
      offset: offsetNum,
      items: nfts.map((nft) => {
        const score = nft.totalScore || nft.cosmicScore || 0;
        const price = 0.10 * score * phaseMultiplier;
        return {
          id: nft.id,
          name: nft.name,
          image: nft.image || (nft.imageIpfsHash ? `https://gateway.pinata.cloud/ipfs/${nft.imageIpfsHash}` : null),
          score,
          badge: nft.badgeTier || getBadgeForScore(score),
          objectType: nft.objectType,
          constellation: nft.constellation,
          distance: nft.distance,
          status: nft.status,
          displayPrice: `$${price.toFixed(2)}`,
          priceFormula: `$0.10 × ${score} × ${phaseMultiplier.toFixed(4)}`,
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching NFTs by phase:', error);
    res.status(500).json({ error: 'Failed to fetch NFTs by phase' });
  }
}
