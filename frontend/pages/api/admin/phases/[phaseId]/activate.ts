import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

/**
 * Admin API: Activate a phase after all images are approved
 * POST /api/admin/phases/[phaseId]/activate
 *
 * Requirements:
 * - All NFTs in the phase must be APPROVED
 * - Phase must be in PENDING_REVIEW status
 * - Sets phase to ACTIVE and makes NFTs visible to customers
 * - Updates site settings currentPhaseId if this is the first active phase
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
    // Verify admin token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { phaseId } = req.query;
    const { force } = req.body; // Allow force activation for testing

    if (!phaseId || typeof phaseId !== 'string') {
      return res.status(400).json({ error: 'Phase ID is required' });
    }

    // Get phase with series
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: {
        series: {
          select: {
            id: true,
            seriesNumber: true,
            status: true,
          },
        },
      },
    });

    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' });
    }

    // Check phase status
    if (phase.status === 'ACTIVE') {
      return res.status(400).json({
        error: 'Phase is already active',
      });
    }

    if (phase.status === 'COMPLETED') {
      return res.status(400).json({
        error: 'Phase is already completed',
      });
    }

    // Get review statistics
    const stats = await prisma.nFT.groupBy({
      by: ['imageReviewStatus'],
      where: { phaseId },
      _count: { imageReviewStatus: true },
    });

    const statMap: Record<string, number> = {};
    stats.forEach(s => {
      statMap[s.imageReviewStatus] = s._count.imageReviewStatus;
    });

    const totalNFTs = Object.values(statMap).reduce((a, b) => a + b, 0);
    const approved = statMap['APPROVED'] || 0;
    const pendingReview = statMap['PENDING_REVIEW'] || 0;
    const rejected = statMap['REJECTED'] || 0;
    const pendingGeneration = statMap['PENDING_GENERATION'] || 0;
    const regenerating = statMap['REGENERATING'] || 0;

    const unapproved = totalNFTs - approved;

    // Check if all NFTs are approved (unless force is set)
    if (!force && unapproved > 0) {
      return res.status(400).json({
        error: 'Not all NFTs are approved',
        message: `${unapproved} NFT(s) still need approval before activation`,
        stats: {
          total: totalNFTs,
          approved,
          pendingReview,
          rejected,
          pendingGeneration,
          regenerating,
        },
      });
    }

    // Activate the phase
    await prisma.phase.update({
      where: { id: phaseId },
      data: {
        status: 'ACTIVE',
        startDate: new Date(),
      },
    });

    // Update all NFTs in this phase to AVAILABLE status
    await prisma.nFT.updateMany({
      where: {
        phaseId,
        imageReviewStatus: 'APPROVED',
      },
      data: {
        nftStatus: 'AVAILABLE',
        status: 'AVAILABLE',
      },
    });

    // Activate series if not already active
    if (phase.series.status !== 'ACTIVE') {
      await prisma.series.update({
        where: { id: phase.series.id },
        data: {
          status: 'ACTIVE',
          startDate: new Date(),
        },
      });
    }

    // Update site settings with current phase if this is the first activation
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!siteSettings?.currentPhaseId) {
      await prisma.siteSettings.upsert({
        where: { id: 'main' },
        update: {
          currentSeriesId: phase.series.id,
          currentPhaseId: phaseId,
        },
        create: {
          id: 'main',
          currentSeriesId: phase.series.id,
          currentPhaseId: phaseId,
        },
      });
    }

    // Log audit
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'PHASE_ACTIVATE',
          details: JSON.stringify({
            phaseId,
            phaseNumber: phase.phaseNumber,
            seriesNumber: phase.series.seriesNumber,
            totalNFTs,
            approved,
            forced: force || false,
          }),
        },
      });
    } catch {
      // Audit log might not exist
    }

    res.json({
      success: true,
      message: `Series ${phase.series.seriesNumber} Phase ${phase.phaseNumber} is now ACTIVE`,
      phaseId,
      phaseNumber: phase.phaseNumber,
      seriesNumber: phase.series.seriesNumber,
      status: 'ACTIVE',
      nftsActivated: approved,
      startDate: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error activating phase:', error);
    res.status(500).json({ error: 'Failed to activate phase', details: error?.message });
  }
}
