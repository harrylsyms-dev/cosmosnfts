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

// ==================== PHASE TIMER CONTROLS ====================

/**
 * GET /api/admin/phases
 * Get current phase info and all phases
 */
router.get('/phases', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');

    const [activeTier, allTiers, settings] = await Promise.all([
      prisma.tier.findFirst({ where: { active: true } }),
      prisma.tier.findMany({ orderBy: { phase: 'asc' } }),
      siteSettingsService.getSettings(),
    ]);

    if (!activeTier) {
      return res.status(500).json({ error: 'No active tier found' });
    }

    // Calculate time remaining (accounting for pause)
    let timeRemaining = 0;
    const tierEndTime = new Date(activeTier.startTime.getTime() + activeTier.duration * 1000);

    if (settings.phasePaused && settings.pausedAt) {
      // Paused: show time remaining at pause point
      const pauseTime = new Date(settings.pausedAt);
      timeRemaining = Math.max(0, Math.floor((tierEndTime.getTime() - pauseTime.getTime()) / 1000));
    } else {
      // Not paused: calculate normally with pause duration offset
      const adjustedEndTime = new Date(tierEndTime.getTime() + (settings.pauseDurationMs || 0));
      timeRemaining = Math.max(0, Math.floor((adjustedEndTime.getTime() - Date.now()) / 1000));
    }

    const increasePercent = settings.phaseIncreasePercent || 7.5;
    const multiplierBase = 1 + (increasePercent / 100);

    res.json({
      success: true,
      phaseIncreasePercent: increasePercent,
      currentPhase: {
        phase: activeTier.phase,
        price: activeTier.price,
        displayPrice: `$${activeTier.price.toFixed(4)}`,
        quantityAvailable: activeTier.quantityAvailable,
        quantitySold: activeTier.quantitySold,
        startTime: activeTier.startTime,
        duration: activeTier.duration,
        timeRemaining,
        isPaused: settings.phasePaused,
        pausedAt: settings.pausedAt,
      },
      phases: allTiers.map(t => ({
        phase: t.phase,
        price: t.price,
        displayPrice: `$${t.price.toFixed(4)}`,
        multiplier: Math.pow(multiplierBase, t.phase - 1).toFixed(4),
        quantityAvailable: t.quantityAvailable,
        quantitySold: t.quantitySold,
        startTime: t.startTime,
        duration: t.duration,
        active: t.active,
      })),
    });
  } catch (error) {
    logger.error('Error fetching phases:', error);
    res.status(500).json({ error: 'Failed to fetch phases' });
  }
});

/**
 * POST /api/admin/phases/pause
 * Pause the phase timer
 */
router.post('/phases/pause', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');

    const settings = await siteSettingsService.getSettings();

    if (settings.phasePaused) {
      return res.status(400).json({ error: 'Phase timer is already paused' });
    }

    await prisma.siteSettings.update({
      where: { id: 'main' },
      data: {
        phasePaused: true,
        pausedAt: new Date(),
      },
    });

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'PHASE_PAUSE',
        details: JSON.stringify({ pausedAt: new Date().toISOString() }),
        ipAddress: req.ip,
      },
    });

    logger.info(`Phase timer paused by admin: ${req.admin!.email}`);
    res.json({ success: true, message: 'Phase timer paused' });
  } catch (error) {
    logger.error('Error pausing phase timer:', error);
    res.status(500).json({ error: 'Failed to pause phase timer' });
  }
});

/**
 * POST /api/admin/phases/resume
 * Resume the phase timer
 */
router.post('/phases/resume', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');

    const settings = await siteSettingsService.getSettings();

    if (!settings.phasePaused) {
      return res.status(400).json({ error: 'Phase timer is not paused' });
    }

    // Calculate how long we were paused
    const pausedAt = settings.pausedAt ? new Date(settings.pausedAt) : new Date();
    const pauseDuration = Date.now() - pausedAt.getTime();
    const newPauseDurationMs = (settings.pauseDurationMs || 0) + pauseDuration;

    await prisma.siteSettings.update({
      where: { id: 'main' },
      data: {
        phasePaused: false,
        pausedAt: null,
        pauseDurationMs: newPauseDurationMs,
      },
    });

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'PHASE_RESUME',
        details: JSON.stringify({
          pauseDuration: pauseDuration,
          totalPauseDuration: newPauseDurationMs,
        }),
        ipAddress: req.ip,
      },
    });

    logger.info(`Phase timer resumed by admin: ${req.admin!.email}`);
    res.json({
      success: true,
      message: 'Phase timer resumed',
      pauseDurationMs: pauseDuration,
    });
  } catch (error) {
    logger.error('Error resuming phase timer:', error);
    res.status(500).json({ error: 'Failed to resume phase timer' });
  }
});

/**
 * POST /api/admin/phases/advance
 * Manually advance to the next phase
 */
