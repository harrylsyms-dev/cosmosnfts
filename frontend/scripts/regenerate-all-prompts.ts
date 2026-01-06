/**
 * Script to regenerate image prompts for all NFTs in the database
 * Uses the updated template system with object name in parentheses
 * Now includes confidence scoring, spectral derivation, and logging
 *
 * Run with: npx tsx scripts/regenerate-all-prompts.ts
 */

import { PrismaClient } from '@prisma/client';
import { getAllAstronomicalObjects, AstronomicalObject } from '../lib/astronomicalData';
import {
  buildImagePrompt,
  PromptBuildOptions,
  validatePrompt,
  calculateConfidence,
  deriveVisualFeaturesFromSpectralType,
  getNebulaSpecificFeatures,
  getBlackHoleSpecificFeatures,
  getDwarfPlanetSpecificFeatures,
  PromptConfidence,
} from '../lib/imagePromptTemplates';

const prisma = new PrismaClient();

// Build a lookup map from astronomical data by name (case-insensitive)
function buildAstroDataLookup(): Map<string, AstronomicalObject> {
  const allObjects = getAllAstronomicalObjects();
  const lookup = new Map<string, AstronomicalObject>();

  for (const obj of allObjects) {
    lookup.set(obj.name.toLowerCase(), obj);
    if (obj.alternateNames) {
      for (const alt of obj.alternateNames) {
        lookup.set(alt.toLowerCase(), obj);
      }
    }
  }

  return lookup;
}

// Result type with confidence scoring
interface PromptGenerationResult {
  prompt: string;
  negativePrompt: string;
  isValid: boolean;
  warnings: string[];
  confidence: PromptConfidence;
  featureSource: string;
  derivedFeaturesCount: number;
}

// Generate prompt from NFT data + astronomical data lookup with confidence scoring
function generatePromptForNFT(
  nft: {
    name: string;
    description: string | null;
    objectType: string | null;
    spectralType: string | null;
    notableFeatures: string | null;
    visualFeatures: string | null;
  },
  astroLookup: Map<string, AstronomicalObject>
): PromptGenerationResult {

  const astroData = astroLookup.get(nft.name.toLowerCase());
  const objectType = nft.objectType || 'Unknown';
  const spectralType = nft.spectralType || astroData?.spectralType;

  // Parse visual features from NFT or use astronomical data
  let visualFeatures: string[] | undefined;
  let hasExplicitFeatures = false;
  let derivedFeaturesCount = 0;

  if (nft.visualFeatures) {
    try {
      visualFeatures = JSON.parse(nft.visualFeatures);
      hasExplicitFeatures = true;
    } catch {
      visualFeatures = [nft.visualFeatures];
      hasExplicitFeatures = true;
    }
  } else if (astroData?.visualFeatures) {
    visualFeatures = astroData.visualFeatures;
    hasExplicitFeatures = true;
  }

  // SPECTRAL CLASS → FEATURES PIPELINE
  // If no explicit visual features and we have spectral type, derive features
  if (!visualFeatures?.length && spectralType && objectType === 'Star') {
    const derivedFeatures = deriveVisualFeaturesFromSpectralType(spectralType, nft.name);
    if (derivedFeatures.length > 0) {
      visualFeatures = derivedFeatures;
      derivedFeaturesCount = derivedFeatures.length;
    }
  }

  // Check for famous object features
  const hasFamousFeatures = !!(
    (objectType === 'Nebula' && getNebulaSpecificFeatures(nft.name)) ||
    (objectType === 'Black Hole' && getBlackHoleSpecificFeatures(nft.name)) ||
    (objectType === 'Dwarf Planet' && getDwarfPlanetSpecificFeatures(nft.name))
  );

  const options: PromptBuildOptions = {
    name: nft.name,
    objectType: objectType,
    description: nft.description || undefined,
    spectralType: spectralType,
    mass: astroData?.mass,
    notableFeatures: nft.notableFeatures
      ? JSON.parse(nft.notableFeatures)
      : astroData?.notableFeatures,
    visualFeatures: visualFeatures,
    galaxyType: astroData?.galaxyType,
    nebulaType: astroData?.nebulaType,
    planetType: astroData?.planetType,
    subType: astroData?.subType,
    structureDetails: astroData?.structureDetails,
    surfaceFeatures: astroData?.surfaceFeatures,
    colorDescription: astroData?.colorDescription,
    customVisualCharacteristics: astroData?.visualCharacteristics,
  };

  const result = buildImagePrompt(options);
  const validation = validatePrompt(result.prompt);

  // Calculate confidence score
  const confidence = calculateConfidence(objectType, {
    hasExplicitVisualFeatures: hasExplicitFeatures,
    hasSpectralType: !!spectralType,
    hasFamousFeatures: hasFamousFeatures,
    hasColorDescription: !!astroData?.colorDescription,
    hasStructureDetails: !!astroData?.structureDetails,
    validationWarnings: validation.warnings,
  });

  return {
    prompt: result.prompt,
    negativePrompt: result.negativePrompt,
    isValid: validation.valid,
    warnings: validation.warnings,
    confidence: confidence,
    featureSource: confidence.featureSource,
    derivedFeaturesCount: derivedFeaturesCount,
  };
}

