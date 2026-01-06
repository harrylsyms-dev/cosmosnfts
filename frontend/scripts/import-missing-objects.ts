/**
 * Import Missing Objects Script
 *
 * Adds famous astronomical objects that may be missing from the HYG database.
 * CRITICAL: We provide SCIENTIFIC DATA only - scores are calculated by the algorithm.
 *
 * NO HAND-SCORING. NO EXCEPTIONS.
 *
 * Usage:
 *   npx tsx scripts/import-missing-objects.ts [--dry-run]
 */

import { PrismaClient, ObjectCategory } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// OBJECT DATA INTERFACE
// ============================================================

interface ObjectToImport {
  name: string;
  category: ObjectCategory;

  // Scientific data (used by scoring algorithm via API lookups)
  distanceLy?: number;
  apparentMagnitude?: number;
  spectralType?: string;
  discoveryYear?: number;

  // Flags for scoring
  namedByAncients?: boolean;
  isInSolarSystem?: boolean;
  hasActiveMission?: boolean;
  plannedMission?: boolean;
  isHabitable?: boolean;
  hasImages?: boolean;

  // API lookup hints
  wikipediaTitle?: string;
  wikidataId?: string;
  simbadId?: string;

  // Description for NFT
  description?: string;
}

// ============================================================
// PLANETS (8)
// ============================================================

const PLANETS: ObjectToImport[] = [
  {
    name: 'Mercury',
    category: 'PLANET',
    distanceLy: 0.0000061,
    apparentMagnitude: -1.9,
    namedByAncients: true,
    isInSolarSystem: true,
    hasActiveMission: true, // BepiColombo
    hasImages: true,
    wikipediaTitle: 'Mercury_(planet)',
    description: 'The smallest planet in the Solar System and closest to the Sun.',
  },
  {
    name: 'Venus',
    category: 'PLANET',
    distanceLy: 0.0000114,
    apparentMagnitude: -4.6,
    namedByAncients: true,
    isInSolarSystem: true,
    hasActiveMission: true, // Akatsuki
    plannedMission: true, // VERITAS, DAVINCI
    hasImages: true,
    wikipediaTitle: 'Venus',
    description: 'The second planet from the Sun, known for its thick toxic atmosphere and extreme surface temperatures.',
  },
  {
    name: 'Earth',
    category: 'PLANET',
    distanceLy: 0,
    apparentMagnitude: -3.5, // As seen from Moon
    namedByAncients: true,
    isInSolarSystem: true,
    hasActiveMission: true,
    isHabitable: true,
    hasImages: true,
    wikipediaTitle: 'Earth',
    description: 'The third planet from the Sun and the only known planet to harbor life.',
  },
  {
    name: 'Mars',
    category: 'PLANET',
    distanceLy: 0.0000121,
    apparentMagnitude: -2.9,
    namedByAncients: true,
    isInSolarSystem: true,
    hasActiveMission: true, // Perseverance, Curiosity, etc.
    plannedMission: true, // Mars Sample Return
    isHabitable: true, // Potentially
    hasImages: true,
    wikipediaTitle: 'Mars',
    description: 'The fourth planet from the Sun, known as the Red Planet.',
  },
  {
    name: 'Jupiter',
    category: 'PLANET',
    distanceLy: 0.0000827,
    apparentMagnitude: -2.9,
    namedByAncients: true,
    isInSolarSystem: true,
    hasActiveMission: true, // Juno
    hasImages: true,
    wikipediaTitle: 'Jupiter',
    description: 'The largest planet in the Solar System, a gas giant with iconic bands and the Great Red Spot.',
  },
  {
    name: 'Saturn',
    category: 'PLANET',
    distanceLy: 0.000152,
    apparentMagnitude: 0.5,
    namedByAncients: true,
    isInSolarSystem: true,
    plannedMission: true, // Dragonfly to Titan
    hasImages: true,
    wikipediaTitle: 'Saturn',
    description: 'The sixth planet from the Sun, famous for its spectacular ring system.',
  },
  {
    name: 'Uranus',
    category: 'PLANET',
    distanceLy: 0.000304,
    apparentMagnitude: 5.7,
    discoveryYear: 1781,
    isInSolarSystem: true,
    plannedMission: true, // Uranus Orbiter proposed
    hasImages: true,
    wikipediaTitle: 'Uranus',
    description: 'The seventh planet from the Sun, an ice giant with extreme axial tilt.',
  },
  {
    name: 'Neptune',
    category: 'PLANET',
    distanceLy: 0.000476,
    apparentMagnitude: 7.8,
    discoveryYear: 1846,
    isInSolarSystem: true,
    plannedMission: true,
    hasImages: true,
    wikipediaTitle: 'Neptune',
    description: 'The eighth and farthest planet from the Sun, a deep blue ice giant.',
  },
];

// ============================================================
// THE SUN & MOON
// ============================================================

