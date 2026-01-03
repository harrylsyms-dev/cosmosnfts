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

// Build prompt for Leonardo AI
function buildPrompt(nft: any): string {
  const poeticDescriptions: Record<string, string> = {
    'Star': 'A brilliant celestial beacon, burning with ancient light across the cosmic void',
    'Galaxy': 'A vast island universe, swirling with billions of stars in an eternal cosmic dance',
    'Nebula': 'A cosmic nursery of gas and dust, painting the heavens with ethereal colors',
    'Exoplanet': 'An alien world orbiting a distant sun, holding mysteries of the unknown',
    'Black Hole': 'The ultimate abyss, where light itself cannot escape the crushing grip of gravity',
    'Pulsar': 'A rapidly spinning neutron star, beaming lighthouse signals across the cosmos',
    'Quasar': 'The blazing heart of a distant galaxy, outshining trillions of suns',
    'Star Cluster': 'A dazzling congregation of stars, born together in cosmic brotherhood',
    'Asteroid': 'A primordial rock, a remnant from the dawn of our solar system',
    'Comet': 'A wanderer of ice and dust, trailing a magnificent tail across the sky',
    'Moon': 'A celestial companion, scarred with ancient craters and bathed in reflected starlight',
    'Planet': 'A majestic world with swirling atmospheres and hidden mysteries',
    'Dwarf Planet': 'A distant icy world at the edge of the solar system',
    'Supernova': 'The spectacular death of a star, scattering elements across the cosmos',
    'White Dwarf': 'The glowing ember of a dead star, slowly cooling for eternity',
    'Neutron Star': 'An impossibly dense stellar corpse, spinning with immense energy',
    'Brown Dwarf': 'A failed star, too small to ignite but still glowing with heat',
    'Globular Cluster': 'An ancient sphere of stars, orbiting the galaxy for billions of years',
  };

  const typeFeatures: Record<string, string> = {
    'Star': '- Brilliant corona and solar flares\n- Stellar surface with plasma dynamics',
    'Galaxy': '- Spiral arms or elliptical structure\n- Central bright core with dark matter halo',
    'Nebula': '- Colorful gas clouds with embedded stars\n- Pillars of creation aesthetic',
    'Exoplanet': '- Alien landscapes and atmospheres\n- Multiple moons or ring systems possible',
    'Black Hole': '- Event horizon with accretion disk\n- Gravitational lensing effects',
    'Pulsar': '- Magnetic field lines and radiation beams\n- Rapidly rotating compact star',
    'Quasar': '- Supermassive black hole with jets\n- Incredibly luminous active core',
    'Star Cluster': '- Hundreds of stars in close proximity\n- Varied star colors and sizes',
    'Asteroid': '- Cratered rocky surface\n- Irregular shape with dramatic lighting',
    'Comet': '- Icy nucleus with glowing coma\n- Long dust and ion tails',
    'Moon': '- Cratered surface with maria and highlands\n- Dramatic shadows and earth-shine',
    'Planet': '- Atmospheric bands and cloud formations\n- Possible ring systems and moons',
    'Dwarf Planet': '- Icy surface with complex geology\n- Distant and mysterious appearance',
    'Supernova': '- Explosive shockwave and debris field\n- Brilliant multicolored remnant',
    'White Dwarf': '- Compact glowing core\n- Fading stellar remnant',
    'Neutron Star': '- Intense magnetic field lines\n- Rapid rotation and energy beams',
    'Brown Dwarf': '- Dim reddish glow\n- Atmospheric bands like a giant planet',
    'Globular Cluster': '- Dense central core of stars\n- Spherical ancient stellar population',
  };

  // Use NFT's own description if available, otherwise fall back to type-based
  const description = nft.description || poeticDescriptions[nft.objectType] || `A magnificent ${nft.objectType || 'cosmic object'} in the depths of space`;
  const features = typeFeatures[nft.objectType] || '';
  const totalScore = nft.totalScore || nft.cosmicScore || 300;
  const isPremium = totalScore >= 400;
  const isElite = totalScore >= 450;

  return `Stunning artistic interpretation of ${nft.name} as a cosmic masterpiece.

${description}

Visual Style: Bold digital art, vibrant colors, stylized but detailed, cosmic art with ethereal glow
${features}
- Nebulae in vivid purples, blues, golds, oranges, and reds
- Stars twinkling with magical light effects
- Isolated cosmic object against deep black void
- Pure black space background
- No landscape or environmental elements
- Dreamlike, fantastical yet scientifically inspired
${isElite ? '- Ultra premium, museum-worthy composition with breathtaking detail' : ''}
${isPremium ? '- Premium quality with exceptional luminosity' : ''}

Composition: Eye-catching, dramatic, energetic, centered cosmic object
Quality: Professional digital art, vibrant, gallery-quality illustration
Medium: Digital painting, concept art, stylized 3D render
Color: Vibrant, saturated, cosmic palette with glow effects and deep space blacks
Lighting: Magical cosmic glow, ethereal light effects, volumetric rays`;
}

// Leonardo AI generation
async function generateWithLeonardo(apiKey: string, prompt: string): Promise<string> {
  // Create generation
  const createRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: 'text, watermarks, signatures, logos, words, letters, blurry, low quality, landscape, terrain, ground, horizon, mountains, sky, environment, planet surface, land',
      modelId: 'e316348f-7773-490e-adcd-46757c738eb7', // Leonardo Diffusion XL
      width: 1024,
      height: 1024,
      num_images: 1,
      guidance_scale: 7,
      num_inference_steps: 30,
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

    // Build prompt
    const prompt = buildPrompt(nft);

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
    console.log(`--- PROMPT END ---`);

    // Generate image with Leonardo AI
    console.log(`Generating image for NFT #${nft.id}: ${nft.name}`);
    const leonardoImageUrl = await generateWithLeonardo(leonardoApiKey, prompt);

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
