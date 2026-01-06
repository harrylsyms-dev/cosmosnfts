// Image Generation Prompt Templates
// Based on tested Leonardo AI prompt strategies for consistent, photorealistic space imagery

// ============================================
// COLOR LOOKUP TABLES
// ============================================

// Star colors by spectral type (first letter) - concise for prompt composition
export const STAR_COLORS: Record<string, string> = {
  'O': 'intense blue-white',
  'B': 'blue-white',
  'A': 'white-blue',
  'F': 'pale yellow-white',
  'G': 'yellow-orange',
  'K': 'orange',
  'M': 'deep red-crimson',
  'L': 'dark red-brown',
  'T': 'magenta-brown',
  'Y': 'dark brown',
  // Default
  'default': 'orange-yellow',
};

// Get color from spectral type
export function getStarColor(spectralType?: string): string {
  if (!spectralType) return STAR_COLORS['default'];
  const firstLetter = spectralType.charAt(0).toUpperCase();
  return STAR_COLORS[firstLetter] || STAR_COLORS['default'];
}

// ============================================
// STAR-SPECIFIC CHARACTERISTICS (Based on Jan 2026 Optimization Report)
// ============================================

// Temperature descriptions by spectral type
export function getStarTemperatureDesc(spectralType?: string): string {
  if (!spectralType) return '';
  const firstLetter = spectralType.charAt(0).toUpperCase();
  switch (firstLetter) {
    case 'O':
    case 'B':
    case 'A':
      return 'hot';
    case 'F':
    case 'G':
      return 'warm';
    case 'K':
    case 'M':
    case 'L':
    case 'T':
    case 'Y':
      return ''; // Don't say "hot" for cool stars - say nothing
    default:
      return '';
  }
}

// Granulation type by spectral type
export function getStarGranulationType(spectralType?: string, luminosityClass?: string): string {
  if (!spectralType) return 'visible';
  const firstLetter = spectralType.charAt(0).toUpperCase();
  const isSupergiant = luminosityClass?.includes('I') && !luminosityClass?.includes('V');

  // Supergiants have giant convection cells
  if (isSupergiant) return 'giant coarse mottled';

  switch (firstLetter) {
    case 'O':
    case 'B':
    case 'A':
      return 'fine subtle'; // Hot stars have smaller convection cells
    case 'F':
    case 'G':
      return 'visible clear'; // Sun-like granulation
    case 'K':
    case 'M':
      return 'prominent'; // Cooler stars have more visible granulation
    default:
      return 'visible';
  }
}

// Starspot description by spectral type and activity
export function getStarspotDesc(spectralType?: string, isFlare?: boolean): string {
  if (!spectralType) return 'scattered dark starspots';
  const firstLetter = spectralType.charAt(0).toUpperCase();

  // M-type red dwarfs (especially flare stars) have huge starspots
  if (firstLetter === 'M' || isFlare) {
    return 'large dark starspot groups covering significant surface area';
  }

  switch (firstLetter) {
    case 'O':
    case 'B':
    case 'A':
      return 'few small starspots'; // Hot stars are relatively calm
    case 'F':
    case 'G':
      return 'scattered dark starspots';
    case 'K':
      return 'moderate dark starspot activity';
    default:
      return 'scattered dark starspots';
  }
}

// Prominence description by spectral type
export function getProminenceDesc(spectralType?: string, isFlare?: boolean, isSupergiant?: boolean): string {
  if (isFlare) {
    return 'extensive magnetic loop prominences erupting from limb, violent surface activity';
  }
  if (isSupergiant) {
    return 'dramatic magnetic prominences, faint dusty envelope from mass loss visible at limb';
  }
  if (!spectralType) return 'magnetic prominences at limb';

  const firstLetter = spectralType.charAt(0).toUpperCase();
  switch (firstLetter) {
    case 'O':
    case 'B':
      return 'intense stellar wind creating subtle haze at limb, magnetic prominences';
    case 'A':
      return 'delicate wispy magnetic prominences at limb';
    case 'F':
    case 'G':
      return 'moderate magnetic prominences at limb';
    case 'K':
    case 'M':
      return 'prominent magnetic loop prominences';
    default:
      return 'magnetic prominences at limb';
  }
}

// Primary color by spectral type
export function getStarPrimaryColor(spectralType?: string): string {
  if (!spectralType) return 'orange-yellow';
  const firstLetter = spectralType.charAt(0).toUpperCase();
  switch (firstLetter) {
    case 'O': return 'intense blue-white';
    case 'B': return 'blue-white with subtle violet undertones';
    case 'A': return 'brilliant white';
    case 'F': return 'warm cream-white';
    case 'G': return 'golden-yellow';
    case 'K': return 'warm orange';
    case 'M': return 'deep scarlet-orange';
    default: return 'orange-yellow';
  }
}

// Limb color by spectral type
export function getStarLimbColor(spectralType?: string): string {
  if (!spectralType) return 'orange';
  const firstLetter = spectralType.charAt(0).toUpperCase();
  switch (firstLetter) {
    case 'O': return 'blue';
    case 'B': return 'blue-violet';
    case 'A': return 'ice-blue';
    case 'F': return 'pale golden-yellow';
    case 'G': return 'amber';
    case 'K': return 'deep orange';
    case 'M': return 'rust-crimson';
    default: return 'orange';
  }
}

// Accent colors by spectral type
export function getStarAccentColor(spectralType?: string): string {
  if (!spectralType) return 'orange granulation hints';
  const firstLetter = spectralType.charAt(0).toUpperCase();
  switch (firstLetter) {
    case 'O':
    case 'B': return 'orange-gold magnetic active regions contrasting against blue disk';
    case 'A': return 'faint orange-copper hints in rare active regions';
    case 'F': return 'orange granulation cells, bright white active regions';
    case 'G': return 'orange granulation hints, bright plage regions';
    case 'K': return 'darker rust-brown granulation boundaries';
    case 'M': return 'darker rust-brown convection cell boundaries, bright orange-yellow hot spots';
    default: return 'orange granulation hints';
  }
}

// Frame fill percentage by star type
export function getStarFrameFill(spectralType?: string, isSupergiant?: boolean): number {
  if (isSupergiant) return 80; // Show more detail on supergiants
  if (!spectralType) return 75;
  const firstLetter = spectralType.charAt(0).toUpperCase();
  switch (firstLetter) {
    case 'O':
    case 'B':
    case 'A':
      return 70; // Hot stars - slightly less fill
    case 'F':
    case 'G':
    case 'K':
      return 75;
    case 'M':
      return 75; // Red dwarfs - show activity
    default:
      return 75;
  }
}

// Wavelength by spectral type
export function getStarWavelength(spectralType?: string): string {
  if (!spectralType) return 'visible';
  const firstLetter = spectralType.charAt(0).toUpperCase();
  switch (firstLetter) {
    case 'O':
    case 'B':
    case 'A':
      return 'ultraviolet';
    case 'F':
    case 'G':
      return 'visible';
    case 'K':
    case 'M':
    case 'L':
    case 'T':
    case 'Y':
      return 'infrared';
    default:
      return 'visible';
  }
}

// ============================================
// NEBULA-SPECIFIC CHARACTERISTICS (Based on Jan 2026 Optimization Report)
// ============================================

// Famous nebula features - specific structures that make each nebula unique
export const FAMOUS_NEBULA_FEATURES: Record<string, {
  specificFeatures: string;
  colorNotes?: string;
  structureType?: string;
}> = {
  // Emission Nebulae
  'orion': {
    specificFeatures: 'Trapezium star cluster illuminating central cavity, M43 companion nebula, dark Horsehead silhouette region nearby',
    colorNotes: 'Red hydrogen-alpha dominant, blue reflection regions, golden ionization fronts',
    structureType: 'star-forming region with dense cloud pillars',
  },
  'eagle': {
    specificFeatures: 'iconic Pillars of Creation - three towering dark dust columns backlit by stellar radiation, evaporating gaseous globules (EGGs)',
    colorNotes: 'Red hydrogen emission, blue oxygen III, dark silhouetted pillars against glowing background',
    structureType: 'star-forming pillars with sculpted edges',
  },
  'm16': { // Eagle Nebula alternate name
    specificFeatures: 'iconic Pillars of Creation - three towering dark dust columns backlit by stellar radiation, evaporating gaseous globules (EGGs)',
    colorNotes: 'Red hydrogen emission, blue oxygen III, dark silhouetted pillars against glowing background',
    structureType: 'star-forming pillars with sculpted edges',
  },
  'lagoon': {
    specificFeatures: 'Hourglass region near center with intense star formation, dark Bok globules, bright rimmed clouds',
    colorNotes: 'Pink-red hydrogen dominant, blue reflection nebulosity around hot stars',
    structureType: 'large emission complex with dark lanes',
  },
  'm8': { // Lagoon alternate name
    specificFeatures: 'Hourglass region near center with intense star formation, dark Bok globules, bright rimmed clouds',
    colorNotes: 'Pink-red hydrogen dominant, blue reflection nebulosity around hot stars',
    structureType: 'large emission complex with dark lanes',
  },
  'trifid': {
    specificFeatures: 'three distinct lobes divided by dark dust lanes, blue reflection region adjacent to red emission region',
    colorNotes: 'Red emission section, blue reflection section, dark trisecting dust lanes',
    structureType: 'tri-lobed structure bisected by dust',
  },
  'm20': { // Trifid alternate name
    specificFeatures: 'three distinct lobes divided by dark dust lanes, blue reflection region adjacent to red emission region',
    colorNotes: 'Red emission section, blue reflection section, dark trisecting dust lanes',
    structureType: 'tri-lobed structure bisected by dust',
  },
  'carina': {
    specificFeatures: 'Mystic Mountain pillar, Keyhole dark region, Eta Carinae hypergiant at center, dramatic sculpted edges',
    colorNotes: 'Intense red-orange hydrogen, deep blue oxygen regions, dramatic dark silhouettes',
    structureType: 'massive star-forming complex with extreme radiation sculpting',
  },
  'rosette': {
    specificFeatures: 'circular ring structure around central star cluster NGC 2244, radial dark globules pointing inward',
    colorNotes: 'Deep red hydrogen ring, central blue star cluster, dark cometary globules',
    structureType: 'circular shell around open cluster',
  },

  // Planetary Nebulae
  'ring': {
    specificFeatures: 'distinct torus ring structure, faint outer halo, bright central white dwarf star, inner blue-green core',
    colorNotes: 'Green-blue oxygen core, red outer hydrogen ring, white central star',
    structureType: 'barrel/ring shape viewed face-on',
  },
  'm57': { // Ring Nebula alternate name
    specificFeatures: 'distinct torus ring structure, faint outer halo, bright central white dwarf star, inner blue-green core',
    colorNotes: 'Green-blue oxygen core, red outer hydrogen ring, white central star',
    structureType: 'barrel/ring shape viewed face-on',
  },
  'helix': {
    specificFeatures: 'large apparent size, cometary knots with tails pointing away from center, inner disk structure, red outer ring',
    colorNotes: 'Blue-green inner region, red outer ring, thousands of cometary knots',
    structureType: 'double helix structure viewed face-on',
  },
  'ngc 7293': { // Helix alternate name
    specificFeatures: 'large apparent size, cometary knots with tails pointing away from center, inner disk structure, red outer ring',
    colorNotes: 'Blue-green inner region, red outer ring, thousands of cometary knots',
    structureType: 'double helix structure viewed face-on',
  },
  'dumbbell': {
    specificFeatures: 'distinctive apple-core or hourglass shape, two bright lobes connected by fainter waist',
    colorNotes: 'Green-cyan oxygen dominant, red hydrogen outer regions',
    structureType: 'bipolar hourglass shape',
  },
  'm27': { // Dumbbell alternate name
    specificFeatures: 'distinctive apple-core or hourglass shape, two bright lobes connected by fainter waist',
    colorNotes: 'Green-cyan oxygen dominant, red hydrogen outer regions',
    structureType: 'bipolar hourglass shape',
  },
  'cat\'s eye': {
    specificFeatures: 'complex nested shells, multiple concentric rings, intricate central structure with jets',
    colorNotes: 'Blue-green oxygen core, red outer halos, complex multi-shell structure',
    structureType: 'multi-shell with bilateral symmetry',
  },
  'ngc 6543': { // Cat's Eye alternate name
    specificFeatures: 'complex nested shells, multiple concentric rings, intricate central structure with jets',
    colorNotes: 'Blue-green oxygen core, red outer halos, complex multi-shell structure',
    structureType: 'multi-shell with bilateral symmetry',
  },
  'owl': {
    specificFeatures: 'two dark circular regions resembling eyes within bright nebula, faint outer halo',
    colorNotes: 'Green-blue overall with dark "eye" regions',
    structureType: 'circular with two dark cavities',
  },
  'm97': { // Owl alternate name
    specificFeatures: 'two dark circular regions resembling eyes within bright nebula, faint outer halo',
    colorNotes: 'Green-blue overall with dark "eye" regions',
    structureType: 'circular with two dark cavities',
  },

  // Supernova Remnants
  'crab': {
    specificFeatures: 'central pulsar, complex filamentary structure, synchrotron nebula, expanding debris cloud',
    colorNotes: 'Blue synchrotron core, red filamentary outer shell, green oxygen filaments',
    structureType: 'chaotic expanding filamentary shell',
  },
  'm1': { // Crab alternate name
    specificFeatures: 'central pulsar, complex filamentary structure, synchrotron nebula, expanding debris cloud',
    colorNotes: 'Blue synchrotron core, red filamentary outer shell, green oxygen filaments',
    structureType: 'chaotic expanding filamentary shell',
  },
  'veil': {
    specificFeatures: 'delicate arc of shocked gas filaments, part of larger Cygnus Loop, intricate lacework structure',
    colorNotes: 'Red hydrogen, blue oxygen, green sulfur in separate filament regions',
    structureType: 'arc segment of spherical shell',
  },
  'cassiopeia a': {
    specificFeatures: 'young remnant with bright knots, visible neutron star, fast-moving debris clumps',
    colorNotes: 'Multi-colored with distinct element regions - iron, silicon, sulfur in different colors',
    structureType: 'roughly spherical expanding shell',
  },
  'cas a': { // Cassiopeia A alternate name
    specificFeatures: 'young remnant with bright knots, visible neutron star, fast-moving debris clumps',
    colorNotes: 'Multi-colored with distinct element regions - iron, silicon, sulfur in different colors',
    structureType: 'roughly spherical expanding shell',
  },
};

