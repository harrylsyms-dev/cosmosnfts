import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import Stripe from 'stripe';
import { buffer } from 'micro';

// Disable Next.js body parsing for this route (required for Stripe webhook signature verification)
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Trigger NFT minting process for a completed purchase
 * This is a placeholder - implement actual minting logic based on your blockchain integration
 */
async function triggerNFTMinting(purchaseId: string, nftIds: number[]): Promise<void> {
  console.log(`[Stripe Webhook] Triggering NFT minting for purchase ${purchaseId}, NFTs: ${nftIds.join(', ')}`);

  // TODO: Implement actual minting logic here
  // This could involve:
  // 1. Calling your smart contract minting function
  // 2. Uploading metadata to IPFS
  // 3. Recording the transaction hash

  // For now, we'll mark NFTs as MINTED in the database
  // In production, this should be done after successful blockchain confirmation
  try {
    await prisma.nFT.updateMany({
      where: { id: { in: nftIds } },
      data: {
        status: 'MINTED',
        mintedAt: new Date(),
      },
    });

    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'MINTED',
        mintedAt: new Date(),
      },
    });

    console.log(`[Stripe Webhook] Successfully marked NFTs as MINTED for purchase ${purchaseId}`);
  } catch (error) {
    console.error(`[Stripe Webhook] Failed to trigger minting for purchase ${purchaseId}:`, error);

    // Update purchase with failure reason
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'MINT_FAILED',
        failureReason: error instanceof Error ? error.message : 'Unknown minting error',
      },
    });

    throw error;
  }
}

/**
 * Handle payment_intent.succeeded event
 * Mark purchase as PAID and trigger NFT minting
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const purchaseId = paymentIntent.metadata?.purchaseId;

  if (!purchaseId) {
    console.error('[Stripe Webhook] payment_intent.succeeded: Missing purchaseId in metadata');
    return;
  }

  console.log(`[Stripe Webhook] Processing payment_intent.succeeded for purchase ${purchaseId}`);

  try {
    // Find the purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) {
      console.error(`[Stripe Webhook] Purchase not found: ${purchaseId}`);
      return;
    }

    // Check if already processed (idempotency)
    if (purchase.status === 'MINTED' || purchase.status === 'PROCESSING') {
      console.log(`[Stripe Webhook] Purchase ${purchaseId} already processed (status: ${purchase.status})`);
      return;
    }

    // Parse NFT IDs
    const nftIds = JSON.parse(purchase.nftIds) as number[];

    // Update purchase status to PROCESSING
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'PROCESSING',
        stripeTransactionId: paymentIntent.id,
      },
    });

    // Update NFT status to RESERVED (being minted)
    await prisma.nFT.updateMany({
      where: { id: { in: nftIds } },
      data: { status: 'RESERVED' },
    });

    console.log(`[Stripe Webhook] Purchase ${purchaseId} marked as PROCESSING, triggering minting`);

    // Trigger NFT minting
    await triggerNFTMinting(purchaseId, nftIds);

  } catch (error) {
    console.error(`[Stripe Webhook] Error handling payment_intent.succeeded for ${purchaseId}:`, error);
    throw error;
  }
}

/**
 * Handle payment_intent.payment_failed event
 * Mark purchase as FAILED and release NFTs back to AVAILABLE
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const purchaseId = paymentIntent.metadata?.purchaseId;

  if (!purchaseId) {
    console.error('[Stripe Webhook] payment_intent.payment_failed: Missing purchaseId in metadata');
    return;
  }

  console.log(`[Stripe Webhook] Processing payment_intent.payment_failed for purchase ${purchaseId}`);

  try {
    // Find the purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) {
      console.error(`[Stripe Webhook] Purchase not found: ${purchaseId}`);
      return;
    }

    // Parse NFT IDs
    const nftIds = JSON.parse(purchase.nftIds) as number[];

    // Get failure reason from payment intent
    const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';

    // Update purchase status to FAILED
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'FAILED',
        failureReason,
      },
    });

    // Release NFTs back to AVAILABLE
    await prisma.nFT.updateMany({
      where: { id: { in: nftIds } },
      data: { status: 'AVAILABLE' },
    });

    // Log payment failure for monitoring
    await prisma.paymentFailure.create({
      data: {
        email: purchase.email,
        stripeTransactionId: paymentIntent.id,
        errorMessage: failureReason,
      },
    });

    console.log(`[Stripe Webhook] Purchase ${purchaseId} marked as FAILED, NFTs released`);

  } catch (error) {
    console.error(`[Stripe Webhook] Error handling payment_intent.payment_failed for ${purchaseId}:`, error);
    throw error;
  }
}

/**
 * Handle charge.refunded event
 * Update purchase status and potentially release NFTs
 */
