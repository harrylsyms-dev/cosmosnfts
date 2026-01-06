/**
 * Catalog Importer Utilities
 *
 * Utilities for importing astronomical objects from various catalogs:
 * - HYG Database (stars)
 * - NGC/IC (galaxies, nebulae)
 * - Exoplanet Archive
 *
 * Maps catalog data to our AstronomicalObject interface
 */

import { AstronomicalObject } from './astronomicalData';

// ============================================
// INTERFACES
// ============================================

export interface ScoredObject extends AstronomicalObject {
  // Scoring
  scores: {
    distance: number;      // 0-100
    mass: number;          // 0-100
    luminosity: number;    // 0-100
    temperature: number;   // 0-100
    discovery: number;     // 0-100
    total: number;         // 0-500
    multiplied: number;    // After type multiplier
  };
  badgeTier: 'STANDARD' | 'EXCEPTIONAL' | 'PREMIUM' | 'ELITE' | 'LEGENDARY';

  // Quality flags
  qualityFlags: {
    hasSpectralType: boolean;
    hasProperName: boolean;
    hasCuratedFeatures: boolean;
    hasDistanceData: boolean;
    hasLuminosityData: boolean;
    hasTemperatureData: boolean;
  };
  lowConfidence: boolean;

  // Source tracking
  catalogSource: string;        // 'HYG', 'NGC', 'Messier', 'Exoplanet', 'Curated'
  catalogId?: string;           // Original catalog ID (e.g., 'HIP 12345')
  sourceUrl?: string;           // Link to SIMBAD or catalog entry
}

export interface HYGRow {
  id: string;
  hip?: string;           // Hipparcos catalog number
  hd?: string;            // Henry Draper catalog number
  hr?: string;            // Harvard Revised catalog number
  gl?: string;            // Gliese catalog number
  bf?: string;            // Bayer/Flamsteed designation
  proper?: string;        // Proper name (e.g., "Sirius")
  ra: string;             // Right ascension
  dec: string;            // Declination
  dist?: string;          // Distance in parsecs
  pmra?: string;          // Proper motion RA
  pmdec?: string;         // Proper motion Dec
  rv?: string;            // Radial velocity
  mag?: string;           // Apparent magnitude
  absmag?: string;        // Absolute magnitude
  spect?: string;         // Spectral type
  ci?: string;            // Color index
  x?: string;             // Cartesian X
  y?: string;             // Cartesian Y
  z?: string;             // Cartesian Z
  vx?: string;            // Velocity X
  vy?: string;            // Velocity Y
  vz?: string;            // Velocity Z
  rarad?: string;         // RA in radians
  decrad?: string;        // Dec in radians
  pmrarad?: string;       // PM RA in radians
  pmdecrad?: string;      // PM Dec in radians
  bayer?: string;         // Bayer designation
  flam?: string;          // Flamsteed number
  con?: string;           // Constellation abbreviation
  comp?: string;          // Component (for multiple stars)
  comp_primary?: string;  // Primary component ID
  base?: string;          // Base catalog
  lum?: string;           // Luminosity (solar luminosities)
  var?: string;           // Variable star designation
  var_min?: string;       // Variable min magnitude
  var_max?: string;       // Variable max magnitude
}

// ============================================
// SCORING CONSTANTS
// ============================================

export const TIER_THRESHOLDS = {
  LEGENDARY: 450,
  ELITE: 425,
  PREMIUM: 400,
  EXCEPTIONAL: 375,
  STANDARD: 0,
};

export const TYPE_MULTIPLIERS: Record<string, number> = {
  'Black Hole': 1.15,
  'Quasar': 1.15,
  'Magnetar': 1.12,
  'Pulsar': 1.10,
  'Neutron Star': 1.10,
  'Supernova Remnant': 1.08,
  'Supernova': 1.08,
  'Exoplanet': 1.05,
  'Galaxy': 1.03,
  'Nebula': 1.02,
  'White Dwarf': 1.02,
  'Brown Dwarf': 1.01,
  'Star': 1.0,
  'Star Cluster': 1.0,
  'Globular Cluster': 1.01,
  'Planet': 1.0,
  'Moon': 1.0,
  'Dwarf Planet': 1.0,
  'Asteroid': 0.98,
  'Comet': 1.0,
};

