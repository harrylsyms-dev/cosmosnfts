import cron from 'node-cron';
import { prisma } from '../config/database';
import { updateNFTPrices } from '../services/nft.service';
import { logger } from '../utils/logger';

let isRunning = false;

export function startTierAdvancementJob() {
  // Run every minute to check if tier should advance
  cron.schedule('* * * * *', async () => {
    if (isRunning) {
      logger.debug('Tier advancement job already running, skipping');
      return;
    }

    isRunning = true;

    try {
      // Get current active tier from database
      const activeTier = await prisma.tier.findFirst({
        where: { active: true },
      });

      if (!activeTier) {
        // No active tier, activate phase 1
        const phase1 = await prisma.tier.findFirst({
          where: { phase: 1 },
        });

        if (phase1) {
          await prisma.tier.update({
            where: { id: phase1.id },
            data: { active: true },
          });
          logger.info('Activated Phase 1');
        }
        return;
      }

      // Check if tier has expired
      const tierEndTime = new Date(activeTier.startTime.getTime() + activeTier.duration * 1000);
      const now = new Date();

      if (now >= tierEndTime) {
        // Time to advance to next tier
        const nextTier = await prisma.tier.findFirst({
          where: { phase: activeTier.phase + 1 },
        });

        if (nextTier) {
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
                startTime: now, // Reset start time to now
              },
            }),
          ]);

          logger.info(`Tier advanced to Phase ${nextTier.phase}, new base price: $${nextTier.price.toFixed(2)}`);

          // Update all NFT prices with new multiplier
          const multiplier = Math.pow(1.075, nextTier.phase - 1);
          await updateNFTPrices(multiplier);

          logger.info(`All NFT prices updated with multiplier ${multiplier.toFixed(4)}`);
        } else {
          logger.info('Already at final tier');
        }
      }
    } catch (error) {
      logger.error('Tier advancement job failed:', error);
    } finally {
      isRunning = false;
    }
  });

  logger.info('Tier advancement job started');
}

export function stopTierAdvancementJob() {
  logger.info('Tier advancement job stopped');
}
