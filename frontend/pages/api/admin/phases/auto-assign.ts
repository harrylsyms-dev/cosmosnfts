import type { NextApiRequest, NextApiResponse } from 'next';
import type { Phase } from '@prisma/client';
import { prisma } from '../../../../lib/prisma';

/**
 * Auto-assign NFTs to Phases
 *
 * This endpoint automatically assigns NFTs to phases within a series:
 * - Sorts NFTs by totalScore DESC
 * - Skips MYTHIC tier (auction-only)
 * - Assigns 999 NFTs per phase (5 phases × 999 = 4,995)
 * - Phase 1 gets highest scores, Phase 5 gets lowest
 *
 * Can be called:
 * - On app startup (if unassigned NFTs exist)
 * - When a new series is created
 * - Manually by admin
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow both GET (for startup check) and POST (for manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current active series
    const activeSeries = await prisma.series.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        phases: {
          orderBy: { phaseNumber: 'asc' },
        },
      },
    });

    if (!activeSeries) {
      return res.json({
        success: false,
        message: 'No active series found',
        assigned: 0,
      });
    }

    // Check if there are unassigned NFTs (excluding MYTHIC which are auction-only)
    const unassignedCount = await prisma.nFT.count({
      where: {
        phaseId: null,
        badgeTier: { not: 'MYTHIC' },
        status: 'AVAILABLE',
      },
    });

    if (unassignedCount === 0) {
      // Check current assignment counts
      const phaseCounts = await Promise.all(
        activeSeries.phases.map(async (phase: Phase) => ({
          phaseNumber: phase.phaseNumber,
          count: await prisma.nFT.count({ where: { phaseId: phase.id } }),
        }))
      );

      return res.json({
        success: true,
        message: 'All NFTs already assigned to phases',
        assigned: 0,
        phaseCounts,
      });
    }

    // Get all unassigned NFTs sorted by score (highest first)
    const unassignedNFTs = await prisma.nFT.findMany({
      where: {
        phaseId: null,
        badgeTier: { not: 'MYTHIC' },
        status: 'AVAILABLE',
      },
      orderBy: { totalScore: 'desc' },
      select: { id: true, totalScore: true, badgeTier: true },
    });

    console.log(`Auto-assigning ${unassignedNFTs.length} NFTs to phases...`);

    // Calculate NFTs per phase (999 each, 5 phases)
    const NFTS_PER_PHASE = 999;
    const phases = activeSeries.phases;
    let totalAssigned = 0;

    // Assign NFTs to each phase
    for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
      const phase = phases[phaseIndex];
      const startIndex = phaseIndex * NFTS_PER_PHASE;
      const endIndex = Math.min(startIndex + NFTS_PER_PHASE, unassignedNFTs.length);

      if (startIndex >= unassignedNFTs.length) {
        break; // No more NFTs to assign
      }

      const nftsForPhase = unassignedNFTs.slice(startIndex, endIndex);
      const nftIds = nftsForPhase.map((nft: { id: number; totalScore: number; badgeTier: string }) => nft.id);

      if (nftIds.length > 0) {
        // Batch update all NFTs for this phase
        await prisma.nFT.updateMany({
          where: { id: { in: nftIds } },
          data: { phaseId: phase.id },
        });

        // Update phase totalNFTs count
        await prisma.phase.update({
          where: { id: phase.id },
          data: { totalNFTs: nftIds.length },
        });

        totalAssigned += nftIds.length;
        console.log(`  Phase ${phase.phaseNumber}: Assigned ${nftIds.length} NFTs (scores ${nftsForPhase[0]?.totalScore} - ${nftsForPhase[nftIds.length - 1]?.totalScore})`);
      }
    }

    // Get updated phase counts
    const phaseCounts = await Promise.all(
      activeSeries.phases.map(async (phase: Phase) => ({
        phaseNumber: phase.phaseNumber,
        count: await prisma.nFT.count({ where: { phaseId: phase.id } }),
      }))
    );

    // Update series totalNFTs
    const totalInSeries = phaseCounts.reduce((sum: number, p: { phaseNumber: number; count: number }) => sum + p.count, 0);
    await prisma.series.update({
      where: { id: activeSeries.id },
      data: { totalNFTs: totalInSeries },
    });

    res.json({
      success: true,
      message: `Auto-assigned ${totalAssigned} NFTs to phases`,
      assigned: totalAssigned,
      phaseCounts,
      seriesId: activeSeries.id,
      seriesNumber: activeSeries.seriesNumber,
    });
  } catch (error: any) {
    console.error('Error auto-assigning NFTs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to auto-assign NFTs',
      details: error?.message,
    });
  }
}
