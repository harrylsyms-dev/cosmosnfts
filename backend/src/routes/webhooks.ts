import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe, stripeConfig } from '../config/stripe';
import { prisma } from '../config/database';
import { mintNFTs } from '../services/blockchain.service';
import { sendPurchaseReceipt, sendMintedEmail, sendFailureEmail } from '../services/email.service';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/webhooks/stripe - Stripe webhook handler
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      stripeConfig.webhookSecret
    );
  } catch (error: any) {
    logger.error('Webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.dispute.created':
        await handleDispute(event.data.object as Stripe.Dispute);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const purchaseId = paymentIntent.metadata.purchaseId;
  const email = paymentIntent.metadata.email || paymentIntent.receipt_email;

  logger.info(`Payment succeeded for purchase: ${purchaseId}`);

  // Get purchase record
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
  });

  if (!purchase) {
    logger.error(`Purchase not found: ${purchaseId}`);
    return;
  }

  // Verify amount matches
  if (purchase.totalAmountCents !== paymentIntent.amount) {
    logger.error(`Amount mismatch for purchase ${purchaseId}: expected ${purchase.totalAmountCents}, got ${paymentIntent.amount}`);
    return;
  }

  // Parse nftIds from JSON string
  const nftIds = JSON.parse(purchase.nftIds) as number[];

  // Update purchase status to processing
  await prisma.purchase.update({
    where: { id: purchaseId },
    data: { status: 'PROCESSING' },
  });

  // Send initial receipt
  await sendPurchaseReceipt(email!, purchase);

  // Mint NFTs on blockchain
  try {
    const mintResult = await mintNFTs(nftIds, purchase.walletAddress!);

    // Update purchase and NFTs with minting details
    await prisma.$transaction([
      prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: 'MINTED',
          mintedAt: new Date(),
          transactionHash: mintResult.transactionHash,
        },
      }),
      ...nftIds.map((nftId, index) =>
        prisma.nFT.update({
          where: { id: nftId },
          data: {
            status: 'SOLD',
            tokenId: mintResult.tokenIds[index],
            transactionHash: mintResult.transactionHash,
            ownerAddress: purchase.walletAddress,
          },
        })
      ),
    ]);

    // Send minted confirmation email
    const nfts = await prisma.nFT.findMany({
      where: { id: { in: nftIds } },
    });
    await sendMintedEmail(email!, purchase, nfts, mintResult.transactionHash);

    logger.info(`NFTs minted successfully for purchase: ${purchaseId}`);
  } catch (error) {
    logger.error(`Minting failed for purchase ${purchaseId}:`, error);

    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: 'MINT_FAILED' },
    });

    // Alert admins
    // TODO: Implement admin alerting
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const purchaseId = paymentIntent.metadata.purchaseId;
  const email = paymentIntent.metadata.email || paymentIntent.receipt_email;

  logger.warn(`Payment failed for purchase: ${purchaseId}`);

  // Update purchase status
  await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      status: 'FAILED',
      failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
    },
  });

  // Get purchase to release NFTs
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
  });

  if (purchase) {
    // Parse and release reserved NFTs
    const nftIds = JSON.parse(purchase.nftIds) as number[];
    await prisma.nFT.updateMany({
      where: { id: { in: nftIds } },
      data: { status: 'AVAILABLE' },
    });
  }

  // Send failure email
  await sendFailureEmail(
    email!,
    paymentIntent.last_payment_error?.message || 'Payment was declined'
  );
}

async function handleDispute(dispute: Stripe.Dispute) {
  logger.warn(`Chargeback dispute created: ${dispute.id}`);

  // Get the charge and find the purchase
  const charge = await stripe.charges.retrieve(dispute.charge as string);
  const paymentIntentId = charge.payment_intent as string;

  const purchase = await prisma.purchase.findFirst({
    where: { stripeTransactionId: paymentIntentId },
  });

  if (!purchase) {
    logger.error(`Purchase not found for dispute: ${dispute.id}`);
    return;
  }

  // Store dispute evidence
  await prisma.chargebackEvidence.create({
    data: {
      disputeId: dispute.id,
      purchaseId: purchase.id,
      evidenceJson: JSON.stringify({
        chargeId: charge.id,
        amount: charge.amount,
        email: charge.receipt_email,
        description: charge.description,
        blockchainHash: purchase.transactionHash,
        contractAddress: process.env.CONTRACT_ADDRESS,
        polygonscanUrl: `https://polygonscan.com/tx/${purchase.transactionHash}`,
        orderTime: charge.created,
        nftIds: purchase.nftIds, // Already a JSON string
      }),
    },
  });

  // Update purchase status
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { status: 'DISPUTED' },
  });

  // TODO: Alert admins about the dispute
  logger.warn(`Dispute evidence stored for purchase: ${purchase.id}`);
}

export default router;
