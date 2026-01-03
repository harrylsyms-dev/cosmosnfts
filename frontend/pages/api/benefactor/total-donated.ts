import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get benefactor settings
    const settings = await prisma.benefactorSettings.findUnique({
      where: { id: 'main' },
    });

    // Get total from paid benefactor payments
    const paidPayments = await prisma.benefactorPayment.aggregate({
      where: { status: 'PAID' },
      _sum: { amountCents: true },
    });

    const totalDonatedCents = paidPayments._sum?.amountCents || 0;
    const percentage = settings?.percentage || 5;

    res.json({
      totalDonated: totalDonatedCents / 100,
      totalDonatedDisplay: `$${(totalDonatedCents / 100).toLocaleString()}`,
      percentage,
    });
  } catch (error: any) {
    console.error('Failed to fetch total donated:', error);
    res.status(500).json({ error: 'Failed to fetch total donated' });
  }
}