const SUN_AND_MOON: ObjectToImport[] = [
  {
    name: 'Sun',
    category: 'STAR',
    distanceLy: 0.0000158,
    apparentMagnitude: -26.74,
    spectralType: 'G2V',
    namedByAncients: true,
    isInSolarSystem: true,
    hasActiveMission: true, // Parker Solar Probe, Solar Orbiter
    hasImages: true,
    wikipediaTitle: 'Sun',
    description: 'The star at the center of our Solar System, a G-type main-sequence star.',
  },
  {
    name: 'Moon',
    category: 'MOON',
    distanceLy: 0.0000000405,
    apparentMagnitude: -12.7,
    namedByAncients: true,
    isInSolarSystem: true,
    hasActiveMission: true, // Artemis program
    plannedMission: true,
    hasImages: true,
    wikipediaTitle: 'Moon',
    description: "Earth's only natural satellite, the fifth-largest moon in the Solar System.",
  },
];

// ============================================================
// MAJOR MOONS (15)
// ============================================================

const MAJOR_MOONS: ObjectToImport[] = [
  {
    name: 'Io',
    category: 'MOON',
    distanceLy: 0.0000827,
    apparentMagnitude: 5.0,
    discoveryYear: 1610,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Io_(moon)',
    description: "Jupiter's innermost Galilean moon, the most volcanically active body in the Solar System.",
  },
  {
    name: 'Europa',
    category: 'MOON',
    distanceLy: 0.0000827,
    apparentMagnitude: 5.3,
    discoveryYear: 1610,
    isInSolarSystem: true,
    hasActiveMission: true, // Europa Clipper launching
    plannedMission: true,
    isHabitable: true, // Subsurface ocean
    hasImages: true,
    wikipediaTitle: 'Europa_(moon)',
    description: "Jupiter's icy moon with a subsurface ocean, a prime target for astrobiology.",
  },
  {
    name: 'Ganymede',
    category: 'MOON',
    distanceLy: 0.0000827,
    apparentMagnitude: 4.6,
    discoveryYear: 1610,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Ganymede_(moon)',
    description: 'The largest moon in the Solar System, larger than the planet Mercury.',
  },
  {
    name: 'Callisto',
    category: 'MOON',
    distanceLy: 0.0000827,
    apparentMagnitude: 5.7,
    discoveryYear: 1610,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Callisto_(moon)',
    description: "Jupiter's second-largest moon, one of the most heavily cratered objects in the Solar System.",
  },
  {
    name: 'Titan',
    category: 'MOON',
    distanceLy: 0.000152,
    apparentMagnitude: 8.3,
    discoveryYear: 1655,
    isInSolarSystem: true,
    plannedMission: true, // Dragonfly
    isHabitable: true, // Prebiotic chemistry
    hasImages: true,
    wikipediaTitle: 'Titan_(moon)',
    description: "Saturn's largest moon with a thick atmosphere and liquid hydrocarbon lakes.",
  },
  {
    name: 'Enceladus',
    category: 'MOON',
    distanceLy: 0.000152,
    apparentMagnitude: 11.7,
    discoveryYear: 1789,
    isInSolarSystem: true,
    plannedMission: true,
    isHabitable: true, // Water geysers, subsurface ocean
    hasImages: true,
    wikipediaTitle: 'Enceladus',
    description: "Saturn's icy moon with active water geysers and a subsurface ocean.",
  },
  {
    name: 'Mimas',
    category: 'MOON',
    distanceLy: 0.000152,
    apparentMagnitude: 12.9,
    discoveryYear: 1789,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Mimas_(moon)',
    description: "Saturn's moon known for its giant Herschel crater, resembling the Death Star.",
  },
  {
    name: 'Triton',
    category: 'MOON',
    distanceLy: 0.000476,
    apparentMagnitude: 13.5,
    discoveryYear: 1846,
    isInSolarSystem: true,
    plannedMission: true, // Trident proposed
    hasImages: true,
    wikipediaTitle: 'Triton_(moon)',
    description: "Neptune's largest moon, likely a captured Kuiper Belt object with nitrogen geysers.",
  },
  {
    name: 'Charon',
    category: 'MOON',
    distanceLy: 0.000625,
    apparentMagnitude: 16.8,
    discoveryYear: 1978,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Charon_(moon)',
    description: "Pluto's largest moon, so large it and Pluto orbit a common center.",
  },
  {
    name: 'Phobos',
    category: 'MOON',
    distanceLy: 0.0000121,
    apparentMagnitude: 11.4,
    discoveryYear: 1877,
    isInSolarSystem: true,
    plannedMission: true, // MMX mission
    hasImages: true,
    wikipediaTitle: 'Phobos_(moon)',
    description: "Mars' larger moon, destined to eventually crash into Mars or break apart.",
  },
  {
    name: 'Deimos',
    category: 'MOON',
    distanceLy: 0.0000121,
    apparentMagnitude: 12.5,
    discoveryYear: 1877,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Deimos_(moon)',
    description: "Mars' smaller, outer moon with an irregular shape.",
  },
  {
    name: 'Miranda',
    category: 'MOON',
    distanceLy: 0.000304,
    apparentMagnitude: 16.5,
    discoveryYear: 1948,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Miranda_(moon)',
    description: "Uranus' smallest major moon with dramatic geological features.",
  },
  {
    name: 'Iapetus',
    category: 'MOON',
    distanceLy: 0.000152,
    apparentMagnitude: 11.0,
    discoveryYear: 1671,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Iapetus_(moon)',
    description: "Saturn's two-toned moon with a distinctive equatorial ridge.",
  },
  {
    name: 'Rhea',
    category: 'MOON',
    distanceLy: 0.000152,
    apparentMagnitude: 9.7,
    discoveryYear: 1672,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Rhea_(moon)',
    description: "Saturn's second-largest moon, an icy body with a thin atmosphere.",
  },
  {
    name: 'Oberon',
    category: 'MOON',
    distanceLy: 0.000304,
    apparentMagnitude: 14.2,
    discoveryYear: 1787,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Oberon_(moon)',
    description: "Uranus' outermost major moon, heavily cratered with mysterious dark patches.",
  },
];