// Target tier distribution for selection
export const TIER_TARGETS = {
  LEGENDARY: { count: 200, percent: 1 },
  ELITE: { count: 600, percent: 3 },
  PREMIUM: { count: 1200, percent: 6 },
  EXCEPTIONAL: { count: 3000, percent: 15 },
  STANDARD: { count: 15000, percent: 75 },
};

// Type quotas per tier (to ensure variety)
export const TIER_TYPE_QUOTAS: Record<string, Record<string, number>> = {
  LEGENDARY: {
    Star: 100,
    'Black Hole': 25,
    Nebula: 30,
    Galaxy: 25,
    Quasar: 10,
    other: 10,
  },
  ELITE: {
    Star: 300,
    Galaxy: 100,
    Nebula: 80,
    'Black Hole': 40,
    Exoplanet: 40,
    other: 40,
  },
  PREMIUM: {
    Star: 600,
    Galaxy: 200,
    Nebula: 150,
    Exoplanet: 100,
    'Star Cluster': 50,
    other: 100,
  },
  EXCEPTIONAL: {
    Star: 1500,
    Galaxy: 500,
    Nebula: 400,
    Exoplanet: 300,
    'Star Cluster': 100,
    other: 200,
  },
  STANDARD: {
    Star: 10000,
    Galaxy: 1500,
    Nebula: 1000,
    Exoplanet: 1000,
    'Star Cluster': 500,
    other: 1000,
  },
};

// Constellation full names
export const CONSTELLATION_NAMES: Record<string, string> = {
  And: 'Andromeda', Ant: 'Antlia', Aps: 'Apus', Aqr: 'Aquarius', Aql: 'Aquila',
  Ara: 'Ara', Ari: 'Aries', Aur: 'Auriga', Boo: 'Bootes', Cae: 'Caelum',
  Cam: 'Camelopardalis', Cnc: 'Cancer', CVn: 'Canes Venatici', CMa: 'Canis Major',
  CMi: 'Canis Minor', Cap: 'Capricornus', Car: 'Carina', Cas: 'Cassiopeia',
  Cen: 'Centaurus', Cep: 'Cepheus', Cet: 'Cetus', Cha: 'Chamaeleon',
  Cir: 'Circinus', Col: 'Columba', Com: 'Coma Berenices', CrA: 'Corona Australis',
  CrB: 'Corona Borealis', Crv: 'Corvus', Crt: 'Crater', Cru: 'Crux',
  Cyg: 'Cygnus', Del: 'Delphinus', Dor: 'Dorado', Dra: 'Draco',
  Equ: 'Equuleus', Eri: 'Eridanus', For: 'Fornax', Gem: 'Gemini',
  Gru: 'Grus', Her: 'Hercules', Hor: 'Horologium', Hya: 'Hydra',
  Hyi: 'Hydrus', Ind: 'Indus', Lac: 'Lacerta', Leo: 'Leo',
  LMi: 'Leo Minor', Lep: 'Lepus', Lib: 'Libra', Lup: 'Lupus',
  Lyn: 'Lynx', Lyr: 'Lyra', Men: 'Mensa', Mic: 'Microscopium',
  Mon: 'Monoceros', Mus: 'Musca', Nor: 'Norma', Oct: 'Octans',
  Oph: 'Ophiuchus', Ori: 'Orion', Pav: 'Pavo', Peg: 'Pegasus',
  Per: 'Perseus', Phe: 'Phoenix', Pic: 'Pictor', Psc: 'Pisces',
  PsA: 'Piscis Austrinus', Pup: 'Puppis', Pyx: 'Pyxis', Ret: 'Reticulum',
  Sge: 'Sagitta', Sgr: 'Sagittarius', Sco: 'Scorpius', Scl: 'Sculptor',
  Sct: 'Scutum', Ser: 'Serpens', Sex: 'Sextans', Tau: 'Taurus',
  Tel: 'Telescopium', Tri: 'Triangulum', TrA: 'Triangulum Australe',
  Tuc: 'Tucana', UMa: 'Ursa Major', UMi: 'Ursa Minor', Vel: 'Vela',
  Vir: 'Virgo', Vol: 'Volans', Vul: 'Vulpecula',
};

