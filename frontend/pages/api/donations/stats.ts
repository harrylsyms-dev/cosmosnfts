import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

// Milestone targets in cents
const MILESTONES = {
  launch: 5000000,      // $50,000
  orbit: 10000000,      // $100,000
  deepSpace: 25000000,  // $250,000
  cosmic: 50000000,     // $500,000
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get total manual donations (paid only)
    const manualPayments = await prisma.benefactorPayment.aggregate({
      where: { status: 'PAID' },
      _sum: {
        totalOwedCents: true,
      },
    });

    // Get total crypto donations
    const cryptoPayments = await prisma.smartContractPayment.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: {
        usdValueAtTime: true,
      },
    });

    // Get NFTs sold count
    const nftsSold = await prisma.purchase.count({
      where: {
        status: {
          in: ['MINTED', 'PROCESSING'],
        },
      },
    });

    // Calculate totals
    const manualTotalCents = manualPayments._sum.totalOwedCents || 0;
    const cryptoTotalUsd = cryptoPayments._sum.usdValueAtTime || 0;
    const cryptoTotalCents = Math.round(cryptoTotalUsd * 100);

    const totalDonatedCents = manualTotalCents + cryptoTotalCents;
    const totalDonatedDollars = totalDonatedCents / 100;

    // Format currency
    const totalDonatedFormatted = totalDonatedDollars === 0
      ? '$0'
      : `$${totalDonatedDollars.toLocaleString('en-US', {
          minimumFractionDigits: totalDonatedDollars < 1000 ? 2 : 0,
          maximumFractionDigits: totalDonatedDollars < 1000 ? 2 : 0,
        })}`;

    // Calculate milestone achievements
    const milestones = {
      launch: {
        target: MILESTONES.launch / 100,
        reached: totalDonatedCents >= MILESTONES.launch,
      },
      orbit: {
        target: MILESTONES.orbit / 100,
        reached: totalDonatedCents >= MILESTONES.orbit,
      },
      deepSpace: {
        target: MILESTONES.deepSpace / 100,
        reached: totalDonatedCents >= MILESTONES.deepSpace,
      },
      cosmic: {
        target: MILESTONES.cosmic / 100,
        reached: totalDonatedCents >= MILESTONES.cosmic,
      },
    };

    res.json({
      totalDonated: totalDonatedDollars,
      totalDonatedFormatted,
      nftsSold,
      donationPercentage: 30,
      milestones,
    });
  } catch (error) {
    console.error('Failed to fetch donation stats:', error);
    res.status(500).json({ error: 'Failed to fetch donation stats' });
  }
}
