/**
 * Scientific Scoring System for CosmoNFTs
 *
 * Three scoring modes:
 * - EQUAL: All 8 metrics weighted equally (62.5 each = 500 total)
 * - PRIMARY_FIVE: 5 selected metrics at 100 each = 500 total
 * - WEIGHTED: Custom weights per metric (must sum to 500)
 *
 * Uses logarithmic scaling to handle vast astronomical ranges
 */

import { prisma } from './prisma';

// Types
export interface ScoringConfig {
  id: string;
  activeSystem: 'EQUAL' | 'PRIMARY_FIVE' | 'WEIGHTED';
  basePricePerPoint: number;
  distanceWeight: number;
  massWeight: number;
  ageWeight: number;
  luminosityWeight: number;
  sizeWeight: number;
  temperatureWeight: number;
  discoveryWeight: number;
  papersWeight: number;
  primaryMetrics: string;
  distanceLogMin: number;
  distanceLogMax: number;
  massLogMin: number;
  massLogMax: number;
  ageLogMin: number;
  ageLogMax: number;
  sizeLogMin: number;
  sizeLogMax: number;
  temperatureLogMin: number;
  temperatureLogMax: number;
  papersLogMin: number;
  papersLogMax: number;
  discoveryYearMin: number;
  discoveryYearMax: number;
}

export interface ObjectTypeRule {
  objectType: string;
  hasDistance: boolean;
  hasMass: boolean;
  hasAge: boolean;
  hasLuminosity: boolean;
  hasSize: boolean;
  hasTemperature: boolean;
  hasDiscovery: boolean;
  hasPapers: boolean;
  distanceLogMin?: number | null;
  distanceLogMax?: number | null;
  massLogMin?: number | null;
  massLogMax?: number | null;
  ageLogMin?: number | null;
  ageLogMax?: number | null;
  sizeLogMin?: number | null;
  sizeLogMax?: number | null;
  temperatureLogMin?: number | null;
  temperatureLogMax?: number | null;
  defaultMissingScore: number;
}

export interface NFTScientificData {
  objectType?: string | null;
  distanceLy?: number | null;
  massSolar?: number | null;
  ageYears?: number | null;
  luminosity?: number | null;
  sizeKm?: number | null;
  temperatureK?: number | null;
  discoveryYear?: number | null;
  paperCount?: number | null;
}

export interface ScoreBreakdown {
  distanceScore: number;
  massScore: number;
  ageScore: number;
  luminosityScore: number;
  sizeScore: number;
  temperatureScore: number;
  discoveryScore: number;
  papersScore: number;
  totalScore: number;
  appliedWeights: {
    distance: number;
    mass: number;
    age: number;
    luminosity: number;
    size: number;
    temperature: number;
    discovery: number;
    papers: number;
  };
}

// Default scoring config
const DEFAULT_CONFIG: ScoringConfig = {
  id: 'main',
  activeSystem: 'EQUAL',
  basePricePerPoint: 0.10,
  distanceWeight: 62.5,
  massWeight: 62.5,
  ageWeight: 62.5,
  luminosityWeight: 62.5,
  sizeWeight: 62.5,
  temperatureWeight: 62.5,
  discoveryWeight: 62.5,
  papersWeight: 62.5,
  primaryMetrics: '["distance","mass","age","luminosity","size"]',
  distanceLogMin: 1,
  distanceLogMax: 13000000000,
  massLogMin: 0.00000001,
  massLogMax: 100000000000,
  ageLogMin: 1,
  ageLogMax: 14000000000,
  sizeLogMin: 1,
  sizeLogMax: 100000000000000,
  temperatureLogMin: 3,
  temperatureLogMax: 1000000000,
  papersLogMin: 1,
  papersLogMax: 100000,
  discoveryYearMin: 1600,
  discoveryYearMax: 2025,
};

/**
 * Calculate a single metric score using logarithmic scaling
 * Returns 0-100 based on where the value falls in the log range
 */
