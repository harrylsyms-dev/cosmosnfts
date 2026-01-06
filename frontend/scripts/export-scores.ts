import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function exportScores() {
  console.log('Exporting NFT scores to CSV...');

  const nfts = await prisma.$queryRaw<any[]>`
    SELECT
      id,
      name,
      object_type as "objectType",
      badge_tier as "badgeTier",
      total_score as "totalScore",
      fame_visibility as "fameVisibility",
      scientific_significance as "scientificSignificance",
      rarity,
      discovery_recency as "discoveryRecency",
      cultural_impact as "culturalImpact",
      discovery_year as "discoveryYear",
      spectral_type as "spectralType",
      distance_ly as "distanceLy",
      mass_solar as "massSolar",
      temperature_k as "temperatureK",
      luminosity_value as "luminosity"
    FROM nfts
    ORDER BY total_score DESC
  `;

  // Create CSV header
  const headers = [
    'id', 'name', 'objectType', 'badgeTier', 'totalScore',
    'fameVisibility', 'scientificSignificance', 'rarity',
    'discoveryRecency', 'culturalImpact', 'discoveryYear',
    'spectralType', 'distanceLy', 'massSolar', 'temperatureK', 'luminosity'
  ];

  const csvLines = [headers.join(',')];

  for (const nft of nfts) {
    const row = headers.map(h => {
      const val = nft[h];
      if (val === null || val === undefined) return '';
      // Escape commas and quotes in strings
      if (typeof val === 'string') {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }
      return String(val);
    });
    csvLines.push(row.join(','));
  }

  const csvContent = csvLines.join('\n');
  const outputPath = 'nft-scores-export.csv';
  fs.writeFileSync(outputPath, csvContent);

  console.log(`Exported ${nfts.length} NFTs to ${outputPath}`);

  // Also print summary stats
  console.log('\n=== Score Component Summary ===');

  const stats = await prisma.$queryRaw<any[]>`
    SELECT
      AVG(fame_visibility) as avg_fame,
      AVG(scientific_significance) as avg_science,
      AVG(rarity) as avg_rarity,
      AVG(discovery_recency) as avg_discovery,
      AVG(cultural_impact) as avg_cultural,
      MAX(fame_visibility) as max_fame,
      MAX(scientific_significance) as max_science,
      MAX(rarity) as max_rarity,
      MAX(discovery_recency) as max_discovery,
      MAX(cultural_impact) as max_cultural
    FROM nfts
  `;

  const s = stats[0];
  console.log('\nComponent      | Avg   | Max');
  console.log('---------------|-------|----');
  console.log(`Fame/Visibility| ${parseFloat(s.avg_fame).toFixed(1).padStart(5)} | ${s.max_fame}`);
  console.log(`Science Signif | ${parseFloat(s.avg_science).toFixed(1).padStart(5)} | ${s.max_science}`);
  console.log(`Rarity         | ${parseFloat(s.avg_rarity).toFixed(1).padStart(5)} | ${s.max_rarity}`);
  console.log(`Discovery Rec  | ${parseFloat(s.avg_discovery).toFixed(1).padStart(5)} | ${s.max_discovery}`);
  console.log(`Cultural Impact| ${parseFloat(s.avg_cultural).toFixed(1).padStart(5)} | ${s.max_cultural}`);

  // Check tier distribution by object type
  console.log('\n=== Tier Distribution by Object Type ===');
  const byType = await prisma.$queryRaw<any[]>`
    SELECT
      object_type,
      badge_tier,
      COUNT(*) as count,
      AVG(total_score) as avg_score
    FROM nfts
    GROUP BY object_type, badge_tier
    ORDER BY object_type, badge_tier
  `;

  let currentType = '';
  for (const row of byType) {
    if (row.object_type !== currentType) {
      console.log(`\n${row.object_type || 'Unknown'}:`);
      currentType = row.object_type;
    }
    console.log(`  ${(row.badge_tier || 'null').padEnd(12)} ${String(row.count).padStart(5)} (avg: ${parseFloat(row.avg_score).toFixed(1)})`);
  }

  await prisma.$disconnect();
}

exportScores().catch(console.error);
