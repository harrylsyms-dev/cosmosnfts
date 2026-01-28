import { prisma } from '../lib/prisma';

async function check() {
  const series = await prisma.series.findMany({
    include: {
      phases: {
        select: {
          id: true,
          phaseNumber: true,
          status: true,
          totalNFTs: true,
          approvedCount: true,
          pendingReviewCount: true,
        }
      }
    }
  });

  console.log('Series and Phases:');
  for (const s of series) {
    console.log(`\nSeries ${s.seriesNumber}: ${s.status}`);
    for (const p of s.phases) {
      console.log(`  Phase ${p.phaseNumber}: ${p.status} (${p.totalNFTs} NFTs, ${p.approvedCount} approved, ${p.pendingReviewCount} pending review)`);
    }
  }

  // Check NFT review status distribution
  const nftStats = await prisma.nFT.groupBy({
    by: ['imageReviewStatus'],
    _count: true
  });

  console.log('\nNFT Review Status:');
  nftStats.forEach(s => {
    console.log(`  ${s.imageReviewStatus}: ${s._count}`);
  });

  // Check site settings
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
  console.log('\nSite Settings:');
  console.log(`  currentSeriesId: ${settings?.currentSeriesId || 'not set'}`);
  console.log(`  currentPhaseId: ${settings?.currentPhaseId || 'not set'}`);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
