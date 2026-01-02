import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { requireAdmin } from '../middleware/adminAuth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/analytics/dashboard
 * Get complete dashboard analytics (admin only)
 */
router.get('/dashboard', requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getDashboardData();
    res.json(data);
  } catch (error) {
    logger.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/analytics/sales
 * Get sales analytics (admin only)
 */
router.get('/sales', requireAdmin, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await analyticsService.getSalesOverview(days);
    res.json(data);
  } catch (error) {
    logger.error('Error fetching sales analytics:', error);
    res.status(500).json({ error: 'Failed to fetch sales analytics' });
  }
});

/**
 * GET /api/analytics/auctions
 * Get auction analytics (admin only)
 */
router.get('/auctions', requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getAuctionAnalytics();
    res.json(data);
  } catch (error) {
    logger.error('Error fetching auction analytics:', error);
    res.status(500).json({ error: 'Failed to fetch auction analytics' });
  }
});

/**
 * GET /api/analytics/marketplace
 * Get marketplace analytics (admin only)
 */
router.get('/marketplace', requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getMarketplaceAnalytics();
    res.json(data);
  } catch (error) {
    logger.error('Error fetching marketplace analytics:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace analytics' });
  }
});

/**
 * GET /api/analytics/users
 * Get user analytics (admin only)
 */
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getUserAnalytics();
    res.json(data);
  } catch (error) {
    logger.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

/**
 * GET /api/analytics/inventory
 * Get inventory analytics (admin only)
 */
router.get('/inventory', requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getInventoryAnalytics();
    res.json(data);
  } catch (error) {
    logger.error('Error fetching inventory analytics:', error);
    res.status(500).json({ error: 'Failed to fetch inventory analytics' });
  }
});

export default router;
