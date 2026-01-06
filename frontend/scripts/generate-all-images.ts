// Generate images for all NFTs that need them
// Run with: npx tsx scripts/generate-all-images.ts

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

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

// Generate with Leonardo AI FLUX.2 Pro
async function generateWithLeonardo(apiKey: string, prompt: string): Promise<string> {
  console.log('    Calling Leonardo API...');

  const apiUrl = 'https://cloud.leonardo.ai/api/rest/v2/generations';
  const requestBody = {
    model: 'flux-pro-2.0',
    public: false,
    parameters: {
      prompt: prompt,
      quantity: 1,
      width: 1440,
      height: 1440,
    },
  };

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
  const generationId = createData.generate?.generationId;

  if (!generationId) {
    throw new Error('No generation ID returned from Leonardo API');
  }

  console.log(`    Generation ID: ${generationId}`);
  console.log('    Polling for completion...');

  // Poll for completion (max 3 minutes)
  for (let i = 0; i < 36; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    process.stdout.write('.');

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
      console.log(' Done!');
      return images[0].url;
    }
  }

  throw new Error('Leonardo generation timed out');
}

// Upload to Pinata
async function uploadToPinata(imageUrl: string, apiKey: string, secretKey: string, nftName: string): Promise<{ hash: string; url: string }> {
  console.log('    Uploading to IPFS...');

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
    { trait_type: 'Cosmic Score', value: nft.totalScore || 0, display_type: 'number' },
    { trait_type: 'Badge Tier', value: nft.badgeTier || 'STANDARD' },
  ];

  if (nft.distanceLy != null) attributes.push({ trait_type: 'Distance (Light Years)', value: nft.distanceLy, display_type: 'number' });
  if (nft.massSolar != null) attributes.push({ trait_type: 'Mass (Solar Masses)', value: nft.massSolar, display_type: 'number' });

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

async function main() {
  console.log('===========================================');
  console.log('GENERATING IMAGES FOR ALL NFTs');
  console.log('===========================================\n');

  // Get API keys
  const leonardoApiKey = process.env.LEONARDO_API_KEY || await getApiKey('leonardo');
  const pinataApiKey = process.env.PINATA_API_KEY || await getApiKey('pinata_api');
  const pinataSecretKey = process.env.PINATA_API_SECRET || await getApiKey('pinata_secret');

  if (!leonardoApiKey || !pinataApiKey || !pinataSecretKey) {
    console.error('Missing API keys!');
    console.log('Leonardo:', leonardoApiKey ? 'OK' : 'MISSING');
    console.log('Pinata API:', pinataApiKey ? 'OK' : 'MISSING');
    console.log('Pinata Secret:', pinataSecretKey ? 'OK' : 'MISSING');
    return;
  }

  console.log('API Keys: OK\n');

  // Find NFTs that need images
  const nfts = await prisma.nFT.findMany({
    where: {
      imageIpfsHash: null,
      status: 'AVAILABLE',
    },
    orderBy: [
      { objectType: 'asc' },
      { name: 'asc' },
    ],
  });

  console.log(`Found ${nfts.length} NFTs needing images\n`);

  if (nfts.length === 0) {
    console.log('All NFTs already have images!');
    return;
  }

  // Create output directory for tracking
  const outputDir = path.join(process.cwd(), 'image-generation-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results: any[] = [];
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    console.log(`\n[${i + 1}/${nfts.length}] ${nft.name} (${nft.objectType})`);

    if (!nft.imagePrompt) {
      console.log('  ⚠️ No prompt - skipping');
      results.push({ name: nft.name, objectType: nft.objectType, status: 'NO_PROMPT' });
      failed++;
      continue;
    }

    try {
      // Generate image with Leonardo
      const leonardoImageUrl = await generateWithLeonardo(leonardoApiKey, nft.imagePrompt);

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

      console.log(`  ✅ Success! IPFS: ${ipfsHash}`);
      results.push({
        id: nft.id,
        name: nft.name,
        objectType: nft.objectType,
        status: 'SUCCESS',
        ipfsHash,
        ipfsUrl,
        prompt: nft.imagePrompt,
        negativePrompt: nft.imageNegativePrompt,
      });
      succeeded++;

    } catch (error: any) {
      console.log(`  ❌ Failed: ${error.message}`);
      results.push({
        id: nft.id,
        name: nft.name,
        objectType: nft.objectType,
        status: 'FAILED',
        error: error.message,
        prompt: nft.imagePrompt,
      });
      failed++;
    }

    // Save progress after each NFT
    fs.writeFileSync(
      path.join(outputDir, 'generation-progress.json'),
      JSON.stringify({ succeeded, failed, total: nfts.length, results }, null, 2)
    );
  }

  console.log('\n===========================================');
  console.log('GENERATION COMPLETE');
  console.log('===========================================');
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${nfts.length}`);
  console.log(`\nResults saved to: ${outputDir}/generation-progress.json`);

  // Save final results
  fs.writeFileSync(
    path.join(outputDir, 'final-results.json'),
    JSON.stringify({ succeeded, failed, total: nfts.length, results }, null, 2)
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
