import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

let isRunning = false;

export function startCartExpiryJob() {
  // Run every minute to clear expired carts
  cron.schedule('* * * * *', async () => {
    if (isRunning) {
      logger.debug('Cart expiry job already running, skipping');
      return;
    }

    isRunning = true;

    try {
      // Find all expired carts
      const expiredCarts = await prisma.cart.findMany({
        where: {
          expiresAt: { lt: new Date() },
        },
        include: { items: true },
      });

      if (expiredCarts.length === 0) {
        return;
      }

      logger.info(`Found ${expiredCarts.length} expired carts to clean up`);

      for (const cart of expiredCarts) {
        // Get NFT IDs from cart items
        const nftIds = cart.items.map((item) => item.nftId);

        // Transaction: release NFTs and delete cart
        await prisma.$transaction([
          // Release reserved NFTs back to available
          prisma.nFT.updateMany({
            where: {
              id: { in: nftIds },
              status: 'RESERVED',
            },
            data: { status: 'AVAILABLE' },
          }),

          // Delete cart items
          prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
          }),

          // Delete cart
          prisma.cart.delete({
            where: { id: cart.id },
          }),
        ]);

        logger.info(`Expired cart ${cart.id} cleared, ${nftIds.length} NFTs released`);
      }

      logger.info(`Cleared ${expiredCarts.length} expired carts`);
    } catch (error) {
      logger.error('Cart expiry job failed:', error);
    } finally {
      isRunning = false;
    }
  });

  logger.info('Cart expiry job started');
}

export function stopCartExpiryJob() {
  logger.info('Cart expiry job stopped');
}

// Manual cleanup function for admin use
export async function cleanupExpiredCarts(): Promise<number> {
  const expiredCarts = await prisma.cart.findMany({
    where: {
      expiresAt: { lt: new Date() },
    },
    include: { items: true },
  });

  let cleanedCount = 0;

  for (const cart of expiredCarts) {
    const nftIds = cart.items.map((item) => item.nftId);

    await prisma.$transaction([
      prisma.nFT.updateMany({
        where: {
          id: { in: nftIds },
          status: 'RESERVED',
        },
        data: { status: 'AVAILABLE' },
      }),
      prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      }),
      prisma.cart.delete({
        where: { id: cart.id },
      }),
    ]);

    cleanedCount++;
  }

  return cleanedCount;
}
