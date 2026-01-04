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

// Object-specific negatives (absolute terms - no "excessive" or "oversaturated")
export const OBJECT_TYPE_NEGATIVES: Record<string, string[]> = {
  'Star': [
    'glass', 'transparent', 'sphere inside sphere', 'portal', 'orb', 'marble',
    'crystal ball', 'galaxy', 'nebula', 'ring', 'halo', 'corona', 'eclipse',
    'universe', 'cosmic', 'mystical', 'ethereal', 'dark center', 'planet',
    'crescent', 'moon', 'sunset', 'sunrise',
  ],
  'Galaxy': [
    'nebula overlay', 'lens flare', 'planets in foreground', 'moon', 'satellite',
    'multiple galaxies', 'artistic interpretation', 'swirl effect',
  ],
  'Barred Spiral Galaxy': [
    'nebula overlay', 'lens flare', 'planets in foreground', 'moon', 'satellite',
    'multiple galaxies', 'artistic interpretation', 'swirl effect',
    'standard spiral', 'arms from center', // Explicitly exclude wrong galaxy type
  ],
  'Black Hole': [
    'planet', 'planetary surface', 'galaxy inside', 'multiple objects',
    'symmetrical glow', 'eye', 'portal', 'wormhole', 'sphere', 'marble',
    'blue glow', 'ring of fire',
  ],
  'Nebula': [
    'lens flare', 'planets in foreground', 'artificial looking',
  ],
  'Supernova Remnant': [
    'planet', 'galaxy', 'black hole',
  ],
  'Planet': [
    'rings', 'moons', 'lens flare', 'alien structures',
  ],
  'Exoplanet': [
    'rings', 'moons', 'lens flare', 'alien structures',
  ],
  // PULSAR: Heavy negatives to prevent diagram/beam/disk rendering
  // Added disk-blocking negatives based on retest results
  'Pulsar': [
    'beams', 'rays', 'jets', 'radiation beams', 'magnetic field lines',
    'synchrotron', 'synchrotron rings', 'field lines', 'emanating',
    'diagram', 'visualization', 'schematic', 'infographic',
    'nebula', 'filaments', 'rings', 'accretion disk',
    'disk', 'protoplanetary', 'edge-on', 'equatorial glow', 'horizontal band',
    'planet', 'galaxy',
  ],
  // MAGNETAR: Same as pulsar - describe appearance not physics
  'Magnetar': [
    'beams', 'rays', 'jets', 'radiation beams', 'magnetic field lines',
    'field distortions', 'synchrotron', 'emanating',
    'diagram', 'visualization', 'schematic',
    'disk', 'protoplanetary', 'edge-on', 'equatorial glow', 'horizontal band',
    'accretion disk', 'rings',
    'planet', 'galaxy', 'nebula',
  ],
  // NEUTRON STAR: Alias for pulsar treatment
  'Neutron Star': [
    'beams', 'rays', 'jets', 'radiation beams', 'magnetic field lines',
    'synchrotron', 'synchrotron rings', 'field lines', 'emanating',
    'diagram', 'visualization', 'schematic', 'infographic',
    'nebula', 'filaments', 'rings', 'accretion disk',
    'disk', 'protoplanetary', 'edge-on', 'equatorial glow', 'horizontal band',
    'planet', 'galaxy',
  ],
  'Quasar': [
    'multiple objects', 'planet',
  ],
  'Comet': [
    'planet', 'galaxy', 'fireball',
  ],
  'Star Cluster': [
    'nebula overlay', 'single star focus', 'galaxy',
  ],
  // FALLBACK
  'Unknown': [
    'lens flare', 'artistic interpretation',
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
    objectDescription: 'a hot {subType} stellar surface',
    visualCharacteristics: 'Brilliant incandescent plasma sphere, visible granulation cells on surface, small dark starspots, solid opaque luminous surface, single star filling 40% of frame, black space background',
    styleReference: 'NASA Solar Dynamics Observatory solar imaging',
    colorDescription: 'Intense white core, {starColor} limb, orange granulation hints',
    lighting: 'Self-luminous stellar surface',
    quality: '8K, ultra high definition',
    medium: 'Space telescope ultraviolet photography',
  },
  'Galaxy': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: '{name}, a {galaxyType} galaxy',
    visualCharacteristics: '{structureDetails}, bright central bulge, blue star-forming regions in outer arms, galaxy centered in frame occupying 50% of image, face-on view, deep space background with distant stars',
    styleReference: 'NASA Hubble Space Telescope imagery',
    colorDescription: '{galaxyColor}',
    lighting: 'Natural',
    quality: '8K, ultra high definition',
    medium: 'Telescope photography',
  },
  'Black Hole': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: '{name}, a {subType} black hole',
    visualCharacteristics: 'Dark circular event horizon, bright asymmetric accretion disk with turbulent orange-yellow plasma, gravitational lensing warping background stars, Doppler beaming with one side brighter, single isolated subject centered in frame',
    styleReference: 'NASA Event Horizon Telescope imagery',
    colorDescription: 'Orange-gold accretion disk plasma, deep black event horizon',
    lighting: 'Accretion disk illumination',
    quality: '8K, ultra high definition',
    medium: 'Radio telescope imagery',
  },
  'Nebula': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: '{name}, a {nebulaType} nebula',
    visualCharacteristics: '{colorDescription} gas clouds, {structureDetails}, stars visible within and behind the nebula, nebula centered in frame occupying 50-60% of image, deep space background',
    styleReference: 'NASA Hubble Space Telescope imagery',
    colorDescription: '{nebulaColor}',
    lighting: 'Illuminated by internal/nearby stars',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  'Supernova Remnant': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: '{name}, a supernova remnant',
    visualCharacteristics: 'Expanding filamentary shell structure, shocked gas filaments, colorful emission from different elements, remnant centered in frame, deep space background',
    styleReference: 'NASA Hubble Space Telescope imagery',
    colorDescription: 'Multicolored filaments with red hydrogen, blue oxygen, green sulfur emissions',
    lighting: 'Self-luminous shocked gas',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  'Planet': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: '{name}, a {planetType}',
    visualCharacteristics: '{surfaceFeatures}, planet centered in frame occupying 60% of image, visible against deep space background with stars',
    styleReference: 'NASA planetary photography',
    colorDescription: '{planetColor}',
    lighting: 'Sunlit with terminator shadow',
    quality: '8K, ultra high definition',
    medium: 'Space probe photography',
  },
  'Exoplanet': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: '{name}, an exoplanet',
    visualCharacteristics: '{surfaceFeatures}, planet centered in frame occupying 60% of image, illuminated by parent star glow on horizon, visible against deep space background',
    styleReference: 'NASA exoplanet imagery',
    colorDescription: '{planetColor}',
    lighting: 'Illuminated by parent star',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  // PULSAR/MAGNETAR/NEUTRON STAR: Use "hot white dwarf" terminology
  // KEY LEARNING: "pulsar" and "neutron star" trigger diagram-style rendering
  // "white dwarf" has cleaner training data associations (simple glowing sphere)
  'Pulsar': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a hot white dwarf star',  // Semantic shift to avoid diagram associations
    visualCharacteristics: 'Small intensely luminous stellar sphere, brilliant white-blue surface, subtle warm glow halo around sphere, clean simple spherical shape, single star centered in frame with space around it, deep space starfield background',
    styleReference: 'NASA Hubble Space Telescope stellar imagery',
    colorDescription: 'Brilliant white-blue stellar surface with soft orange-gold outer glow',
    lighting: 'Self-luminous',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  'Magnetar': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'an intensely hot white dwarf star',  // Semantic shift
    visualCharacteristics: 'Small intensely luminous stellar sphere, brilliant white-blue surface, intense warm glow halo around sphere, clean simple spherical shape, single star centered in frame with space around it, deep space starfield background',
    styleReference: 'NASA Hubble Space Telescope stellar imagery',
    colorDescription: 'Brilliant white-blue stellar surface with intense orange-gold outer glow',
    lighting: 'Self-luminous',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  'Neutron Star': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: 'a hot white dwarf star',  // Semantic shift
    visualCharacteristics: 'Small intensely luminous stellar sphere, brilliant white-blue surface, subtle warm glow halo around sphere, clean simple spherical shape, single star centered in frame with space around it, deep space starfield background',
    styleReference: 'NASA Hubble Space Telescope stellar imagery',
    colorDescription: 'Brilliant white-blue stellar surface with soft orange-gold outer glow',
    lighting: 'Self-luminous',
    quality: '8K, ultra high definition',
    medium: 'Space telescope photography',
  },
  'Quasar': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: '{name}, a quasar',
    visualCharacteristics: 'Brilliant point-like active nucleus centered in frame, visible relativistic jet extending outward, faint host galaxy, deep space background',
    styleReference: 'NASA Hubble Space Telescope imagery',
    colorDescription: 'Intense white-blue nucleus, orange-gold jet, faint galactic halo',
    lighting: 'Intensely self-luminous nucleus',
    quality: '8K, ultra high definition',
    medium: 'Telescope photography',
  },
  'Comet': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: '{name}, a comet',
    visualCharacteristics: 'Bright irregular nucleus centered in frame, visible curved dust tail, straight blue ion tail, glowing coma, starfield background',
    styleReference: 'NASA spacecraft photography',
    colorDescription: 'White-gray nucleus, golden dust tail, blue ion tail',
    lighting: 'Sunlit with tail pointing away from Sun',
    quality: '8K, ultra high definition',
    medium: 'Space probe and telescope imagery',
  },
  'Star Cluster': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: '{name}, a {subType} star cluster',
    visualCharacteristics: 'Dense concentration of stars centered in frame, varied stellar colors from blue to orange, gravitationally bound grouping, deep space background',
    styleReference: 'NASA Hubble Space Telescope imagery',
    colorDescription: 'Mixed stellar colors - blue hot stars, yellow sun-like stars, orange and red cooler stars',
    lighting: 'Natural stellar luminosity',
    quality: '8K, ultra high definition',
    medium: 'Telescope photography',
  },
  'Moon': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: '{name}, a moon',
    visualCharacteristics: '{surfaceFeatures}, crater impacts visible, moon centered in frame occupying 60% of image, reflected light creating surface detail, space background with parent planet possible',
    styleReference: 'NASA spacecraft photography',
    colorDescription: '{surfaceColor}',
    lighting: 'Reflected sunlight with terminator shadow',
    quality: '8K, ultra high definition',
    medium: 'Space probe photography',
  },
  // FALLBACK: Default template for unknown object types
  'Unknown': {
    realismStatement: 'Photorealistic photograph',
    objectDescription: '{name}, an astronomical object',
    visualCharacteristics: 'Detailed celestial object, centered in frame with space around it, deep space starfield background',
    styleReference: 'NASA Hubble Space Telescope imagery',
    colorDescription: 'Natural astronomical colors',
    lighting: 'Natural',
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
}

