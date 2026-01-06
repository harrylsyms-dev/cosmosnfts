// Script to generate 2 test images for each object type
// Run with: npx tsx scripts/generate-test-images.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching NFTs by object type...\n');

  // Get all unique object types
  const objectTypes = await prisma.nFT.groupBy({
    by: ['objectType'],
    _count: { id: true },
    where: {
      status: 'AVAILABLE',
    },
    orderBy: { objectType: 'asc' },
  });

  console.log('Object Types Found:');
  console.log('==================');
  for (const type of objectTypes) {
    console.log(`  ${type.objectType || 'Unknown'}: ${type._count.id} NFTs`);
  }
  console.log('');

  // For each object type, get 2 NFTs that need images (no imageIpfsHash)
  const testCandidates: { objectType: string; nfts: any[] }[] = [];

  for (const type of objectTypes) {
    if (!type.objectType) continue;

    const nfts = await prisma.nFT.findMany({
      where: {
        objectType: type.objectType,
        status: 'AVAILABLE',
        imageIpfsHash: null,
      },
      take: 2,
      orderBy: { totalScore: 'desc' },
      select: {
        id: true,
        name: true,
        objectType: true,
        spectralType: true,
        imagePrompt: true,
        imageNegativePrompt: true,
        totalScore: true,
      },
    });

    if (nfts.length > 0) {
      testCandidates.push({ objectType: type.objectType, nfts });
    }
  }

  console.log('\nTest Image Candidates (2 per object type):');
  console.log('==========================================');

  let totalToGenerate = 0;
  for (const candidate of testCandidates) {
    console.log(`\n${candidate.objectType} (${candidate.nfts.length} selected):`);
    for (const nft of candidate.nfts) {
      totalToGenerate++;
      console.log(`  - ID ${nft.id}: ${nft.name}`);
      if (nft.spectralType) {
        console.log(`    Spectral Type: ${nft.spectralType}`);
      }
      console.log(`    Score: ${nft.totalScore}`);
      if (nft.imagePrompt) {
        // Show first 100 chars of prompt
        console.log(`    Prompt: ${nft.imagePrompt.substring(0, 100)}...`);
      } else {
        console.log(`    ⚠️  NO PROMPT - needs regeneration`);
      }
    }
  }

  console.log(`\n==========================================`);
  console.log(`Total NFTs to generate: ${totalToGenerate}`);
  console.log(`Estimated time: ${totalToGenerate * 3} minutes (3 min each)`);
  console.log(`\nTo generate these images, use the admin panel at /admin/images`);
  console.log(`or call the generate-image API for each NFT ID listed above.`);

  // Output JSON list of IDs for easy copy
  const allIds = testCandidates.flatMap(c => c.nfts.map(n => n.id));
  console.log(`\nNFT IDs: ${JSON.stringify(allIds)}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
