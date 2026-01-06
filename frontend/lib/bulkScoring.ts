/**
 * CosmoNFT Bulk Scoring Algorithm
 * Algorithmically scores ~19,800 non-curated objects based on available data
 *
 * Scoring System (max 300 points):
 * - Cultural Significance: 0-60 (public recognition, "household name")
 * - Scientific Importance: 0-50 (research papers, discoveries)
 * - Historical Significance: 0-40 (discovery importance, firsts)
 * - Visual Impact: 0-30 (how spectacular it looks)
 * - Uniqueness: 0-30 (one of a kind, rare type)
 * - Accessibility: 0-20 (can we see/visit/study it)
 * - Proximity: 0-20 (distance relevance)
 * - Story Factor: 0-20 (mythology, cultural stories)
 * - Active Relevance: 0-15 (current missions, in the news)
 * - Future Potential: 0-15 (upcoming missions, habitability)
 */

import { ObjectCategory } from '@prisma/client';

export interface BulkObjectData {
  name: string;
  objectCategory: ObjectCategory;
  objectType?: string;
  spectralType?: string | null;
  distanceLy?: number | null;
  apparentMagnitude?: number | null;
  absoluteMagnitude?: number | null;
  massSolar?: number | null;
  temperatureK?: number | null;
  luminosity?: number | null;
  discoveryYear?: number | null;
  constellation?: string | null;
  notableFeatures?: string[] | null;
}

export interface DerivedScores {
  culturalSignificance: number;
  scientificImportance: number;
  historicalSignificance: number;
  visualImpact: number;
  uniqueness: number;
  accessibility: number;
  proximity: number;
  storyFactor: number;
  activeRelevance: number;
  futurePotential: number;
  totalScore: number;
  lowConfidence: boolean;
  missingData: string[];
}

// Well-known catalog prefixes that indicate a less "famous" object
const CATALOG_PREFIXES = [
  'HD', 'HIP', 'TYC', 'GSC', 'NGC', 'IC', 'UGC', 'PGC', 'SDSS',
  '2MASS', 'WISE', 'Gaia', 'KIC', 'TIC', 'EPIC', 'TOI', 'HAT',
  'WASP', 'CoRoT', 'XO-', 'PSR', 'GRB', 'SN', 'V*'
];

// Famous named objects (proper names indicate higher cultural significance)
const FAMOUS_NAME_PATTERNS = [
  // Greek/Latin names
  /^[A-Z][a-z]+$/,  // Single capitalized word (e.g., "Sirius", "Betelgeuse")
  /^[A-Z][a-z]+ [A-Z][a-z]+$/,  // Two words (e.g., "Alpha Centauri")
  // Constellation-based names
  /^(Alpha|Beta|Gamma|Delta|Epsilon|Zeta|Eta|Theta|Iota|Kappa|Lambda|Mu|Nu|Xi|Omicron|Pi|Rho|Sigma|Tau|Upsilon|Phi|Chi|Psi|Omega)\s/i,
];

// Messier catalog objects are famous
const MESSIER_PATTERN = /^M\d{1,3}$/;
const MESSIER_NAMES = new Set([
  'Orion Nebula', 'Crab Nebula', 'Ring Nebula', 'Whirlpool Galaxy',
  'Andromeda Galaxy', 'Sombrero Galaxy', 'Pinwheel Galaxy', 'Triangulum Galaxy'
]);

// Objects with active/recent missions
const ACTIVE_MISSION_TARGETS = new Set([
  'Mars', 'Moon', 'Europa', 'Titan', 'Enceladus', 'Ganymede', 'Jupiter',
  'Saturn', 'Sun', 'Bennu', 'Ryugu', 'Psyche'
]);

// Rare object types (higher uniqueness)
const RARE_TYPES: ObjectCategory[] = [
  'BLACK_HOLE', 'QUASAR', 'MAGNETAR', 'SPACECRAFT', 'NEUTRON_STAR', 'PULSAR'
];

// Visually spectacular object types
const VISUALLY_SPECTACULAR: ObjectCategory[] = [
  'NEBULA', 'GALAXY', 'PLANET', 'SUPERNOVA_REMNANT', 'COMET'
];

/**
 * Check if name appears to be a proper name vs catalog ID
 */
