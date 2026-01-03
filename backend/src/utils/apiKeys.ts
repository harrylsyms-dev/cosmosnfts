import { decrypt, isEncryptionConfigured } from './encryption';

/**
 * API Key retrieval utility
 * Checks database first, falls back to environment variables
 */

// Map service names to environment variable names
const ENV_VAR_MAP: Record<string, string> = {
  stripe: 'STRIPE_SECRET_KEY',
  stripe_webhook: 'STRIPE_WEBHOOK_SECRET',
  pinata_api: 'PINATA_API_KEY',
  pinata_secret: 'PINATA_SECRET_KEY',
  leonardo: 'LEONARDO_API_KEY',
  polygon_rpc: 'POLYGON_RPC_URL',
  sendgrid: 'SENDGRID_API_KEY',
};

// Simple in-memory cache with TTL
const cache: Map<string, { value: string | null; expires: number }> = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute cache

/**
 * Get an API key by service name
 * Checks database first, falls back to environment variable
 */
export async function getApiKey(service: string): Promise<string | null> {
  // Check cache first
  const cached = cache.get(service);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }

  let value: string | null = null;

  // Try database first if encryption is configured
  if (isEncryptionConfigured()) {
    try {
      const { prisma } = await import('../config/database');
      const apiKey = await prisma.apiKey.findUnique({
        where: { service },
      });

      if (apiKey?.encryptedKey) {
        value = decrypt(apiKey.encryptedKey);
      }
    } catch (error) {
      // Database error, fall through to env var
      console.warn(`Failed to get API key from database for ${service}:`, error);
    }
  }

  // Fall back to environment variable
  if (!value) {
    const envVar = ENV_VAR_MAP[service];
    if (envVar) {
      value = process.env[envVar] || null;
    }
  }

  // Cache the result
  cache.set(service, { value, expires: Date.now() + CACHE_TTL });

  return value;
}

/**
 * Get multiple API keys at once
 */
export async function getApiKeys(services: string[]): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};

  // Fetch all in parallel
  await Promise.all(
    services.map(async (service) => {
      results[service] = await getApiKey(service);
    })
  );

  return results;
}

/**
 * Clear the API key cache (call after updating keys)
 */
export function clearApiKeyCache(service?: string): void {
  if (service) {
    cache.delete(service);
  } else {
    cache.clear();
  }
}

/**
 * Check if a service has an API key configured (database or env var)
 */
export async function isServiceConfigured(service: string): Promise<boolean> {
  const key = await getApiKey(service);
  return !!key;
}

/**
 * Get all service configurations
 */
export async function getAllServiceStatus(): Promise<Record<string, boolean>> {
  const services = Object.keys(ENV_VAR_MAP);
  const status: Record<string, boolean> = {};

  await Promise.all(
    services.map(async (service) => {
      status[service] = await isServiceConfigured(service);
    })
  );

  return status;
}
