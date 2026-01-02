import express from 'express';
import { siteSettingsService } from '../services/siteSettings.service';

const router = express.Router();

/**
 * GET /api/settings/status
 * Public endpoint to check site status
 */
router.get('/status', async (req, res) => {
  try {
    const settings = await siteSettingsService.getSettings();
    const accessibility = await siteSettingsService.isSiteAccessible();

    res.json({
      accessible: accessibility.accessible,
      reason: accessibility.reason,
      isLive: settings.isLive,
      comingSoonMode: settings.comingSoonMode,
      maintenanceMode: settings.maintenanceMode,
      launchDate: settings.launchDate,
      comingSoonTitle: settings.comingSoonTitle,
      comingSoonMessage: settings.comingSoonMessage,
    });
  } catch (error) {
    // Default to accessible if error
    res.json({
      accessible: true,
      isLive: true,
      comingSoonMode: false,
      maintenanceMode: false,
    });
  }
});

export default router;
