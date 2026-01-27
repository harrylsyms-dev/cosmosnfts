/**
 * Environment-aware configuration
 * Centralizes environment detection and feature flags
 */

export type Environment = 'development' | 'staging' | 'production';

function getEnvironment(): Environment {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT;

  if (env === 'production' || env === 'staging' || env === 'development') {
    return env;
  }

  // Fallback detection based on URL or NODE_ENV
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'cosmonfts.com' || hostname === 'www.cosmonfts.com') {
      return 'production';
    }
    if (hostname.includes('staging')) {
      return 'staging';
    }
  }

  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

export const config = {
  // Environment
  environment: getEnvironment(),

  get isProduction() {
    return this.environment === 'production';
  },

  get isStaging() {
    return this.environment === 'staging';
  },

  get isDevelopment() {
    return this.environment === 'development';
  },

  // URLs
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'),

  // Feature flags
  features: {
    // Only enable analytics in production
    get analytics() {
      return config.isProduction;
    },

    // Debug mode in non-production
    get debugMode() {
      return !config.isProduction;
    },

    // Mock payments in non-production (uses Stripe test mode)
    get mockPayments() {
      return !config.isProduction;
    },

    // Enable Sentry error tracking
    get errorTracking() {
      return config.isProduction || config.isStaging;
    },

    // Enable Redis caching
    get caching() {
      return !!process.env.UPSTASH_REDIS_REST_URL;
    },
  },

  // External services
  services: {
    sentry: {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === 'production',
    },
    stripe: {
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_KEY,
    },
    redis: {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      enabled: !!process.env.UPSTASH_REDIS_REST_URL,
    },
  },
} as const;

export default config;
