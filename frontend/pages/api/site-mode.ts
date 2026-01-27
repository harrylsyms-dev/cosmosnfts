import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

/**
 * API endpoint to get current site mode
 * Used by middleware to determine redirects
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow caching for 30 seconds to reduce DB calls
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
      select: {
        isLive: true,
        maintenanceMode: true,
        comingSoonMode: true,
        launchDate: true,
        comingSoonTitle: true,
        comingSoonMessage: true,
      },
    });

    if (!settings) {
      // Default to coming soon if no settings
      return res.json({
        mode: 'COMING_SOON',
        isLive: false,
        maintenanceMode: false,
        comingSoonMode: true,
      });
    }

    // Determine current mode
    let mode: 'LIVE' | 'MAINTENANCE' | 'COMING_SOON';

    if (settings.maintenanceMode) {
      mode = 'MAINTENANCE';
    } else if (settings.comingSoonMode && !settings.isLive) {
      mode = 'COMING_SOON';
    } else {
      mode = 'LIVE';
    }

    res.json({
      mode,
      isLive: settings.isLive,
      maintenanceMode: settings.maintenanceMode,
      comingSoonMode: settings.comingSoonMode,
      launchDate: settings.launchDate,
      comingSoonTitle: settings.comingSoonTitle,
      comingSoonMessage: settings.comingSoonMessage,
    });
  } catch (error) {
    console.error('Error fetching site mode:', error);
    // Default to live on error to avoid blocking the site
    res.json({ mode: 'LIVE', isLive: true });
  }
}