router.post('/phases/advance', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { updateNFTPrices } = await import('../services/nft.service');

    // Get current active tier
    const activeTier = await prisma.tier.findFirst({
      where: { active: true },
    });

    if (!activeTier) {
      return res.status(400).json({ error: 'No active tier found' });
    }

    // Get next tier
    const nextTier = await prisma.tier.findFirst({
      where: { phase: activeTier.phase + 1 },
    });

    if (!nextTier) {
      return res.status(400).json({ error: 'Already at the last phase' });
    }

    // Deactivate current tier and activate next
    await prisma.$transaction([
      prisma.tier.update({
        where: { id: activeTier.id },
        data: { active: false },
      }),
      prisma.tier.update({
        where: { id: nextTier.id },
        data: {
          active: true,
          startTime: new Date(),
        },
      }),
    ]);

    // Reset pause duration
    await prisma.siteSettings.update({
      where: { id: 'main' },
      data: {
        phasePaused: false,
        pausedAt: null,
        pauseDurationMs: 0,
      },
    });

    // Update NFT prices with new multiplier
    const settings = await siteSettingsService.getSettings();
    const increasePercent = settings.phaseIncreasePercent || 7.5;
    const newMultiplier = Math.pow(1 + (increasePercent / 100), nextTier.phase - 1);
    await updateNFTPrices(newMultiplier);

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'PHASE_ADVANCE',
        details: JSON.stringify({
          fromPhase: activeTier.phase,
          toPhase: nextTier.phase,
          newMultiplier,
        }),
        ipAddress: req.ip,
      },
    });

    logger.info(`Phase advanced from ${activeTier.phase} to ${nextTier.phase} by admin: ${req.admin!.email}`);
    res.json({
      success: true,
      message: `Advanced to Phase ${nextTier.phase}`,
      newPhase: {
        phase: nextTier.phase,
        price: nextTier.price,
        multiplier: newMultiplier,
      },
    });
  } catch (error) {
    logger.error('Error advancing phase:', error);
    res.status(500).json({ error: 'Failed to advance phase' });
  }
});

/**
 * POST /api/admin/phases/reset
 * Reset the current phase timer (start fresh)
 */
router.post('/phases/reset', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');

    // Get current active tier
    const activeTier = await prisma.tier.findFirst({
      where: { active: true },
    });

    if (!activeTier) {
      return res.status(400).json({ error: 'No active tier found' });
    }

    // Reset the timer - set startTime to now and clear any pause
    await prisma.$transaction([
      prisma.tier.update({
        where: { id: activeTier.id },
        data: { startTime: new Date() },
      }),
      prisma.siteSettings.update({
        where: { id: 'main' },
        data: {
          phasePaused: false,
          pausedAt: null,
          pauseDurationMs: 0,
        },
      }),
    ]);

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'PHASE_RESET',
        details: JSON.stringify({
          phase: activeTier.phase,
          resetAt: new Date().toISOString(),
        }),
        ipAddress: req.ip,
      },
    });

    logger.info(`Phase ${activeTier.phase} timer reset by admin: ${req.admin!.email}`);
    res.json({
      success: true,
      message: `Phase ${activeTier.phase} timer has been reset`,
      newStartTime: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error resetting phase timer:', error);
    res.status(500).json({ error: 'Failed to reset phase timer' });
  }
});

/**
 * PUT /api/admin/phases/increase-percent
 * Update the phase increase percentage
 */
router.put('/phases/increase-percent', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { percent } = req.body;

    if (percent === undefined || percent === null) {
      return res.status(400).json({ error: 'Percent is required' });
    }

    const percentNum = parseFloat(percent);
    if (isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
      return res.status(400).json({ error: 'Percent must be between 0 and 100' });
    }

    await prisma.siteSettings.update({
      where: { id: 'main' },
      data: { phaseIncreasePercent: percentNum },
    });

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'PHASE_INCREASE_PERCENT_UPDATE',
        details: JSON.stringify({ newPercent: percentNum }),
        ipAddress: req.ip,
      },
    });

    logger.info(`Phase increase percent updated to ${percentNum}% by admin: ${req.admin!.email}`);
    res.json({
      success: true,
      message: `Phase increase percent updated to ${percentNum}%`,
      phaseIncreasePercent: percentNum,
    });
  } catch (error) {
    logger.error('Error updating phase increase percent:', error);
    res.status(500).json({ error: 'Failed to update phase increase percent' });
  }
});

/**
 * PUT /api/admin/phases/:phase/end-time
 * Update the end time for a specific phase
 */
router.put('/phases/:phase/end-time', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { phase } = req.params;
    const { endTime } = req.body;

    const phaseNum = parseInt(phase);
    if (isNaN(phaseNum)) {
      return res.status(400).json({ error: 'Invalid phase number' });
    }

    const tier = await prisma.tier.findFirst({
      where: { phase: phaseNum },
    });

    if (!tier) {
      return res.status(404).json({ error: 'Phase not found' });
    }

    // Calculate new duration from start time to new end time
    const newEndTime = new Date(endTime);
    const newDuration = Math.floor((newEndTime.getTime() - tier.startTime.getTime()) / 1000);

    if (newDuration <= 0) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    await prisma.tier.update({
      where: { id: tier.id },
      data: { duration: newDuration },
    });

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'PHASE_END_TIME_UPDATE',
        details: JSON.stringify({
          phase: phaseNum,
          oldDuration: tier.duration,
          newDuration,
          newEndTime: newEndTime.toISOString(),
        }),
        ipAddress: req.ip,
      },
    });

    logger.info(`Phase ${phaseNum} end time updated by admin: ${req.admin!.email}`);
    res.json({
      success: true,
      message: `Phase ${phaseNum} end time updated`,
      newDuration,
      newEndTime,
    });
  } catch (error) {
    logger.error('Error updating phase end time:', error);
    res.status(500).json({ error: 'Failed to update phase end time' });
  }
});

