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
    const { cartItems, email, walletAddress, discountCode } = req.body;

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
      (nft: { status: string }) => nft.status !== 'AVAILABLE' && nft.status !== 'RESERVED'
    );
    if (unavailable.length > 0) {
      return res.status(400).json({
        error: 'Some NFTs are no longer available',
        unavailable: unavailable.map((n: { id: number }) => n.id),
      });
    }

    // Calculate subtotal (in cents for Stripe)
    const subtotalDollars = nfts.reduce((sum: number, nft: { currentPrice: number }) => sum + nft.currentPrice, 0);
    const subtotalCents = Math.round(subtotalDollars * 100);

    // Validate and apply discount code
    let discountCents = 0;
    let appliedDiscountCode: any = null;

    if (discountCode && typeof discountCode === 'string') {
      const code = await prisma.discountCode.findUnique({
        where: { code: discountCode.toUpperCase().trim() },
      });

      if (code && code.isActive) {
        const now = new Date();
        const isValidTime = (!code.startsAt || now >= code.startsAt) &&
                          (!code.expiresAt || now <= code.expiresAt);
        const isUnderLimit = code.maxUses === null || code.usedCount < code.maxUses;
        const meetsMinimum = !code.minPurchaseCents || subtotalCents >= code.minPurchaseCents;

        if (isValidTime && isUnderLimit && meetsMinimum) {
          // Calculate discount
          if (code.discountType === 'PERCENT') {
            discountCents = Math.round((subtotalCents * code.discountValue) / 100);
          } else {
            discountCents = code.discountValue;
          }

          // Apply max discount cap
          if (code.maxDiscountCents && discountCents > code.maxDiscountCents) {
            discountCents = code.maxDiscountCents;
          }

          // Don't allow discount greater than subtotal
          if (discountCents > subtotalCents) {
            discountCents = subtotalCents;
          }

          appliedDiscountCode = code;
        }
      }
    }

    // Calculate final totals
    const discountedSubtotalCents = subtotalCents - discountCents;

    // Add processing fee (2.9% + $0.30) on discounted amount
    // If total is $0 (100% discount), no processing fee
    let processingFeeCents = 0;
    if (discountedSubtotalCents > 0) {
      processingFeeCents = Math.round(discountedSubtotalCents * 0.029 + 30);
    }

    const totalCents = discountedSubtotalCents + processingFeeCents;

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

    // If total is $0 (100% discount), skip Stripe and mark as paid
    if (totalCents === 0) {
      console.log(`[FREE ORDER] 100% discount applied for purchase: ${purchaseId}`);

      // Increment discount code usage
      if (appliedDiscountCode) {
        await prisma.discountCode.update({
          where: { id: appliedDiscountCode.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Mark purchase as processing (ready for minting)
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: 'PROCESSING',
          stripeTransactionId: `free_${purchaseId}`,
        },
      });

      // Reserve NFTs
      await prisma.nFT.updateMany({
        where: { id: { in: nftIdsList } },
        data: { status: 'RESERVED' },
      });

      return res.json({
        clientSecret: null,
        amount: 0,
        currency: 'usd',
        purchaseId,
        freeOrder: true,
        discountApplied: {
          code: appliedDiscountCode?.code,
          discountCents,
        },
        message: 'Order completed - 100% discount applied',
      });
    }

    // If payments are disabled, simulate success (test mode)
    if (!paymentsEnabled) {
      console.log(`[TEST MODE] Simulating payment success for purchase: ${purchaseId}`);

      // Increment discount code usage
      if (appliedDiscountCode) {
        await prisma.discountCode.update({
          where: { id: appliedDiscountCode.id },
          data: { usedCount: { increment: 1 } },
        });
      }

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
        discountApplied: appliedDiscountCode ? {
          code: appliedDiscountCode.code,
          discountCents,
        } : null,
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
        discountCode: appliedDiscountCode?.code || '',
        discountCents: discountCents.toString(),
      },
    });

    // Update purchase with Stripe transaction ID
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { stripeTransactionId: paymentIntent.id },
    });

    // Increment discount code usage after successful payment intent creation
    if (appliedDiscountCode) {
      await prisma.discountCode.update({
        where: { id: appliedDiscountCode.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalCents,
      currency: 'usd',
      requiresAction: paymentIntent.status === 'requires_action',
      purchaseId,
      discountApplied: appliedDiscountCode ? {
        code: appliedDiscountCode.code,
        discountCents,
      } : null,
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
}
