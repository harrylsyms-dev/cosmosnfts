// Check image status for all object types
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking image status by object type...\n');

  const objectTypes = ['Star', 'Nebula', 'Black Hole', 'Galaxy', 'Exoplanet', 'Comet', 'Pulsar', 'Quasar', 'Star Cluster'];

  for (const objectType of objectTypes) {
    const withImages = await prisma.nFT.count({
      where: { objectType, imageIpfsHash: { not: null } },
    });
    const withoutImages = await prisma.nFT.count({
      where: { objectType, imageIpfsHash: null },
    });
    const total = withImages + withoutImages;

    console.log(`${objectType}: ${total} total (${withImages} with images, ${withoutImages} need images)`);

    // List the ones that need images
    if (withoutImages > 0 && withoutImages <= 5) {
      const nfts = await prisma.nFT.findMany({
        where: { objectType, imageIpfsHash: null },
        select: { id: true, name: true },
      });
      for (const nft of nfts) {
        console.log(`  - ID ${nft.id}: ${nft.name}`);
      }
    }
  }

  // Also check what star types we have
  console.log('\n--- Star Details ---');
  const stars = await prisma.nFT.findMany({
    where: { objectType: 'Star' },
    select: { id: true, name: true, spectralType: true, imageIpfsHash: true },
  });
  for (const star of stars) {
    const hasImage = star.imageIpfsHash ? '✓' : '✗';
    console.log(`${hasImage} ID ${star.id}: ${star.name} (${star.spectralType || 'no spectral type'})`);
  }

  console.log('\n--- Nebula Details ---');
  const nebulas = await prisma.nFT.findMany({
    where: { objectType: 'Nebula' },
    select: { id: true, name: true, imageIpfsHash: true },
  });
  for (const neb of nebulas) {
    const hasImage = neb.imageIpfsHash ? '✓' : '✗';
    console.log(`${hasImage} ID ${neb.id}: ${neb.name}`);
  }

  console.log('\n--- Black Hole Details ---');
  const blackHoles = await prisma.nFT.findMany({
    where: { objectType: 'Black Hole' },
    select: { id: true, name: true, imageIpfsHash: true },
  });
  for (const bh of blackHoles) {
    const hasImage = bh.imageIpfsHash ? '✓' : '✗';
    console.log(`${hasImage} ID ${bh.id}: ${bh.name}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