// ============================================
// SCORING FUNCTIONS
// ============================================

/**
 * Calculate distance score (0-100)
 * Closer stars score higher (more accessible), but very distant objects also score high (rare)
 */
export function calculateDistanceScore(distanceLy?: number): number {
  if (!distanceLy || distanceLy <= 0) return 30; // Unknown distance

  // Very close (< 10 ly): 90-100 (neighborhood stars are accessible)
  if (distanceLy < 10) return 90 + (10 - distanceLy);

  // Close (10-100 ly): 70-90
  if (distanceLy < 100) return 90 - (distanceLy - 10) * 0.22;

  // Moderate (100-1000 ly): 50-70
  if (distanceLy < 1000) return 70 - (Math.log10(distanceLy) - 2) * 20;

  // Far (1000-100000 ly): 30-50
  if (distanceLy < 100000) return 50 - (Math.log10(distanceLy) - 3) * 10;

  // Very far (100K-1M ly): 40-60 (galactic scale is interesting)
  if (distanceLy < 1000000) return 40 + (Math.log10(distanceLy) - 5) * 10;

  // Extragalactic (> 1M ly): 60-90 (rare and exotic)
  if (distanceLy < 1e9) return 60 + Math.min(30, Math.log10(distanceLy) - 6);

  // Edge of observable universe: 90-100
  return Math.min(100, 90 + Math.log10(distanceLy) - 9);
}

/**
 * Calculate mass score (0-100)
 * Uses logarithmic scale, with bonuses for extremes
 */
export function calculateMassScore(massSolar?: number): number {
  if (!massSolar || massSolar <= 0) return 30; // Unknown mass

  const logMass = Math.log10(massSolar);

  // Supermassive (> 1M solar masses): 90-100
  if (massSolar > 1e6) return 90 + Math.min(10, (logMass - 6) * 2);

  // Very massive (100-1M solar masses): 70-90
  if (massSolar > 100) return 70 + (logMass - 2) * 5;

  // Massive (10-100 solar masses): 60-70
  if (massSolar > 10) return 60 + (logMass - 1) * 10;

  // Sun-like (0.5-10 solar masses): 40-60
  if (massSolar > 0.5) return 40 + (logMass + 0.3) * 15;

  // Low mass (0.08-0.5 solar masses): 30-40
  if (massSolar > 0.08) return 30 + (logMass + 1.1) * 10;

  // Substellar (< 0.08 solar masses): 35-45 (brown dwarfs are interesting)
  return 35 + Math.min(10, Math.abs(logMass + 1.1) * 5);
}

/**
 * Calculate luminosity score (0-100)
 */
export function calculateLuminosityScore(luminosity?: number, absoluteMag?: number): number {
  // Try luminosity first
  if (luminosity && luminosity > 0) {
    const logLum = Math.log10(luminosity);

    // Hypergiant (> 1M solar luminosities): 95-100
    if (luminosity > 1e6) return 95 + Math.min(5, (logLum - 6));

    // Supergiant (10K-1M): 80-95
    if (luminosity > 1e4) return 80 + (logLum - 4) * 7.5;

    // Bright giant (100-10K): 60-80
    if (luminosity > 100) return 60 + (logLum - 2) * 10;

    // Giant (1-100): 40-60
    if (luminosity > 1) return 40 + logLum * 10;

    // Sub-solar (0.001-1): 30-40
    if (luminosity > 0.001) return 30 + (logLum + 3) * 3.3;

    // Very dim (< 0.001): 25-30 (red/brown dwarfs)
    return 25 + Math.min(5, Math.abs(logLum + 3));
  }

  // Fallback to absolute magnitude if no luminosity
  if (absoluteMag !== undefined) {
    // Brighter = more negative magnitude = higher score
    // Range: -10 (supergiants) to +20 (faint dwarfs)
    const score = 50 - absoluteMag * 2.5;
    return Math.max(10, Math.min(100, score));
  }

  return 30; // Unknown
}

/**
 * Calculate temperature score (0-100)
 * Extreme temperatures (very hot or very cold) score higher
 */
