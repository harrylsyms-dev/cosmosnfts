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

    // Only SUPER_ADMIN can manage admin users
    if (admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { id } = req.query;
    const { disabled } = req.body;

    // Can't disable yourself
    if (id === admin.id) {
      return res.status(400).json({ error: 'Cannot disable yourself' });
    }

    const targetAdmin = await prisma.adminUser.findUnique({
      where: { id: id as string },
    });

    if (!targetAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    await prisma.adminUser.update({
      where: { id: id as string },
      data: { isActive: !disabled },
    });

    // Log audit
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          action: disabled ? 'ADMIN_DISABLE' : 'ADMIN_ENABLE',
          details: `${disabled ? 'Disabled' : 'Enabled'} admin: ${targetAdmin.email}`,
          ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
        },
      });
    } catch {
      // Audit log table might not exist
    }

    console.log(`Admin ${targetAdmin.email} ${disabled ? 'disabled' : 'enabled'} by ${admin.email}`);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error toggling admin:', error);
    res.status(500).json({ error: 'Failed to update admin', details: error?.message });
  }
}
