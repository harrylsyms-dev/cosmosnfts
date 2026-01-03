import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    if (req.method === 'GET') {
      // Get all admin users
      const admins = await prisma.adminUser.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return res.json({
        admins: admins.map((a: any) => ({
          id: a.id,
          email: a.email,
          name: a.name,
          role: a.role,
          privileges: a.privileges,
          lastLoginAt: a.lastLoginAt,
          createdAt: a.createdAt,
          isDisabled: !a.isActive,
        })),
      });
    }

    if (req.method === 'POST') {
      // Create new admin
      const { email, password, name, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      // Check if email already exists
      const existing = await prisma.adminUser.findUnique({
        where: { email },
      });

      if (existing) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      // Normalize role to uppercase
      const normalizedRole = role ? role.toUpperCase().replace(' ', '_') : 'ADMIN';
      const validRole = ['ADMIN', 'SUPER_ADMIN'].includes(normalizedRole) ? normalizedRole : 'ADMIN';

      const newAdmin = await prisma.adminUser.create({
        data: {
          email,
          passwordHash,
          name: name || null,
          role: validRole,
          mustChangePassword: true,
        },
      });

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'ADMIN_CREATE',
            details: `Created admin: ${email} with role: ${validRole}`,
            ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
          },
        });
      } catch {
        // Audit log table might not exist
      }

      console.log(`Admin user created: ${email} by ${admin.email}`);
      return res.json({
        success: true,
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in admin-users:', error);
    res.status(500).json({ error: 'Failed to process request', details: error?.message });
  }
}
