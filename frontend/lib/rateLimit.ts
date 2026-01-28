import { NextApiResponse } from 'next';

type RateLimitOptions = {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max number of unique tokens to track
};

// Simple in-memory rate limiting (for serverless, consider using Redis in production)
const tokenCache = new Map<string, { count: number; resetTime: number }>();

export default function rateLimit(options: RateLimitOptions) {
  return {
    check: (res: NextApiResponse, limit: number, token: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const now = Date.now();
        const tokenData = tokenCache.get(token);

        // Clean up expired entries periodically
        if (tokenCache.size > options.uniqueTokenPerInterval) {
          const cutoff = now - options.interval;
          const entries = Array.from(tokenCache.entries());
          entries.forEach(([key, value]) => {
            if (value.resetTime < cutoff) {
              tokenCache.delete(key);
            }
          });
        }

        if (!tokenData || tokenData.resetTime < now) {
          // New window
          tokenCache.set(token, {
            count: 1,
            resetTime: now + options.interval,
          });
          res.setHeader('X-RateLimit-Limit', limit);
          res.setHeader('X-RateLimit-Remaining', limit - 1);
          res.setHeader('X-RateLimit-Reset', Math.ceil((now + options.interval) / 1000));
          return resolve();
        }

        tokenData.count += 1;
        const remaining = Math.max(0, limit - tokenData.count);
        const isRateLimited = tokenData.count > limit;

        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', Math.ceil(tokenData.resetTime / 1000));

        if (isRateLimited) {
          res.setHeader('Retry-After', Math.ceil((tokenData.resetTime - now) / 1000));
          return reject(new Error('Rate limit exceeded'));
        }

        return resolve();
      }),
  };
}

// Helper to get client IP
export function getClientIP(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
  }
  return req.socket?.remoteAddress || 'unknown';
}

// Pre-configured rate limiters for different use cases
export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export const authLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 100,
});

export const strictLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
});
