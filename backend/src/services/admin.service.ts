import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const SESSION_DURATION_HOURS = 24;
const SALT_ROUNDS = 12;

/**
 * Masks an email address for safe logging.
 * Example: "user@example.com" -> "u***@e***.com"
 */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '***@***.***';
  }

  const [localPart, domain] = email.split('@');
  const [domainName, ...tldParts] = domain.split('.');
  const tld = tldParts.join('.');

  const maskedLocal = localPart.charAt(0) + '***';
  const maskedDomain = domainName.charAt(0) + '***';

  return `${maskedLocal}@${maskedDomain}.${tld}`;
}

interface LoginResult {
  success: boolean;
  token?: string;
  admin?: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  error?: string;
}

interface CreateAdminResult {
  success: boolean;
  admin?: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  error?: string;
}

class AdminService {
  /**
   * Create a new admin user
   */
  async createAdmin(
    email: string,
    password: string,
    name?: string,
    role: string = 'ADMIN'
  ): Promise<CreateAdminResult> {
    try {
      // Check if email already exists
      const existing = await prisma.adminUser.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existing) {
        return { success: false, error: 'Email already registered' };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create admin
      const admin = await prisma.adminUser.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name,
          role,
        },
      });

      logger.info(`Admin created: ${email}`);

      return {
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      };
    } catch (error) {
      logger.error('Failed to create admin:', error);
      return { success: false, error: 'Failed to create admin' };
    }
  }

  /**
   * Login admin user
   */
  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult> {
    try {
      // Find admin
      const admin = await prisma.adminUser.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!admin) {
        // Mask email in logs to prevent sensitive data exposure
        logger.warn(`Login attempt for non-existent email: ${maskEmail(email)}`);
        return { success: false, error: 'Invalid email or password' };
      }

      if (!admin.isActive) {
        logger.warn(`Login attempt for inactive admin: ${maskEmail(email)}`);
        return { success: false, error: 'Account is disabled' };
      }

      // Verify password
      const isValid = await bcrypt.compare(password, admin.passwordHash);

      if (!isValid) {
        logger.warn(`Invalid password attempt for: ${maskEmail(email)}`);
        return { success: false, error: 'Invalid email or password' };
      }

      // Generate session token
      const token = uuidv4() + '-' + uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

      // Create session
      await prisma.adminSession.create({
        data: {
          adminId: admin.id,
          token,
          expiresAt,
          ipAddress,
          userAgent,
        },
      });

      // Update last login
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });

      logger.info(`Admin logged in: ${email}`);

      return {
        success: true,
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      };
    } catch (error) {
      logger.error('Login failed:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  /**
   * Validate session token
   */
  async validateSession(token: string) {
    try {
      const session = await prisma.adminSession.findUnique({
        where: { token },
        include: { admin: true },
      });

      if (!session) {
        return null;
      }

      if (new Date() > session.expiresAt) {
        // Session expired, delete it
        await prisma.adminSession.delete({ where: { id: session.id } });
        return null;
      }

      if (!session.admin.isActive) {
        return null;
      }

      return {
        id: session.admin.id,
        email: session.admin.email,
        name: session.admin.name,
        role: session.admin.role,
      };
    } catch (error) {
      logger.error('Session validation failed:', error);
      return null;
    }
  }

  /**
   * Logout (invalidate session)
   */
  async logout(token: string): Promise<boolean> {
    try {
      await prisma.adminSession.delete({
        where: { token },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.adminSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }

  /**
   * Change password
   */
  async changePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const admin = await prisma.adminUser.findUnique({
        where: { id: adminId },
      });

      if (!admin) {
        return { success: false, error: 'Admin not found' };
      }

      const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);

      if (!isValid) {
        return { success: false, error: 'Current password is incorrect' };
      }

      const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await prisma.adminUser.update({
        where: { id: adminId },
        data: { passwordHash: newHash },
      });

      // Invalidate all sessions
      await prisma.adminSession.deleteMany({
        where: { adminId },
      });

      logger.info(`Password changed for admin: ${admin.email}`);

      return { success: true };
    } catch (error) {
      logger.error('Password change failed:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }

  /**
   * Get all admins
   */
  async getAllAdmins() {
    return prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Disable an admin
   */
  async disableAdmin(adminId: string): Promise<boolean> {
    try {
      await prisma.adminUser.update({
        where: { id: adminId },
        data: { isActive: false },
      });

      // Invalidate all sessions
      await prisma.adminSession.deleteMany({
        where: { adminId },
      });

      return true;
    } catch (error) {
      return false;
    }
  }
}

export const adminService = new AdminService();
