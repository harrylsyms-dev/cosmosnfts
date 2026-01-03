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
          where.month = { startsWith: year as string };
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
          month: p.month,
          amountCents: p.amountCents,
          amount: (p.amountCents || 0) / 100,
          status: p.status,
          paymentMethod: p.paymentMethod,
          referenceNumber: p.referenceNumber,
          notes: p.notes,
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        })),
      });
    }

    if (req.method === 'POST') {
      // Create a new payment record for a specific month
      const { month, amountCents, status } = req.body;

      if (!month) {
        return res.status(400).json({ error: 'Month is required (YYYY-MM format)' });
      }

      // Validate month format
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: 'Month must be in YYYY-MM format' });
      }

      const payment = await prisma.benefactorPayment.create({
        data: {
          month,
          amountCents: amountCents || 0,
          status: status || 'PENDING',
        },
      });

      return res.json({
        success: true,
        payment: {
          id: payment.id,
          month: payment.month,
          amount: (payment.amountCents || 0) / 100,
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
