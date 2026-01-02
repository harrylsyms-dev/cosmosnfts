import { PrismaClient } from '@prisma/client';
import { leonardoService } from '../src/services/leonardo.service';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting NFT image generation...');

  const phaseNumber = process.env.PHASE_NUMBER ? parseInt(process.env.PHASE_NUMBER) : null;
  const forceRegenerate = process.env.FORCE_REGENERATE === 'true';

  try {
    if (phaseNumber) {
      // Generate specific phase
      console.log(`Generating Phase ${phaseNumber} images...`);
      const results = await leonardoService.generatePhase(phaseNumber);
      console.log(`Generated ${results.length} images for Phase ${phaseNumber}`);
    } else {
      // Auto-detect which phases need generation
      const phasesNeedingImages = await prisma.nFT.groupBy({
        by: ['currentTier'],
        where: {
          imageIpfsHash: null,
        },
        _count: true,
        orderBy: {
          currentTier: 'asc',
        },
      });

      if (phasesNeedingImages.length === 0) {
        console.log('All phases have images generated');
        process.exit(0);
      }

      console.log(`Phases needing images: ${phasesNeedingImages.map((p) => `Phase ${p.currentTier} (${p._count} NFTs)`).join(', ')}`);

      // Generate for the first phase that needs it
      const nextPhase = phasesNeedingImages[0];
      console.log(`Generating Phase ${nextPhase.currentTier} images (${nextPhase._count} NFTs)...`);

      const results = await leonardoService.generatePhase(nextPhase.currentTier);
      console.log(`Generated ${results.length} images for Phase ${nextPhase.currentTier}`);
    }

    // Verify generated images
    const allNFTs = await prisma.nFT.findMany({
      where: {
        imageIpfsHash: { not: null },
      },
      select: { tokenId: true },
    });

    console.log(`Total NFTs with images: ${allNFTs.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Image generation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
