import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface SiteSettings {
  isLive: boolean;
  maintenanceMode: boolean;
  comingSoonMode: boolean;
  launchDate: Date | null;
  comingSoonTitle: string | null;
  comingSoonMessage: string | null;
  // Phase timer controls
  phasePaused: boolean;
  pausedAt: Date | null;
  pauseDurationMs: number;
  contractPaused: boolean;
  // Phase pricing configuration
  phaseIncreasePercent: number;
  // Wallet & Revenue Configuration
  ownerWalletAddress: string | null;
  benefactorWalletAddress: string | null;
  benefactorName: string | null;
  ownerSharePercent: number;
  benefactorSharePercent: number;
}

class SiteSettingsService {
  /**
   * Get current site settings
   */
  async getSettings(): Promise<SiteSettings> {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: 'main',
          isLive: false,
          maintenanceMode: false,
          comingSoonMode: true,
          comingSoonTitle: 'CosmoNFT is Coming Soon',
          comingSoonMessage: 'Own a piece of the universe. Celestial objects immortalized as NFTs. Scientifically scored. Dynamically priced. 30% supports space exploration.',
        },
      });
    }

    return {
      isLive: settings.isLive,
      maintenanceMode: settings.maintenanceMode,
      comingSoonMode: settings.comingSoonMode,
      launchDate: settings.launchDate,
      comingSoonTitle: settings.comingSoonTitle,
      comingSoonMessage: settings.comingSoonMessage,
      phasePaused: settings.phasePaused,
      pausedAt: settings.pausedAt,
      pauseDurationMs: settings.pauseDurationMs,
      contractPaused: settings.contractPaused,
      phaseIncreasePercent: settings.phaseIncreasePercent,
      ownerWalletAddress: settings.ownerWalletAddress,
      benefactorWalletAddress: settings.benefactorWalletAddress,
      benefactorName: settings.benefactorName,
      ownerSharePercent: settings.ownerSharePercent,
      benefactorSharePercent: settings.benefactorSharePercent,
    };
  }

  /**
   * Check if site is accessible to public
   */
  async isSiteAccessible(): Promise<{ accessible: boolean; reason?: string }> {
    const settings = await this.getSettings();

    if (settings.maintenanceMode) {
      return { accessible: false, reason: 'maintenance' };
    }

    if (settings.comingSoonMode && !settings.isLive) {
      return { accessible: false, reason: 'coming_soon' };
    }

    return { accessible: true };
  }

  /**
   * Update site settings
   */
  async updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
    const settings = await prisma.siteSettings.upsert({
      where: { id: 'main' },
      update: updates,
      create: {
        id: 'main',
        ...updates,
      },
    });

    logger.info('Site settings updated:', updates);

    return {
      isLive: settings.isLive,
      maintenanceMode: settings.maintenanceMode,
      comingSoonMode: settings.comingSoonMode,
      launchDate: settings.launchDate,
      comingSoonTitle: settings.comingSoonTitle,
      comingSoonMessage: settings.comingSoonMessage,
      phasePaused: settings.phasePaused,
      pausedAt: settings.pausedAt,
      pauseDurationMs: settings.pauseDurationMs,
      contractPaused: settings.contractPaused,
      phaseIncreasePercent: settings.phaseIncreasePercent,
      ownerWalletAddress: settings.ownerWalletAddress,
      benefactorWalletAddress: settings.benefactorWalletAddress,
      benefactorName: settings.benefactorName,
      ownerSharePercent: settings.ownerSharePercent,
      benefactorSharePercent: settings.benefactorSharePercent,
    };
  }

  /**
   * Go live (disable coming soon mode)
   */
  async goLive(): Promise<SiteSettings> {
    return this.updateSettings({
      isLive: true,
      comingSoonMode: false,
      maintenanceMode: false,
    });
  }

  /**
   * Enable coming soon mode
   */
  async enableComingSoon(title?: string, message?: string): Promise<SiteSettings> {
    return this.updateSettings({
      isLive: false,
      comingSoonMode: true,
      comingSoonTitle: title,
      comingSoonMessage: message,
    });
  }

  /**
   * Enable maintenance mode
   */
  async enableMaintenance(): Promise<SiteSettings> {
    return this.updateSettings({
      maintenanceMode: true,
    });
  }

  /**
   * Disable maintenance mode
   */
  async disableMaintenance(): Promise<SiteSettings> {
    return this.updateSettings({
      maintenanceMode: false,
    });
  }

  /**
   * Set launch date
   */
  async setLaunchDate(date: Date): Promise<SiteSettings> {
    return this.updateSettings({
      launchDate: date,
    });
  }
}

export const siteSettingsService = new SiteSettingsService();