// Get nebula-specific features based on name matching
export function getNebulaSpecificFeatures(name: string): {
  specificFeatures: string;
  colorNotes?: string;
  structureType?: string;
} | null {
  const lowerName = name.toLowerCase();

  // Check each known nebula
  for (const [key, features] of Object.entries(FAMOUS_NEBULA_FEATURES)) {
    if (lowerName.includes(key)) {
      return features;
    }
  }

  return null;
}

// ============================================
// BLACK HOLE-SPECIFIC CHARACTERISTICS (Based on Jan 2026 Optimization Report)
// ============================================

// Famous dwarf planet features - specific characteristics for known dwarf planets
export const FAMOUS_DWARF_PLANET_FEATURES: Record<string, {
  specificFeatures: string;
  colorNotes?: string;
  surfaceFeatures?: string;
}> = {
  'pluto': {
    specificFeatures: 'heart-shaped nitrogen ice plain (Tombaugh Regio), Sputnik Planitia glacier, rugged water-ice mountains',
    colorNotes: 'Reddish-brown tholins terrain, bright white nitrogen ice heart, tan and gray cratered regions',
    surfaceFeatures: 'Heart-shaped Tombaugh Regio ice plain, reddish-brown tholins, cratered highlands, nitrogen glaciers',
  },
  'eris': {
    specificFeatures: 'highly reflective icy surface, possible methane frost, distant scattered disk object',
    colorNotes: 'Bright white-gray icy surface, possible slight reddish tinge from tholins',
    surfaceFeatures: 'Smooth highly reflective ice surface, possible frost deposits',
  },
  'makemake': {
    specificFeatures: 'reddish-brown surface with bright patches, possible nitrogen ice',
    colorNotes: 'Reddish-brown surface with bright white patches',
    surfaceFeatures: 'Reddish-brown terrain with bright ice patches',
  },
  'haumea': {
    specificFeatures: 'elongated ellipsoid shape from rapid rotation, dark red spot, two small moons',
    colorNotes: 'Bright icy surface with dark reddish spot',
    surfaceFeatures: 'Elongated shape, bright ice with dark red region',
  },
  'ceres': {
    specificFeatures: 'Occator crater with bright salt deposits, Ahuna Mons cryovolcano',
    colorNotes: 'Dark gray rocky surface with bright white salt deposits',
    surfaceFeatures: 'Heavily cratered surface, bright salt deposits in Occator crater, cryovolcanic mountain',
  },
};

// Get dwarf planet-specific features based on name matching
export function getDwarfPlanetSpecificFeatures(name: string): {
  specificFeatures: string;
  colorNotes?: string;
  surfaceFeatures?: string;
} | null {
  const lowerName = name.toLowerCase();

  for (const [key, features] of Object.entries(FAMOUS_DWARF_PLANET_FEATURES)) {
    if (lowerName.includes(key)) {
      return features;
    }
  }

  return null;
}

// Famous black hole features - specific characteristics for known black holes
export const FAMOUS_BLACK_HOLE_FEATURES: Record<string, {
  specificFeatures: string;
  colorNotes?: string;
  size?: string;
}> = {
  'sagittarius a': {
    specificFeatures: 'Milky Way galactic center supermassive black hole, compact photon ring, dynamic accretion flow with hot spots, 4 million solar masses',
    colorNotes: 'Orange-red hot accretion plasma, bright photon ring, variable brightness hot spots',
    size: 'supermassive',
  },
  'sgr a': { // Common abbreviation
    specificFeatures: 'Milky Way galactic center supermassive black hole, compact photon ring, dynamic accretion flow with hot spots, 4 million solar masses',
    colorNotes: 'Orange-red hot accretion plasma, bright photon ring, variable brightness hot spots',
    size: 'supermassive',
  },
  'm87': {
    specificFeatures: 'giant elliptical galaxy center black hole, prominent relativistic jet extending thousands of light years, 6.5 billion solar masses, asymmetric bright ring',
    colorNotes: 'Orange-yellow ring with distinct brightness asymmetry, blue relativistic jet, absolute black shadow',
    size: 'supermassive',
  },
  'cygnus x-1': {
    specificFeatures: 'stellar-mass black hole in binary system, accretion disk fed by blue supergiant companion star, X-ray bright',
    colorNotes: 'Intense blue-white X-ray glow, orange-yellow accretion stream from companion star',
    size: 'stellar-mass',
  },
  'grs 1915': {
    specificFeatures: 'microquasar with superluminal jets, stellar-mass black hole with extreme spin',
    colorNotes: 'Bright accretion disk, twin relativistic jets',
    size: 'stellar-mass',
  },
  'ton 618': {
    specificFeatures: 'ultramassive black hole, one of the most massive known, 66 billion solar masses, extremely luminous quasar nucleus',
    colorNotes: 'Blindingly bright accretion disk, extreme luminosity',
    size: 'ultramassive',
  },
};

// Get black hole-specific features based on name matching
export function getBlackHoleSpecificFeatures(name: string): {
  specificFeatures: string;
  colorNotes?: string;
  size?: string;
} | null {
  const lowerName = name.toLowerCase();

  // Check each known black hole
  for (const [key, features] of Object.entries(FAMOUS_BLACK_HOLE_FEATURES)) {
    if (lowerName.includes(key)) {
      return features;
    }
  }

  return null;
}

// ============================================
// SUBTYPE DERIVATION FUNCTIONS
// ============================================

// Derive star subType from spectral type
export function deriveStarSubType(spectralType?: string, description?: string): string {
  if (!spectralType) return 'star';

  const spectral = spectralType.toUpperCase();
  const firstLetter = spectral.charAt(0);

  // Check luminosity class (Roman numerals in spectral type)
  const hasIa = spectral.includes('IA') || spectral.includes('I-A');
  const hasIb = spectral.includes('IB') || spectral.includes('I-B');
  const hasI = spectral.includes('I') && !spectral.includes('II') && !spectral.includes('III') && !spectral.includes('IV') && !spectral.includes('V');
  const hasII = spectral.includes('II') && !spectral.includes('III');
  const hasIII = spectral.includes('III');
  const hasIV = spectral.includes('IV');
  const hasV = spectral.includes('V');

  // Supergiants (luminosity class I)
  if (hasIa || hasIb || hasI) {
    if (firstLetter === 'O' || firstLetter === 'B') return 'blue supergiant';
    if (firstLetter === 'A' || firstLetter === 'F') return 'yellow-white supergiant';
    if (firstLetter === 'G') return 'yellow supergiant';
    if (firstLetter === 'K') return 'orange supergiant';
    if (firstLetter === 'M') return 'red supergiant';
  }

  // Bright giants (luminosity class II)
  if (hasII) {
    if (firstLetter === 'K' || firstLetter === 'M') return 'red bright giant';
    return 'bright giant';
  }

  // Giants (luminosity class III)
  if (hasIII) {
    if (firstLetter === 'K') return 'orange giant';
    if (firstLetter === 'M') return 'red giant';
    return 'giant star';
  }

  // Subgiants (luminosity class IV)
  if (hasIV) {
    return 'subgiant';
  }

  // Main sequence (luminosity class V)
  if (hasV || (!hasI && !hasII && !hasIII && !hasIV)) {
    if (firstLetter === 'O') return 'blue main-sequence star';
    if (firstLetter === 'B') return 'blue-white main-sequence star';
    if (firstLetter === 'A') return 'white main-sequence star';
    if (firstLetter === 'F') return 'yellow-white main-sequence star';
    if (firstLetter === 'G') return 'yellow main-sequence star';
    if (firstLetter === 'K') return 'orange main-sequence star';
    if (firstLetter === 'M') return 'red dwarf';
    if (firstLetter === 'L' || firstLetter === 'T' || firstLetter === 'Y') return 'brown dwarf';
  }

  // Check description for additional clues
  if (description) {
    const desc = description.toLowerCase();
    if (desc.includes('white dwarf')) return 'white dwarf';
    if (desc.includes('neutron')) return 'neutron star';
    if (desc.includes('pulsar')) return 'pulsar';
    if (desc.includes('supergiant')) {
      if (desc.includes('red')) return 'red supergiant';
      if (desc.includes('blue')) return 'blue supergiant';
      return 'supergiant';
    }
  }

  return 'star';
}