function calculateLogScore(
  value: number | null | undefined,
  logMin: number,
  logMax: number,
  hasMetric: boolean = true,
  defaultScore: number = 50
): number {
  // If metric doesn't apply to this object type, use default
  if (!hasMetric) {
    return defaultScore;
  }

  // If no value provided, use default
  if (value == null || value <= 0) {
    return defaultScore;
  }

  // Clamp value to range
  const clampedValue = Math.max(logMin, Math.min(logMax, value));

  // Calculate log score (0-100)
  const logValue = Math.log10(clampedValue);
  const logMinVal = Math.log10(logMin);
  const logMaxVal = Math.log10(logMax);

  if (logMaxVal === logMinVal) {
    return 50; // Avoid division by zero
  }

  const score = ((logValue - logMinVal) / (logMaxVal - logMinVal)) * 100;
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate discovery score (linear, older = higher)
 */
function calculateDiscoveryScore(
  discoveryYear: number | null | undefined,
  yearMin: number,
  yearMax: number,
  hasMetric: boolean = true,
  defaultScore: number = 50
): number {
  if (!hasMetric) {
    return defaultScore;
  }

  if (discoveryYear == null) {
    return defaultScore;
  }

  // Older discoveries get higher scores
  const clampedYear = Math.max(yearMin, Math.min(yearMax, discoveryYear));
  const score = ((yearMax - clampedYear) / (yearMax - yearMin)) * 100;
  return Math.max(0, Math.min(100, score));
}

/**
 * Get the scoring configuration from database or use defaults
 */
export async function getScoringConfig(): Promise<ScoringConfig> {
  try {
    const config = await prisma.scoringConfig.findUnique({
      where: { id: 'main' },
    });

    if (config) {
      return config as ScoringConfig;
    }
  } catch (error) {
    console.error('Failed to fetch scoring config:', error);
  }

  return DEFAULT_CONFIG;
}

/**
 * Get object type rules from database
 */
export async function getObjectTypeRule(objectType: string): Promise<ObjectTypeRule | null> {
  try {
    const rule = await prisma.objectTypeScoringRule.findUnique({
      where: { objectType },
    });

    return rule as ObjectTypeRule | null;
  } catch (error) {
    console.error('Failed to fetch object type rule:', error);
    return null;
  }
}

/**
 * Calculate all individual metric scores for an NFT
 */
export async function calculateMetricScores(
  nft: NFTScientificData,
  config?: ScoringConfig,
  typeRule?: ObjectTypeRule | null
): Promise<{
  distanceScore: number;
  massScore: number;
  ageScore: number;
  luminosityScore: number;
  sizeScore: number;
  temperatureScore: number;
  discoveryScore: number;
  papersScore: number;
}> {
  // Get config if not provided
  if (!config) {
    config = await getScoringConfig();
  }

  // Get type rule if not provided
  if (typeRule === undefined && nft.objectType) {
    typeRule = await getObjectTypeRule(nft.objectType);
  }

  const defaultScore = typeRule?.defaultMissingScore ?? 50;

  // Use type-specific ranges if available, otherwise use global
  const distanceMin = typeRule?.distanceLogMin ?? config.distanceLogMin;
  const distanceMax = typeRule?.distanceLogMax ?? config.distanceLogMax;
  const massMin = typeRule?.massLogMin ?? config.massLogMin;
  const massMax = typeRule?.massLogMax ?? config.massLogMax;
  const ageMin = typeRule?.ageLogMin ?? config.ageLogMin;
  const ageMax = typeRule?.ageLogMax ?? config.ageLogMax;
  const sizeMin = typeRule?.sizeLogMin ?? config.sizeLogMin;
  const sizeMax = typeRule?.sizeLogMax ?? config.sizeLogMax;
  const tempMin = typeRule?.temperatureLogMin ?? config.temperatureLogMin;
  const tempMax = typeRule?.temperatureLogMax ?? config.temperatureLogMax;

  return {
    distanceScore: calculateLogScore(
      nft.distanceLy,
      distanceMin,
      distanceMax,
      typeRule?.hasDistance ?? true,
      defaultScore
    ),
    massScore: calculateLogScore(
      nft.massSolar,
      massMin,
      massMax,
      typeRule?.hasMass ?? true,
      defaultScore
    ),
    ageScore: calculateLogScore(
      nft.ageYears,
      ageMin,
      ageMax,
      typeRule?.hasAge ?? true,
      defaultScore
    ),
    luminosityScore: calculateLogScore(
      nft.luminosity,
      config.papersLogMin, // Using papers range as placeholder for luminosity
      config.papersLogMax,
      typeRule?.hasLuminosity ?? true,
      defaultScore
    ),
    sizeScore: calculateLogScore(
      nft.sizeKm,
      sizeMin,
      sizeMax,
      typeRule?.hasSize ?? true,
      defaultScore
    ),
    temperatureScore: calculateLogScore(
      nft.temperatureK,
      tempMin,
      tempMax,
      typeRule?.hasTemperature ?? true,
      defaultScore
    ),
    discoveryScore: calculateDiscoveryScore(
      nft.discoveryYear,
      config.discoveryYearMin,
      config.discoveryYearMax,
      typeRule?.hasDiscovery ?? true,
      defaultScore
    ),
    papersScore: calculateLogScore(
      nft.paperCount,
      config.papersLogMin,
      config.papersLogMax,
      typeRule?.hasPapers ?? true,
      defaultScore
    ),
  };
}

/**
 * Calculate total score based on active scoring system
 */
export async function calculateTotalScore(
  nft: NFTScientificData
): Promise<ScoreBreakdown> {
  const config = await getScoringConfig();
  const typeRule = nft.objectType ? await getObjectTypeRule(nft.objectType) : null;
  const metricScores = await calculateMetricScores(nft, config, typeRule);

  let appliedWeights = {
    distance: 0,
    mass: 0,
    age: 0,
    luminosity: 0,
    size: 0,
    temperature: 0,
    discovery: 0,
    papers: 0,
  };

  let totalScore = 0;

  switch (config.activeSystem) {
    case 'EQUAL':
      // All 8 metrics weighted equally at 62.5 each
      appliedWeights = {
        distance: 62.5,
        mass: 62.5,
        age: 62.5,
        luminosity: 62.5,
        size: 62.5,
        temperature: 62.5,
        discovery: 62.5,
        papers: 62.5,
      };
      totalScore =
        (metricScores.distanceScore / 100) * 62.5 +
        (metricScores.massScore / 100) * 62.5 +
        (metricScores.ageScore / 100) * 62.5 +
        (metricScores.luminosityScore / 100) * 62.5 +
        (metricScores.sizeScore / 100) * 62.5 +
        (metricScores.temperatureScore / 100) * 62.5 +
        (metricScores.discoveryScore / 100) * 62.5 +
        (metricScores.papersScore / 100) * 62.5;
      break;

    case 'PRIMARY_FIVE':
      // Only 5 selected metrics at 100 each
      const primaryMetrics: string[] = JSON.parse(config.primaryMetrics);
      const metricMap: Record<string, number> = {
        distance: metricScores.distanceScore,
        mass: metricScores.massScore,
        age: metricScores.ageScore,
        luminosity: metricScores.luminosityScore,
        size: metricScores.sizeScore,
        temperature: metricScores.temperatureScore,
        discovery: metricScores.discoveryScore,
        papers: metricScores.papersScore,
      };

      for (const metric of primaryMetrics) {
        if (metric in metricMap) {
          (appliedWeights as any)[metric] = 100;
          totalScore += (metricMap[metric] / 100) * 100;
        }
      }
      break;

    case 'WEIGHTED':
      // Custom weights from config
      appliedWeights = {
        distance: config.distanceWeight,
        mass: config.massWeight,
        age: config.ageWeight,
        luminosity: config.luminosityWeight,
        size: config.sizeWeight,
        temperature: config.temperatureWeight,
        discovery: config.discoveryWeight,
        papers: config.papersWeight,
      };
      totalScore =
        (metricScores.distanceScore / 100) * config.distanceWeight +
        (metricScores.massScore / 100) * config.massWeight +
        (metricScores.ageScore / 100) * config.ageWeight +
        (metricScores.luminosityScore / 100) * config.luminosityWeight +
        (metricScores.sizeScore / 100) * config.sizeWeight +
        (metricScores.temperatureScore / 100) * config.temperatureWeight +
        (metricScores.discoveryScore / 100) * config.discoveryWeight +
        (metricScores.papersScore / 100) * config.papersWeight;
      break;
  }

  return {
    ...metricScores,
    totalScore: Math.round(totalScore * 100) / 100,
    appliedWeights,
  };
}

/**
 * Calculate price based on score and base price per point
 */
export async function calculatePrice(totalScore: number): Promise<number> {
  const config = await getScoringConfig();
  return totalScore * config.basePricePerPoint;
}

/**
 * Recalculate scores for a single NFT and update database
 */
export async function recalculateNFTScore(nftId: number): Promise<ScoreBreakdown> {
  const nft = await prisma.nFT.findUnique({
    where: { id: nftId },
  });

  if (!nft) {
    throw new Error('NFT not found');
  }

  const scoreBreakdown = await calculateTotalScore({
    objectType: nft.objectType,
    distanceLy: nft.distanceLy,
    massSolar: nft.massSolar,
    ageYears: nft.ageYears,
    luminosity: nft.luminosity,
    sizeKm: nft.sizeKm,
    temperatureK: nft.temperatureK,
    discoveryYear: nft.discoveryYear,
    paperCount: nft.paperCount,
  });

  const price = await calculatePrice(scoreBreakdown.totalScore);

  // Update NFT with new scores
  await prisma.nFT.update({
    where: { id: nftId },
    data: {
      distanceScore: scoreBreakdown.distanceScore,
      massScore: scoreBreakdown.massScore,
      ageScore: scoreBreakdown.ageScore,
      luminosityScore: scoreBreakdown.luminosityScore,
      sizeScore: scoreBreakdown.sizeScore,
      temperatureScore: scoreBreakdown.temperatureScore,
      discoveryScore: scoreBreakdown.discoveryScore,
      papersScore: scoreBreakdown.papersScore,
      totalScore: Math.round(scoreBreakdown.totalScore),
      cosmicScore: Math.round(scoreBreakdown.totalScore),
      currentPrice: price,
    },
  });

  return scoreBreakdown;
}

/**
 * Recalculate scores for ALL NFTs (use with caution - can be slow)
 */
export async function recalculateAllScores(
  batchSize: number = 100,
  onProgress?: (processed: number, total: number) => void
): Promise<{ processed: number; errors: number }> {
  const total = await prisma.nFT.count();
  let processed = 0;
  let errors = 0;

  // Process in batches
  while (processed < total) {
    const nfts = await prisma.nFT.findMany({
      skip: processed,
      take: batchSize,
      select: { id: true },
    });

    for (const nft of nfts) {
      try {
        await recalculateNFTScore(nft.id);
      } catch (error) {
        console.error(`Failed to recalculate score for NFT ${nft.id}:`, error);
        errors++;
      }
      processed++;
    }

    if (onProgress) {
      onProgress(processed, total);
    }
  }

  return { processed, errors };
}

/**
 * Get badge tier based on score
 */
export function getBadgeTier(score: number): string {
  if (score >= 450) return 'LEGENDARY';
  if (score >= 425) return 'ELITE';
  if (score >= 400) return 'PREMIUM';
  if (score >= 375) return 'EXCEPTIONAL';
  return 'STANDARD';
}
