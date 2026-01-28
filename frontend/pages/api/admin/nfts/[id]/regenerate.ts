import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';
import crypto from 'crypto';

/**
 * Admin API: Regenerate image for a rejected NFT
 * POST /api/admin/nfts/[id]/regenerate
 *
 * Triggers Leonardo AI to generate a new image for a rejected NFT.
 * On completion, the NFT returns to PENDING_REVIEW status at the end of the queue.
 */

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

// Leonardo settings type
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

// Generate with Leonardo AI
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
  }

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
  const generationId = isV2Model
    ? createData.generate?.generationId
    : createData.sdGenerationJob?.generationId;

  if (!generationId) {
    throw new Error('No generation ID returned from Leonardo API');
  }

  console.log(`Leonardo regeneration started: ${generationId}`);

  // Poll for completion (max 3 minutes)
  for (let i = 0; i < 36; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!statusRes.ok) {
      continue;
    }

    const statusData = await statusRes.json();
    const generation = statusData.generations_by_pk;

    if (generation?.status === 'FAILED') {
      throw new Error(`Generation failed: ${generation.failureReason || 'Unknown reason'}`);
    }

    const images = generation?.generated_images;
    if (images && images.length > 0 && images[0].url) {
      return images[0].url;
    }
  }

  throw new Error('Leonardo generation timed out after 3 minutes');
}

// Unpin from Pinata
async function unpinFromPinata(ipfsHash: string, apiKey: string, secretKey: string): Promise<boolean> {
  try {
    const unpinRes = await fetch(`https://api.pinata.cloud/pinning/unpin/${ipfsHash}`, {
      method: 'DELETE',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey,
      },
    });

    if (!unpinRes.ok) {
      console.warn(`Failed to unpin ${ipfsHash}`);
      return false;
    }

    return true;
  } catch (err: any) {
    console.warn(`Error unpinning ${ipfsHash}:`, err.message);
    return false;
  }
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

// Upload metadata to Pinata
async function uploadMetadataToPinata(
  nft: any,
  imageIpfsHash: string,
  apiKey: string,
  secretKey: string
): Promise<string> {
  const attributes: { trait_type: string; value: any; display_type?: string }[] = [
    { trait_type: 'Object Type', value: nft.objectType || 'Unknown' },
    { trait_type: 'Cosmic Score', value: nft.totalScore || 0, display_type: 'number' },
    { trait_type: 'Badge Tier', value: nft.badgeTier || 'STANDARD' },
  ];

  if (nft.distanceLy != null) {
    attributes.push({ trait_type: 'Distance (Light Years)', value: nft.distanceLy, display_type: 'number' });
  }
  if (nft.constellation) {
    attributes.push({ trait_type: 'Constellation', value: nft.constellation });
  }

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

    const { id } = req.query;
    const nftId = parseInt(id as string);

    if (isNaN(nftId)) {
      return res.status(400).json({ error: 'Invalid NFT ID' });
    }

    // Get NFT
    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Only allow regeneration for REJECTED NFTs or PENDING_GENERATION (initial generation)
    if (!['REJECTED', 'PENDING_GENERATION'].includes(nft.imageReviewStatus)) {
      return res.status(400).json({
        error: 'NFT cannot be regenerated',
        currentStatus: nft.imageReviewStatus,
        message: 'Only rejected or pending generation NFTs can be regenerated',
      });
    }

    // Check for prompts
    if (!nft.imagePrompt) {
      return res.status(400).json({
        error: 'No prompt found',
        message: 'This NFT does not have a pre-generated prompt.',
      });
    }

    // Get API keys
    const leonardoApiKey = process.env.LEONARDO_API_KEY || await getApiKey('leonardo');
    const pinataApiKey = process.env.PINATA_API_KEY || await getApiKey('pinata_api');
    const pinataSecretKey = process.env.PINATA_API_SECRET || await getApiKey('pinata_secret');

    if (!leonardoApiKey) {
      return res.status(503).json({ error: 'Leonardo AI not configured' });
    }

    if (!pinataApiKey || !pinataSecretKey) {
      return res.status(503).json({ error: 'Pinata IPFS not configured' });
    }

    // Mark as regenerating
    await prisma.nFT.update({
      where: { id: nftId },
      data: { imageReviewStatus: 'REGENERATING' },
    });

    // Remove old images from Pinata
    if (nft.imageIpfsHash) {
      await unpinFromPinata(nft.imageIpfsHash, pinataApiKey, pinataSecretKey);
    }
    if (nft.metadataIpfsHash) {
      await unpinFromPinata(nft.metadataIpfsHash, pinataApiKey, pinataSecretKey);
    }

    // Get settings and generate
    const settings = await getLeonardoSettings();

    console.log(`Regenerating image for NFT #${nft.id} - ${nft.name}`);

    try {
      const leonardoImageUrl = await generateWithLeonardo(
        leonardoApiKey,
        nft.imagePrompt,
        nft.imageNegativePrompt || '',
        settings
      );

      // Upload to Pinata
      const { hash: ipfsHash, url: ipfsUrl } = await uploadToPinata(
        leonardoImageUrl,
        pinataApiKey,
        pinataSecretKey,
        nft.name
      );

      // Upload metadata
      const metadataHash = await uploadMetadataToPinata(nft, ipfsHash, pinataApiKey, pinataSecretKey);

      // Get max queue position to add to end of queue
      const maxPosition = await prisma.nFT.aggregate({
        where: { phaseId: nft.phaseId },
        _max: { reviewQueuePosition: true },
      });
      const newQueuePosition = (maxPosition._max.reviewQueuePosition || 0) + 1;

      // Update NFT with new image and return to pending review
      await prisma.nFT.update({
        where: { id: nftId },
        data: {
          image: ipfsUrl,
          imageIpfsHash: ipfsHash,
          metadataIpfsHash: metadataHash,
          imageReviewStatus: 'PENDING_REVIEW',
          reviewQueuePosition: newQueuePosition,
          rejectionReason: null, // Clear old rejection reason
          updatedAt: new Date(),
        },
      });

      // Update phase counts
      if (nft.phaseId) {
        await prisma.phase.update({
          where: { id: nft.phaseId },
          data: {
            pendingReviewCount: { increment: 1 },
            rejectedCount: { decrement: 1 },
          },
        });
      }

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'NFT_REGENERATE',
            details: JSON.stringify({
              nftId,
              nftName: nft.name,
              phaseId: nft.phaseId,
              newQueuePosition,
            }),
          },
        });
      } catch {
        // Audit log might not exist
      }

      res.json({
        success: true,
        message: 'Image regenerated and returned to review queue',
        nftId,
        nftName: nft.name,
        imageUrl: ipfsUrl,
        ipfsHash,
        metadataHash,
        queuePosition: newQueuePosition,
      });
    } catch (genError: any) {
      // If generation fails, keep as REJECTED with error logged
      await prisma.nFT.update({
        where: { id: nftId },
        data: {
          imageReviewStatus: 'REJECTED',
          rejectionReason: `Regeneration failed: ${genError.message}`,
        },
      });

      throw genError;
    }
  } catch (error: any) {
    console.error('Error regenerating NFT:', error);
    res.status(500).json({
      error: 'Failed to regenerate NFT',
      details: error?.message,
    });
  }
}
