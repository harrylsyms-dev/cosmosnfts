/**
 * Scientific Data Collection Script
 *
 * Fetches data from external APIs to populate scoring metrics:
 * - Wikipedia API: Page views, article length
 * - NASA ADS API: Paper counts
 * - Wikidata API: Cultural references, sitelinks
 *
 * Usage:
 *   npx tsx scripts/collect-scientific-data.ts [--limit N] [--dry-run]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// API CLIENTS
// ============================================================

/**
 * Wikipedia API - Get page views and article info
 * https://wikimedia.org/api/rest_v1/
 */
async function getWikipediaData(name: string): Promise<{
  pageViews: number | null;
  articleLength: number | null;
}> {
  try {
    // Clean the name for Wikipedia lookup
    const wikiTitle = name.replace(/ /g, '_');

    // Get page views (last 60 days average)
    const today = new Date();
    const endDate = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');

    const viewsUrl = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(wikiTitle)}/daily/${startDate}/${endDate}`;

    const viewsResponse = await fetch(viewsUrl, {
      headers: { 'User-Agent': 'CosmoNFT/1.0 (contact@cosmonft.com)' },
    });

    let pageViews: number | null = null;
    if (viewsResponse.ok) {
      const viewsData = await viewsResponse.json();
      if (viewsData.items && viewsData.items.length > 0) {
        const totalViews = viewsData.items.reduce(
          (sum: number, item: any) => sum + (item.views || 0),
          0
        );
        pageViews = Math.round(totalViews / viewsData.items.length); // Daily average
      }
    }

    // Get article info (length)
    const infoUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=info&format=json&origin=*`;

    const infoResponse = await fetch(infoUrl, {
      headers: { 'User-Agent': 'CosmoNFT/1.0 (contact@cosmonft.com)' },
    });

    let articleLength: number | null = null;
    if (infoResponse.ok) {
      const infoData = await infoResponse.json();
      const pages = infoData.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pageId !== '-1') {
          articleLength = pages[pageId].length || null;
        }
      }
    }

    return { pageViews, articleLength };
  } catch (error) {
    console.error(`Wikipedia API error for ${name}:`, error);
    return { pageViews: null, articleLength: null };
  }
}

/**
 * NASA ADS API - Get paper counts
 * https://ui.adsabs.harvard.edu/help/api/
 *
 * NOTE: Requires API token from https://ui.adsabs.harvard.edu/user/settings/token
 */
