import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings) {
      // Default settings if none exist
      return res.json({
        accessible: true,
        isLive: true,
        comingSoonMode: false,
        maintenanceMode: false,
      });
    }

    // Determine accessibility
    let accessible = true;
    let reason = null;

    if (settings.maintenanceMode) {
      accessible = false;
      reason = 'maintenance';
    } else if (settings.comingSoonMode && !settings.isLive) {
      accessible = false;
      reason = 'coming_soon';
    }

    res.json({
      accessible,
      reason,
      isLive: settings.isLive,
      comingSoonMode: settings.comingSoonMode,
      maintenanceMode: settings.maintenanceMode,
      launchDate: settings.launchDate,
      comingSoonTitle: settings.comingSoonTitle,
      comingSoonMessage: settings.comingSoonMessage,
    });
  } catch (error) {
    console.error('Settings API error:', error);
    // Default to accessible if error
    res.json({
      accessible: true,
      isLive: true,
      comingSoonMode: false,
      maintenanceMode: false,
    });
  }
}
