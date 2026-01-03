import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

// Base price per score point: $0.10
const BASE_PRICE_PER_SCORE = 0.10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get site settings for phase increase percent
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });
    const phaseIncreasePercent = siteSettings?.phaseIncreasePercent || 7.5;

    // Get active tier from database
    let activeTier = await prisma.tier.findFirst({
      where: { active: true },
    });

    if (!activeTier) {
      // Default to phase 1 if no active tier
      const phase1 = await prisma.tier.findFirst({
        where: { phase: 1 },
      });

      if (!phase1) {
        // Return default Phase 1 pricing if no tiers configured
        return res.json({
          currentPrice: (BASE_PRICE_PER_SCORE * 1e18).toString(),
          displayPrice: BASE_PRICE_PER_SCORE.toFixed(2),
          timeUntilNextTier: 0,
          quantityAvailable: 20000,
          tierIndex: 0,
          phaseName: 'Phase 1',
          phaseIncreasePercent,
          isPaused: siteSettings?.phasePaused || false,
          pausedAt: siteSettings?.pausedAt || null,
          tier: {
            price: (BASE_PRICE_PER_SCORE * 1e18).toString(),
            quantityAvailable: 20000,
            quantitySold: 0,
            startTime: Math.floor(Date.now() / 1000),
            duration: 2419200,
            active: true,
          },
        });
      }

      // Activate phase 1
      await prisma.tier.update({
        where: { id: phase1.id },
        data: { active: true },
      });

      activeTier = { ...phase1, active: true };
    }

    // Calculate phase multiplier: (1 + phaseIncreasePercent/100)^(phase-1)
    const phaseMultiplier = Math.pow(1 + phaseIncreasePercent / 100, activeTier.phase - 1);

    // Current price per score = $0.10 × phase multiplier
    const currentPricePerScore = BASE_PRICE_PER_SCORE * phaseMultiplier;

    // Calculate time until tier ends (accounting for pause duration)
    const tierEndTime = new Date(activeTier.startTime.getTime() + activeTier.duration * 1000);
    const adjustedEndTime = new Date(tierEndTime.getTime() + (siteSettings?.pauseDurationMs || 0));
    const timeUntilNextTier = Math.max(0, Math.floor((adjustedEndTime.getTime() - Date.now()) / 1000));

    // Get count of available NFTs
    const availableCount = await prisma.nFT.count({
      where: { status: 'AVAILABLE' },
    });

    res.json({
      currentPrice: (currentPricePerScore * 1e18).toString(),
      displayPrice: currentPricePerScore.toFixed(2),
      timeUntilNextTier,
      quantityAvailable: availableCount,
      tierIndex: activeTier.phase - 1,
      phaseName: `Phase ${activeTier.phase}`,
      phaseIncreasePercent,
      isPaused: siteSettings?.phasePaused || false,
      pausedAt: siteSettings?.pausedAt || null,
      tier: {
        price: (currentPricePerScore * 1e18).toString(),
        quantityAvailable: availableCount,
        quantitySold: 20000 - availableCount,
        startTime: Math.floor(activeTier.startTime.getTime() / 1000),
        duration: activeTier.duration,
        active: activeTier.active,
      },
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({ error: 'Failed to fetch pricing data' });
  }
}