// ============================================================
// DWARF PLANETS (6)
// ============================================================

const DWARF_PLANETS: ObjectToImport[] = [
  {
    name: 'Pluto',
    category: 'DWARF_PLANET',
    distanceLy: 0.000625,
    apparentMagnitude: 14.0,
    discoveryYear: 1930,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Pluto',
    description: 'A dwarf planet in the Kuiper Belt, famously visited by New Horizons in 2015.',
  },
  {
    name: 'Eris',
    category: 'DWARF_PLANET',
    distanceLy: 0.001,
    apparentMagnitude: 18.7,
    discoveryYear: 2005,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Eris_(dwarf_planet)',
    description: "The most massive dwarf planet, whose discovery led to Pluto's reclassification.",
  },
  {
    name: 'Makemake',
    category: 'DWARF_PLANET',
    distanceLy: 0.0007,
    apparentMagnitude: 17.0,
    discoveryYear: 2005,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Makemake',
    description: 'A Kuiper Belt dwarf planet with an extremely low temperature surface.',
  },
  {
    name: 'Haumea',
    category: 'DWARF_PLANET',
    distanceLy: 0.0006,
    apparentMagnitude: 17.3,
    discoveryYear: 2004,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Haumea',
    description: 'A uniquely elongated dwarf planet with two moons and a ring system.',
  },
  {
    name: 'Ceres',
    category: 'DWARF_PLANET',
    distanceLy: 0.0000044,
    apparentMagnitude: 6.6,
    discoveryYear: 1801,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Ceres_(dwarf_planet)',
    description: 'The only dwarf planet in the inner Solar System, located in the asteroid belt.',
  },
  {
    name: 'Sedna',
    category: 'DWARF_PLANET',
    distanceLy: 0.0014,
    apparentMagnitude: 21.1,
    discoveryYear: 2003,
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: '90377_Sedna',
    description: 'An extremely distant trans-Neptunian object with a highly elliptical orbit.',
  },
];

// ============================================================
// SPACECRAFT (15)
// ============================================================