/**
 * PUT /api/admin/phases/:phase/duration
 * Update the duration (in days) for a specific phase
 */
router.put('/phases/:phase/duration', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { phase } = req.params;
    const { durationDays } = req.body;

    const phaseNum = parseInt(phase);
    if (isNaN(phaseNum)) {
      return res.status(400).json({ error: 'Invalid phase number' });
    }

    const days = parseFloat(durationDays);
    if (isNaN(days) || days <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive number' });
    }

    const tier = await prisma.tier.findFirst({
      where: { phase: phaseNum },
    });

    if (!tier) {
      return res.status(404).json({ error: 'Phase not found' });
    }

    // Convert days to seconds
    const newDuration = Math.floor(days * 24 * 60 * 60);
    const oldDuration = tier.duration;

    await prisma.tier.update({
      where: { id: tier.id },
      data: { duration: newDuration },
    });

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'PHASE_DURATION_UPDATE',
        details: JSON.stringify({
          phase: phaseNum,
          oldDurationDays: oldDuration / 86400,
          newDurationDays: days,
        }),
        ipAddress: req.ip,
      },
    });

    logger.info(`Phase ${phaseNum} duration updated to ${days} days by admin: ${req.admin!.email}`);
    res.json({
      success: true,
      message: `Phase ${phaseNum} duration updated to ${days} days`,
      newDurationDays: days,
      newDurationSeconds: newDuration,
    });
  } catch (error) {
    logger.error('Error updating phase duration:', error);
    res.status(500).json({ error: 'Failed to update phase duration' });
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

    // Benefactor share (30%)
    const benefactorShare = totalRevenue * 0.3;

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
        benefactorShare,
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

// ==================== WHITELIST ROUTES ====================

/**
 * GET /api/admin/whitelist
 * Get all whitelisted addresses
 */
router.get('/whitelist', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const addresses = await prisma.whitelistAddress.findMany({
      orderBy: { addedAt: 'desc' },
    });

    // Map to frontend expected format
    const mapped = addresses.map((a) => ({
      id: a.id,
      walletAddress: a.walletAddress,
      email: null,
      note: a.note,
      createdAt: a.addedAt,
    }));

    res.json({ addresses: mapped });
  } catch (error) {
    logger.error('Error fetching whitelist:', error);
    res.status(500).json({ error: 'Failed to fetch whitelist' });
  }
});

/**
 * POST /api/admin/whitelist
 * Add address to whitelist
 */
router.post('/whitelist', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { walletAddress, note } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const address = await prisma.whitelistAddress.create({
      data: {
        walletAddress,
        note: note || null,
        addedBy: req.admin!.email,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'WHITELIST_ADD',
        details: walletAddress,
        ipAddress: req.ip,
      },
    });

    res.status(201).json({ address });
  } catch (error) {
    logger.error('Error adding to whitelist:', error);
    res.status(500).json({ error: 'Failed to add to whitelist' });
  }
});

/**
 * DELETE /api/admin/whitelist/:id
 * Remove address from whitelist
 */
router.delete('/whitelist/:id', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { id } = req.params;

    const address = await prisma.whitelistAddress.delete({
      where: { id },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'WHITELIST_REMOVE',
        details: address.walletAddress,
        ipAddress: req.ip,
      },
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error removing from whitelist:', error);
    res.status(500).json({ error: 'Failed to remove from whitelist' });
  }
});

// ==================== BANNED ADDRESSES ROUTES ====================

/**
 * GET /api/admin/banned-addresses
 * Get all banned addresses
 */
router.get('/banned-addresses', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const addresses = await prisma.bannedAddress.findMany({
      orderBy: { bannedAt: 'desc' },
    });

    res.json({ addresses });
  } catch (error) {
    logger.error('Error fetching banned addresses:', error);
    res.status(500).json({ error: 'Failed to fetch banned addresses' });
  }
});

/**
 * POST /api/admin/banned-addresses
 * Ban an address
 */
router.post('/banned-addresses', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { walletAddress, reason } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const banned = await prisma.bannedAddress.create({
      data: {
        walletAddress,
        reason: reason || null,
        bannedBy: req.admin!.email,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'ADDRESS_BAN',
        details: `${walletAddress} - ${reason || 'No reason'}`,
        ipAddress: req.ip,
      },
    });

    res.status(201).json({ banned });
  } catch (error) {
    logger.error('Error banning address:', error);
    res.status(500).json({ error: 'Failed to ban address' });
  }
});

/**
 * DELETE /api/admin/banned-addresses/:id
 * Unban an address
 */
router.delete('/banned-addresses/:id', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { id } = req.params;

    const banned = await prisma.bannedAddress.delete({
      where: { id },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'ADDRESS_UNBAN',
        details: banned.walletAddress,
        ipAddress: req.ip,
      },
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error unbanning address:', error);
    res.status(500).json({ error: 'Failed to unban address' });
  }
});

// ==================== USER MANAGEMENT ROUTES ====================

