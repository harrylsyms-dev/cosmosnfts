import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { redis, isRedisAvailable } from '../../lib/redis';
import config from '../../lib/config';

// Track server start time for uptime calculation
const startTime = Date.now();

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: string;
  version: string;
  uptime: number;
  checks: {
    database: 'healthy' | 'unhealthy' | 'unconfigured';
    redis: 'healthy' | 'unhealthy' | 'unconfigured';
  };
  latency?: {
    database?: number;
    redis?: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheck>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const health: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.environment,
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      database: 'unconfigured',
      redis: 'unconfigured',
    },
    latency: {},
  };

  // Check database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.latency!.database = Date.now() - dbStart;
    health.checks.database = 'healthy';
  } catch (error) {
    console.error('Health check - database error:', error);
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Redis (if configured)
  if (isRedisAvailable() && redis) {
    try {
      const redisStart = Date.now();
      await redis.ping();
      health.latency!.redis = Date.now() - redisStart;
      health.checks.redis = 'healthy';
    } catch (error) {
      console.error('Health check - redis error:', error);
      health.checks.redis = 'unhealthy';
      // Redis failure is degraded, not unhealthy (app can function without cache)
      if (health.status === 'healthy') {
        health.status = 'degraded';
      }
    }
  }

  // If database is unhealthy, the whole system is unhealthy
  if (health.checks.database === 'unhealthy') {
    health.status = 'unhealthy';
  }

  // Set appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  // Cache control - don't cache health checks
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  return res.status(statusCode).json(health);
}
