import type { NextApiRequest, NextApiResponse } from 'next';
import type { Phase } from '@prisma/client';
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
    // Fetch active series with its phases
    const [activeSeries, settings, totalSold, totalCount] = await Promise.all([
      prisma.series.findFirst({
        where: { status: 'ACTIVE' },
        include: {
          phases: {
            orderBy: { phaseNumber: 'asc' },
          },
        },
      }),
      prisma.siteSettings.findUnique({ where: { id: 'main' } }),
      prisma.nFT.count({ where: { status: 'SOLD' } }),
      prisma.nFT.count(),
    ]);

    // If no active series, return fallback
    if (!activeSeries) {
      return res.status(200).json({
        currentSeries: 1,
        currentPhase: 1,
        soldCount: 0,
        totalForSeries: SERIES_CONFIG.nftsPerSeries,
        phaseEndDate: new Date(Date.now() + SERIES_CONFIG.phaseDurationDays * 24 * 60 * 60 * 1000).toISOString(),
        phaseSoldCount: 0,
        phaseTotal: SERIES_CONFIG.nftsPerPhase,
        isPaused: settings?.phasePaused || false,
        sellThroughRate: 0,
        sellThroughPercentage: 0,
        trajectoryMultiplier: null,
        totalSold,
        totalNfts: totalCount,
        config: {
          nftsPerSeries: SERIES_CONFIG.nftsPerSeries,
          nftsPerPhase: SERIES_CONFIG.nftsPerPhase,
          phasesPerSeries: SERIES_CONFIG.phasesPerSeries,
          phaseDurationDays: SERIES_CONFIG.phaseDurationDays,
        },
        _noActiveSeries: true,
      });
    }

    // Find active phase within the series
    const activePhase = activeSeries.phases.find((p: Phase) => p.status === 'ACTIVE');
    const currentPhaseNumber = activePhase?.phaseNumber || 1;

    // Get NFT counts for active phase
    const phaseSoldCount = activePhase
      ? await prisma.nFT.count({
          where: { phaseId: activePhase.id, status: 'SOLD' },
        })
      : 0;

    // Phase total is the actual NFTs assigned to this phase
    const phaseTotal = activePhase?.totalNFTs || SERIES_CONFIG.nftsPerPhase;

    // Calculate phase end date
    let phaseEndDate: Date;
    if (activePhase?.startDate) {
      const startTime = new Date(activePhase.startDate);
      const phaseDurationMs = activePhase.durationDays * 24 * 60 * 60 * 1000;
      const pauseDuration = activePhase.totalPausedMs ? Number(activePhase.totalPausedMs) : 0;
      phaseEndDate = new Date(startTime.getTime() + phaseDurationMs + pauseDuration);

      // If currently paused, adjust end date
      if (settings?.phasePaused && settings?.pausedAt) {
        const pauseStart = new Date(settings.pausedAt);
        const timeSincePause = Date.now() - pauseStart.getTime();
        phaseEndDate = new Date(phaseEndDate.getTime() + timeSincePause);
      }
    } else {
      // Fallback: 14 days from now
      phaseEndDate = new Date(Date.now() + SERIES_CONFIG.phaseDurationDays * 24 * 60 * 60 * 1000);
    }

    // Calculate sell-through rate for trajectory
    const totalForSeries = activeSeries.totalNFTs || SERIES_CONFIG.nftsPerSeries;
    const soldInSeries = activeSeries.soldCount || 0;
    const sellThroughRate = totalForSeries > 0 ? soldInSeries / totalForSeries : 0;

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
      currentSeries: activeSeries.seriesNumber,
      currentPhase: currentPhaseNumber,
      soldCount: soldInSeries,
      totalForSeries,
      phaseEndDate: phaseEndDate.toISOString(),
      phaseSoldCount,
      phaseTotal,
      isPaused: settings?.phasePaused || false,
      sellThroughRate,
      sellThroughPercentage: Math.round(sellThroughRate * 100),
      trajectoryMultiplier,
      totalSold,
      totalNfts: totalCount,
      seriesMultiplier: activeSeries.multiplier,
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
