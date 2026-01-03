import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Lazy-loaded Stripe instance
let stripeInstance: Stripe | null = null;
let cachedApiKey: string | null = null;

/**
 * Get Stripe instance - lazy loaded and supports database keys
 */
export async function getStripe(): Promise<Stripe> {
  const { getApiKey } = await import('../utils/apiKeys');
  const apiKey = await getApiKey('stripe');

  if (!apiKey) {
    throw new Error('Stripe API key not configured. Add it in Admin Settings or set STRIPE_SECRET_KEY environment variable.');
  }

  // Return cached instance if key hasn't changed
  if (stripeInstance && cachedApiKey === apiKey) {
    return stripeInstance;
  }

  // Create new instance
  stripeInstance = new Stripe(apiKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  });
  cachedApiKey = apiKey;

  return stripeInstance;
}

/**
 * Get Stripe webhook secret
 */
export async function getWebhookSecret(): Promise<string> {
  const { getApiKey } = await import('../utils/apiKeys');
  const secret = await getApiKey('stripe_webhook');
  return secret || '';
}

/**
 * Check if Stripe is configured
 */
export async function isStripeConfigured(): Promise<boolean> {
  const { getApiKey } = await import('../utils/apiKeys');
  const apiKey = await getApiKey('stripe');
  return !!apiKey;
}

// Synchronous fallback for places that can't use async (deprecated - use getStripe() instead)
const syncApiKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
export const stripe = syncApiKey
  ? new Stripe(syncApiKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  : null;

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

  // Webhook secret for signature verification (use getWebhookSecret() for async access)
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

export default stripe;
