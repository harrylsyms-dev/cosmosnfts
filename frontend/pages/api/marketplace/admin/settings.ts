import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
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
      // Get marketplace settings
      let settings = await prisma.marketplaceSettings.findUnique({
        where: { id: 'main' },
      });

      if (!settings) {
        // Create default settings
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
        success: true,
        settings: {
          tradingEnabled: settings.tradingEnabled,
          listingsEnabled: settings.listingsEnabled,
          offersEnabled: settings.offersEnabled,
          auctionsEnabled: settings.auctionsEnabled,
        },
      });
    } else if (req.method === 'PUT') {
      const { tradingEnabled, listingsEnabled, offersEnabled, auctionsEnabled } = req.body;

      const updateData: any = {};
      if (typeof tradingEnabled === 'boolean') updateData.tradingEnabled = tradingEnabled;
      if (typeof listingsEnabled === 'boolean') updateData.listingsEnabled = listingsEnabled;
      if (typeof offersEnabled === 'boolean') updateData.offersEnabled = offersEnabled;
      if (typeof auctionsEnabled === 'boolean') updateData.auctionsEnabled = auctionsEnabled;

      const settings = await prisma.marketplaceSettings.upsert({
        where: { id: 'main' },
        update: updateData,
        create: {
          id: 'main',
          tradingEnabled: tradingEnabled ?? false,
          listingsEnabled: listingsEnabled ?? false,
          offersEnabled: offersEnabled ?? false,
          auctionsEnabled: auctionsEnabled ?? true,
        },
      });

      res.json({
        success: true,
        settings: {
          tradingEnabled: settings.tradingEnabled,
          listingsEnabled: settings.listingsEnabled,
          offersEnabled: settings.offersEnabled,
          auctionsEnabled: settings.auctionsEnabled,
        },
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error with marketplace settings:', error);
    res.status(500).json({ error: 'Failed to process request', details: error?.message });
  }
}
