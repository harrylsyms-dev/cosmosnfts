// CosmoNFT Constants - Tiers, Categories, Scoring
// This file contains all shared constants for the new 6-tier system

// ============================================
// BADGE TIERS
// ============================================

export type BadgeTier = 'MYTHIC' | 'LEGENDARY' | 'ELITE' | 'PREMIUM' | 'EXCEPTIONAL' | 'STANDARD';

export const TIER_CONFIG: Record<BadgeTier, {
  count: number;
  multiplier: number;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  rarity: string;
}> = {
  MYTHIC: {
    count: 20,
    multiplier: 200,
    icon: '🌟',
    color: 'gold',
    bgColor: 'bg-gradient-to-r from-yellow-600 to-amber-500',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-400',
    description: 'The most iconic objects in existence',
    rarity: '1 in 1,000',
  },
  LEGENDARY: {
    count: 100,
    multiplier: 100,
    icon: '⭐',
    color: 'purple',
    bgColor: 'bg-gradient-to-r from-purple-600 to-pink-500',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-400',
    description: 'Truly exceptional cosmic wonders',
    rarity: '1 in 200',
  },
  ELITE: {
    count: 400,
    multiplier: 50,
    icon: '💎',
    color: 'violet',
    bgColor: 'bg-violet-600',
    borderColor: 'border-violet-500',
    textColor: 'text-violet-400',
    description: 'Remarkable celestial objects',
    rarity: '1 in 50',
  },
  PREMIUM: {
    count: 1000,
    multiplier: 20,
    icon: '🏆',
    color: 'blue',
    bgColor: 'bg-blue-600',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-400',
    description: 'Notable astronomical bodies',
    rarity: '1 in 20',
  },
  EXCEPTIONAL: {
    count: 2000,
    multiplier: 5,
    icon: '✨',
    color: 'green',
    bgColor: 'bg-green-600',
    borderColor: 'border-green-500',
    textColor: 'text-green-400',
    description: 'Interesting cosmic phenomena',
    rarity: '1 in 10',
  },
  STANDARD: {
    count: 16480,
    multiplier: 1,
    icon: '○',
    color: 'gray',
    bgColor: 'bg-gray-600',
    borderColor: 'border-gray-500',
    textColor: 'text-gray-400',
    description: 'The foundation of our universe',
    rarity: '4 in 5',
  },
};

export const TIER_ORDER: BadgeTier[] = ['MYTHIC', 'LEGENDARY', 'ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD'];

// ============================================
// OBJECT CATEGORIES (19 types)
// ============================================

export type ObjectCategory =
  | 'STAR'
  | 'GALAXY'
  | 'NEBULA'
  | 'EXOPLANET'
  | 'STAR_CLUSTER'
  | 'ASTEROID'
  | 'MOON'
  | 'COMET'
  | 'PULSAR'
  | 'BLACK_HOLE'
  | 'QUASAR'
  | 'SUPERNOVA_REMNANT'
  | 'WHITE_DWARF'
  | 'NEUTRON_STAR'
  | 'BROWN_DWARF'
  | 'DWARF_PLANET'
  | 'PLANET'
  | 'MAGNETAR'
  | 'SPACECRAFT';

