import type { NextApiRequest, NextApiResponse } from 'next';
import type { Phase } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { BASE_PRICE_PER_SCORE, TIER_MULTIPLIERS, DEFAULT_SERIES_MULTIPLIER } from '../../lib/pricing';
import { SERIES_CONFIG } from '../../lib/constants';

/**
 * Pricing API - Returns current Series/Phase pricing information
 *
 * Formula: Price = $0.10 × Score × Tier Multiplier × Series Multiplier
 *
 * NO per-phase multiplier - pricing is flat within a Series
 * Series multiplier is based on previous series sell-through rate
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get site settings
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    // Get active series with its phases
    const activeSeries = await prisma.series.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        phases: {
          orderBy: { phaseNumber: 'asc' },
        },
      },
    });

    // Get active phase
    const activePhase = activeSeries?.phases.find((p: Phase) => p.status === 'ACTIVE');

    if (!activeSeries || !activePhase) {
      // Return default Series 1, Phase 1 pricing
      return res.json({
        basePrice: BASE_PRICE_PER_SCORE,
        displayPrice: BASE_PRICE_PER_SCORE.toFixed(2),
        seriesMultiplier: DEFAULT_SERIES_MULTIPLIER,
        tierMultipliers: TIER_MULTIPLIERS,
        currentSeries: 1,
        currentPhase: 1,
        isPaused: siteSettings?.phasePaused || false,
        pausedAt: siteSettings?.pausedAt || null,
        phaseEndDate: null,
        config: {
          nftsPerPhase: SERIES_CONFIG.nftsPerPhase,
          phaseDurationDays: SERIES_CONFIG.phaseDurationDays,
        },
      });
    }

    // Get series multiplier (1.0 for Series 1, calculated for later series)
    const seriesMultiplier = activeSeries.multiplier
      ? Number(activeSeries.multiplier)
      : DEFAULT_SERIES_MULTIPLIER;

    // Calculate phase end date
    let phaseEndDate: Date | null = null;
    if (activePhase.startTime && activePhase.endTime) {
      const endTime = new Date(activePhase.endTime);
      const pauseDuration = siteSettings?.pauseDurationMs || 0;
      phaseEndDate = new Date(endTime.getTime() + pauseDuration);

      // Adjust for ongoing pause
      if (siteSettings?.phasePaused && siteSettings?.pausedAt) {
        const pauseStart = new Date(siteSettings.pausedAt);
        const timeSincePause = Date.now() - pauseStart.getTime();
        phaseEndDate = new Date(phaseEndDate.getTime() + timeSincePause);
      }
    }

    // Get count of available NFTs
    const availableCount = await prisma.nFT.count({
      where: { status: 'AVAILABLE' },
    });

    // Get sold count for series progress
    const soldCount = await prisma.nFT.count({
      where: { status: 'SOLD' },
    });

    res.json({
      basePrice: BASE_PRICE_PER_SCORE,
      displayPrice: BASE_PRICE_PER_SCORE.toFixed(2),
      seriesMultiplier,
      tierMultipliers: TIER_MULTIPLIERS,
      currentSeries: activeSeries.seriesNumber,
      currentPhase: activePhase.phaseNumber,
      seriesName: activeSeries.name,
      phaseName: activePhase.name,
      isPaused: siteSettings?.phasePaused || false,
      pausedAt: siteSettings?.pausedAt || null,
      phaseEndDate: phaseEndDate?.toISOString() || null,
      quantityAvailable: availableCount,
      quantitySold: soldCount,
      config: {
        nftsPerPhase: SERIES_CONFIG.nftsPerPhase,
        phaseDurationDays: SERIES_CONFIG.phaseDurationDays,
        nftsPerSeries: SERIES_CONFIG.nftsPerSeries,
        totalSeries: SERIES_CONFIG.totalSeries,
      },
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({ error: 'Failed to fetch pricing data' });
  }
}
