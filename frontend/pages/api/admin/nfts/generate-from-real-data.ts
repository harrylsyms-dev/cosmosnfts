import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';
import {
  AstronomicalObject,
  getAllAstronomicalObjects,
  getObjectsByType,
  TOTAL_AVAILABLE_OBJECTS,
} from '../../../../lib/astronomicalData';
import {
  buildImagePrompt,
  PromptBuildOptions,
  validatePrompt,
} from '../../../../lib/imagePromptTemplates';

const MAX_NFTS = 20000;

// Calculate scores from real astronomical data
function calculateScores(obj: AstronomicalObject): {
  fame: number;
  significance: number;
  rarity: number;
  discovery: number;
  cultural: number;
} {
  // Fame: Based on magnitude (visibility), alternate names, notable features
  let fame = 30;
  if (obj.magnitude !== undefined) {
    // Brighter objects (lower magnitude) are more famous
    if (obj.magnitude < 0) fame += 40;
    else if (obj.magnitude < 2) fame += 30;
    else if (obj.magnitude < 4) fame += 20;
    else if (obj.magnitude < 6) fame += 10;
  }
  if (obj.alternateNames && obj.alternateNames.length > 2) fame += 15;
  if (obj.notableFeatures && obj.notableFeatures.length > 2) fame += 10;
  fame = Math.min(100, fame);

  // Scientific Significance: Based on description content and scientificSignificance field
  let significance = 40;
  if (obj.scientificSignificance) {
    if (obj.scientificSignificance.includes('first') || obj.scientificSignificance.includes('First')) significance += 25;
    if (obj.scientificSignificance.includes('key') || obj.scientificSignificance.includes('important')) significance += 15;
    if (obj.scientificSignificance.includes('study') || obj.scientificSignificance.includes('research')) significance += 10;
  }
  significance = Math.min(100, significance);

  // Rarity: Based on object type rarity and distance
  let rarity = 30;
  const rareTypes = ['Black Hole', 'Quasar', 'Magnetar', 'Pulsar'];
  const uncommonTypes = ['Supernova Remnant', 'Neutron Star', 'Exoplanet'];
  if (rareTypes.includes(obj.objectType)) rarity += 50;
  else if (uncommonTypes.includes(obj.objectType)) rarity += 30;

  // Distance also affects rarity (extremely far or extremely close are rare)
  if (obj.distanceLy !== undefined) {
    if (obj.distanceLy < 10) rarity += 15; // Very close objects are rare
    if (obj.distanceLy > 1000000000) rarity += 20; // Extremely distant objects
  }
  rarity = Math.min(100, rarity);

  // Discovery Recency: Newer discoveries score higher
  let discovery = 50;
  if (obj.discoveryYear !== undefined) {
    if (obj.discoveryYear >= 2015) discovery = 95;
    else if (obj.discoveryYear >= 2000) discovery = 80;
    else if (obj.discoveryYear >= 1990) discovery = 70;
    else if (obj.discoveryYear >= 1960) discovery = 55;
    else if (obj.discoveryYear >= 1900) discovery = 40;
    else if (obj.discoveryYear >= 1800) discovery = 30;
    else if (obj.discoveryYear >= 1600) discovery = 20;
    else discovery = 10; // Ancient discoveries
  }

  // Cultural Impact: Based on alternate names and notable features
  let cultural = 25;
  if (obj.alternateNames && obj.alternateNames.length > 0) {
    // Named objects have cultural significance
    cultural += Math.min(30, obj.alternateNames.length * 10);
  }
  if (obj.notableFeatures) {
    cultural += Math.min(30, obj.notableFeatures.length * 7);
  }
  // Famous objects get bonus
  const famousObjects = ['Sirius', 'Betelgeuse', 'Orion Nebula', 'Andromeda', 'Crab Nebula', 'Halley'];
  if (famousObjects.some(f => obj.name.includes(f))) cultural += 20;
  cultural = Math.min(100, cultural);

  return {
    fame: Math.round(fame),
    significance: Math.round(significance),
    rarity: Math.round(rarity),
    discovery: Math.round(discovery),
    cultural: Math.round(cultural),
  };
}

