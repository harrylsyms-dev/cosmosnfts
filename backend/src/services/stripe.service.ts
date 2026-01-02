import { stripe, stripeConfig } from '../config/stripe';
import { logger } from '../utils/logger';

export async function createPaymentIntent(
  amount: number,
  email: string,
  nftIds: number[],
  purchaseId: string
) {
  // Enable 3D Secure for higher amounts
  const requiresSecure = amount > stripeConfig.threeDSecure.minimumAmount;

  logger.info(`Creating payment intent: $${amount / 100} for ${nftIds.length} NFTs`);

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    description: `CosmoNFT Purchase (${nftIds.length} items)`,
    receipt_email: email,
    payment_method_types: ['card'],
    metadata: {
      nftIds: JSON.stringify(nftIds),
      email,
      purchaseId,
    },
    statement_descriptor: stripeConfig.statementDescriptor,
    ...(requiresSecure && {
      payment_method_options: {
        card: {
          request_three_d_secure: 'any',
        },
      },
    }),
  });

  logger.info(`Payment intent created: ${intent.id}`);

  return intent;
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

export async function cancelPaymentIntent(paymentIntentId: string) {
  try {
    await stripe.paymentIntents.cancel(paymentIntentId);
    logger.info(`Payment intent cancelled: ${paymentIntentId}`);
  } catch (error) {
    logger.error(`Failed to cancel payment intent ${paymentIntentId}:`, error);
  }
}

export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: string
) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount && { amount }),
    reason: 'requested_by_customer',
    metadata: {
      reason: reason || 'Customer requested refund',
    },
  });

  logger.info(`Refund created: ${refund.id} for payment ${paymentIntentId}`);

  return refund;
}

export async function getPaymentMethods(customerId: string) {
  return stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
}

export async function createCustomer(email: string, name?: string) {
  const customer = await stripe.customers.create({
    email,
    ...(name && { name }),
    metadata: {
      source: 'cosmonfts',
    },
  });

  logger.info(`Stripe customer created: ${customer.id}`);

  return customer;
}

export async function submitDisputeEvidence(
  disputeId: string,
  evidence: {
    productDescription: string;
    customerEmail: string;
    transactionHash: string;
    openSeaUrl: string;
  }
) {
  const dispute = await stripe.disputes.update(disputeId, {
    evidence: {
      product_description: evidence.productDescription,
      customer_email_address: evidence.customerEmail,
      uncategorized_text: `
        This is a legitimate NFT purchase. The customer purchased digital assets (NFTs)
        that were successfully minted on the Polygon blockchain.

        Blockchain Transaction: ${evidence.transactionHash}
        OpenSea Collection: ${evidence.openSeaUrl}

        The NFTs are permanently recorded on the blockchain and cannot be reversed.
        The customer received email confirmation with blockchain proof.

        Our Terms of Service clearly state that all NFT purchases are final and non-refundable.
      `,
    },
    submit: true,
  });

  logger.info(`Dispute evidence submitted: ${disputeId}`);

  return dispute;
}
