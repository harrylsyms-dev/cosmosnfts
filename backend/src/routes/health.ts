import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { getProvider } from '../config/blockchain';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/health - Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  const health: {
    status: string;
    timestamp: string;
    uptime: number;
    services: {
      database: string;
      blockchain: string;
    };
    version: string;
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      blockchain: 'unknown',
    },
    version: process.env.npm_package_version || '1.0.0',
  };

  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'connected';
  } catch (error) {
    health.services.database = 'disconnected';
    health.status = 'degraded';
    logger.error('Database health check failed:', error);
  }

  try {
    // Check blockchain connection
    const provider = getProvider();
    const blockNumber = await provider.getBlockNumber();
    health.services.blockchain = `connected (block: ${blockNumber})`;
  } catch (error) {
    health.services.blockchain = 'disconnected';
    health.status = 'degraded';
    logger.error('Blockchain health check failed:', error);
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// GET /api/health/ready - Readiness probe
router.get('/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

// GET /api/health/live - Liveness probe
router.get('/live', (req: Request, res: Response) => {
  res.json({ alive: true });
});

export default router;