export function calculateTemperatureScore(temperatureK?: number): number {
  if (!temperatureK || temperatureK <= 0) return 30; // Unknown

  // Very hot (> 30000 K): 80-100
  if (temperatureK > 30000) return 80 + Math.min(20, (temperatureK - 30000) / 5000);

  // Hot (10000-30000 K): 60-80
  if (temperatureK > 10000) return 60 + (temperatureK - 10000) / 1000;

  // Warm (5000-10000 K): 40-60
  if (temperatureK > 5000) return 40 + (temperatureK - 5000) / 250;

  // Cool (3000-5000 K): 45-55 (Sun-like range)
  if (temperatureK > 3000) return 45 + (temperatureK - 3000) / 200;

  // Cold (1000-3000 K): 50-65 (red dwarfs, brown dwarfs - interesting)
  if (temperatureK > 1000) return 50 + (3000 - temperatureK) / 133;

  // Very cold (< 1000 K): 65-80 (exotic brown dwarfs)
  return 65 + Math.min(15, (1000 - temperatureK) / 50);
}

/**
 * Calculate discovery score (0-100)
 * Ancient objects and very recent discoveries score higher
 */
export function calculateDiscoveryScore(discoveryYear?: number): number {
  if (!discoveryYear) return 40; // Unknown discovery date

  const currentYear = new Date().getFullYear();
  const yearsAgo = currentYear - discoveryYear;

  // Ancient/prehistoric (visible to naked eye): 90-95
  if (discoveryYear < 1600) return 90 + Math.min(5, (1600 - discoveryYear) / 200);

  // Telescopic era (1600-1800): 75-85
  if (discoveryYear < 1800) return 75 + (discoveryYear - 1600) / 20;

  // 19th century: 60-75
  if (discoveryYear < 1900) return 60 + (discoveryYear - 1800) / 6.7;

  // Early 20th century: 45-60
  if (discoveryYear < 1960) return 45 + (discoveryYear - 1900) / 4;

  // Space age (1960-2000): 35-50
  if (discoveryYear < 2000) return 35 + (discoveryYear - 1960) / 2.7;

  // Recent (2000-2020): 40-60
  if (discoveryYear < 2020) return 40 + (discoveryYear - 2000);

  // Very recent (< 5 years): 70-90
  if (yearsAgo < 5) return 70 + (5 - yearsAgo) * 4;

  return 50; // Default
}

/**
 * Calculate total score and assign badge tier
 */
export function calculateTotalScore(
  scores: { distance: number; mass: number; luminosity: number; temperature: number; discovery: number },
  objectType: string
): { total: number; multiplied: number; tier: ScoredObject['badgeTier'] } {
  const total = scores.distance + scores.mass + scores.luminosity + scores.temperature + scores.discovery;
  const multiplier = TYPE_MULTIPLIERS[objectType] || 1.0;
  const multiplied = Math.round(total * multiplier);

  let tier: ScoredObject['badgeTier'];
  if (multiplied >= TIER_THRESHOLDS.LEGENDARY) tier = 'LEGENDARY';
  else if (multiplied >= TIER_THRESHOLDS.ELITE) tier = 'ELITE';
  else if (multiplied >= TIER_THRESHOLDS.PREMIUM) tier = 'PREMIUM';
  else if (multiplied >= TIER_THRESHOLDS.EXCEPTIONAL) tier = 'EXCEPTIONAL';
  else tier = 'STANDARD';

  return { total, multiplied, tier };
}

// ============================================
// HYG PARSER
// ============================================

/**
 * Parse CSV string to array of rows
 */
export function parseCSV(csvString: string): string[][] {
  const lines = csvString.split('\n');
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Simple CSV parsing (handles basic cases)
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

/**
 * Parse HYG CSV data into typed rows
 */
export function parseHYGCSV(csvString: string): HYGRow[] {
  const rows = parseCSV(csvString);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase());
  const data: HYGRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < headers.length) continue;

    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    data.push(obj as unknown as HYGRow);
  }

  return data;
}

/**
 * Generate display name for a star
 */
