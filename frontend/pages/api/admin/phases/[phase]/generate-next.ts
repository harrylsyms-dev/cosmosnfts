import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';
import { buildImagePrompt, PromptBuildOptions } from '../../../../../lib/imagePromptTemplates';
import { getAllAstronomicalObjects, AstronomicalObject } from '../../../../../lib/astronomicalData';
import crypto from 'crypto';

// Build astronomical data lookup
function buildAstroLookup(): Map<string, AstronomicalObject> {
  try {
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
  } catch (err) {
    console.error('Failed to load astronomical data:', err);
    return new Map();
  }
}

// Generate prompt for an NFT using the robust template system
function generatePromptForNFT(
  nft: {
    name: string;
    description: string | null;
    objectType: string | null;
    spectralType: string | null;
    notableFeatures: string | null;
  },
  astroLookup: Map<string, AstronomicalObject>
): { prompt: string; negativePrompt: string } {
  const astroData = astroLookup.get(nft.name.toLowerCase());

  const options: PromptBuildOptions = {
    name: nft.name,
    objectType: nft.objectType || 'Unknown',
    description: nft.description ?? undefined,
    spectralType: nft.spectralType || astroData?.spectralType,
    mass: astroData?.mass,
    notableFeatures: nft.notableFeatures
      ? (() => { try { return JSON.parse(nft.notableFeatures); } catch { return undefined; } })()
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

  return buildImagePrompt(options);
}

// Decrypt API key if encrypted
function decryptApiKey(encryptedData: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey || !encryptedData.includes(':')) {
    return encryptedData;
  }

  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return encryptedData;

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    return encryptedData;
  }
}

// Get stored API key
async function getApiKey(service: string): Promise<string | null> {
  try {
    const stored = await prisma.apiKey.findUnique({
      where: { service },
      select: { encryptedKey: true }
    });
    if (stored?.encryptedKey) {
      return decryptApiKey(stored.encryptedKey);
    }
  } catch (e) {
    console.error(`Failed to get API key for ${service}:`, e);
  }
  return null;
}

// Image generation settings type
interface LeonardoSettings {
  modelId: string;
  modelName: string;
  width: number;
  height: number;
  contrast: number;
  enhancePrompt: boolean;
  numImages: number;
  isPublic: boolean;
}

// Default settings if not configured
const DEFAULT_SETTINGS: LeonardoSettings = {
  modelId: 'flux-pro-2.0',
  modelName: 'FLUX.2 Pro',
  width: 1440,
  height: 1440,
  contrast: 3.5,
  enhancePrompt: false,
  numImages: 1,
  isPublic: false,
};

// Get Leonardo settings from database
async function getLeonardoSettings(): Promise<LeonardoSettings> {
  try {
    const config = await prisma.imagePromptConfig.findUnique({
      where: { id: 'main' },
    });

    if (config) {
      return {
        modelId: config.leonardoModelId || DEFAULT_SETTINGS.modelId,
        modelName: config.leonardoModelName || DEFAULT_SETTINGS.modelName,
        width: config.imageWidth || DEFAULT_SETTINGS.width,
        height: config.imageHeight || DEFAULT_SETTINGS.height,
        contrast: config.contrast || DEFAULT_SETTINGS.contrast,
        enhancePrompt: config.enhancePrompt ?? DEFAULT_SETTINGS.enhancePrompt,
        numImages: config.numImages || DEFAULT_SETTINGS.numImages,
        isPublic: config.isPublic ?? DEFAULT_SETTINGS.isPublic,
      };
    }
  } catch (err) {
    console.warn('Failed to load Leonardo settings, using defaults:', err);
  }
  return DEFAULT_SETTINGS;
}

// Start Leonardo generation and return generation ID (non-blocking)
async function startLeonardoGeneration(
  apiKey: string,
  prompt: string,
  settings: LeonardoSettings
): Promise<string> {
  const isV2Model = settings.modelId === 'flux-pro-2.0';

  let requestBody: any;
  let apiUrl: string;

  if (isV2Model) {
    apiUrl = 'https://cloud.leonardo.ai/api/rest/v2/generations';
    requestBody = {
      model: 'flux-pro-2.0',
      public: settings.isPublic,
      parameters: {
        prompt: prompt,
        quantity: settings.numImages,
        width: settings.width,
        height: settings.height,
      },
    };
  } else {
    apiUrl = 'https://cloud.leonardo.ai/api/rest/v1/generations';
    requestBody = {
      modelId: settings.modelId,
      prompt: prompt,
      num_images: settings.numImages,
      width: settings.width,
      height: settings.height,
      contrast: settings.contrast,
      enhancePrompt: settings.enhancePrompt,
      public: settings.isPublic,
    };
  }

  console.log(`Leonardo API request to ${apiUrl}`);
  console.log(`Prompt: ${prompt.substring(0, 200)}...`);

  const createRes = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!createRes.ok) {
    const error = await createRes.text();
    console.error('Leonardo API error response:', error);
    throw new Error(`Leonardo API error: ${error}`);
  }

  const createData = await createRes.json();
  console.log('Leonardo response:', JSON.stringify(createData, null, 2));

  const generationId = isV2Model
    ? createData.generate?.generationId
    : createData.sdGenerationJob?.generationId;

  if (!generationId) {
    throw new Error(`No generation ID returned. Response: ${JSON.stringify(createData)}`);
  }

  return generationId;
}

