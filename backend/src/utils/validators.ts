import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Ethereum address validation
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

// Cart item validation
export const cartAddSchema = z.object({
  nftId: z.number().int().positive('NFT ID must be a positive integer'),
  userId: z.string().min(1, 'User ID is required'),
});

// Checkout validation
export const checkoutSchema = z.object({
  cartItems: z
    .array(z.number().int().positive())
    .min(1, 'Cart must have at least one item')
    .max(5, 'Maximum 5 items per checkout'),
  email: emailSchema,
  walletAddress: ethereumAddressSchema.optional(),
});

// NFT query validation
export const nftQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  minScore: z.coerce.number().int().min(0).max(500).optional(),
  maxScore: z.coerce.number().int().min(0).max(500).optional(),
  badge: z.enum(['ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD']).optional(),
  sortBy: z.enum(['score', 'price', 'name']).default('score'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// NFT creation validation
export const nftCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  image: z.string().url(),
  fameVisibility: z.number().int().min(0).max(100),
  scientificSignificance: z.number().int().min(0).max(100),
  rarity: z.number().int().min(0).max(100),
  discoveryRecency: z.number().int().min(0).max(100),
  culturalImpact: z.number().int().min(0).max(100),
  discoveryYear: z.number().int().min(-3000).max(new Date().getFullYear()).optional(),
  objectType: z.string().optional(),
});

// Payment method validation
export const paymentMethodSchema = z.object({
  paymentMethodId: z.string().startsWith('pm_'),
});

// Validate and parse with error messages
export function validate<T>(schema: z.Schema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return result.data;
}