export const CATEGORY_CONFIG: Record<ObjectCategory, {
  label: string;
  icon: string;
  targetCount: number;
  description: string;
}> = {
  STAR: {
    label: 'Star',
    icon: '⭐',
    targetCount: 10000,
    description: 'Luminous spheres of plasma',
  },
  GALAXY: {
    label: 'Galaxy',
    icon: '🌌',
    targetCount: 2000,
    description: 'Gravitationally bound systems of stars',
  },
  NEBULA: {
    label: 'Nebula',
    icon: '💫',
    targetCount: 1500,
    description: 'Interstellar clouds of gas and dust',
  },
  EXOPLANET: {
    label: 'Exoplanet',
    icon: '🪐',
    targetCount: 1500,
    description: 'Planets orbiting other stars',
  },
  STAR_CLUSTER: {
    label: 'Star Cluster',
    icon: '✨',
    targetCount: 1000,
    description: 'Groups of stars bound by gravity',
  },
  ASTEROID: {
    label: 'Asteroid',
    icon: '☄️',
    targetCount: 800,
    description: 'Rocky objects orbiting the Sun',
  },
  MOON: {
    label: 'Moon',
    icon: '🌙',
    targetCount: 500,
    description: 'Natural satellites of planets',
  },
  COMET: {
    label: 'Comet',
    icon: '☄️',
    targetCount: 400,
    description: 'Icy bodies with spectacular tails',
  },
  PULSAR: {
    label: 'Pulsar',
    icon: '💫',
    targetCount: 400,
    description: 'Rotating neutron stars emitting beams',
  },
  BLACK_HOLE: {
    label: 'Black Hole',
    icon: '⚫',
    targetCount: 300,
    description: 'Regions of extreme gravity',
  },
  QUASAR: {
    label: 'Quasar',
    icon: '💠',
    targetCount: 300,
    description: 'Extremely luminous active galactic nuclei',
  },
  SUPERNOVA_REMNANT: {
    label: 'Supernova Remnant',
    icon: '💥',
    targetCount: 300,
    description: 'Debris from stellar explosions',
  },
  WHITE_DWARF: {
    label: 'White Dwarf',
    icon: '⚪',
    targetCount: 300,
    description: 'Stellar remnants of medium-mass stars',
  },
  NEUTRON_STAR: {
    label: 'Neutron Star',
    icon: '⚫',
    targetCount: 250,
    description: 'Ultra-dense stellar remnants',
  },
  BROWN_DWARF: {
    label: 'Brown Dwarf',
    icon: '🟤',
    targetCount: 250,
    description: 'Substellar objects too small to fuse hydrogen',
  },
  DWARF_PLANET: {
    label: 'Dwarf Planet',
    icon: '🔵',
    targetCount: 112,
    description: 'Small planetary-mass objects',
  },
  MAGNETAR: {
    label: 'Magnetar',
    icon: '⚡',
    targetCount: 50,
    description: 'Neutron stars with extreme magnetic fields',
  },
  SPACECRAFT: {
    label: 'Spacecraft',
    icon: '🚀',
    targetCount: 30,
    description: 'Human-made space exploration vehicles',
  },
  PLANET: {
    label: 'Planet',
    icon: '🌍',
    targetCount: 8,
    description: 'Major bodies orbiting our Sun',
  },
};

export const CATEGORY_ORDER: ObjectCategory[] = [
  'STAR', 'GALAXY', 'NEBULA', 'EXOPLANET', 'STAR_CLUSTER',
  'ASTEROID', 'MOON', 'COMET', 'PULSAR', 'BLACK_HOLE',
  'QUASAR', 'SUPERNOVA_REMNANT', 'WHITE_DWARF', 'NEUTRON_STAR',
  'BROWN_DWARF', 'DWARF_PLANET', 'MAGNETAR', 'SPACECRAFT', 'PLANET'
];

// ============================================
// SCORING METRICS (10 metrics, max 300)
// ============================================

export const MAX_TOTAL_SCORE = 300;

export type ScoreMetric =
  | 'culturalSignificance'
  | 'scientificImportance'
  | 'historicalSignificance'
  | 'visualImpact'
  | 'uniqueness'
  | 'accessibility'
  | 'proximity'
  | 'storyFactor'
  | 'activeRelevance'
  | 'futurePotential';

