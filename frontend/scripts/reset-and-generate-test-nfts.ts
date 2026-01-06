// Reset all NFTs and generate 2 of each object type for testing
// Run with: npx tsx scripts/reset-and-generate-test-nfts.ts

import { PrismaClient } from '@prisma/client';
import {
  getAllAstronomicalObjects,
  getObjectsByType,
  AstronomicalObject,
} from '../lib/astronomicalData';
import {
  buildImagePrompt,
  PromptBuildOptions,
  validatePrompt,
} from '../lib/imagePromptTemplates';

const prisma = new PrismaClient();

// Logarithmic score calculation
function logScore(value: number | undefined, min: number, max: number, defaultScore = 50): number {
  if (value === undefined || value <= 0) return defaultScore;
  const clampedValue = Math.max(min, Math.min(max, value));
  const logValue = Math.log10(clampedValue);
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  if (logMax === logMin) return 50;
  return Math.max(0, Math.min(100, ((logValue - logMin) / (logMax - logMin)) * 100));
}

function calculateScores(obj: AstronomicalObject): {
  distance: number;
  mass: number;
  luminosity: number;
  temperature: number;
  discovery: number;
} {
  let distanceScore = 50;
  if (obj.distanceLy !== undefined) {
    if (obj.distanceLy < 100) {
      distanceScore = 90 - (obj.distanceLy / 100) * 40;
    } else if (obj.distanceLy > 1000000000) {
      distanceScore = 80 + Math.min(20, (obj.distanceLy - 1000000000) / 1000000000 * 20);
    } else {
      distanceScore = logScore(obj.distanceLy, 100, 1000000000, 50);
    }
  }

  let massScore = logScore(obj.mass, 0.00001, 100000000000, 50);
  if (obj.mass !== undefined) {
    if (obj.mass > 1000000) massScore = Math.min(100, massScore + 15);
    if (obj.mass < 0.001) massScore = Math.min(100, massScore + 10);
  }

  let luminosityScore = logScore(obj.luminosity, 0.00001, 10000000000000, 50);
  if (obj.luminosity === undefined && obj.magnitude !== undefined) {
    luminosityScore = Math.max(0, Math.min(100, 100 - ((obj.magnitude + 5) / 35) * 100));
  }

  let temperatureScore = logScore(obj.temperature, 3, 1000000000, 50);
  if (obj.temperature !== undefined) {
    if (obj.temperature > 100000) temperatureScore = Math.min(100, temperatureScore + 10);
    if (obj.temperature < 100) temperatureScore = Math.min(100, temperatureScore + 10);
  }

  let discoveryScore = 50;
  if (obj.discoveryYear !== undefined) {
    const currentYear = new Date().getFullYear();
    if (obj.discoveryYear < 1600) discoveryScore = 95;
    else if (obj.discoveryYear < 1800) discoveryScore = 85;
    else if (obj.discoveryYear < 1900) discoveryScore = 70;
    else if (obj.discoveryYear < 1960) discoveryScore = 55;
    else if (obj.discoveryYear < 2000) discoveryScore = 45;
    else if (obj.discoveryYear > currentYear - 5) discoveryScore = 80;
    else discoveryScore = 40;
  }

  const typeMultiplier: Record<string, number> = {
    'Black Hole': 1.15,
    'Quasar': 1.15,
    'Magnetar': 1.12,
    'Pulsar': 1.10,
    'Neutron Star': 1.10,
    'Supernova Remnant': 1.08,
    'Exoplanet': 1.05,
    'Galaxy': 1.03,
    'Nebula': 1.02,
  };
  const multiplier = typeMultiplier[obj.objectType] || 1.0;

  return {
    distance: Math.round(Math.min(100, distanceScore * multiplier)),
    mass: Math.round(Math.min(100, massScore * multiplier)),
    luminosity: Math.round(Math.min(100, luminosityScore * multiplier)),
    temperature: Math.round(Math.min(100, temperatureScore * multiplier)),
    discovery: Math.round(Math.min(100, discoveryScore * multiplier)),
  };
}

function getBadgeTier(totalScore: number): string {
  if (totalScore >= 450) return 'LEGENDARY';
  if (totalScore >= 425) return 'ELITE';
  if (totalScore >= 400) return 'PREMIUM';
  if (totalScore >= 375) return 'EXCEPTIONAL';
  return 'STANDARD';
}

