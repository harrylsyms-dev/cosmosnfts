import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

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

    const { percent } = req.body;

    if (percent === undefined || percent === null) {
      return res.status(400).json({ error: 'Percent is required' });
    }

    const percentNum = parseFloat(percent);
    if (isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
      return res.status(400).json({ error: 'Percent must be between 0 and 100' });
    }

    await prisma.siteSettings.update({
      where: { id: 'main' },
      data: { phaseIncreasePercent: percentNum },
    });

    // Log audit
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'PHASE_INCREASE_PERCENT_UPDATE',
          details: JSON.stringify({ newPercent: percentNum }),
          ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
        },
      });
    } catch {
      // Audit log table might not exist
    }

    console.log(`Phase increase percent updated to ${percentNum}% by admin: ${admin.email}`);
    res.json({
      success: true,
      message: `Phase increase percent updated to ${percentNum}%`,
      phaseIncreasePercent: percentNum,
    });
  } catch (error: any) {
    console.error('Error updating phase increase percent:', error);
    res.status(500).json({ error: 'Failed to update phase increase percent', details: error?.message });
  }
}
