import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getReferenceImage, getFallbackReferenceImage } from './lib/referenceImages';

const prisma = new PrismaClient();

async function uploadImageToLeonardo(apiKey: string, imageUrl: string): Promise<string | null> {
  try {
    console.log('📤 Uploading reference image to Leonardo...');

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

    console.log(`✅ Uploaded reference image to Leonardo: ${imageId}`);
    return imageId;
  } catch (error) {
    console.error('Error uploading to Leonardo:', error);
    return null;
  }
}

async function generateWithLeonardo(apiKey: string, prompt: string, styleReferenceId?: string | null): Promise<string> {
  console.log('🎨 Generating image with Leonardo AI...');

  const requestBody: Record<string, unknown> = {
    prompt,
    negative_prompt: 'text, watermarks, signatures, logos, words, letters, blurry, low quality',
    modelId: 'e316348f-7773-490e-adcd-46757c738eb7',
    width: 1024,
    height: 1024,
    num_images: 1,
    guidance_scale: 7,
    num_inference_steps: 30,
  };

  if (styleReferenceId) {
    requestBody.controlnets = [{
      initImageId: styleReferenceId,
      initImageType: 'UPLOADED',
      preprocessorId: 67,
      strengthType: 'Mid',
    }];
    console.log(`🖼️  Using style reference: ${styleReferenceId}`);
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
    throw new Error(`Leonardo API error: ${await createRes.text()}`);
  }

  const createData = await createRes.json();
  const generationId = createData.sdGenerationJob?.generationId;

  if (!generationId) {
    throw new Error('No generation ID returned');
  }

  console.log(`⏳ Generation started: ${generationId}`);

  // Poll for completion
  for (let i = 0; i < 24; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    process.stdout.write('.');

    const statusRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!statusRes.ok) continue;

    const statusData = await statusRes.json();
    const images = statusData.generations_by_pk?.generated_images;

    if (images && images.length > 0 && images[0].url) {
      console.log('\n✅ Image generated!');
      return images[0].url;
    }
  }

  throw new Error('Generation timed out');
}

async function main() {
  console.log('🚀 Testing image generation with reference images\n');

  const leonardoApiKey = process.env.LEONARDO_API_KEY;
  if (!leonardoApiKey) {
    console.error('❌ LEONARDO_API_KEY not found in environment');
    process.exit(1);
  }

  // Find 1 NFT that needs an image
  const nft = await prisma.nFT.findFirst({
    where: {
      imageIpfsHash: null,
      status: 'AVAILABLE',
    },
    orderBy: { totalScore: 'desc' },
  });

  if (!nft) {
    console.log('✅ All NFTs already have images!');
    process.exit(0);
  }

  console.log(`📦 Selected NFT: ${nft.name} (ID: ${nft.id}, Type: ${nft.objectType})`);
  console.log(`   Score: ${nft.totalScore}, Tier: ${nft.badgeTier}\n`);

  // Step 1: Get reference image
  console.log('🔍 Searching for reference image from NASA/ESA...');
  let referenceImage = await getReferenceImage(nft.name, nft.objectType || undefined);

  if (!referenceImage && nft.objectType) {
    console.log('   No specific match, trying fallback for object type...');
    referenceImage = getFallbackReferenceImage(nft.objectType);
  }

  let leonardoImageId: string | null = null;

  if (referenceImage) {
    console.log(`✅ Found reference from ${referenceImage.source}: ${referenceImage.url}\n`);
    leonardoImageId = await uploadImageToLeonardo(leonardoApiKey, referenceImage.url);
  } else {
    console.log('⚠️  No reference image found, generating without style reference\n');
  }

  // Step 2: Generate image
  const prompt = `Stunning artistic interpretation of ${nft.name} as a cosmic masterpiece. ${nft.description || ''} Visual Style: Bold digital art, vibrant colors, cosmic art with ethereal glow.`;

  console.log(`\n📝 Prompt: ${prompt.substring(0, 100)}...\n`);

  const generatedUrl = await generateWithLeonardo(leonardoApiKey, prompt, leonardoImageId);

  console.log(`\n🖼️  Generated image URL: ${generatedUrl}`);

  // Step 3: Update database (just the reference info for now, not uploading to IPFS)
  await prisma.nFT.update({
    where: { id: nft.id },
    data: {
      referenceImageUrl: referenceImage?.url || null,
      referenceImageSource: referenceImage?.source || null,
      leonardoRefImageId: leonardoImageId || null,
    },
  });

  console.log('\n✅ Test complete! Reference info saved to database.');
  console.log('   (Image not uploaded to IPFS - this was just a test)\n');

  await prisma.$disconnect();
}

main().catch(console.error);