export const SCORE_METRICS: {
  key: ScoreMetric;
  label: string;
  max: number;
  tooltip: string;
}[] = [
  {
    key: 'culturalSignificance',
    label: 'Cultural Significance',
    max: 60,
    tooltip: 'How well-known this object is to the general public',
  },
  {
    key: 'scientificImportance',
    label: 'Scientific Importance',
    max: 50,
    tooltip: 'Research value based on scientific papers published',
  },
  {
    key: 'historicalSignificance',
    label: 'Historical Significance',
    max: 40,
    tooltip: 'When discovered and historical importance',
  },
  {
    key: 'visualImpact',
    label: 'Visual Impact',
    max: 30,
    tooltip: 'How visually spectacular this object appears',
  },
  {
    key: 'uniqueness',
    label: 'Uniqueness',
    max: 30,
    tooltip: 'How rare this type of object is in the universe',
  },
  {
    key: 'accessibility',
    label: 'Accessibility',
    max: 20,
    tooltip: 'How easily this object can be observed from Earth',
  },
  {
    key: 'proximity',
    label: 'Proximity',
    max: 20,
    tooltip: 'How close this object is to Earth',
  },
  {
    key: 'storyFactor',
    label: 'Story Factor',
    max: 20,
    tooltip: 'Cultural and mythological significance',
  },
  {
    key: 'activeRelevance',
    label: 'Active Relevance',
    max: 15,
    tooltip: 'Current scientific missions and research activity',
  },
  {
    key: 'futurePotential',
    label: 'Future Potential',
    max: 15,
    tooltip: 'Potential for future exploration and discovery',
  },
];

// ============================================
// PRICING
// ============================================

export const PRICING = {
  baseRatePerPoint: 0.10,
  donationPercentage: 30,
  currentSeries: 1,
  seriesMultiplier: 1.0,
};

// Calculate price: $0.10 x Score x Tier Multiplier x Series Multiplier
export function calculatePrice(score: number, tier: BadgeTier, seriesMultiplier: number = 1.0): number {
  const tierConfig = TIER_CONFIG[tier];
  return PRICING.baseRatePerPoint * score * tierConfig.multiplier * seriesMultiplier;
}