const SPACECRAFT: ObjectToImport[] = [
  {
    name: 'Voyager 1',
    category: 'SPACECRAFT',
    discoveryYear: 1977, // Launch year
    hasActiveMission: true,
    hasImages: true,
    wikipediaTitle: 'Voyager_1',
    description: 'The farthest human-made object from Earth, now in interstellar space.',
  },
  {
    name: 'Voyager 2',
    category: 'SPACECRAFT',
    discoveryYear: 1977,
    hasActiveMission: true,
    hasImages: true,
    wikipediaTitle: 'Voyager_2',
    description: 'The only spacecraft to visit all four outer planets, now in interstellar space.',
  },
  {
    name: 'Hubble Space Telescope',
    category: 'SPACECRAFT',
    discoveryYear: 1990,
    hasActiveMission: true,
    hasImages: true,
    wikipediaTitle: 'Hubble_Space_Telescope',
    description: 'The iconic space telescope that revolutionized astronomy with stunning images.',
  },
  {
    name: 'James Webb Space Telescope',
    category: 'SPACECRAFT',
    discoveryYear: 2021,
    hasActiveMission: true,
    hasImages: true,
    wikipediaTitle: 'James_Webb_Space_Telescope',
    description: 'The most powerful space telescope ever built, observing in infrared light.',
  },
  {
    name: 'International Space Station',
    category: 'SPACECRAFT',
    discoveryYear: 1998,
    distanceLy: 0.0000000000043, // ~400 km
    hasActiveMission: true,
    hasImages: true,
    wikipediaTitle: 'International_Space_Station',
    description: 'A modular space station and the largest artificial object in orbit.',
  },
  {
    name: 'Curiosity',
    category: 'SPACECRAFT',
    discoveryYear: 2011,
    hasActiveMission: true,
    hasImages: true,
    wikipediaTitle: 'Curiosity_(rover)',
    description: 'A car-sized Mars rover exploring Gale Crater since 2012.',
  },
  {
    name: 'Perseverance',
    category: 'SPACECRAFT',
    discoveryYear: 2020,
    hasActiveMission: true,
    hasImages: true,
    wikipediaTitle: 'Perseverance_(rover)',
    description: 'A Mars rover searching for signs of ancient microbial life in Jezero Crater.',
  },
  {
    name: 'New Horizons',
    category: 'SPACECRAFT',
    discoveryYear: 2006,
    hasActiveMission: true,
    hasImages: true,
    wikipediaTitle: 'New_Horizons',
    description: 'The spacecraft that performed the first flyby of Pluto and Arrokoth.',
  },
  {
    name: 'Cassini',
    category: 'SPACECRAFT',
    discoveryYear: 1997,
    hasImages: true,
    wikipediaTitle: 'Cassini–Huygens',
    description: 'A spacecraft that studied Saturn and its moons for 13 years.',
  },
  {
    name: 'Juno',
    category: 'SPACECRAFT',
    discoveryYear: 2011,
    hasActiveMission: true,
    hasImages: true,
    wikipediaTitle: 'Juno_(spacecraft)',
    description: "A spacecraft orbiting Jupiter, studying its atmosphere and magnetic field.",
  },
  {
    name: 'Parker Solar Probe',
    category: 'SPACECRAFT',
    discoveryYear: 2018,
    hasActiveMission: true,
    hasImages: true,
    wikipediaTitle: 'Parker_Solar_Probe',
    description: "The closest human-made object to the Sun, touching the solar corona.",
  },
  {
    name: 'Kepler',
    category: 'SPACECRAFT',
    discoveryYear: 2009,
    hasImages: true,
    wikipediaTitle: 'Kepler_space_telescope',
    description: 'A space telescope that discovered thousands of exoplanets using the transit method.',
  },
  {
    name: 'TESS',
    category: 'SPACECRAFT',
    discoveryYear: 2018,
    hasActiveMission: true,
    hasImages: true,
    wikipediaTitle: 'Transiting_Exoplanet_Survey_Satellite',
    description: "NASA's current exoplanet hunting mission, surveying the entire sky.",
  },
  {
    name: 'Mars Reconnaissance Orbiter',
    category: 'SPACECRAFT',
    discoveryYear: 2005,
    hasActiveMission: true,
    hasImages: true,
    wikipediaTitle: 'Mars_Reconnaissance_Orbiter',
    description: "A multipurpose spacecraft designed to study Mars' surface and climate.",
  },
  {
    name: 'Pioneer 10',
    category: 'SPACECRAFT',
    discoveryYear: 1972,
    hasImages: true,
    wikipediaTitle: 'Pioneer_10',
    description: 'The first spacecraft to travel through the asteroid belt and make direct observations of Jupiter.',
  },
];

// ============================================================
// FAMOUS STARS (check if exist, add if not)
// ============================================================