// Derive galaxy type from description or name
export function deriveGalaxyType(name: string, description?: string): string {
  const text = `${name} ${description || ''}`.toLowerCase();

  if (text.includes('barred spiral')) return 'barred spiral';
  if (text.includes('spiral')) return 'spiral';
  if (text.includes('elliptical')) return 'elliptical';
  if (text.includes('irregular')) return 'irregular';
  if (text.includes('lenticular')) return 'lenticular';
  if (text.includes('dwarf')) return 'dwarf irregular';

  // Check for specific galaxies
  if (name.includes('Andromeda') || name.includes('M31')) return 'spiral';
  if (name.includes('Whirlpool') || name.includes('M51')) return 'spiral';
  if (name.includes('Sombrero') || name.includes('M104')) return 'spiral';
  if (name.includes('Triangulum') || name.includes('M33')) return 'spiral';
  if (name.includes('Magellanic')) return 'irregular';

  return 'spiral'; // Default
}

// Derive nebula type from description or name
export function deriveNebulaType(name: string, description?: string, objectType?: string): string {
  if (objectType === 'Supernova Remnant') return 'supernova remnant';

  const text = `${name} ${description || ''}`.toLowerCase();

  if (text.includes('planetary')) return 'planetary';
  if (text.includes('emission')) return 'emission';
  if (text.includes('reflection')) return 'reflection';
  if (text.includes('dark')) return 'dark';
  if (text.includes('supernova') || text.includes('remnant')) return 'supernova remnant';
  if (text.includes('star form') || text.includes('nursery') || text.includes('birth')) return 'emission';

  // Check for specific nebulae
  if (name.includes('Orion')) return 'emission';
  if (name.includes('Ring') || name.includes('M57')) return 'planetary';
  if (name.includes('Helix')) return 'planetary';
  if (name.includes('Dumbbell')) return 'planetary';
  if (name.includes('Crab') || name.includes('M1')) return 'supernova remnant';
  if (name.includes('Eagle') || name.includes('Pillars')) return 'emission';
  if (name.includes('Lagoon')) return 'emission';
  if (name.includes('Trifid')) return 'emission';
  if (name.includes('Pleiades')) return 'reflection';

  return 'emission'; // Default
}

// Derive planet type from description
export function derivePlanetType(name: string, description?: string, mass?: number): string {
  const text = `${name} ${description || ''}`.toLowerCase();

  if (text.includes('gas giant') || text.includes('jupiter')) return 'gas giant';
  if (text.includes('ice giant') || text.includes('neptune') || text.includes('uranus')) return 'ice giant';
  if (text.includes('terrestrial') || text.includes('rocky')) return 'terrestrial';
  if (text.includes('dwarf planet')) return 'dwarf planet';
  if (text.includes('super-earth') || text.includes('super earth')) return 'super-earth';
  if (text.includes('hot jupiter')) return 'hot jupiter';

  // Infer from mass if available (in Earth masses)
  if (mass !== undefined) {
    if (mass > 50) return 'gas giant';
    if (mass > 10) return 'ice giant';
    if (mass > 1.5) return 'super-earth';
    return 'terrestrial';
  }

  return 'terrestrial'; // Default for exoplanets
}

// Derive black hole type from mass
export function deriveBlackHoleType(mass?: number, description?: string): string {
  const text = (description || '').toLowerCase();

  if (text.includes('supermassive')) return 'supermassive';
  if (text.includes('stellar') || text.includes('stellar-mass')) return 'stellar-mass';
  if (text.includes('intermediate')) return 'intermediate-mass';

  // Infer from mass (in solar masses)
  if (mass !== undefined) {
    if (mass > 100000) return 'supermassive';
    if (mass > 100) return 'intermediate-mass';
    return 'stellar-mass';
  }

  return 'supermassive'; // Default
}

// Galaxy colors by type
export const GALAXY_COLORS: Record<string, string> = {
  'spiral': 'warm gold central region, blue star-forming regions in spiral arms, dark dust lanes',
  'barred spiral': 'warm gold central bar, blue star-forming regions in arms, prominent dust lanes',
  'elliptical': 'uniform golden-yellow glow, smooth color gradient from center',
  'irregular': 'mixed blue and gold regions, chaotic color distribution',
  'lenticular': 'smooth golden disk, bright warm center, subtle dust features',
  'default': 'natural galactic colors, warm gold central region, blue star-forming regions',
};

// Nebula colors by type
export const NEBULA_COLORS: Record<string, string> = {
  'emission': 'red hydrogen-alpha glow, blue oxygen regions, pink ionized gas',
  'reflection': 'blue scattered starlight, subtle silver-white tones',
  'planetary': 'blue-green oxygen glow, red hydrogen outer shell, white central star',
  'dark': 'silhouetted black and dark brown against background glow',
  'supernova remnant': 'multicolored filaments, red and blue shocked gas, green oxygen',
  'default': 'colorful gas clouds with red, blue, and pink tones',
};

// Planet colors by type
export const PLANET_COLORS: Record<string, string> = {
  'terrestrial': 'rocky grays and browns, possible rust-red iron oxides',
  'gas giant': 'orange and brown cloud bands, white ammonia clouds, possible red storm spots',
  'ice giant': 'blue-cyan methane atmosphere, subtle cloud banding',
  'dwarf planet': 'gray and tan surface, possible reddish organic compounds',
  'super-earth': 'varied surface colors, possible blue oceans or brown rocky terrain',
  'hot jupiter': 'dark silhouette with glowing orange-red terminator',
  'default': 'natural planetary colors based on composition',
};

// ============================================
// NEGATIVE PROMPTS
// ============================================

// Universal negatives - always include (absolute terms, not relative)
export const UNIVERSAL_NEGATIVES = [
  'cartoon', 'anime', 'illustration', 'painting', 'artistic', 'stylized',
  'fantasy', 'magical', 'text', 'watermarks', 'signatures',
  'logos', 'words', 'letters', 'blur', 'low quality',
  'diagram', 'visualization', 'infographic', 'schematic',
];

// Object-specific negatives - tailored to each object type's common AI rendering failures
// Each list targets what Leonardo AI specifically gets wrong for that object type
// Based on tested prompt optimization report (Jan 2026)
export const OBJECT_TYPE_NEGATIVES: Record<string, string[]> = {
  // STARS: Main failures are glass balls, cosmic orbs, eclipses, coronas
  // Want: Solid incandescent plasma sphere like SDO solar images
  'Star': [
    'glass', 'crystal ball', 'orb', 'marble', 'sphere inside sphere',
    'transparent', 'translucent', 'see-through',
    'eclipse', 'corona flare', 'solar eclipse', 'crescent', 'dark center',
    'lens flare', 'god rays', 'light beams',
    'galaxy', 'nebula', 'planet', 'moon',
    'sunset', 'sunrise', 'horizon',
    'portal', 'universe inside',
    'partial star', 'half star', 'cropped',
  ],

  // GALAXIES: Main failures are nebula overlays, multiple galaxies, portal swirls
  // Want: Clean Hubble-style single galaxy with visible structure
  'Galaxy': [
    'nebula overlay', 'gas cloud overlay',
    'multiple galaxies', 'galaxy cluster', 'colliding galaxies',
    'planets in foreground', 'moon', 'asteroid',
    'lens flare', 'light rays',
    'swirl effect', 'portal', 'vortex',
    'edge-on only', // unless specifically requested
  ],

  // BARRED SPIRAL: Same as galaxy plus wrong spiral type
  'Barred Spiral Galaxy': [
    'nebula overlay', 'gas cloud overlay',
    'multiple galaxies', 'galaxy cluster',
    'planets in foreground', 'moon',
    'lens flare', 'light rays',
    'swirl effect', 'portal', 'vortex',
    'standard spiral', 'arms from center', 'no bar', 'regular spiral',
  ],

  // BLACK HOLES: Main failures are portals, eyes, symmetric rings, blue glows
  // Want: EHT M87/Sgr A* style - asymmetric orange accretion disk, dark void center
  'Black Hole': [
    'portal', 'wormhole', 'tunnel', 'gateway',
    'eye', 'iris', 'pupil',
    'symmetric ring', 'perfect circle glow', 'ring of fire',
    'blue glow', 'purple glow', 'colorful rainbow',
    'galaxy inside', 'universe inside', 'stars inside void',
    'sphere', 'ball', 'orb',
    'planet', 'moon', 'nebula',
    'multiple black holes',
    'flat 2D ring', 'simple circle', 'neon glow', 'tron style', 'geometric',
  ],

  // NEBULAE: Actually render well - main issues are lens flares, added planets, pareidolia
  // Note: Do NOT exclude "transparent" - nebulae ARE gas clouds
  'Nebula': [
    'lens flare', 'light rays', 'god rays',
    'planets in foreground', 'planet', 'moon',
    'sharp edges', 'solid object',
    'single star only', 'star focus',
    'galaxy overlay',
    'human face', 'animal shape', 'pareidolia', 'recognizable figure', 'creature shape',
  ],

  // SUPERNOVA REMNANTS: Similar to nebulae but more structured
  // Want: Filamentary expanding shell like Crab Nebula
  'Supernova Remnant': [
    'lens flare', 'light rays',
    'planet', 'moon', 'asteroid',
    'galaxy', 'black hole',
    'smooth edges', 'perfect sphere',
    'star cluster',
  ],

  // PLANETS: Main failures are glass balls, unwanted rings/moons
  // Want: Solid rocky or gaseous body like Voyager/Cassini images
  'Planet': [
    'glass', 'crystal', 'transparent', 'translucent',
    'orb', 'marble', 'sphere inside',
    'rings', 'ring system', // unless Saturn-type
    'multiple moons', 'moon in frame',
    'lens flare', 'light rays',
    'alien city', 'alien structures', 'buildings',
    'atmosphere glow only', 'just atmosphere',
  ],

  // EXOPLANETS: Same as planets plus star dominance issues
  // Want: Planet with dramatic parent star illumination
  'Exoplanet': [
    'glass', 'crystal', 'transparent', 'translucent',
    'orb', 'marble', 'sphere inside',
    'rings', 'ring system',
    'multiple moons',
    'lens flare', 'light rays',
    'alien city', 'alien structures',
    'star only', 'no planet visible',
    'Earth-like continents', // unless specified
  ],

  // PULSARS: BIGGEST PROBLEM - diagram-style with beams/field lines
  // Want: Simple hot glowing stellar sphere, no physics diagrams
  'Pulsar': [
    'beams', 'radiation beams', 'light beams', 'jets',
    'magnetic field lines', 'field lines', 'force lines',
    'synchrotron radiation', 'emanating rays',
    'diagram', 'schematic', 'infographic', 'visualization',
    'accretion disk', 'disk', 'ring',
    'nebula around', 'gas cloud',
    'planet', 'galaxy',
    'cross pattern', 'lighthouse beam',
  ],

  // MAGNETARS: Same as pulsar - describe appearance not physics
  'Magnetar': [
    'beams', 'radiation beams', 'light beams', 'jets',
    'magnetic field lines', 'field lines', 'force lines', 'field distortions',
    'synchrotron', 'emanating rays',
    'diagram', 'schematic', 'visualization',
    'accretion disk', 'disk', 'ring',
    'nebula', 'gas cloud',
    'planet', 'galaxy',
    'electric arcs', 'lightning',
  ],

  // NEUTRON STARS: Same as pulsar
  'Neutron Star': [
    'beams', 'radiation beams', 'light beams', 'jets',
    'magnetic field lines', 'field lines', 'force lines',
    'synchrotron', 'emanating rays',
    'diagram', 'schematic', 'infographic', 'visualization',
    'accretion disk', 'disk', 'ring',
    'nebula around', 'gas cloud',
    'planet', 'galaxy',
    'cross pattern',
  ],

  // QUASARS: Main issue is missing jet, multiple objects
  // Want: Bright nucleus with visible relativistic jet
  'Quasar': [
    'multiple quasars', 'multiple objects',
    'planet', 'moon',
    'no jet', 'jet missing',
    'dim nucleus', 'faint center',
    'lens flare covering jet',
  ],

  // COMETS: Main failures are fireball rendering, wrong tail direction
  // Want: Icy nucleus with dust and ion tails pointing away from sun
  'Comet': [
    'fireball', 'fire', 'flames', 'burning',
    'meteor', 'meteorite', 'shooting star',
    'planet', 'galaxy', 'nebula',
    'no tail', 'tail missing',
    'glass', 'crystal ball',
    'single tail only',
  ],

  // STAR CLUSTERS: Main failures are single star focus, nebula overlay
  // Want: Many individual stars of varied colors, dense grouping
  'Star Cluster': [
    'single star', 'one star only', 'star focus',
    'nebula overlay', 'gas cloud covering',
    'galaxy', 'spiral structure',
    'lens flare', 'light rays',
    'uniform color', 'all same color',
  ],

  // MOONS: Main failures are glass effect, unwanted rings
  // Want: Cratered rocky/icy surface like Galileo images
  'Moon': [
    'glass', 'crystal', 'transparent', 'translucent',
    'orb', 'marble',
    'rings', 'ring system',
    'atmosphere', 'clouds', 'weather',
    'alien city', 'alien structures',
    'smooth surface', 'no craters',
    'lens flare',
  ],

  // BROWN DWARFS: Main failures are star-like rendering, too bright
  // Want: Jupiter-like body with infrared glow, banded atmosphere
  'Brown Dwarf': [
    'bright star', 'sun', 'yellow star', 'white hot',
    'blue star', 'glowing sphere',
    'nebula', 'galaxy', 'planet rings',
    'lens flare', 'light rays',
    'diagram', 'schematic',
  ],

  // GLOBULAR CLUSTERS: Main failures are single star focus, nebula overlay
  // Want: Dense spherical concentration of thousands of ancient stars
  'Globular Cluster': [
    'single star', 'one star only', 'star focus',
    'nebula', 'gas cloud', 'emission nebula',
    'galaxy', 'spiral structure',
    'lens flare', 'light rays',
    'uniform color', 'all same color',
    'sparse stars', 'few stars',
  ],

  // DWARF PLANETS: Main failures are generic planet look, missing features
  // Want: Icy/rocky body with specific surface features like New Horizons imagery
  'Dwarf Planet': [
    'glass', 'crystal', 'transparent', 'translucent',
    'orb', 'marble',
    'rings', 'ring system',
    'atmosphere', 'clouds', 'thick atmosphere',
    'alien city', 'alien structures',
    'lens flare', 'light rays',
    'Earth-like', 'blue oceans', 'green continents',
  ],

  // WHITE DWARFS: Main failures are diagram style, wrong size appearance
  // Want: Small compact intensely luminous stellar sphere
  'White Dwarf': [
    'beams', 'radiation beams', 'light beams',
    'magnetic field lines', 'field lines',
    'diagram', 'schematic', 'visualization',
    'nebula around', 'planetary nebula',
    'accretion disk', 'disk',
    'large star', 'supergiant', 'red giant',
    'planet', 'galaxy',
  ],

  // SUPERNOVAE: Main failures are generic look, no expanding shell
  // Want: Expanding remnant with filamentary structure
  'Supernova': [
    'single star', 'point of light',
    'planet', 'moon', 'asteroid',
    'galaxy', 'black hole',
    'smooth sphere', 'perfect circle',
    'diagram', 'schematic',
  ],

  // FALLBACK: Generic space object negatives
  'Unknown': [
    'lens flare', 'light rays',
    'multiple objects',
    'diagram', 'schematic',
  ],
};

