import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

/**
 * Admin API: Get all series with their phases
 * GET /api/admin/series
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

    const series = await prisma.series.findMany({
      orderBy: { seriesNumber: 'asc' },
      include: {
        phases: {
          orderBy: { phaseNumber: 'asc' },
          select: {
            id: true,
            phaseNumber: true,
            status: true,
            startDate: true,
            endDate: true,
            isPaused: true,
            pausedAt: true,
            totalPausedMs: true,
            totalNFTs: true,
            approvedCount: true,
            pendingReviewCount: true,
            rejectedCount: true,
          },
        },
      },
    });

    res.json({ series });
  } catch (error: any) {
    console.error('Error fetching series:', error);
    res.status(500).json({ error: 'Failed to fetch series', details: error?.message });
  }
}
