/**
 * Check current curated object inventory by type
 */

import { getAllAstronomicalObjects } from '../lib/astronomicalData';

const objects = getAllAstronomicalObjects();

// Count by type
const byType: Record<string, number> = {};
for (const obj of objects) {
  byType[obj.objectType] = (byType[obj.objectType] || 0) + 1;
}

console.log('Current curated objects by type:');
console.log('================================');
Object.entries(byType)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`  ${type.padEnd(20)} ${count}`);
  });
console.log(`\nTotal: ${objects.length} objects`);

// List non-star objects
console.log('\n\nNon-star objects:');
console.log('=================');
const nonStars = objects.filter(o => o.objectType !== 'Star');
for (const obj of nonStars) {
  console.log(`  ${obj.objectType.padEnd(18)} ${obj.name}`);
}
