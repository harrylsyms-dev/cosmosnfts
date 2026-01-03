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

    // Get all completed purchases
    const purchases = await prisma.purchase.findMany({
      where: { status: 'COMPLETED' },
    });

    // Calculate stats
    const totalRevenue = purchases.reduce((sum: number, p: { totalAmountCents: number }) => sum + p.totalAmountCents, 0) / 100;
    const totalOrders = purchases.length;
    const totalNftsSold = purchases.reduce((sum: number, p: { nftIds: string | null }) => {
      try {
        const ids = JSON.parse(p.nftIds || '[]');
        return sum + (Array.isArray(ids) ? ids.length : 0);
      } catch {
        return sum;
      }
    }, 0);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPurchases = purchases.filter((p: { createdAt: Date }) => new Date(p.createdAt) >= today);
    const todayRevenue = todayPurchases.reduce((sum: number, p: { totalAmountCents: number }) => sum + p.totalAmountCents, 0) / 100;

    // Get this week's stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekPurchases = purchases.filter((p: { createdAt: Date }) => new Date(p.createdAt) >= weekAgo);
    const weekRevenue = weekPurchases.reduce((sum: number, p: { totalAmountCents: number }) => sum + p.totalAmountCents, 0) / 100;

    // Get this month's stats
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthPurchases = purchases.filter((p: { createdAt: Date }) => new Date(p.createdAt) >= monthStart);
    const monthRevenue = monthPurchases.reduce((sum: number, p: { totalAmountCents: number }) => sum + p.totalAmountCents, 0) / 100;

    // Revenue by day (last 30 days)
    const revenueByDay: { date: string; revenue: number; orders: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayPurchases = purchases.filter((p: { createdAt: Date }) => {
        const pDate = new Date(p.createdAt);
        return pDate >= date && pDate < nextDate;
      });

      revenueByDay.push({
        date: date.toISOString().split('T')[0],
        revenue: dayPurchases.reduce((sum: number, p: { totalAmountCents: number }) => sum + p.totalAmountCents, 0) / 100,
        orders: dayPurchases.length,
      });
    }

    // Benefactor share (30%)
    const benefactorShare = totalRevenue * 0.3;

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalNftsSold,
        todayRevenue,
        todayOrders: todayPurchases.length,
        weekRevenue,
        weekOrders: weekPurchases.length,
        monthRevenue,
        monthOrders: monthPurchases.length,
        benefactorShare,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        revenueByDay,
      },
    });
  } catch (error: any) {
    console.error('Error fetching sales stats:', error);
    res.status(500).json({ error: 'Failed to fetch sales stats', details: error?.message });
  }
}
