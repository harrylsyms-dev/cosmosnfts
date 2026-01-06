import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkScores() {
  console.log('=== NFT Score Distribution Analysis ===\n');

  // Query 1: Basic stats
  const stats = await prisma.$queryRaw<any[]>`
    SELECT
      MIN(total_score) as min_score,
      MAX(total_score) as max_score,
      AVG(total_score) as avg_score,
      COUNT(*) as total
    FROM nfts
  `;

  console.log('Basic Statistics:');
  console.log(`  Min Score: ${stats[0].min_score}`);
  console.log(`  Max Score: ${stats[0].max_score}`);
  console.log(`  Avg Score: ${parseFloat(stats[0].avg_score).toFixed(2)}`);
  console.log(`  Total NFTs: ${stats[0].total}`);
  console.log();

  // Query 2: Top 20 scores
  const topScores = await prisma.$queryRaw<any[]>`
    SELECT
      total_score,
      COUNT(*) as count
    FROM nfts
    GROUP BY total_score
    ORDER BY total_score DESC
    LIMIT 20
  `;

  console.log('Top 20 Score Values:');
  for (const row of topScores) {
    console.log(`  Score ${row.total_score}: ${row.count} NFTs`);
  }
  console.log();

  // Query 3: Current tier distribution based on existing thresholds
  const tierDist = await prisma.$queryRaw<any[]>`
    SELECT
      badge_tier,
      COUNT(*) as count,
      MIN(total_score) as min_score,
      MAX(total_score) as max_score
    FROM nfts
    GROUP BY badge_tier
    ORDER BY count DESC
  `;

  console.log('Current Badge Tier Distribution:');
  for (const row of tierDist) {
    console.log(`  ${row.badge_tier}: ${row.count} NFTs (scores ${row.min_score}-${row.max_score})`);
  }
  console.log();

  // Query 4: Score ranges for new threshold planning
  const ranges = await prisma.$queryRaw<any[]>`
    SELECT
      CASE
        WHEN total_score >= 280 THEN '280+ (LEGENDARY candidate)'
        WHEN total_score >= 260 THEN '260-279 (ELITE candidate)'
        WHEN total_score >= 240 THEN '240-259 (PREMIUM candidate)'
        WHEN total_score >= 200 THEN '200-239 (EXCEPTIONAL candidate)'
        ELSE '<200 (STANDARD candidate)'
      END as score_range,
      COUNT(*) as count
    FROM nfts
    GROUP BY score_range
    ORDER BY score_range DESC
  `;

  console.log('Distribution with Proposed New Thresholds:');
  for (const row of ranges) {
    const pct = ((parseInt(row.count) / 20000) * 100).toFixed(2);
    console.log(`  ${row.score_range}: ${row.count} (${pct}%)`);
  }
  console.log();

  // Query 5: Check individual score components - top 5 highest scores
  const topNFTs = await prisma.$queryRaw<any[]>`
    SELECT
      id, name, total_score, distance_score, magnitude_score,
      temperature_score, luminosity_score, mass_score,
      spectral_type, badge_tier, object_type
    FROM nfts
    ORDER BY total_score DESC
    LIMIT 5
  `;

  console.log('Top 5 Highest Scoring NFTs (component breakdown):');
  for (const nft of topNFTs) {
    console.log(`\n  ${nft.name} (${nft.object_type})`);
    console.log(`    Total: ${nft.total_score} | Badge: ${nft.badge_tier}`);
    console.log(`    Distance: ${nft.distance_score} | Magnitude: ${nft.magnitude_score}`);
    console.log(`    Temperature: ${nft.temperature_score} | Luminosity: ${nft.luminosity_score}`);
    console.log(`    Mass: ${nft.mass_score} | Spectral: ${nft.spectral_type}`);
  }

  // Query 6: Score component averages to see what's limiting scores
  const avgComponents = await prisma.$queryRaw<any[]>`
    SELECT
      AVG(distance_score) as avg_distance,
      AVG(magnitude_score) as avg_magnitude,
      AVG(temperature_score) as avg_temperature,
      AVG(luminosity_score) as avg_luminosity,
      AVG(mass_score) as avg_mass,
      MAX(distance_score) as max_distance,
      MAX(magnitude_score) as max_magnitude,
      MAX(temperature_score) as max_temperature,
      MAX(luminosity_score) as max_luminosity,
      MAX(mass_score) as max_mass
    FROM nfts
  `;

  console.log('\n\nScore Component Analysis:');
  console.log('  Component      | Avg    | Max');
  console.log('  --------------|--------|------');
  const a = avgComponents[0];
  console.log(`  Distance       | ${parseFloat(a.avg_distance).toFixed(1).padStart(5)} | ${a.max_distance}`);
  console.log(`  Magnitude      | ${parseFloat(a.avg_magnitude).toFixed(1).padStart(5)} | ${a.max_magnitude}`);
  console.log(`  Temperature    | ${parseFloat(a.avg_temperature).toFixed(1).padStart(5)} | ${a.max_temperature}`);
  console.log(`  Luminosity     | ${parseFloat(a.avg_luminosity).toFixed(1).padStart(5)} | ${a.max_luminosity}`);
  console.log(`  Mass           | ${parseFloat(a.avg_mass).toFixed(1).padStart(5)} | ${a.max_mass}`);

  await prisma.$disconnect();
}

checkScores().catch(console.error);