const FAMOUS_STARS: ObjectToImport[] = [
  {
    name: 'Proxima Centauri',
    category: 'STAR',
    distanceLy: 4.24,
    apparentMagnitude: 11.1,
    spectralType: 'M5.5V',
    hasImages: true,
    wikipediaTitle: 'Proxima_Centauri',
    description: 'The closest known star to the Sun, a red dwarf with at least one exoplanet.',
  },
  {
    name: 'Alpha Centauri A',
    category: 'STAR',
    distanceLy: 4.37,
    apparentMagnitude: -0.01,
    spectralType: 'G2V',
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Alpha_Centauri',
    description: 'The primary star of the Alpha Centauri system, similar to our Sun.',
  },
  {
    name: 'Alpha Centauri B',
    category: 'STAR',
    distanceLy: 4.37,
    apparentMagnitude: 1.33,
    spectralType: 'K1V',
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Alpha_Centauri',
    description: 'The secondary star of the Alpha Centauri system.',
  },
  {
    name: "Barnard's Star",
    category: 'STAR',
    distanceLy: 5.96,
    apparentMagnitude: 9.5,
    spectralType: 'M4V',
    hasImages: true,
    wikipediaTitle: "Barnard's_Star",
    description: 'A red dwarf with the highest known proper motion of any star.',
  },
  {
    name: 'Vega',
    category: 'STAR',
    distanceLy: 25.0,
    apparentMagnitude: 0.03,
    spectralType: 'A0V',
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Vega',
    description: 'The brightest star in Lyra, once the northern pole star.',
  },
  {
    name: 'Arcturus',
    category: 'STAR',
    distanceLy: 36.7,
    apparentMagnitude: -0.05,
    spectralType: 'K1.5III',
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Arcturus',
    description: 'The brightest star in Boötes and the fourth-brightest in the night sky.',
  },
  {
    name: 'Canopus',
    category: 'STAR',
    distanceLy: 310,
    apparentMagnitude: -0.72,
    spectralType: 'A9II',
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Canopus',
    description: 'The second-brightest star in the night sky, a white giant.',
  },
  {
    name: 'Rigel',
    category: 'STAR',
    distanceLy: 860,
    apparentMagnitude: 0.13,
    spectralType: 'B8Ia',
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Rigel',
    description: 'A blue supergiant in Orion, one of the most luminous stars in our galaxy.',
  },
  {
    name: 'Aldebaran',
    category: 'STAR',
    distanceLy: 65,
    apparentMagnitude: 0.85,
    spectralType: 'K5III',
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Aldebaran',
    description: 'An orange giant star, the brightest in Taurus and the eye of the bull.',
  },
  {
    name: 'Antares',
    category: 'STAR',
    distanceLy: 550,
    apparentMagnitude: 1.06,
    spectralType: 'M1Ib',
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Antares',
    description: "A red supergiant in Scorpius, the 'rival of Mars' due to its red color.",
  },
  {
    name: 'Spica',
    category: 'STAR',
    distanceLy: 250,
    apparentMagnitude: 0.97,
    spectralType: 'B1V',
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Spica',
    description: 'A binary star system, the brightest in Virgo.',
  },
  {
    name: 'Deneb',
    category: 'STAR',
    distanceLy: 2600,
    apparentMagnitude: 1.25,
    spectralType: 'A2Ia',
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Deneb',
    description: 'A blue-white supergiant, one of the most luminous stars known.',
  },
  {
    name: 'Altair',
    category: 'STAR',
    distanceLy: 16.7,
    apparentMagnitude: 0.76,
    spectralType: 'A7V',
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Altair',
    description: 'The brightest star in Aquila, notable for its rapid rotation.',
  },
  {
    name: 'Fomalhaut',
    category: 'STAR',
    distanceLy: 25.1,
    apparentMagnitude: 1.16,
    spectralType: 'A4V',
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Fomalhaut',
    description: 'A bright star with a prominent debris disk, known to host exoplanets.',
  },
  {
    name: 'Eta Carinae',
    category: 'STAR',
    distanceLy: 7500,
    apparentMagnitude: 4.3,
    spectralType: 'LBV',
    hasImages: true,
    wikipediaTitle: 'Eta_Carinae',
    description: 'A massive unstable star system expected to explode as a supernova.',
  },
  {
    name: 'R136a1',
    category: 'STAR',
    distanceLy: 163000,
    apparentMagnitude: 12.8,
    spectralType: 'WN5h',
    hasImages: true,
    wikipediaTitle: 'R136a1',
    description: 'One of the most massive and luminous stars known, in the Tarantula Nebula.',
  },
  {
    name: 'UY Scuti',
    category: 'STAR',
    distanceLy: 9500,
    apparentMagnitude: 11.2,
    spectralType: 'M4Ia',
    hasImages: true,
    wikipediaTitle: 'UY_Scuti',
    description: 'One of the largest known stars by radius, a red supergiant.',
  },
];

// ============================================================
// FAMOUS NEBULAE
// ============================================================

const FAMOUS_NEBULAE: ObjectToImport[] = [
  {
    name: 'Orion Nebula',
    category: 'NEBULA',
    distanceLy: 1344,
    apparentMagnitude: 4.0,
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Orion_Nebula',
    description: 'The closest region of massive star formation to Earth.',
  },
  {
    name: 'Crab Nebula',
    category: 'SUPERNOVA_REMNANT',
    distanceLy: 6500,
    apparentMagnitude: 8.4,
    discoveryYear: 1054, // Supernova observed
    hasImages: true,
    wikipediaTitle: 'Crab_Nebula',
    description: 'The remnant of a supernova observed in 1054 AD, containing a pulsar.',
  },
  {
    name: 'Horsehead Nebula',
    category: 'NEBULA',
    distanceLy: 1500,
    hasImages: true,
    wikipediaTitle: 'Horsehead_Nebula',
    description: 'A dark nebula in Orion, famous for its distinctive horse-head shape.',
  },
  {
    name: 'Pillars of Creation',
    category: 'NEBULA',
    distanceLy: 6500,
    hasImages: true,
    wikipediaTitle: 'Pillars_of_Creation',
    description: 'Iconic elephant trunk formations in the Eagle Nebula.',
  },
  {
    name: 'Eagle Nebula',
    category: 'NEBULA',
    distanceLy: 6500,
    apparentMagnitude: 6.0,
    hasImages: true,
    wikipediaTitle: 'Eagle_Nebula',
    description: 'An emission nebula containing the famous Pillars of Creation.',
  },
  {
    name: 'Helix Nebula',
    category: 'NEBULA',
    distanceLy: 655,
    apparentMagnitude: 7.6,
    hasImages: true,
    wikipediaTitle: 'Helix_Nebula',
    description: "One of the closest planetary nebulae, known as the 'Eye of God'.",
  },
  {
    name: 'Ring Nebula',
    category: 'NEBULA',
    distanceLy: 2567,
    apparentMagnitude: 8.8,
    hasImages: true,
    wikipediaTitle: 'Ring_Nebula',
    description: 'A planetary nebula in Lyra, famous for its ring-like structure.',
  },
  {
    name: "Cat's Eye Nebula",
    category: 'NEBULA',
    distanceLy: 3300,
    apparentMagnitude: 9.8,
    hasImages: true,
    wikipediaTitle: "Cat's_Eye_Nebula",
    description: 'A structurally complex planetary nebula with intricate patterns.',
  },
  {
    name: 'Lagoon Nebula',
    category: 'NEBULA',
    distanceLy: 4100,
    apparentMagnitude: 6.0,
    hasImages: true,
    wikipediaTitle: 'Lagoon_Nebula',
    description: 'A giant interstellar cloud visible to the naked eye.',
  },
  {
    name: 'Tarantula Nebula',
    category: 'NEBULA',
    distanceLy: 160000,
    apparentMagnitude: 8.0,
    hasImages: true,
    wikipediaTitle: 'Tarantula_Nebula',
    description: 'The most active star-forming region in the Local Group.',
  },
  {
    name: 'Carina Nebula',
    category: 'NEBULA',
    distanceLy: 8500,
    apparentMagnitude: 1.0,
    hasImages: true,
    wikipediaTitle: 'Carina_Nebula',
    description: 'One of the largest nebulae, home to Eta Carinae.',
  },
  {
    name: 'Veil Nebula',
    category: 'SUPERNOVA_REMNANT',
    distanceLy: 2400,
    apparentMagnitude: 7.0,
    hasImages: true,
    wikipediaTitle: 'Veil_Nebula',
    description: 'A cloud of heated ionized gas from an ancient supernova.',
  },
  {
    name: 'Rosette Nebula',
    category: 'NEBULA',
    distanceLy: 5000,
    apparentMagnitude: 9.0,
    hasImages: true,
    wikipediaTitle: 'Rosette_Nebula',
    description: 'A large circular emission nebula resembling a rose.',
  },
];