export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPriceDollars(dollars: number): string {
  if (dollars >= 1000) {
    return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ============================================
// COLLECTION STATS
// ============================================

export const COLLECTION = {
  totalNfts: 20000,
  categories: 19,
  hardCap: true,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTierBadgeStyle(tier: BadgeTier): string {
  const config = TIER_CONFIG[tier];
  return `${config.bgColor} ${config.borderColor} border`;
}

export function getTierIcon(tier: BadgeTier): string {
  return TIER_CONFIG[tier].icon;
}

export function getTierTextColor(tier: BadgeTier): string {
  return TIER_CONFIG[tier].textColor;
}

export function getCategoryLabel(category: ObjectCategory | string): string {
  const config = CATEGORY_CONFIG[category as ObjectCategory];
  return config?.label || category;
}

export function getCategoryIcon(category: ObjectCategory | string): string {
  const config = CATEGORY_CONFIG[category as ObjectCategory];
  return config?.icon || '🌟';
}

// Map legacy category names to new format
export function normalizeCategory(category: string): ObjectCategory | null {
  const normalized = category.toUpperCase().replace(/\s+/g, '_') as ObjectCategory;
  if (CATEGORY_CONFIG[normalized]) {
    return normalized;
  }
  // Handle legacy names
  const legacyMap: Record<string, ObjectCategory> = {
    'STAR': 'STAR',
    'GALAXY': 'GALAXY',
    'NEBULA': 'NEBULA',
    'EXOPLANET': 'EXOPLANET',
    'Star': 'STAR',
    'Galaxy': 'GALAXY',
    'Nebula': 'NEBULA',
    'Exoplanet': 'EXOPLANET',
    'Star Cluster': 'STAR_CLUSTER',
    'Black Hole': 'BLACK_HOLE',
    'Pulsar': 'PULSAR',
    'Asteroid': 'ASTEROID',
    'Comet': 'COMET',
    'Moon': 'MOON',
    'Planet': 'PLANET',
    'Quasar': 'QUASAR',
    'White Dwarf': 'WHITE_DWARF',
    'Neutron Star': 'NEUTRON_STAR',
    'Brown Dwarf': 'BROWN_DWARF',
    'Dwarf Planet': 'DWARF_PLANET',
    'Magnetar': 'MAGNETAR',
    'Supernova Remnant': 'SUPERNOVA_REMNANT',
    'Spacecraft': 'SPACECRAFT',
  };
  return legacyMap[category] || null;
}

// ============================================
// SERIES & PHASES
// ============================================

export const SERIES_CONFIG = {
  totalSeries: 4,
  nftsPerSeries: 5000,
  phasesPerSeries: 5,
  nftsPerPhase: 1000,
  phaseDurationDays: 14,
  seriesDurationWeeks: 10,
};

export type TrajectoryLabel =
  | 'NO_SERIES_2'
  | 'MINOR_INCREASE'
  | 'MODERATE_INCREASE'
  | 'SIGNIFICANT_INCREASE'
  | 'MAJOR_INCREASE';

export interface TrajectoryThreshold {
  min: number;
  max: number;
  multiplier: number | null;
  label: TrajectoryLabel;
  color: string;
  icon: string;
  message: string;
}

export const TRAJECTORY_THRESHOLDS: TrajectoryThreshold[] = [
  {
    min: 0,
    max: 0.25,
    multiplier: null,
    label: 'NO_SERIES_2',
    color: 'gray',
    icon: '⚫',
    message: 'Series 2 may not launch if sales remain below 25%',
  },
  {
    min: 0.25,
    max: 0.50,
    multiplier: 1.5,
    label: 'MINOR_INCREASE',
    color: 'green',
    icon: '🟢',
    message: 'Series 2 prices will be 1.5x current prices',
  },
  {
    min: 0.50,
    max: 0.75,
    multiplier: 2.0,
    label: 'MODERATE_INCREASE',
    color: 'yellow',
    icon: '🟡',
    message: 'Series 2 prices will be 2x current prices',
  },
  {
    min: 0.75,
    max: 0.90,
    multiplier: 2.5,
    label: 'SIGNIFICANT_INCREASE',
    color: 'orange',
    icon: '🟠',
    message: 'Series 2 prices will be 2.5x current prices',
  },
  {
    min: 0.90,
    max: 1.0,
    multiplier: 3.0,
    label: 'MAJOR_INCREASE',
    color: 'red',
    icon: '🔴',
    message: 'Series 2 prices will be 3x current prices',
  },
];

export interface TrajectoryInfo {
  multiplier: number | null;
  label: TrajectoryLabel;
  color: string;
  icon: string;
  message: string;
  currentThreshold: TrajectoryThreshold;
  nextThreshold: TrajectoryThreshold | null;
  percentToNextThreshold: number;
}

export function calculateTrajectory(sellThroughRate: number): TrajectoryInfo {
  // Find current threshold
  const currentThreshold = TRAJECTORY_THRESHOLDS.find(
    (t) => sellThroughRate >= t.min && sellThroughRate < t.max
  ) || TRAJECTORY_THRESHOLDS[TRAJECTORY_THRESHOLDS.length - 1];

  // Find next threshold
  const currentIndex = TRAJECTORY_THRESHOLDS.indexOf(currentThreshold);
  const nextThreshold = currentIndex < TRAJECTORY_THRESHOLDS.length - 1
    ? TRAJECTORY_THRESHOLDS[currentIndex + 1]
    : null;

  // Calculate percent to next threshold
  const percentToNextThreshold = nextThreshold
    ? Math.round((nextThreshold.min - sellThroughRate) * 100)
    : 0;

  return {
    multiplier: currentThreshold.multiplier,
    label: currentThreshold.label,
    color: currentThreshold.color,
    icon: currentThreshold.icon,
    message: currentThreshold.message,
    currentThreshold,
    nextThreshold,
    percentToNextThreshold,
  };
}

export function getTrajectoryColorClasses(color: string): { bg: string; text: string; border: string } {
  switch (color) {
    case 'red':
      return { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-500' };
    case 'orange':
      return { bg: 'bg-orange-900/30', text: 'text-orange-400', border: 'border-orange-500' };
    case 'yellow':
      return { bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-500' };
    case 'green':
      return { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-500' };
    default:
      return { bg: 'bg-gray-900/30', text: 'text-gray-400', border: 'border-gray-500' };
  }
}
