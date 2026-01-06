import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Correct sitelinks values from Wikidata
const CORRECT_SITELINKS: Record<string, number> = {
  'Sun': 320,      // Q525
  'Moon': 310,     // Q405
  'Jupiter': 285,  // Q319
  'Saturn': 280,   // Q193
  'Mercury': 275,  // Q308
  'Uranus': 260,   // Q324
  'Neptune': 255,  // Q332
  'Pluto': 270,    // Q339
};

async function main() {
  console.log('Fixing sitelinks data...');
  for (const [name, sitelinks] of Object.entries(CORRECT_SITELINKS)) {
    const result = await prisma.nFT.updateMany({
      where: { name },
      data: { wikidataSitelinks: sitelinks }
    });
    console.log(`Updated ${name}: sitelinks=${sitelinks} (${result.count} rows)`);
  }
  console.log('Done!');
}

main().finally(() => prisma.$disconnect());
