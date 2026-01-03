import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const cart = await prisma.cart.findFirst({
      where: {
        userId: userId as string,
        expiresAt: { gt: new Date() },
      },
      include: {
        items: {
          include: { nft: true },
        },
      },
    });

    if (!cart) {
      return res.json({
        cartId: null,
        items: [],
        itemCount: 0,
        totalPrice: 0,
        expiresAt: null,
      });
    }

    const totalPrice = cart.items.reduce(
      (sum: number, item: { priceAtAdd: number }) => sum + item.priceAtAdd,
      0
    );

    res.json({
      cartId: cart.id,
      items: cart.items.map((item: { nftId: number; nft: { name: string; image: string | null; cosmicScore: number | null }; priceAtAdd: number }) => ({
        nftId: item.nftId,
        name: item.nft.name,
        price: item.priceAtAdd,
        image: item.nft.image,
        score: item.nft.cosmicScore,
      })),
      itemCount: cart.items.length,
      totalPrice,
      expiresAt: cart.expiresAt.getTime() / 1000,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
}