/**
 * GET /api/admin/users
 * Get all users with stats
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with purchase stats
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const purchases = await prisma.purchase.findMany({
          where: { walletAddress: user.walletAddress, status: 'COMPLETED' },
        });

        const nftCount = await prisma.nFT.count({
          where: { ownerAddress: user.walletAddress },
        });

        const totalSpentCents = purchases.reduce((sum, p) => sum + p.totalAmountCents, 0);

        return {
          id: user.id,
          walletAddress: user.walletAddress,
          email: user.email,
          createdAt: user.createdAt,
          totalPurchases: purchases.length,
          totalSpentCents,
          nftCount,
        };
      })
    );

    res.json({ users: enrichedUsers });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/users/export
 * Export users as CSV
 */
router.get('/users/export', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Create CSV
    const headers = ['Wallet Address', 'Email', 'Created At'];
    const rows = users.map((u) => [u.walletAddress, u.email || '', u.createdAt.toISOString()]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting users:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

// ==================== AUDIT LOG ROUTES ====================

/**
 * GET /api/admin/audit-logs
 * Get audit logs
 */
router.get('/audit-logs', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const limit = parseInt(req.query.limit as string) || 100;

    const logs = await prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({ logs });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ==================== PASSWORD CHANGE ROUTE ====================

/**
 * POST /api/admin/change-password
 * Change admin password
 */
router.post('/change-password', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const bcrypt = await import('bcryptjs');
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Verify current password
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.admin!.id },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash and update new password
    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.adminUser.update({
      where: { id: req.admin!.id },
      data: { passwordHash: newHash },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'PASSWORD_CHANGE',
        ipAddress: req.ip,
      },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ==================== WALLET & REVENUE CONFIGURATION ====================

/**
 * GET /api/admin/wallet-config
 * Get wallet and revenue split configuration
 */
router.get('/wallet-config', requireAdmin, async (req, res) => {
  try {
    const settings = await siteSettingsService.getSettings();

    res.json({
      success: true,
      config: {
        ownerWalletAddress: settings.ownerWalletAddress,
        benefactorWalletAddress: settings.benefactorWalletAddress,
        benefactorName: settings.benefactorName,
        ownerSharePercent: settings.ownerSharePercent,
        benefactorSharePercent: settings.benefactorSharePercent,
      },
    });
  } catch (error) {
    logger.error('Error fetching wallet config:', error);
    res.status(500).json({ error: 'Failed to fetch wallet configuration' });
  }
});

/**
 * PUT /api/admin/wallet-config
 * Update wallet and revenue split configuration
 */
router.put('/wallet-config', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const {
      ownerWalletAddress,
      benefactorWalletAddress,
      benefactorName,
      ownerSharePercent,
      benefactorSharePercent,
    } = req.body;

    // Validate percentages add up to 100
    if (ownerSharePercent !== undefined && benefactorSharePercent !== undefined) {
      if (ownerSharePercent + benefactorSharePercent !== 100) {
        return res.status(400).json({ error: 'Owner and benefactor shares must add up to 100%' });
      }
    }

    // Validate wallet addresses if provided
    if (ownerWalletAddress && !/^0x[a-fA-F0-9]{40}$/.test(ownerWalletAddress)) {
      return res.status(400).json({ error: 'Invalid owner wallet address' });
    }
    if (benefactorWalletAddress && !/^0x[a-fA-F0-9]{40}$/.test(benefactorWalletAddress)) {
      return res.status(400).json({ error: 'Invalid benefactor wallet address' });
    }

    const updates: any = {};
    if (ownerWalletAddress !== undefined) updates.ownerWalletAddress = ownerWalletAddress;
    if (benefactorWalletAddress !== undefined) updates.benefactorWalletAddress = benefactorWalletAddress;
    if (benefactorName !== undefined) updates.benefactorName = benefactorName;
    if (ownerSharePercent !== undefined) updates.ownerSharePercent = ownerSharePercent;
    if (benefactorSharePercent !== undefined) updates.benefactorSharePercent = benefactorSharePercent;

    const settings = await siteSettingsService.updateSettings(updates);

    // Audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'WALLET_CONFIG_UPDATE',
        details: JSON.stringify(updates),
        ipAddress: req.ip,
      },
    });

    res.json({
      success: true,
      config: {
        ownerWalletAddress: settings.ownerWalletAddress,
        benefactorWalletAddress: settings.benefactorWalletAddress,
        benefactorName: settings.benefactorName,
        ownerSharePercent: settings.ownerSharePercent,
        benefactorSharePercent: settings.benefactorSharePercent,
      },
    });
  } catch (error) {
    logger.error('Error updating wallet config:', error);
    res.status(500).json({ error: 'Failed to update wallet configuration' });
  }
});

// ==================== EMAIL BROADCAST ROUTE ====================

/**
 * POST /api/admin/broadcast
 * Send email broadcast to all users
 */
