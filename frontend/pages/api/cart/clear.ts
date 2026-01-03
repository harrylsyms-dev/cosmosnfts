import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const cart = await prisma.cart.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: { items: true },
    });

    if (!cart) {
      return res.json({ success: true, message: 'Cart already empty' });
    }

    // Release all NFTs and delete cart items
    const nftIds = cart.items.map((item: { nftId: number }) => item.nftId);

    await prisma.$transaction([
      prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      }),
      prisma.nFT.updateMany({
        where: { id: { in: nftIds } },
        data: { status: 'AVAILABLE' },
      }),
      prisma.cart.delete({
        where: { id: cart.id },
      }),
    ]);

    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
}
