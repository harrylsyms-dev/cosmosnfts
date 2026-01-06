import type { NextApiRequest, NextApiResponse } from 'next';
import type { Series, Phase } from '@prisma/client';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

type SeriesWithPhases = Series & { phases: Phase[] };

/**
 * Admin API: Get current Series/Phase status
 *
 * New model: 4 Series x 5 Phases (20 total phases)
 * - Pricing is flat within a Series (no per-phase increase)
 * - Series multiplier changes between series based on sell-through
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get all series with their phases
    const [allSeries, settings] = await Promise.all([
      prisma.series.findMany({
        orderBy: { seriesNumber: 'asc' },
        include: {
          phases: {
            orderBy: { phaseNumber: 'asc' },
          },
        },
      }),
      prisma.siteSettings.findUnique({ where: { id: 'main' } }),
    ]);

    // Find the active series and phase
    const activeSeries = allSeries.find((s: SeriesWithPhases) => s.status === 'ACTIVE');
    const activePhase = activeSeries?.phases.find((p: Phase) => p.status === 'ACTIVE');

    // Calculate time remaining for active phase
    let timeRemaining = 0;
    if (activePhase?.startDate) {
      const phaseDurationMs = activePhase.durationDays * 24 * 60 * 60 * 1000;
      const phaseEndTime = new Date(activePhase.startDate.getTime() + phaseDurationMs);

      if (activePhase.isPaused && activePhase.pausedAt) {
        // Paused: show time remaining at pause point
        timeRemaining = Math.max(0, Math.floor((phaseEndTime.getTime() - activePhase.pausedAt.getTime()) / 1000));
      } else {
        // Not paused: calculate normally with pause duration offset
        const adjustedEndTime = new Date(phaseEndTime.getTime() + Number(activePhase.totalPausedMs || 0));
        timeRemaining = Math.max(0, Math.floor((adjustedEndTime.getTime() - Date.now()) / 1000));
      }
    }

    // Format response
    res.json({
      success: true,
      currentSeries: activeSeries ? {
        id: activeSeries.id,
        seriesNumber: activeSeries.seriesNumber,
        multiplier: Number(activeSeries.multiplier),
        status: activeSeries.status,
        totalNFTs: activeSeries.totalNFTs,
        soldCount: activeSeries.soldCount,
        sellThroughRate: activeSeries.sellThroughRate ? Number(activeSeries.sellThroughRate) : null,
        totalRevenueCents: Number(activeSeries.totalRevenueCents),
      } : null,
      currentPhase: activePhase ? {
        id: activePhase.id,
        seriesNumber: activeSeries?.seriesNumber,
        phaseNumber: activePhase.phaseNumber,
        globalPhaseNumber: ((activeSeries?.seriesNumber || 1) - 1) * 5 + activePhase.phaseNumber,
        status: activePhase.status,
        totalNFTs: activePhase.totalNFTs,
        soldCount: activePhase.soldCount,
        durationDays: activePhase.durationDays,
        startDate: activePhase.startDate,
        endDate: activePhase.endDate,
        timeRemaining,
        isPaused: activePhase.isPaused,
        pausedAt: activePhase.pausedAt,
      } : null,
      series: allSeries.map((s: SeriesWithPhases) => ({
        id: s.id,
        seriesNumber: s.seriesNumber,
        multiplier: Number(s.multiplier),
        status: s.status,
        totalNFTs: s.totalNFTs,
        soldCount: s.soldCount,
        sellThroughRate: s.sellThroughRate ? Number(s.sellThroughRate) : null,
        startDate: s.startDate,
        endDate: s.endDate,
        totalRevenueCents: Number(s.totalRevenueCents),
        donationAmountCents: Number(s.donationAmountCents),
        phases: s.phases.map((p: Phase) => ({
          id: p.id,
          phaseNumber: p.phaseNumber,
          globalPhaseNumber: (s.seriesNumber - 1) * 5 + p.phaseNumber,
          status: p.status,
          totalNFTs: p.totalNFTs,
          soldCount: p.soldCount,
          durationDays: p.durationDays,
          startDate: p.startDate,
          endDate: p.endDate,
          isPaused: p.isPaused,
          pausedAt: p.pausedAt,
          auctionNFTId: p.auctionNFTId,
        })),
      })),
      // Summary stats
      summary: {
        totalSeries: 4,
        phasesPerSeries: 5,
        totalPhases: 20,
        completedSeries: allSeries.filter((s: SeriesWithPhases) => s.status === 'COMPLETED').length,
        completedPhases: allSeries.reduce((acc: number, s: SeriesWithPhases) =>
          acc + s.phases.filter((p: Phase) => p.status === 'COMPLETED').length, 0),
        totalNFTs: allSeries.reduce((acc: number, s: SeriesWithPhases) => acc + s.totalNFTs, 0),
        totalSold: allSeries.reduce((acc: number, s: SeriesWithPhases) => acc + s.soldCount, 0),
        totalRevenueCents: allSeries.reduce((acc: number, s: SeriesWithPhases) => acc + Number(s.totalRevenueCents), 0),
      },
    });
  } catch (error: any) {
    console.error('Error fetching series/phase status:', error);
    res.status(500).json({ error: 'Failed to fetch series/phase status', details: error?.message });
  }
}
