import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development or if no secret set
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // Find all expired carts
    const expiredCarts = await prisma.cart.findMany({
      where: {
        expiresAt: { lt: new Date() },
      },
      include: { items: true },
    });

    if (expiredCarts.length === 0) {
      return res.json({ message: 'No expired carts found', cleaned: 0 });
    }

    let cleanedCount = 0;

    for (const cart of expiredCarts) {
      // Get NFT IDs from cart items
      const nftIds = cart.items.map((item: { nftId: number }) => item.nftId);

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

      cleanedCount++;
    }

    res.json({
      message: `Cleaned ${cleanedCount} expired carts`,
      cleaned: cleanedCount,
    });
  } catch (error) {
    console.error('Cart expiry job failed:', error);
    res.status(500).json({ error: 'Cart expiry job failed' });
  }
}
