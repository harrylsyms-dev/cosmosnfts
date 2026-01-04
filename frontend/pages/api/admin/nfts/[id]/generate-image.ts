import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';
import crypto from 'crypto';
import {
  buildImagePrompt,
  getNegativePrompt,
  PromptBuildOptions,
} from '../../../../../lib/imagePromptTemplates';

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

// Default object type configurations (fallback if not configured)
const defaultObjectTypeConfigs: Record<string, { description: string; visualFeatures: string }> = {
  'Star': { description: 'A stellar body producing light and heat', visualFeatures: 'Radiant corona, solar flares, glowing plasma surface' },
  'Galaxy': { description: 'A massive collection of stars, gas, and dust', visualFeatures: 'Spiral arms, central bulge, billions of stars' },
  'Nebula': { description: 'An interstellar cloud of gas and dust', visualFeatures: 'Colorful gas clouds, dust pillars, stellar nurseries' },
  'Black Hole': { description: 'A region where gravity is so intense nothing escapes', visualFeatures: 'Accretion disk, event horizon, gravitational lensing' },
  'Planet': { description: 'A celestial body orbiting a star', visualFeatures: 'Atmospheric bands, surface features, possible rings' },
  'Moon': { description: 'A natural satellite orbiting a planet', visualFeatures: 'Crater impacts, surface texture, reflected light' },
  'Exoplanet': { description: 'A planet orbiting a star outside our solar system', visualFeatures: 'Alien atmospheres, exotic surface, parent star glow' },
  'Pulsar': { description: 'A rotating neutron star emitting radiation', visualFeatures: 'Rotating beams of light, magnetic field lines' },
  'Quasar': { description: 'An extremely luminous active galactic nucleus', visualFeatures: 'Brilliant central point, powerful jets, host galaxy' },
  'Supernova': { description: 'A powerful stellar explosion', visualFeatures: 'Expanding shock wave, debris cloud, colorful remnants' },
  'Supernova Remnant': { description: 'Structure left after a supernova explosion', visualFeatures: 'Expanding shell, filamentary structure, hot gas' },
  'Asteroid': { description: 'A rocky body orbiting the Sun', visualFeatures: 'Irregular shape, cratered surface, rocky texture' },
  'Comet': { description: 'An icy body releasing gas near the Sun', visualFeatures: 'Bright coma, dust tail, ion tail, nucleus' },
  'Star Cluster': { description: 'A group of stars gravitationally bound', visualFeatures: 'Dense stellar concentration, varied star colors' },
  'Dwarf Planet': { description: 'A planetary-mass object not dominant in orbit', visualFeatures: 'Small spherical body, unique surface features' },
  'Magnetar': { description: 'A neutron star with powerful magnetic field', visualFeatures: 'Intense magnetic field lines, X-ray emissions' },
};

interface ImagePromptConfig {
  basePromptTemplate: string | null;
  artStyle: string;
  colorPalette: string;
  lightingStyle: string;
  compositionStyle: string;
  qualityDescriptors: string;
  mediumDescriptors: string;
  realismLevel: number;
  usePhotorealistic: boolean;
  useScientificAccuracy: boolean;
  avoidArtisticStylization: boolean;
  negativePrompt: string;
  objectTypeConfigs: string;
  premiumThreshold: number;
  eliteThreshold: number;
  legendaryThreshold: number;
  premiumModifier: string;
  eliteModifier: string;
  legendaryModifier: string;
  includeScoreInPrompt: boolean;
  useDescriptionTransform: boolean;
  useNftDescription: boolean;
  leonardoModelId: string;
  imageWidth: number;
  imageHeight: number;
  promptMagic: boolean;
  guidanceScale: number;
  useAstronomicalTemplates?: boolean; // Use new astronomical template system
}

// Build prompt using the new astronomical template system (tested for Leonardo AI)
function buildAstronomicalPrompt(nft: any): { prompt: string; negativePrompt: string } {
  const options: PromptBuildOptions = {
    name: nft.name,
    objectType: nft.objectType || 'Star',
    description: nft.description,
    spectralType: nft.spectralType,
    mass: nft.massSolar,
    notableFeatures: nft.notableFeatures ?
      (typeof nft.notableFeatures === 'string' ? JSON.parse(nft.notableFeatures) : nft.notableFeatures) :
      undefined,
    // These fields can be stored on the NFT for override
    galaxyType: nft.galaxyType,
    nebulaType: nft.nebulaType,
    planetType: nft.planetType,
    subType: nft.subType,
    structureDetails: nft.structureDetails,
    surfaceFeatures: nft.surfaceFeatures,
    colorDescription: nft.colorDescription,
    customVisualCharacteristics: nft.visualCharacteristics,
  };

  const result = buildImagePrompt(options);

  // Remove the "--no " prefix for Leonardo API (it uses negative_prompt parameter)
  const negativePrompt = result.negativePrompt.replace('--no ', '');

  return {
    prompt: result.prompt,
    negativePrompt,
  };
}

