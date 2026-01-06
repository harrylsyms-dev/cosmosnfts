import type { NextApiRequest, NextApiResponse } from 'next';
import type { Phase } from '@prisma/client';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

/**
 * Admin API: Advance to the next Phase (or Series if at end of phases)
 *
 * New model: 4 Series x 5 Phases (20 total phases)
 * - Advances Phase 1->2->3->4->5 within a Series
 * - When Phase 5 completes, advances to next Series Phase 1
 * - Series multiplier is set when new Series starts (based on sell-through)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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
      return res.status(400).json({ error: 'No active series found' });
    }

    const activePhase = activeSeries.phases.find((p: Phase) => p.status === 'ACTIVE');

    if (!activePhase) {
      return res.status(400).json({ error: 'No active phase found in current series' });
    }

    const now = new Date();
    let advancedToSeries = false;
    let newSeriesMultiplier: number | null = null;

    // Check if we're at the last phase of the series (Phase 5)
    if (activePhase.phaseNumber === 5) {
      // Need to advance to next series
      const nextSeries = await prisma.series.findFirst({
        where: { seriesNumber: activeSeries.seriesNumber + 1 },
        include: {
          phases: {
            orderBy: { phaseNumber: 'asc' },
          },
        },
      });

      if (!nextSeries) {
        return res.status(400).json({ error: 'Already at the last phase of the last series (Phase 20)' });
      }

      // Calculate sell-through rate for current series
      const sellThroughRate = activeSeries.totalNFTs > 0
        ? activeSeries.soldCount / activeSeries.totalNFTs
        : 0;

      // Determine next series multiplier based on sell-through
      // Default progression: 1.0 -> 1.5 -> 2.0 -> 2.5
      // Adjust based on sell-through (can increase or decrease)
      const baseMultipliers = [1.0, 1.5, 2.0, 2.5];
      const baseMultiplier = baseMultipliers[nextSeries.seriesNumber - 1] || 2.5;

      // Adjust multiplier based on sell-through rate
      // High demand (>80% sold) = increase multiplier by 0.5
      // Low demand (<50% sold) = decrease multiplier by 0.25
      let adjustedMultiplier = baseMultiplier;
      if (sellThroughRate >= 0.8) {
        adjustedMultiplier = baseMultiplier + 0.5;
      } else if (sellThroughRate < 0.5) {
        adjustedMultiplier = Math.max(1.0, baseMultiplier - 0.25);
      }

      newSeriesMultiplier = adjustedMultiplier;

      // Get first phase of next series
      const nextPhase = nextSeries.phases.find((p: Phase) => p.phaseNumber === 1);
      if (!nextPhase) {
        return res.status(500).json({ error: 'Next series has no Phase 1 configured' });
      }

      // Transaction: Complete current phase/series, activate next series/phase
      await prisma.$transaction([
        // Complete current phase
        prisma.phase.update({
          where: { id: activePhase.id },
          data: {
            status: 'COMPLETED',
            endDate: now,
            isPaused: false,
            pausedAt: null,
          },
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
        // Activate next series with calculated multiplier
        prisma.series.update({
          where: { id: nextSeries.id },
          data: {
            status: 'ACTIVE',
            startDate: now,
            multiplier: adjustedMultiplier,
          },
        }),
        // Activate first phase of next series
        prisma.phase.update({
          where: { id: nextPhase.id },
          data: {
            status: 'ACTIVE',
            startDate: now,
            isPaused: false,
            pausedAt: null,
            totalPausedMs: 0,
          },
        }),
        // Update site settings with current series/phase
        prisma.siteSettings.update({
          where: { id: 'main' },
          data: {
            currentSeriesId: nextSeries.id,
            currentPhaseId: nextPhase.id,
          },
        }),
      ]);

      advancedToSeries = true;

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'SERIES_ADVANCE',
            details: JSON.stringify({
              fromSeries: activeSeries.seriesNumber,
              fromPhase: activePhase.phaseNumber,
              toSeries: nextSeries.seriesNumber,
              toPhase: 1,
              previousSellThrough: sellThroughRate,
              newMultiplier: adjustedMultiplier,
            }),
            ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
          },
        });
      } catch {
        // Audit log table might not exist
      }

      console.log(`Series advanced from ${activeSeries.seriesNumber} to ${nextSeries.seriesNumber} by admin: ${admin.email}`);
      return res.json({
        success: true,
        message: `Advanced to Series ${nextSeries.seriesNumber}, Phase 1`,
        advancedToNewSeries: true,
        previousSeries: {
          seriesNumber: activeSeries.seriesNumber,
          sellThroughRate,
        },
        newSeries: {
          id: nextSeries.id,
          seriesNumber: nextSeries.seriesNumber,
          multiplier: adjustedMultiplier,
        },
        newPhase: {
          id: nextPhase.id,
          phaseNumber: 1,
          globalPhaseNumber: (nextSeries.seriesNumber - 1) * 5 + 1,
        },
      });
    } else {
      // Advance to next phase within the same series
      const nextPhase = activeSeries.phases.find((p: Phase) => p.phaseNumber === activePhase.phaseNumber + 1);

      if (!nextPhase) {
        return res.status(500).json({ error: 'Next phase not found in current series' });
      }

      // Transaction: Complete current phase, activate next phase
      await prisma.$transaction([
        // Complete current phase
        prisma.phase.update({
          where: { id: activePhase.id },
          data: {
            status: 'COMPLETED',
            endDate: now,
            isPaused: false,
            pausedAt: null,
          },
        }),
        // Activate next phase
        prisma.phase.update({
          where: { id: nextPhase.id },
          data: {
            status: 'ACTIVE',
            startDate: now,
            isPaused: false,
            pausedAt: null,
            totalPausedMs: 0,
          },
        }),
        // Update site settings with current phase
        prisma.siteSettings.update({
          where: { id: 'main' },
          data: {
            currentPhaseId: nextPhase.id,
          },
        }),
      ]);

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'PHASE_ADVANCE',
            details: JSON.stringify({
              seriesNumber: activeSeries.seriesNumber,
              fromPhase: activePhase.phaseNumber,
              toPhase: nextPhase.phaseNumber,
              seriesMultiplier: Number(activeSeries.multiplier),
            }),
            ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
          },
        });
      } catch {
        // Audit log table might not exist
      }

      console.log(`Phase advanced from ${activePhase.phaseNumber} to ${nextPhase.phaseNumber} in Series ${activeSeries.seriesNumber} by admin: ${admin.email}`);
      return res.json({
        success: true,
        message: `Advanced to Series ${activeSeries.seriesNumber}, Phase ${nextPhase.phaseNumber}`,
        advancedToNewSeries: false,
        currentSeries: {
          id: activeSeries.id,
          seriesNumber: activeSeries.seriesNumber,
          multiplier: Number(activeSeries.multiplier),
        },
        newPhase: {
          id: nextPhase.id,
          phaseNumber: nextPhase.phaseNumber,
          globalPhaseNumber: (activeSeries.seriesNumber - 1) * 5 + nextPhase.phaseNumber,
        },
      });
    }
  } catch (error: any) {
    console.error('Error advancing phase:', error);
    res.status(500).json({ error: 'Failed to advance phase', details: error?.message });
  }
}
