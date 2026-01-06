import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { SERIES_CONFIG } from '../../../lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers for public endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch current active tier/phase and settings
    const [activeTier, settings, soldCount, totalCount] = await Promise.all([
      prisma.tier.findFirst({ where: { active: true } }),
      prisma.siteSettings.findUnique({ where: { id: 'main' } }),
      prisma.nFT.count({ where: { status: 'SOLD' } }),
      prisma.nFT.count(),
    ]);

    // Determine current series based on sold count
    // Series 1: 0-4999, Series 2: 5000-9999, etc.
    const currentSeries = Math.floor(soldCount / SERIES_CONFIG.nftsPerSeries) + 1;
    const soldInCurrentSeries = soldCount % SERIES_CONFIG.nftsPerSeries;

    // Calculate current phase within series (1000 NFTs per phase)
    const currentPhase = activeTier?.phase || Math.floor(soldInCurrentSeries / SERIES_CONFIG.nftsPerPhase) + 1;
    const phaseSoldCount = soldInCurrentSeries % SERIES_CONFIG.nftsPerPhase;

    // Calculate phase end date
    let phaseEndDate: Date;
    if (activeTier?.startTime && activeTier?.duration) {
      // Use actual tier data if available
      const startTime = new Date(activeTier.startTime);
      const pauseDuration = settings?.pauseDurationMs || 0;
      phaseEndDate = new Date(startTime.getTime() + activeTier.duration * 1000 + pauseDuration);

      // If paused, adjust end date
      if (settings?.phasePaused && settings?.pausedAt) {
        const pauseStart = new Date(settings.pausedAt);
        const timeSincePause = Date.now() - pauseStart.getTime();
        phaseEndDate = new Date(phaseEndDate.getTime() + timeSincePause);
      }
    } else {
      // Fallback: estimate based on phase duration
      const daysIntoPhase = (phaseSoldCount / SERIES_CONFIG.nftsPerPhase) * SERIES_CONFIG.phaseDurationDays;
      const daysRemaining = SERIES_CONFIG.phaseDurationDays - daysIntoPhase;
      phaseEndDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
    }

    // Calculate sell-through rate for trajectory
    const totalForSeries = SERIES_CONFIG.nftsPerSeries;
    const sellThroughRate = soldInCurrentSeries / totalForSeries;

    // Determine trajectory multiplier based on sell-through rate
    let trajectoryMultiplier: number | null = null;
    if (sellThroughRate < 0.25) {
      trajectoryMultiplier = null; // Series 2 may not launch
    } else if (sellThroughRate < 0.50) {
      trajectoryMultiplier = 1.5;
    } else if (sellThroughRate < 0.75) {
      trajectoryMultiplier = 2.0;
    } else if (sellThroughRate < 0.90) {
      trajectoryMultiplier = 2.5;
    } else {
      trajectoryMultiplier = 3.0;
    }

    res.status(200).json({
      currentSeries,
      currentPhase,
      soldCount: soldInCurrentSeries,
      totalForSeries,
      phaseEndDate: phaseEndDate.toISOString(),
      phaseSoldCount,
      phaseTotal: SERIES_CONFIG.nftsPerPhase,
      isPaused: settings?.phasePaused || false,
      sellThroughRate,
      sellThroughPercentage: Math.round(sellThroughRate * 100),
      trajectoryMultiplier,
      totalSold: soldCount,
      totalNfts: totalCount,
      config: {
        nftsPerSeries: SERIES_CONFIG.nftsPerSeries,
        nftsPerPhase: SERIES_CONFIG.nftsPerPhase,
        phasesPerSeries: SERIES_CONFIG.phasesPerSeries,
        phaseDurationDays: SERIES_CONFIG.phaseDurationDays,
      },
    });
  } catch (error: any) {
    console.error('Error fetching series data:', error);

    // Return fallback data on error so UI still works
    res.status(200).json({
      currentSeries: 1,
      currentPhase: 1,
      soldCount: 0,
      totalForSeries: SERIES_CONFIG.nftsPerSeries,
      phaseEndDate: new Date(Date.now() + SERIES_CONFIG.phaseDurationDays * 24 * 60 * 60 * 1000).toISOString(),
      phaseSoldCount: 0,
      phaseTotal: SERIES_CONFIG.nftsPerPhase,
      isPaused: false,
      sellThroughRate: 0,
      sellThroughPercentage: 0,
      trajectoryMultiplier: null,
      totalSold: 0,
      totalNfts: 20000,
      config: {
        nftsPerSeries: SERIES_CONFIG.nftsPerSeries,
        nftsPerPhase: SERIES_CONFIG.nftsPerPhase,
        phasesPerSeries: SERIES_CONFIG.phasesPerSeries,
        phaseDurationDays: SERIES_CONFIG.phaseDurationDays,
      },
      _fallback: true,
    });
  }
}
