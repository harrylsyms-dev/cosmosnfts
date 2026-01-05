import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';
import { getAllAstronomicalObjects, AstronomicalObject } from '../../../../../lib/astronomicalData';
import { buildImagePrompt, PromptBuildOptions, validatePrompt } from '../../../../../lib/imagePromptTemplates';

// Build a lookup map from astronomical data by name (case-insensitive)
function buildAstroDataLookup(): Map<string, AstronomicalObject> {
  const allObjects = getAllAstronomicalObjects();
  const lookup = new Map<string, AstronomicalObject>();

  for (const obj of allObjects) {
    lookup.set(obj.name.toLowerCase(), obj);
    // Also add alternate names
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
    description: string;
    objectType: string | null;
    spectralType: string | null;
    notableFeatures: string | null;
  },
  astroLookup: Map<string, AstronomicalObject>
): { prompt: string; negativePrompt: string; isValid: boolean; warnings: string[] } {

  // Try to find matching astronomical data
  const astroData = astroLookup.get(nft.name.toLowerCase());

  // Build prompt options combining NFT data and astronomical data
  const options: PromptBuildOptions = {
    name: nft.name,
    objectType: nft.objectType || 'Unknown',
    description: nft.description,
    spectralType: nft.spectralType || astroData?.spectralType,
    mass: astroData?.mass,
    notableFeatures: nft.notableFeatures
      ? JSON.parse(nft.notableFeatures)
      : astroData?.notableFeatures,
    // Use astronomical data for type-specific fields
    galaxyType: astroData?.galaxyType,
    nebulaType: astroData?.nebulaType,
    planetType: astroData?.planetType,
    subType: astroData?.subType,
    structureDetails: astroData?.structureDetails,
    surfaceFeatures: astroData?.surfaceFeatures,
    colorDescription: astroData?.colorDescription,
    customVisualCharacteristics: astroData?.visualCharacteristics,
  };

  // Build the prompt using the template system
  const result = buildImagePrompt(options);

  // Negative prompt is already clean (no prefix)
  const negativePrompt = result.negativePrompt;

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

    // GET: Return stats about prompts
    if (req.method === 'GET') {
      const total = await prisma.nFT.count();
      const withPrompts = await prisma.nFT.count({
        where: { imagePrompt: { not: null } },
      });
      const withoutPrompts = total - withPrompts;

      return res.json({
        success: true,
        stats: {
          total,
          withPrompts,
          withoutPrompts,
        },
      });
    }

    // POST: Regenerate prompts for NFTs
    if (req.method === 'POST') {
      const {
        batchSize = 100,
        offset = 0,
        objectType,
        onlyMissing = false,
      } = req.body;

      const actualBatchSize = Math.min(Math.max(1, batchSize), 500);

      // Build astronomical data lookup
      const astroLookup = buildAstroDataLookup();
      console.log(`Loaded ${astroLookup.size} astronomical objects for lookup`);

      // Build query
      const where: any = {};
      if (objectType) {
        where.objectType = objectType;
      }
      if (onlyMissing) {
        where.imagePrompt = null;
      }

      // Fetch NFTs
      const nfts = await prisma.nFT.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          objectType: true,
          spectralType: true,
          notableFeatures: true,
          imagePrompt: true,
        },
        orderBy: { id: 'asc' },
        skip: offset,
        take: actualBatchSize,
      });

      if (nfts.length === 0) {
        return res.json({
          success: true,
          message: 'No NFTs found to process',
          processed: 0,
          offset,
          batchSize: actualBatchSize,
        });
      }

      // Process each NFT
      let updated = 0;
      let failed = 0;
      let warnings = 0;
      const errors: { id: number; name: string; error: string }[] = [];

      for (const nft of nfts) {
        try {
          const promptResult = generatePromptForNFT(nft, astroLookup);

          if (!promptResult.isValid) {
            warnings++;
          }

          await prisma.nFT.update({
            where: { id: nft.id },
            data: {
              imagePrompt: promptResult.prompt,
              imageNegativePrompt: promptResult.negativePrompt,
              promptGeneratedAt: new Date(),
            },
          });

          updated++;
        } catch (error: any) {
          failed++;
          errors.push({
            id: nft.id,
            name: nft.name,
            error: error?.message || 'Unknown error',
          });
        }
      }

      // Get remaining count
      const totalMatching = await prisma.nFT.count({ where });
      const remaining = Math.max(0, totalMatching - offset - actualBatchSize);

      console.log(`Admin ${admin.email} regenerated prompts for ${updated} NFTs (batch starting at ${offset})`);

      return res.json({
        success: true,
        message: `Regenerated prompts for ${updated} NFT(s)`,
        stats: {
          processed: nfts.length,
          updated,
          failed,
          warnings,
        },
        pagination: {
          offset,
          batchSize: actualBatchSize,
          remaining,
          nextOffset: remaining > 0 ? offset + actualBatchSize : null,
        },
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Failed to regenerate prompts:', error);
    res.status(500).json({ error: 'Failed to regenerate prompts', details: error?.message });
  }
}