export function generateStarDisplayName(row: HYGRow): string {
  // Prefer proper name
  if (row.proper && row.proper.trim()) {
    return row.proper.trim();
  }

  // Then Bayer/Flamsteed designation
  if (row.bf && row.bf.trim()) {
    return row.bf.trim();
  }

  // Then HD catalog
  if (row.hd && row.hd.trim()) {
    return `HD ${row.hd.trim()}`;
  }

  // Then Hipparcos
  if (row.hip && row.hip.trim()) {
    return `HIP ${row.hip.trim()}`;
  }

  // Then Harvard Revised
  if (row.hr && row.hr.trim()) {
    return `HR ${row.hr.trim()}`;
  }

  // Then Gliese
  if (row.gl && row.gl.trim()) {
    return `Gliese ${row.gl.trim()}`;
  }

  // Fallback to ID
  return `Star ${row.id}`;
}

/**
 * Estimate temperature from spectral type
 */
export function estimateTemperatureFromSpectralType(spectralType?: string): number | undefined {
  if (!spectralType) return undefined;

  const type = spectralType.charAt(0).toUpperCase();
  const subtype = parseInt(spectralType.charAt(1)) || 5;

  // Approximate temperatures by spectral class
  const temps: Record<string, [number, number]> = {
    'O': [30000, 50000],
    'B': [10000, 30000],
    'A': [7500, 10000],
    'F': [6000, 7500],
    'G': [5200, 6000],
    'K': [3700, 5200],
    'M': [2400, 3700],
    'L': [1300, 2400],
    'T': [550, 1300],
    'Y': [300, 550],
  };

  const range = temps[type];
  if (!range) return undefined;

  // Interpolate based on subtype (0-9)
  const fraction = subtype / 10;
  return Math.round(range[1] - (range[1] - range[0]) * fraction);
}

/**
 * Estimate luminosity from absolute magnitude
 */
export function estimateLuminosityFromAbsMag(absMag?: number): number | undefined {
  if (absMag === undefined) return undefined;

  // L/L_sun = 10^((4.83 - M) / 2.5)
  // where 4.83 is the Sun's absolute magnitude
  return Math.pow(10, (4.83 - absMag) / 2.5);
}

/**
 * Convert HYG row to AstronomicalObject
 */
export function hygRowToAstronomicalObject(row: HYGRow): AstronomicalObject | null {
  const name = generateStarDisplayName(row);

  // Parse distance (parsecs to light years)
  const distParsecs = parseFloat(row.dist || '0');
  const distanceLy = distParsecs > 0 ? distParsecs * 3.26156 : undefined;

  // Parse magnitudes
  const magnitude = parseFloat(row.mag || '');
  const absoluteMag = parseFloat(row.absmag || '');

  // Parse luminosity or estimate from absolute magnitude
  let luminosity = parseFloat(row.lum || '');
  if (isNaN(luminosity) || luminosity <= 0) {
    luminosity = estimateLuminosityFromAbsMag(absoluteMag) || 0;
  }

  // Estimate temperature from spectral type
  const temperature = estimateTemperatureFromSpectralType(row.spect);

  // Get constellation
  const constellation = row.con ? CONSTELLATION_NAMES[row.con] || row.con : undefined;

  // Build description
  const spectralDesc = row.spect ? `Spectral type ${row.spect}` : 'Star';
  const distDesc = distanceLy ? `${distanceLy.toFixed(1)} light years from Earth` : '';
  const conDesc = constellation ? `in ${constellation}` : '';
  const magDesc = !isNaN(magnitude) ? `with apparent magnitude ${magnitude.toFixed(2)}` : '';

  const description = [spectralDesc, conDesc, distDesc, magDesc]
    .filter(s => s)
    .join(', ') + '.';

  return {
    name,
    objectType: 'Star',
    description,
    spectralType: row.spect || undefined,
    constellation,
    distanceLy,
    distanceDisplay: distanceLy ? `${distanceLy.toFixed(1)} ly` : undefined,
    magnitude: !isNaN(magnitude) ? magnitude : undefined,
    absoluteMagnitude: !isNaN(absoluteMag) ? absoluteMag : undefined,
    luminosity: luminosity > 0 ? luminosity : undefined,
    temperature,
    alternateNames: buildAlternateNames(row),
  };
}

/**
 * Build alternate names from catalog IDs
 */
