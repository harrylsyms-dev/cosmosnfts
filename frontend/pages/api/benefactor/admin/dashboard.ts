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

    // Get site settings for benefactor config
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
    const benefactorSharePercent = settings?.benefactorSharePercent || 30;

    // Get all completed purchases
    const purchases = await prisma.purchase.findMany({
      where: { status: 'COMPLETED' },
    });

    const totalRevenue = purchases.reduce((sum: number, p: { totalAmountCents: number }) => sum + p.totalAmountCents, 0) / 100;
    const totalBenefactorAmount = totalRevenue * (benefactorSharePercent / 100);

    // Get benefactor payments made
    let paidPayments: any[] = [];
    let unpaidPayments: any[] = [];
    try {
      const payments = await prisma.benefactorPayment.findMany({
        orderBy: { month: 'desc' },
      });
      paidPayments = payments.filter((p: any) => p.status === 'PAID');
      unpaidPayments = payments.filter((p: any) => p.status !== 'PAID');
    } catch {
      // Table might not exist
    }

    const totalPaid = paidPayments.reduce((sum: number, p: any) => sum + (p.amountCents || 0), 0) / 100;
    const totalUnpaid = totalBenefactorAmount - totalPaid;

    // Calculate monthly breakdown (last 12 months)
    const monthlyBreakdown: { month: string; revenue: number; benefactorShare: number; status: string }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthPurchases = purchases.filter((p: { createdAt: Date }) => {
        const pDate = new Date(p.createdAt);
        return pDate >= monthDate && pDate < nextMonth;
      });

      const monthRevenue = monthPurchases.reduce((sum: number, p: { totalAmountCents: number }) => sum + p.totalAmountCents, 0) / 100;
      const monthBenefactorShare = monthRevenue * (benefactorSharePercent / 100);

      // Check if this month's payment exists and its status
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const existingPayment = paidPayments.find((p: any) => p.month === monthKey) ||
                             unpaidPayments.find((p: any) => p.month === monthKey);

      monthlyBreakdown.push({
        month: monthKey,
        revenue: monthRevenue,
        benefactorShare: monthBenefactorShare,
        status: existingPayment?.status || (monthBenefactorShare > 0 ? 'UNPAID' : 'N/A'),
      });
    }

    // Get current month data
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthPurchases = purchases.filter((p: { createdAt: Date }) => new Date(p.createdAt) >= currentMonthStart);
    const currentMonthRevenue = currentMonthPurchases.reduce((sum: number, p: { totalAmountCents: number }) => sum + p.totalAmountCents, 0) / 100;
    const currentMonthOwed = currentMonthRevenue * (benefactorSharePercent / 100);

    res.json({
      success: true,
      benefactorName: settings?.benefactorName || 'Benefactor',
      benefactorSharePercent,
      totalDonated: {
        total: totalBenefactorAmount,
        paid: totalPaid,
        unpaid: Math.max(0, totalUnpaid),
      },
      currentMonth: {
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        revenue: currentMonthRevenue,
        owed: currentMonthOwed,
      },
      monthlyBreakdown,
      recentPayments: paidPayments.slice(0, 5).map((p: any) => ({
        id: p.id,
        month: p.month,
        amount: (p.amountCents || 0) / 100,
        paidAt: p.paidAt,
        paymentMethod: p.paymentMethod,
        referenceNumber: p.referenceNumber,
      })),
      unpaidCount: unpaidPayments.length,
    });
  } catch (error: any) {
    console.error('Error fetching benefactor dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch benefactor dashboard', details: error?.message });
  }
}
