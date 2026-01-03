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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { id: { contains: search } },
        { walletAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchase.count({ where }),
    ]);

    res.json({
      success: true,
      orders: orders.map((order: any) => {
        let nftCount = 0;
        try {
          const ids = JSON.parse(order.nftIds || '[]');
          nftCount = Array.isArray(ids) ? ids.length : 0;
        } catch {
          nftCount = 0;
        }
        return {
          id: order.id,
          email: order.email,
          walletAddress: order.walletAddress,
          status: order.status,
          totalAmount: order.totalAmountCents / 100,
          nftCount,
          stripeId: order.stripeTransactionId,
          createdAt: order.createdAt,
          mintedAt: order.mintedAt,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders', details: error?.message });
  }
}
