/**
 * Test script to generate image for Sirius and debug any issues
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

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

async function main() {
  console.log('=== Testing Sirius Image Generation ===\n');

  // Step 1: Check if Sirius exists in database
  console.log('Step 1: Checking database for Sirius...');
  const sirius = await prisma.nFT.findFirst({
    where: { name: 'Sirius' },
    select: {
      id: true,
      name: true,
      objectType: true,
      imagePrompt: true,
      imageNegativePrompt: true,
      image: true,
      imageIpfsHash: true,
    },
  });

  if (!sirius) {
    console.log('ERROR: Sirius NFT not found in database!');
    console.log('\nTotal NFTs in database:', await prisma.nFT.count());
    return;
  }

  console.log(`Found Sirius (ID: ${sirius.id})`);
  console.log(`Object Type: ${sirius.objectType}`);
  console.log(`Has image prompt: ${!!sirius.imagePrompt}`);
  console.log(`Has negative prompt: ${!!sirius.imageNegativePrompt}`);
  console.log(`Current image: ${sirius.image || 'None'}`);

  if (!sirius.imagePrompt) {
    console.log('\nERROR: Sirius has no image prompt stored!');
    console.log('Run the regenerate-all-prompts script first, or generate NFT with prompts.');
    return;
  }

  console.log('\n--- Stored Prompt ---');
  console.log(sirius.imagePrompt);
  console.log('\n--- Negative Prompt ---');
  console.log(sirius.imageNegativePrompt || '(none)');

  // Step 2: Use new Leonardo API key
  console.log('\n\nStep 2: Using Leonardo API key...');
  const leonardoApiKey = 'a5bb99bf-7c5f-40fe-a5fa-6b0888f1e502';
  console.log('Leonardo API key: ' + leonardoApiKey.substring(0, 8) + '...');

  // Step 3: Test Leonardo V1 API with FLUX model
  console.log('\n\nStep 3: Testing Leonardo V1 API with FLUX model...');

  // FLUX model ID from Leonardo docs
  const FLUX_MODEL_ID = 'b2614463-296c-462a-9586-aafdb8f00e36';

  const requestBody = {
    modelId: FLUX_MODEL_ID,
    prompt: sirius.imagePrompt,
    negative_prompt: sirius.imageNegativePrompt || '',
    num_images: 1,
    width: 1440,
    height: 1440,
    contrast: 3.5,
    enhancePrompt: false,
  };

  console.log('\nRequest body:', JSON.stringify(requestBody, null, 2));

  try {
    const createRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${leonardoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`\nResponse status: ${createRes.status} ${createRes.statusText}`);

    const responseText = await createRes.text();
    console.log('Response body:', responseText);

    if (!createRes.ok) {
      console.log('\nERROR: Leonardo API returned error!');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Parsed error:', JSON.stringify(errorData, null, 2));
      } catch {}
      return;
    }

    const createData = JSON.parse(responseText);
    console.log('\nGeneration started successfully!');
    console.log('Generation ID:', createData.sdGenerationJob?.generationId);

  } catch (error: any) {
    console.log('\nERROR: Request failed:', error.message);
  }
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
