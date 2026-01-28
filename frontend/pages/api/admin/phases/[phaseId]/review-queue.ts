import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

/**
 * Admin API: Get NFTs pending review for a phase
 * GET /api/admin/phases/[phaseId]/review-queue
 *
 * Query params:
 * - limit: Number of items to return (default: 1)
 * - offset: Skip this many items (default: 0)
 *
 * Returns:
 * - NFTs pending review in queue order
 * - Review statistics for the phase
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
    const limit = parseInt(req.query.limit as string) || 1;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!phaseId || typeof phaseId !== 'string') {
      return res.status(400).json({ error: 'Phase ID is required' });
    }

    // Get phase with series info
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: {
        series: {
          select: {
            seriesNumber: true,
          },
        },
      },
    });

    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' });
    }

    // Get review statistics for this phase
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
    const pendingGeneration = statMap['PENDING_GENERATION'] || 0;
    const pendingReview = statMap['PENDING_REVIEW'] || 0;
    const approved = statMap['APPROVED'] || 0;
    const rejected = statMap['REJECTED'] || 0;
    const regenerating = statMap['REGENERATING'] || 0;

    // Get NFTs pending review, ordered by queue position, then by ID
    const pendingNFTs = await prisma.nFT.findMany({
      where: {
        phaseId,
        imageReviewStatus: 'PENDING_REVIEW',
      },
      orderBy: [
        { reviewQueuePosition: 'asc' },
        { id: 'asc' },
      ],
      take: limit,
      skip: offset,
      select: {
        id: true,
        tokenId: true,
        name: true,
        description: true,
        objectType: true,
        objectCategory: true,
        badgeTier: true,
        totalScore: true,
        image: true,
        imageIpfsHash: true,
        rejectionCount: true,
        rejectionReason: true,
        reviewQueuePosition: true,
        distanceLy: true,
        constellation: true,
        discoveryYear: true,
      },
    });

    // Get total count of pending review items
    const totalPendingReview = await prisma.nFT.count({
      where: {
        phaseId,
        imageReviewStatus: 'PENDING_REVIEW',
      },
    });

    // Calculate position in queue
    const currentPosition = offset + 1;

    res.json({
      phase: {
        id: phase.id,
        phaseNumber: phase.phaseNumber,
        seriesNumber: phase.series.seriesNumber,
        status: phase.status,
      },
      stats: {
        total: totalNFTs,
        pendingGeneration,
        pendingReview,
        approved,
        rejected,
        regenerating,
        approvalRate: totalNFTs > 0 ? Math.round((approved / totalNFTs) * 100) : 0,
        reviewedCount: approved + rejected,
      },
      queue: {
        items: pendingNFTs,
        total: totalPendingReview,
        currentPosition,
        hasMore: offset + limit < totalPendingReview,
      },
    });
  } catch (error: any) {
    console.error('Error fetching review queue:', error);
    res.status(500).json({ error: 'Failed to fetch review queue', details: error?.message });
  }
}