// ============================================================
// FAMOUS GALAXIES
// ============================================================

const FAMOUS_GALAXIES: ObjectToImport[] = [
  {
    name: 'Andromeda Galaxy',
    category: 'GALAXY',
    distanceLy: 2537000,
    apparentMagnitude: 3.4,
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Andromeda_Galaxy',
    description: 'The nearest major galaxy to the Milky Way, on a collision course with us.',
  },
  {
    name: 'Milky Way',
    category: 'GALAXY',
    distanceLy: 0,
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Milky_Way',
    description: 'Our home galaxy, a barred spiral containing 100-400 billion stars.',
  },
  {
    name: 'Triangulum Galaxy',
    category: 'GALAXY',
    distanceLy: 2730000,
    apparentMagnitude: 5.7,
    hasImages: true,
    wikipediaTitle: 'Triangulum_Galaxy',
    description: 'The third-largest member of the Local Group.',
  },
  {
    name: 'Whirlpool Galaxy',
    category: 'GALAXY',
    distanceLy: 23000000,
    apparentMagnitude: 8.4,
    hasImages: true,
    wikipediaTitle: 'Whirlpool_Galaxy',
    description: 'A classic spiral galaxy interacting with a smaller companion.',
  },
  {
    name: 'Sombrero Galaxy',
    category: 'GALAXY',
    distanceLy: 29000000,
    apparentMagnitude: 8.0,
    hasImages: true,
    wikipediaTitle: 'Sombrero_Galaxy',
    description: 'A galaxy with a prominent dust lane resembling a sombrero hat.',
  },
  {
    name: 'Pinwheel Galaxy',
    category: 'GALAXY',
    distanceLy: 21000000,
    apparentMagnitude: 7.9,
    hasImages: true,
    wikipediaTitle: 'Pinwheel_Galaxy',
    description: 'A face-on spiral galaxy with well-defined spiral arms.',
  },
  {
    name: 'Cartwheel Galaxy',
    category: 'GALAXY',
    distanceLy: 500000000,
    apparentMagnitude: 15.2,
    hasImages: true,
    wikipediaTitle: 'Cartwheel_Galaxy',
    description: 'A lenticular ring galaxy formed by a cosmic collision.',
  },
  {
    name: 'Cigar Galaxy',
    category: 'GALAXY',
    distanceLy: 12000000,
    apparentMagnitude: 8.4,
    hasImages: true,
    wikipediaTitle: 'Messier_82',
    description: 'A starburst galaxy with intense star formation activity.',
  },
  {
    name: 'Large Magellanic Cloud',
    category: 'GALAXY',
    distanceLy: 160000,
    apparentMagnitude: 0.9,
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Large_Magellanic_Cloud',
    description: 'A satellite galaxy of the Milky Way, visible from the southern hemisphere.',
  },
  {
    name: 'Small Magellanic Cloud',
    category: 'GALAXY',
    distanceLy: 200000,
    apparentMagnitude: 2.7,
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: 'Small_Magellanic_Cloud',
    description: 'A dwarf irregular galaxy near the Milky Way.',
  },
  {
    name: 'Centaurus A',
    category: 'GALAXY',
    distanceLy: 13000000,
    apparentMagnitude: 6.8,
    hasImages: true,
    wikipediaTitle: 'Centaurus_A',
    description: 'The fifth-brightest galaxy in the sky, with a prominent dust lane.',
  },
];

// ============================================================
// BLACK HOLES
// ============================================================

