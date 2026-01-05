/**
 * Script to regenerate image prompts for all NFTs in the database
 * Uses the updated template system with object name in parentheses
 *
 * Run with: npx ts-node scripts/regenerate-all-prompts.ts
 */

import { PrismaClient } from '@prisma/client';
import { getAllAstronomicalObjects, AstronomicalObject } from '../lib/astronomicalData';
import { buildImagePrompt, PromptBuildOptions, validatePrompt } from '../lib/imagePromptTemplates';

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

// Generate prompt from NFT data + astronomical data lookup
function generatePromptForNFT(
  nft: {
    name: string;
    description: string | null;
    objectType: string | null;
    spectralType: string | null;
    notableFeatures: string | null;
  },
  astroLookup: Map<string, AstronomicalObject>
): { prompt: string; negativePrompt: string; isValid: boolean; warnings: string[] } {

  const astroData = astroLookup.get(nft.name.toLowerCase());

  const options: PromptBuildOptions = {
    name: nft.name,
    objectType: nft.objectType || 'Unknown',
    description: nft.description || undefined,
    spectralType: nft.spectralType || astroData?.spectralType,
    mass: astroData?.mass,
    notableFeatures: nft.notableFeatures
      ? JSON.parse(nft.notableFeatures)
      : astroData?.notableFeatures,
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

  return {
    prompt: result.prompt,
    negativePrompt: result.negativePrompt,
    isValid: validation.valid,
    warnings: validation.warnings,
  };
}

async function main() {
  console.log('=== Regenerating All NFT Prompts ===\n');

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

  while (processed < totalNFTs) {
    const nfts = await prisma.nFT.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        objectType: true,
        spectralType: true,
        notableFeatures: true,
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

        // Show progress for specific NFTs
        if (nft.name === 'Sirius') {
          console.log(`\n--- Sirius Prompt Preview ---`);
          console.log(promptResult.prompt);
          console.log(`\n--- Negative Prompt ---`);
          console.log(promptResult.negativePrompt);
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

  console.log(`\n=== Complete ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`With warnings: ${withWarnings}`);
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
