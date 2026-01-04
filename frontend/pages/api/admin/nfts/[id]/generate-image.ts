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

// Leonardo AI generation
async function generateWithLeonardo(
  apiKey: string,
  prompt: string,
  negativePrompt: string,
  modelId: string,
  width: number,
  height: number,
  guidanceScale: number
): Promise<string> {
  // Create generation
  const createRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: negativePrompt,
      modelId: modelId || 'b24e16ff-06e3-43eb-8d33-4416c2d75876',
      width: width || 1024,
      height: height || 1024,
      num_images: 1,
      guidance_scale: guidanceScale || 7,
      num_inference_steps: 30,
      promptMagic: false,
    }),
  });

  if (!createRes.ok) {
    const error = await createRes.text();
    throw new Error(`Leonardo API error: ${error}`);
  }

  const createData = await createRes.json();
  const generationId = createData.sdGenerationJob?.generationId;

  if (!generationId) {
    throw new Error('No generation ID returned');
  }

  // Poll for completion (max 2 minutes)
  for (let i = 0; i < 24; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    const statusRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!statusRes.ok) continue;

    const statusData = await statusRes.json();
    const images = statusData.generations_by_pk?.generated_images;

    if (images && images.length > 0 && images[0].url) {
      return images[0].url;
    }
  }

  throw new Error('Generation timed out');
}

// Unpin (remove) from Pinata
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
      const error = await unpinRes.text();
      console.warn(`Failed to unpin ${ipfsHash}: ${error}`);
      return false;
    }

    console.log(`Successfully unpinned ${ipfsHash} from Pinata`);
    return true;
  } catch (err: any) {
    console.warn(`Error unpinning ${ipfsHash}:`, err.message);
    return false;
  }
}

