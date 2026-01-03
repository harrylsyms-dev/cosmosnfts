import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nftId, userId } = req.body;

    if (!nftId || !userId) {
      return res.status(400).json({ error: 'nftId and userId are required' });
    }

    const cart = await prisma.cart.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: { items: true },
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.find((i: { nftId: number; id: number }) => i.nftId === parseInt(nftId));
    if (!item) {
      return res.status(404).json({ error: 'Item not in cart' });
    }

    // Remove from cart and release NFT
    await prisma.$transaction([
      prisma.cartItem.delete({
        where: { id: item.id },
      }),
      prisma.nFT.update({
        where: { id: parseInt(nftId) },
        data: { status: 'AVAILABLE' },
      }),
    ]);

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
}