function getBadgeTier(totalScore: number): string {
  if (totalScore >= 450) return 'LEGENDARY';
  if (totalScore >= 425) return 'ELITE';
  if (totalScore >= 400) return 'PREMIUM';
  if (totalScore >= 375) return 'EXCEPTIONAL';
  return 'STANDARD';
}

// Generate image prompt from astronomical object data
function generateImagePromptForObject(obj: AstronomicalObject): {
  prompt: string;
  negativePrompt: string;
  isValid: boolean;
  warnings: string[];
} {
  // Build prompt options from astronomical data
  const options: PromptBuildOptions = {
    name: obj.name,
    objectType: obj.objectType,
    description: obj.description,
    spectralType: obj.spectralType,
    mass: obj.mass,
    notableFeatures: obj.notableFeatures,
    // Use pre-defined type-specific fields if available
    galaxyType: obj.galaxyType,
    nebulaType: obj.nebulaType,
    planetType: obj.planetType,
    subType: obj.subType,
    structureDetails: obj.structureDetails,
    surfaceFeatures: obj.surfaceFeatures,
    colorDescription: obj.colorDescription,
    customVisualCharacteristics: obj.visualCharacteristics,
  };

  // Build the prompt using the tested template system
  const result = buildImagePrompt(options);

  // Remove "--no " prefix for database storage (will be added back by Leonardo API handler)
  const negativePrompt = result.negativePrompt.replace('--no ', '');

  // Validate the generated prompt
  const validation = validatePrompt(result.prompt);

  return {
    prompt: result.prompt,
    negativePrompt,
    isValid: validation.valid,
    warnings: validation.warnings,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // GET: Return stats about available real data
    if (req.method === 'GET') {
      const allObjects = getAllAstronomicalObjects();
      const existingNfts = await prisma.nFT.findMany({
        select: { name: true },
      });
      const existingNames = new Set(existingNfts.map((n: { name: string }) => n.name.toLowerCase()));

      // Count how many real objects are not yet NFTs
      const availableObjects = allObjects.filter(obj => !existingNames.has(obj.name.toLowerCase()));

      // Group by type
      const typeStats: Record<string, { total: number; available: number }> = {};
      for (const obj of allObjects) {
        if (!typeStats[obj.objectType]) {
          typeStats[obj.objectType] = { total: 0, available: 0 };
        }
        typeStats[obj.objectType].total++;
        if (!existingNames.has(obj.name.toLowerCase())) {
          typeStats[obj.objectType].available++;
        }
      }

      const totalNfts = await prisma.nFT.count();

      return res.json({
        success: true,
        realDataStats: {
          totalRealObjects: TOTAL_AVAILABLE_OBJECTS,
          availableToMint: availableObjects.length,
          alreadyMinted: TOTAL_AVAILABLE_OBJECTS - availableObjects.length,
          byType: typeStats,
        },
        nftStats: {
          total: totalNfts,
          maxCapacity: MAX_NFTS,
          remainingSlots: MAX_NFTS - totalNfts,
        },
      });
    }

    // POST: Generate NFTs from real data
    if (req.method === 'POST') {
      const { count = 1, objectType: requestedType, specificObjects } = req.body;
      const generateCount = Math.min(Math.max(1, count), 100);

      // Check capacity
      const totalCount = await prisma.nFT.count();
      const remainingSlots = MAX_NFTS - totalCount;

      if (remainingSlots <= 0) {
        return res.status(400).json({
          error: 'Maximum NFT capacity reached',
          message: `Cannot generate more NFTs. Maximum capacity of ${MAX_NFTS.toLocaleString()} has been reached.`,
        });
      }

      // Get existing names to avoid duplicates
      const existingNfts = await prisma.nFT.findMany({
        select: { name: true },
      });
      const existingNames = new Set<string>(existingNfts.map((n: { name: string }) => n.name.toLowerCase()));

      // Get real objects to mint
      let objectsToMint: AstronomicalObject[] = [];

      if (specificObjects && Array.isArray(specificObjects)) {
        // Specific objects requested by name
        const allObjects = getAllAstronomicalObjects();
        objectsToMint = allObjects.filter(obj =>
          specificObjects.includes(obj.name) && !existingNames.has(obj.name.toLowerCase())
        );
      } else if (requestedType) {
        // Filter by object type
        objectsToMint = getObjectsByType(requestedType).filter(
          obj => !existingNames.has(obj.name.toLowerCase())
        );
      } else {
        // Get all available objects
        objectsToMint = getAllAstronomicalObjects().filter(
          obj => !existingNames.has(obj.name.toLowerCase())
        );
      }

      if (objectsToMint.length === 0) {
        return res.status(400).json({
          error: 'No available objects',
          message: requestedType
            ? `All ${requestedType} objects have already been minted as NFTs`
            : 'All real astronomical objects have already been minted as NFTs',
        });
      }

      const actualCount = Math.min(generateCount, objectsToMint.length, remainingSlots);
      const objectsToCreate = objectsToMint.slice(0, actualCount);

      // Get max token ID
      const maxToken = await prisma.nFT.aggregate({
        _max: { tokenId: true },
      });
      let nextTokenId = (maxToken._max.tokenId || 0) + 1;

      // Generate NFTs
      const generatedNfts = [];

      // Track prompt generation stats
      let promptsGenerated = 0;
      let promptWarnings = 0;

      for (const obj of objectsToCreate) {
        const scores = calculateScores(obj);
        const totalScore = scores.fame + scores.significance + scores.rarity + scores.discovery + scores.cultural;
        const badgeTier = getBadgeTier(totalScore);

        // Generate image prompt from astronomical data
        const promptResult = generateImagePromptForObject(obj);
        if (promptResult.isValid) {
          promptsGenerated++;
        } else {
          promptWarnings++;
        }

        const nft = await prisma.nFT.create({
          data: {
            tokenId: nextTokenId++,
            name: obj.name,
            description: obj.description,
            objectType: obj.objectType,
            status: 'AVAILABLE',
            fameVisibility: scores.fame,
            scientificSignificance: scores.significance,
            rarity: scores.rarity,
            discoveryRecency: scores.discovery,
            culturalImpact: scores.cultural,
            totalScore,
            badgeTier,
            discoveryYear: obj.discoveryYear || null,
            constellation: obj.constellation || null,
            // Scientific data for prompt generation
            spectralType: obj.spectralType || null,
            distanceLy: obj.distanceLy || null,
            massSolar: obj.mass || null,
            temperatureK: obj.temperature || null,
            luminosity: obj.luminosity || null,
            notableFeatures: obj.notableFeatures ? JSON.stringify(obj.notableFeatures) : null,
            // Pre-generated image prompts
            imagePrompt: promptResult.prompt,
            imageNegativePrompt: promptResult.negativePrompt,
            promptGeneratedAt: new Date(),
          },
        });

        generatedNfts.push({
          id: nft.id,
          tokenId: nft.tokenId,
          name: nft.name,
          objectType: nft.objectType,
          totalScore: nft.totalScore,
          badgeTier: nft.badgeTier,
          source: 'Real Astronomical Data',
          promptGenerated: promptResult.isValid,
          promptWarnings: promptResult.warnings.length > 0 ? promptResult.warnings : undefined,
        });
      }

      console.log(`Admin ${admin.email} generated ${generatedNfts.length} NFT(s) from real astronomical data`);
      console.log(`Image prompts: ${promptsGenerated} valid, ${promptWarnings} with warnings`);

      const newTotal = await prisma.nFT.count();

      return res.json({
        success: true,
        message: `Generated ${generatedNfts.length} NFT(s) from real astronomical data with image prompts`,
        generated: generatedNfts,
        remaining: {
          totalRealObjects: TOTAL_AVAILABLE_OBJECTS,
          alreadyMinted: TOTAL_AVAILABLE_OBJECTS - (objectsToMint.length - actualCount),
        },
        nftStats: {
          total: newTotal,
          maxCapacity: MAX_NFTS,
          remainingSlots: MAX_NFTS - newTotal,
        },
        promptStats: {
          generated: promptsGenerated,
          withWarnings: promptWarnings,
          total: generatedNfts.length,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Failed to generate NFT from real data:', error);
    res.status(500).json({ error: 'Failed to generate NFT', details: error?.message });
  }
}
