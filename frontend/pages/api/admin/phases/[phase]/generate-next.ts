import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';
import crypto from 'crypto';

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
  } catch {
    // Ignore
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

// Leonardo AI generation
async function generateWithLeonardo(
  apiKey: string,
  prompt: string,
  negativePrompt: string,
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
    console.log(`Using FLUX.2 Pro V2 API`);
  } else {
    apiUrl = 'https://cloud.leonardo.ai/api/rest/v1/generations';
    requestBody = {
      modelId: settings.modelId,
      prompt: prompt,
      negative_prompt: negativePrompt,
      num_images: settings.numImages,
      width: settings.width,
      height: settings.height,
      contrast: settings.contrast,
      enhancePrompt: settings.enhancePrompt,
      public: settings.isPublic,
    };
    console.log(`Using V1 API with model: ${settings.modelName}`);
  }

  console.log(`Leonardo API request to ${apiUrl}:`, JSON.stringify(requestBody, null, 2));

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
    throw new Error(`Leonardo API error: ${error}`);
  }

  const createData = await createRes.json();
  console.log(`Leonardo generation response:`, JSON.stringify(createData, null, 2));

  const generationId = isV2Model
    ? createData.generate?.generationId
    : createData.sdGenerationJob?.generationId;

  if (!generationId) {
    throw new Error('No generation ID returned from Leonardo API');
  }

  console.log(`Leonardo generation started: ${generationId}`);

  // Poll for completion (max 3 minutes)
  for (let i = 0; i < 36; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!statusRes.ok) {
      console.log(`Status check ${i + 1}/36 failed, retrying...`);
      continue;
    }

    const statusData = await statusRes.json();
    const generation = statusData.generations_by_pk;

    if (generation?.status === 'FAILED') {
      throw new Error(`Generation failed: ${generation.failureReason || 'Unknown reason'}`);
    }

    const images = generation?.generated_images;
    if (images && images.length > 0 && images[0].url) {
      console.log(`Leonardo generation complete after ${(i + 1) * 5} seconds`);
      return images[0].url;
    }

    console.log(`Status check ${i + 1}/36: ${generation?.status || 'pending'}`);
  }

  throw new Error('Leonardo generation timed out after 3 minutes');
}

// Upload to Pinata
async function uploadToPinata(
  imageUrl: string,
  apiKey: string,
  secretKey: string,
  nftName: string
): Promise<{ hash: string; url: string }> {
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error('Failed to download image');

  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

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

/**
 * Admin API: Generate image for next NFT in phase
 * POST /api/admin/phases/[phaseId]/generate-next
 *
 * This endpoint generates an image for ONE NFT that needs generation.
 * The frontend should call this repeatedly to process all NFTs.
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

  try {
    // Verify admin token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { phase: phaseId } = req.query;

    if (!phaseId || typeof phaseId !== 'string') {
      return res.status(400).json({ error: 'Phase ID is required' });
    }

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

    // Get API keys
    const leonardoApiKey = process.env.LEONARDO_API_KEY || await getApiKey('leonardo');
    const pinataApiKey = process.env.PINATA_API_KEY || await getApiKey('pinata_api');
    const pinataSecretKey = process.env.PINATA_API_SECRET || await getApiKey('pinata_secret');

    if (!leonardoApiKey) {
      return res.status(503).json({
        error: 'Leonardo AI not configured',
        message: 'Please add the Leonardo API key in Settings > API Keys.',
      });
    }

    if (!pinataApiKey || !pinataSecretKey) {
      return res.status(503).json({
        error: 'Pinata IPFS not configured',
        message: 'Please add Pinata API keys in Settings > API Keys.',
      });
    }

    // Find the next NFT that needs image generation in this phase
    const nft = await prisma.nFT.findFirst({
      where: {
        phaseId,
        imageReviewStatus: 'PENDING_GENERATION',
        imagePrompt: { not: null },
      },
      orderBy: [
        { totalScore: 'desc' }, // Process highest scoring first
      ],
    });

    if (!nft) {
      // No more NFTs need generation - update phase status if needed
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

    // Mark as generating (in progress)
    await prisma.nFT.update({
      where: { id: nft.id },
      data: { imageReviewStatus: 'REGENERATING' },
    });

    // Update phase status to GENERATING if not already
    if (phaseData.status === 'PENDING') {
      await prisma.phase.update({
        where: { id: phaseId },
        data: { status: 'GENERATING' },
      });
    }

    // Load Leonardo settings
    const settings = await getLeonardoSettings();

    console.log(`=== GENERATING IMAGE FOR NFT #${nft.id} ===`);
    console.log(`Name: ${nft.name}`);
    console.log(`Phase: ${phaseData.series.seriesNumber}-${phaseData.phaseNumber}`);
    console.log(`Model: ${settings.modelName}`);

    try {
      // Generate image with Leonardo AI
      const leonardoImageUrl = await generateWithLeonardo(
        leonardoApiKey,
        nft.imagePrompt!,
        nft.imageNegativePrompt || '',
        settings
      );

      console.log(`Leonardo complete: ${leonardoImageUrl}`);

      // Upload to Pinata
      const { hash: ipfsHash, url: ipfsUrl } = await uploadToPinata(
        leonardoImageUrl,
        pinataApiKey,
        pinataSecretKey,
        nft.name
      );

      // Upload metadata
      const metadataHash = await uploadMetadataToPinata(nft, ipfsHash, pinataApiKey, pinataSecretKey);

      // Get current max queue position for this phase
      const maxQueueResult = await prisma.nFT.aggregate({
        where: { phaseId, imageReviewStatus: 'PENDING_REVIEW' },
        _max: { reviewQueuePosition: true },
      });
      const nextQueuePosition = (maxQueueResult._max.reviewQueuePosition || 0) + 1;

      // Update NFT with image and mark for review
      await prisma.nFT.update({
        where: { id: nft.id },
        data: {
          image: ipfsUrl,
          imageIpfsHash: ipfsHash,
          metadataIpfsHash: metadataHash,
          imageReviewStatus: 'PENDING_REVIEW',
          reviewQueuePosition: nextQueuePosition,
          updatedAt: new Date(),
        },
      });

      // Update phase pending review count
      await prisma.phase.update({
        where: { id: phaseId },
        data: {
          pendingReviewCount: { increment: 1 },
        },
      });

      console.log(`NFT #${nft.id} ready for review`);

      res.json({
        success: true,
        done: false,
        generated: {
          nftId: nft.id,
          name: nft.name,
          imageUrl: ipfsUrl,
          ipfsHash,
        },
        stats: await getPhaseStats(phaseId),
      });
    } catch (genError: any) {
      console.error(`Generation failed for NFT #${nft.id}:`, genError.message);

      // Mark NFT back to pending generation so it can be retried
      await prisma.nFT.update({
        where: { id: nft.id },
        data: { imageReviewStatus: 'PENDING_GENERATION' },
      });

      res.status(500).json({
        success: false,
        error: 'Image generation failed',
        message: genError.message,
        nftId: nft.id,
        nftName: nft.name,
        stats: await getPhaseStats(phaseId),
      });
    }
  } catch (error: any) {
    console.error('Error in generate-next:', error);
    res.status(500).json({ error: 'Failed to process', details: error?.message });
  }
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
