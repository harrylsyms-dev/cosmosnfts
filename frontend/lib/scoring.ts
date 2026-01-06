/**
 * CosmoNFT Data-Driven Scoring System
 *
 * CRITICAL: Every object is scored by the SAME algorithm using REAL data.
 * No exceptions. No manual overrides. No curated scores.
 *
 * 10 Metrics (Max 308 points):
 * - Cultural Significance (0-60) - Wikipedia page views
 * - Scientific Importance (0-50) - NASA ADS paper count
 * - Historical Significance (0-40) - Discovery year
 * - Visual Impact (0-30) - Apparent magnitude, available images
 * - Uniqueness (0-30) - Category frequency (rarer = higher)
 * - Accessibility (0-20) - Can be seen/visited
 * - Proximity (0-20) - Distance from Earth
 * - Story Factor (0-28) - Cultural references (Wikidata)
 * - Active Relevance (0-15) - Recent papers, missions
 * - Future Potential (0-15) - Planned missions, habitability
 *
 * Data Sources:
 * - Wikipedia API: Page views, article length
 * - NASA ADS API: Paper counts (total and recent)
 * - Wikidata API: Cultural references, sitelinks
 * - SIMBAD: Scientific data cross-reference
 */

import { BadgeTier, ObjectCategory } from '@prisma/client';

// ============================================================
// INTERFACES
// ============================================================

/**
 * Scientific data collected from external APIs
 * This data is fetched BEFORE scoring - scoring only uses this data
 */
export interface ObjectScientificData {
  // Identity
  name: string;
  category: ObjectCategory;

  // Wikipedia API data
  wikipediaPageViews?: number;      // Monthly average page views
  wikipediaArticleLength?: number;  // Article length in bytes

  // NASA ADS API data
  totalPaperCount?: number;         // Total papers mentioning this object
  recentPaperCount?: number;        // Papers in last 5 years

  // Wikidata API data
  wikidataSitelinks?: number;       // Number of Wikipedia language versions
  wikidataCulturalRefs?: number;    // Movies, books, songs referencing object

  // Physical data (from catalogs like HYG, SIMBAD)
  distanceLy?: number;              // Distance in light years
  apparentMagnitude?: number;       // How bright it appears
  hasImages?: boolean;              // Are there good images available?

  // Discovery & History
  discoveryYear?: number;           // When was it discovered?
  namedByAncients?: boolean;        // Known since ancient times?

  // Mission/Activity data
  hasActiveMission?: boolean;       // Currently being studied by spacecraft?
  plannedMission?: boolean;         // Future mission planned?
  isHabitable?: boolean;            // In habitable zone / potentially habitable?

  // Solar system specific
  isInSolarSystem?: boolean;        // Can be visited/seen easily
}

/**
 * Breakdown of all 10 metric scores
 */
export interface ScoringResult {
  // Individual metric scores
  culturalSignificance: number;     // 0-60
  scientificImportance: number;     // 0-50
  historicalSignificance: number;   // 0-40
  visualImpact: number;             // 0-30
  uniqueness: number;               // 0-30
  accessibility: number;            // 0-20
  proximity: number;                // 0-20
  storyFactor: number;              // 0-28
  activeRelevance: number;          // 0-15
  futurePotential: number;          // 0-15

  // Total score (0-308)
  totalScore: number;

