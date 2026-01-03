import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// Strict rate limiter for authentication endpoints (login, nonce)
// Prevents brute force attacks on admin/user authentication
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 login attempts per 15 minutes per IP
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    code: 'AUTH_RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json(options.message);
  },
});

// General rate limiter
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
});

// Strict rate limiter for checkout/purchase endpoints
export const checkoutRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 checkout attempts per minute
  message: {
    error: 'Too many checkout attempts, please try again in a minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Checkout rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
});

// API key rate limiter (for future API access)
export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute for API keys
  keyGenerator: (req) => {
    return req.headers['x-api-key'] as string || req.ip || 'unknown';
  },
  message: {
    error: 'API rate limit exceeded.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Cart operations rate limiter
export const cartRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 cart operations per minute
  message: {
    error: 'Too many cart operations, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
