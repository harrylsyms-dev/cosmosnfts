import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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

    const { id } = req.query;
    const { paymentMethod, referenceNumber, notes, amountCents } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    const payment = await prisma.benefactorPayment.findUnique({
      where: { id: id as string },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const updated = await prisma.benefactorPayment.update({
      where: { id: id as string },
      data: {
        status: 'PAID',
        paymentMethod,
        referenceNumber: referenceNumber || null,
        notes: notes || null,
        amountCents: amountCents || payment.amountCents,
        paidAt: new Date(),
        paidBy: admin.email,
      },
    });

    // Log audit
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'BENEFACTOR_PAYMENT_MARKED_PAID',
          details: JSON.stringify({
            paymentId: id,
            month: payment.month,
            amount: (updated.amountCents || 0) / 100,
            paymentMethod,
            referenceNumber,
          }),
          ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
        },
      });
    } catch {
      // Audit log table might not exist
    }

    console.log(`Benefactor payment marked as paid: ${payment.month} by ${admin.email}`);
    res.json({
      success: true,
      payment: {
        id: updated.id,
        month: updated.month,
        amount: (updated.amountCents || 0) / 100,
        status: updated.status,
        paymentMethod: updated.paymentMethod,
        referenceNumber: updated.referenceNumber,
        paidAt: updated.paidAt,
      },
    });
  } catch (error: any) {
    console.error('Error marking payment as paid:', error);
    res.status(500).json({ error: 'Failed to mark payment as paid', details: error?.message });
  }
}
