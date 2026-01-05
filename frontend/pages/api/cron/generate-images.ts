import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import * as crypto from 'crypto';

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

// Leonardo AI generation with configurable settings
// Supports both V1 API (legacy models) and V2 API (FLUX.2 Pro)
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
  // V2 returns: { generate: { generationId: "..." } }
  // V1 returns: { sdGenerationJob: { generationId: "..." } }
  const generationId = isV2Model
    ? createData.generate?.generationId
    : createData.sdGenerationJob?.generationId;

  if (!generationId) {
    throw new Error('No generation ID returned from Leonardo API');
  }

  // Poll for completion (max 3 minutes)
  for (let i = 0; i < 36; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!statusRes.ok) continue;

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

  throw new Error('Leonardo generation timed out');
}

// Upload to Pinata
async function uploadToPinata(imageUrl: string, apiKey: string, secretKey: string, nftName: string): Promise<{ hash: string; url: string }> {
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
  if (nft.ageYears != null) attributes.push({ trait_type: 'Age (Years)', value: nft.ageYears, display_type: 'number' });
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

// Process a single NFT with Leonardo AI (uses stored settings)
async function processNFT(
  nft: any,
  leonardoApiKey: string,
  pinataApiKey: string,
  pinataSecretKey: string,
  settings: LeonardoSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use stored prompts from database (generated by imagePromptTemplates)
    const prompt = nft.imagePrompt;
    const negativePrompt = nft.imageNegativePrompt || '';

    if (!prompt) {
      return { success: false, error: 'No image prompt stored for this NFT' };
    }

    // Generate image with Leonardo AI (uses stored settings)
    const leonardoImageUrl = await generateWithLeonardo(leonardoApiKey, prompt, negativePrompt, settings);

    // Upload to IPFS
    const { hash: ipfsHash, url: ipfsUrl } = await uploadToPinata(leonardoImageUrl, pinataApiKey, pinataSecretKey, nft.name);
    const metadataHash = await uploadMetadataToPinata(nft, ipfsHash, pinataApiKey, pinataSecretKey);

    // Update NFT in database
    await prisma.nFT.update({
      where: { id: nft.id },
      data: {
        image: ipfsUrl,
        imageIpfsHash: ipfsHash,
        metadataIpfsHash: metadataHash,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // Get API keys
    const leonardoApiKey = process.env.LEONARDO_API_KEY || await getApiKey('leonardo');
    const pinataApiKey = process.env.PINATA_API_KEY || await getApiKey('pinata_api');
    const pinataSecretKey = process.env.PINATA_API_SECRET || await getApiKey('pinata_secret');

    if (!leonardoApiKey || !pinataApiKey || !pinataSecretKey) {
      return res.status(503).json({
        error: 'API keys not configured',
        missing: {
          leonardo: !leonardoApiKey,
          pinata_api: !pinataApiKey,
          pinata_secret: !pinataSecretKey,
        },
      });
    }

    // Load Leonardo settings from database
    const settings = await getLeonardoSettings();

    // Find NFTs that need images (limit to batch size for cron timeout)
    const BATCH_SIZE = 5; // Process 5 at a time to stay within Vercel timeout
    const nftsNeedingImages = await prisma.nFT.findMany({
      where: {
        imageIpfsHash: null,
        status: 'AVAILABLE',
      },
      orderBy: [
        { currentTier: 'asc' },
        { totalScore: 'desc' },
      ],
      take: BATCH_SIZE,
    });

    if (nftsNeedingImages.length === 0) {
      return res.json({
        message: 'All NFTs have images generated',
        processed: 0,
      });
    }

    console.log(`Processing ${nftsNeedingImages.length} NFTs for image generation with ${settings.modelName}`);

    let succeeded = 0;
    let failed = 0;
    const errors: { nft: string; error: string }[] = [];

    for (const nft of nftsNeedingImages) {
      console.log(`Generating image for: ${nft.name} (ID: ${nft.id})`);
      const result = await processNFT(nft, leonardoApiKey, pinataApiKey, pinataSecretKey, settings);

      if (result.success) {
        succeeded++;
        console.log(`Success: ${nft.name}`);
      } else {
        failed++;
        errors.push({ nft: nft.name, error: result.error || 'Unknown error' });
        console.error(`Failed: ${nft.name} - ${result.error}`);
      }
    }

    // Count remaining
    const remaining = await prisma.nFT.count({
      where: {
        imageIpfsHash: null,
        status: 'AVAILABLE',
      },
    });

    res.json({
      message: `Image generation batch complete (${settings.modelName})`,
      processed: nftsNeedingImages.length,
      succeeded,
      failed,
      remaining,
      model: settings.modelName,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Image generation cron failed:', error);
    res.status(500).json({ error: 'Image generation failed', message: error.message });
  }
}