const BLACK_HOLES: ObjectToImport[] = [
  {
    name: 'Sagittarius A*',
    category: 'BLACK_HOLE',
    distanceLy: 26000,
    discoveryYear: 1974,
    hasImages: true,
    wikipediaTitle: 'Sagittarius_A*',
    description: 'The supermassive black hole at the center of the Milky Way.',
  },
  {
    name: 'M87*',
    category: 'BLACK_HOLE',
    distanceLy: 55000000,
    discoveryYear: 2019, // First image
    hasImages: true,
    wikipediaTitle: 'Messier_87#Supermassive_black_hole_M87*',
    description: 'The first black hole ever photographed, in the galaxy M87.',
  },
  {
    name: 'Cygnus X-1',
    category: 'BLACK_HOLE',
    distanceLy: 6100,
    discoveryYear: 1964,
    hasImages: true,
    wikipediaTitle: 'Cygnus_X-1',
    description: 'The first widely accepted black hole candidate.',
  },
  {
    name: 'TON 618',
    category: 'BLACK_HOLE',
    distanceLy: 10000000000,
    discoveryYear: 1957,
    hasImages: true,
    wikipediaTitle: 'TON_618',
    description: 'One of the most massive black holes ever discovered.',
  },
  {
    name: 'V404 Cygni',
    category: 'BLACK_HOLE',
    distanceLy: 7800,
    discoveryYear: 1989,
    hasImages: true,
    wikipediaTitle: 'V404_Cygni',
    description: 'A binary system containing one of the closest known black holes.',
  },
];

// ============================================================
// FAMOUS COMETS
// ============================================================

const FAMOUS_COMETS: ObjectToImport[] = [
  {
    name: "Halley's Comet",
    category: 'COMET',
    namedByAncients: true,
    hasImages: true,
    wikipediaTitle: "Halley's_Comet",
    description: 'The most famous periodic comet, visible from Earth every 75-79 years.',
  },
  {
    name: 'Hale-Bopp',
    category: 'COMET',
    discoveryYear: 1995,
    hasImages: true,
    wikipediaTitle: 'Comet_Hale–Bopp',
    description: 'One of the most widely observed comets of the 20th century.',
  },
  {
    name: 'Comet NEOWISE',
    category: 'COMET',
    discoveryYear: 2020,
    hasImages: true,
    wikipediaTitle: 'C/2020_F3_(NEOWISE)',
    description: 'A bright comet visible to the naked eye in 2020.',
  },
  {
    name: 'Shoemaker-Levy 9',
    category: 'COMET',
    discoveryYear: 1993,
    hasImages: true,
    wikipediaTitle: 'Comet_Shoemaker–Levy_9',
    description: 'A comet that broke apart and collided with Jupiter in 1994.',
  },
  {
    name: '67P/Churyumov-Gerasimenko',
    category: 'COMET',
    discoveryYear: 1969,
    hasActiveMission: true, // Rosetta landed on it
    hasImages: true,
    wikipediaTitle: '67P/Churyumov–Gerasimenko',
    description: 'The comet visited by the Rosetta spacecraft and Philae lander.',
  },
];

// ============================================================
// COSMIC FEATURES
// ============================================================

const COSMIC_FEATURES: ObjectToImport[] = [
  {
    name: 'Milky Way Center',
    category: 'COSMIC_FEATURE',
    distanceLy: 26000,
    hasImages: true,
    wikipediaTitle: 'Galactic_Center',
    description: "The central region of our galaxy, home to Sagittarius A*.",
  },
  {
    name: 'Asteroid Belt',
    category: 'COSMIC_FEATURE',
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Asteroid_belt',
    description: 'The region between Mars and Jupiter containing numerous asteroids.',
  },
  {
    name: 'Kuiper Belt',
    category: 'COSMIC_FEATURE',
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Kuiper_belt',
    description: 'A region of icy bodies beyond Neptune, including Pluto.',
  },
  {
    name: 'Oort Cloud',
    category: 'COSMIC_FEATURE',
    isInSolarSystem: true,
    wikipediaTitle: 'Oort_cloud',
    description: 'A theoretical spherical cloud of icy objects surrounding the Solar System.',
  },
  {
    name: 'Great Red Spot',
    category: 'COSMIC_FEATURE',
    isInSolarSystem: true,
    namedByAncients: true, // Observed since 1600s
    hasImages: true,
    wikipediaTitle: 'Great_Red_Spot',
    description: "Jupiter's iconic storm, larger than Earth, raging for centuries.",
  },
  {
    name: "Saturn's Rings",
    category: 'COSMIC_FEATURE',
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Rings_of_Saturn',
    description: 'The most extensive and visible ring system in the Solar System.',
  },
  {
    name: 'Olympus Mons',
    category: 'COSMIC_FEATURE',
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Olympus_Mons',
    description: 'The tallest planetary mountain in the Solar System, on Mars.',
  },
  {
    name: 'Valles Marineris',
    category: 'COSMIC_FEATURE',
    isInSolarSystem: true,
    hasImages: true,
    wikipediaTitle: 'Valles_Marineris',
    description: 'The largest canyon system in the Solar System, on Mars.',
  },
  {
    name: 'Local Group',
    category: 'COSMIC_FEATURE',
    hasImages: true,
    wikipediaTitle: 'Local_Group',
    description: 'The galaxy group containing the Milky Way and Andromeda.',
  },
  {
    name: 'Laniakea Supercluster',
    category: 'COSMIC_FEATURE',
    hasImages: true,
    wikipediaTitle: 'Laniakea_Supercluster',
    description: 'The supercluster that contains our galaxy and thousands of others.',
  },
];