function buildAlternateNames(row: HYGRow): string[] {
  const alts: string[] = [];

  if (row.proper) {
    // If proper name exists, add catalog IDs as alternates
    if (row.hd) alts.push(`HD ${row.hd}`);
    if (row.hip) alts.push(`HIP ${row.hip}`);
    if (row.hr) alts.push(`HR ${row.hr}`);
    if (row.bf) alts.push(row.bf);
  } else if (row.bf) {
    // If Bayer/Flamsteed is primary, add catalog IDs
    if (row.hd) alts.push(`HD ${row.hd}`);
    if (row.hip) alts.push(`HIP ${row.hip}`);
  }

  if (row.gl) alts.push(`Gliese ${row.gl}`);
  if (row.var) alts.push(row.var);

  return alts.filter(a => a.trim());
}

/**
 * Score an astronomical object
 */
export function scoreAstronomicalObject(obj: AstronomicalObject): ScoredObject {
  const distance = calculateDistanceScore(obj.distanceLy);
  const mass = calculateMassScore(obj.mass);
  const luminosity = calculateLuminosityScore(obj.luminosity, obj.absoluteMagnitude);
  const temperature = calculateTemperatureScore(obj.temperature);
  const discovery = calculateDiscoveryScore(obj.discoveryYear);

  const scores = { distance, mass, luminosity, temperature, discovery };
  const { total, multiplied, tier } = calculateTotalScore(scores, obj.objectType);

  const qualityFlags = {
    hasSpectralType: !!obj.spectralType,
    hasProperName: !obj.name.startsWith('HD ') && !obj.name.startsWith('HIP ') && !obj.name.startsWith('Star '),
    hasCuratedFeatures: !!obj.visualFeatures && obj.visualFeatures.length > 0,
    hasDistanceData: !!obj.distanceLy && obj.distanceLy > 0,
    hasLuminosityData: !!obj.luminosity && obj.luminosity > 0,
    hasTemperatureData: !!obj.temperature && obj.temperature > 0,
  };

  // Low confidence if missing multiple key fields
  const missingCount = [
    !qualityFlags.hasSpectralType,
    !qualityFlags.hasDistanceData,
    !qualityFlags.hasLuminosityData,
  ].filter(Boolean).length;

  const lowConfidence = missingCount >= 2;

  return {
    ...obj,
    scores: { ...scores, total, multiplied },
    badgeTier: tier,
    qualityFlags,
    lowConfidence,
    catalogSource: 'HYG',
    catalogId: obj.alternateNames?.[0],
    sourceUrl: obj.name.startsWith('HD ')
      ? `https://simbad.u-strasbg.fr/simbad/sim-id?Ident=${encodeURIComponent(obj.name)}`
      : undefined,
  };
}

/**
 * Process HYG CSV and return scored objects
 */
export function processHYGData(csvString: string, limit?: number): ScoredObject[] {
  const rows = parseHYGCSV(csvString);
  const results: ScoredObject[] = [];

  const maxRows = limit ? Math.min(rows.length, limit) : rows.length;

  for (let i = 0; i < maxRows; i++) {
    const row = rows[i];
    const obj = hygRowToAstronomicalObject(row);

    if (obj) {
      const scored = scoreAstronomicalObject(obj);
      results.push(scored);
    }
  }

  return results;
}

// ============================================
// TIER DISTRIBUTION HELPERS
// ============================================

/**
 * Get tier distribution from scored objects
 */
export function getTierDistribution(objects: ScoredObject[]): Record<string, number> {
  const dist: Record<string, number> = {
    LEGENDARY: 0,
    ELITE: 0,
    PREMIUM: 0,
    EXCEPTIONAL: 0,
    STANDARD: 0,
  };

  for (const obj of objects) {
    dist[obj.badgeTier]++;
  }

  return dist;
}

/**
 * Get score statistics
 */
export function getScoreStats(objects: ScoredObject[]): {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
} {
  if (objects.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
  }

  const scores = objects.map(o => o.scores.multiplied).sort((a, b) => a - b);
  const min = scores[0];
  const max = scores[scores.length - 1];
  const sum = scores.reduce((a, b) => a + b, 0);
  const mean = sum / scores.length;
  const median = scores[Math.floor(scores.length / 2)];

  const variance = scores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  return { min, max, mean: Math.round(mean), median, stdDev: Math.round(stdDev) };
}
