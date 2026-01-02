import express from 'express';
import { adminService } from '../services/admin.service';
import { siteSettingsService } from '../services/siteSettings.service';
import { requireAdmin, requireSuperAdmin } from '../middleware/adminAuth';
import { logger } from '../utils/logger';

const router = express.Router();

// ==================== AUTH ROUTES ====================

/**
 * POST /api/admin/login
 * Admin login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await adminService.login(email, password, ipAddress, userAgent);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    // Set cookie for browser clients
    res.cookie('adminToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      token: result.token,
      admin: result.admin,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/admin/logout
 * Admin logout
 */
router.post('/logout', requireAdmin, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.adminToken;
    const token = authHeader?.substring(7) || cookieToken;

    if (token) {
      await adminService.logout(token);
    }

    res.clearCookie('adminToken');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * GET /api/admin/me
 * Get current admin user
 */
router.get('/me', requireAdmin, async (req, res) => {
  res.json({
    success: true,
    admin: req.admin,
  });
});

/**
 * POST /api/admin/change-password
 * Change admin password
 */
router.post('/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const result = await adminService.changePassword(
      req.admin!.id,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.clearCookie('adminToken');
    res.json({ success: true, message: 'Password changed. Please login again.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ==================== ADMIN MANAGEMENT (Super Admin Only) ====================

/**
 * GET /api/admin/users
 * Get all admin users
 */
router.get('/users', requireSuperAdmin, async (req, res) => {
  try {
    const admins = await adminService.getAllAdmins();
    res.json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

/**
 * POST /api/admin/users
 * Create new admin user
 */
router.post('/users', requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const result = await adminService.createAdmin(email, password, name, role);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, admin: result.admin });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

/**
 * POST /api/admin/users/:id/disable
 * Disable an admin user
 */
router.post('/users/:id/disable', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.admin!.id) {
      return res.status(400).json({ error: 'Cannot disable yourself' });
    }

    const success = await adminService.disableAdmin(id);

    if (!success) {
      return res.status(400).json({ error: 'Failed to disable admin' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disable admin' });
  }
});

// ==================== SITE SETTINGS ====================

/**
 * GET /api/admin/settings
 * Get site settings
 */
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await siteSettingsService.getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/admin/settings
 * Update site settings
 */
router.put('/settings', requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    const settings = await siteSettingsService.updateSettings(updates);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * POST /api/admin/settings/go-live
 * Take site live (disable coming soon)
 */
router.post('/settings/go-live', requireAdmin, async (req, res) => {
  try {
    const settings = await siteSettingsService.goLive();
    logger.info(`Site went live by admin: ${req.admin!.email}`);
    res.json({ success: true, settings, message: 'Site is now live!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to go live' });
  }
});

/**
 * POST /api/admin/settings/coming-soon
 * Enable coming soon mode
 */
router.post('/settings/coming-soon', requireAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;
    const settings = await siteSettingsService.enableComingSoon(title, message);
    logger.info(`Coming soon enabled by admin: ${req.admin!.email}`);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enable coming soon' });
  }
});

/**
 * POST /api/admin/settings/maintenance
 * Toggle maintenance mode
 */
router.post('/settings/maintenance', requireAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;

    const settings = enabled
      ? await siteSettingsService.enableMaintenance()
      : await siteSettingsService.disableMaintenance();

    logger.info(`Maintenance mode ${enabled ? 'enabled' : 'disabled'} by: ${req.admin!.email}`);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle maintenance mode' });
  }
});

// ==================== SALES & ORDERS ====================

/**
 * GET /api/admin/sales/stats
 * Get sales statistics
 */
router.get('/sales/stats', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');

    // Get all completed purchases
    const purchases = await prisma.purchase.findMany({
      where: { status: 'COMPLETED' },
    });

    // Calculate stats
    const totalRevenue = purchases.reduce((sum, p) => sum + p.totalAmountCents, 0) / 100;
    const totalOrders = purchases.length;
    const totalNftsSold = purchases.reduce((sum, p) => {
      const ids = JSON.parse(p.nftIds || '[]');
      return sum + (Array.isArray(ids) ? ids.length : 0);
    }, 0);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPurchases = purchases.filter(p => new Date(p.createdAt) >= today);
    const todayRevenue = todayPurchases.reduce((sum, p) => sum + p.totalAmountCents, 0) / 100;

    // Get this week's stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekPurchases = purchases.filter(p => new Date(p.createdAt) >= weekAgo);
    const weekRevenue = weekPurchases.reduce((sum, p) => sum + p.totalAmountCents, 0) / 100;

    // Get this month's stats
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthPurchases = purchases.filter(p => new Date(p.createdAt) >= monthStart);
    const monthRevenue = monthPurchases.reduce((sum, p) => sum + p.totalAmountCents, 0) / 100;

    // Revenue by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const revenueByDay: { date: string; revenue: number; orders: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayPurchases = purchases.filter(p => {
        const pDate = new Date(p.createdAt);
        return pDate >= date && pDate < nextDate;
      });

      revenueByDay.push({
        date: date.toISOString().split('T')[0],
        revenue: dayPurchases.reduce((sum, p) => sum + p.totalAmountCents, 0) / 100,
        orders: dayPurchases.length,
      });
    }

    // TPS share (30%)
    const tpsShare = totalRevenue * 0.3;

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalNftsSold,
        todayRevenue,
        todayOrders: todayPurchases.length,
        weekRevenue,
        weekOrders: weekPurchases.length,
        monthRevenue,
        monthOrders: monthPurchases.length,
        tpsShare,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        revenueByDay,
      },
    });
  } catch (error) {
    logger.error('Error fetching sales stats:', error);
    res.status(500).json({ error: 'Failed to fetch sales stats' });
  }
});

/**
 * GET /api/admin/orders
 * Get all orders with pagination
 */
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { id: { contains: search } },
        { walletAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchase.count({ where }),
    ]);

    res.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        email: order.email,
        walletAddress: order.walletAddress,
        status: order.status,
        totalAmount: order.totalAmountCents / 100,
        nftCount: JSON.parse(order.nftIds || '[]').length,
        stripeId: order.stripeTransactionId,
        createdAt: order.createdAt,
        mintedAt: order.mintedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/admin/orders/:id
 * Get single order details
 */
router.get('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { id } = req.params;

    const order = await prisma.purchase.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get NFT details
    const nftIds = JSON.parse(order.nftIds || '[]');
    const nfts = await prisma.nFT.findMany({
      where: { id: { in: nftIds } },
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        email: order.email,
        walletAddress: order.walletAddress,
        status: order.status,
        totalAmount: order.totalAmountCents / 100,
        stripeId: order.stripeTransactionId,
        createdAt: order.createdAt,
        mintedAt: order.mintedAt,
        nfts: nfts.map(nft => ({
          id: nft.id,
          tokenId: nft.tokenId,
          name: nft.name,
          price: nft.currentPrice,
          status: nft.status,
          transactionHash: nft.transactionHash,
        })),
      },
    });
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
