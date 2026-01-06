/**
 * CosmoNFT Pricing System
 *
 * Formula: Price = $0.10 × Score × Tier Multiplier × Series Multiplier
 *
 * Tier Multipliers:
 * - MYTHIC: 200x
 * - LEGENDARY: 100x
 * - ELITE: 50x
 * - PREMIUM: 20x
 * - EXCEPTIONAL: 5x
 * - STANDARD: 1x
 *
 * Series Multipliers (based on previous series sell-through):
 * - 90%+: 3.0x
 * - 75-89%: 2.5x
 * - 50-74%: 2.0x
 * - 25-49%: 1.5x
 * - <25%: 1.0x (floor)
 * - Series 1: 1.0x (default)
 */

import { BadgeTier } from '@prisma/client';
import type { prisma as PrismaInstance } from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Base price per score point
export const BASE_PRICE_PER_SCORE = 0.10; // $0.10 USD

// Tier multipliers
export const TIER_MULTIPLIERS: Record<BadgeTier, number> = {
  MYTHIC: 200,
  LEGENDARY: 100,
  ELITE: 50,
  PREMIUM: 20,
  EXCEPTIONAL: 5,
  STANDARD: 1,
};

// Series multiplier thresholds
export const SERIES_MULTIPLIER_THRESHOLDS = [
  { minSellThrough: 0.90, multiplier: 3.0 },
  { minSellThrough: 0.75, multiplier: 2.5 },
  { minSellThrough: 0.50, multiplier: 2.0 },
  { minSellThrough: 0.25, multiplier: 1.5 },
  { minSellThrough: 0.00, multiplier: 1.0 }, // Floor
];

// Default series multiplier for Series 1
export const DEFAULT_SERIES_MULTIPLIER = 1.0;

export interface PriceCalculation {
  score: number;
  tierMultiplier: number;
  seriesMultiplier: number;
  priceUsd: number;
  priceCents: number;
  breakdown: {
    basePrice: number;
    afterTierMultiplier: number;
    afterSeriesMultiplier: number;
  };
}

/**
 * Calculate the price for an NFT
 * @param score - The NFT's total score (0-300)
 * @param tier - The NFT's badge tier
 * @param seriesMultiplier - The current series multiplier (default 1.0)
 * @returns Price calculation details
 */
export function calculatePrice(
  score: number,
  tier: BadgeTier,
  seriesMultiplier: number = DEFAULT_SERIES_MULTIPLIER
): PriceCalculation {
  const tierMultiplier = TIER_MULTIPLIERS[tier];

  // Base price = $0.10 × score
  const basePrice = BASE_PRICE_PER_SCORE * score;

  // After tier multiplier
  const afterTierMultiplier = basePrice * tierMultiplier;

  // After series multiplier (final price)
  const afterSeriesMultiplier = afterTierMultiplier * seriesMultiplier;

  // Round to 2 decimal places
  const priceUsd = Math.round(afterSeriesMultiplier * 100) / 100;
  const priceCents = Math.round(priceUsd * 100);

  return {
    score,
    tierMultiplier,
    seriesMultiplier,
    priceUsd,
    priceCents,
    breakdown: {
      basePrice,
      afterTierMultiplier,
      afterSeriesMultiplier,
    },
  };
}

/**
 * Calculate the series multiplier based on previous series sell-through rate
 * @param sellThroughRate - The sell-through rate (0.0 to 1.0)
 * @returns The multiplier to apply to the next series
 */
export function calculateSeriesMultiplier(sellThroughRate: number): number {
  for (const threshold of SERIES_MULTIPLIER_THRESHOLDS) {
    if (sellThroughRate >= threshold.minSellThrough) {
      return threshold.multiplier;
    }
  }
  return DEFAULT_SERIES_MULTIPLIER;
}

/**
 * Get the trajectory label for display
 */
export function getTrajectoryLabel(sellThroughRate: number): {
  label: string;
  description: string;
  multiplier: number;
} {
  const multiplier = calculateSeriesMultiplier(sellThroughRate);

  if (multiplier >= 3.0) {
    return {
      label: 'MAJOR_INCREASE',
      description: 'Next series will have significantly higher prices due to exceptional demand',
      multiplier,
    };
  } else if (multiplier >= 2.5) {
    return {
      label: 'SIGNIFICANT_INCREASE',
      description: 'Next series will have notably higher prices due to strong demand',
      multiplier,
    };
  } else if (multiplier >= 2.0) {
    return {
      label: 'MODERATE_INCREASE',
      description: 'Next series will have higher prices due to good demand',
      multiplier,
    };
  } else if (multiplier >= 1.5) {
    return {
      label: 'SLIGHT_INCREASE',
      description: 'Next series will have slightly higher prices',
      multiplier,
    };
  } else {
    return {
      label: 'STANDARD',
      description: 'Next series maintains base pricing',
      multiplier,
    };
  }
}

/**
 * Calculate example prices for all tiers
 */
export function calculateExamplePrices(
  seriesMultiplier: number = DEFAULT_SERIES_MULTIPLIER
): Record<BadgeTier, { avgScore: number; price: number }> {
  // Average scores by tier (approximate)
  const avgScores: Record<BadgeTier, number> = {
    MYTHIC: 275,
    LEGENDARY: 250,
    ELITE: 220,
    PREMIUM: 180,
    EXCEPTIONAL: 140,
    STANDARD: 100,
  };

  const examples: Record<BadgeTier, { avgScore: number; price: number }> = {} as any;

  for (const tier of Object.keys(avgScores) as BadgeTier[]) {
    const { priceUsd } = calculatePrice(avgScores[tier], tier, seriesMultiplier);
    examples[tier] = {
      avgScore: avgScores[tier],
      price: priceUsd,
    };
  }

  return examples;
}

