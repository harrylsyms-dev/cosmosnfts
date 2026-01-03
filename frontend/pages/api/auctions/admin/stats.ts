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
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get auction counts by status
    const [activeCount, endedCount, finalizedCount, totalCount] = await Promise.all([
      prisma.auction.count({ where: { status: 'ACTIVE' } }),
      prisma.auction.count({ where: { status: 'ENDED' } }),
      prisma.auction.count({ where: { status: 'FINALIZED' } }),
      prisma.auction.count(),
    ]);

    // Get total bids
    let totalBids = 0;
    try {
      totalBids = await prisma.auctionBid.count();
    } catch {
      // Table might not exist
    }

    // Get total revenue from finalized auctions
    let totalRevenue = 0;
    try {
      const finalizedAuctions = await prisma.auction.findMany({
        where: { status: 'FINALIZED' },
        select: { currentBidCents: true },
      });
      totalRevenue = finalizedAuctions.reduce((sum: number, a: { currentBidCents: number | null }) => sum + (a.currentBidCents || 0), 0) / 100;
    } catch {
      // Ignore
    }

    res.json({
      success: true,
      stats: {
        active: activeCount,
        ended: endedCount,
        finalized: finalizedCount,
        total: totalCount,
        totalBids,
        totalRevenue,
      },
    });
  } catch (error: any) {
    console.error('Error fetching auction stats:', error);
    res.status(500).json({ error: 'Failed to fetch auction stats', details: error?.message });
  }
}
