import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory rate limiting storage
// Key: IP address, Value: { count: number, resetTime: number }
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((data, ip) => {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip);
    }
  });
}, CLEANUP_INTERVAL_MS);

/**
 * Get allowed origins for CORS
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Primary app URL from environment
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  // Vercel deployment URLs
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  // Vercel preview URLs pattern (branch deployments)
  if (process.env.VERCEL_BRANCH_URL) {
    origins.push(`https://${process.env.VERCEL_BRANCH_URL}`);
  }

  // Development
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000');
    origins.push('http://127.0.0.1:3000');
  }

  return origins;
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();

  // Direct match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Check for Vercel preview deployment pattern (*.vercel.app)
  const vercelPreviewPattern = /^https:\/\/[a-z0-9-]+-[a-z0-9-]+\.vercel\.app$/;
  if (vercelPreviewPattern.test(origin)) {
    // Optionally restrict to specific project name prefix
    const projectName = process.env.VERCEL_PROJECT_NAME;
    if (projectName) {
      return origin.startsWith(`https://${projectName}-`);
    }
    return true;
  }

  return false;
}

/**
 * Get client IP from request
 */
function getClientIp(req: NextApiRequest): string {
  // Check for forwarded headers (common in production behind proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ips.trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to socket remote address
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Check rate limit for an IP
 * Returns true if request is allowed, false if rate limited
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    // First request or window expired - create new record
    const newRecord = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
    rateLimitStore.set(ip, newRecord);
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: newRecord.resetTime,
    };
  }

  // Increment count
  record.count += 1;

  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Apply security middleware (CORS + Rate Limiting) to auth endpoints
 * Returns true if request should continue, false if response was sent (rate limited or CORS rejected)
 */
export function applyAuthSecurity(
  req: NextApiRequest,
  res: NextApiResponse
): boolean {
  const origin = req.headers.origin;

  // Set CORS headers
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // If origin is not allowed, don't set CORS header (browser will reject)

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');

  // Handle preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    // For preflight, check if origin is allowed
    if (!origin || !isOriginAllowed(origin)) {
      res.status(403).json({ error: 'Origin not allowed' });
      return false;
    }
    return true; // Let the handler send 200 for OPTIONS
  }

  // Apply rate limiting for non-OPTIONS requests
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit.resetTime / 1000).toString());

  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    });
    return false;
  }

  return true;
}

/**
 * Set CORS methods header for the specific endpoint
 */
export function setCorsMethodsHeader(res: NextApiResponse, methods: string): void {
  res.setHeader('Access-Control-Allow-Methods', methods);
}

/**
 * Set CORS headers header for the specific endpoint
 */
export function setCorsAllowedHeaders(res: NextApiResponse, headers: string): void {
  res.setHeader('Access-Control-Allow-Headers', headers);
}