/**
 * Get current series multiplier from database
 */
export async function getCurrentSeriesMultiplier(prisma: typeof PrismaInstance): Promise<number> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'main' },
    select: { currentSeriesId: true },
  });

  if (!settings?.currentSeriesId) {
    return DEFAULT_SERIES_MULTIPLIER;
  }

  const series = await prisma.series.findUnique({
    where: { id: settings.currentSeriesId },
    select: { multiplier: true },
  });

  if (!series?.multiplier) {
    return DEFAULT_SERIES_MULTIPLIER;
  }

  return Number(series.multiplier);
}

/**
 * Calculate cumulative multiplier for a series number
 * Series 1: 1.0
 * Series 2: Based on Series 1 sell-through
 * Series 3: Series 2 multiplier × Series 2 sell-through multiplier
 * etc.
 */
export async function calculateCumulativeMultiplier(
  prisma: typeof PrismaInstance,
  targetSeriesNumber: number
): Promise<{
  multiplier: number;
  breakdown: Array<{ series: number; sellThrough: number; multiplier: number }>;
}> {
  if (targetSeriesNumber <= 1) {
    return { multiplier: 1.0, breakdown: [] };
  }

  // Get all completed series before the target
  const previousSeries = await prisma.series.findMany({
    where: {
      seriesNumber: { lt: targetSeriesNumber },
      status: { in: ['COMPLETED', 'ACTIVE'] },
    },
    select: {
      seriesNumber: true,
      sellThroughRate: true,
    },
    orderBy: { seriesNumber: 'asc' },
  });

  let cumulativeMultiplier = 1.0;
  const breakdown: Array<{ series: number; sellThrough: number; multiplier: number }> = [];

  for (const series of previousSeries) {
    const sellThrough = series.sellThroughRate ? Number(series.sellThroughRate) : 0;
    const nextMultiplier = calculateSeriesMultiplier(sellThrough);

    breakdown.push({
      series: series.seriesNumber,
      sellThrough,
      multiplier: nextMultiplier,
    });

    cumulativeMultiplier *= nextMultiplier;
  }

  return { multiplier: cumulativeMultiplier, breakdown };
}

/**
 * Format price for display
 */
export function formatPrice(priceCents: number): string {
  const dollars = priceCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Calculate total revenue potential for a series
 */
export function calculateSeriesRevenuePotential(
  seriesMultiplier: number = DEFAULT_SERIES_MULTIPLIER
): {
  byTier: Record<BadgeTier, { count: number; avgPrice: number; revenue: number }>;
  totalRevenue: number;
  donationAmount: number;
  creatorAmount: number;
} {
  const tierDistribution: Record<BadgeTier, number> = {
    MYTHIC: 5,      // 20 total / 4 series
    LEGENDARY: 25,  // 100 total / 4 series
    ELITE: 100,     // 400 total / 4 series
    PREMIUM: 250,   // 1000 total / 4 series
    EXCEPTIONAL: 500, // 2000 total / 4 series
    STANDARD: 4120, // 16480 total / 4 series
  };

  const avgScores: Record<BadgeTier, number> = {
    MYTHIC: 275,
    LEGENDARY: 250,
    ELITE: 220,
    PREMIUM: 180,
    EXCEPTIONAL: 140,
    STANDARD: 100,
  };

  const byTier: Record<BadgeTier, { count: number; avgPrice: number; revenue: number }> = {} as any;
  let totalRevenue = 0;

  for (const tier of Object.keys(tierDistribution) as BadgeTier[]) {
    const count = tierDistribution[tier];
    const { priceUsd } = calculatePrice(avgScores[tier], tier, seriesMultiplier);
    const revenue = count * priceUsd;

    byTier[tier] = { count, avgPrice: priceUsd, revenue };
    totalRevenue += revenue;
  }

  // 30% to benefactor, 70% to creator
  const donationAmount = totalRevenue * 0.30;
  const creatorAmount = totalRevenue * 0.70;

  return {
    byTier,
    totalRevenue,
    donationAmount,
    creatorAmount,
  };
}

// Example pricing table
export function printPricingTable(): void {
  console.log('\n=== CosmoNFT Pricing Table ===\n');

  console.log('Series 1 Pricing (1.0x multiplier):');
  console.log('-----------------------------------');

  const s1Examples = calculateExamplePrices(1.0);
  for (const [tier, data] of Object.entries(s1Examples)) {
    console.log(`${tier.padEnd(12)} | Score ${data.avgScore} | ${formatPrice(data.price * 100)}`);
  }

  console.log('\nSeries 4 Best Case (27x multiplier):');
  console.log('-------------------------------------');

  // Best case: 90%+ sell-through each series = 3.0 × 3.0 × 3.0 = 27x
  const s4Examples = calculateExamplePrices(27.0);
  for (const [tier, data] of Object.entries(s4Examples)) {
    console.log(`${tier.padEnd(12)} | Score ${data.avgScore} | ${formatPrice(data.price * 100)}`);
  }

  console.log('\n=== Revenue Projection ===\n');

  const s1Revenue = calculateSeriesRevenuePotential(1.0);
  console.log(`Series 1 Total Revenue: ${formatPrice(s1Revenue.totalRevenue * 100)}`);
  console.log(`  - Creator (70%): ${formatPrice(s1Revenue.creatorAmount * 100)}`);
  console.log(`  - Donation (30%): ${formatPrice(s1Revenue.donationAmount * 100)}`);
}

// Run if executed directly
if (require.main === module) {
  printPricingTable();
}
