import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import * as crypto from 'crypto';
import { getReferenceImage, getFallbackReferenceImage, type ReferenceImage } from '../../../lib/referenceImages';

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
    'Black Hole': 'The ultimate abyss, where light itself cannot escape the crushing grip of gravity',
    'Pulsar': 'A rapidly spinning neutron star, beaming lighthouse signals across the cosmos',
    'Quasar': 'The blazing heart of a distant galaxy, outshining trillions of suns',
    'Star Cluster': 'A dazzling congregation of stars, born together in cosmic brotherhood',
    'Asteroid': 'A primordial rock, a remnant from the dawn of our solar system',
    'Comet': 'A wanderer of ice and dust, trailing a magnificent tail across the sky',
  };

  const typeFeatures: Record<string, string> = {
    'Star': '- Brilliant corona and solar flares\n- Stellar surface with plasma dynamics',
    'Galaxy': '- Spiral arms or elliptical structure\n- Central bright core with dark matter halo',
    'Nebula': '- Colorful gas clouds with embedded stars\n- Pillars of creation aesthetic',
    'Black Hole': '- Event horizon with accretion disk\n- Gravitational lensing effects',
    'Pulsar': '- Magnetic field lines and radiation beams\n- Rapidly rotating compact star',
    'Quasar': '- Supermassive black hole with jets\n- Incredibly luminous active core',
    'Star Cluster': '- Hundreds of stars in close proximity\n- Varied star colors and sizes',
    'Asteroid': '- Cratered rocky surface\n- Irregular shape with dramatic lighting',
    'Comet': '- Icy nucleus with glowing coma\n- Long dust and ion tails',
  };

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
- Dreamlike, fantastical yet scientifically inspired
${isElite ? '- Ultra premium, museum-worthy composition with breathtaking detail' : ''}
${isPremium ? '- Premium quality with exceptional luminosity' : ''}