// Check Leonardo generation status
async function checkLeonardoStatus(
  apiKey: string,
  generationId: string
): Promise<{ status: string; imageUrl?: string; error?: string }> {
  const statusRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  if (!statusRes.ok) {
    return { status: 'CHECKING', error: 'Status check failed' };
  }

  const statusData = await statusRes.json();
  const generation = statusData.generations_by_pk;

  if (!generation) {
    return { status: 'PENDING' };
  }

  if (generation.status === 'FAILED') {
    return { status: 'FAILED', error: generation.failureReason || 'Unknown failure' };
  }

  const images = generation.generated_images;
  if (images && images.length > 0 && images[0].url) {
    return { status: 'COMPLETE', imageUrl: images[0].url };
  }

  return { status: generation.status || 'PENDING' };
}

// Upload to Pinata
async function uploadToPinata(
  imageUrl: string,
  apiKey: string,
  secretKey: string,
  nftName: string
): Promise<{ hash: string; url: string }> {
  console.log(`Downloading image from: ${imageUrl}`);
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error('Failed to download image from Leonardo');

  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  console.log(`Image size: ${imageBuffer.length} bytes`);

  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('file', blob, `${nftName.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
  formData.append('pinataMetadata', JSON.stringify({ name: `CosmoNFT - ${nftName}` }));

  const uploadRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': apiKey,
      'pinata_secret_api_key': secretKey,
    },
    body: formData,
  });

  if (!uploadRes.ok) {
    const error = await uploadRes.text();
    throw new Error(`Pinata upload failed: ${error}`);
  }

  const uploadData = await uploadRes.json();
  return {
    hash: uploadData.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${uploadData.IpfsHash}`,
  };
}

// Upload metadata JSON to Pinata
async function uploadMetadataToPinata(
  nft: any,
  imageIpfsHash: string,
  apiKey: string,
  secretKey: string
): Promise<string> {
  const attributes: { trait_type: string; value: any; display_type?: string }[] = [
    { trait_type: 'Object Type', value: nft.objectType || 'Unknown' },
    { trait_type: 'Cosmic Score', value: nft.totalScore || nft.cosmicScore || 0, display_type: 'number' },
    { trait_type: 'Badge Tier', value: nft.badgeTier || 'STANDARD' },
  ];

  if (nft.distanceLy != null) attributes.push({ trait_type: 'Distance (Light Years)', value: nft.distanceLy, display_type: 'number' });
  if (nft.massSolar != null) attributes.push({ trait_type: 'Mass (Solar Masses)', value: nft.massSolar, display_type: 'number' });
  if (nft.temperatureK != null) attributes.push({ trait_type: 'Temperature (Kelvin)', value: nft.temperatureK, display_type: 'number' });
  if (nft.discoveryYear != null) attributes.push({ trait_type: 'Discovery Year', value: nft.discoveryYear, display_type: 'number' });
  if (nft.constellation) attributes.push({ trait_type: 'Constellation', value: nft.constellation });

  const metadata = {
    name: nft.name,
    description: nft.description || `A unique cosmic NFT: ${nft.name}`,
    image: `ipfs://${imageIpfsHash}`,
    external_url: `https://www.cosmonfts.com/nft/${nft.tokenId}`,
    attributes,
  };

  const uploadRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': apiKey,
      'pinata_secret_api_key': secretKey,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `CosmoNFT Metadata - ${nft.name}` },
    }),
  });

  if (!uploadRes.ok) {
    const error = await uploadRes.text();
    throw new Error(`Pinata metadata upload failed: ${error}`);
  }

  const uploadData = await uploadRes.json();
  return uploadData.IpfsHash;
}