// Get combined negatives for an object type
export function getNegativePrompt(objectType: string, galaxyType?: string): string {
  let typeNegatives = OBJECT_TYPE_NEGATIVES[objectType] || [];

  // Special handling for barred spiral galaxies
  if (objectType === 'Galaxy' && galaxyType?.toLowerCase() === 'barred spiral') {
    typeNegatives = OBJECT_TYPE_NEGATIVES['Barred Spiral Galaxy'] || typeNegatives;
  }

  const allNegatives = [...UNIVERSAL_NEGATIVES, ...typeNegatives];
  return allNegatives.join(', ');
}

// ============================================
// WORDS THAT TRIGGER FAILURES
// ============================================

// These words cause AI to render diagrams/artistic interpretations instead of photographs
export const TRIGGER_WORDS_TO_AVOID = {
  // Trigger diagram/visualization style
  diagramTriggers: [
    'radiation beams', 'magnetic field lines', 'field distortions',
    'synchrotron', 'synchrotron emission', 'emanating from poles',
    'composite imagery', 'visualization',
  ],
  // Trigger eclipse instead of star
  eclipseTriggers: [
    'limb darkening', 'coronal glow', 'corona',
  ],
  // Trigger artistic interpretation
  artisticTriggers: [
    'stunning', 'beautiful', 'amazing', 'breathtaking',
    'museum-quality', 'award-winning', 'masterpiece',
    'astrophotography', // implies distant/artistic
  ],
  // Trigger cosmic art / marble / portal
  cosmicArtTriggers: [
    'universe inside', 'cosmic', 'celestial beauty',
  ],
};

// ============================================
// STYLE REFERENCES BY OBJECT TYPE
// ============================================

export const STYLE_REFERENCES: Record<string, { style: string; medium: string }> = {
  'Star': {
    style: 'NASA Solar Dynamics Observatory solar imaging',
    medium: 'Space telescope ultraviolet photography',
  },
  'Galaxy': {
    style: 'NASA Hubble Space Telescope imagery',
    medium: 'Telescope photography',
  },
  'Black Hole': {
    style: 'NASA Event Horizon Telescope imagery',
    medium: 'Radio telescope imagery',
  },
  'Nebula': {
    style: 'NASA Hubble Space Telescope imagery',
    medium: 'Space telescope photography',
  },
  'Supernova Remnant': {
    style: 'NASA Hubble Space Telescope imagery',
    medium: 'Space telescope photography',
  },
  'Planet': {
    style: 'NASA planetary photography',
    medium: 'Space probe photography',
  },
  'Exoplanet': {
    style: 'NASA exoplanet imagery',
    medium: 'Space telescope photography',
  },
  // Use Hubble stellar imagery (cleaner associations than Chandra X-ray)
  'Pulsar': {
    style: 'NASA Hubble Space Telescope stellar imagery',
    medium: 'Space telescope photography',
  },
  'Magnetar': {
    style: 'NASA Hubble Space Telescope stellar imagery',
    medium: 'Space telescope photography',
  },
  'Neutron Star': {
    style: 'NASA Hubble Space Telescope stellar imagery',
    medium: 'Space telescope photography',
  },
  'Quasar': {
    style: 'NASA Hubble Space Telescope imagery',
    medium: 'Telescope photography',
  },
  'Comet': {
    style: 'NASA spacecraft photography',
    medium: 'Space probe imagery',
  },
  'Star Cluster': {
    style: 'NASA Hubble Space Telescope imagery',
    medium: 'Telescope photography',
  },
  'Moon': {
    style: 'NASA spacecraft photography',
    medium: 'Space probe imagery',
  },
  'Brown Dwarf': {
    style: 'NASA infrared telescope imagery',
    medium: 'Infrared space telescope photography',
  },
  'Globular Cluster': {
    style: 'NASA Hubble Space Telescope imagery',
    medium: 'Space telescope photography',
  },
  'Dwarf Planet': {
    style: 'NASA New Horizons spacecraft photography',
    medium: 'Space probe photography',
  },
  'White Dwarf': {
    style: 'NASA Hubble Space Telescope stellar imagery',
    medium: 'Space telescope photography',
  },
  'Supernova': {
    style: 'NASA Hubble Space Telescope imagery',
    medium: 'Space telescope composite photography',
  },
  // FALLBACK
  'Unknown': {
    style: 'NASA Hubble Space Telescope imagery',
    medium: 'Space telescope photography',
  },
};

// ============================================
// VISUAL CHARACTERISTICS TEMPLATES
// ============================================

export const VISUAL_CHARACTERISTICS: Record<string, string> = {
  'Star': 'Bright glowing plasma sphere, surface granulation texture, starspots, centered in frame with space around it, realistic deep space background',
  'Galaxy': '{structureDetails}, bright central bulge, {typeFeatures}, deep space background with distant stars',
  'Black Hole': 'Dark circular event horizon, bright asymmetric accretion disk with turbulent plasma, gravitational lensing warping background stars, Doppler beaming with one side brighter, single isolated subject centered in frame',
  'Nebula': '{colorDescription} gas clouds, {structureDetails}, stars visible within and behind the nebula, deep space background',
  'Supernova Remnant': 'Expanding filamentary shell structure, shocked gas filaments, embedded neutron star or pulsar, deep space background',
  'Planet': '{surfaceFeatures}, {lightingDescription}, visible against deep space background with stars',
  'Exoplanet': '{surfaceFeatures}, illuminated by parent star, visible against deep space background',
  'Pulsar': 'Rapidly rotating neutron star, visible radiation beams emanating from magnetic poles, surrounding nebula or space background',
  'Magnetar': 'Intensely magnetized neutron star, visible magnetic field distortions, high-energy emissions, deep space background',
  'Quasar': 'Brilliant point-like nucleus, visible relativistic jet, host galaxy faintly visible, deep space background',
  'Comet': 'Bright nucleus, visible dust tail and ion tail, coma surrounding nucleus, starfield background',
  'Star Cluster': 'Dense concentration of stars, varied stellar colors, gravitationally bound grouping, deep space background',
  'Moon': '{surfaceFeatures}, crater impacts, reflected light from parent planet, space background',
};

// ============================================
// PROMPT TEMPLATES BY OBJECT TYPE
// ============================================