// Build prompt using the Advanced Prompt Editor configuration (legacy)
function buildPromptFromConfig(nft: any, config: ImagePromptConfig): { prompt: string; negativePrompt: string } {
  // Parse object type configs
  let objectTypeConfigs: Record<string, { description: string; visualFeatures: string; customPrompt?: string; negativePrompt?: string }> = defaultObjectTypeConfigs;
  try {
    const parsed = JSON.parse(config.objectTypeConfigs);
    if (Object.keys(parsed).length > 0) {
      objectTypeConfigs = { ...defaultObjectTypeConfigs, ...parsed };
    }
  } catch {
    // Use defaults
  }

  // Get object type specific config
  const typeConfig = objectTypeConfigs[nft.objectType] || { description: '', visualFeatures: '' };

  // Combine global and object-specific negative prompts
  const objectNegative = (typeConfig as any).negativePrompt || '';
  const combinedNegativePrompt = objectNegative
    ? `${config.negativePrompt}, ${objectNegative}`
    : config.negativePrompt;

  // Check for custom prompt override for this type
  if (typeConfig.customPrompt && typeConfig.customPrompt.trim()) {
    const prompt = typeConfig.customPrompt
      .replace(/\{name\}/g, nft.name || 'Unknown')
      .replace(/\{description\}/g, nft.description || typeConfig.description)
      .replace(/\{objectType\}/g, nft.objectType || 'Cosmic Object')
      .replace(/\{features\}/g, typeConfig.visualFeatures || '')
      .replace(/\{score\}/g, String(nft.totalScore || 0))
      .replace(/\{badge\}/g, nft.badgeTier || 'STANDARD');
    return { prompt, negativePrompt: combinedNegativePrompt };
  }

  // Use NFT description only if enabled, otherwise use type description
  const useNftDesc = config.useNftDescription ?? true;
  const description = useNftDesc
    ? (nft.description || typeConfig.description || `A ${nft.objectType || 'cosmic object'}`)
    : (typeConfig.description || `A ${nft.objectType || 'cosmic object'}`);
  const features = typeConfig.visualFeatures || '';
  const totalScore = nft.totalScore || 0;

  // Determine score modifier
  let scoreModifier = '';
  if (totalScore >= config.legendaryThreshold) {
    scoreModifier = config.legendaryModifier;
  } else if (totalScore >= config.eliteThreshold) {
    scoreModifier = config.eliteModifier;
  } else if (totalScore >= config.premiumThreshold) {
    scoreModifier = config.premiumModifier;
  }

  // Build realism prefix if enabled
  let realismPrefix = '';
  if (config.usePhotorealistic) {
    realismPrefix = 'Photorealistic, ';
  }
  if (config.useScientificAccuracy) {
    realismPrefix += 'scientifically accurate, ';
  }

  // If base template is configured, use it
  if (config.basePromptTemplate && config.basePromptTemplate.trim()) {
    const prompt = config.basePromptTemplate
      .replace(/\{name\}/g, nft.name || 'Unknown')
      .replace(/\{description\}/g, description)
      .replace(/\{objectType\}/g, nft.objectType || 'Cosmic Object')
      .replace(/\{features\}/g, features)
      .replace(/\{score\}/g, String(totalScore))
      .replace(/\{badge\}/g, nft.badgeTier || 'STANDARD')
      .replace(/\{artStyle\}/g, config.artStyle)
      .replace(/\{colorPalette\}/g, config.colorPalette)
      .replace(/\{lightingStyle\}/g, config.lightingStyle)
      .replace(/\{compositionStyle\}/g, config.compositionStyle)
      .replace(/\{qualityDescriptors\}/g, config.qualityDescriptors)
      .replace(/\{mediumDescriptors\}/g, config.mediumDescriptors)
      .replace(/\{scoreModifier\}/g, scoreModifier)
      .replace(/\{negativePrompt\}/g, combinedNegativePrompt);
    return { prompt, negativePrompt: combinedNegativePrompt };
  }

  // Default template using configured styles
  const prompt = `${realismPrefix}${config.artStyle} of ${nft.name}, a ${nft.objectType || 'cosmic object'}.

${description}

Visual characteristics: ${features}

Style: ${config.artStyle}
Colors: ${config.colorPalette}
Lighting: ${config.lightingStyle}
Composition: ${config.compositionStyle}
Quality: ${config.qualityDescriptors}
Medium: ${config.mediumDescriptors}

${scoreModifier ? `Quality tier: ${scoreModifier}` : ''}
${config.includeScoreInPrompt ? `Cosmic Score: ${totalScore}/500` : ''}`.trim();

  return { prompt, negativePrompt: combinedNegativePrompt };
}

