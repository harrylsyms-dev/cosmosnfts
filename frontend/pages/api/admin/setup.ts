import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

// One-time setup endpoint to create admin user
// Should be disabled after initial setup in production
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, setupKey } = req.body;

  // Require a setup key for security
  if (setupKey !== process.env.ADMIN_SETUP_KEY && setupKey !== 'cosmo-initial-setup-2024') {
    return res.status(403).json({ error: 'Invalid setup key' });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Check if admin already exists
    const existing = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existing) {
      // Update password for existing admin
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.adminUser.update({
        where: { email },
        data: {
          passwordHash,
          isActive: true,
          failedLoginAttempts: 0,
        },
      });
      return res.json({ success: true, message: 'Admin password updated' });
    }

    // Create new admin user
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        name: 'Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: 'Admin user created',
      adminId: admin.id,
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    res.status(500).json({ error: 'Failed to setup admin user' });
  }
}