async function main() {
  console.log('=== Regenerating All NFT Prompts ===');
  console.log('With confidence scoring and spectral derivation\n');

  // Build astronomical data lookup
  const astroLookup = buildAstroDataLookup();
  console.log(`Loaded ${astroLookup.size} astronomical objects for lookup\n`);

  // Get total count
  const totalNFTs = await prisma.nFT.count();
  console.log(`Total NFTs in database: ${totalNFTs}\n`);

  if (totalNFTs === 0) {
    console.log('No NFTs found. Exiting.');
    return;
  }

  // Process in batches
  const BATCH_SIZE = 100;
  let processed = 0;
  let updated = 0;
  let failed = 0;
  let withWarnings = 0;

  // Confidence tracking
  const confidenceScores: number[] = [];
  const featureSourceCounts: Record<string, number> = {
    explicit: 0,
    spectral: 0,
    famous: 0,
    template: 0,
    default: 0,
  };
  let spectralDerivedCount = 0;
  const lowConfidenceItems: { name: string; score: number; source: string }[] = [];

  while (processed < totalNFTs) {
    const nfts = await prisma.nFT.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        objectType: true,
        spectralType: true,
        notableFeatures: true,
        visualFeatures: true,
      },
      orderBy: { id: 'asc' },
      skip: processed,
      take: BATCH_SIZE,
    });

    if (nfts.length === 0) break;

    for (const nft of nfts) {
      try {
        const promptResult = generatePromptForNFT(nft, astroLookup);

        await prisma.nFT.update({
          where: { id: nft.id },
          data: {
            imagePrompt: promptResult.prompt,
            imageNegativePrompt: promptResult.negativePrompt,
            promptGeneratedAt: new Date(),
          },
        });

        updated++;
        if (!promptResult.isValid) {
          withWarnings++;
        }

        // Track confidence
        confidenceScores.push(promptResult.confidence.score);
        featureSourceCounts[promptResult.featureSource]++;

        if (promptResult.derivedFeaturesCount > 0) {
          spectralDerivedCount++;
        }

        // Track low confidence items for review
        if (promptResult.confidence.score < 0.5) {
          lowConfidenceItems.push({
            name: nft.name,
            score: promptResult.confidence.score,
            source: promptResult.featureSource,
          });
        }

        // Show detailed progress for specific NFTs
        if (nft.name === 'Sirius') {
          console.log(`\n--- Sirius Prompt Preview ---`);
          console.log(promptResult.prompt);
          console.log(`\nConfidence: ${promptResult.confidence.score} (${promptResult.featureSource})`);
          console.log(`--- End Preview ---\n`);
        }
      } catch (error: any) {
        failed++;
        console.error(`Failed to update ${nft.name}: ${error.message}`);
      }
    }

    processed += nfts.length;
    console.log(`Progress: ${processed}/${totalNFTs} (${Math.round(processed/totalNFTs*100)}%)`);
  }

  // Calculate statistics
  const avgConfidence = confidenceScores.length > 0
    ? Math.round((confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length) * 100) / 100
    : 0;
  const minConfidence = confidenceScores.length > 0 ? Math.min(...confidenceScores) : 0;
  const maxConfidence = confidenceScores.length > 0 ? Math.max(...confidenceScores) : 0;
  const highConfidenceCount = confidenceScores.filter(s => s >= 0.8).length;

  console.log(`\n${'='.repeat(50)}`);
  console.log(`=== GENERATION COMPLETE ===`);
  console.log(`${'='.repeat(50)}`);

  console.log(`\n📊 Basic Stats:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  With warnings: ${withWarnings}`);

  console.log(`\n🎯 Confidence Metrics:`);
  console.log(`  Average: ${avgConfidence}`);
  console.log(`  Range: ${minConfidence} - ${maxConfidence}`);
  console.log(`  High confidence (≥0.8): ${highConfidenceCount} (${Math.round(highConfidenceCount/updated*100)}%)`);
  console.log(`  Low confidence (<0.5): ${lowConfidenceItems.length}`);

  console.log(`\n🔧 Feature Sources:`);
  for (const [source, count] of Object.entries(featureSourceCounts)) {
    if (count > 0) {
      console.log(`  ${source}: ${count} (${Math.round(count/updated*100)}%)`);
    }
  }

  console.log(`\n🔬 Spectral Pipeline:`);
  console.log(`  Features derived from spectral type: ${spectralDerivedCount}`);

  if (lowConfidenceItems.length > 0 && lowConfidenceItems.length <= 10) {
    console.log(`\n⚠️  Low Confidence Items (may need review):`);
    for (const item of lowConfidenceItems) {
      console.log(`  - ${item.name}: ${item.score} (${item.source})`);
    }
  } else if (lowConfidenceItems.length > 10) {
    console.log(`\n⚠️  ${lowConfidenceItems.length} items have low confidence - consider adding visualFeatures`);
  }

  console.log(`\n${'='.repeat(50)}`);
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
