import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

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

    // Get total count
    const total = await prisma.nFT.count();

    // Get counts by type
    const typeCounts = await prisma.nFT.groupBy({
      by: ['objectType'],
      _count: true,
      orderBy: { _count: { objectType: 'desc' } },
    });

    // Get counts by tier
    const tierCounts = await prisma.nFT.groupBy({
      by: ['badgeTier'],
      _count: true,
    });

    // Get counts by status
    const statusCounts = await prisma.nFT.groupBy({
      by: ['status'],
      _count: true,
    });

    res.json({
      success: true,
      total,
      typeCounts: typeCounts.map((t: { objectType: string; _count: number }) => ({ objectType: t.objectType, _count: t._count })),
      tierCounts: tierCounts.map((t: { badgeTier: string; _count: number }) => ({ badgeTier: t.badgeTier, _count: t._count })),
      statusCounts: statusCounts.map((s: { status: string; _count: number }) => ({ status: s.status, _count: s._count })),
    });
  } catch (error: any) {
    console.error('Failed to fetch NFT stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error?.message });
  }
}