export function buildImagePrompt(options: PromptBuildOptions): { prompt: string; negativePrompt: string } {
  const {
    name,
    objectType,
    description,
    spectralType,
    mass,
    notableFeatures,
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

  // Build object description
  let objectDesc = template.objectDescription
    .replace('{name}', name)
    .replace('{galaxyType}', galaxyType || 'spiral')
    .replace('{nebulaType}', nebulaType || 'emission')
    .replace('{planetType}', planetType || 'planet')
    .replace('{subType}', subType || '');

  // Build visual characteristics
  let visualChars = customVisualCharacteristics || template.visualCharacteristics;

  // Add notable features if available
  let featuresText = '';
  if (notableFeatures && notableFeatures.length > 0) {
    featuresText = notableFeatures.slice(0, 2).join(', ');
  }

  visualChars = visualChars
    .replace('{structureDetails}', structureDetails || 'detailed structure')
    .replace('{surfaceFeatures}', surfaceFeatures || 'detailed surface features')
    .replace('{colorDescription}', color)
    .replace('{typeFeatures}', getTypeFeatures(objectType, galaxyType, nebulaType))
    .replace('{lightingDescription}', 'natural lighting with visible terminator');

  // Build color description
  let colorDesc = template.colorDescription
    .replace('{starColor}', color)
    .replace('{galaxyColor}', color)
    .replace('{nebulaColor}', color)
    .replace('{planetColor}', color);

  // Construct the full prompt following the document structure
  const prompt = `${template.realismStatement} of ${objectDesc}.

Visual characteristics: ${visualChars}

Style: ${styleRef.style}
Colors: ${colorDesc}
Lighting: ${template.lighting}
Quality: ${template.quality}
Medium: ${styleRef.medium}`;

  // Get negative prompt (pass galaxyType for barred spiral special handling)
  const negativePrompt = getNegativePrompt(objectType, galaxyType);

  return {
    prompt: prompt.trim(),
    negativePrompt: `--no ${negativePrompt}`,
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

  return {
    name: nft.name,
    objectType: nft.objectType || 'Unknown',
    description: nft.description,
    spectralType: nft.spectralType,
    mass: nft.massSolar,
    notableFeatures: features,
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

// Generate prompt for a single NFT
export function generatePromptForNFT(nft: NFTData): {
  prompt: string;
  negativePrompt: string;
  validation: { valid: boolean; warnings: string[] };
} {
  const options = nftToPromptOptions(nft);
  const { prompt, negativePrompt } = buildImagePrompt(options);
  const validation = validatePrompt(prompt);

  return { prompt, negativePrompt, validation };
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
}

// Generate prompts for multiple NFTs
export function generatePromptsForBatch(nfts: NFTData[]): BatchPromptResult[] {
  return nfts.map(nft => {
    const { prompt, negativePrompt, validation } = generatePromptForNFT(nft);
    return {
      nftId: nft.id,
      nftName: nft.name,
      objectType: nft.objectType || 'Unknown',
      prompt,
      negativePrompt,
      valid: validation.valid,
      warnings: validation.warnings,
    };
  });
}

// Get statistics about a batch of prompts
export function getBatchStats(results: BatchPromptResult[]): {
  total: number;
  valid: number;
  withWarnings: number;
  byObjectType: Record<string, number>;
} {
  const stats = {
    total: results.length,
    valid: results.filter(r => r.valid).length,
    withWarnings: results.filter(r => r.warnings.length > 0).length,
    byObjectType: {} as Record<string, number>,
  };

  results.forEach(r => {
    stats.byObjectType[r.objectType] = (stats.byObjectType[r.objectType] || 0) + 1;
  });

  return stats;
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
