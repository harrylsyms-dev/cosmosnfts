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
      const preferences = await prisma.adminDashboardPreference.findUnique({
        where: { adminId: admin.id },
      });

      res.json({
        preferences: preferences || {
          layout: '[]',
          starredWidgets: '[]',
        },
      });
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      res.json({
        preferences: {
          layout: '[]',
          starredWidgets: '[]',
        },
      });
    }
  } else if (req.method === 'PUT' || req.method === 'POST') {
    try {
      const { layout, starredWidgets } = req.body;

      const preferences = await prisma.adminDashboardPreference.upsert({
        where: { adminId: admin.id },
        update: {
          layout: JSON.stringify(layout || []),
          starredWidgets: JSON.stringify(starredWidgets || []),
        },
        create: {
          adminId: admin.id,
          layout: JSON.stringify(layout || []),
          starredWidgets: JSON.stringify(starredWidgets || []),
        },
      });

      res.json({ success: true, preferences });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      res.status(500).json({ error: 'Failed to save preferences' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