async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;

  if (!paymentIntentId) {
    console.error('[Stripe Webhook] charge.refunded: Missing payment_intent');
    return;
  }

  console.log(`[Stripe Webhook] Processing charge.refunded for payment intent ${paymentIntentId}`);

  try {
    // Find purchase by Stripe transaction ID
    const purchase = await prisma.purchase.findFirst({
      where: { stripeTransactionId: paymentIntentId },
    });

    if (!purchase) {
      console.error(`[Stripe Webhook] Purchase not found for payment intent: ${paymentIntentId}`);
      return;
    }

    // Check if already refunded (idempotency)
    if (purchase.status === 'REFUNDED') {
      console.log(`[Stripe Webhook] Purchase ${purchase.id} already refunded`);
      return;
    }

    // Parse NFT IDs
    const nftIds = JSON.parse(purchase.nftIds) as number[];

    // Determine if this is a full or partial refund
    const refundedAmount = charge.amount_refunded;
    const isFullRefund = refundedAmount >= charge.amount;

    if (isFullRefund) {
      // Full refund - update purchase status and release NFTs
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          status: 'REFUNDED',
          failureReason: 'Payment refunded',
        },
      });

      // If NFTs were not yet minted, release them back to AVAILABLE
      // If already minted, they remain with the owner but are marked for potential recovery
      const nfts = await prisma.nFT.findMany({
        where: { id: { in: nftIds } },
        select: { id: true, status: true },
      });

      const unmintedNftIds = nfts
        .filter((nft: { id: number; status: string }) => nft.status !== 'MINTED' && nft.status !== 'SOLD')
        .map((nft: { id: number; status: string }) => nft.id);

      if (unmintedNftIds.length > 0) {
        await prisma.nFT.updateMany({
          where: { id: { in: unmintedNftIds } },
          data: { status: 'AVAILABLE' },
        });
        console.log(`[Stripe Webhook] Released ${unmintedNftIds.length} unminted NFTs back to AVAILABLE`);
      }

      console.log(`[Stripe Webhook] Purchase ${purchase.id} marked as REFUNDED (full refund)`);
    } else {
      // Partial refund - just log it, don't change status
      console.log(`[Stripe Webhook] Partial refund received for purchase ${purchase.id}: ${refundedAmount}/${charge.amount} cents`);
    }

  } catch (error) {
    console.error(`[Stripe Webhook] Error handling charge.refunded for payment intent ${paymentIntentId}:`, error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for webhook secret configuration
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  let event: Stripe.Event;

  try {
    // Get the raw body as a buffer for signature verification
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      console.error('[Stripe Webhook] Missing stripe-signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Stripe Webhook] Signature verification failed: ${errorMessage}`);
    return res.status(400).json({ error: `Webhook signature verification failed: ${errorMessage}` });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        // Log unhandled events for debugging
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Return 200 OK to acknowledge receipt
    return res.status(200).json({ received: true, type: event.type });

  } catch (error) {
    console.error(`[Stripe Webhook] Error processing event ${event.type}:`, error);
    // Return 500 to tell Stripe to retry the webhook
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