// ============================================================
// COMBINE ALL OBJECTS
// ============================================================

const ALL_OBJECTS_TO_IMPORT: ObjectToImport[] = [
  ...PLANETS,
  ...SUN_AND_MOON,
  ...MAJOR_MOONS,
  ...DWARF_PLANETS,
  ...SPACECRAFT,
  ...FAMOUS_STARS,
  ...FAMOUS_NEBULAE,
  ...FAMOUS_GALAXIES,
  ...BLACK_HOLES,
  ...FAMOUS_COMETS,
  ...COSMIC_FEATURES,
];

// ============================================================
// IMPORT FUNCTIONS
// ============================================================

async function getNextTokenId(): Promise<number> {
  const maxToken = await prisma.nFT.aggregate({
    _max: { tokenId: true },
  });
  return (maxToken._max.tokenId || 0) + 1;
}

async function importObject(
  obj: ObjectToImport,
  nextTokenId: number,
  dryRun: boolean
): Promise<{ action: 'created' | 'updated' | 'skipped'; name: string }> {
  // Check if object exists
  const existing = await prisma.nFT.findFirst({
    where: {
      name: {
        equals: obj.name,
        mode: 'insensitive',
      },
    },
  });

  const updateData = {
    objectCategory: obj.category,
    distanceLy: obj.distanceLy ?? null,
    apparentMagnitude: obj.apparentMagnitude ?? null,
    spectralType: obj.spectralType ?? null,
    discoveryYear: obj.discoveryYear ?? null,
    namedByAncients: obj.namedByAncients ?? false,
    isInSolarSystem: obj.isInSolarSystem ?? false,
    hasActiveMission: obj.hasActiveMission ?? false,
    plannedMission: obj.plannedMission ?? false,
    isHabitable: obj.isHabitable ?? false,
    hasImages: obj.hasImages ?? false,
    description: obj.description ?? null,
    // DO NOT SET: totalScore, culturalSignificance, etc.
    // These will be calculated by the scoring algorithm
  };

  if (existing) {
    if (!dryRun) {
      await prisma.nFT.update({
        where: { id: existing.id },
        data: updateData,
      });
    }
    return { action: 'updated', name: obj.name };
  } else {
    if (!dryRun) {
      await prisma.nFT.create({
        data: {
          name: obj.name,
          tokenId: nextTokenId,
          ...updateData,
          // Scoring fields default to 0, will be calculated
          totalScore: 0,
          culturalSignificance: 0,
          scientificImportance: 0,
          historicalSignificance: 0,
          visualImpact: 0,
          uniqueness: 0,
          accessibility: 0,
          proximity: 0,
          storyFactor: 0,
          activeRelevance: 0,
          futurePotential: 0,
        },
      });
    }
    return { action: 'created', name: obj.name };
  }
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('=== Import Missing Objects ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Objects to import: ${ALL_OBJECTS_TO_IMPORT.length}`);
  console.log('');
  console.log('CRITICAL: Scores will be calculated by the scoring algorithm.');
  console.log('This script only provides scientific DATA, not SCORES.');
  console.log('');

  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  const categories: Record<string, number> = {};
  let nextTokenId = await getNextTokenId();

  // Group by category for reporting
  for (const obj of ALL_OBJECTS_TO_IMPORT) {
    categories[obj.category] = (categories[obj.category] || 0) + 1;
  }

  console.log('Objects by category:');
  for (const [cat, count] of Object.entries(categories)) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log('');

  // Import objects
  for (const obj of ALL_OBJECTS_TO_IMPORT) {
    try {
      const result = await importObject(obj, nextTokenId, dryRun);

      if (result.action === 'created') {
        results.created++;
        nextTokenId++;
        console.log(`  ✓ Created: ${result.name}`);
      } else if (result.action === 'updated') {
        results.updated++;
        console.log(`  ↻ Updated: ${result.name}`);
      } else {
        results.skipped++;
      }
    } catch (error) {
      results.errors++;
      console.error(`  ✗ Error importing ${obj.name}:`, error);
    }
  }

  console.log('');
  console.log('=== Summary ===');
  console.log(`Created: ${results.created}`);
  console.log(`Updated: ${results.updated}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Errors: ${results.errors}`);

  if (dryRun) {
    console.log('');
    console.log('DRY RUN - No changes were made to the database.');
  } else {
    console.log('');
    console.log('NEXT STEPS:');
    console.log('1. Run data collection: npx tsx scripts/collect-scientific-data.ts');
    console.log('2. Recalculate scores: npx tsx scripts/recalculate-scores.ts --assign-tiers');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
