import type { NextApiRequest, NextApiResponse } from 'next';
import type { Phase } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { calculateSeriesMultiplier } from '../../../lib/pricing';

/**
 * Cron job to advance phases within a Series
 *
 * New model: 4 Series × 5 Phases (20 total)
 * - Pricing is FLAT within a Series (no per-phase multiplier)
 * - When Phase 5 ends, advances to next Series Phase 1
 * - Series multiplier is set based on previous series sell-through
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // Check if phase is paused
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (siteSettings?.phasePaused) {
      return res.json({ message: 'Phase timer is paused, skipping advancement' });
    }

    // Get current active series and phase
    const activeSeries = await prisma.series.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        phases: {
          orderBy: { phaseNumber: 'asc' },
        },
      },
    });

    if (!activeSeries) {
      return res.json({ message: 'No active series found' });
    }

    const activePhase = activeSeries.phases.find((p: Phase) => p.status === 'ACTIVE');

    if (!activePhase) {
      // No active phase, activate Phase 1 of the series
      const phase1 = activeSeries.phases.find((p: Phase) => p.phaseNumber === 1);
      if (phase1) {
        await prisma.phase.update({
          where: { id: phase1.id },
          data: {
            status: 'ACTIVE',
            startDate: new Date(),
          },
        });
        return res.json({ message: `Activated Series ${activeSeries.seriesNumber} Phase 1` });
      }
      return res.json({ message: 'No phases configured for active series' });
    }

    // Check if phase has expired
    if (!activePhase.startDate) {
      return res.json({ message: 'Phase has no start date' });
    }

    const pauseDuration = activePhase.totalPausedMs ? Number(activePhase.totalPausedMs) : 0;
    const phaseDurationMs = activePhase.durationDays * 24 * 60 * 60 * 1000;
    const phaseEndTime = new Date(activePhase.startDate.getTime() + phaseDurationMs + pauseDuration);
    const now = new Date();

    if (now < phaseEndTime) {
      // Phase hasn't ended yet
      const remainingMs = phaseEndTime.getTime() - now.getTime();
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      return res.json({
        message: 'No advancement needed',
        currentSeries: activeSeries.seriesNumber,
        currentPhase: activePhase.phaseNumber,
        remainingHours,
      });
    }

    // Phase has ended, time to advance
    if (activePhase.phaseNumber < 5) {
      // Advance to next phase within the same series
      const nextPhase = activeSeries.phases.find((p: Phase) => p.phaseNumber === activePhase.phaseNumber + 1);

      if (!nextPhase) {
        return res.json({ error: 'Next phase not found in current series' });
      }

      await prisma.$transaction([
        // Complete current phase
        prisma.phase.update({
          where: { id: activePhase.id },
          data: {
            status: 'COMPLETED',
            endDate: now,
          },
        }),
        // Activate next phase
        prisma.phase.update({
          where: { id: nextPhase.id },
          data: {
            status: 'ACTIVE',
            startDate: now,
            totalPausedMs: 0,
          },
        }),
        // Update site settings
        prisma.siteSettings.update({
          where: { id: 'main' },
          data: {
            currentPhaseId: nextPhase.id,
            pauseDurationMs: 0,
          },
        }),
      ]);

      return res.json({
        message: `Advanced to Series ${activeSeries.seriesNumber} Phase ${nextPhase.phaseNumber}`,
        seriesNumber: activeSeries.seriesNumber,
        phaseNumber: nextPhase.phaseNumber,
      });
    } else {
      // Phase 5 ended, advance to next series
      const nextSeries = await prisma.series.findFirst({
        where: { seriesNumber: activeSeries.seriesNumber + 1 },
        include: {
          phases: {
            where: { phaseNumber: 1 },
          },
        },
      });

      if (!nextSeries) {
        // Complete the final phase and series
        await prisma.$transaction([
          prisma.phase.update({
            where: { id: activePhase.id },
            data: { status: 'COMPLETED', endDate: now },
          }),
          prisma.series.update({
            where: { id: activeSeries.id },
            data: { status: 'COMPLETED', endDate: now },
          }),
        ]);
        return res.json({ message: 'All series completed! Final phase ended.' });
      }

      // Calculate sell-through rate for current series
      const sellThroughRate = activeSeries.totalNFTs > 0
        ? activeSeries.soldCount / activeSeries.totalNFTs
        : 0;

      // Calculate new series multiplier
      const newMultiplier = calculateSeriesMultiplier(sellThroughRate);
      const nextPhase1 = nextSeries.phases[0];

      if (!nextPhase1) {
        return res.json({ error: 'Next series has no Phase 1 configured' });
      }

      await prisma.$transaction([
        // Complete current phase
        prisma.phase.update({
          where: { id: activePhase.id },
          data: { status: 'COMPLETED', endDate: now },
        }),
        // Complete current series
        prisma.series.update({
          where: { id: activeSeries.id },
          data: {
            status: 'COMPLETED',
            endDate: now,
            sellThroughRate: sellThroughRate,
          },
        }),
        // Activate next series with new multiplier
        prisma.series.update({
          where: { id: nextSeries.id },
          data: {
            status: 'ACTIVE',
            startDate: now,
            multiplier: newMultiplier,
          },
        }),
        // Activate Phase 1 of next series
        prisma.phase.update({
          where: { id: nextPhase1.id },
          data: {
            status: 'ACTIVE',
            startDate: now,
            totalPausedMs: 0,
          },
        }),
        // Update site settings
        prisma.siteSettings.update({
          where: { id: 'main' },
          data: {
            currentSeriesId: nextSeries.id,
            currentPhaseId: nextPhase1.id,
            pauseDurationMs: 0,
          },
        }),
      ]);

      return res.json({
        message: `Advanced to Series ${nextSeries.seriesNumber} Phase 1`,
        previousSellThrough: `${(sellThroughRate * 100).toFixed(1)}%`,
        newMultiplier: `${newMultiplier}x`,
        seriesNumber: nextSeries.seriesNumber,
        phaseNumber: 1,
      });
    }
  } catch (error) {
    console.error('Phase advancement job failed:', error);
    res.status(500).json({ error: 'Phase advancement failed' });
  }
}
