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
    // Get active listings stats
    const activeListings = await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      select: { priceCents: true },
      orderBy: { priceCents: 'asc' },
    });

    const activeListingsCount = activeListings.length;

    if (activeListingsCount === 0) {
      return res.json({
        floorPrice: '$0.00',
        activeListingsCount: 0,
        averagePrice: '$0.00',
      });
    }

    // Floor price (lowest)
    const floorPriceCents = activeListings[0].priceCents;

    // Average price
    const totalPriceCents = activeListings.reduce((sum: number, l: { priceCents: number }) => sum + l.priceCents, 0);
    const averagePriceCents = Math.round(totalPriceCents / activeListingsCount);

    res.json({
      floorPrice: `$${(floorPriceCents / 100).toFixed(2)}`,
      activeListingsCount,
      averagePrice: `$${(averagePriceCents / 100).toFixed(2)}`,
    });
  } catch (error: any) {
    console.error('Failed to fetch floor price:', error);
    res.status(500).json({ error: 'Failed to fetch floor price' });
  }
}
