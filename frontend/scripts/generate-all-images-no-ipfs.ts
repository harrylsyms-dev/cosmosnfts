// Generate images for all NFTs - saves Leonardo URLs directly (no IPFS upload)
// Run with: npx tsx scripts/generate-all-images-no-ipfs.ts

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

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

// Download image to local file
async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location!, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }
    }).on('error', reject);
  });
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

async function main() {
  console.log('===========================================');
  console.log('GENERATING IMAGES FOR ALL NFTs');
  console.log('(Saving Leonardo URLs + downloading locally)');
  console.log('===========================================\n');

  // Get API keys
  const leonardoApiKey = process.env.LEONARDO_API_KEY || await getApiKey('leonardo');

  if (!leonardoApiKey) {
    console.error('Missing Leonardo API key!');
    return;
  }

  console.log('Leonardo API Key: OK\n');

  // Find NFTs that need images (excluding ones already generated)
  const nfts = await prisma.nFT.findMany({
    where: {
      OR: [
        { image: null },
        { image: '' },
      ],
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

  // Create output directory
  const outputDir = path.join(process.cwd(), 'generated-images');
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

      // Download image locally
      const safeFileName = nft.name.replace(/[^a-zA-Z0-9]/g, '_');
      const localImagePath = path.join(outputDir, `${safeFileName}.png`);
      console.log('    Downloading image...');
      await downloadImage(leonardoImageUrl, localImagePath);

      // Update NFT in database with Leonardo URL
      await prisma.nFT.update({
        where: { id: nft.id },
        data: {
          image: leonardoImageUrl,
          updatedAt: new Date(),
        },
      });

      console.log(`  ✅ Success! Saved to: ${localImagePath}`);
      results.push({
        id: nft.id,
        name: nft.name,
        objectType: nft.objectType,
        status: 'SUCCESS',
        imageUrl: leonardoImageUrl,
        localPath: localImagePath,
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
      path.join(outputDir, 'generation-results.json'),
      JSON.stringify({ succeeded, failed, total: nfts.length, results }, null, 2)
    );
  }

  console.log('\n===========================================');
  console.log('GENERATION COMPLETE');
  console.log('===========================================');
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${nfts.length}`);
  console.log(`\nImages saved to: ${outputDir}`);
  console.log(`Results JSON: ${outputDir}/generation-results.json`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