router.post('/broadcast', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message required' });
    }

    // Get all users with email
    const users = await prisma.user.findMany({
      where: { email: { not: null } },
    });

    // Create broadcast record
    await prisma.emailBroadcast.create({
      data: {
        subject,
        body: message,
        recipientType: 'ALL',
        sentBy: req.admin!.email,
        sentCount: users.length,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'EMAIL_BROADCAST',
        details: `Subject: ${subject}, Recipients: ${users.length}`,
        ipAddress: req.ip,
      },
    });

    // TODO: Actually send emails via SendGrid
    // For now, just log it
    logger.info(`Email broadcast: ${subject} to ${users.length} users`);

    res.json({ success: true, sentCount: users.length });
  } catch (error) {
    logger.error('Error sending broadcast:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// ==================== NFT ADMIN ROUTES ====================

// Badge assignment based on score
function getBadgeForScore(score: number): string {
  if (score >= 425) return 'ELITE';
  if (score >= 400) return 'PREMIUM';
  if (score >= 375) return 'EXCEPTIONAL';
  return 'STANDARD';
}

/**
 * GET /api/admin/nfts
 * Get all NFTs with filtering (admin view - all statuses)
 */
router.get('/nfts', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const {
      page = '1',
      limit = '50',
      offset,
      status,
      badge,
      type,
      search,
      sortBy = 'id',
      sortOrder = 'asc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = offset ? parseInt(offset as string) : (pageNum - 1) * limitNum;

    // Build filter
    const where: any = {};

    // Status filter (all statuses supported)
    if (status && status !== 'all') {
      where.status = status as string;
    }

    // Object type filter
    if (type && type !== 'all') {
      where.objectType = type as string;
    }

    // Search filter
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    // Badge filter
    if (badge && badge !== 'all') {
      const badgeRanges: Record<string, { min: number; max: number }> = {
        ELITE: { min: 425, max: 500 },
        PREMIUM: { min: 400, max: 424 },
        EXCEPTIONAL: { min: 375, max: 399 },
        STANDARD: { min: 250, max: 374 },
      };
      const range = badgeRanges[badge as string];
      if (range) {
        where.OR = [
          { totalScore: { gte: range.min, lte: range.max } },
          { cosmicScore: { gte: range.min, lte: range.max } },
        ];
      }
    }

    // Sort options
    const orderBy: any = {};
    switch (sortBy) {
      case 'score':
        orderBy.totalScore = sortOrder;
        break;
      case 'price':
        orderBy.currentPrice = sortOrder;
        break;
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'id':
      default:
        orderBy.id = sortOrder;
    }

    const [total, nfts, siteSettings, activeTier] = await Promise.all([
      prisma.nFT.count({ where }),
      prisma.nFT.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.siteSettings.findUnique({ where: { id: 'main' } }),
      prisma.tier.findFirst({ where: { active: true } }),
    ]);

    const currentPhase = activeTier?.phase || 1;
    const increasePercent = siteSettings?.phaseIncreasePercent || 7.5;
    const phaseMultiplier = Math.pow(1 + (increasePercent / 100), currentPhase - 1);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      currentPhase,
      phaseMultiplier: phaseMultiplier.toFixed(4),
      items: nfts.map((nft) => {
        const score = nft.totalScore || nft.cosmicScore || 0;
        const price = 0.10 * score * phaseMultiplier;
        return {
          id: nft.id,
          tokenId: nft.tokenId,
          name: nft.name,
          description: nft.description,
          objectType: nft.objectType,
          totalScore: score,
          badgeTier: nft.badgeTier || getBadgeForScore(score),
          currentPrice: price,
          status: nft.status,
          image: nft.image || (nft.imageIpfsHash ? `https://gateway.pinata.cloud/ipfs/${nft.imageIpfsHash}` : null),
        };
      }),
    });
  } catch (error) {
    logger.error('Error fetching admin NFTs:', error);
    res.status(500).json({ error: 'Failed to fetch NFTs' });
  }
});

/**
 * GET /api/admin/nfts/:id
 * Get single NFT with full details (admin view)
 */
router.get('/nfts/:id', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const id = parseInt(req.params.id);

    const [nft, siteSettings, activeTier] = await Promise.all([
      prisma.nFT.findUnique({ where: { id } }),
      prisma.siteSettings.findUnique({ where: { id: 'main' } }),
      prisma.tier.findFirst({ where: { active: true } }),
    ]);

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    const currentPhase = activeTier?.phase || 1;
    const increasePercent = siteSettings?.phaseIncreasePercent || 7.5;
    const phaseMultiplier = Math.pow(1 + (increasePercent / 100), currentPhase - 1);
    const score = nft.totalScore || nft.cosmicScore || 0;
    const price = 0.10 * score * phaseMultiplier;

    res.json({
      success: true,
      nft: {
        id: nft.id,
        tokenId: nft.tokenId,
        name: nft.name,
        description: nft.description,
        objectType: nft.objectType,
        status: nft.status,
        // Score breakdown
        totalScore: score,
        scores: {
          fameVisibility: nft.fameVisibility || nft.fameScore || 0,
          scientificSignificance: nft.scientificSignificance || nft.significanceScore || 0,
          rarity: nft.rarity || nft.rarityScore || 0,
          discoveryRecency: nft.discoveryRecency || nft.discoveryRecencyScore || 0,
          culturalImpact: nft.culturalImpact || nft.culturalImpactScore || 0,
        },
        discoveryYear: nft.discoveryYear,
        badgeTier: nft.badgeTier || getBadgeForScore(score),
        // Pricing
        currentPrice: price,
        displayPrice: `$${price.toFixed(2)}`,
        priceFormula: `$0.10 × ${score} × ${phaseMultiplier.toFixed(4)}`,
        currentPhase,
        phaseMultiplier: phaseMultiplier.toFixed(4),
        // Images
        image: nft.image || (nft.imageIpfsHash ? `https://gateway.pinata.cloud/ipfs/${nft.imageIpfsHash}` : null),
        imageIpfsHash: nft.imageIpfsHash,
        metadataIpfsHash: nft.metadataIpfsHash,
        // Ownership/Blockchain
        ownerAddress: nft.ownerAddress,
        transactionHash: nft.transactionHash,
        // Timestamps
        createdAt: nft.createdAt,
        updatedAt: nft.updatedAt,
        mintedAt: nft.mintedAt,
        soldAt: nft.soldAt,
      },
    });
  } catch (error) {
    logger.error('Error fetching NFT details:', error);
    res.status(500).json({ error: 'Failed to fetch NFT' });
  }
});

