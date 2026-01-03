import type { NextApiRequest, NextApiResponse } from 'next';
import { validateAdmin } from '../../../lib/adminAuth';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await validateAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [
      totalNFTs,
      soldNFTs,
      totalPurchases,
      pendingPurchases,
      activeAuctions,
      totalUsers,
    ] = await Promise.all([
      prisma.nFT.count(),
      prisma.nFT.count({ where: { status: 'SOLD' } }),
      prisma.purchase.count(),
      prisma.purchase.count({ where: { status: 'PENDING' } }),
      prisma.auction.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count().catch(() => 0),
    ]);

    // Calculate total sales
    const salesAggregate = await prisma.purchase.aggregate({
      _sum: { totalAmountCents: true },
      where: { status: 'COMPLETED' },
    });
    const totalSales = (salesAggregate._sum.totalAmountCents || 0) / 100;

    res.json({
      stats: {
        totalSales,
        totalOrders: totalPurchases,
        totalNFTs,
        totalUsers,
        pendingOrders: pendingPurchases,
        activeAuctions,
        soldNFTs,
      },
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