// Upload to Pinata
async function uploadToPinata(imageUrl: string, apiKey: string, secretKey: string, nftName: string): Promise<{ hash: string; url: string }> {
  // Download image
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error('Failed to download image');

  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

  // Create form data
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('file', blob, `${nftName.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
  formData.append('pinataMetadata', JSON.stringify({ name: `CosmoNFT - ${nftName}` }));

  // Upload to Pinata
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
  // Build attributes array with scientific data
  const attributes: { trait_type: string; value: any; display_type?: string }[] = [
    { trait_type: 'Object Type', value: nft.objectType || 'Unknown' },
    { trait_type: 'Cosmic Score', value: nft.totalScore || nft.cosmicScore || 0, display_type: 'number' },
    { trait_type: 'Badge Tier', value: nft.badgeTier || 'STANDARD' },
  ];

  // Add scientific measurement data
  if (nft.distanceLy != null) {
    attributes.push({ trait_type: 'Distance (Light Years)', value: nft.distanceLy, display_type: 'number' });
  }
  if (nft.massSolar != null) {
    attributes.push({ trait_type: 'Mass (Solar Masses)', value: nft.massSolar, display_type: 'number' });
  }
  if (nft.temperatureK != null) {
    attributes.push({ trait_type: 'Temperature (Kelvin)', value: nft.temperatureK, display_type: 'number' });
  }
  if (nft.discoveryYear != null) {
    attributes.push({ trait_type: 'Discovery Year', value: nft.discoveryYear, display_type: 'number' });
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

    // Get NFT details including stored prompts
    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Check for stored prompts (generated at NFT creation time)
    if (!nft.imagePrompt || !nft.imageNegativePrompt) {
      return res.status(400).json({
        error: 'No prompt found',
        message: 'This NFT does not have a pre-generated prompt. Please regenerate the NFT to create prompts.',
      });
    }

    // Get API keys
    const leonardoApiKey = process.env.LEONARDO_API_KEY || await getApiKey('leonardo');
    const pinataApiKey = process.env.PINATA_API_KEY || await getApiKey('pinata_api');
    const pinataSecretKey = process.env.PINATA_API_SECRET || await getApiKey('pinata_secret');

    if (!leonardoApiKey) {
      return res.status(503).json({
        error: 'Leonardo AI not configured',
        message: 'Please add the Leonardo API key in Settings > API Keys.'
      });
    }

    if (!pinataApiKey || !pinataSecretKey) {
      return res.status(503).json({
        error: 'Pinata IPFS not configured',
        message: 'Please add Pinata API keys in Settings > API Keys.'
      });
    }

    // Get image generation settings
    const imageConfig = await prisma.imagePromptConfig.findUnique({
      where: { id: 'main' },
      select: {
        leonardoModelId: true,
        imageWidth: true,
        imageHeight: true,
        guidanceScale: true,
      },
    });

    // Remove old images from Pinata if they exist
    const removedHashes: string[] = [];
    if (nft.imageIpfsHash) {
      console.log(`Removing old image from Pinata: ${nft.imageIpfsHash}`);
      const imageRemoved = await unpinFromPinata(nft.imageIpfsHash, pinataApiKey, pinataSecretKey);
      if (imageRemoved) removedHashes.push(nft.imageIpfsHash);
    }
    if (nft.metadataIpfsHash) {
      console.log(`Removing old metadata from Pinata: ${nft.metadataIpfsHash}`);
      const metadataRemoved = await unpinFromPinata(nft.metadataIpfsHash, pinataApiKey, pinataSecretKey);
      if (metadataRemoved) removedHashes.push(nft.metadataIpfsHash);
    }

    // Use the pre-stored prompts
    const prompt = nft.imagePrompt;
    const negativePrompt = nft.imageNegativePrompt;

    // Log the prompt for debugging
    console.log(`=== LEONARDO AI IMAGE GENERATION ===`);
    console.log(`NFT: #${nft.id} - ${nft.name}`);
    console.log(`Object Type: ${nft.objectType}`);
    console.log(`Total Score: ${nft.totalScore}`);
    if (removedHashes.length > 0) {
      console.log(`Removed old IPFS hashes: ${removedHashes.join(', ')}`);
    }
    console.log(`--- PROMPT START ---`);
    console.log(prompt);
    console.log(`--- NEGATIVE PROMPT ---`);
    console.log(negativePrompt);
    console.log(`--- PROMPT END ---`);

    // Generate image with Leonardo AI
    console.log(`Generating image for NFT #${nft.id}: ${nft.name}`);
    const leonardoImageUrl = await generateWithLeonardo(
      leonardoApiKey,
      prompt,
      negativePrompt,
      imageConfig?.leonardoModelId || 'b24e16ff-06e3-43eb-8d33-4416c2d75876',
      imageConfig?.imageWidth || 1024,
      imageConfig?.imageHeight || 1024,
      imageConfig?.guidanceScale || 7
    );

    // Upload image to Pinata
    console.log(`Uploading image to Pinata...`);
    const { hash: ipfsHash, url: ipfsUrl } = await uploadToPinata(leonardoImageUrl, pinataApiKey, pinataSecretKey, nft.name);

    // Upload metadata to Pinata
    console.log(`Uploading metadata to Pinata...`);
    const metadataHash = await uploadMetadataToPinata(nft, ipfsHash, pinataApiKey, pinataSecretKey);

    // Update NFT record with both image and metadata
    await prisma.nFT.update({
      where: { id: nftId },
      data: {
        image: ipfsUrl,
        imageIpfsHash: ipfsHash,
        metadataIpfsHash: metadataHash,
        updatedAt: new Date(),
      },
    });

    console.log(`Image generated for NFT #${nft.id}: ${ipfsUrl}`);
    console.log(`Metadata uploaded for NFT #${nft.id}: ipfs://${metadataHash}`);

    res.json({
      success: true,
      message: removedHashes.length > 0
        ? `Image regenerated! Removed ${removedHashes.length} old file(s) from IPFS.`
        : 'Image and metadata generated successfully!',
      nftId: nft.id,
      nftName: nft.name,
      objectType: nft.objectType,
      imageUrl: ipfsUrl,
      ipfsHash,
      metadataHash,
      metadataUrl: `https://gateway.pinata.cloud/ipfs/${metadataHash}`,
      promptUsed: prompt,
      negativePromptUsed: negativePrompt,
      removedHashes: removedHashes.length > 0 ? removedHashes : undefined,
    });
  } catch (error: any) {
    console.error('Failed to generate image:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      message: error?.message || 'Unknown error'
    });
  }
}
