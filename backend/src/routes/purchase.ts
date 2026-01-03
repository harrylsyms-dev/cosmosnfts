import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { createPaymentIntent } from '../services/stripe.service';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/purchase/checkout - Create payment intent
router.post('/checkout', async (req: Request, res: Response) => {
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
    const purchase = await prisma.purchase.create({
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
      logger.info(`[TEST MODE] Simulating payment success for purchase: ${purchaseId}`);

      // Mark purchase as paid (simulated)
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: 'PROCESSING',
          stripeTransactionId: `test_${purchaseId}`,
        },
      });

      // Reserve the NFTs
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

    // Create Stripe payment intent (normal flow)
    const paymentIntent = await createPaymentIntent(
      totalCents,
      email,
      cartItems,
      purchaseId
    );

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
    logger.error('Error creating checkout:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

// POST /api/purchase/simulate-complete/:purchaseId - Complete a test purchase (only when payments disabled)
router.post('/simulate-complete/:purchaseId', async (req: Request, res: Response) => {
  try {
    const { purchaseId } = req.params;

    // Check if payments are disabled (test mode)
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (siteSettings?.paymentsEnabled !== false) {
      return res.status(403).json({
        error: 'Simulation only available when payments are disabled',
      });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    if (purchase.status !== 'PROCESSING') {
      return res.status(400).json({
        error: `Cannot complete purchase with status: ${purchase.status}`,
      });
    }

    // Mark as minted (simulated)
    const nftIds = JSON.parse(purchase.nftIds) as number[];

    await prisma.$transaction([
      prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: 'MINTED',
          mintedAt: new Date(),
          transactionHash: `0xtest_${purchaseId.replace(/-/g, '')}`,
        },
      }),
      prisma.nFT.updateMany({
        where: { id: { in: nftIds } },
        data: {
          status: 'SOLD',
          transactionHash: `0xtest_${purchaseId.replace(/-/g, '')}`,
          ownerAddress: purchase.walletAddress,
        },
      }),
    ]);

    logger.info(`[TEST MODE] Simulated minting for purchase: ${purchaseId}`);

    res.json({
      success: true,
      message: 'Purchase completed (simulated)',
      purchaseId,
    });
  } catch (error) {
    logger.error('Error simulating purchase completion:', error);
    res.status(500).json({ error: 'Failed to simulate purchase completion' });
  }
});

// GET /api/purchase/:transactionId - Get purchase status
router.get('/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    const purchase = await prisma.purchase.findUnique({
      where: { id: transactionId },
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    // Fetch NFT details
    const nftIds = JSON.parse(purchase.nftIds) as number[];
    const nfts = await prisma.nFT.findMany({
      where: { id: { in: nftIds } },
    });

    res.json({
      transactionId: purchase.id,
      status: purchase.status.toLowerCase(),
      email: purchase.email,
      totalAmount: purchase.totalAmountCents / 100,
      nfts: nfts.map((nft) => ({
        tokenId: nft.tokenId,
        name: nft.name,
        contractAddress: process.env.CONTRACT_ADDRESS,
        transactionHash: nft.transactionHash,
      })),
      mintedAt: purchase.mintedAt?.getTime() || null,
      createdAt: purchase.createdAt.getTime(),
    });
  } catch (error) {
    logger.error('Error fetching purchase:', error);
    res.status(500).json({ error: 'Failed to fetch purchase' });
  }
});

// GET /api/purchase/history/:email - Get purchase history for user
router.get('/history/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const purchases = await prisma.purchase.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      email,
      total: purchases.length,
      purchases: purchases.map((p) => ({
        id: p.id,
        status: p.status,
        totalAmount: p.totalAmountCents / 100,
        nftCount: p.nftIds.length,
        createdAt: p.createdAt,
        mintedAt: p.mintedAt,
      })),
    });
  } catch (error) {
    logger.error('Error fetching purchase history:', error);
    res.status(500).json({ error: 'Failed to fetch purchase history' });
  }
});

export default router;