function hasProperName(name: string): boolean {
  // Check if it starts with a catalog prefix
  for (const prefix of CATALOG_PREFIXES) {
    if (name.startsWith(prefix + ' ') || name.startsWith(prefix + '-')) {
      return false;
    }
  }

  // Check if it matches famous name patterns
  for (const pattern of FAMOUS_NAME_PATTERNS) {
    if (pattern.test(name)) {
      return true;
    }
  }

  // Check if it's a Messier object
  if (MESSIER_PATTERN.test(name) || MESSIER_NAMES.has(name)) {
    return true;
  }

  // If it contains only letters, spaces, and common punctuation, likely a name
  if (/^[A-Za-z\s'-]+$/.test(name) && name.length > 3) {
    return true;
  }

  return false;
}

/**
 * Calculate Cultural Significance (0-60)
 * Based on: proper name, catalog membership, visibility
 */
function calculateCulturalSignificance(obj: BulkObjectData): number {
  let score = 5; // Base score

  // Proper name adds significant cultural value
  if (hasProperName(obj.name)) {
    score += 20;
  }

  // Messier objects are culturally significant
  if (MESSIER_PATTERN.test(obj.name)) {
    score += 15;
  }

  // Naked-eye visible objects (apparent magnitude < 6)
  if (obj.apparentMagnitude !== null && obj.apparentMagnitude !== undefined) {
    if (obj.apparentMagnitude < 0) {
      score += 20; // Very bright
    } else if (obj.apparentMagnitude < 2) {
      score += 15;
    } else if (obj.apparentMagnitude < 4) {
      score += 10;
    } else if (obj.apparentMagnitude < 6) {
      score += 5;
    }
  }

  // Certain object types have inherent cultural appeal
  if (obj.objectCategory === 'PLANET' || obj.objectCategory === 'SPACECRAFT') {
    score += 15;
  } else if (obj.objectCategory === 'MOON' || obj.objectCategory === 'COMET') {
    score += 10;
  } else if (obj.objectCategory === 'GALAXY' || obj.objectCategory === 'NEBULA') {
    score += 8;
  }

  return Math.min(60, score);
}

/**
 * Calculate Scientific Importance (0-50)
 * Based on: spectral type rarity, extreme properties, object type
 */
function calculateScientificImportance(obj: BulkObjectData): number {
  let score = 10; // Base score

  // Rare spectral types are scientifically important
  if (obj.spectralType) {
    const type = obj.spectralType.charAt(0).toUpperCase();
    if (type === 'O' || type === 'W') {
      score += 20; // Very hot, massive stars - rare
    } else if (type === 'B') {
      score += 15;
    } else if (type === 'L' || type === 'T' || type === 'Y') {
      score += 15; // Brown dwarfs - interesting
    } else if (type === 'S' || type === 'C') {
      score += 12; // Carbon stars - rare
    }
  }

  // Extreme luminosity
  if (obj.luminosity !== null && obj.luminosity !== undefined) {
    if (obj.luminosity > 100000) {
      score += 15; // Extremely luminous
    } else if (obj.luminosity > 10000) {
      score += 10;
    } else if (obj.luminosity > 1000) {
      score += 5;
    }
  }

  // Extreme mass
  if (obj.massSolar !== null && obj.massSolar !== undefined) {
    if (obj.massSolar > 50) {
      score += 15;
    } else if (obj.massSolar > 20) {
      score += 10;
    } else if (obj.massSolar > 8) {
      score += 5;
    }
  }

  // Object type importance
  if (RARE_TYPES.includes(obj.objectCategory)) {
    score += 15;
  } else if (obj.objectCategory === 'EXOPLANET') {
    score += 12;
  }

  return Math.min(50, score);
}

/**
 * Calculate Historical Significance (0-40)
 * Based on: discovery year, naming conventions
 */
function calculateHistoricalSignificance(obj: BulkObjectData): number {
  let score = 5; // Base score

  // Historical discovery
  if (obj.discoveryYear !== null && obj.discoveryYear !== undefined) {
    const age = 2026 - obj.discoveryYear;
    if (age > 200) {
      score += 25; // Ancient discovery
    } else if (age > 100) {
      score += 20;
    } else if (age > 50) {
      score += 15;
    } else if (age > 20) {
      score += 10;
    } else if (age > 5) {
      score += 5;
    } else {
      score += 3; // Recent discovery has some value too
    }
  }

  // Named after constellation = historically catalogued
  if (obj.constellation) {
    score += 5;
  }

  // Proper names often have historical significance
  if (hasProperName(obj.name)) {
    score += 8;
  }

  return Math.min(40, score);
}

/**
 * Calculate Visual Impact (0-30)
 * Based on: object type, brightness, spectral features
 */
function calculateVisualImpact(obj: BulkObjectData): number {
  let score = 10; // Base score

  // Visually spectacular object types
  if (VISUALLY_SPECTACULAR.includes(obj.objectCategory)) {
    score += 15;
  }

  // Brightness adds visual appeal
  if (obj.apparentMagnitude !== null && obj.apparentMagnitude !== undefined) {
    if (obj.apparentMagnitude < 0) {
      score += 10;
    } else if (obj.apparentMagnitude < 3) {
      score += 6;
    } else if (obj.apparentMagnitude < 6) {
      score += 3;
    }
  }

  // Colorful spectral types
  if (obj.spectralType) {
    const type = obj.spectralType.charAt(0).toUpperCase();
    if (type === 'M' || type === 'K') {
      score += 5; // Red/orange - visually interesting
    } else if (type === 'O' || type === 'B') {
      score += 5; // Blue - visually striking
    }
  }

  return Math.min(30, score);
}

/**
 * Calculate Uniqueness (0-30)
 * Based on: object type rarity, extreme properties
 */
function calculateUniqueness(obj: BulkObjectData): number {
  let score = 5; // Base score

  // Rare object types
  if (RARE_TYPES.includes(obj.objectCategory)) {
    score += 20;
  } else if (obj.objectCategory === 'DWARF_PLANET') {
    score += 15;
  } else if (obj.objectCategory === 'EXOPLANET' || obj.objectCategory === 'BROWN_DWARF') {
    score += 12;
  }

  // Extreme spectral class
  if (obj.spectralType) {
    const type = obj.spectralType.charAt(0).toUpperCase();
    if (type === 'O') {
      score += 10; // Only ~0.00003% of stars
    } else if (type === 'W') {
      score += 12; // Wolf-Rayet are extremely rare
    }

    // Luminosity class
    if (obj.spectralType.includes('Ia') || obj.spectralType.includes('Ib')) {
      score += 8; // Supergiants are rare
    }
  }

  return Math.min(30, score);
}

/**
 * Calculate Accessibility (0-20)
 * Based on: visibility, distance, observation difficulty
 */
function calculateAccessibility(obj: BulkObjectData): number {
  let score = 5; // Base score

  // Naked-eye visible
  if (obj.apparentMagnitude !== null && obj.apparentMagnitude !== undefined) {
    if (obj.apparentMagnitude < 0) {
      score += 15;
    } else if (obj.apparentMagnitude < 3) {
      score += 12;
    } else if (obj.apparentMagnitude < 6) {
      score += 8;
    } else if (obj.apparentMagnitude < 10) {
      score += 4;
    }
  }

  // Solar system objects are more accessible
  if (['PLANET', 'MOON', 'ASTEROID', 'COMET', 'DWARF_PLANET'].includes(obj.objectCategory)) {
    score += 5;
  }

  return Math.min(20, score);
}

/**
 * Calculate Proximity (0-20)
 * Based on: distance from Earth
 */
function calculateProximity(obj: BulkObjectData): number {
  if (obj.distanceLy === null || obj.distanceLy === undefined) {
    return 10; // Default middle score
  }

  const distance = obj.distanceLy;

  // Solar system
  if (distance < 0.01) {
    return 20;
  }

  // Nearest stars
  if (distance < 20) {
    return 18;
  }

  // Nearby stars
  if (distance < 100) {
    return 15;
  }

  // Within 1000 ly
  if (distance < 1000) {
    return 12;
  }

  // Within Milky Way
  if (distance < 100000) {
    return 10;
  }

  // Nearby galaxies
  if (distance < 5000000) {
    return 8;
  }

  // Distant
  return 5;
}

/**
 * Calculate Story Factor (0-20)
 * Based on: proper name, mythology, cultural stories
 */
function calculateStoryFactor(obj: BulkObjectData): number {
  let score = 5; // Base score

  // Proper names often have stories
  if (hasProperName(obj.name)) {
    score += 12;
  }

  // Constellation association adds mythology
  if (obj.constellation) {
    score += 5;
  }

  // Notable features suggest interesting stories
  if (obj.notableFeatures && obj.notableFeatures.length > 0) {
    score += Math.min(5, obj.notableFeatures.length * 2);
  }

  return Math.min(20, score);
}

/**
 * Calculate Active Relevance (0-15)
 * Based on: current missions, recent discoveries
 */
function calculateActiveRelevance(obj: BulkObjectData): number {
  let score = 5; // Base score

  // Active mission targets
  if (ACTIVE_MISSION_TARGETS.has(obj.name)) {
    score += 10;
  }

  // Recent discoveries (last 10 years)
  if (obj.discoveryYear !== null && obj.discoveryYear !== undefined) {
    if (obj.discoveryYear >= 2020) {
      score += 8;
    } else if (obj.discoveryYear >= 2015) {
      score += 5;
    }
  }

  // Exoplanets are currently hot topic
  if (obj.objectCategory === 'EXOPLANET') {
    score += 5;
  }

  return Math.min(15, score);
}

/**
 * Calculate Future Potential (0-15)
 * Based on: habitability potential, mission targets, scientific interest
 */
function calculateFuturePotential(obj: BulkObjectData): number {
  let score = 5; // Base score

  // Exoplanets have habitability potential
  if (obj.objectCategory === 'EXOPLANET') {
    score += 10;
  }

  // Moons with potential for life
  if (obj.objectCategory === 'MOON') {
    const name = obj.name.toLowerCase();
    if (['europa', 'enceladus', 'titan'].includes(name)) {
      score += 10;
    } else {
      score += 3;
    }
  }

  // Nearby stars (potential future exploration)
  if (obj.distanceLy !== null && obj.distanceLy !== undefined && obj.distanceLy < 20) {
    score += 5;
  }

  // Supernova candidates are scientifically exciting
  if (obj.spectralType?.includes('Ia') || obj.spectralType?.includes('Ib')) {
    score += 5;
  }

  return Math.min(15, score);
}

/**
 * Main scoring function - derives scores for a bulk object
 */
export function deriveScore(obj: BulkObjectData): DerivedScores {
  const missingData: string[] = [];

  // Track missing data
  if (!obj.spectralType) missingData.push('spectralType');
  if (obj.distanceLy === null || obj.distanceLy === undefined) missingData.push('distance');
  if (obj.apparentMagnitude === null || obj.apparentMagnitude === undefined) missingData.push('apparentMagnitude');
  if (obj.discoveryYear === null || obj.discoveryYear === undefined) missingData.push('discoveryYear');

  // Calculate each score
  const culturalSignificance = calculateCulturalSignificance(obj);
  const scientificImportance = calculateScientificImportance(obj);
  const historicalSignificance = calculateHistoricalSignificance(obj);
  const visualImpact = calculateVisualImpact(obj);
  const uniqueness = calculateUniqueness(obj);
  const accessibility = calculateAccessibility(obj);
  const proximity = calculateProximity(obj);
  const storyFactor = calculateStoryFactor(obj);
  const activeRelevance = calculateActiveRelevance(obj);
  const futurePotential = calculateFuturePotential(obj);

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

  // Low confidence if missing >2 key data points
  const lowConfidence = missingData.length > 2;

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
    lowConfidence,
    missingData,
  };
}

