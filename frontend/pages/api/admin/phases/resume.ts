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

    const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });

    if (!settings?.phasePaused) {
      return res.status(400).json({ error: 'Phase timer is not paused' });
    }

    // Calculate how long we were paused
    const pausedAt = settings.pausedAt ? new Date(settings.pausedAt) : new Date();
    const pauseDuration = Date.now() - pausedAt.getTime();
    const newPauseDurationMs = (settings.pauseDurationMs || 0) + pauseDuration;

    await prisma.siteSettings.update({
      where: { id: 'main' },
      data: {
        phasePaused: false,
        pausedAt: null,
        pauseDurationMs: newPauseDurationMs,
      },
    });

    // Log audit
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'PHASE_RESUME',
          details: JSON.stringify({
            pauseDuration: pauseDuration,
            totalPauseDuration: newPauseDurationMs,
          }),
          ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
        },
      });
    } catch {
      // Audit log table might not exist
    }

    console.log(`Phase timer resumed by admin: ${admin.email}`);
    res.json({
      success: true,
      message: 'Phase timer resumed',
      pauseDurationMs: pauseDuration,
    });
  } catch (error: any) {
    console.error('Error resuming phase timer:', error);
    res.status(500).json({ error: 'Failed to resume phase timer', details: error?.message });
  }
}
