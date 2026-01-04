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
import {
  getReferenceImage,
  getFallbackReferenceImage,
  type ReferenceImage,
} from '../../../../lib/referenceImages';

const MAX_NFTS = 20000;

// Logarithmic score calculation (0-100 based on where value falls in range)
function logScore(value: number | undefined, min: number, max: number, defaultScore = 50): number {
  if (value === undefined || value <= 0) return defaultScore;
  const clampedValue = Math.max(min, Math.min(max, value));
  const logValue = Math.log10(clampedValue);
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  if (logMax === logMin) return 50;
  return Math.max(0, Math.min(100, ((logValue - logMin) / (logMax - logMin)) * 100));
}

// Calculate SCIENTIFIC scores from real astronomical data
// 5 metrics at 100 points each = 500 total
function calculateScores(obj: AstronomicalObject): {
  distance: number;    // Distance from Earth (further = more unique)
  mass: number;        // Mass in solar masses (logarithmic scale)
  luminosity: number;  // Brightness/luminosity (logarithmic scale)
  temperature: number; // Surface temperature (logarithmic scale)
  discovery: number;   // Historical discovery value (older = more significant)
} {
  // Distance Score (0-100): Closer objects are more accessible/studied, but rare extremes score high
  // Range: 0.00001 ly (within solar system) to 13 billion ly (observable universe edge)
  let distanceScore = 50;
  if (obj.distanceLy !== undefined) {
    // Very close (<100 ly) and very far (>1 billion ly) score highest
    if (obj.distanceLy < 100) {
      distanceScore = 90 - (obj.distanceLy / 100) * 40; // Closer = higher (50-90)
    } else if (obj.distanceLy > 1000000000) {
      distanceScore = 80 + Math.min(20, (obj.distanceLy - 1000000000) / 1000000000 * 20); // Edge of universe
    } else {
      distanceScore = logScore(obj.distanceLy, 100, 1000000000, 50);
    }
  }

  // Mass Score (0-100): Logarithmic scale for vast range
  // Range: 0.00001 solar masses (small objects) to 100 billion solar masses (largest black holes)
  let massScore = logScore(obj.mass, 0.00001, 100000000000, 50);
  // Boost extreme masses
  if (obj.mass !== undefined) {
    if (obj.mass > 1000000) massScore = Math.min(100, massScore + 15); // Supermassive
    if (obj.mass < 0.001) massScore = Math.min(100, massScore + 10); // Tiny
  }

  // Luminosity Score (0-100): Logarithmic scale
  // Range: 0.00001 solar luminosities to 10 trillion solar luminosities (quasars)
  let luminosityScore = logScore(obj.luminosity, 0.00001, 10000000000000, 50);
  // Use magnitude as fallback if no luminosity
  if (obj.luminosity === undefined && obj.magnitude !== undefined) {
    // Brighter = lower magnitude = higher score
    luminosityScore = Math.max(0, Math.min(100, 100 - ((obj.magnitude + 5) / 35) * 100));
  }

  // Temperature Score (0-100): Logarithmic scale
  // Range: 3 K (cosmic background) to 1 billion K (neutron star cores)
  let temperatureScore = logScore(obj.temperature, 3, 1000000000, 50);
  // Extreme temperatures are interesting
  if (obj.temperature !== undefined) {
    if (obj.temperature > 100000) temperatureScore = Math.min(100, temperatureScore + 10);
    if (obj.temperature < 100) temperatureScore = Math.min(100, temperatureScore + 10);
  }

  // Discovery Score (0-100): Historical significance
  // Older discoveries = more historical significance, but very recent = cutting edge
  let discoveryScore = 50;
  if (obj.discoveryYear !== undefined) {
    const currentYear = new Date().getFullYear();
    if (obj.discoveryYear < 1600) {
      discoveryScore = 95; // Ancient astronomy
    } else if (obj.discoveryYear < 1800) {
      discoveryScore = 85; // Early telescopic era
    } else if (obj.discoveryYear < 1900) {
      discoveryScore = 70; // 19th century
    } else if (obj.discoveryYear < 1960) {
      discoveryScore = 55; // Early 20th century
    } else if (obj.discoveryYear < 2000) {
      discoveryScore = 45; // Space age
    } else if (obj.discoveryYear > currentYear - 5) {
      discoveryScore = 80; // Very recent = cutting edge
    } else {
      discoveryScore = 40; // Recent but not cutting edge
    }
  }

  // Object type modifiers (some types are inherently more scientifically interesting)
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
      let skippedNoReference = 0;

      for (const obj of objectsToCreate) {
        // Fetch reference image from NASA/ESA - REQUIRED for NFT creation
        let referenceImage: ReferenceImage | null = null;

        try {
          console.log(`Fetching reference image for: ${obj.name} (${obj.objectType})`);
          referenceImage = await getReferenceImage(obj.name, obj.objectType);
          console.log(`getReferenceImage result for ${obj.name}:`, referenceImage ? `Found from ${referenceImage.source}` : 'null');
        } catch (refError: any) {
          console.error(`Error fetching reference image for ${obj.name}:`, refError?.message || refError);
        }

        // Try fallback by object type if no specific image found
        if (!referenceImage && obj.objectType) {
          referenceImage = getFallbackReferenceImage(obj.objectType);
          if (referenceImage) {
            console.log(`Using fallback reference image for ${obj.name} (${obj.objectType}): ${referenceImage.url}`);
          }
        }

        // Skip objects without reference images - they cannot be minted
        if (!referenceImage) {
          console.log(`Skipping ${obj.name}: No reference image available from NASA/ESA`);
          skippedNoReference++;
          continue;
        }

        console.log(`Creating NFT for ${obj.name} with reference image from ${referenceImage.source}: ${referenceImage.url}`);

        const scores = calculateScores(obj);
        const totalScore = scores.distance + scores.mass + scores.luminosity + scores.temperature + scores.discovery;
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
            // Scientific scores (repurposing existing fields):
            // fameVisibility = Distance Score, scientificSignificance = Mass Score
            // rarity = Luminosity Score, discoveryRecency = Temperature Score
            // culturalImpact = Discovery Score
            fameVisibility: scores.distance,
            scientificSignificance: scores.mass,
            rarity: scores.luminosity,
            discoveryRecency: scores.temperature,
            culturalImpact: scores.discovery,
            totalScore,
            badgeTier,
            discoveryYear: obj.discoveryYear || null,
            constellation: obj.constellation || null,
            // Scientific data (raw values for display/recalculation)
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
            // Reference image from NASA/ESA (required)
            referenceImageUrl: referenceImage.url,
            referenceImageSource: referenceImage.source,
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
          referenceImage: {
            url: referenceImage.url,
            source: referenceImage.source,
          },
          promptGenerated: promptResult.isValid,
          promptWarnings: promptResult.warnings.length > 0 ? promptResult.warnings : undefined,
        });
      }

      console.log(`Admin ${admin.email} generated ${generatedNfts.length} NFT(s) from real astronomical data`);
      console.log(`Image prompts: ${promptsGenerated} valid, ${promptWarnings} with warnings`);
      if (skippedNoReference > 0) {
        console.log(`Skipped ${skippedNoReference} object(s) - no reference images available`);
      }

      const newTotal = await prisma.nFT.count();

      return res.json({
        success: true,
        message: skippedNoReference > 0
          ? `Generated ${generatedNfts.length} NFT(s) with reference images. Skipped ${skippedNoReference} object(s) without NASA/ESA reference images.`
          : `Generated ${generatedNfts.length} NFT(s) from real astronomical data with reference images`,
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
        referenceImageStats: {
          withReferenceImage: generatedNfts.length,
          skippedNoReference,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Failed to generate NFT from real data:', error);
    res.status(500).json({ error: 'Failed to generate NFT', details: error?.message });
  }
}
