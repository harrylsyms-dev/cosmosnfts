import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
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

    const { phase } = req.query;
    const { durationDays } = req.body;

    const phaseNum = parseInt(phase as string);
    if (isNaN(phaseNum)) {
      return res.status(400).json({ error: 'Invalid phase number' });
    }

    const days = parseFloat(durationDays);
    if (isNaN(days) || days <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive number' });
    }

    const tier = await prisma.tier.findFirst({
      where: { phase: phaseNum },
    });

    if (!tier) {
      return res.status(404).json({ error: 'Phase not found' });
    }

    // Convert days to seconds
    const newDuration = Math.floor(days * 24 * 60 * 60);
    const oldDuration = tier.duration;

    await prisma.tier.update({
      where: { id: tier.id },
      data: { duration: newDuration },
    });

    // Log audit
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'PHASE_DURATION_UPDATE',
          details: JSON.stringify({
            phase: phaseNum,
            oldDurationDays: oldDuration / 86400,
            newDurationDays: days,
          }),
          ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
        },
      });
    } catch {
      // Audit log table might not exist
    }

    console.log(`Phase ${phaseNum} duration updated to ${days} days by admin: ${admin.email}`);
    res.json({
      success: true,
      message: `Phase ${phaseNum} duration updated to ${days} days`,
      newDurationDays: days,
      newDurationSeconds: newDuration,
    });
  } catch (error: any) {
    console.error('Error updating phase duration:', error);
    res.status(500).json({ error: 'Failed to update phase duration', details: error?.message });
  }
}
