import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_API_KEY) {
  throw new Error('STRIPE_API_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_API_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const stripeConfig = {
  // Enable automatic fraud detection
  radarEnabled: true,

  // Enable 3D Secure for high-value transactions
  threeDSecure: {
    enabled: true,
    minimumAmount: 50000, // $500 in cents
  },

  // Strong email receipt requirements
  emailReceipt: {
    enabled: true,
    includeDetails: true,
  },

  // Decline certain payment methods
  paymentMethodTypes: ['card'] as const,

  // Require statement descriptor for clarity
  statementDescriptor: 'CosmoNFT Purchase',

  // Webhook secret for signature verification
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

export default stripe;
