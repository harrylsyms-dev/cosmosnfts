import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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

    // Get current active tier
    const activeTier = await prisma.tier.findFirst({
      where: { active: true },
    });

    if (!activeTier) {
      return res.status(400).json({ error: 'No active tier found' });
    }

    // Get next tier
    const nextTier = await prisma.tier.findFirst({
      where: { phase: activeTier.phase + 1 },
    });

    if (!nextTier) {
      return res.status(400).json({ error: 'Already at the last phase' });
    }

    // Deactivate current tier and activate next using transactions
    await prisma.$transaction([
      prisma.tier.update({
        where: { id: activeTier.id },
        data: { active: false },
      }),
      prisma.tier.update({
        where: { id: nextTier.id },
        data: {
          active: true,
          startTime: new Date(),
        },
      }),
    ]);

    // Reset pause duration
    await prisma.siteSettings.update({
      where: { id: 'main' },
      data: {
        phasePaused: false,
        pausedAt: null,
        pauseDurationMs: 0,
      },
    });

    // Get settings for multiplier calculation
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
    const increasePercent = settings?.phaseIncreasePercent || 7.5;
    const newMultiplier = Math.pow(1 + (increasePercent / 100), nextTier.phase - 1);

    // Log audit
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'PHASE_ADVANCE',
          details: JSON.stringify({
            fromPhase: activeTier.phase,
            toPhase: nextTier.phase,
            newMultiplier,
          }),
          ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
        },
      });
    } catch {
      // Audit log table might not exist
    }

    console.log(`Phase advanced from ${activeTier.phase} to ${nextTier.phase} by admin: ${admin.email}`);
    res.json({
      success: true,
      message: `Advanced to Phase ${nextTier.phase}`,
      newPhase: {
        phase: nextTier.phase,
        price: nextTier.price,
        multiplier: newMultiplier,
      },
    });
  } catch (error: any) {
    console.error('Error advancing phase:', error);
    res.status(500).json({ error: 'Failed to advance phase', details: error?.message });
  }
}
