/**
 * Collect Wikipedia/Wikidata data for famous astronomical objects
 *
 * This script targets named objects (planets, moons, galaxies, etc.)
 * that have Wikipedia articles - not obscure catalog stars.
 *
 * Usage:
 *   npx tsx scripts/collect-famous-data.ts [--dry-run] [--limit N]
 */

import { PrismaClient, ObjectCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Famous objects that definitely have Wikipedia articles
const FAMOUS_OBJECTS = [
  // Planets
  'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune',
  // Dwarf planets
  'Pluto', 'Ceres', 'Eris', 'Makemake', 'Haumea', 'Sedna',
  // Stars
  'Sun', 'Sirius', 'Canopus', 'Alpha Centauri A', 'Alpha Centauri B', 'Proxima Centauri',
  'Arcturus', 'Vega', 'Capella', 'Rigel', 'Procyon', 'Betelgeuse', 'Altair',
  'Aldebaran', 'Antares', 'Spica', 'Pollux', 'Fomalhaut', 'Deneb', 'Polaris',
  // Moons
  'Moon', 'Europa', 'Titan', 'Enceladus', 'Io', 'Ganymede', 'Callisto',
  'Triton', 'Phobos', 'Deimos', 'Charon', 'Miranda', 'Oberon', 'Titania',
  'Ariel', 'Umbriel', 'Rhea', 'Iapetus', 'Dione', 'Tethys', 'Mimas',
  // Galaxies
  'Andromeda Galaxy', 'Milky Way', 'Large Magellanic Cloud', 'Small Magellanic Cloud',
  'Triangulum Galaxy', 'Sombrero Galaxy', 'Whirlpool Galaxy', 'Pinwheel Galaxy',
  'Centaurus A', 'Bodes Galaxy', 'Cigar Galaxy',
  // Nebulae
  'Orion Nebula', 'Crab Nebula', 'Ring Nebula', 'Eagle Nebula', 'Helix Nebula',
  'Lagoon Nebula', 'Carina Nebula', 'Trifid Nebula', 'Horsehead Nebula',
  'Cat Eye Nebula', 'Pillars of Creation',
  // Black holes
  'Sagittarius A*', 'Cygnus X-1', 'M87*', 'TON 618', 'Gaia BH1',
  // Spacecraft
  'Voyager 1', 'Voyager 2', 'Hubble Space Telescope', 'James Webb Space Telescope',
  'International Space Station', 'Mars Curiosity Rover', 'Mars Perseverance Rover',
  'Cassini-Huygens', 'New Horizons', 'Juno', 'Parker Solar Probe',
  'Apollo 11', 'SpaceX Starship', 'Ingenuity Helicopter', 'OSIRIS-REx',
  // Cosmic features
  'Cosmic Microwave Background', 'Great Attractor', 'Bootes Void',
  'Hubble Deep Field', 'Laniakea Supercluster', 'Virgo Supercluster',
  'Local Group', 'Sloan Great Wall', 'Hercules-Corona Borealis Great Wall',
  'Observable Universe',
  // Comets
  'Halleys Comet', 'Comet Hale-Bopp', 'Comet Hyakutake', 'Comet NEOWISE', 'Comet Shoemaker-Levy 9',
  // Supernova remnants
  'Crab Pulsar', 'Cassiopeia A',
];

// Explicit Wikidata IDs for objects where search might return wrong entity
// These are objects with ambiguous names that need direct ID mapping
const WIKIDATA_IDS: Record<string, string> = {
  'Moon': 'Q405',       // Earth's Moon - search returns "Q1020879" (moon crater) instead
  'Sun': 'Q525',        // Our Sun
  'Earth': 'Q2',        // Our planet
  'Mercury': 'Q308',    // Planet Mercury (not the element or god)
  'Mars': 'Q111',       // Planet Mars
  'Jupiter': 'Q319',    // Planet Jupiter
  'Saturn': 'Q193',     // Planet Saturn
  'Uranus': 'Q324',     // Planet Uranus
  'Neptune': 'Q332',    // Planet Neptune
  'Venus': 'Q313',      // Planet Venus
  'Pluto': 'Q339',      // Dwarf planet Pluto
  'Titan': 'Q2565',     // Saturn's moon (not the mythological figure)
  'Europa': 'Q3143',    // Jupiter's moon
  'Io': 'Q3123',        // Jupiter's moon
  'Triton': 'Q3359',    // Neptune's moon
  'Charon': 'Q5083',    // Pluto's moon
  'Sirius': 'Q8832',    // Star Sirius
  'Polaris': 'Q11768',  // North Star
  'Vega': 'Q3427',      // Star Vega
};

// Wikipedia title mappings for objects with special names
const WIKIPEDIA_TITLES: Record<string, string> = {
  'Sun': 'Sun',
  'Moon': 'Moon',
  'Earth': 'Earth',
  'Andromeda Galaxy': 'Andromeda_Galaxy',
  'Milky Way': 'Milky_Way',
  'Large Magellanic Cloud': 'Large_Magellanic_Cloud',
  'Small Magellanic Cloud': 'Small_Magellanic_Cloud',
  'Triangulum Galaxy': 'Triangulum_Galaxy',
  'Sombrero Galaxy': 'Sombrero_Galaxy',
  'Whirlpool Galaxy': 'Whirlpool_Galaxy',
  'Pinwheel Galaxy': 'Pinwheel_Galaxy',
  'Centaurus A': 'Centaurus_A',
  'Bodes Galaxy': "Bode's_Galaxy",
  'Cigar Galaxy': 'Cigar_Galaxy',
  'Orion Nebula': 'Orion_Nebula',
  'Crab Nebula': 'Crab_Nebula',
  'Ring Nebula': 'Ring_Nebula',
  'Eagle Nebula': 'Eagle_Nebula',
  'Helix Nebula': 'Helix_Nebula',
  'Lagoon Nebula': 'Lagoon_Nebula',
  'Carina Nebula': 'Carina_Nebula',
  'Trifid Nebula': 'Trifid_Nebula',
  'Horsehead Nebula': 'Horsehead_Nebula',
  'Cat Eye Nebula': "Cat's_Eye_Nebula",
  'Pillars of Creation': 'Pillars_of_Creation',
  'Sagittarius A*': 'Sagittarius_A*',
  'Cygnus X-1': 'Cygnus_X-1',
  'M87*': 'Messier_87#Supermassive_black_hole_M87*',
  'TON 618': 'TON_618',
  'Gaia BH1': 'Gaia_BH1',
  'Alpha Centauri A': 'Alpha_Centauri',
  'Alpha Centauri B': 'Alpha_Centauri',
  'Proxima Centauri': 'Proxima_Centauri',
  'Voyager 1': 'Voyager_1',
  'Voyager 2': 'Voyager_2',
  'Hubble Space Telescope': 'Hubble_Space_Telescope',
  'James Webb Space Telescope': 'James_Webb_Space_Telescope',
  'International Space Station': 'International_Space_Station',
  'Mars Curiosity Rover': 'Curiosity_(rover)',
  'Mars Perseverance Rover': 'Perseverance_(rover)',
  'Cassini-Huygens': 'Cassini–Huygens',
  'New Horizons': 'New_Horizons',
  'Parker Solar Probe': 'Parker_Solar_Probe',
  'Apollo 11': 'Apollo_11',
  'SpaceX Starship': 'SpaceX_Starship',
  'Ingenuity Helicopter': 'Ingenuity_(helicopter)',
  'OSIRIS-REx': 'OSIRIS-REx',
  'Cosmic Microwave Background': 'Cosmic_microwave_background',
  'Great Attractor': 'Great_Attractor',
  'Bootes Void': 'Boötes_void',
  'Hubble Deep Field': 'Hubble_Deep_Field',
  'Laniakea Supercluster': 'Laniakea_Supercluster',
  'Virgo Supercluster': 'Virgo_Supercluster',
  'Local Group': 'Local_Group',
  'Sloan Great Wall': 'Sloan_Great_Wall',
  'Hercules-Corona Borealis Great Wall': 'Hercules–Corona_Borealis_Great_Wall',
  'Observable Universe': 'Observable_universe',
  'Halleys Comet': "Halley's_Comet",
  'Comet Hale-Bopp': 'Comet_Hale–Bopp',
  'Comet Hyakutake': 'Comet_Hyakutake',
  'Comet NEOWISE': 'Comet_NEOWISE',
  'Comet Shoemaker-Levy 9': 'Comet_Shoemaker–Levy_9',
  'Crab Pulsar': 'Crab_Pulsar',
  'Cassiopeia A': 'Cassiopeia_A',
};

// ============================================================
// API FUNCTIONS
// ============================================================

async function getWikipediaPageViews(name: string): Promise<number | null> {
  try {
    const wikiTitle = WIKIPEDIA_TITLES[name] || name.replace(/ /g, '_');

    const today = new Date();
    const endDate = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10).replace(/-/g, '');

    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(wikiTitle)}/daily/${startDate}/${endDate}`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'CosmoNFT/1.0 (astronomy data collection)' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.items?.length) return null;

    // Calculate daily average
    const totalViews = data.items.reduce((sum: number, item: any) => sum + (item.views || 0), 0);
    return Math.round(totalViews / data.items.length);
  } catch (error) {
    console.error(`  Wikipedia API error for ${name}:`, (error as Error).message);
    return null;
  }
}

async function getWikidataInfo(name: string): Promise<{
  sitelinks: number | null;
  culturalRefs: number | null;
  wikidataId: string | null;
}> {
  try {
    let wikidataId: string;

    // Use explicit ID if available (for ambiguous names like Moon, Sun, planets)
    if (WIKIDATA_IDS[name]) {
      wikidataId = WIKIDATA_IDS[name];
    } else {
      // Search for entity
      const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&origin=*`;
      const searchResponse = await fetch(searchUrl, {
        headers: { 'User-Agent': 'CosmoNFT/1.0' },
      });

      if (!searchResponse.ok) return { sitelinks: null, culturalRefs: null, wikidataId: null };

      const searchData = await searchResponse.json();
      if (!searchData.search?.length) return { sitelinks: null, culturalRefs: null, wikidataId: null };

      wikidataId = searchData.search[0].id;
    }

    // Get entity details
    const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=sitelinks|claims&format=json&origin=*`;
    const entityResponse = await fetch(entityUrl, {
      headers: { 'User-Agent': 'CosmoNFT/1.0' },
    });

    if (!entityResponse.ok) return { sitelinks: null, culturalRefs: null, wikidataId };

    const entityData = await entityResponse.json();
    const entity = entityData.entities?.[wikidataId];

    const sitelinks = entity?.sitelinks ? Object.keys(entity.sitelinks).length : null;

    // Count cultural references
    let culturalRefs = 0;
    const culturalProps = ['P1080', 'P8345', 'P1441', 'P4969', 'P144'];
    if (entity?.claims) {
      for (const prop of culturalProps) {
        if (entity.claims[prop]) {
          culturalRefs += entity.claims[prop].length;
        }
      }
    }

    return {
      sitelinks,
      culturalRefs: culturalRefs > 0 ? culturalRefs : null,
      wikidataId,
    };
  } catch (error) {
    console.error(`  Wikidata API error for ${name}:`, (error as Error).message);
    return { sitelinks: null, culturalRefs: null, wikidataId: null };
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit'));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

  console.log('=== Famous Object Data Collection ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // Get objects from database that match famous names
  const nfts = await prisma.nFT.findMany({
    where: {
      name: { in: FAMOUS_OBJECTS },
    },
    select: {
      id: true,
      name: true,
      objectCategory: true,
      wikipediaPageViews: true,
    },
    orderBy: { id: 'asc' },
    take: limit,
  });

  console.log(`Found ${nfts.length} famous objects in database`);
  console.log('');

  let processed = 0;
  let updated = 0;
  let errors = 0;

  for (const nft of nfts) {
    processed++;
    process.stdout.write(`\r[${processed}/${nfts.length}] Processing ${nft.name}...`.padEnd(60));

    try {
      // Fetch data in parallel
      const [pageViews, wikidata] = await Promise.all([
        getWikipediaPageViews(nft.name),
        getWikidataInfo(nft.name),
      ]);

      const hasData = pageViews !== null || wikidata.sitelinks !== null;

      if (hasData) {
        console.log(`\n  ${nft.name}: Views=${pageViews || 'N/A'}, Sitelinks=${wikidata.sitelinks || 'N/A'}, Cultural=${wikidata.culturalRefs || 'N/A'}`);

        if (!dryRun) {
          await prisma.nFT.update({
            where: { id: nft.id },
            data: {
              wikipediaPageViews: pageViews,
              wikidataSitelinks: wikidata.sitelinks,
              wikidataCulturalRefs: wikidata.culturalRefs,
              wikidataId: wikidata.wikidataId,
              dataCollectedAt: new Date(),
            },
          });
        }
        updated++;
      }

      // Rate limiting - 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`\n  Error processing ${nft.name}:`, error);
      errors++;
    }
  }

  console.log('\n\n=== Summary ===');
  console.log(`Processed: ${processed}`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${errors}`);

  // Show data coverage now
  console.log('\n=== Data Coverage After Collection ===');
  const withWiki = await prisma.nFT.count({ where: { NOT: { wikipediaPageViews: null } } });
  const withWikidata = await prisma.nFT.count({ where: { NOT: { wikidataSitelinks: null } } });
  const total = await prisma.nFT.count();

  console.log(`With Wikipedia views: ${withWiki}/${total} (${(withWiki/total*100).toFixed(1)}%)`);
  console.log(`With Wikidata sitelinks: ${withWikidata}/${total} (${(withWikidata/total*100).toFixed(1)}%)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
