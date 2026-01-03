import type { NextApiRequest, NextApiResponse } from 'next';
import { validateAdmin } from '../../../lib/adminAuth';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await validateAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      let settings = await prisma.siteSettings.findUnique({
        where: { id: 'main' },
      });

      if (!settings) {
        // Create default settings
        settings = await prisma.siteSettings.create({
          data: {
            id: 'main',
            isLive: true,
            maintenanceMode: false,
            comingSoonMode: false,
          },
        });
      }

      res.json({ settings });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  } else if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const updates = req.body;

      const settings = await prisma.siteSettings.upsert({
        where: { id: 'main' },
        update: updates,
        create: {
          id: 'main',
          ...updates,
        },
      });

      res.json({ success: true, settings });
    } catch (error) {
      console.error('Failed to update settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