async function getNasaAdsData(name: string): Promise<{
  totalPapers: number | null;
  recentPapers: number | null;
}> {
  const ADS_TOKEN = process.env.NASA_ADS_TOKEN;

  if (!ADS_TOKEN) {
    // Without token, return null - we'll estimate from other sources
    return { totalPapers: null, recentPapers: null };
  }

  try {
    // Search for papers mentioning this object
    const searchQuery = encodeURIComponent(`"${name}"`);

    // Total papers
    const totalUrl = `https://api.adsabs.harvard.edu/v1/search/query?q=${searchQuery}&rows=0`;
    const totalResponse = await fetch(totalUrl, {
      headers: {
        Authorization: `Bearer ${ADS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    let totalPapers: number | null = null;
    if (totalResponse.ok) {
      const totalData = await totalResponse.json();
      totalPapers = totalData.response?.numFound || null;
    }

    // Recent papers (last 5 years)
    const fiveYearsAgo = new Date().getFullYear() - 5;
    const recentQuery = encodeURIComponent(`"${name}" year:${fiveYearsAgo}-`);
    const recentUrl = `https://api.adsabs.harvard.edu/v1/search/query?q=${recentQuery}&rows=0`;

    const recentResponse = await fetch(recentUrl, {
      headers: {
        Authorization: `Bearer ${ADS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    let recentPapers: number | null = null;
    if (recentResponse.ok) {
      const recentData = await recentResponse.json();
      recentPapers = recentData.response?.numFound || null;
    }

    return { totalPapers, recentPapers };
  } catch (error) {
    console.error(`NASA ADS API error for ${name}:`, error);
    return { totalPapers: null, recentPapers: null };
  }
}

/**
 * Wikidata API - Get cultural references and sitelinks
 * https://www.wikidata.org/wiki/Wikidata:Data_access
 */
async function getWikidataData(name: string): Promise<{
  sitelinks: number | null;
  culturalRefs: number | null;
  wikidataId: string | null;
}> {
  try {
    // Search for the entity
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&origin=*`;

    const searchResponse = await fetch(searchUrl, {
      headers: { 'User-Agent': 'CosmoNFT/1.0 (contact@cosmonft.com)' },
    });

    if (!searchResponse.ok) {
      return { sitelinks: null, culturalRefs: null, wikidataId: null };
    }

    const searchData = await searchResponse.json();
    if (!searchData.search || searchData.search.length === 0) {
      return { sitelinks: null, culturalRefs: null, wikidataId: null };
    }

    // Get the first matching entity
    const wikidataId = searchData.search[0].id;

    // Get entity details
    const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=sitelinks|claims&format=json&origin=*`;

    const entityResponse = await fetch(entityUrl, {
      headers: { 'User-Agent': 'CosmoNFT/1.0 (contact@cosmonft.com)' },
    });

    if (!entityResponse.ok) {
      return { sitelinks: null, culturalRefs: null, wikidataId };
    }

    const entityData = await entityResponse.json();
    const entity = entityData.entities?.[wikidataId];

    // Count sitelinks (Wikipedia language versions)
    const sitelinks = entity?.sitelinks
      ? Object.keys(entity.sitelinks).length
      : null;

    // Count cultural references (movies, books, songs that reference this object)
    // Properties: P1080 (from fictional universe), P8345 (media franchise), etc.
    let culturalRefs = 0;
    const culturalProperties = [
      'P1080', // from fictional universe
      'P8345', // media franchise
      'P1441', // present in work
      'P4969', // derivative work
      'P144',  // based on
    ];

    if (entity?.claims) {
      for (const prop of culturalProperties) {
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
    console.error(`Wikidata API error for ${name}:`, error);
    return { sitelinks: null, culturalRefs: null, wikidataId: null };
  }
}

// ============================================================
// SIMBAD DATA (for astronomical specifics)
// ============================================================

/**
 * SIMBAD API - Get astronomical data
 * https://simbad.u-strasbg.fr/simbad/sim-tap
 */
async function getSimbadData(name: string): Promise<{
  distanceParsec: number | null;
  apparentMagnitude: number | null;
  spectralType: string | null;
}> {
  try {
    // TAP query for SIMBAD
    const query = `SELECT basic.oid, basic.main_id, basic.sp_type, basic.flux_V, mesDistance.dist
                   FROM basic
                   LEFT JOIN mesDistance ON basic.oid = mesDistance.oidref
                   WHERE basic.main_id = '${name.replace(/'/g, "''")}'`;

    const url = `https://simbad.u-strasbg.fr/simbad/sim-tap/sync?request=doQuery&lang=adql&format=json&query=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'CosmoNFT/1.0 (contact@cosmonft.com)' },
    });

    if (!response.ok) {
      return { distanceParsec: null, apparentMagnitude: null, spectralType: null };
    }

    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      return { distanceParsec: null, apparentMagnitude: null, spectralType: null };
    }

    const row = data.data[0];
    return {
      spectralType: row[2] || null,
      apparentMagnitude: row[3] ? parseFloat(row[3]) : null,
      distanceParsec: row[4] ? parseFloat(row[4]) : null,
    };
  } catch (error) {
    console.error(`SIMBAD API error for ${name}:`, error);
    return { distanceParsec: null, apparentMagnitude: null, spectralType: null };
  }
}

// ============================================================
// MAIN COLLECTION FUNCTION
// ============================================================

interface CollectedData {
  name: string;
  wikipediaPageViews: number | null;
  wikipediaArticleLength: number | null;
  totalPaperCount: number | null;
  recentPaperCount: number | null;
  wikidataSitelinks: number | null;
  wikidataCulturalRefs: number | null;
  wikidataId: string | null;
  simbadDistanceParsec: number | null;
  simbadApparentMag: number | null;
  simbadSpectralType: string | null;
}

async function collectDataForObject(name: string): Promise<CollectedData> {
  console.log(`  Collecting data for: ${name}`);

  // Collect from all sources in parallel
  const [wikipedia, nasaAds, wikidata, simbad] = await Promise.all([
    getWikipediaData(name),
    getNasaAdsData(name),
    getWikidataData(name),
    getSimbadData(name),
  ]);

  return {
    name,
    wikipediaPageViews: wikipedia.pageViews,
    wikipediaArticleLength: wikipedia.articleLength,
    totalPaperCount: nasaAds.totalPapers,
    recentPaperCount: nasaAds.recentPapers,
    wikidataSitelinks: wikidata.sitelinks,
    wikidataCulturalRefs: wikidata.culturalRefs,
    wikidataId: wikidata.wikidataId,
    simbadDistanceParsec: simbad.distanceParsec,
    simbadApparentMag: simbad.apparentMagnitude,
    simbadSpectralType: simbad.spectralType,
  };
}

// ============================================================
// DATABASE UPDATE
// ============================================================

async function updateNftWithCollectedData(
  nftId: number,
  data: CollectedData,
  dryRun: boolean
): Promise<void> {
  // Convert parsec to light years if available
  const distanceLy = data.simbadDistanceParsec
    ? data.simbadDistanceParsec * 3.26156
    : null;

  const updateData = {
    // Wikipedia data
    wikipediaPageViews: data.wikipediaPageViews,
    wikipediaArticleLength: data.wikipediaArticleLength,

    // NASA ADS data
    totalPaperCount: data.totalPaperCount,
    recentPaperCount: data.recentPaperCount,

    // Wikidata
    wikidataSitelinks: data.wikidataSitelinks,
    wikidataCulturalRefs: data.wikidataCulturalRefs,
    wikidataId: data.wikidataId,

    // SIMBAD (if we don't already have this data)
    ...(distanceLy && { distanceLy }),
    ...(data.simbadApparentMag !== null && {
      apparentMagnitude: data.simbadApparentMag,
    }),
    ...(data.simbadSpectralType && { spectralType: data.simbadSpectralType }),

    // Mark as data collected
    dataCollectedAt: new Date(),
  };

  if (dryRun) {
    console.log(`    [DRY RUN] Would update NFT ${nftId}:`, updateData);
  } else {
    await prisma.nFT.update({
      where: { id: nftId },
      data: updateData,
    });
  }
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find((a) => a.startsWith('--limit'));
  const limit = limitArg ? parseInt(limitArg.split('=')[1] || '100', 10) : 100;

  console.log('=== Scientific Data Collection ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${limit} NFTs`);
  console.log('');

  // Check for NASA ADS token
  if (!process.env.NASA_ADS_TOKEN) {
    console.log('⚠️  NASA_ADS_TOKEN not set - paper counts will be unavailable');
    console.log('   Get a token at: https://ui.adsabs.harvard.edu/user/settings/token');
    console.log('');
  }

  // Get NFTs that need data collection
  // Prioritize: objects with proper names, objects without data
  const nfts = await prisma.nFT.findMany({
    where: {
      OR: [
        { wikipediaPageViews: null },
        { dataCollectedAt: null },
      ],
    },
    select: {
      id: true,
      name: true,
      objectType: true,
    },
    orderBy: [
      // Prioritize named objects over catalog IDs
      { name: 'asc' },
    ],
    take: limit,
  });

  console.log(`Found ${nfts.length} NFTs to process`);
  console.log('');

  let processed = 0;
  let errors = 0;
  const startTime = Date.now();

  // Process in batches to avoid rate limiting
  const BATCH_SIZE = 10;
  const DELAY_MS = 1000; // 1 second between batches

  for (let i = 0; i < nfts.length; i += BATCH_SIZE) {
    const batch = nfts.slice(i, i + BATCH_SIZE);

    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(nfts.length / BATCH_SIZE)}`);

    for (const nft of batch) {
      try {
        const data = await collectDataForObject(nft.name);
        await updateNftWithCollectedData(nft.id, data, dryRun);
        processed++;

        // Log summary
        const hasWiki = data.wikipediaPageViews !== null;
        const hasPapers = data.totalPaperCount !== null;
        const hasWikidata = data.wikidataSitelinks !== null;
        console.log(
          `    ✓ ${nft.name}: Wiki=${hasWiki ? data.wikipediaPageViews : 'N/A'}, Papers=${hasPapers ? data.totalPaperCount : 'N/A'}, Sitelinks=${hasWikidata ? data.wikidataSitelinks : 'N/A'}`
        );
      } catch (error) {
        console.error(`    ✗ Error processing ${nft.name}:`, error);
        errors++;
      }
    }

    // Rate limiting delay
    if (i + BATCH_SIZE < nfts.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('');
  console.log('=== Summary ===');
  console.log(`Processed: ${processed}/${nfts.length}`);
  console.log(`Errors: ${errors}`);
  console.log(`Time: ${elapsed}s`);
  console.log(`Rate: ${(processed / parseFloat(elapsed)).toFixed(1)} NFTs/sec`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
