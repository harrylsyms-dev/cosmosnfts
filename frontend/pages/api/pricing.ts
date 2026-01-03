import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

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
        return res.status(500).json({ error: 'No pricing tiers configured' });
      }

      // Activate phase 1
      await prisma.tier.update({
        where: { id: phase1.id },
        data: { active: true },
      });

      activeTier = { ...phase1, active: true };
    }

    // Calculate time until tier ends (accounting for pause duration)
    const tierEndTime = new Date(activeTier.startTime.getTime() + activeTier.duration * 1000);
    const adjustedEndTime = new Date(tierEndTime.getTime() + (siteSettings?.pauseDurationMs || 0));
    const timeUntilNextTier = Math.max(0, Math.floor((adjustedEndTime.getTime() - Date.now()) / 1000));

    // Format price display
    const displayPrice = activeTier.price.toFixed(2);

    res.json({
      currentPrice: (activeTier.price * 1e18).toString(),
      displayPrice,
      timeUntilNextTier,
      quantityAvailable: activeTier.quantityAvailable - activeTier.quantitySold,
      tierIndex: activeTier.phase - 1,
      phaseName: `Phase ${activeTier.phase}`,
      phaseIncreasePercent,
      isPaused: siteSettings?.phasePaused || false,
      pausedAt: siteSettings?.pausedAt || null,
      tier: {
        price: (activeTier.price * 1e18).toString(),
        quantityAvailable: activeTier.quantityAvailable,
        quantitySold: activeTier.quantitySold,
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