export interface PromptTemplate {
  realismStatement: string;
  objectDescription: string;
  visualCharacteristics: string;
  styleReference: string;
  colorDescription: string;
  lighting: string;
  quality: string;
  medium: string;
}

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  'Star': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a {temperatureDesc} {subType} stellar surface',
    visualCharacteristics: 'Brilliant incandescent plasma sphere, {granulationType} granulation texture, {starspotDesc}, {prominenceDesc}, solid opaque luminous disk, single star filling {frameFill}% of frame, black space background',
    styleReference: 'NASA Solar Dynamics Observatory solar imaging',
    colorDescription: '{primaryColor} surface, {limbColor} limb, {accentColor}',
    lighting: 'Self-luminous stellar surface',
    quality: '8K, ultra high definition',
    medium: 'Space telescope {wavelength} photography',
  },
  'Galaxy': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a {galaxyType} galaxy viewed from deep space',
    visualCharacteristics: '{structureDetails}, bright solid central bulge, blue star-forming regions in outer arms, galaxy filling 50% of frame, face-on view, black space background with distant stars',
    styleReference: 'NASA Hubble Space Telescope deep field imagery',
    colorDescription: '{galaxyColor}',
    lighting: 'Natural galactic luminosity',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  'Black Hole': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a {subType} black hole with accretion disk',
    visualCharacteristics: 'Dark circular void event horizon surrounded by bright photon ring, asymmetric accretion disk with turbulent orange-yellow plasma, Doppler beaming creating distinct bright side and dim side, gravitational lensing bending background starlight, warped spacetime distortion, single isolated subject filling 40% of frame, pure black space background',
    styleReference: 'NASA Event Horizon Telescope M87 and Sagittarius A* imagery',
    colorDescription: 'Bright orange-gold plasma on approaching side, dimmer red on receding side, absolute black void at center, lensed blue-shifted light arcs',
    lighting: 'Accretion disk self-luminous, asymmetric Doppler brightness',
    quality: '8K, ultra high definition',
    medium: 'Radio telescope composite imagery',
  },
  'Nebula': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a {nebulaType} nebula in deep space',
    visualCharacteristics: '{colorDescription} gas clouds, {structureDetails}, stars visible within and behind, solid opaque gas structures, nebula filling 50% of frame, black space background',
    styleReference: 'NASA Hubble Space Telescope nebula imagery',
    colorDescription: '{nebulaColor}',
    lighting: 'Illuminated by internal and nearby stars',
    quality: '8K, ultra high definition',
    medium: 'Space telescope narrowband photography',
  },
  'Supernova Remnant': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'an expanding supernova remnant shell',
    visualCharacteristics: 'Expanding filamentary shell structure, shocked gas filaments, colorful emission from different elements, solid gas structures, remnant filling 50% of frame, black space background',
    styleReference: 'NASA Hubble Space Telescope Crab Nebula imagery',
    colorDescription: 'Multicolored filaments with red hydrogen, blue oxygen, green sulfur emissions',
    lighting: 'Self-luminous shocked gas',
    quality: '8K, ultra high definition',
    medium: 'Space telescope composite photography',
  },
  'Planet': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a {planetType} planet surface',
    visualCharacteristics: '{surfaceFeatures}, solid opaque planetary body, sharp surface detail, planet filling 60% of frame, visible terminator line, black space background with stars',
    styleReference: 'NASA Voyager planetary photography',
    colorDescription: '{planetColor}',
    lighting: 'Direct sunlight with sharp terminator shadow',
    quality: '8K, ultra high definition',
    medium: 'Space probe photography',
  },
  'Exoplanet': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'an exoplanet orbiting a distant star',
    visualCharacteristics: '{surfaceFeatures}, solid opaque planetary body, planet filling 60% of frame, parent star glow illuminating limb, black space background',
    styleReference: 'NASA exoplanet artist conception based on data',
    colorDescription: '{planetColor}',
    lighting: 'Illuminated by parent star on horizon',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  // PULSAR/MAGNETAR/NEUTRON STAR: Use "hot white dwarf" terminology
  // KEY LEARNING: "pulsar" and "neutron star" trigger diagram-style rendering
  // "white dwarf" has cleaner training data associations (simple glowing sphere)
  'Pulsar': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a compact hot white dwarf stellar remnant',
    visualCharacteristics: 'Small intensely luminous solid stellar sphere, brilliant white-blue opaque surface, subtle warm glow halo, clean simple spherical shape, single star filling 30% of frame, black space starfield background',
    styleReference: 'NASA Hubble Space Telescope stellar imagery',
    colorDescription: 'Brilliant white-blue stellar surface with soft orange-gold outer glow',
    lighting: 'Self-luminous stellar surface',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  'Magnetar': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'an intensely hot compact stellar remnant',
    visualCharacteristics: 'Small intensely luminous solid stellar sphere, brilliant white-blue opaque surface, intense warm glow halo, clean simple spherical shape, single star filling 30% of frame, black space starfield background',
    styleReference: 'NASA Hubble Space Telescope stellar imagery',
    colorDescription: 'Brilliant white-blue stellar surface with intense orange-gold outer glow',
    lighting: 'Self-luminous stellar surface',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  'Neutron Star': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a compact hot white dwarf stellar remnant',
    visualCharacteristics: 'Small intensely luminous solid stellar sphere, brilliant white-blue opaque surface, subtle warm glow halo, clean simple spherical shape, single star filling 30% of frame, black space starfield background',
    styleReference: 'NASA Hubble Space Telescope stellar imagery',
    colorDescription: 'Brilliant white-blue stellar surface with soft orange-gold outer glow',
    lighting: 'Self-luminous stellar surface',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  'Quasar': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'an active galactic nucleus quasar',
    visualCharacteristics: 'Brilliant intense point-like nucleus, visible relativistic jet extending outward, faint host galaxy halo, quasar filling 40% of frame, black space background',
    styleReference: 'NASA Hubble Space Telescope quasar imagery',
    colorDescription: 'Intense white-blue nucleus, orange-gold relativistic jet, faint galactic halo',
    lighting: 'Intensely self-luminous nucleus',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  'Comet': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a comet with visible tail',
    visualCharacteristics: 'Bright solid irregular nucleus, visible curved golden dust tail, straight blue ion tail, glowing coma envelope, comet filling 40% of frame, black space starfield background',
    styleReference: 'NASA spacecraft comet photography',
    colorDescription: 'White-gray solid nucleus, golden dust tail, blue ion tail',
    lighting: 'Sunlit with tails pointing away from Sun',
    quality: '8K, ultra high definition',
    medium: 'Space probe photography',
  },
  'Star Cluster': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a {subType} star cluster',
    visualCharacteristics: 'Dense concentration of individual stars, varied stellar colors from blue to orange, each star a solid luminous point, cluster filling 50% of frame, black space background',
    styleReference: 'NASA Hubble Space Telescope star cluster imagery',
    colorDescription: 'Mixed stellar colors - blue hot stars, yellow sun-like stars, orange and red cooler stars',
    lighting: 'Natural stellar luminosity',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  'Moon': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a planetary moon surface',
    visualCharacteristics: '{surfaceFeatures}, visible crater impacts, solid opaque rocky surface, moon filling 60% of frame, sharp terminator line, black space background',
    styleReference: 'NASA Galileo spacecraft moon photography',
    colorDescription: '{surfaceColor}',
    lighting: 'Reflected sunlight with sharp terminator shadow',
    quality: '8K, ultra high definition',
    medium: 'Space probe photography',
  },
  // BROWN DWARF: Jupiter-like failed star with infrared glow
  // KEY: Avoid "star" terminology - emphasize substellar, failed star appearance
  'Brown Dwarf': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a brown dwarf substellar object',
    visualCharacteristics: 'Large Jupiter-like body with banded atmosphere, deep magenta-red coloration, faint self-luminous infrared glow, atmospheric storms and cloud bands, solid opaque body, object filling 50% of frame, black space starfield background',
    styleReference: 'NASA infrared telescope imagery',
    colorDescription: 'Deep magenta-red to brown surface, darker atmospheric bands, faint warm infrared glow at limb',
    lighting: 'Self-luminous infrared emission with faint glow',
    quality: '8K, ultra high definition',
    medium: 'Infrared space telescope photography',
  },
  // GLOBULAR CLUSTER: Dense ancient star concentration
  // KEY: Emphasize density, thousands of stars, spherical concentration
  'Globular Cluster': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a dense globular star cluster',
    visualCharacteristics: 'Extremely dense spherical concentration of ancient stars, brilliant crowded core with thousands of individual stars, gradual density falloff toward edges, varied stellar colors from blue stragglers to red giants, cluster filling 50% of frame, black space background',
    styleReference: 'NASA Hubble Space Telescope star cluster imagery',
    colorDescription: 'Mixed stellar colors - predominantly warm orange-red ancient stars, scattered blue stragglers, yellow sun-like stars in dense packed arrangement',
    lighting: 'Natural stellar luminosity from thousands of stars',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  // DWARF PLANET: Icy/rocky distant body with specific surface features
  // KEY: Use New Horizons style, emphasize specific surface features
  'Dwarf Planet': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a dwarf planet surface',
    visualCharacteristics: '{surfaceFeatures}, solid opaque icy-rocky body, sharp surface detail, dwarf planet filling 60% of frame, sharp terminator line, distant sun illumination, black space background with stars',
    styleReference: 'NASA New Horizons spacecraft photography',
    colorDescription: '{planetColor}',
    lighting: 'Distant sunlight illumination with sharp terminator shadow',
    quality: '8K, ultra high definition',
    medium: 'Space probe photography',
  },
  // WHITE DWARF: Compact stellar remnant (same approach as neutron star)
  // KEY: Use "compact hot stellar remnant" to avoid diagram rendering
  'White Dwarf': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a compact hot white dwarf stellar remnant',
    visualCharacteristics: 'Small intensely luminous solid stellar sphere, brilliant white-blue opaque surface, subtle warm glow halo, clean simple spherical shape, single star filling 30% of frame, black space starfield background',
    styleReference: 'NASA Hubble Space Telescope stellar imagery',
    colorDescription: 'Brilliant white-blue stellar surface with soft warm outer glow',
    lighting: 'Self-luminous stellar surface',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  // SUPERNOVA: Use supernova remnant style (expanding shell)
  // KEY: Historical supernovae show as remnants, not the explosion itself
  'Supernova': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a supernova remnant expanding shell',
    visualCharacteristics: 'Expanding filamentary shell structure, shocked gas filaments, colorful emission from different elements, possible central neutron star or pulsar, solid gas structures, remnant filling 50% of frame, black space background',
    styleReference: 'NASA Hubble Space Telescope supernova remnant imagery',
    colorDescription: 'Multicolored filaments with red hydrogen, blue oxygen, green sulfur emissions',
    lighting: 'Self-luminous shocked gas',
    quality: '8K, ultra high definition',
    medium: 'Space telescope composite photography',
  },
  // FALLBACK: Default template for unknown object types
  'Unknown': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'an astronomical object in deep space',
    visualCharacteristics: 'Detailed solid celestial object, sharp defined edges, object filling 40% of frame, black space starfield background',
    styleReference: 'NASA Hubble Space Telescope imagery',
    colorDescription: 'Natural astronomical colors',
    lighting: 'Natural illumination',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
};

// ============================================
// PROMPT BUILDER FUNCTION
// ============================================

export interface PromptBuildOptions {
  name: string;
  objectType: string;
  description?: string;
  spectralType?: string;
  galaxyType?: string;
  nebulaType?: string;
  planetType?: string;
  subType?: string;
  structureDetails?: string;
  surfaceFeatures?: string;
  colorDescription?: string;
  customVisualCharacteristics?: string;
  mass?: number;
  notableFeatures?: string[];
  // New: Visual features for object-specific characteristics
  visualFeatures?: string[];
}

