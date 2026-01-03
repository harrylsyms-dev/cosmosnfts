import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
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

    const [activeTier, allTiers, settings] = await Promise.all([
      prisma.tier.findFirst({ where: { active: true } }),
      prisma.tier.findMany({ orderBy: { phase: 'asc' } }),
      prisma.siteSettings.findUnique({ where: { id: 'main' } }),
    ]);

    if (!activeTier) {
      return res.status(500).json({ error: 'No active tier found' });
    }

    // Calculate time remaining (accounting for pause)
    let timeRemaining = 0;
    const tierEndTime = new Date(activeTier.startTime.getTime() + activeTier.duration * 1000);

    if (settings?.phasePaused && settings?.pausedAt) {
      // Paused: show time remaining at pause point
      const pauseTime = new Date(settings.pausedAt);
      timeRemaining = Math.max(0, Math.floor((tierEndTime.getTime() - pauseTime.getTime()) / 1000));
    } else {
      // Not paused: calculate normally with pause duration offset
      const adjustedEndTime = new Date(tierEndTime.getTime() + (settings?.pauseDurationMs || 0));
      timeRemaining = Math.max(0, Math.floor((adjustedEndTime.getTime() - Date.now()) / 1000));
    }

    const increasePercent = settings?.phaseIncreasePercent || 7.5;
    const multiplierBase = 1 + (increasePercent / 100);

    res.json({
      success: true,
      phaseIncreasePercent: increasePercent,
      currentPhase: {
        phase: activeTier.phase,
        price: activeTier.price,
        displayPrice: `$${activeTier.price.toFixed(4)}`,
        quantityAvailable: activeTier.quantityAvailable,
        quantitySold: activeTier.quantitySold,
        startTime: activeTier.startTime,
        duration: activeTier.duration,
        durationDays: activeTier.duration / 86400,
        timeRemaining,
        isPaused: settings?.phasePaused || false,
        pausedAt: settings?.pausedAt,
      },
      phases: allTiers.map((t: any) => ({
        phase: t.phase,
        price: t.price,
        displayPrice: `$${t.price.toFixed(4)}`,
        multiplier: Math.pow(multiplierBase, t.phase - 1).toFixed(4),
        quantityAvailable: t.quantityAvailable,
        quantitySold: t.quantitySold,
        startTime: t.startTime,
        duration: t.duration,
        durationDays: t.duration / 86400,
        active: t.active,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching phases:', error);
    res.status(500).json({ error: 'Failed to fetch phases', details: error?.message });
  }
}