async function getPhaseStats(phaseId: string) {
  const stats = await prisma.nFT.groupBy({
    by: ['imageReviewStatus'],
    where: { phaseId },
    _count: true,
  });

  const statMap: Record<string, number> = {};
  stats.forEach(s => {
    statMap[s.imageReviewStatus] = s._count;
  });

  const total = Object.values(statMap).reduce((sum, count) => sum + count, 0);

  return {
    total,
    pendingGeneration: statMap['PENDING_GENERATION'] || 0,
    generating: statMap['REGENERATING'] || 0,
    pendingReview: statMap['PENDING_REVIEW'] || 0,
    approved: statMap['APPROVED'] || 0,
    rejected: statMap['REJECTED'] || 0,
  };
}

/**
 * Admin API: Generate image for next NFT in phase
 * POST /api/admin/phases/[phase]/generate-next
 *
 * This endpoint handles the FULL generation cycle for ONE NFT:
 * 1. Find next NFT needing generation
 * 2. Generate prompt if missing
 * 3. Start Leonardo generation
 * 4. Poll for completion (with timeout protection)
 * 5. Upload to Pinata
 * 6. Update NFT record
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('=== GENERATE-NEXT CALLED ===');

  try {
    // Verify admin token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      console.log('No auth token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      console.log('Invalid admin token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log(`Admin: ${admin.email}`);

    const { phase: phaseId } = req.query;

    if (!phaseId || typeof phaseId !== 'string') {
      return res.status(400).json({ error: 'Phase ID is required' });
    }

    console.log(`Phase ID: ${phaseId}`);

    // Get phase
    const phaseData = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: {
        series: { select: { seriesNumber: true } },
      },
    });

    if (!phaseData) {
      return res.status(404).json({ error: 'Phase not found' });
    }

    console.log(`Phase: Series ${phaseData.series.seriesNumber} Phase ${phaseData.phaseNumber}`);

    // Get API keys
    const leonardoApiKey = process.env.LEONARDO_API_KEY || await getApiKey('leonardo');
    const pinataApiKey = process.env.PINATA_API_KEY || await getApiKey('pinata_api');
    const pinataSecretKey = process.env.PINATA_API_SECRET || await getApiKey('pinata_secret');

    console.log(`Leonardo API key: ${leonardoApiKey ? 'SET (' + leonardoApiKey.substring(0, 8) + '...)' : 'NOT SET'}`);
    console.log(`Pinata API key: ${pinataApiKey ? 'SET' : 'NOT SET'}`);
    console.log(`Pinata Secret: ${pinataSecretKey ? 'SET' : 'NOT SET'}`);

    if (!leonardoApiKey) {
      return res.status(503).json({
        error: 'Leonardo AI not configured',
        message: 'Please add the Leonardo API key in Settings > API Keys or as LEONARDO_API_KEY env var.',
      });
    }

    if (!pinataApiKey || !pinataSecretKey) {
      return res.status(503).json({
        error: 'Pinata IPFS not configured',
        message: 'Please add Pinata API keys in Settings > API Keys.',
      });
    }

    // First, check if there's an NFT currently being generated (REGENERATING status)
    const inProgressNft = await prisma.nFT.findFirst({
      where: {
        phaseId,
        imageReviewStatus: 'REGENERATING',
        leonardoGenerationId: { not: null },
      },
    });

    if (inProgressNft && inProgressNft.leonardoGenerationId) {
      console.log(`Found in-progress NFT #${inProgressNft.id} with generation ${inProgressNft.leonardoGenerationId}`);

      // Check status of this generation
      const status = await checkLeonardoStatus(leonardoApiKey, inProgressNft.leonardoGenerationId);
      console.log(`Leonardo status: ${status.status}`);

      if (status.status === 'COMPLETE' && status.imageUrl) {
        console.log(`Generation complete! Uploading to Pinata...`);

        // Upload to Pinata
        const { hash: ipfsHash, url: ipfsUrl } = await uploadToPinata(
          status.imageUrl,
          pinataApiKey,
          pinataSecretKey,
          inProgressNft.name
        );

        // Upload metadata
        const metadataHash = await uploadMetadataToPinata(inProgressNft, ipfsHash, pinataApiKey, pinataSecretKey);

        // Get queue position
        const maxQueueResult = await prisma.nFT.aggregate({
          where: { phaseId, imageReviewStatus: 'PENDING_REVIEW' },
          _max: { reviewQueuePosition: true },
        });
        const nextQueuePosition = (maxQueueResult._max.reviewQueuePosition || 0) + 1;

        // Update NFT
        await prisma.nFT.update({
          where: { id: inProgressNft.id },
          data: {
            image: ipfsUrl,
            imageIpfsHash: ipfsHash,
            metadataIpfsHash: metadataHash,
            imageReviewStatus: 'PENDING_REVIEW',
            reviewQueuePosition: nextQueuePosition,
            leonardoGenerationId: null,
            updatedAt: new Date(),
          },
        });

        await prisma.phase.update({
          where: { id: phaseId },
          data: { pendingReviewCount: { increment: 1 } },
        });

        console.log(`NFT #${inProgressNft.id} complete and ready for review`);

        return res.json({
          success: true,
          done: false,
          completed: {
            nftId: inProgressNft.id,
            name: inProgressNft.name,
            imageUrl: ipfsUrl,
          },
          stats: await getPhaseStats(phaseId),
        });
      } else if (status.status === 'FAILED') {
        console.log(`Generation failed: ${status.error}`);

        // Reset NFT for retry
        await prisma.nFT.update({
          where: { id: inProgressNft.id },
          data: {
            imageReviewStatus: 'PENDING_GENERATION',
            leonardoGenerationId: null,
          },
        });

        return res.json({
          success: false,
          error: `Generation failed: ${status.error}`,
          nftId: inProgressNft.id,
          stats: await getPhaseStats(phaseId),
        });
      } else {
        // Still in progress
        console.log(`Still generating... status: ${status.status}`);
        return res.json({
          success: true,
          inProgress: true,
          nftId: inProgressNft.id,
          name: inProgressNft.name,
          status: status.status,
          stats: await getPhaseStats(phaseId),
        });
      }
    }

    // Find the next NFT that needs generation
    let nft = await prisma.nFT.findFirst({
      where: {
        phaseId,
        imageReviewStatus: 'PENDING_GENERATION',
      },
      orderBy: [
        { totalScore: 'desc' },
      ],
    });

    if (!nft) {
      console.log('No more NFTs need generation');

      const pendingCount = await prisma.nFT.count({
        where: { phaseId, imageReviewStatus: 'PENDING_REVIEW' },
      });

      if (pendingCount > 0 && phaseData.status === 'GENERATING') {
        await prisma.phase.update({
          where: { id: phaseId },
          data: { status: 'PENDING_REVIEW' },
        });
      }

      return res.json({
        success: true,
        message: 'No more NFTs need generation',
        done: true,
        stats: await getPhaseStats(phaseId),
      });
    }

    console.log(`Found NFT #${nft.id}: ${nft.name}`);
    console.log(`Has prompt: ${!!nft.imagePrompt}`);

    // Generate prompt if missing
    if (!nft.imagePrompt) {
      console.log('Generating prompt...');

      const astroLookup = buildAstroLookup();
      const promptResult = generatePromptForNFT({
        name: nft.name,
        description: nft.description,
        objectType: nft.objectType,
        spectralType: nft.spectralType,
        notableFeatures: nft.notableFeatures,
      }, astroLookup);

      nft = await prisma.nFT.update({
        where: { id: nft.id },
        data: {
          imagePrompt: promptResult.prompt,
          imageNegativePrompt: promptResult.negativePrompt,
          promptGeneratedAt: new Date(),
        },
      });

      console.log(`Generated prompt: ${promptResult.prompt.substring(0, 100)}...`);
    }

    // Update phase status
    if (phaseData.status === 'PENDING') {
      await prisma.phase.update({
        where: { id: phaseId },
        data: { status: 'GENERATING' },
      });
    }

    // Load Leonardo settings
    const settings = await getLeonardoSettings();
    console.log(`Using model: ${settings.modelName} (${settings.modelId})`);
    console.log(`Dimensions: ${settings.width}x${settings.height}`);

    // Start Leonardo generation
    console.log('Starting Leonardo generation...');

    try {
      const generationId = await startLeonardoGeneration(
        leonardoApiKey,
        nft.imagePrompt!,
        settings
      );

      console.log(`Leonardo generation started: ${generationId}`);

      // Update NFT with generation ID and mark as generating
      await prisma.nFT.update({
        where: { id: nft.id },
        data: {
          imageReviewStatus: 'REGENERATING',
          leonardoGenerationId: generationId,
        },
      });

      return res.json({
        success: true,
        started: true,
        nftId: nft.id,
        name: nft.name,
        generationId,
        message: 'Generation started - call again to check status',
        stats: await getPhaseStats(phaseId),
      });
    } catch (genError: any) {
      console.error('Leonardo generation error:', genError.message);

      return res.status(500).json({
        success: false,
        error: 'Failed to start generation',
        message: genError.message,
        nftId: nft.id,
        nftName: nft.name,
        stats: await getPhaseStats(phaseId),
      });
    }
  } catch (error: any) {
    console.error('Error in generate-next:', error);
    res.status(500).json({
      error: 'Failed to process',
      details: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
  }
}