/**
 * POST /api/admin/nfts/:id/generate-image
 * Generate image for a single NFT using Leonardo AI
 */
router.post('/nfts/:id/generate-image', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { leonardoService } = await import('../services/leonardo.service');
    const id = parseInt(req.params.id);

    const nft = await prisma.nFT.findUnique({ where: { id } });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Check if Leonardo API key is configured
    if (!process.env.LEONARDO_AI_API_KEY) {
      return res.status(400).json({ error: 'Leonardo AI API key not configured' });
    }

    // Start generation in background (don't wait for completion)
    const nftData = {
      tokenId: nft.tokenId,
      name: nft.name,
      description: nft.description,
      fameScore: nft.fameScore,
      significanceScore: nft.significanceScore,
      rarityScore: nft.rarityScore,
      discoveryRecencyScore: nft.discoveryRecencyScore,
      culturalImpactScore: nft.culturalImpactScore,
      totalScore: nft.totalScore,
      objectType: nft.objectType || undefined,
    };

    // Start generation asynchronously
    leonardoService.generateImage(nftData)
      .then(async (imageIpfsHash) => {
        // Generate metadata
        const metadataIpfsHash = await leonardoService.generateMetadata(nftData, imageIpfsHash);

        // Update database
        await prisma.nFT.update({
          where: { id },
          data: {
            imageIpfsHash,
            metadataIpfsHash,
            image: `https://gateway.pinata.cloud/ipfs/${imageIpfsHash}`,
          },
        });

        logger.info(`Generated image for NFT #${nft.tokenId}: ${imageIpfsHash}`);
      })
      .catch((error) => {
        logger.error(`Failed to generate image for NFT #${nft.tokenId}:`, error);
      });

    res.json({
      success: true,
      message: `Image generation started for "${nft.name}". This may take 1-2 minutes.`,
    });
  } catch (error) {
    logger.error('Error starting image generation:', error);
    res.status(500).json({ error: 'Failed to start image generation' });
  }
});

// ==================== ADMIN USER MANAGEMENT ====================

/**
 * GET /api/admin/admin-users
 * Get all admin users (super_admin only)
 */