Composition: Eye-catching, dramatic, energetic, centered cosmic object
Quality: Professional digital art, vibrant, gallery-quality illustration
Medium: Digital painting, concept art, stylized 3D render
Color: Vibrant, saturated, cosmic palette with glow effects and deep space blacks
Lighting: Magical cosmic glow, ethereal light effects, volumetric rays`;
}


/**
 * Upload an image to Leonardo AI for use as a style reference
 */
async function uploadImageToLeonardo(apiKey: string, imageUrl: string): Promise<string | null> {
  try {
    const initRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/init-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ extension: 'jpg' }),
    });

    if (!initRes.ok) {
      console.error('Failed to get Leonardo presigned URL:', await initRes.text());
      return null;
    }

    const initData = await initRes.json();
    const { url: presignedUrl, fields, id: imageId } = initData.uploadInitImage || {};

    if (!presignedUrl || !imageId) {
      console.error('Invalid Leonardo init-image response');
      return null;
    }

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      console.error('Failed to download reference image:', imageUrl);
      return null;
    }
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    const formData = new FormData();
    if (fields) {
      const fieldsObj = typeof fields === 'string' ? JSON.parse(fields) : fields;
      for (const [key, value] of Object.entries(fieldsObj)) {
        formData.append(key, value as string);
      }
    }

    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'reference.jpg');

    const uploadRes = await fetch(presignedUrl, { method: 'POST', body: formData });

    if (!uploadRes.ok && uploadRes.status !== 204) {
      console.error('Failed to upload to Leonardo S3:', uploadRes.status);
      return null;
    }

    console.log(`Uploaded reference image to Leonardo: ${imageId}`);
    return imageId;
  } catch (error) {
    console.error('Error uploading to Leonardo:', error);
    return null;
  }
}

/**
 * Fetch and prepare reference image for an NFT
 */
async function prepareReferenceImage(
  nft: any,
  leonardoApiKey: string
): Promise<{ referenceImage: ReferenceImage | null; leonardoImageId: string | null }> {
  if (nft.leonardoRefImageId) {
    return {
      referenceImage: { url: nft.referenceImageUrl || '', source: nft.referenceImageSource || 'NASA' },
      leonardoImageId: nft.leonardoRefImageId,
    };
  }

  console.log(`Fetching reference image for: ${nft.name}`);
  let referenceImage = await getReferenceImage(nft.name, nft.objectType);

  if (!referenceImage && nft.objectType) {
    referenceImage = getFallbackReferenceImage(nft.objectType);
    if (referenceImage) console.log(`Using fallback ${nft.objectType} reference image`);
  }

  if (!referenceImage) {
    console.log(`No reference image found for: ${nft.name}`);
    return { referenceImage: null, leonardoImageId: null };
  }

  console.log(`Found reference image from ${referenceImage.source}: ${referenceImage.url}`);
  const leonardoImageId = await uploadImageToLeonardo(leonardoApiKey, referenceImage.url);
  return { referenceImage, leonardoImageId };
}

// Leonardo AI generation with optional style reference
async function generateWithLeonardo(apiKey: string, prompt: string, styleReferenceId?: string | null): Promise<string> {
  const requestBody: Record<string, unknown> = {
    prompt,
    negative_prompt: 'text, watermarks, signatures, logos, words, letters, blurry, low quality, landscape, terrain, ground, horizon, mountains, sky, environment, planet surface, land',
    modelId: 'e316348f-7773-490e-adcd-46757c738eb7',
    width: 1024,
    height: 1024,
    num_images: 1,
    guidance_scale: 7,
    num_inference_steps: 30,
  };

  // Add style reference if available (NASA/ESA/Hubble image as style guide)
  if (styleReferenceId) {
    requestBody.controlnets = [{
      initImageId: styleReferenceId,
      initImageType: 'UPLOADED',
      preprocessorId: 67,
      strengthType: 'Mid',
    }];
    console.log(`Using style reference: ${styleReferenceId}`);
  }

  const createRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
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
  const generationId = createData.sdGenerationJob?.generationId;

  if (!generationId) {
    throw new Error('No generation ID returned');
  }

  // Poll for completion (max 2 minutes)
  for (let i = 0; i < 24; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));

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
  secretKey: string,
  referenceSource?: string
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
  if (referenceSource) attributes.push({ trait_type: 'Reference Source', value: referenceSource });

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

// Process a single NFT with reference image support
async function processNFT(
  nft: any,
  leonardoApiKey: string,
  pinataApiKey: string,
  pinataSecretKey: string
): Promise<{ success: boolean; error?: string; usedReference?: boolean }> {
  try {
    // Step 1: Get reference image from NASA/ESA
    const { referenceImage, leonardoImageId } = await prepareReferenceImage(nft, leonardoApiKey);

    // Step 2: Build prompt and generate image with style reference
    const prompt = buildPrompt(nft);
    const leonardoImageUrl = await generateWithLeonardo(leonardoApiKey, prompt, leonardoImageId);

    // Step 3: Upload to IPFS
    const { hash: ipfsHash, url: ipfsUrl } = await uploadToPinata(leonardoImageUrl, pinataApiKey, pinataSecretKey, nft.name);
    const metadataHash = await uploadMetadataToPinata(nft, ipfsHash, pinataApiKey, pinataSecretKey, referenceImage?.source);

    // Step 4: Update NFT in database with reference info
    await prisma.nFT.update({
      where: { id: nft.id },
      data: {
        image: ipfsUrl,
        imageIpfsHash: ipfsHash,
        metadataIpfsHash: metadataHash,
        referenceImageUrl: referenceImage?.url || null,
        referenceImageSource: referenceImage?.source || null,
        leonardoRefImageId: leonardoImageId || null,
        updatedAt: new Date(),
      },
    });

    return { success: true, usedReference: !!leonardoImageId };
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

    console.log(`Processing ${nftsNeedingImages.length} NFTs for image generation`);

    let succeeded = 0;
    let failed = 0;
    let usedReferences = 0;
    const errors: { nft: string; error: string }[] = [];

    for (const nft of nftsNeedingImages) {
      console.log(`Generating image for: ${nft.name} (ID: ${nft.id})`);
      const result = await processNFT(nft, leonardoApiKey, pinataApiKey, pinataSecretKey);

      if (result.success) {
        succeeded++;
        if (result.usedReference) usedReferences++;
        console.log(`Success: ${nft.name}${result.usedReference ? ' (with reference)' : ''}`);
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
      message: 'Image generation batch complete',
      processed: nftsNeedingImages.length,
      succeeded,
      failed,
      usedReferences,
      remaining,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Image generation cron failed:', error);
    res.status(500).json({ error: 'Image generation failed', message: error.message });
  }
}
