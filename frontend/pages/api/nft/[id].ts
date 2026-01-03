import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

function getBadgeForScore(score: number): string {
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
    const { id } = req.query;
    const nftId = parseInt(id as string);

    if (isNaN(nftId)) {
      return res.status(400).json({ error: 'Invalid NFT ID' });
    }

    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Get current phase multiplier with dynamic percentage
    const [activeTier, siteSettings] = await Promise.all([
      prisma.tier.findFirst({ where: { active: true } }),
      prisma.siteSettings.findUnique({ where: { id: 'main' } }),
    ]);
    const currentPhase = activeTier?.phase || 1;
    const increasePercent = siteSettings?.phaseIncreasePercent || 7.5;
    const multiplierBase = 1 + (increasePercent / 100);
    const phaseMultiplier = Math.pow(multiplierBase, currentPhase - 1);

    // Use the correct score fields
    const fameScore = nft.fameScore || nft.fameVisibility || 0;
    const significanceScore = nft.significanceScore || nft.scientificSignificance || 0;
    const rarityScore = nft.rarityScore || nft.rarity || 0;
    const discoveryScore = nft.discoveryRecencyScore || nft.discoveryRecency || 0;
    const culturalScore = nft.culturalImpactScore || nft.culturalImpact || 0;

    // Calculate total score and price
    const totalScore = nft.totalScore || (fameScore + significanceScore + rarityScore + discoveryScore + culturalScore);
    const currentPrice = 0.10 * totalScore * phaseMultiplier;

    // Calculate price projections for future phases (77 total phases)
    const projections = [1, 2, 5, 10, 20, 30, 50, 77].map((phase) => {
      const mult = Math.pow(multiplierBase, phase - 1);
      const price = 0.10 * totalScore * mult;
      return {
        phase,
        price: `$${price.toFixed(2)}`,
        multiplier: mult.toFixed(4),
      };
    });

    res.status(200).json({
      nftId: nft.id,
      name: nft.name,
      description: nft.description,
      image: nft.image || (nft.imageIpfsHash ? `https://gateway.pinata.cloud/ipfs/${nft.imageIpfsHash}` : null),
      objectType: nft.objectType,
      constellation: nft.constellation,
      distance: nft.distance,
      score: totalScore,
      badge: nft.badgeTier || getBadgeForScore(totalScore),
      fameVisibility: fameScore,
      scientificSignificance: significanceScore,
      rarity: rarityScore,
      discoveryRecency: discoveryScore,
      culturalImpact: culturalScore,
      currentPhase,
      phaseMultiplier: phaseMultiplier.toFixed(4),
      currentPrice,
      displayPrice: `$${currentPrice.toFixed(2)}`,
      priceFormula: `$0.10 × ${totalScore} × ${phaseMultiplier.toFixed(4)}`,
      status: nft.status,
      availablePhases: projections,
      priceProjections: projections,
    });
  } catch (error) {
    console.error('Error fetching NFT:', error);
    res.status(500).json({ error: 'Failed to fetch NFT' });
  }
}
