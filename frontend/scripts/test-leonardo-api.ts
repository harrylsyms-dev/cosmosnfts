/**
 * Simple test to verify Leonardo API key works
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function decryptApiKey(encryptedData: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey || !encryptedData.includes(':')) return encryptedData;
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
  console.log('=== Leonardo API Connection Test ===\n');

  // Get API key
  let leonardoApiKey = process.env.LEONARDO_API_KEY;
  if (!leonardoApiKey) {
    const stored = await prisma.apiKey.findUnique({
      where: { service: 'leonardo' },
      select: { encryptedKey: true }
    });
    if (stored?.encryptedKey) {
      leonardoApiKey = decryptApiKey(stored.encryptedKey);
    }
  }

  if (!leonardoApiKey) {
    console.log('ERROR: No Leonardo API key found!');
    return;
  }
  console.log('API key: ' + leonardoApiKey.substring(0, 8) + '...\n');

  // Test 1: Get user info
  console.log('Test 1: Get user info...');
  try {
    const userRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/me', {
      headers: { 'Authorization': `Bearer ${leonardoApiKey}` },
    });
    console.log(`Status: ${userRes.status}`);
    const userData = await userRes.json();
    console.log('Response:', JSON.stringify(userData, null, 2));
  } catch (e: any) {
    console.log('Error:', e.message);
  }

  // Test 2: Simple generation with Leonardo Kino XL (known working model)
  console.log('\n\nTest 2: Simple generation with Kino XL model...');
  const kinoXL = 'aa77f04e-3eec-4034-9c07-d0f619684628'; // Leonardo Kino XL

  try {
    const genRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${leonardoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelId: kinoXL,
        prompt: 'A simple test image of a glowing star in space',
        num_images: 1,
        width: 512,
        height: 512,
      }),
    });
    console.log(`Status: ${genRes.status}`);
    const genData = await genRes.text();
    console.log('Response:', genData);
  } catch (e: any) {
    console.log('Error:', e.message);
  }

  // Test 3: Try Leonardo Phoenix (we know this works)
  console.log('\n\nTest 3: Simple generation with Phoenix model...');
  const phoenix = 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3';

  try {
    const genRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${leonardoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelId: phoenix,
        prompt: 'A simple test image of a glowing star in space',
        num_images: 1,
        width: 512,
        height: 512,
        contrast: 3.5,
      }),
    });
    console.log(`Status: ${genRes.status}`);
    const genData = await genRes.text();
    console.log('Response:', genData);
  } catch (e: any) {
    console.log('Error:', e.message);
  }
}

main()
  .catch((e) => console.error('Script failed:', e))
  .finally(async () => await prisma.$disconnect());