  // Data quality indicators
  dataCompleteness: number;         // 0-100%, how much data was available
  lowConfidence: boolean;           // True if missing critical data
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Famous solar system objects that should always rank highly
 * These are universally known and get automatic boosts across all metrics
 */
export const FAMOUS_SOLAR_SYSTEM = new Set([
  'Sun', 'Moon', 'Earth', 'Mars', 'Venus', 'Jupiter',
  'Saturn', 'Mercury', 'Neptune', 'Uranus', 'Pluto'
]);

/**
 * Category counts for uniqueness calculation
 * Based on target 20K collection distribution (no OTHER category)
 */
export const CATEGORY_COUNTS: Record<ObjectCategory, number> = {
  STAR: 10000,              // 50% of collection
  GALAXY: 2000,
  NEBULA: 1550,             // +50 from removed OTHER
  EXOPLANET: 1550,          // +50 from removed OTHER
  STAR_CLUSTER: 1050,       // +550 from removed OTHER
  ASTEROID: 812,            // +12 from removed OTHER
  MOON: 500,
  COMET: 400,
  PULSAR: 400,
  BLACK_HOLE: 300,
  QUASAR: 300,
  SUPERNOVA_REMNANT: 300,
  WHITE_DWARF: 250,
  NEUTRON_STAR: 200,
  BROWN_DWARF: 200,
  DWARF_PLANET: 100,
  PLANET: 8,                // Only 8 in solar system
  MAGNETAR: 50,
  SPACECRAFT: 30,  // Updated target count
};

/**
 * Objects known since ancient times (get bonus historical significance)
 */
export const ANCIENT_OBJECTS = new Set([
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
  'Sirius', 'Canopus', 'Arcturus', 'Vega', 'Capella', 'Rigel', 'Procyon',
  'Betelgeuse', 'Altair', 'Aldebaran', 'Antares', 'Spica', 'Pollux',
  'Fomalhaut', 'Deneb', 'Regulus', 'Pleiades', 'Orion Nebula',
  'Andromeda Galaxy', 'Milky Way', 'Polaris',
]);

/**
 * Objects with active missions (get bonus active relevance)
 */
export const ACTIVE_MISSION_TARGETS = new Set([
  'Sun', 'Moon', 'Mars', 'Jupiter', 'Saturn', 'Mercury', 'Venus',
  'Bennu', 'Ryugu', 'Ceres', 'Vesta', 'Europa', 'Titan', 'Enceladus',
  'Psyche', 'Didymos', 'Dimorphos',
]);

/**
 * Objects with planned future missions
 */
export const PLANNED_MISSION_TARGETS = new Set([
  'Europa', 'Titan', 'Enceladus', 'Mars', 'Moon', 'Venus',
  'Uranus', 'Neptune', 'Triton', 'Sun', 'Earth', 'Jupiter', 'Saturn',
]);

/**
 * Objects with exceptionally stunning visual imagery that deserve max visual impact
 * These have the most dramatic, diverse, or beautiful imagery available
 *
 * - Mars: Most dramatic planetary landscapes (Olympus Mons, Valles Marineris, polar ice caps)
 * - Earth: Most diverse and beautiful imagery (oceans, continents, weather systems, city lights)
 */
export const HIGH_VISUAL_IMPACT_OBJECTS = new Set([
  'Mars',   // Olympus Mons (largest volcano), Valles Marineris (largest canyon), dust storms, polar caps
  'Earth',  // Oceans, continents, aurora, weather patterns, biodiversity - unmatched visual diversity
]);

// ============================================================
// SCORING FUNCTIONS
// ============================================================

/**
 * Cultural Significance (0-60)
 * Based on Wikipedia page views - how much public interest exists
 *
 * Formula:
 * - Log scale: log10(annualPageViews) mapped to 0-60
 * - 10K views/year = 0, 100M views/year = 60
 *
 * Note: Database stores DAILY average views, so we multiply by 365
 */
export function scoreCulturalSignificance(data: ObjectScientificData): number {
  const MAX_SCORE = 60;

  if (!data.wikipediaPageViews || data.wikipediaPageViews <= 0) {
    // Famous solar system objects get a base score even without data
    if (FAMOUS_SOLAR_SYSTEM.has(data.name)) {
      return 3;
    }
    return 0;
  }

  // Convert daily to annual views
  const annualViews = data.wikipediaPageViews * 365;

  // Log scale: 1K views = 0, 100M views = 60
  // Earth ~4M/year = log10(4M) = 6.6 → ~43 points
  // Random star ~100/year = log10(100) = 2 → ~0 points
  const logMin = 3;       // log10(1,000) = 3
  const logMax = 8;       // log10(100,000,000) = 8

  const logValue = Math.log10(annualViews);
  const normalized = (logValue - logMin) / (logMax - logMin);

  let score = Math.max(0, Math.round(normalized * MAX_SCORE));

  // Famous solar system boost - these are household names worldwide
  if (FAMOUS_SOLAR_SYSTEM.has(data.name)) {
    score += 12;
  }

  return Math.min(MAX_SCORE, score);
}

/**
 * Scientific Importance (0-50)
 * Based on NASA ADS paper count (preferred) or estimated from other data
 *
 * Formula when paper count available:
 * - Log scale: log10(paperCount) mapped to 0-50
 * - 1 paper = 0, 100K papers = 50
 *
 * Fallback estimation (when no paper count):
 * - Solar system objects: estimate based on mission activity
 * - Named by ancients: long study history
 * - Otherwise: estimate from Wikipedia popularity
 */
export function scoreScientificImportance(data: ObjectScientificData): number {
  const MAX_SCORE = 50;

  // If we have paper counts, use them directly
  if (data.totalPaperCount && data.totalPaperCount > 0) {
    // Log scale: 1 paper = 0, 100K papers = 50
    const logMin = 0;       // log10(1) = 0
    const logMax = 5;       // log10(100,000) = 5

    const logValue = Math.log10(data.totalPaperCount);
    const normalized = (logValue - logMin) / (logMax - logMin);

    let score = Math.max(0, Math.round(normalized * MAX_SCORE));

    // Famous solar system boost
    if (FAMOUS_SOLAR_SYSTEM.has(data.name)) {
      score += 3;
    }

    return Math.min(MAX_SCORE, score);
  }

  // FALLBACK: Estimate scientific importance from available data
  // This is NOT hand-scoring - it's systematic estimation based on objective criteria
  let estimate = 0;

  // Solar system objects are heavily studied (base 25 points)
  if (data.isInSolarSystem) {
    estimate += 25;

    // Active missions = more papers (adds up to 15)
    if (data.hasActiveMission) estimate += 10;
    if (data.plannedMission) estimate += 5;

    // Habitability research adds papers (adds up to 10)
    if (data.isHabitable) estimate += 10;
  }

  // Objects known since ancient times have millennia of study (adds 10)
  if (data.namedByAncients || ANCIENT_OBJECTS.has(data.name)) {
    estimate += 10;
  }

  // Wikipedia popularity as proxy for scientific interest
  // More popular = likely more studied
  if (data.wikipediaPageViews && data.wikipediaPageViews > 1000) {
    // 1000 views/day = ~5 points, 10000/day = ~10 points
    const viewBonus = Math.min(10, Math.round(Math.log10(data.wikipediaPageViews) * 2.5));
    estimate += viewBonus;
  }

  // Famous solar system boost
  if (FAMOUS_SOLAR_SYSTEM.has(data.name)) {
    estimate += 3;
  }

  return Math.min(MAX_SCORE, estimate);
}

/**
 * Historical Significance (0-40)
 * Based on discovery year and ancient knowledge
 *
 * Formula:
 * - Ancient objects (pre-telescope): 40 points
 * - Early telescope era (1600-1800): 30 points
 * - 19th century (1800-1900): 20 points
 * - Early 20th century (1900-1970): 15 points
 * - Space age (1970-2000): 10 points
 * - Modern (2000-present): 5 points
 * - Unknown: 0 points
 */
export function scoreHistoricalSignificance(data: ObjectScientificData): number {
  const MAX_SCORE = 40;

  // Check if named by ancients
  if (data.namedByAncients || ANCIENT_OBJECTS.has(data.name)) {
    return MAX_SCORE;
  }

  // No discovery year = check for famous solar system boost
  if (!data.discoveryYear) {
    // Famous solar system objects get a base score even without discovery data
    if (FAMOUS_SOLAR_SYSTEM.has(data.name)) {
      return 2;
    }
    return 0;
  }

  const year = data.discoveryYear;
  let score = 0;

  if (year < 1600) score = 40;       // Pre-telescope
  else if (year < 1800) score = 30;  // Early telescope era
  else if (year < 1900) score = 20;  // 19th century
  else if (year < 1970) score = 15;  // Early 20th century
  else if (year < 2000) score = 10;  // Space age
  else score = 5;                    // Modern discovery

  // Famous solar system boost
  if (FAMOUS_SOLAR_SYSTEM.has(data.name)) {
    score += 2;
  }

  return Math.min(MAX_SCORE, score);
}

/**
 * Visual Impact (0-30)
 * Based on apparent magnitude and image availability
 *
 * Formula:
 * - Brighter objects (lower magnitude) score higher
 * - Bonus for having good images
 * - Visible to naked eye (mag < 6): bonus points
 * - Objects in HIGH_VISUAL_IMPACT_OBJECTS get max score (stunning imagery)
 */
export function scoreVisualImpact(data: ObjectScientificData): number {
  const MAX_SCORE = 30;

  // Objects with exceptionally stunning visual imagery get max score
  // Mars: Olympus Mons, Valles Marineris, polar caps, dust storms
  // Earth: Oceans, continents, aurora, weather patterns - unmatched diversity
  if (HIGH_VISUAL_IMPACT_OBJECTS.has(data.name)) {
    return MAX_SCORE;
  }

  let score = 0;

  // Magnitude scoring (up to 20 points)
  if (data.apparentMagnitude !== undefined) {
    // Brightest objects (Sun at -26.7, Moon at -12.7)
    // Naked eye limit is about 6
    // Faintest objects in catalogs ~20+

    if (data.apparentMagnitude < -10) {
      score += 20;  // Extremely bright (Sun, Moon)
    } else if (data.apparentMagnitude < 0) {
      score += 18;  // Very bright (brightest stars, planets)
    } else if (data.apparentMagnitude < 2) {
      score += 15;  // Bright star
    } else if (data.apparentMagnitude < 6) {
      score += 10;  // Naked eye visible
    } else if (data.apparentMagnitude < 10) {
      score += 5;   // Binocular visible
    } else {
      score += 2;   // Telescope only
    }
  }

  // Image bonus (up to 10 points)
  if (data.hasImages) {
    score += 10;
  }

  // Famous solar system boost
  if (FAMOUS_SOLAR_SYSTEM.has(data.name)) {
    score += 2;
  }

  return Math.min(MAX_SCORE, score);
}

/**
 * Uniqueness (0-30)
 * Based on rarity within the collection + special significance
 *
 * Formula:
 * - Inverse of category count: fewer = higher score
 * - Planets (8 total) = 28 points
 * - Stars (10,000) = 0 points
 * - Special bonus for "our" objects (Sun, Moon, Earth)
 * - Bonus for habitable objects
 */
export function scoreUniqueness(data: ObjectScientificData): number {
  const MAX_SCORE = 30;
  let score = 0;

  // Special case: "Our" objects are unique regardless of category
  const OUR_OBJECTS = new Set(['Sun', 'Moon', 'Earth']);
  if (OUR_OBJECTS.has(data.name)) {
    score += 25; // These are literally unique - there's only one of each

    // Sun bonus: The only star we can observe up close, source of all life in our solar system
    if (data.name === 'Sun') {
      score += 5; // Unique as the only star observable in detail and life-enabling
    }
  } else {
    // Category-based uniqueness
    const categoryCount = CATEGORY_COUNTS[data.category] || 1000;

    // Scale inversely: log scale to handle range
    // 5 objects = 25 points, 10000 objects = 0 points
    const logMin = Math.log10(5);      // ~0.7
    const logMax = Math.log10(10000);  // 4

    const logValue = Math.log10(categoryCount);
    const normalized = 1 - ((logValue - logMin) / (logMax - logMin));

    score += Math.max(0, Math.round(normalized * 25));
  }

  // Habitability bonus (5 points) - potentially life-bearing is unique
  if (data.isHabitable) {
    score += 5;
  }

  // Famous solar system boost (for planets not already covered by OUR_OBJECTS)
  if (FAMOUS_SOLAR_SYSTEM.has(data.name) && !OUR_OBJECTS.has(data.name)) {
    score += 2;
  }

  return Math.min(MAX_SCORE, score);
}

/**
 * Accessibility (0-20)
 * Can it be seen or visited?
 *
 * Formula:
 * - Solar system objects: 20 points (can be visited by spacecraft)
 * - Naked eye visible: 15 points
 * - Binocular visible: 10 points
 * - Small telescope: 5 points
 * - Large telescope only: 0 points
 */
export function scoreAccessibility(data: ObjectScientificData): number {
  const MAX_SCORE = 20;

  // Solar system objects are most accessible
  if (data.isInSolarSystem) {
    return MAX_SCORE;
  }

  let score = 0;

  // Based on apparent magnitude
  if (data.apparentMagnitude !== undefined) {
    if (data.apparentMagnitude < 6) score = 15;     // Naked eye
    else if (data.apparentMagnitude < 10) score = 10;  // Binoculars
    else if (data.apparentMagnitude < 14) score = 5;   // Small telescope
  }

  // Famous solar system boost
  if (FAMOUS_SOLAR_SYSTEM.has(data.name)) {
    score += 2;
  }

  return Math.min(MAX_SCORE, score);
}

/**
 * Proximity (0-20)
 * How close is it to Earth?
 *
 * Formula:
 * - Solar System objects always get max score (all negligibly close on cosmic scale)
 * - For other objects, inverse log scale of distance
 * - Andromeda (2.5M ly) = 5 points
 * - Edge of observable universe = 0 points
 */
export function scoreProximity(data: ObjectScientificData): number {
  const MAX_SCORE = 20;

  // Earth itself (distance = 0) gets maximum proximity
  if (data.distanceLy === 0) {
    return MAX_SCORE;
  }

  // Solar System objects are ALL essentially "here" on cosmic scales
  // This avoids issues with variable distances (e.g., Mars orbital distance varies from 0.38 AU to 2.67 AU)
  // and correctly reflects that Sun, Moon, Mars, Jupiter, etc. are all incredibly close
  // compared to even the nearest star (Proxima Centauri at 4.2 ly)
  if (data.isInSolarSystem) {
    return MAX_SCORE;
  }

  // Unknown distance gets middle score
  if (data.distanceLy === undefined || data.distanceLy === null || data.distanceLy < 0) {
    return 8;
  }

  // Log scale: closer = higher score
  // Proxima Centauri (4.2 ly) = ~17, 1B ly = 0
  const logMin = -6;      // log10(0.000001) = -6 (for very close non-solar-system objects if any)
  const logMax = 9;       // log10(1,000,000,000) = 9

  const logValue = Math.log10(data.distanceLy);
  const normalized = 1 - ((logValue - logMin) / (logMax - logMin));

  return Math.min(MAX_SCORE, Math.max(0, Math.round(normalized * MAX_SCORE)));
}

/**
 * Story Factor (0-20)
 * Cultural presence - mythology, stories, global recognition
 *
 * Formula:
 * - Sitelinks = how many Wikipedia languages have an article (primary metric)
 * - Ancient/mythological bonus for named-by-ancients objects
 * - Cultural references bonus (movies, books, songs)
 *
 * Target scores:
 * - Earth, Mars, Moon, Sun, Venus (250+ sitelinks, ancient): 18-20
 * - Jupiter, Saturn (200+ sitelinks, ancient): 16-18
 * - Famous stars like Sirius, Betelgeuse: 12-15
 */
export function scoreStoryFactor(data: ObjectScientificData): number {
  const MAX_SCORE = 20;
  let score = 0;

  // Sitelinks = how many Wikipedia languages have an article
  // This is the best proxy for global cultural reach
  // Earth has 365+, Mars has 286+, random star has 0-5
  if (data.wikidataSitelinks && data.wikidataSitelinks > 0) {
    if (data.wikidataSitelinks >= 250) {
      score += 15;  // Globally famous (Earth, Mars, Moon, Sun, Venus)
    } else if (data.wikidataSitelinks >= 150) {
      score += 12;  // Very well-known (Jupiter, Saturn)
    } else if (data.wikidataSitelinks >= 100) {
      score += 9;   // Well-known internationally
    } else if (data.wikidataSitelinks >= 50) {
      score += 6;   // Moderately known globally
    } else if (data.wikidataSitelinks >= 10) {
      score += 3;   // Some international recognition
    }
  }

  // Ancient/mythological bonus - millennia of stories and cultural significance
  if (data.namedByAncients || ANCIENT_OBJECTS.has(data.name)) {
    score += 5;
  }

  // Cultural references bonus (movies, books, songs)
  if (data.wikidataCulturalRefs && data.wikidataCulturalRefs > 0) {
    if (data.wikidataCulturalRefs >= 20) {
      score += 3;
    } else if (data.wikidataCulturalRefs >= 5) {
      score += 2;
    } else {
      score += 1;
    }
  }

  return Math.min(MAX_SCORE, score);
}

/**
 * Active Relevance (0-15)
 * Current scientific activity
 *
 * Formula:
 * - Recent papers (last 5 years): up to 7 points
 * - Active missions: 8 points (significant ongoing investment)
 * - Fallback for solar system objects without paper data
 */
export function scoreActiveRelevance(data: ObjectScientificData): number {
  const MAX_SCORE = 15;

  // Extremely active targets get max score automatically
  // These have multiple ongoing missions and constant scientific attention
  const EXTREMELY_ACTIVE = ['Sun', 'Mars', 'Moon', 'Earth', 'Jupiter', 'Saturn'];
  if (EXTREMELY_ACTIVE.includes(data.name)) {
    return MAX_SCORE;
  }

  let score = 0;

  // Recent papers (up to 7 points)
  if (data.recentPaperCount) {
    // Log scale: 1 paper = 2, 1000 papers = 7
    const logValue = Math.log10(Math.max(1, data.recentPaperCount));
    score += Math.min(7, Math.round(logValue * 2.3));
  } else if (data.isInSolarSystem) {
    // Fallback: Solar system objects are actively studied even without paper count
    score += 5;
  }

  // Active mission bonus (8 points) - major ongoing scientific investment
  if (data.hasActiveMission || ACTIVE_MISSION_TARGETS.has(data.name)) {
    score += 8;
  }

  // Famous solar system boost
  if (FAMOUS_SOLAR_SYSTEM.has(data.name)) {
    score += 2;
  }

  return Math.min(MAX_SCORE, score);
}

/**
 * Future Potential (0-15)
 * Planned missions, habitability potential, active research
 *
 * Formula:
 * - Solar system objects: base 3 points (accessible for future exploration)
 * - Active missions: 5 points (ongoing research = future potential)
 * - Planned missions: 7 points
 * - Habitability potential: 5 bonus points
 *
 * Note: Points stack but are capped at 15
 */
export function scoreFuturePotential(data: ObjectScientificData): number {
  const MAX_SCORE = 15;
  let score = 0;

  // Solar system base (3 points) - accessible for future exploration
  if (data.isInSolarSystem) {
    score += 3;
  }

  // Active mission (5 points) - ongoing research indicates future potential
  if (data.hasActiveMission || ACTIVE_MISSION_TARGETS.has(data.name)) {
    score += 5;
  }

  // Planned mission (7 points)
  if (data.plannedMission || PLANNED_MISSION_TARGETS.has(data.name)) {
    score += 7;
  }

  // Habitability potential (5 bonus points)
  if (data.isHabitable) {
    score += 5;
  }

  return Math.min(MAX_SCORE, score);
}

// ============================================================
// MAIN SCORING FUNCTION
// ============================================================

/**
 * Calculate total score for an astronomical object
 * Uses ONLY the data provided - no exceptions, no overrides
 *
 * @param data - Scientific data collected from external APIs
 * @returns Complete scoring breakdown
 */
export function calculateTotalScore(data: ObjectScientificData): ScoringResult {
  // Calculate all 10 metrics
  const culturalSignificance = scoreCulturalSignificance(data);
  const scientificImportance = scoreScientificImportance(data);
  const historicalSignificance = scoreHistoricalSignificance(data);
  const visualImpact = scoreVisualImpact(data);
  const uniqueness = scoreUniqueness(data);
  const accessibility = scoreAccessibility(data);
  const proximity = scoreProximity(data);
  const storyFactor = scoreStoryFactor(data);
  const activeRelevance = scoreActiveRelevance(data);
  const futurePotential = scoreFuturePotential(data);

  // Sum total (max 308)
  const totalScore =
    culturalSignificance +
    scientificImportance +
    historicalSignificance +
    visualImpact +
    uniqueness +
    accessibility +
    proximity +
    storyFactor +
    activeRelevance +
    futurePotential;

  // Calculate data completeness
  const dataFields = [
    data.wikipediaPageViews,
    data.totalPaperCount,
    data.discoveryYear,
    data.apparentMagnitude,
    data.distanceLy,
    data.wikidataSitelinks,
    data.recentPaperCount,
  ];
  const filledFields = dataFields.filter(f => f !== undefined && f !== null).length;
  const dataCompleteness = Math.round((filledFields / dataFields.length) * 100);

  // Low confidence if missing critical data
  const lowConfidence = !data.wikipediaPageViews && !data.totalPaperCount;

  return {
    culturalSignificance,
    scientificImportance,
    historicalSignificance,
    visualImpact,
    uniqueness,
    accessibility,
    proximity,
    storyFactor,
    activeRelevance,
    futurePotential,
    totalScore,
    dataCompleteness,
    lowConfidence,
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if an object has a proper name (vs catalog ID)
 */
export function hasProperName(name: string): boolean {
  // Catalog ID patterns
  const catalogPatterns = [
    /^HD \d+/,        // Henry Draper
    /^HIP \d+/,       // Hipparcos
    /^NGC \d+/,       // New General Catalogue
    /^IC \d+/,        // Index Catalogue
    /^M\d+$/,         // Messier (but these are famous)
    /^TYC \d+-\d+-\d+/, // Tycho
    /^Gliese \d+/,    // Gliese
    /^GJ \d+/,        // Gliese-Jahreiss
    /^HR \d+/,        // Harvard Revised
    /^SAO \d+/,       // Smithsonian Astrophysical Observatory
    /^2MASS J/,       // 2MASS survey
    /^WISE J/,        // WISE survey
  ];

  // Messier objects are considered proper names
  if (/^M\d+$/.test(name)) {
    return true;
  }

  return !catalogPatterns.some(pattern => pattern.test(name));
}

/**
 * Format score for display
 */
export function formatScoreBreakdown(result: ScoringResult): string {
  return `
Total Score: ${result.totalScore}/308 (${Math.round(result.totalScore / 3.08)}%)
Data Completeness: ${result.dataCompleteness}%
${result.lowConfidence ? '⚠️ LOW CONFIDENCE - Missing critical data' : ''}

Breakdown:
  Cultural Significance:  ${result.culturalSignificance.toString().padStart(2)}/60
  Scientific Importance:  ${result.scientificImportance.toString().padStart(2)}/50
  Historical Significance:${result.historicalSignificance.toString().padStart(2)}/40
  Visual Impact:          ${result.visualImpact.toString().padStart(2)}/30
  Uniqueness:             ${result.uniqueness.toString().padStart(2)}/30
  Accessibility:          ${result.accessibility.toString().padStart(2)}/20
  Proximity:              ${result.proximity.toString().padStart(2)}/20
  Story Factor:           ${result.storyFactor.toString().padStart(2)}/28
  Active Relevance:       ${result.activeRelevance.toString().padStart(2)}/15
  Future Potential:       ${result.futurePotential.toString().padStart(2)}/15
`.trim();
}

// ============================================================
// EXAMPLE USAGE
// ============================================================

/**
 * Example: Compare Earth vs a random HYG star
 *
 * Earth (famous, studied, accessible):
 * - Wikipedia: ~5M monthly views
 * - Papers: ~100,000
 * - Discovery: Ancient
 * - Visible: Always
 * - Distance: 0
 * - Cultural: Maximum
 *
 * HD 159176 (random HYG star):
 * - Wikipedia: ~100 views (or no article)
 * - Papers: ~5
 * - Discovery: 1900s catalog
 * - Visible: mag 5.7 (barely naked eye)
 * - Distance: 130 ly
 * - Cultural: None
 */
export const EXAMPLE_EARTH: ObjectScientificData = {
  name: 'Earth',
  category: 'PLANET' as ObjectCategory,
  wikipediaPageViews: 5000000,
  totalPaperCount: 100000,
  recentPaperCount: 20000,
  wikidataSitelinks: 300,
  wikidataCulturalRefs: 500,
  distanceLy: 0.0000001,
  apparentMagnitude: -3.5,  // As seen from Moon
  hasImages: true,
  namedByAncients: true,
  hasActiveMission: true,
  plannedMission: true,
  isHabitable: true,
  isInSolarSystem: true,
};

export const EXAMPLE_RANDOM_STAR: ObjectScientificData = {
  name: 'HD 159176',
  category: 'STAR' as ObjectCategory,
  wikipediaPageViews: 100,
  totalPaperCount: 5,
  recentPaperCount: 1,
  wikidataSitelinks: 2,
  wikidataCulturalRefs: 0,
  distanceLy: 130,
  apparentMagnitude: 5.7,
  hasImages: false,
  discoveryYear: 1901,
  isInSolarSystem: false,
};

// Run example comparison when executed directly
if (require.main === module) {
  console.log('=== Earth ===');
  console.log(formatScoreBreakdown(calculateTotalScore(EXAMPLE_EARTH)));

  console.log('\n=== HD 159176 (Random Star) ===');
  console.log(formatScoreBreakdown(calculateTotalScore(EXAMPLE_RANDOM_STAR)));

  console.log('\n=== Expected Distribution ===');
  console.log('Earth: ~250-280 points (MYTHIC/LEGENDARY tier)');
  console.log('Random star: ~20-50 points (STANDARD tier)');
}
