/**
 * Generate NFT Records from Selected Objects
 *
 * This script reads scored astronomical objects from staging/selected-nfts.json
 * and creates NFT records in the database with generated image prompts.
 *
 * Usage:
 *   npx tsx scripts/generate-nfts-from-selection.ts
 *   npx tsx scripts/generate-nfts-from-selection.ts --input staging/custom-selection.json
 *   npx tsx scripts/generate-nfts-from-selection.ts --batch-size 50
 *   npx tsx scripts/generate-nfts-from-selection.ts --dry-run
 *
 * CLI Arguments:
 *   --input <path>      - Input JSON file path (default: staging/selected-nfts.json)
 *   --batch-size <n>    - Batch size for DB writes (default: 100)
 *   --dry-run           - Don't write to DB, just report what would happen
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { ScoredObject } from '../lib/catalogImporter';
import {
  buildImagePrompt,
  validatePrompt,
  deriveVisualFeaturesFromSpectralType,
  calculateConfidence,
} from '../lib/imagePromptTemplates';

// ============================================
// CLI ARGUMENT PARSING
// ============================================

interface CLIOptions {
  inputPath: string;
  batchSize: number;
  dryRun: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    inputPath: 'staging/selected-nfts.json',
    batchSize: 100,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--input' && args[i + 1]) {
      options.inputPath = args[++i];
    } else if (arg === '--batch-size' && args[i + 1]) {
      const size = parseInt(args[++i], 10);
      if (!isNaN(size) && size > 0) {
        options.batchSize = size;
      }
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Generate NFT Records from Selected Objects

Usage:
  npx tsx scripts/generate-nfts-from-selection.ts [options]

Options:
  --input <path>      Input JSON file path (default: staging/selected-nfts.json)
  --batch-size <n>    Batch size for DB writes (default: 100)
  --dry-run           Don't write to DB, just report what would happen
  --help, -h          Show this help message
      `);
      process.exit(0);
    }
  }

  return options;
}

// ============================================
// PROGRESS BAR UTILITY
// ============================================

function printProgress(current: number, total: number, prefix: string = 'Progress'): void {
  const percentage = Math.round((current / total) * 100);
  const barLength = 40;
  const filledLength = Math.round((current / total) * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  process.stdout.write(`\r${prefix}: [${bar}] ${current}/${total} (${percentage}%)`);
}

// ============================================
// STATISTICS TRACKING
// ============================================

interface GenerationStats {
  total: number;
  processed: number;
  created: number;
  skipped: number;
  failed: number;
  withWarnings: number;

  // Tier distribution
  tierCounts: Record<string, number>;

  // Confidence tracking
  confidenceScores: number[];
  featureSourceCounts: Record<string, number>;
  lowConfidenceItems: Array<{ name: string; score: number; source: string }>;

  // Error tracking
  errors: Array<{ name: string; error: string }>;
}

function createEmptyStats(): GenerationStats {
  return {
    total: 0,
    processed: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    withWarnings: 0,
    tierCounts: {
      LEGENDARY: 0,
      ELITE: 0,
      PREMIUM: 0,
      EXCEPTIONAL: 0,
      STANDARD: 0,
    },
    confidenceScores: [],
    featureSourceCounts: {
      explicit: 0,
      spectral: 0,
      famous: 0,
      template: 0,
      default: 0,
    },
    lowConfidenceItems: [],
    errors: [],
  };
}

// ============================================
// NFT CREATION LOGIC
// ============================================

interface NFTCreateData {
  tokenId: number;
  name: string;
  description: string;
  objectType: string;
  fameVisibility: number;
  scientificSignificance: number;
  rarity: number;
  discoveryRecency: number;
  culturalImpact: number;
  totalScore: number;
  badgeTier: string;
  spectralType: string | null;
  distanceLy: number | null;
  luminosity: number | null;
  temperatureK: number | null;
  imagePrompt: string;
  imageNegativePrompt: string;
  promptGeneratedAt: Date;
  status: string;
  catalogSource?: string;
  catalogId?: string;
  distance?: string;
  constellation?: string;
}

interface PromptResult {
  prompt: string;
  negativePrompt: string;
  isValid: boolean;
  warnings: string[];
  confidenceScore: number;
  featureSource: string;
}

function generatePromptForObject(obj: ScoredObject): PromptResult {
  // Parse visual features if available
  let visualFeatures: string[] | undefined;
  let hasExplicitFeatures = false;

  if (obj.visualFeatures && obj.visualFeatures.length > 0) {
    visualFeatures = obj.visualFeatures;
    hasExplicitFeatures = true;
  }

  // Derive features from spectral type for stars without explicit features
  if (!visualFeatures?.length && obj.spectralType && obj.objectType === 'Star') {
    const derivedFeatures = deriveVisualFeaturesFromSpectralType(obj.spectralType, obj.name);
    if (derivedFeatures.length > 0) {
      visualFeatures = derivedFeatures;
    }
  }

  // Build prompt options
  const promptOptions = {
    name: obj.name,
    objectType: obj.objectType,
    description: obj.description,
    spectralType: obj.spectralType,
    mass: obj.mass,
    notableFeatures: obj.notableFeatures,
    visualFeatures: visualFeatures,
    galaxyType: obj.galaxyType,
    nebulaType: obj.nebulaType,
    planetType: obj.planetType,
    subType: obj.subType,
    structureDetails: obj.structureDetails,
    surfaceFeatures: obj.surfaceFeatures,
    colorDescription: obj.colorDescription,
    customVisualCharacteristics: obj.visualCharacteristics,
  };

  const result = buildImagePrompt(promptOptions);
  const validation = validatePrompt(result.prompt);

  // Calculate confidence
  const confidence = calculateConfidence(obj.objectType, {
    hasExplicitVisualFeatures: hasExplicitFeatures,
    hasSpectralType: !!obj.spectralType,
    hasFamousFeatures: false, // Could be enhanced later
    hasColorDescription: !!obj.colorDescription,
    hasStructureDetails: !!obj.structureDetails,
    validationWarnings: validation.warnings,
  });

  return {
    prompt: result.prompt,
    negativePrompt: result.negativePrompt,
    isValid: validation.valid,
    warnings: validation.warnings,
    confidenceScore: confidence.score,
    featureSource: confidence.featureSource,
  };
}

function mapScoredObjectToNFTData(
  obj: ScoredObject,
  tokenId: number,
  promptResult: PromptResult
): NFTCreateData {
  // Map scoring categories:
  // - distance -> fameVisibility (nearby objects are more visible/famous)
  // - luminosity -> scientificSignificance (brighter objects are more studied)
  // - temperature -> rarity (extreme temps are rare)
  // - discovery -> discoveryRecency
  // - mass -> culturalImpact (massive objects capture imagination)

  return {
    tokenId,
    name: obj.name,
    description: obj.description,
    objectType: obj.objectType,
    fameVisibility: obj.scores.distance,
    scientificSignificance: obj.scores.luminosity,
    rarity: obj.scores.temperature,
    discoveryRecency: obj.scores.discovery,
    culturalImpact: obj.scores.mass,
    totalScore: obj.scores.multiplied,
    badgeTier: obj.badgeTier,
    spectralType: obj.spectralType || null,
    distanceLy: obj.distanceLy || null,
    luminosity: obj.luminosity || null,
    temperatureK: obj.temperature || null,
    imagePrompt: promptResult.prompt,
    imageNegativePrompt: promptResult.negativePrompt,
    promptGeneratedAt: new Date(),
    status: 'AVAILABLE',
    catalogSource: obj.catalogSource,
    catalogId: obj.catalogId,
    distance: obj.distanceDisplay,
    constellation: obj.constellation,
  };
}

// ============================================
// RETRY LOGIC
// ============================================

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        console.warn(`\nAttempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  throw lastError;
}

// ============================================
// MAIN PROCESSING FUNCTION
// ============================================

async function processSelectedObjects(
  prisma: PrismaClient,
  objects: ScoredObject[],
  options: CLIOptions
): Promise<GenerationStats> {
  const stats = createEmptyStats();
  stats.total = objects.length;

  // Get the highest existing tokenId to continue from
  let nextTokenId = 1;
  if (!options.dryRun) {
    const lastNFT = await prisma.nFT.findFirst({
      orderBy: { tokenId: 'desc' },
      select: { tokenId: true },
    });
    if (lastNFT) {
      nextTokenId = lastNFT.tokenId + 1;
    }
  }

  console.log(`\nStarting from tokenId: ${nextTokenId}`);
  console.log(`Processing ${objects.length} objects in batches of ${options.batchSize}\n`);

  // Process in batches
  for (let i = 0; i < objects.length; i += options.batchSize) {
    const batch = objects.slice(i, i + options.batchSize);
    const batchData: NFTCreateData[] = [];

    for (const obj of batch) {
      try {
        // Generate prompt
        const promptResult = generatePromptForObject(obj);

        // Map to NFT data
        const nftData = mapScoredObjectToNFTData(obj, nextTokenId++, promptResult);
        batchData.push(nftData);

        // Update stats
        stats.tierCounts[obj.badgeTier]++;
        stats.confidenceScores.push(promptResult.confidenceScore);
        stats.featureSourceCounts[promptResult.featureSource]++;

        if (!promptResult.isValid) {
          stats.withWarnings++;
        }

        if (promptResult.confidenceScore < 0.5) {
          stats.lowConfidenceItems.push({
            name: obj.name,
            score: promptResult.confidenceScore,
            source: promptResult.featureSource,
          });
        }
      } catch (error) {
        stats.failed++;
        stats.errors.push({
          name: obj.name,
          error: (error as Error).message,
        });
      }
    }

    // Write batch to database (with retry)
    if (!options.dryRun && batchData.length > 0) {
      try {
        await withRetry(async () => {
          await prisma.nFT.createMany({
            data: batchData.map((nft) => ({
              tokenId: nft.tokenId,
              name: nft.name,
              description: nft.description,
              objectType: nft.objectType,
              fameVisibility: nft.fameVisibility,
              scientificSignificance: nft.scientificSignificance,
              rarity: nft.rarity,
              discoveryRecency: nft.discoveryRecency,
              culturalImpact: nft.culturalImpact,
              totalScore: nft.totalScore,
              badgeTier: nft.badgeTier,
              spectralType: nft.spectralType,
              distanceLy: nft.distanceLy,
              luminosity: nft.luminosity,
              temperatureK: nft.temperatureK,
              imagePrompt: nft.imagePrompt,
              imageNegativePrompt: nft.imageNegativePrompt,
              promptGeneratedAt: nft.promptGeneratedAt,
              status: nft.status,
              distance: nft.distance,
              constellation: nft.constellation,
            })),
            skipDuplicates: true,
          });
          stats.created += batchData.length;
        });
      } catch (error) {
        stats.failed += batchData.length;
        for (const nft of batchData) {
          stats.errors.push({
            name: nft.name,
            error: (error as Error).message,
          });
        }
      }
    } else if (options.dryRun) {
      stats.created += batchData.length;
    }

    stats.processed += batch.length;
    printProgress(stats.processed, stats.total);
  }

  console.log('\n');
  return stats;
}

// ============================================
// STATISTICS REPORT
// ============================================

function printStatisticsReport(stats: GenerationStats, options: CLIOptions): void {
  console.log('\n' + '='.repeat(60));
  console.log('=== NFT GENERATION COMPLETE ===');
  if (options.dryRun) {
    console.log('*** DRY RUN MODE - No database writes performed ***');
  }
  console.log('='.repeat(60));

  // Basic stats
  console.log('\n--- Processing Summary ---');
  console.log(`  Total objects:      ${stats.total}`);
  console.log(`  Successfully created: ${stats.created}`);
  console.log(`  Skipped:            ${stats.skipped}`);
  console.log(`  Failed:             ${stats.failed}`);
  console.log(`  With warnings:      ${stats.withWarnings}`);

  // Tier distribution
  console.log('\n--- Tier Distribution ---');
  const tierOrder = ['LEGENDARY', 'ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD'];
  for (const tier of tierOrder) {
    const count = stats.tierCounts[tier] || 0;
    const percentage = stats.created > 0 ? Math.round((count / stats.created) * 100) : 0;
    const bar = '█'.repeat(Math.round(percentage / 5)) + '░'.repeat(20 - Math.round(percentage / 5));
    console.log(`  ${tier.padEnd(12)} [${bar}] ${count.toString().padStart(5)} (${percentage}%)`);
  }

  // Confidence scores
  if (stats.confidenceScores.length > 0) {
    const avgConfidence =
      Math.round(
        (stats.confidenceScores.reduce((a, b) => a + b, 0) / stats.confidenceScores.length) * 100
      ) / 100;
    const minConfidence = Math.min(...stats.confidenceScores);
    const maxConfidence = Math.max(...stats.confidenceScores);
    const highConfidenceCount = stats.confidenceScores.filter((s) => s >= 0.8).length;

    console.log('\n--- Confidence Metrics ---');
    console.log(`  Average:            ${avgConfidence.toFixed(2)}`);
    console.log(`  Range:              ${minConfidence.toFixed(2)} - ${maxConfidence.toFixed(2)}`);
    console.log(
      `  High (>=0.8):       ${highConfidenceCount} (${Math.round((highConfidenceCount / stats.created) * 100)}%)`
    );
    console.log(`  Low (<0.5):         ${stats.lowConfidenceItems.length}`);
  }

  // Feature sources
  console.log('\n--- Feature Sources ---');
  for (const [source, count] of Object.entries(stats.featureSourceCounts)) {
    if (count > 0) {
      const percentage = stats.created > 0 ? Math.round((count / stats.created) * 100) : 0;
      console.log(`  ${source.padEnd(12)} ${count.toString().padStart(5)} (${percentage}%)`);
    }
  }

  // Low confidence items (show first 10)
  if (stats.lowConfidenceItems.length > 0) {
    console.log('\n--- Low Confidence Items (may need review) ---');
    const itemsToShow = stats.lowConfidenceItems.slice(0, 10);
    for (const item of itemsToShow) {
      console.log(`  - ${item.name}: ${item.score.toFixed(2)} (${item.source})`);
    }
    if (stats.lowConfidenceItems.length > 10) {
      console.log(`  ... and ${stats.lowConfidenceItems.length - 10} more`);
    }
  }

  // Errors (show first 5)
  if (stats.errors.length > 0) {
    console.log('\n--- Errors ---');
    const errorsToShow = stats.errors.slice(0, 5);
    for (const err of errorsToShow) {
      console.log(`  - ${err.name}: ${err.error}`);
    }
    if (stats.errors.length > 5) {
      console.log(`  ... and ${stats.errors.length - 5} more errors`);
    }
  }

  console.log('\n' + '='.repeat(60));
}

// ============================================
// MAIN ENTRY POINT
// ============================================

async function main(): Promise<void> {
  const options = parseArgs();
  const prisma = new PrismaClient();

  console.log('='.repeat(60));
  console.log('=== Generate NFTs from Selection ===');
  console.log('='.repeat(60));
  console.log(`\nInput file:   ${options.inputPath}`);
  console.log(`Batch size:   ${options.batchSize}`);
  console.log(`Dry run:      ${options.dryRun ? 'YES' : 'NO'}`);

  try {
    // Resolve input path
    const inputPath = path.isAbsolute(options.inputPath)
      ? options.inputPath
      : path.resolve(process.cwd(), options.inputPath);

    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      console.error(`\nError: Input file not found: ${inputPath}`);
      console.error('Run the selection script first to generate the input file.');
      process.exit(1);
    }

    // Read and parse input file
    console.log(`\nReading selection from: ${inputPath}`);
    const fileContent = fs.readFileSync(inputPath, 'utf-8');
    let selectedObjects: ScoredObject[];

    try {
      selectedObjects = JSON.parse(fileContent);
    } catch (parseError) {
      console.error(`\nError: Failed to parse input file as JSON`);
      console.error((parseError as Error).message);
      process.exit(1);
    }

    if (!Array.isArray(selectedObjects)) {
      console.error('\nError: Input file must contain a JSON array of objects');
      process.exit(1);
    }

    console.log(`Loaded ${selectedObjects.length} objects from selection`);

    // Validate objects have required fields
    const invalidObjects = selectedObjects.filter(
      (obj) => !obj.name || !obj.objectType || !obj.scores || !obj.badgeTier
    );
    if (invalidObjects.length > 0) {
      console.warn(`\nWarning: ${invalidObjects.length} objects have missing required fields`);
      selectedObjects = selectedObjects.filter(
        (obj) => obj.name && obj.objectType && obj.scores && obj.badgeTier
      );
      console.log(`Continuing with ${selectedObjects.length} valid objects`);
    }

    // Check for duplicates against existing NFTs
    if (!options.dryRun) {
      console.log('\nChecking for existing NFTs...');
      const existingNames = await prisma.nFT.findMany({
        where: {
          name: {
            in: selectedObjects.map((o) => o.name),
          },
        },
        select: { name: true },
      });

      if (existingNames.length > 0) {
        const existingSet = new Set(existingNames.map((n) => n.name));
        const originalCount = selectedObjects.length;
        selectedObjects = selectedObjects.filter((obj) => !existingSet.has(obj.name));
        console.log(
          `Filtered out ${originalCount - selectedObjects.length} objects that already exist in database`
        );
        console.log(`Remaining objects to process: ${selectedObjects.length}`);
      }
    }

    if (selectedObjects.length === 0) {
      console.log('\nNo objects to process. Exiting.');
      return;
    }

    // Process objects
    const stats = await processSelectedObjects(prisma, selectedObjects, options);

    // Print final report
    printStatisticsReport(stats, options);

    if (options.dryRun) {
      console.log('\n*** This was a dry run. Run without --dry-run to create NFT records. ***\n');
    } else {
      console.log('\nNFT records have been created successfully.\n');
    }
  } catch (error) {
    console.error('\nScript failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