/**
 * Map object type string to ObjectCategory enum
 */
export function mapObjectTypeToCategory(objectType: string | null | undefined): ObjectCategory {
  if (!objectType) return 'STAR'; // Default to STAR (most common category)

  const type = objectType.toLowerCase().trim();

  // Direct mappings
  const mappings: Record<string, ObjectCategory> = {
    'star': 'STAR',
    'galaxy': 'GALAXY',
    'nebula': 'NEBULA',
    'exoplanet': 'EXOPLANET',
    'star cluster': 'STAR_CLUSTER',
    'globular cluster': 'STAR_CLUSTER',
    'open cluster': 'STAR_CLUSTER',
    'asteroid': 'ASTEROID',
    'moon': 'MOON',
    'comet': 'COMET',
    'pulsar': 'PULSAR',
    'black hole': 'BLACK_HOLE',
    'quasar': 'QUASAR',
    'supernova remnant': 'SUPERNOVA_REMNANT',
    'white dwarf': 'WHITE_DWARF',
    'neutron star': 'NEUTRON_STAR',
    'brown dwarf': 'BROWN_DWARF',
    'dwarf planet': 'DWARF_PLANET',
    'planet': 'PLANET',
    'magnetar': 'MAGNETAR',
    'spacecraft': 'SPACECRAFT',
  };

  // Check for direct match
  if (mappings[type]) {
    return mappings[type];
  }

  // Partial matching
  for (const [key, value] of Object.entries(mappings)) {
    if (type.includes(key)) {
      return value;
    }
  }

  return 'STAR'; // Default to STAR for unmapped types
}

/**
 * Get tier multiplier for a badge tier
 */
export function getTierMultiplier(tier: string): number {
  const multipliers: Record<string, number> = {
    'MYTHIC': 200,
    'LEGENDARY': 100,
    'ELITE': 50,
    'PREMIUM': 20,
    'EXCEPTIONAL': 5,
    'STANDARD': 1,
  };

  return multipliers[tier] || 1;
}

// Export test function
export function testScoring() {
  // Test with a known object
  const testObject: BulkObjectData = {
    name: 'Sirius',
    objectCategory: 'STAR',
    spectralType: 'A1V',
    distanceLy: 8.6,
    apparentMagnitude: -1.46,
    discoveryYear: -3000, // Ancient
    constellation: 'Canis Major',
  };

  const result = deriveScore(testObject);
  console.log('Test scoring for Sirius:');
  console.log(result);

  // Test with catalog object
  const catalogObject: BulkObjectData = {
    name: 'HD 123456',
    objectCategory: 'STAR',
    spectralType: 'G5V',
    distanceLy: 150,
    apparentMagnitude: 8.5,
  };

  const catalogResult = deriveScore(catalogObject);
  console.log('\nTest scoring for HD 123456:');
  console.log(catalogResult);
}
