import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    if (req.method === 'GET') {
      // Get payment history
      const { year, status } = req.query;

      let payments: any[] = [];
      try {
        const where: any = {};
        if (status && status !== 'all') {
          where.status = status;
        }
        if (year) {
          where.year = parseInt(year as string, 10);
        }

        payments = await prisma.benefactorPayment.findMany({
          where,
          orderBy: { month: 'desc' },
        });
      } catch {
        // Table might not exist
      }

      return res.json({
        success: true,
        payments: payments.map((p: any) => ({
          id: p.id,
          month: `${p.year}-${String(p.month).padStart(2, '0')}`,
          amountCents: p.totalOwedCents,
          amount: (p.totalOwedCents || 0) / 100,
          status: p.status,
          paymentMethod: p.paymentMethodName,
          referenceNumber: p.referenceNumber,
          notes: p.notes,
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        })),
      });
    }

    if (req.method === 'POST') {
      // Create a new payment record for a specific month
      const { month: monthStr, amountCents, status, primarySalesCents, auctionSalesCents, primaryRevenueCents, auctionRevenueCents } = req.body;

      if (!monthStr) {
        return res.status(400).json({ error: 'Month is required (YYYY-MM format)' });
      }

      // Validate month format
      if (!/^\d{4}-\d{2}$/.test(monthStr)) {
        return res.status(400).json({ error: 'Month must be in YYYY-MM format' });
      }

      // Parse YYYY-MM into year and month
      const [yearStr, monthNumStr] = monthStr.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthNumStr, 10);

      // Calculate due date (10th of the following month)
      const dueDate = new Date(year, month, 10); // month is 0-indexed, so this is next month

      const payment = await prisma.benefactorPayment.create({
        data: {
          month,
          year,
          primarySalesCents: primarySalesCents || 0,
          auctionSalesCents: auctionSalesCents || 0,
          totalOwedCents: amountCents || 0,
          primaryRevenueCents: primaryRevenueCents || 0,
          auctionRevenueCents: auctionRevenueCents || 0,
          dueDate,
          status: status || 'UNPAID',
        },
      });

      return res.json({
        success: true,
        payment: {
          id: payment.id,
          month: `${payment.year}-${String(payment.month).padStart(2, '0')}`,
          amount: (payment.totalOwedCents || 0) / 100,
          status: payment.status,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in benefactor payments:', error);
    res.status(500).json({ error: 'Failed to process request', details: error?.message });
  }
}
