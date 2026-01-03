import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

/**
 * CSRF Protection Middleware using Double Submit Cookie Pattern
 *
 * This works by:
 * 1. Generating a random token and storing it in an HttpOnly cookie
 * 2. The client must send the same token in the X-CSRF-Token header
 * 3. On state-changing requests, we verify the header matches the cookie
 */

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token
 */
function generateToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Middleware to set CSRF token cookie if not present
 */
export function csrfTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check if token cookie exists
  let token = req.cookies[CSRF_COOKIE_NAME];

  if (!token) {
    token = generateToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  // Attach token to response locals for API endpoint to return
  res.locals.csrfToken = token;
  next();
}

/**
 * Middleware to validate CSRF token on state-changing requests
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Skip CSRF for webhook endpoints (they use their own signature verification)
  if (req.path.startsWith('/api/webhooks')) {
    return next();
  }

  // Skip CSRF for auth endpoints (they establish authentication)
  // The nonce/signature flow provides its own protection
  if (req.path === '/api/auth/nonce' || req.path === '/api/auth/verify') {
    return next();
  }

  // Skip CSRF for admin login (uses password authentication)
  if (req.path === '/api/admin/login') {
    return next();
  }

  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;

  // If no CSRF cookie, set one and reject the request
  if (!cookieToken) {
    const newToken = generateToken();
    res.cookie(CSRF_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(403).json({
      error: 'CSRF token missing. Please refresh and try again.',
      code: 'CSRF_TOKEN_MISSING',
    });
  }

  // Validate token
  if (!headerToken || headerToken !== cookieToken) {
    logger.warn('CSRF token mismatch', {
      path: req.path,
      method: req.method,
      hasHeader: !!headerToken,
      hasCookie: !!cookieToken,
    });

    return res.status(403).json({
      error: 'Invalid CSRF token. Please refresh and try again.',
      code: 'CSRF_TOKEN_INVALID',
    });
  }

  next();
}

/**
 * Route handler to get a new CSRF token
 * Clients should call this endpoint to get a token before making state-changing requests
 */
export function getCsrfToken(req: Request, res: Response) {
  let token = req.cookies[CSRF_COOKIE_NAME];

  if (!token) {
    token = generateToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  res.json({ csrfToken: token });
}
