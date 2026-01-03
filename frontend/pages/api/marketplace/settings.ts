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
    // Get marketplace settings
    let settings = await prisma.marketplaceSettings.findUnique({
      where: { id: 'main' },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.marketplaceSettings.create({
        data: {
          id: 'main',
          tradingEnabled: false,
          listingsEnabled: false,
          offersEnabled: false,
          auctionsEnabled: true,
        },
      });
    }

    res.json({
      tradingEnabled: settings.tradingEnabled,
      listingsEnabled: settings.listingsEnabled,
      offersEnabled: settings.offersEnabled,
    });
  } catch (error: any) {
    console.error('Failed to fetch marketplace settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}
