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

  // Require a setup key for security - MUST be set in environment
  if (!process.env.ADMIN_SETUP_KEY || setupKey !== process.env.ADMIN_SETUP_KEY) {
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
      // Update password for existing admin and ensure SUPER_ADMIN role
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.adminUser.update({
        where: { email },
        data: {
          passwordHash,
          isActive: true,
          role: 'SUPER_ADMIN',
        },
      });
      return res.json({ success: true, message: 'Admin password updated and role set to SUPER_ADMIN' });
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
