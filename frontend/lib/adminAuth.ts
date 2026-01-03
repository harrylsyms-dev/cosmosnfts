import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  mustChangePassword?: boolean;
}

// Token secret for admin authentication - MUST be set in environment
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET;
if (!TOKEN_SECRET && process.env.NODE_ENV === 'production') {
  console.error('CRITICAL: ADMIN_TOKEN_SECRET environment variable is not set!');
}

export function generateToken(adminId: string): string {
  const payload = {
    id: adminId,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function verifyToken(token: string): { id: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.exp < Date.now()) {
      return null;
    }
    return { id: payload.id };
  } catch {
    return null;
  }
}

export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
}

export async function validateAdmin(req: NextApiRequest): Promise<AdminUser | null> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; admin?: AdminUser; error?: string }> {
  const admin = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!admin) {
    return { success: false, error: 'Invalid credentials' };
  }

  if (!admin.isActive) {
    return { success: false, error: 'Account is disabled' };
  }

  const validPassword = await bcrypt.compare(password, admin.passwordHash);
  if (!validPassword) {
    return { success: false, error: 'Invalid credentials' };
  }

  // Update last login
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      lastLoginAt: new Date(),
    },
  });

  const token = generateToken(admin.id);

  // Handle mustChangePassword safely (column may not exist in older databases)
  let mustChangePassword = false;
  try {
    mustChangePassword = (admin as any).mustChangePassword || false;
  } catch {
    mustChangePassword = false;
  }

  return {
    success: true,
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      mustChangePassword,
    },
  };
}

// Middleware wrapper for protected routes
export function withAdmin(
  handler: (req: NextApiRequest, res: NextApiResponse, admin: AdminUser) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const admin = await validateAdmin(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return handler(req, res, admin);
  };
}
