import { Redis } from '@upstash/redis';

/**
 * Redis client for caching
 * Only initialized if UPSTASH credentials are configured
 */
export const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redis !== null;
}

/**
 * Cache wrapper with automatic fallback
 * If Redis is not configured or fails, fetcher is called directly
 *
 * @param key - Cache key
 * @param fetcher - Function to fetch data if not cached
 * @param ttlSeconds - Time to live in seconds (default: 60)
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  // If Redis not configured, just fetch
  if (!redis) {
    return fetcher();
  }

  try {
    // Try to get from cache
    const cachedValue = await redis.get<T>(key);
    if (cachedValue !== null && cachedValue !== undefined) {
      return cachedValue;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Cache the result (don't await - fire and forget)
    redis.set(key, data, { ex: ttlSeconds }).catch((err) => {
      console.error('Redis set error:', err);
    });

    return data;
  } catch (error) {
    // If cache fails, just fetch
    console.error('Redis cache error:', error);
    return fetcher();
  }
}

/**
 * Invalidate cache by exact key
 */
export async function invalidateCache(key: string): Promise<void> {
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Invalidate cache by pattern (e.g., "nfts:*")
 * Note: Use sparingly - this scans all keys
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache pattern invalidation error:', error);
  }
}

/**
 * Rate limiting using Redis
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param limit - Maximum requests allowed
 * @param windowSeconds - Time window in seconds
 */
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

export async function rateLimit(
  identifier: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  // If no Redis, allow all requests
  if (!redis) {
    return { success: true, remaining: limit, reset: 0 };
  }

  const key = `ratelimit:${identifier}`;
  const now = Date.now();

  try {
    // Get current count
    const current = (await redis.get<number>(key)) || 0;

    if (current >= limit) {
      const ttl = await redis.ttl(key);
      return {
        success: false,
        remaining: 0,
        reset: now + ttl * 1000,
      };
    }

    // Increment count
    const pipeline = redis.pipeline();
    pipeline.incr(key);

    // Set expiry only if this is the first request in the window
    if (current === 0) {
      pipeline.expire(key, windowSeconds);
    }

    await pipeline.exec();

    return {
      success: true,
      remaining: limit - current - 1,
      reset: now + windowSeconds * 1000,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow the request
    return { success: true, remaining: limit, reset: 0 };
  }
}

/**
 * Rate limit middleware wrapper for API routes
 */
export function withRateLimit(
  handler: (req: any, res: any) => Promise<void>,
  limit: number = 100,
  windowSeconds: number = 60
) {
  return async (req: any, res: any) => {
    // Use IP or forwarded IP as identifier
    const identifier =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'anonymous';

    const result = await rateLimit(identifier, limit, windowSeconds);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.reset);

    if (!result.success) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      });
    }

    return handler(req, res);
  };
}
