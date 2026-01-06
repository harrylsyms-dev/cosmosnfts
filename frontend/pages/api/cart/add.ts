import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { calculatePrice, getCurrentSeriesMultiplier } from '../../../lib/pricing';
import { BadgeTier } from '@prisma/client';

const CART_EXPIRY_MINUTES = 30;
const MAX_CART_ITEMS = 5;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nftId, userId } = req.body;

    if (!nftId || !userId) {
      return res.status(400).json({ error: 'nftId and userId are required' });
    }

    // Check if NFT exists and is available
    const nft = await prisma.nFT.findUnique({
      where: { id: parseInt(nftId) },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    if (nft.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'NFT is not available' });
    }

    // Get or create cart
    let cart = await prisma.cart.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: { items: true },
    });

    const expiresAt = new Date(Date.now() + CART_EXPIRY_MINUTES * 60 * 1000);

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          id: uuidv4(),
          userId,
          expiresAt,
        },
        include: { items: true },
      });
    }

    // Check cart limit
    if (cart.items.length >= MAX_CART_ITEMS) {
      return res.status(400).json({
        error: `Maximum ${MAX_CART_ITEMS} items per cart`,
      });
    }

    // Check if NFT already in cart
    const existingItem = cart.items.find((item: { nftId: number }) => item.nftId === parseInt(nftId));
    if (existingItem) {
      return res.status(400).json({ error: 'NFT already in cart' });
    }

    // Get current series multiplier for pricing
    // Price = $0.10 × Score × Tier Multiplier × Series Multiplier
    const seriesMultiplier = await getCurrentSeriesMultiplier(prisma);

    // Calculate price using the correct Series-based pricing formula
    const score = nft.totalScore || 0;
    const badgeTier = (nft.badgeTier as BadgeTier) || 'STANDARD';
    const priceCalculation = calculatePrice(score, badgeTier, seriesMultiplier);
    const calculatedPrice = priceCalculation.priceUsd;

    // Add to cart and reserve NFT
    await prisma.$transaction([
      prisma.cartItem.create({
        data: {
          cartId: cart.id,
          nftId: parseInt(nftId),
          priceAtAdd: calculatedPrice,
        },
      }),
      prisma.nFT.update({
        where: { id: parseInt(nftId) },
        data: { status: 'RESERVED' },
      }),
    ]);

    // Fetch updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: { nft: true },
        },
      },
    });

    const totalPrice = updatedCart!.items.reduce(
      (sum: number, item: { priceAtAdd: number }) => sum + item.priceAtAdd,
      0
    );

    res.json({
      cartId: updatedCart!.id,
      items: updatedCart!.items.map((item: { nftId: number; nft: { name: string }; priceAtAdd: number }) => ({
        nftId: item.nftId,
        name: item.nft.name,
        price: item.priceAtAdd,
        expiresAt: updatedCart!.expiresAt,
      })),
      itemCount: updatedCart!.items.length,
      totalPrice,
      expiresAt: updatedCart!.expiresAt.getTime() / 1000,
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
}
