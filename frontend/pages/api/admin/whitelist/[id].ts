import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
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

    const { id } = req.query;

    const address = await prisma.whitelistAddress.delete({
      where: { id: id as string },
    });

    // Log audit
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'WHITELIST_REMOVE',
          details: address.walletAddress,
          ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
        },
      });
    } catch {
      // Audit log table might not exist
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error removing from whitelist:', error);
    res.status(500).json({ error: 'Failed to remove from whitelist', details: error?.message });
  }
}
