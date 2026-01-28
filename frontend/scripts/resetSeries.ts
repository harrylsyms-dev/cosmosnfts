import { prisma } from '../lib/prisma';

async function reset() {
  console.log('Deleting series and phases...');

  // Reset NFT assignments
  const nftReset = await prisma.nFT.updateMany({
    data: {
      seriesId: null,
      phaseId: null,
      seriesNumber: null,
      phaseNumber: null,
      imageReviewStatus: 'PENDING_GENERATION',
      reviewedAt: null,
      reviewedBy: null,
      reviewQueuePosition: null,
    }
  });
  console.log('Reset', nftReset.count, 'NFT assignments');

  // Delete phases first (foreign key)
  const phases = await prisma.phase.deleteMany();
  console.log('Deleted', phases.count, 'phases');

  // Delete series
  const series = await prisma.series.deleteMany();
  console.log('Deleted', series.count, 'series');

  // Reset site settings
  await prisma.siteSettings.updateMany({
    data: {
      currentSeriesId: null,
      currentPhaseId: null,
    }
  });
  console.log('Reset site settings');

  console.log('\nDone! Ready to initialize.');
}

reset()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
