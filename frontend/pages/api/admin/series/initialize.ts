import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

/**
 * Admin API: Initialize Series System
 *
 * Creates all 4 series with 5 phases each (20 phases total)
 * Distributes NFTs proportionally by tier with random selection:
 * - Each phase gets the same proportion of each tier
 * - Within each tier, NFTs are randomly selected
 * - MYTHIC tier is excluded (reserved for auctions)
 *
 * Tier distribution per phase (999 NFTs each):
 * - LEGENDARY: 5
 * - ELITE: 20
 * - PREMIUM: 50
 * - EXCEPTIONAL: 100
 * - STANDARD: 824
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

    // Check if series already exist
    const existingSeriesCount = await prisma.series.count();
    if (existingSeriesCount > 0) {
      return res.status(400).json({
        error: 'Series already initialized',
        message: 'Series system has already been set up. Use advance/reset endpoints to manage phases.'
      });
    }

    console.log('Initializing series system with proportional random distribution...');

    // Get counts by tier (excluding MYTHIC)
    const tierCounts = await prisma.nFT.groupBy({
      by: ['badgeTier'],
      where: {
        badgeTier: { not: 'MYTHIC' },
        status: 'AVAILABLE',
      },
      _count: { badgeTier: true },
    });

    const tierCountMap: Record<string, number> = {};
    tierCounts.forEach(t => {
      tierCountMap[t.badgeTier] = t._count.badgeTier;
    });

    console.log('Tier counts:', tierCountMap);

    // Calculate distribution per phase (20 phases total)
    const TOTAL_PHASES = 20;
    const TIERS = ['LEGENDARY', 'ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD'];

    const perPhaseDistribution: Record<string, number> = {};
    let totalPerPhase = 0;

    for (const tier of TIERS) {
      const count = tierCountMap[tier] || 0;
      perPhaseDistribution[tier] = Math.floor(count / TOTAL_PHASES);
      totalPerPhase += perPhaseDistribution[tier];
    }

    console.log('Per-phase distribution:', perPhaseDistribution);
    console.log('Total NFTs per phase:', totalPerPhase);

    // Get all NFTs by tier (shuffled for random selection)
    const nftsByTier: Record<string, number[]> = {};

    for (const tier of TIERS) {
      const nfts = await prisma.nFT.findMany({
        where: {
          badgeTier: tier as any,
          status: 'AVAILABLE',
        },
        select: { id: true },
      });

      // Shuffle the array for random selection
      const ids = nfts.map(n => n.id);
      shuffleArray(ids);
      nftsByTier[tier] = ids;

      console.log(`${tier}: ${ids.length} NFTs (shuffled)`);
    }

    // Create all 4 series with 5 phases each
    const seriesMultipliers = [1.0, 1.5, 2.0, 2.5];
    const createdSeries: any[] = [];

    for (let seriesNum = 1; seriesNum <= 4; seriesNum++) {
      const series = await prisma.series.create({
        data: {
          seriesNumber: seriesNum,
          multiplier: seriesMultipliers[seriesNum - 1],
          // All series start as PLANNED - will be activated after image review
          status: 'PLANNED',
          totalNFTs: 0, // Will update after assignment
          startDate: null,
        },
      });

      // Create 5 phases for this series
      const phases: any[] = [];
      for (let phaseNum = 1; phaseNum <= 5; phaseNum++) {
        const phase = await prisma.phase.create({
          data: {
            seriesId: series.id,
            phaseNumber: phaseNum,
            // All phases start as PENDING - require image review before activation
            status: 'PENDING',
            totalNFTs: 0, // Will update after assignment
            durationDays: 14,
            startDate: null,
            // Initialize review counts
            approvedCount: 0,
            pendingReviewCount: 0,
            rejectedCount: 0,
          },
        });
        phases.push(phase);
      }

      createdSeries.push({ series, phases });
      console.log(`Created Series ${seriesNum} with 5 phases (all PENDING for image review)`);
    }

    // Assign NFTs to phases using proportional random distribution
    let totalAssigned = 0;
    const phaseAssignments: { seriesNum: number; phaseNum: number; count: number; tiers: Record<string, number> }[] = [];

    // Track current index for each tier
    const tierIndex: Record<string, number> = {};
    TIERS.forEach(t => tierIndex[t] = 0);

    for (const { series, phases } of createdSeries) {
      for (const phase of phases) {
        const globalPhaseNum = (series.seriesNumber - 1) * 5 + phase.phaseNumber;
        const nftIdsForPhase: number[] = [];
        const tierAssigned: Record<string, number> = {};

        // For the last phase, assign all remaining NFTs
        const isLastPhase = globalPhaseNum === TOTAL_PHASES;

        for (const tier of TIERS) {
          let countToAssign: number;

          if (isLastPhase) {
            // Last phase gets all remaining NFTs of this tier
            countToAssign = nftsByTier[tier].length - tierIndex[tier];
          } else {
            countToAssign = perPhaseDistribution[tier];
          }

          // Get the NFTs for this tier
          const startIdx = tierIndex[tier];
          const endIdx = startIdx + countToAssign;
          const tierNfts = nftsByTier[tier].slice(startIdx, endIdx);

          nftIdsForPhase.push(...tierNfts);
          tierIndex[tier] = endIdx;
          tierAssigned[tier] = tierNfts.length;
        }

        // Batch update all NFTs for this phase
        if (nftIdsForPhase.length > 0) {
          await prisma.nFT.updateMany({
            where: { id: { in: nftIdsForPhase } },
            data: {
              phaseId: phase.id,
              seriesId: series.id,
              phaseNumber: phase.phaseNumber,
              seriesNumber: series.seriesNumber,
              // All NFTs start as PENDING_GENERATION - images must be reviewed before going live
              imageReviewStatus: 'PENDING_GENERATION',
            },
          });

          // Update phase totalNFTs
          await prisma.phase.update({
            where: { id: phase.id },
            data: { totalNFTs: nftIdsForPhase.length },
          });

          totalAssigned += nftIdsForPhase.length;
        }

        phaseAssignments.push({
          seriesNum: series.seriesNumber,
          phaseNum: phase.phaseNumber,
          count: nftIdsForPhase.length,
          tiers: tierAssigned,
        });

        console.log(`Series ${series.seriesNumber} Phase ${phase.phaseNumber}: Assigned ${nftIdsForPhase.length} NFTs`, tierAssigned);
      }

      // Update series totalNFTs
      const seriesTotal = phaseAssignments
        .filter(p => p.seriesNum === series.seriesNumber)
        .reduce((sum, p) => sum + p.count, 0);

      await prisma.series.update({
        where: { id: series.id },
        data: { totalNFTs: seriesTotal },
      });
    }

    // Update site settings - don't set currentPhaseId until phase is activated after review
    // currentSeriesId is set to first series but currentPhaseId remains null
    const firstSeries = createdSeries[0].series;

    await prisma.siteSettings.upsert({
      where: { id: 'main' },
      update: {
        currentSeriesId: firstSeries.id,
        // Don't set currentPhaseId - will be set when first phase is activated after image review
        currentPhaseId: null,
      },
      create: {
        id: 'main',
        currentSeriesId: firstSeries.id,
        currentPhaseId: null,
      },
    });

    // Log audit
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'SERIES_INITIALIZE',
          details: JSON.stringify({
            totalSeries: 4,
            totalPhases: 20,
            totalNFTsAssigned: totalAssigned,
            distribution: perPhaseDistribution,
          }),
          ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
        },
      });
    } catch {
      // Audit log might not exist
    }

    console.log(`Series initialization complete. Assigned ${totalAssigned} NFTs across 20 phases.`);
    console.log('All phases are PENDING - use Image Review to generate/approve images before activation.');

    res.json({
      success: true,
      message: 'Series system initialized. All phases require image review before activation.',
      nextStep: 'Go to Image Review (/admin/image-review) to generate and approve images for Phase 1',
      summary: {
        totalSeries: 4,
        totalPhases: 20,
        totalNFTsAssigned: totalAssigned,
        perPhaseDistribution,
        mythicExcluded: tierCountMap['MYTHIC'] || 20,
        allPhasesStatus: 'PENDING (awaiting image review)',
      },
      phases: phaseAssignments,
    });
  } catch (error: any) {
    console.error('Error initializing series:', error);
    res.status(500).json({ error: 'Failed to initialize series', details: error?.message });
  }
}

/**
 * Fisher-Yates shuffle algorithm for random array ordering
 */
function shuffleArray(array: any[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
