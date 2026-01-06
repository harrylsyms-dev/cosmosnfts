import { PrismaClient } from '@prisma/client';
import { buildImagePrompt, validatePrompt } from '../lib/imagePromptTemplates';

const prisma = new PrismaClient();

async function main() {
  // Check if Veil Nebula already exists
  const existing = await prisma.nFT.findFirst({
    where: { name: 'Veil Nebula' }
  });

  if (existing) {
    console.log('Veil Nebula already exists, skipping');
    return;
  }

  // Get max token ID
  const maxToken = await prisma.nFT.aggregate({
    _max: { tokenId: true },
  });
  const nextTokenId = (maxToken._max.tokenId || 0) + 1;

  // Generate prompt
  const promptResult = buildImagePrompt({
    name: 'Veil Nebula',
    objectType: 'Supernova Remnant',
    description: 'A large supernova remnant in Cygnus, the result of a star that exploded 10,000-20,000 years ago. Known for its delicate filamentary structure.',
    notableFeatures: ['Delicate filamentary structure', 'Part of larger Cygnus Loop', 'Shock-heated gas glowing in multiple colors'],
  });

  const nft = await prisma.nFT.create({
    data: {
      tokenId: nextTokenId,
      name: 'Veil Nebula',
      description: 'A large supernova remnant in Cygnus, the result of a star that exploded 10,000-20,000 years ago. Known for its delicate filamentary structure.',
      objectType: 'Supernova Remnant',
      status: 'AVAILABLE',
      fameVisibility: 50,
      scientificSignificance: 60,
      rarity: 55,
      discoveryRecency: 50,
      culturalImpact: 70,
      totalScore: 285,
      badgeTier: 'STANDARD',
      discoveryYear: 1784,
      constellation: 'Cygnus',
      distanceLy: 2400,
      imagePrompt: promptResult.prompt,
      imageNegativePrompt: promptResult.negativePrompt.replace('--no ', ''),
      promptGeneratedAt: new Date(),
    },
  });

  console.log(`✓ Created: Veil Nebula (Supernova Remnant) - ID: ${nft.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
