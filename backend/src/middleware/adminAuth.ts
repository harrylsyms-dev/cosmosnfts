import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { logger } from '../utils/logger';

// Extend Express Request to include admin user
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        name: string | null;
        role: string;
      };
    }
  }
}

/**
 * Middleware to require admin authentication
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from header or cookie
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.adminToken;

    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
    }

    // Validate session
    const admin = await adminService.validateSession(token);

    if (!admin) {
      return res.status(401).json({
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION',
      });
    }

    // Attach admin to request
    req.admin = admin;
    next();
  } catch (error) {
    logger.error('Admin auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Middleware to require super admin role
 */
export async function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // First check if admin is authenticated
  await requireAdmin(req, res, () => {
    if (req.admin?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Super admin access required',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }
    next();
  });
}

/**
 * Optional admin auth - doesn't require auth but attaches admin if present
 */
export async function optionalAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.adminToken;

    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (token) {
      const admin = await adminService.validateSession(token);
      if (admin) {
        req.admin = admin;
      }
    }

    next();
  } catch (error) {
    // Continue without admin
    next();
  }
}