router.get('/admin-users', requireSuperAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');

    const admins = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      admins: admins.map((admin) => ({
        id: admin.id,
        email: admin.email,
        role: admin.role,
        privileges: admin.privileges,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
        isDisabled: !admin.isActive,
      })),
    });
  } catch (error) {
    logger.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

/**
 * POST /api/admin/admin-users
 * Create a new admin user (super_admin only)
 */
router.post('/admin-users', requireSuperAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const bcrypt = await import('bcryptjs');
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if email already exists
    const existing = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        role: role || 'admin',
      },
    });

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'ADMIN_CREATE',
        details: `Created admin: ${email} with role: ${role || 'admin'}`,
        ipAddress: req.ip,
      },
    });

    logger.info(`Admin user created: ${email} by ${req.admin!.email}`);
    res.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    logger.error('Error creating admin:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

/**
 * PUT /api/admin/admin-users/:id/toggle
 * Enable/disable an admin user (super_admin only)
 */
router.put('/admin-users/:id/toggle', requireSuperAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { id } = req.params;
    const { disabled } = req.body;

    // Can't disable yourself
    if (id === req.admin!.id) {
      return res.status(400).json({ error: 'Cannot disable yourself' });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    await prisma.adminUser.update({
      where: { id },
      data: { isActive: !disabled },
    });

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: disabled ? 'ADMIN_DISABLE' : 'ADMIN_ENABLE',
        details: `${disabled ? 'Disabled' : 'Enabled'} admin: ${admin.email}`,
        ipAddress: req.ip,
      },
    });

    logger.info(`Admin ${admin.email} ${disabled ? 'disabled' : 'enabled'} by ${req.admin!.email}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error toggling admin:', error);
    res.status(500).json({ error: 'Failed to update admin' });
  }
});

/**
 * DELETE /api/admin/admin-users/:id
 * Delete an admin user (super_admin only)
 */
router.delete('/admin-users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { id } = req.params;

    // Can't delete yourself
    if (id === req.admin!.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    await prisma.adminUser.delete({
      where: { id },
    });

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'ADMIN_DELETE',
        details: `Deleted admin: ${admin.email}`,
        ipAddress: req.ip,
      },
    });

    logger.info(`Admin ${admin.email} deleted by ${req.admin!.email}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// ==================== CONTRACT INFO ====================

/**
 * GET /api/admin/contract-info
 * Get smart contract information
 */
router.get('/contract-info', requireAdmin, async (req, res) => {
  try {
    res.json({
      contract: {
        address: process.env.CONTRACT_ADDRESS || null,
        network: process.env.NETWORK || 'Polygon Amoy',
        explorerUrl: process.env.EXPLORER_URL || 'https://amoy.polygonscan.com',
      },
    });
  } catch (error) {
    logger.error('Error fetching contract info:', error);
    res.status(500).json({ error: 'Failed to fetch contract info' });
  }
});

/**
 * GET /api/admin/config-info
 * Get system configuration status (read-only)
 */
router.get('/config-info', requireAdmin, async (req, res) => {
  try {
    res.json({
      config: {
        email: {
          provider: 'SendGrid',
          configured: !!(process.env.SENDGRID_API_KEY),
        },
        stripe: {
          configured: !!(process.env.STRIPE_SECRET_KEY),
          mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'live' : 'test',
        },
        ipfs: {
          provider: 'Pinata',
          configured: !!(process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY),
        },
        blockchain: {
          network: process.env.NETWORK || 'Polygon Amoy',
          contractAddress: process.env.CONTRACT_ADDRESS || null,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching config info:', error);
    res.status(500).json({ error: 'Failed to fetch config info' });
  }
});

/**
 * GET /api/admin/settings/export
 * Export all admin-configurable settings
 */
router.get('/settings/export', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');

    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    const marketplaceSettings = await prisma.marketplaceSettings.findUnique({
      where: { id: 'main' },
    });

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'SETTINGS_EXPORT',
        details: 'Exported settings',
        ipAddress: req.ip,
      },
    });

    res.json({
      exportedAt: new Date().toISOString(),
      version: '1.0',
      siteSettings: siteSettings ? {
        isLive: siteSettings.isLive,
        maintenanceMode: siteSettings.maintenanceMode,
        comingSoonMode: siteSettings.comingSoonMode,
        comingSoonTitle: siteSettings.comingSoonTitle,
        comingSoonMessage: siteSettings.comingSoonMessage,
        comingSoonHtml: siteSettings.comingSoonHtml,
        maintenanceHtml: siteSettings.maintenanceHtml,
        phaseIncreasePercent: siteSettings.phaseIncreasePercent,
        ownerWalletAddress: siteSettings.ownerWalletAddress,
        benefactorWalletAddress: siteSettings.benefactorWalletAddress,
        benefactorName: siteSettings.benefactorName,
        ownerSharePercent: siteSettings.ownerSharePercent,
        benefactorSharePercent: siteSettings.benefactorSharePercent,
      } : null,
      marketplaceSettings: marketplaceSettings ? {
        tradingEnabled: marketplaceSettings.tradingEnabled,
        listingsEnabled: marketplaceSettings.listingsEnabled,
        offersEnabled: marketplaceSettings.offersEnabled,
        auctionsEnabled: marketplaceSettings.auctionsEnabled,
        creatorRoyaltyPercent: marketplaceSettings.creatorRoyaltyPercent,
        platformFeePercent: marketplaceSettings.platformFeePercent,
      } : null,
    });
  } catch (error) {
    logger.error('Error exporting settings:', error);
    res.status(500).json({ error: 'Failed to export settings' });
  }
});

/**
 * POST /api/admin/settings/import
 * Import previously exported settings
 */
router.post('/settings/import', requireSuperAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { siteSettings, marketplaceSettings } = req.body;

    if (siteSettings) {
      await prisma.siteSettings.upsert({
        where: { id: 'main' },
        update: {
          isLive: siteSettings.isLive,
          maintenanceMode: siteSettings.maintenanceMode,
          comingSoonMode: siteSettings.comingSoonMode,
          comingSoonTitle: siteSettings.comingSoonTitle,
          comingSoonMessage: siteSettings.comingSoonMessage,
          comingSoonHtml: siteSettings.comingSoonHtml,
          maintenanceHtml: siteSettings.maintenanceHtml,
          phaseIncreasePercent: siteSettings.phaseIncreasePercent,
          ownerWalletAddress: siteSettings.ownerWalletAddress,
          benefactorWalletAddress: siteSettings.benefactorWalletAddress,
          benefactorName: siteSettings.benefactorName,
          ownerSharePercent: siteSettings.ownerSharePercent,
          benefactorSharePercent: siteSettings.benefactorSharePercent,
        },
        create: {
          id: 'main',
          ...siteSettings,
        },
      });
    }

    if (marketplaceSettings) {
      await prisma.marketplaceSettings.upsert({
        where: { id: 'main' },
        update: {
          tradingEnabled: marketplaceSettings.tradingEnabled,
          listingsEnabled: marketplaceSettings.listingsEnabled,
          offersEnabled: marketplaceSettings.offersEnabled,
          auctionsEnabled: marketplaceSettings.auctionsEnabled,
          creatorRoyaltyPercent: marketplaceSettings.creatorRoyaltyPercent,
          platformFeePercent: marketplaceSettings.platformFeePercent,
        },
        create: {
          id: 'main',
          ...marketplaceSettings,
        },
      });
    }

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        adminEmail: req.admin!.email,
        action: 'SETTINGS_IMPORT',
        details: 'Imported settings',
        ipAddress: req.ip,
      },
    });

    logger.info(`Settings imported by admin: ${req.admin!.email}`);
    res.json({ success: true, message: 'Settings imported successfully' });
  } catch (error) {
    logger.error('Error importing settings:', error);
    res.status(500).json({ error: 'Failed to import settings' });
  }
});

// ==================== DASHBOARD PREFERENCES ====================

/**
 * GET /api/admin/dashboard-preferences
 * Get dashboard layout preferences for current admin
 */
