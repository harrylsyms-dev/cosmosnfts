/**
 * Reassign OTHER Category Objects
 *
 * Maps objects from OTHER to their correct categories based on objectType field.
 * This allows removal of OTHER from the ObjectCategory enum.
 *
 * Usage:
 *   npx tsx scripts/reassign-other-category.ts [--dry-run]
 */

import { PrismaClient, ObjectCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping from legacy objectType string to ObjectCategory enum
const OBJECT_TYPE_MAP: Record<string, ObjectCategory> = {
  // Stars
  'Star': 'STAR',
  'Variable Star': 'STAR',
  'Binary Star': 'STAR',
  'Multiple Star': 'STAR',
  'Red Giant': 'STAR',
  'Blue Giant': 'STAR',
  'Supergiant': 'STAR',
  'Main Sequence': 'STAR',

  // Stellar remnants
  'White Dwarf': 'WHITE_DWARF',
  'Neutron Star': 'NEUTRON_STAR',
  'Pulsar': 'PULSAR',
  'Magnetar': 'MAGNETAR',
  'Black Hole': 'BLACK_HOLE',

  // Clusters
  'Star Cluster': 'STAR_CLUSTER',
  'Globular Cluster': 'STAR_CLUSTER',
  'Open Cluster': 'STAR_CLUSTER',

  // Deep sky
  'Galaxy': 'GALAXY',
  'Spiral Galaxy': 'GALAXY',
  'Elliptical Galaxy': 'GALAXY',
  'Irregular Galaxy': 'GALAXY',
  'Nebula': 'NEBULA',
  'Planetary Nebula': 'NEBULA',
  'Emission Nebula': 'NEBULA',
  'Reflection Nebula': 'NEBULA',
  'Dark Nebula': 'NEBULA',
  'Supernova Remnant': 'SUPERNOVA_REMNANT',
  'Supernova': 'SUPERNOVA_REMNANT',
  'Quasar': 'QUASAR',

  // Solar system
  'Planet': 'PLANET',
  'Dwarf Planet': 'DWARF_PLANET',
  'Moon': 'MOON',
  'Asteroid': 'ASTEROID',
  'Comet': 'COMET',
  'Spacecraft': 'SPACECRAFT',

  // Exoplanets
  'Exoplanet': 'EXOPLANET',

  // Subtypes
  'Brown Dwarf': 'BROWN_DWARF',

  // Catch-all
  'Unknown': 'STAR', // Default to STAR for unknown
};

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('=== Reassign OTHER Category Objects ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // Get all OTHER objects grouped by objectType
  console.log('Analyzing OTHER objects by objectType...');
  const otherObjects = await prisma.nFT.groupBy({
    by: ['objectType'],
    where: { objectCategory: 'OTHER' },
    _count: true,
    orderBy: { _count: { objectType: 'desc' } },
  });

  console.log('\nObjectType Distribution:');
  console.log('------------------------');
  let total = 0;
  for (const item of otherObjects) {
    const targetCategory = OBJECT_TYPE_MAP[item.objectType || 'Unknown'] || 'STAR';
    console.log(`  ${(item.objectType || 'null').padEnd(20)} → ${targetCategory.padEnd(15)} (${item._count})`);
    total += item._count;
  }
  console.log('------------------------');
  console.log(`Total OTHER objects: ${total}`);
  console.log('');

  // Perform the reassignment
  if (!dryRun) {
    console.log('Reassigning categories...');
    let updated = 0;

    for (const item of otherObjects) {
      const objectType = item.objectType || 'Unknown';
      const targetCategory = OBJECT_TYPE_MAP[objectType] || 'STAR';

      const result = await prisma.nFT.updateMany({
        where: {
          objectCategory: 'OTHER',
          objectType: item.objectType,
        },
        data: {
          objectCategory: targetCategory,
        },
      });

      updated += result.count;
      console.log(`  Updated ${result.count} "${objectType}" → ${targetCategory}`);
    }

    console.log(`\nTotal updated: ${updated}`);
  }

  // Verify final distribution
  console.log('\n=== Final Category Distribution ===');
  const finalDist = await prisma.nFT.groupBy({
    by: ['objectCategory'],
    _count: true,
    orderBy: { _count: { objectCategory: 'desc' } },
  });
  console.table(finalDist);

  // Check if any OTHER remain
  const remainingOther = await prisma.nFT.count({ where: { objectCategory: 'OTHER' } });
  if (remainingOther > 0) {
    console.log(`\n⚠️  ${remainingOther} objects still marked as OTHER`);
  } else {
    console.log('\n✅ No objects remain in OTHER category');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