export function buildImagePrompt(options: PromptBuildOptions): { prompt: string; negativePrompt: string } {
  const {
    name,
    objectType,
    description,
    spectralType,
    mass,
    notableFeatures,
    visualFeatures,
  } = options;

  // Auto-derive types if not provided
  let { galaxyType, nebulaType, planetType, subType, structureDetails, surfaceFeatures, colorDescription, customVisualCharacteristics } = options;

  // Derive subType based on object type
  if (!subType) {
    switch (objectType) {
      case 'Star':
        subType = deriveStarSubType(spectralType, description);
        break;
      case 'Galaxy':
        galaxyType = galaxyType || deriveGalaxyType(name, description);
        subType = galaxyType;
        break;
      case 'Nebula':
        nebulaType = nebulaType || deriveNebulaType(name, description, objectType);
        subType = nebulaType;
        break;
      case 'Supernova Remnant':
        nebulaType = 'supernova remnant';
        subType = 'supernova remnant';
        break;
      case 'Planet':
      case 'Exoplanet':
        planetType = planetType || derivePlanetType(name, description, mass);
        subType = planetType;
        break;
      case 'Black Hole':
        subType = deriveBlackHoleType(mass, description);
        break;
      case 'Star Cluster':
        subType = description?.toLowerCase().includes('globular') ? 'globular' : 'open';
        break;
      case 'Globular Cluster':
        subType = 'globular';
        break;
      case 'Brown Dwarf':
        subType = 'brown dwarf';
        break;
      case 'Dwarf Planet':
        subType = 'dwarf planet';
        break;
      case 'White Dwarf':
        subType = 'white dwarf';
        break;
      case 'Supernova':
        subType = 'supernova remnant';
        break;
      default:
        subType = objectType.toLowerCase();
    }
  }

  // Get template for object type (fallback to 'Unknown' if not found)
  const template = PROMPT_TEMPLATES[objectType] || PROMPT_TEMPLATES['Unknown'];
  const styleRef = STYLE_REFERENCES[objectType] || STYLE_REFERENCES['Unknown'];

  // Determine colors based on object type
  let color = colorDescription || '';
  if (!color) {
    switch (objectType) {
      case 'Star':
        color = getStarColor(spectralType);
        break;
      case 'Galaxy':
        color = GALAXY_COLORS[galaxyType?.toLowerCase() || 'default'] || GALAXY_COLORS['default'];
        break;
      case 'Nebula':
      case 'Supernova Remnant':
        color = NEBULA_COLORS[nebulaType?.toLowerCase() || 'default'] || NEBULA_COLORS['default'];
        break;
      case 'Planet':
      case 'Exoplanet':
        color = PLANET_COLORS[planetType?.toLowerCase() || 'default'] || PLANET_COLORS['default'];
        break;
      default:
        color = template.colorDescription;
    }
  }

  // Generate structure details if not provided
  if (!structureDetails) {
    structureDetails = getTypeFeatures(objectType, galaxyType, nebulaType);
  }

  // Generate surface features for planets if not provided
  if (!surfaceFeatures && (objectType === 'Planet' || objectType === 'Exoplanet')) {
    surfaceFeatures = getPlanetSurfaceFeatures(planetType || 'terrestrial');
  }

  // Star-specific variables (computed from spectral type)
  let starVars = {
    temperatureDesc: '',
    granulationType: 'visible',
    starspotDesc: 'scattered dark starspots',
    prominenceDesc: 'magnetic prominences at limb',
    primaryColor: 'orange-yellow',
    limbColor: 'orange',
    accentColor: 'orange granulation hints',
    frameFill: 75,
    wavelength: 'visible',
  };

  if (objectType === 'Star') {
    const luminosityClass = spectralType?.match(/[IV]+$/)?.[0];
    const isSupergiant = luminosityClass?.includes('I') && !luminosityClass?.includes('V');
    const isFlare = name.toLowerCase().includes('flare') ||
                   description?.toLowerCase().includes('flare star') ||
                   name.toLowerCase().includes('proxima');

    starVars = {
      temperatureDesc: getStarTemperatureDesc(spectralType),
      granulationType: getStarGranulationType(spectralType, luminosityClass),
      starspotDesc: getStarspotDesc(spectralType, isFlare),
      prominenceDesc: getProminenceDesc(spectralType, isFlare, isSupergiant),
      primaryColor: getStarPrimaryColor(spectralType),
      limbColor: getStarLimbColor(spectralType),
      accentColor: getStarAccentColor(spectralType),
      frameFill: getStarFrameFill(spectralType, isSupergiant),
      wavelength: getStarWavelength(spectralType),
    };
  }

  // Nebula-specific enhancements for famous nebulae
  if (objectType === 'Nebula' || objectType === 'Supernova Remnant') {
    const nebulaFeatures = getNebulaSpecificFeatures(name);
    if (nebulaFeatures) {
      // Enhance structure details with famous nebula's specific features
      if (!structureDetails || structureDetails === getTypeFeatures(objectType, galaxyType, nebulaType)) {
        structureDetails = nebulaFeatures.specificFeatures;
      }
      // Use the famous nebula's color notes if available
      if (nebulaFeatures.colorNotes && !colorDescription) {
        color = nebulaFeatures.colorNotes;
      }
    }
  }

  // Black hole-specific enhancements for famous black holes
  if (objectType === 'Black Hole') {
    const bhFeatures = getBlackHoleSpecificFeatures(name);
    if (bhFeatures) {
      // Add specific features to structure details
      if (!structureDetails) {
        structureDetails = bhFeatures.specificFeatures;
      }
      // Use the famous black hole's color notes if available
      if (bhFeatures.colorNotes && !colorDescription) {
        color = bhFeatures.colorNotes;
      }
    }
  }

  // Dwarf planet-specific enhancements for known dwarf planets
  if (objectType === 'Dwarf Planet') {
    const dpFeatures = getDwarfPlanetSpecificFeatures(name);
    if (dpFeatures) {
      // Use specific surface features for known dwarf planets
      if (dpFeatures.surfaceFeatures && !surfaceFeatures) {
        surfaceFeatures = dpFeatures.surfaceFeatures;
      }
      // Use the dwarf planet's color notes if available
      if (dpFeatures.colorNotes && !colorDescription) {
        color = dpFeatures.colorNotes;
      }
    }
  }

  // Build object description
  let objectDesc = template.objectDescription
    .replace('{name}', name)
    .replace('{galaxyType}', galaxyType || 'spiral')
    .replace('{nebulaType}', nebulaType || 'emission')
    .replace('{planetType}', planetType || 'planet')
    .replace('{subType}', subType || '')
    .replace('{temperatureDesc}', starVars.temperatureDesc)
    .replace(/\s+/g, ' ') // Clean up double spaces from empty temperatureDesc
    .trim();

  // Build visual characteristics
  let visualChars = customVisualCharacteristics || template.visualCharacteristics;

  // Add notable features if available
  let featuresText = '';
  if (notableFeatures && notableFeatures.length > 0) {
    featuresText = notableFeatures.slice(0, 2).join(', ');
  }

  // Add visual features to structure details if available
  // Visual features are object-specific visual characteristics (e.g., "Heart-shaped Tombaugh Regio")
  if (visualFeatures && visualFeatures.length > 0) {
    const visualFeaturesText = visualFeatures.slice(0, 3).join(', ');
    if (structureDetails) {
      structureDetails = `${structureDetails}, ${visualFeaturesText}`;
    } else {
      structureDetails = visualFeaturesText;
    }
  }

  visualChars = visualChars
    .replace('{structureDetails}', structureDetails || 'detailed structure')
    .replace('{surfaceFeatures}', surfaceFeatures || 'detailed surface features')
    .replace('{colorDescription}', color)
    .replace('{typeFeatures}', getTypeFeatures(objectType, galaxyType, nebulaType))
    .replace('{lightingDescription}', 'natural lighting with visible terminator')
    // Star-specific placeholders
    .replace('{granulationType}', starVars.granulationType)
    .replace('{starspotDesc}', starVars.starspotDesc)
    .replace('{prominenceDesc}', starVars.prominenceDesc)
    .replace('{frameFill}', String(starVars.frameFill));

  // Build color description
  let colorDesc = template.colorDescription
    .replace('{starColor}', color)
    .replace('{galaxyColor}', color)
    .replace('{nebulaColor}', color)
    .replace('{planetColor}', color)
    // Star-specific color placeholders
    .replace('{primaryColor}', starVars.primaryColor)
    .replace('{limbColor}', starVars.limbColor)
    .replace('{accentColor}', starVars.accentColor);

  // Build medium with star-specific wavelength if applicable
  let medium = template.medium || styleRef.medium;
  medium = medium.replace('{wavelength}', starVars.wavelength);

  // Construct the full prompt following the document structure
  // CRITICAL: Object name goes in parentheses AFTER the technical description
  // This prevents fantasy/artistic interpretations by anchoring to scientific terminology first
  const prompt = `${template.realismStatement} of ${objectDesc}. (${name})

Visual characteristics: ${visualChars}

Style: ${styleRef.style}

Colors: ${colorDesc}

Lighting: ${template.lighting}

Quality: ${template.quality}

Medium: ${medium}`;

  // Get negative prompt (pass galaxyType for barred spiral special handling)
  const negativePrompt = getNegativePrompt(objectType, galaxyType);

  return {
    prompt: prompt.trim(),
    negativePrompt: negativePrompt, // No prefix - FLUX uses plain comma-separated list
  };
}

// Helper function to get planet surface features
function getPlanetSurfaceFeatures(planetType: string): string {
  switch (planetType.toLowerCase()) {
    case 'terrestrial':
      return 'rocky terrain, craters, mountains, valleys, possible canyons';
    case 'gas giant':
      return 'swirling cloud bands, massive storm systems, no solid surface visible';
    case 'ice giant':
      return 'blue-cyan atmosphere, subtle cloud banding, methane ice clouds';
    case 'super-earth':
      return 'rocky surface with possible oceans, thick atmosphere, tectonic features';
    case 'hot jupiter':
      return 'glowing hot atmosphere, tidally locked with permanent day/night sides';
    case 'dwarf planet':
      return 'icy surface, possible cryovolcanic features, cratered terrain';
    default:
      return 'diverse surface features';
  }
}

// Helper function to get type-specific features
// IMPORTANT: For barred spirals, EMPHASIZE the bar - it's the defining characteristic
function getTypeFeatures(objectType: string, galaxyType?: string, nebulaType?: string): string {
  if (objectType === 'Galaxy') {
    switch (galaxyType?.toLowerCase()) {
      case 'spiral': return 'sweeping spiral arms originating from center, dust lanes, blue star-forming regions';
      // BARRED SPIRAL: Heavily emphasize bar structure with spatial language
      case 'barred spiral': return 'PROMINENT ELONGATED CENTRAL BAR cutting horizontally across bright nucleus, spiral arms originating from BAR ENDS not from center, dark dust lanes along bar';
      case 'elliptical': return 'smooth elliptical shape, no spiral arms, diffuse edges';
      case 'irregular': return 'asymmetric shape, chaotic structure, active star formation';
      case 'lenticular': return 'disk shape without spiral arms, smooth structure';
      default: return 'detailed galactic structure';
    }
  }
  if (objectType === 'Nebula') {
    switch (nebulaType?.toLowerCase()) {
      case 'emission': return 'glowing ionized gas, pillar structures, stellar nursery';
      case 'reflection': return 'diffuse scattered light, subtle gradients';
      case 'planetary': return 'circular or ring structure, central white dwarf star';
      case 'dark': return 'silhouetted dust clouds blocking background light';
      default: return 'colorful gas and dust structures';
    }
  }
  return '';
}

