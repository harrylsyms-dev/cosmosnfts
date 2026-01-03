import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cartItems, email, walletAddress } = req.body;

    if (!cartItems || !email) {
      return res.status(400).json({
        error: 'cartItems and email are required',
      });
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Check if payments are enabled
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });
    const paymentsEnabled = siteSettings?.paymentsEnabled ?? true;

    // Fetch NFTs and verify availability
    const nfts = await prisma.nFT.findMany({
      where: {
        id: { in: cartItems.map((id: number) => parseInt(id.toString())) },
      },
    });

    if (nfts.length !== cartItems.length) {
      return res.status(400).json({ error: 'Some NFTs not found' });
    }

    const unavailable = nfts.filter(
      (nft) => nft.status !== 'AVAILABLE' && nft.status !== 'RESERVED'
    );
    if (unavailable.length > 0) {
      return res.status(400).json({
        error: 'Some NFTs are no longer available',
        unavailable: unavailable.map((n) => n.id),
      });
    }

    // Calculate total (in cents for Stripe)
    const totalDollars = nfts.reduce((sum, nft) => sum + nft.currentPrice, 0);
    const totalCents = Math.round(totalDollars * 100);

    // Create purchase record
    const purchaseId = uuidv4();
    const nftIdsList = cartItems.map((id: number) => parseInt(id.toString()));
    await prisma.purchase.create({
      data: {
        id: purchaseId,
        email,
        walletAddress: walletAddress || null,
        totalAmountCents: totalCents,
        status: 'PENDING',
        nftIds: JSON.stringify(nftIdsList),
      },
    });

    // If payments are disabled, simulate success (test mode)
    if (!paymentsEnabled) {
      console.log(`[TEST MODE] Simulating payment success for purchase: ${purchaseId}`);

      await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: 'PROCESSING',
          stripeTransactionId: `test_${purchaseId}`,
        },
      });

      await prisma.nFT.updateMany({
        where: { id: { in: nftIdsList } },
        data: { status: 'RESERVED' },
      });

      return res.json({
        clientSecret: null,
        amount: totalCents,
        currency: 'usd',
        purchaseId,
        testMode: true,
        message: 'Payments disabled - purchase simulated successfully',
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      receipt_email: email,
      metadata: {
        purchaseId,
        nftIds: JSON.stringify(cartItems),
      },
    });

    // Update purchase with Stripe transaction ID
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { stripeTransactionId: paymentIntent.id },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalCents,
      currency: 'usd',
      requiresAction: paymentIntent.status === 'requires_action',
      purchaseId,
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
}
