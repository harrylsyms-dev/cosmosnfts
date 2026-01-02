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

export default router;