function generateImagePromptForObject(obj: AstronomicalObject): {
  prompt: string;
  negativePrompt: string;
  isValid: boolean;
  warnings: string[];
} {
  const options: PromptBuildOptions = {
    name: obj.name,
    objectType: obj.objectType,
    description: obj.description,
    spectralType: obj.spectralType,
    mass: obj.mass,
    notableFeatures: obj.notableFeatures,
    galaxyType: obj.galaxyType,
    nebulaType: obj.nebulaType,
    planetType: obj.planetType,
    subType: obj.subType,
    structureDetails: obj.structureDetails,
    surfaceFeatures: obj.surfaceFeatures,
    colorDescription: obj.colorDescription,
    customVisualCharacteristics: obj.visualCharacteristics,
  };

  const result = buildImagePrompt(options);
  const negativePrompt = result.negativePrompt.replace('--no ', '');
  const validation = validatePrompt(result.prompt);

  return {
    prompt: result.prompt,
    negativePrompt,
    isValid: validation.valid,
    warnings: validation.warnings,
  };
}

async function main() {
  console.log('===========================================');
  console.log('RESETTING NFTs AND GENERATING TEST SET');
  console.log('===========================================\n');

  // Step 1: Clear all existing NFTs
  console.log('Step 1: Clearing all existing NFTs...');
  const deleteResult = await prisma.nFT.deleteMany({});
  console.log(`  Deleted ${deleteResult.count} NFTs\n`);

  // Step 2: Get all astronomical objects grouped by type
  console.log('Step 2: Loading astronomical data...');
  const allObjects = getAllAstronomicalObjects();

  // Group by type
  const objectsByType: Record<string, AstronomicalObject[]> = {};
  for (const obj of allObjects) {
    if (!objectsByType[obj.objectType]) {
      objectsByType[obj.objectType] = [];
    }
    objectsByType[obj.objectType].push(obj);
  }

  console.log('  Available object types:');
  for (const [type, objects] of Object.entries(objectsByType)) {
    console.log(`    ${type}: ${objects.length} objects`);
  }
  console.log('');

  // Step 3: Select 2 of each type
  console.log('Step 3: Selecting 2 of each type...');
  const selectedObjects: AstronomicalObject[] = [];

  for (const [type, objects] of Object.entries(objectsByType)) {
    // Take first 2 (or 1 if only 1 available)
    const count = Math.min(2, objects.length);
    const selected = objects.slice(0, count);
    selectedObjects.push(...selected);
    console.log(`  ${type}: selected ${count} - ${selected.map(o => o.name).join(', ')}`);
  }
  console.log('');

  // Step 4: Create NFTs
  console.log('Step 4: Creating NFTs with optimized prompts...\n');
  let tokenId = 1;
  const createdNfts: any[] = [];

  for (const obj of selectedObjects) {
    const scores = calculateScores(obj);
    const totalScore = scores.distance + scores.mass + scores.luminosity + scores.temperature + scores.discovery;
    const badgeTier = getBadgeTier(totalScore);
    const promptResult = generateImagePromptForObject(obj);

    const nft = await prisma.nFT.create({
      data: {
        tokenId: tokenId++,
        name: obj.name,
        description: obj.description,
        objectType: obj.objectType,
        status: 'AVAILABLE',
        fameVisibility: scores.distance,
        scientificSignificance: scores.mass,
        rarity: scores.luminosity,
        discoveryRecency: scores.temperature,
        culturalImpact: scores.discovery,
        totalScore,
        badgeTier,
        discoveryYear: obj.discoveryYear || null,
        constellation: obj.constellation || null,
        spectralType: obj.spectralType || null,
        distanceLy: obj.distanceLy || null,
        massSolar: obj.mass || null,
        temperatureK: obj.temperature || null,
        luminosity: obj.luminosity || null,
        notableFeatures: obj.notableFeatures ? JSON.stringify(obj.notableFeatures) : null,
        imagePrompt: promptResult.prompt,
        imageNegativePrompt: promptResult.negativePrompt,
        promptGeneratedAt: new Date(),
      },
    });

    createdNfts.push({
      id: nft.id,
      name: nft.name,
      objectType: nft.objectType,
      totalScore: nft.totalScore,
      promptValid: promptResult.isValid,
    });

    console.log(`  ✓ Created: ${obj.name} (${obj.objectType}) - Score: ${totalScore}`);
  }

  // Summary
  console.log('\n===========================================');
  console.log('SUMMARY');
  console.log('===========================================');
  console.log(`Total NFTs created: ${createdNfts.length}`);
  console.log('\nBy object type:');

  const byType: Record<string, number> = {};
  for (const nft of createdNfts) {
    byType[nft.objectType] = (byType[nft.objectType] || 0) + 1;
  }
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }

  console.log('\nNFT IDs for image generation:');
  console.log(createdNfts.map(n => n.id).join(', '));

  console.log('\n✅ Done! You can now generate images from the admin panel.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