router.get('/dashboard-preferences', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');

    let prefs = await prisma.adminDashboardPreference.findUnique({
      where: { adminId: req.admin!.id },
    });

    // Create default preferences if not exists
    if (!prefs) {
      prefs = await prisma.adminDashboardPreference.create({
        data: {
          adminId: req.admin!.id,
          layout: '[]',
          starredWidgets: '["sales","orders","nfts","phases"]',
        },
      });
    }

    res.json({
      preferences: {
        layout: JSON.parse(prefs.layout),
        starredWidgets: JSON.parse(prefs.starredWidgets),
      },
    });
  } catch (error) {
    logger.error('Error fetching dashboard preferences:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard preferences' });
  }
});

/**
 * PUT /api/admin/dashboard-preferences
 * Update dashboard layout preferences for current admin
 */
router.put('/dashboard-preferences', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const { layout, starredWidgets } = req.body;

    const prefs = await prisma.adminDashboardPreference.upsert({
      where: { adminId: req.admin!.id },
      update: {
        layout: JSON.stringify(layout || []),
        starredWidgets: JSON.stringify(starredWidgets || []),
      },
      create: {
        adminId: req.admin!.id,
        layout: JSON.stringify(layout || []),
        starredWidgets: JSON.stringify(starredWidgets || []),
      },
    });

    res.json({
      success: true,
      preferences: {
        layout: JSON.parse(prefs.layout),
        starredWidgets: JSON.parse(prefs.starredWidgets),
      },
    });
  } catch (error) {
    logger.error('Error updating dashboard preferences:', error);
    res.status(500).json({ error: 'Failed to update dashboard preferences' });
  }
});

// ==================== SYSTEM STATUS ====================

/**
 * GET /api/admin/system-status
 * Get system health status
 */
router.get('/system-status', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    const axios = (await import('axios')).default;

    const status = {
      database: 'online' as 'online' | 'offline' | 'error',
      stripe: 'offline' as 'online' | 'offline' | 'error',
      ipfs: 'offline' as 'online' | 'offline' | 'error',
      blockchain: 'offline' as 'online' | 'offline' | 'error',
    };

    const details = {
      database: '',
      stripe: '',
      ipfs: '',
      blockchain: '',
    };

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      details.database = 'Connected';
    } catch (e) {
      status.database = 'error';
      details.database = 'Connection failed';
    }

    // Check Stripe - actually verify the key works
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.balance.retrieve();
        status.stripe = 'online';
        details.stripe = 'Connected';
      } catch (e: any) {
        status.stripe = 'error';
        details.stripe = e.message || 'API error';
      }
    } else {
      details.stripe = 'API key not configured';
    }

    // Check IPFS/Pinata - actually verify connectivity
    if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY) {
      try {
        const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
          headers: {
            pinata_api_key: process.env.PINATA_API_KEY,
            pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
          },
          timeout: 5000,
        });
        if (response.status === 200) {
          status.ipfs = 'online';
          details.ipfs = 'Pinata connected';
        }
      } catch (e: any) {
        status.ipfs = 'error';
        details.ipfs = e.message || 'Connection failed';
      }
    } else {
      details.ipfs = 'Pinata credentials not configured';
    }

    // Check blockchain - verify RPC connection
    if (process.env.POLYGON_RPC_URL) {
      try {
        const response = await axios.post(
          process.env.POLYGON_RPC_URL,
          {
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1,
          },
          { timeout: 5000 }
        );
        if (response.data?.result) {
          status.blockchain = 'online';
          const blockNumber = parseInt(response.data.result, 16);
          details.blockchain = `Block #${blockNumber.toLocaleString()}`;
        }
      } catch (e: any) {
        status.blockchain = 'error';
        details.blockchain = e.message || 'RPC connection failed';
      }
    } else {
      details.blockchain = 'RPC URL not configured';
    }

    // Get sandbox mode from site settings
    const siteSettings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });

    res.json({
      status,
      details,
      sandboxMode: siteSettings?.sandboxMode || false,
    });
  } catch (error) {
    logger.error('Error fetching system status:', error);
    res.status(500).json({ error: 'Failed to fetch system status' });
  }
});

// ==================== DASHBOARD STATS ====================

/**
 * GET /api/admin/dashboard-stats
 * Get dashboard statistics
 */
router.get('/dashboard-stats', requireAdmin, async (req, res) => {
  try {
    const { prisma } = await import('../config/database');

    // Get total sales (sum of completed/minted purchases)
    const salesResult = await prisma.purchase.aggregate({
      where: { status: 'MINTED' },
      _sum: { totalAmountCents: true },
    });

    // Get purchase counts
    const [totalOrders, pendingOrders] = await Promise.all([
      prisma.purchase.count(),
      prisma.purchase.count({ where: { status: 'PENDING' } }),
    ]);

    // Get NFT count
    const totalNFTs = await prisma.nFT.count();

    // Get user count
    const totalUsers = await prisma.user.count();

    // Get active auctions count
    const activeAuctions = await prisma.auction.count({
      where: {
        status: 'active',
        endTime: { gt: new Date() },
      },
    });

    res.json({
      stats: {
        totalSales: salesResult._sum?.totalAmountCents || 0,
        totalOrders,
        totalNFTs,
        totalUsers,
        pendingOrders,
        activeAuctions,
      },
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