// ============================================
// QUALITY CHECKLIST VALIDATION
// ============================================

export function validatePrompt(prompt: string): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const lowerPrompt = prompt.toLowerCase();

  // Check for ALL trigger words that cause failures
  const allTriggers = [
    ...TRIGGER_WORDS_TO_AVOID.diagramTriggers,
    ...TRIGGER_WORDS_TO_AVOID.eclipseTriggers,
    ...TRIGGER_WORDS_TO_AVOID.artisticTriggers,
    ...TRIGGER_WORDS_TO_AVOID.cosmicArtTriggers,
  ];

  for (const term of allTriggers) {
    if (lowerPrompt.includes(term.toLowerCase())) {
      warnings.push(`Contains trigger word "${term}" - may cause rendering failure`);
    }
  }

  // Check for required elements
  if (!lowerPrompt.includes('photorealistic')) {
    warnings.push('Missing realism statement (photorealistic)');
  }
  if (!prompt.includes('Quality:') && !prompt.includes('8K')) {
    warnings.push('Missing quality specification');
  }
  if (!prompt.includes('Style:') && !prompt.includes('NASA')) {
    warnings.push('Missing style reference');
  }

  // Check for composition guidance
  if (!lowerPrompt.includes('centered in frame') && !lowerPrompt.includes('single isolated') && !lowerPrompt.includes('% of frame')) {
    warnings.push('Missing composition guidance (centered in frame / filling X% of frame)');
  }

  // Check for explicit colors
  if (!prompt.includes('Colors:')) {
    warnings.push('Missing explicit color specification');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

// ============================================
// NFT-TO-PROMPT CONVERTER
// ============================================

// Interface for NFT data from database
export interface NFTData {
  id: number;
  name: string;
  objectType?: string;
  description?: string;
  spectralType?: string;
  massSolar?: number;
  notableFeatures?: string | string[];
  // New: Visual features for object-specific visual characteristics
  visualFeatures?: string | string[];
  // Optional overrides
  galaxyType?: string;
  nebulaType?: string;
  planetType?: string;
  subType?: string;
  structureDetails?: string;
  surfaceFeatures?: string;
  colorDescription?: string;
  visualCharacteristics?: string;
}

// Convert NFT database record to prompt options
export function nftToPromptOptions(nft: NFTData): PromptBuildOptions {
  // Parse notableFeatures if it's a string
  let features: string[] | undefined;
  if (nft.notableFeatures) {
    if (typeof nft.notableFeatures === 'string') {
      try {
        features = JSON.parse(nft.notableFeatures);
      } catch {
        features = [nft.notableFeatures];
      }
    } else {
      features = nft.notableFeatures;
    }
  }

  // Parse visualFeatures if it's a string
  let visualFeatures: string[] | undefined;
  if (nft.visualFeatures) {
    if (typeof nft.visualFeatures === 'string') {
      try {
        visualFeatures = JSON.parse(nft.visualFeatures);
      } catch {
        visualFeatures = [nft.visualFeatures];
      }
    } else {
      visualFeatures = nft.visualFeatures;
    }
  }

  return {
    name: nft.name,
    objectType: nft.objectType || 'Unknown',
    description: nft.description,
    spectralType: nft.spectralType,
    mass: nft.massSolar,
    notableFeatures: features,
    visualFeatures: visualFeatures,
    galaxyType: nft.galaxyType,
    nebulaType: nft.nebulaType,
    planetType: nft.planetType,
    subType: nft.subType,
    structureDetails: nft.structureDetails,
    surfaceFeatures: nft.surfaceFeatures,
    colorDescription: nft.colorDescription,
    customVisualCharacteristics: nft.visualCharacteristics,
  };
}

// Generate prompt for a single NFT with confidence scoring and logging
export function generatePromptForNFT(nft: NFTData, options?: {
  enableLogging?: boolean;
  deriveFeaturesFromSpectral?: boolean;
}): {
  prompt: string;
  negativePrompt: string;
  validation: { valid: boolean; warnings: string[] };
  confidence: PromptConfidence;
} {
  const startTime = Date.now();
  const promptOptions = nftToPromptOptions(nft);

  // Derive visual features from spectral type if enabled and no explicit features
  let derivedFeatures: string[] = [];
  const shouldDeriveFromSpectral = options?.deriveFeaturesFromSpectral !== false;

  if (shouldDeriveFromSpectral &&
      !promptOptions.visualFeatures?.length &&
      promptOptions.spectralType &&
      promptOptions.objectType === 'Star') {
    derivedFeatures = deriveVisualFeaturesFromSpectralType(
      promptOptions.spectralType,
      promptOptions.name
    );
    // Use derived features if we got any
    if (derivedFeatures.length > 0) {
      promptOptions.visualFeatures = derivedFeatures;
    }
  }

  const { prompt, negativePrompt } = buildImagePrompt(promptOptions);
  const validation = validatePrompt(prompt);

  // Check for famous object features
  const hasFamousFeatures = !!(
    (promptOptions.objectType === 'Nebula' && getNebulaSpecificFeatures(promptOptions.name)) ||
    (promptOptions.objectType === 'Black Hole' && getBlackHoleSpecificFeatures(promptOptions.name)) ||
    (promptOptions.objectType === 'Dwarf Planet' && getDwarfPlanetSpecificFeatures(promptOptions.name))
  );

  // Calculate confidence
  const confidence = calculateConfidence(promptOptions.objectType, {
    hasExplicitVisualFeatures: !!(nft.visualFeatures && (
      typeof nft.visualFeatures === 'string' ? nft.visualFeatures.length > 0 :
      nft.visualFeatures.length > 0
    )),
    hasSpectralType: !!promptOptions.spectralType,
    hasFamousFeatures,
    hasColorDescription: !!promptOptions.colorDescription,
    hasStructureDetails: !!promptOptions.structureDetails,
    validationWarnings: validation.warnings,
  });

  // Log generation if enabled
  if (options?.enableLogging !== false) {
    const log: PromptGenerationLog = {
      timestamp: new Date(),
      nftId: nft.id,
      nftName: nft.name,
      objectType: promptOptions.objectType,
      confidence,
      promptLength: prompt.length,
      validationWarnings: validation.warnings,
      featureSourceDetails: {
        source: confidence.featureSource,
        featuresUsed: derivedFeatures.length > 0 ? derivedFeatures :
          (promptOptions.visualFeatures || []),
      },
      duration: Date.now() - startTime,
    };
    logPromptGeneration(log);
  }

  return { prompt, negativePrompt, validation, confidence };
}

// ============================================
// BATCH GENERATION
// ============================================

export interface BatchPromptResult {
  nftId: number;
  nftName: string;
  objectType: string;
  prompt: string;
  negativePrompt: string;
  valid: boolean;
  warnings: string[];
  confidence: PromptConfidence;
}

// Generate prompts for multiple NFTs with confidence scoring
export function generatePromptsForBatch(nfts: NFTData[], options?: {
  enableLogging?: boolean;
  deriveFeaturesFromSpectral?: boolean;
}): BatchPromptResult[] {
  return nfts.map(nft => {
    const { prompt, negativePrompt, validation, confidence } = generatePromptForNFT(nft, options);
    return {
      nftId: nft.id,
      nftName: nft.name,
      objectType: nft.objectType || 'Unknown',
      prompt,
      negativePrompt,
      valid: validation.valid,
      warnings: validation.warnings,
      confidence,
    };
  });
}

// Get statistics about a batch of prompts with confidence metrics
export function getBatchStats(results: BatchPromptResult[]): {
  total: number;
  valid: number;
  withWarnings: number;
  byObjectType: Record<string, number>;
  confidence: {
    average: number;
    min: number;
    max: number;
    byFeatureSource: Record<string, number>;
    lowConfidenceCount: number;  // Below 0.5
    highConfidenceCount: number; // Above 0.8
  };
} {
  if (results.length === 0) {
    return {
      total: 0,
      valid: 0,
      withWarnings: 0,
      byObjectType: {},
      confidence: {
        average: 0,
        min: 0,
        max: 0,
        byFeatureSource: {},
        lowConfidenceCount: 0,
        highConfidenceCount: 0,
      },
    };
  }

  const confidenceScores = results.map(r => r.confidence.score);
  const byFeatureSource: Record<string, number> = {};

  results.forEach(r => {
    byFeatureSource[r.confidence.featureSource] =
      (byFeatureSource[r.confidence.featureSource] || 0) + 1;
  });

  return {
    total: results.length,
    valid: results.filter(r => r.valid).length,
    withWarnings: results.filter(r => r.warnings.length > 0).length,
    byObjectType: results.reduce((acc, r) => {
      acc[r.objectType] = (acc[r.objectType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    confidence: {
      average: Math.round((confidenceScores.reduce((a, b) => a + b, 0) / results.length) * 100) / 100,
      min: Math.min(...confidenceScores),
      max: Math.max(...confidenceScores),
      byFeatureSource,
      lowConfidenceCount: results.filter(r => r.confidence.score < 0.5).length,
      highConfidenceCount: results.filter(r => r.confidence.score >= 0.8).length,
    },
  };
}

// ============================================
// CONFIDENCE SCORING SYSTEM
// ============================================

export interface ConfidenceFactors {
  hasTemplate: boolean;           // We have a specific template for this object type
  hasExplicitVisualFeatures: boolean;  // Object has stored visualFeatures[] array
  hasSpectralType: boolean;       // Can derive features from spectral class
  hasFamousObjectFeatures: boolean;    // Known object with specific features (e.g., Betelgeuse, Pluto)
  passesValidation: boolean;      // Prompt passes all validation checks
  hasColorDescription: boolean;   // Explicit color information available
  hasStructureDetails: boolean;   // Has specific structure/surface details
}

export interface PromptConfidence {
  score: number;                  // 0.0 to 1.0
  factors: ConfidenceFactors;
  featureSource: 'explicit' | 'spectral' | 'famous' | 'template' | 'default';
  recommendations: string[];      // Suggestions to improve confidence
}

// Calculate confidence score based on available data
export function calculateConfidence(
  objectType: string,
  options: {
    hasExplicitVisualFeatures: boolean;
    hasSpectralType: boolean;
    hasFamousFeatures: boolean;
    hasColorDescription: boolean;
    hasStructureDetails: boolean;
    validationWarnings: string[];
  }
): PromptConfidence {
  const hasTemplate = objectType in PROMPT_TEMPLATES;
  const passesValidation = options.validationWarnings.length === 0;

  const factors: ConfidenceFactors = {
    hasTemplate,
    hasExplicitVisualFeatures: options.hasExplicitVisualFeatures,
    hasSpectralType: options.hasSpectralType,
    hasFamousObjectFeatures: options.hasFamousFeatures,
    passesValidation,
    hasColorDescription: options.hasColorDescription,
    hasStructureDetails: options.hasStructureDetails,
  };

  // Calculate weighted score
  let score = 0;
  const weights = {
    hasTemplate: 0.15,
    hasExplicitVisualFeatures: 0.25,  // Highest weight - explicit features are best
    hasSpectralType: 0.15,
    hasFamousObjectFeatures: 0.20,
    passesValidation: 0.10,
    hasColorDescription: 0.08,
    hasStructureDetails: 0.07,
  };

  for (const [key, weight] of Object.entries(weights)) {
    if (factors[key as keyof ConfidenceFactors]) {
      score += weight;
    }
  }

  // Determine feature source (priority order)
  let featureSource: PromptConfidence['featureSource'];
  if (options.hasExplicitVisualFeatures) {
    featureSource = 'explicit';
  } else if (options.hasFamousFeatures) {
    featureSource = 'famous';
  } else if (options.hasSpectralType && objectType === 'Star') {
    featureSource = 'spectral';
  } else if (hasTemplate) {
    featureSource = 'template';
  } else {
    featureSource = 'default';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (!options.hasExplicitVisualFeatures) {
    recommendations.push('Add explicit visualFeatures[] for best results');
  }
  if (!options.hasSpectralType && objectType === 'Star') {
    recommendations.push('Add spectral type for automatic feature derivation');
  }
  if (!passesValidation) {
    recommendations.push(`Fix ${options.validationWarnings.length} validation warning(s)`);
  }
  if (!options.hasColorDescription && !options.hasSpectralType) {
    recommendations.push('Add color description for accurate rendering');
  }

  return {
    score: Math.round(score * 100) / 100,  // Round to 2 decimal places
    factors,
    featureSource,
    recommendations,
  };
}

// ============================================
// SPECTRAL CLASS → VISUAL FEATURES PIPELINE
// ============================================

// Parse spectral type string into components
export interface ParsedSpectralType {
  class: string;           // O, B, A, F, G, K, M, L, T, Y
  subclass?: number;       // 0-9
  luminosityClass?: string; // Ia, Ib, II, III, IV, V
  peculiarities?: string[]; // e (emission), p (peculiar), etc.
}

export function parseSpectralType(spectralType: string): ParsedSpectralType | null {
  if (!spectralType) return null;

  const normalized = spectralType.toUpperCase().trim();

  // Match pattern: Letter + optional digit + optional luminosity + optional peculiarities
  // Examples: G2V, M1-2Ia-Iab, K5III, O9.5Ia, B2Ve
  const match = normalized.match(/^([OBAFGKMLTY])(\d(?:\.\d)?)?(?:-\d)?([IV]+[a-z]*)?([epnmksvw]*)?$/i);

  if (!match) {
    // Try simpler pattern
    const simpleMatch = normalized.match(/^([OBAFGKMLTY])/);
    if (simpleMatch) {
      return { class: simpleMatch[1] };
    }
    return null;
  }

  const result: ParsedSpectralType = {
    class: match[1],
  };

  if (match[2]) {
    result.subclass = parseFloat(match[2]);
  }

  if (match[3]) {
    result.luminosityClass = match[3];
  }

  if (match[4]) {
    result.peculiarities = match[4].split('');
  }

  return result;
}

// Derive comprehensive visual features from spectral type
export function deriveVisualFeaturesFromSpectralType(
  spectralType: string,
  objectName?: string
): string[] {
  const parsed = parseSpectralType(spectralType);
  if (!parsed) return [];

  const features: string[] = [];

  // Determine if supergiant/giant/dwarf
  const lumClass = parsed.luminosityClass?.toUpperCase() || '';
  const isSupergiant = lumClass.includes('I') && !lumClass.includes('II') && !lumClass.includes('V');
  const isBrightGiant = lumClass.includes('II') && !lumClass.includes('III');
  const isGiant = lumClass.includes('III');
  const isSubgiant = lumClass.includes('IV');
  const isMainSequence = lumClass.includes('V') || (!lumClass && !isSupergiant && !isGiant);

  // Spectral class-based features
  switch (parsed.class) {
    case 'O':
      features.push('Brilliant intense blue-white plasma sphere');
      features.push('Fine subtle granulation texture');
      features.push('Few small starspots from minimal convection');
      features.push('Intense stellar wind creating subtle haze at limb');
      if (isSupergiant) {
        features.push('Massive luminous blue supergiant');
      }
      break;

    case 'B':
      features.push('Blue-white plasma sphere with violet undertones');
      features.push('Fine subtle granulation texture');
      features.push('Few small starspots');
      features.push('Magnetic prominences at limb');
      if (isSupergiant) {
        features.push('Blue supergiant with extreme luminosity');
      }
      break;

    case 'A':
      features.push('Brilliant white stellar surface');
      features.push('Fine subtle granulation texture');
      features.push('Rare small starspots');
      features.push('Delicate wispy magnetic prominences at limb');
      break;

    case 'F':
      features.push('Warm cream-white plasma sphere');
      features.push('Visible clear granulation texture');
      features.push('Scattered dark starspots');
      features.push('Moderate magnetic prominences at limb');
      break;

    case 'G':
      features.push('Golden-yellow plasma sphere');
      features.push('Visible clear granulation texture like solar imagery');
      features.push('Scattered dark starspots');
      features.push('Moderate magnetic prominences');
      if (isSupergiant) {
        features.push('Yellow supergiant with expanded atmosphere');
      }
      break;

    case 'K':
      features.push('Warm orange plasma sphere');
      features.push('Prominent granulation texture');
      features.push('Moderate dark starspot activity');
      features.push('Prominent magnetic loop prominences');
      if (isGiant) {
        features.push('Orange giant with extended atmosphere');
      }
      break;

    case 'M':
      if (isSupergiant) {
        features.push('Brilliant incandescent scarlet-orange plasma sphere');
        features.push('Giant coarse mottled granulation with large convection cells');
        features.push('Large dark starspot groups covering significant surface area');
        features.push('Dramatic magnetic prominences, faint dusty envelope from mass loss');
      } else if (isGiant) {
        features.push('Deep red-orange giant plasma sphere');
        features.push('Prominent granulation texture');
        features.push('Moderate to large starspot groups');
        features.push('Prominent magnetic loop prominences');
      } else {
        // Red dwarf
        features.push('Deep scarlet-red plasma sphere');
        features.push('Prominent granulation texture');
        features.push('Large dark starspot groups covering significant surface area');
        features.push('Extensive magnetic loop prominences');
      }
      break;

    case 'L':
      features.push('Dark red-brown substellar surface');
      features.push('Atmospheric bands visible');
      features.push('Faint self-luminous infrared glow');
      break;

    case 'T':
      features.push('Magenta-brown substellar surface');
      features.push('Strong atmospheric banding');
      features.push('Methane absorption features');
      features.push('Faint infrared glow');
      break;

    case 'Y':
      features.push('Dark brown substellar surface');
      features.push('Cloud patterns in atmosphere');
      features.push('Ammonia and water clouds');
      features.push('Very faint infrared glow');
      break;
  }

  // Add peculiarity features
  if (parsed.peculiarities) {
    if (parsed.peculiarities.includes('E')) {
      features.push('Emission lines indicating active stellar wind');
    }
    if (parsed.peculiarities.includes('P')) {
      features.push('Peculiar spectral features');
    }
    if (parsed.peculiarities.includes('V')) {
      features.push('Variable brightness with periodic fluctuations');
    }
  }

  // Check for known flare star indicators
  const lowerName = (objectName || '').toLowerCase();
  if (lowerName.includes('proxima') || lowerName.includes('flare') ||
      lowerName.includes('uv ceti') || lowerName.includes('wolf')) {
    features.push('Extensive magnetic loop prominences erupting from limb');
    features.push('Violent surface activity from intense flare episodes');
  }

  return features;
}

// ============================================
// GENERATION LOGGING
// ============================================

export interface PromptGenerationLog {
  timestamp: Date;
  nftId?: number;
  nftName: string;
  objectType: string;
  confidence: PromptConfidence;
  promptLength: number;
  validationWarnings: string[];
  featureSourceDetails: {
    source: string;
    featuresUsed: string[];
  };
  duration?: number;  // ms
}

// Simple in-memory log store (can be extended to persist)
const generationLogs: PromptGenerationLog[] = [];
const MAX_LOG_SIZE = 10000;

export function logPromptGeneration(log: PromptGenerationLog): void {
  generationLogs.push(log);
  // Keep log size bounded
  if (generationLogs.length > MAX_LOG_SIZE) {
    generationLogs.shift();
  }
}

export function getGenerationLogs(options?: {
  limit?: number;
  objectType?: string;
  minConfidence?: number;
  hasWarnings?: boolean;
}): PromptGenerationLog[] {
  let logs = [...generationLogs];

  if (options?.objectType) {
    logs = logs.filter(l => l.objectType === options.objectType);
  }
  if (options?.minConfidence !== undefined) {
    logs = logs.filter(l => l.confidence.score >= options.minConfidence);
  }
  if (options?.hasWarnings !== undefined) {
    logs = logs.filter(l =>
      options.hasWarnings ? l.validationWarnings.length > 0 : l.validationWarnings.length === 0
    );
  }
  if (options?.limit) {
    logs = logs.slice(-options.limit);
  }

  return logs;
}

export function getGenerationStats(): {
  totalGenerated: number;
  averageConfidence: number;
  byObjectType: Record<string, { count: number; avgConfidence: number }>;
  byFeatureSource: Record<string, number>;
  warningRate: number;
} {
  if (generationLogs.length === 0) {
    return {
      totalGenerated: 0,
      averageConfidence: 0,
      byObjectType: {},
      byFeatureSource: {},
      warningRate: 0,
    };
  }

  const byObjectType: Record<string, { count: number; totalConfidence: number }> = {};
  const byFeatureSource: Record<string, number> = {};
  let totalConfidence = 0;
  let withWarnings = 0;

  for (const log of generationLogs) {
    totalConfidence += log.confidence.score;
    if (log.validationWarnings.length > 0) withWarnings++;

    if (!byObjectType[log.objectType]) {
      byObjectType[log.objectType] = { count: 0, totalConfidence: 0 };
    }
    byObjectType[log.objectType].count++;
    byObjectType[log.objectType].totalConfidence += log.confidence.score;

    byFeatureSource[log.confidence.featureSource] =
      (byFeatureSource[log.confidence.featureSource] || 0) + 1;
  }

  const result: Record<string, { count: number; avgConfidence: number }> = {};
  for (const [type, data] of Object.entries(byObjectType)) {
    result[type] = {
      count: data.count,
      avgConfidence: Math.round((data.totalConfidence / data.count) * 100) / 100,
    };
  }

  return {
    totalGenerated: generationLogs.length,
    averageConfidence: Math.round((totalConfidence / generationLogs.length) * 100) / 100,
    byObjectType: result,
    byFeatureSource,
    warningRate: Math.round((withWarnings / generationLogs.length) * 100) / 100,
  };
}

export function clearGenerationLogs(): void {
  generationLogs.length = 0;
}

// ============================================
// KNOWN LIMITATIONS
// ============================================

export const KNOWN_LIMITATIONS = {
  // Objects that require special handling or have known issues
  barredSpiral: {
    description: 'Barred spiral galaxies cannot be accurately rendered - bar structure will not appear',
    workaround: 'Use as generic spiral galaxy, or use image-to-image with reference photo',
    affectedTypes: ['barred spiral'],
  },
  // Semantic shifts used to avoid diagram associations
  semanticShifts: {
    'Pulsar': 'hot white dwarf star',
    'Magnetar': 'intensely hot white dwarf star',
    'Neutron Star': 'hot white dwarf star',
  },
  // Terms that trigger diagram/artistic rendering
  triggerTermsToAvoid: [
    'radiation beams', 'magnetic field lines', 'synchrotron',
    'composite imagery', 'visualization', 'pulsar', 'neutron star',
  ],
};