// Leonardo AI generation
async function generateWithLeonardo(
  apiKey: string,
  prompt: string,
  negativePrompt: string,
  config: ImagePromptConfig
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
      modelId: config.leonardoModelId || 'e316348f-7773-490e-adcd-46757c738eb7',
      width: config.imageWidth || 1024,
      height: config.imageHeight || 1024,
      num_images: 1,
      guidance_scale: config.guidanceScale || 7,
      num_inference_steps: 30,
      promptMagic: config.promptMagic ?? false,
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

  // Add scientific measurement data (objective metrics)
  if (nft.distanceLy != null) {
    attributes.push({ trait_type: 'Distance (Light Years)', value: nft.distanceLy, display_type: 'number' });
  }
  if (nft.massSolar != null) {
    attributes.push({ trait_type: 'Mass (Solar Masses)', value: nft.massSolar, display_type: 'number' });
  }
  if (nft.ageYears != null) {
    attributes.push({ trait_type: 'Age (Years)', value: nft.ageYears, display_type: 'number' });
  }
  if (nft.luminosity != null) {
    attributes.push({ trait_type: 'Luminosity (Absolute Magnitude)', value: nft.luminosity, display_type: 'number' });
  }
  if (nft.sizeKm != null) {
    attributes.push({ trait_type: 'Size (km)', value: nft.sizeKm, display_type: 'number' });
  }
  if (nft.temperatureK != null) {
    attributes.push({ trait_type: 'Temperature (Kelvin)', value: nft.temperatureK, display_type: 'number' });
  }
  if (nft.discoveryYear != null) {
    attributes.push({ trait_type: 'Discovery Year', value: nft.discoveryYear, display_type: 'number' });
  }
  if (nft.paperCount != null) {
    attributes.push({ trait_type: 'Scientific Papers', value: nft.paperCount, display_type: 'number' });
  }

  // Add location/classification data
  if (nft.constellation) {
    attributes.push({ trait_type: 'Constellation', value: nft.constellation });
  }
  if (nft.distance) {
    attributes.push({ trait_type: 'Distance (Display)', value: nft.distance });
  }

  // Add calculated score breakdowns (from objective scoring system)
  if (nft.distanceScore != null) attributes.push({ trait_type: 'Distance Score', value: Math.round(nft.distanceScore * 100) / 100, display_type: 'number' });
  if (nft.massScore != null) attributes.push({ trait_type: 'Mass Score', value: Math.round(nft.massScore * 100) / 100, display_type: 'number' });
  if (nft.ageScore != null) attributes.push({ trait_type: 'Age Score', value: Math.round(nft.ageScore * 100) / 100, display_type: 'number' });
  if (nft.luminosityScore != null) attributes.push({ trait_type: 'Luminosity Score', value: Math.round(nft.luminosityScore * 100) / 100, display_type: 'number' });
  if (nft.sizeScore != null) attributes.push({ trait_type: 'Size Score', value: Math.round(nft.sizeScore * 100) / 100, display_type: 'number' });
  if (nft.temperatureScore != null) attributes.push({ trait_type: 'Temperature Score', value: Math.round(nft.temperatureScore * 100) / 100, display_type: 'number' });
  if (nft.discoveryScore != null) attributes.push({ trait_type: 'Discovery Score', value: Math.round(nft.discoveryScore * 100) / 100, display_type: 'number' });
  if (nft.papersScore != null) attributes.push({ trait_type: 'Papers Score', value: Math.round(nft.papersScore * 100) / 100, display_type: 'number' });

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

    // Get NFT details
    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
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

    // Get the Advanced Prompt Editor configuration
    let promptConfig = await prisma.imagePromptConfig.findUnique({
      where: { id: 'main' }
    });

    // Create default config if not exists
    if (!promptConfig) {
      promptConfig = await prisma.imagePromptConfig.create({
        data: {
          id: 'main',
          objectTypeConfigs: JSON.stringify(defaultObjectTypeConfigs),
        }
      });
    }

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

    // Use pre-generated prompts if available (generated at NFT creation time)
    // Otherwise fall back to generating on-demand
    let prompt: string;
    let negativePrompt: string;
    let promptSource: 'stored' | 'generated';

    if (nft.imagePrompt && nft.imageNegativePrompt) {
      // Use pre-stored prompts from NFT creation
      prompt = nft.imagePrompt;
      negativePrompt = nft.imageNegativePrompt;
      promptSource = 'stored';
    } else {
      // Generate prompt on-demand (for legacy NFTs without stored prompts)
      const useAstronomicalTemplates = (promptConfig as ImagePromptConfig).useAstronomicalTemplates !== false;
      const result = useAstronomicalTemplates
        ? buildAstronomicalPrompt(nft)
        : buildPromptFromConfig(nft, promptConfig as ImagePromptConfig);
      prompt = result.prompt;
      negativePrompt = result.negativePrompt;
      promptSource = 'generated';

      // Store the generated prompts for future use
      await prisma.nFT.update({
        where: { id: nftId },
        data: {
          imagePrompt: prompt,
          imageNegativePrompt: negativePrompt,
          promptGeneratedAt: new Date(),
        },
      });
    }

    // Log the prompt for debugging
    console.log(`=== LEONARDO AI IMAGE GENERATION ===`);
    console.log(`Prompt Source: ${promptSource === 'stored' ? 'Pre-stored (from NFT creation)' : 'Generated on-demand'}`);
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
    const leonardoImageUrl = await generateWithLeonardo(leonardoApiKey, prompt, negativePrompt, promptConfig as ImagePromptConfig);

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
      promptSource: promptSource === 'stored' ? 'pre-stored' : 'generated-on-demand',
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
