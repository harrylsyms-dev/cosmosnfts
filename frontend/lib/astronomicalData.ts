// Real Astronomical Data from NASA, ESA, and scientific catalogs
// Sources: NASA Exoplanet Archive, SIMBAD, Messier Catalog, NGC/IC Catalogs
// TEST MODE: 2 objects per type for image generation testing

export interface AstronomicalObject {
  name: string;
  alternateNames?: string[];
  objectType: string;
  description: string;
  constellation?: string;
  distanceLy?: number; // Distance in light years
  distanceDisplay?: string; // Human-readable distance
  mass?: number; // In solar masses or Earth masses depending on type
  radius?: number; // In solar radii or Earth radii
  temperature?: number; // In Kelvin
  luminosity?: number; // In solar luminosities
  discoveryYear?: number;
  discoverer?: string;
  spectralType?: string; // For stars: O, B, A, F, G, K, M with subclass
  magnitude?: number; // Apparent magnitude
  absoluteMagnitude?: number;
  age?: number; // In billions of years
  notableFeatures?: string[];
  scientificSignificance?: string;

  // Image generation specific fields
  subType?: string;
  galaxyType?: string;
  nebulaType?: string;
  planetType?: string;
  surfaceFeatures?: string;
  atmosphereDescription?: string;
  structureDetails?: string;
  colorDescription?: string;
  visualCharacteristics?: string;
  imageStyleReference?: string;

  // NEW: Visual features for AI image generation
  // These are specific visual characteristics that should appear in the generated image
  visualFeatures?: string[];
}

// ============================================
// STARS - 2 representatives
// ============================================
export const REAL_STARS: AstronomicalObject[] = [
  {
    name: "Sirius",
    alternateNames: ["Alpha Canis Majoris", "Dog Star"],
    objectType: "Star",
    description: "The brightest star in Earth's night sky. A binary star system consisting of a main-sequence star Sirius A and a faint white dwarf companion Sirius B.",
    constellation: "Canis Major",
    distanceLy: 8.6,
    mass: 2.06,
    temperature: 9940,
    luminosity: 25.4,
    magnitude: -1.46,
    spectralType: "A1V",
    notableFeatures: ["Brightest star visible from Earth", "Binary system with white dwarf companion"],
    scientificSignificance: "Used for navigation since ancient times",
    // Visual features for image generation
    visualFeatures: [
      "Brilliant incandescent white plasma sphere",
      "Fine subtle granulation texture on surface",
      "Ice-blue limb glow",
      "Few small starspots"
    ],
    colorDescription: "Brilliant white surface, ice-blue limb, faint orange-copper hints in rare active regions"
  },
  {
    name: "Betelgeuse",
    alternateNames: ["Alpha Orionis"],
    objectType: "Star",
    description: "A red supergiant star and one of the largest stars visible to the naked eye. Expected to explode as a supernova within the next million years.",
    constellation: "Orion",
    distanceLy: 700,
    mass: 16.5,
    temperature: 3600,
    luminosity: 126000,
    spectralType: "M1-2Ia-Iab",
    notableFeatures: ["One of the largest known stars", "Will explode as supernova"],
    scientificSignificance: "Key object for studying stellar evolution",
    // Visual features for image generation
    visualFeatures: [
      "Brilliant incandescent scarlet-orange plasma sphere",
      "Prominent granulation texture with large convection cells",
      "Large dark starspot groups covering significant surface area",
      "Prominent magnetic loop prominences at limb"
    ],
    colorDescription: "Deep scarlet-orange surface, rust-crimson limb, darker rust-brown convection cell boundaries, bright orange-yellow hot spots"
  },
];

// ============================================
// NEBULAE - 2 representatives
// ============================================
export const NEBULAE: AstronomicalObject[] = [
  {
    name: "Orion Nebula",
    alternateNames: ["M42", "NGC 1976"],
    objectType: "Nebula",
    nebulaType: "emission",
    description: "The closest region of massive star formation to Earth. A stellar nursery where new stars are being born.",
    constellation: "Orion",
    distanceLy: 1344,
    magnitude: 4.0,
    notableFeatures: ["Closest massive star-forming region", "Contains Trapezium Cluster"],
    scientificSignificance: "Prime laboratory for studying star formation",
    visualFeatures: [
      "Red hydrogen-alpha emission dominant",
      "Blue reflection regions around hot stars",
      "Golden ionization fronts in gas clouds",
      "Trapezium star cluster illuminating central cavity",
      "Dark dust lanes silhouetted against glowing gas"
    ],
    colorDescription: "Red hydrogen-alpha, blue reflection regions, golden ionization fronts"
  },
  {
    name: "Ring Nebula",
    alternateNames: ["M57", "NGC 6720"],
    objectType: "Nebula",
    nebulaType: "planetary",
    description: "A planetary nebula created when a Sun-like star expelled its outer layers at the end of its life.",
    constellation: "Lyra",
    distanceLy: 2300,
    magnitude: 8.8,
    notableFeatures: ["Classic ring shape", "Visible white dwarf at center"],
    scientificSignificance: "Prototype planetary nebula",
    visualFeatures: [
      "Distinct torus ring structure",
      "Green-blue oxygen emission in inner core",
      "Red outer hydrogen ring",
      "Bright central white dwarf star visible",
      "Faint outer halo extending beyond main ring"
    ],
    colorDescription: "Green-blue oxygen core, red outer hydrogen ring, white central star"
  },
];

// ============================================
// GALAXIES - 2 representatives
// ============================================
export const GALAXIES: AstronomicalObject[] = [
  {
    name: "Andromeda Galaxy",
    alternateNames: ["M31", "NGC 224"],
    objectType: "Galaxy",
    galaxyType: "spiral",
    description: "The nearest major galaxy to the Milky Way. Contains about 1 trillion stars.",
    constellation: "Andromeda",
    distanceLy: 2537000,
    magnitude: 3.44,
    mass: 1500000000000,
    notableFeatures: ["Nearest major galaxy", "Will collide with Milky Way"],
    scientificSignificance: "Key for understanding galaxy structure",
    visualFeatures: [
      "Sweeping spiral arms originating from bright central bulge",
      "Dark dust lanes threading through spiral arms",
      "Blue star-forming regions in outer spiral arms",
      "Warm golden central bulge with older stars",
      "Companion satellite galaxies M32 and M110 nearby"
    ],
    colorDescription: "Warm gold central region, blue star-forming regions in spiral arms, dark dust lanes"
  },
  {
    name: "Whirlpool Galaxy",
    alternateNames: ["M51", "NGC 5194"],
    objectType: "Galaxy",
    galaxyType: "spiral",
    description: "A grand-design spiral galaxy interacting with its smaller companion NGC 5195.",
    constellation: "Canes Venatici",
    distanceLy: 23000000,
    magnitude: 8.4,
    notableFeatures: ["Classic spiral structure", "Interacting with companion galaxy"],
    scientificSignificance: "Key for studying galaxy interactions",
    visualFeatures: [
      "Grand-design spiral with two prominent well-defined arms",
      "Companion galaxy NGC 5195 connected by tidal bridge",
      "Blue star-forming regions along spiral arms",
      "Bright golden nucleus",
      "Dark dust lanes outlining spiral structure"
    ],
    colorDescription: "Golden core, blue spiral arms with pink star-forming regions, interacting companion"
  },
];

// ============================================
// STAR CLUSTERS - 2 representatives (open clusters)
// ============================================
export const STAR_CLUSTERS: AstronomicalObject[] = [
  {
    name: "Pleiades",
    alternateNames: ["M45", "Seven Sisters"],
    objectType: "Star Cluster",
    subType: "open",
    description: "The most famous open star cluster in the sky. Known since antiquity, containing hot blue stars.",
    constellation: "Taurus",
    distanceLy: 444,
    magnitude: 1.6,
    age: 0.1,
    notableFeatures: ["Most famous star cluster", "Reflection nebulosity"],
    scientificSignificance: "Key calibrator for stellar distances",
    visualFeatures: [
      "Bright blue-white young hot stars",
      "Wispy blue reflection nebulosity around stars",
      "Loose open arrangement of approximately seven bright stars",
      "Fainter cluster members visible surrounding main stars"
    ],
    colorDescription: "Brilliant blue-white stars with blue reflection nebulosity"
  },
  {
    name: "Hyades",
    alternateNames: ["Caldwell 41", "Melotte 25"],
    objectType: "Star Cluster",
    subType: "open",
    description: "The nearest open cluster to Earth and one of the best-studied star clusters. Forms the V-shape of the Bull's face in Taurus.",
    constellation: "Taurus",
    distanceLy: 153,
    magnitude: 0.5,
    age: 0.625,
    notableFeatures: ["Nearest open cluster", "Forms Bull's face in Taurus"],
    scientificSignificance: "Fundamental calibrator for cosmic distance ladder",
    visualFeatures: [
      "V-shaped arrangement of orange and yellow stars",
      "Scattered loose cluster arrangement",
      "Mixed stellar colors from blue to orange",
      "Aldebaran prominent but not a member"
    ],
    colorDescription: "Orange and yellow older stars, scattered arrangement"
  },
];

// ============================================
// GLOBULAR CLUSTERS - 2 representatives
// ============================================
export const GLOBULAR_CLUSTERS: AstronomicalObject[] = [
  {
    name: "Omega Centauri",
    alternateNames: ["NGC 5139"],
    objectType: "Globular Cluster",
    description: "The largest and brightest globular cluster in the Milky Way. May be the remnant core of a dwarf galaxy.",
    constellation: "Centaurus",
    distanceLy: 15800,
    magnitude: 3.9,
    age: 12,
    mass: 4000000,
    notableFeatures: ["Largest Milky Way globular", "10 million stars"],
    scientificSignificance: "Possibly a captured dwarf galaxy nucleus",
    visualFeatures: [
      "Extremely dense spherical concentration of 10 million ancient stars",
      "Brilliant crowded core with unresolved stellar density",
      "Gradual density falloff toward outer edges",
      "Multiple stellar populations with varied colors",
      "Scattered blue stragglers among ancient red giants"
    ],
    colorDescription: "Mixed stellar colors - predominantly warm orange-red ancient stars, scattered blue stragglers"
  },
  {
    name: "47 Tucanae",
    alternateNames: ["NGC 104"],
    objectType: "Globular Cluster",
    description: "The second-brightest globular cluster after Omega Centauri. Contains millions of ancient stars.",
    constellation: "Tucana",
    distanceLy: 14700,
    magnitude: 4.09,
    age: 12.75,
    notableFeatures: ["Second brightest globular", "Contains millisecond pulsars"],
    scientificSignificance: "Important for studying stellar dynamics",
    visualFeatures: [
      "Dense spherical concentration of millions of ancient stars",
      "Brilliant crowded core with thousands of individual stars resolved",
      "Gradual density falloff toward edges",
      "Varied stellar colors from blue stragglers to red giants"
    ],
    colorDescription: "Mixed stellar colors - predominantly warm orange-red ancient stars, yellow sun-like stars, scattered blue stragglers"
  },
];

// ============================================
// EXOPLANETS - 2 representatives
// ============================================
export const EXOPLANETS: AstronomicalObject[] = [
  {
    name: "Proxima Centauri b",
    alternateNames: ["Proxima b"],
    objectType: "Exoplanet",
    planetType: "terrestrial",
    description: "The closest known exoplanet to Earth, orbiting in the habitable zone of our nearest stellar neighbor.",
    constellation: "Centaurus",
    distanceLy: 4.24,
    mass: 1.17,
    temperature: 234,
    discoveryYear: 2016,
    notableFeatures: ["Closest known exoplanet", "In habitable zone"],
    scientificSignificance: "Primary target for interstellar missions",
    visualFeatures: [
      "Rocky terrestrial surface with possible craters",
      "Red dwarf star Proxima Centauri illuminating one side",
      "Possible tidally locked with permanent day/night sides",
      "Rocky gray and brown terrain"
    ],
    colorDescription: "Rocky grays and browns, possible rust-red iron oxides, red-tinted starlight"
  },
  {
    name: "TRAPPIST-1e",
    objectType: "Exoplanet",
    planetType: "terrestrial",
    description: "One of seven Earth-sized planets in the TRAPPIST-1 system. Most likely to support liquid water.",
    constellation: "Aquarius",
    distanceLy: 39,
    mass: 0.69,
    temperature: 246,
    discoveryYear: 2017,
    notableFeatures: ["Most habitable TRAPPIST-1 planet", "Rocky composition"],
    scientificSignificance: "Prime JWST target",
    visualFeatures: [
      "Rocky Earth-like surface",
      "Possible liquid water oceans",
      "Ultra-cool red dwarf star illumination",
      "Sibling planets visible in sky"
    ],
    colorDescription: "Rocky browns and grays, possible blue-green oceans, salmon-pink sky from red dwarf light"
  },
];

// ============================================
// PLANETS (Solar System) - 2 representatives
// ============================================
export const PLANETS: AstronomicalObject[] = [
  {
    name: "Jupiter",
    objectType: "Planet",
    planetType: "gas giant",
    description: "The largest planet in our solar system. A gas giant with a Great Red Spot storm larger than Earth.",
    mass: 317.8, // Earth masses
    radius: 11.2, // Earth radii
    temperature: 165,
    notableFeatures: ["Great Red Spot", "79 known moons", "Strongest magnetic field"],
    surfaceFeatures: "Banded cloud layers, Great Red Spot, swirling storms",
    colorDescription: "Orange and white bands with reddish spot",
    scientificSignificance: "Protects inner planets from asteroids",
    visualFeatures: [
      "Prominent banded cloud layers in orange, white, and tan",
      "Great Red Spot anticyclonic storm prominently visible",
      "Swirling storm systems and turbulent cloud formations",
      "Sharp terminator line between day and night sides",
      "Subtle atmospheric auroras at poles"
    ]
  },
  {
    name: "Saturn",
    objectType: "Planet",
    planetType: "gas giant",
    description: "The ringed planet, famous for its spectacular ring system made of ice and rock particles.",
    mass: 95.2,
    radius: 9.45,
    temperature: 134,
    notableFeatures: ["Spectacular ring system", "82 known moons", "Hexagonal polar storm"],
    surfaceFeatures: "Banded atmosphere, hexagonal north pole, prominent rings",
    colorDescription: "Pale gold with white and brown bands, bright icy rings",
    scientificSignificance: "Most extensive ring system in solar system",
    visualFeatures: [
      "Spectacular ring system with visible Cassini Division gap",
      "Pale gold banded atmosphere with subtle tan and white bands",
      "Bright icy rings casting shadows on planet surface",
      "Oblate spheroid shape from rapid rotation",
      "Hexagonal storm pattern at north pole"
    ]
  },
];

// ============================================
// MOONS - 2 representatives
// ============================================
export const MOONS: AstronomicalObject[] = [
  {
    name: "Europa",
    objectType: "Moon",
    description: "Jupiter's icy moon with a subsurface ocean. One of the most promising places to search for extraterrestrial life.",
    radius: 0.245,
    temperature: 102,
    discoveryYear: 1610,
    discoverer: "Galileo Galilei",
    notableFeatures: ["Subsurface ocean", "Icy crust with cracks", "Potential for life"],
    surfaceFeatures: "Smooth ice surface with reddish-brown lineae cracks",
    colorDescription: "White and tan ice with reddish-brown streaks",
    scientificSignificance: "Prime target for astrobiology",
    visualFeatures: [
      "Smooth white and tan icy surface",
      "Distinctive reddish-brown lineae crack patterns",
      "Chaotic terrain regions where ice has broken and refrozen",
      "Sharp terminator line at day/night boundary",
      "Faint impact craters on young ice surface"
    ]
  },
  {
    name: "Titan",
    objectType: "Moon",
    description: "Saturn's largest moon with a thick atmosphere and liquid methane lakes. The only moon with a dense atmosphere.",
    radius: 0.404,
    temperature: 94,
    discoveryYear: 1655,
    discoverer: "Christiaan Huygens",
    notableFeatures: ["Thick nitrogen atmosphere", "Methane lakes and rivers", "Organic chemistry"],
    surfaceFeatures: "Orange hazy atmosphere, dark hydrocarbon lakes, icy terrain",
    colorDescription: "Orange haze, dark liquid lakes, tan and brown surface",
    scientificSignificance: "Most Earth-like body in solar system",
    visualFeatures: [
      "Thick orange hazy nitrogen atmosphere obscuring surface",
      "Dark hydrocarbon lakes visible through haze near poles",
      "Tan and brown icy terrain beneath atmosphere",
      "Layered atmospheric haze structure at limb",
      "Methane cloud formations"
    ]
  },
];

// ============================================
// DWARF PLANETS - 2 representatives
// ============================================
export const DWARF_PLANETS: AstronomicalObject[] = [
  {
    name: "Pluto",
    objectType: "Dwarf Planet",
    description: "The most famous dwarf planet, once classified as the ninth planet. Features a heart-shaped nitrogen glacier.",
    distanceLy: 0.000627,
    radius: 0.186,
    temperature: 44,
    discoveryYear: 1930,
    discoverer: "Clyde Tombaugh",
    notableFeatures: ["Heart-shaped glacier (Tombaugh Regio)", "5 moons", "Nitrogen atmosphere"],
    surfaceFeatures: "Heart-shaped nitrogen ice plain, reddish terrain, mountains",
    colorDescription: "Tan, reddish-brown, and white ice regions",
    scientificSignificance: "First Kuiper Belt object visited by spacecraft",
    visualFeatures: [
      "Iconic heart-shaped Tombaugh Regio nitrogen ice plain",
      "Sputnik Planitia glacier filling heart's left lobe",
      "Reddish-brown tholins covering highlands",
      "Rugged water-ice mountains (Norgay and Hillary Montes)",
      "Sharp terminator line with distant sun illumination"
    ]
  },
  {
    name: "Eris",
    objectType: "Dwarf Planet",
    description: "The most massive known dwarf planet, slightly more massive than Pluto. Located in the scattered disc.",
    distanceLy: 0.00143,
    radius: 0.182,
    temperature: 42,
    discoveryYear: 2005,
    discoverer: "Mike Brown",
    notableFeatures: ["Most massive dwarf planet", "One moon (Dysnomia)", "Highly reflective surface"],
    surfaceFeatures: "Bright methane ice surface, likely geologically active",
    colorDescription: "Bright white, highly reflective ice",
    scientificSignificance: "Discovery led to redefinition of planet",
    visualFeatures: [
      "Extremely bright highly reflective icy surface",
      "Possible methane frost creating mirror-like appearance",
      "Smooth spherical body with minimal visible features",
      "Very distant faint sun illumination",
      "Small moon Dysnomia possibly visible"
    ]
  },
];

// ============================================
// ASTEROIDS - 2 representatives
// ============================================
export const ASTEROIDS: AstronomicalObject[] = [
  {
    name: "Ceres",
    alternateNames: ["1 Ceres"],
    objectType: "Asteroid",
    description: "The largest object in the asteroid belt, containing about a third of the belt's total mass. Also classified as a dwarf planet.",
    radius: 0.074,
    temperature: 168,
    discoveryYear: 1801,
    discoverer: "Giuseppe Piazzi",
    notableFeatures: ["Largest asteroid", "Bright spots (salt deposits)", "Possible subsurface ocean"],
    surfaceFeatures: "Cratered surface with bright salt deposits, Occator crater",
    colorDescription: "Dark gray with bright white spots",
    scientificSignificance: "First asteroid discovered",
    visualFeatures: [
      "Dark gray heavily cratered surface",
      "Brilliant white salt deposits in Occator crater",
      "Ahuna Mons cryovolcanic mountain",
      "Spherical dwarf planet shape",
      "Sharp terminator line"
    ]
  },
  {
    name: "Vesta",
    alternateNames: ["4 Vesta"],
    objectType: "Asteroid",
    description: "The second-largest asteroid and the brightest visible from Earth. Has a giant impact crater at its south pole.",
    radius: 0.041,
    temperature: 85,
    discoveryYear: 1807,
    discoverer: "Heinrich Wilhelm Olbers",
    notableFeatures: ["Second largest asteroid", "Giant south pole crater", "Differentiated interior"],
    surfaceFeatures: "Heavily cratered, giant Rheasilvia impact basin",
    colorDescription: "Gray and brown with varied terrain",
    scientificSignificance: "Source of HED meteorites on Earth",
    visualFeatures: [
      "Giant Rheasilvia impact basin at south pole",
      "Heavily cratered irregular surface",
      "Central peak in Rheasilvia basin",
      "Varied gray and brown terrain",
      "Grooves and troughs across surface"
    ]
  },
];

// ============================================
// COMETS - 2 representatives
// ============================================
export const COMETS: AstronomicalObject[] = [
  {
    name: "Halley's Comet",
    alternateNames: ["1P/Halley"],
    objectType: "Comet",
    description: "The most famous comet in history, visible from Earth every 75-79 years.",
    discoveryYear: -239,
    notableFeatures: ["Most famous comet", "75-79 year period", "Recorded since 240 BC"],
    scientificSignificance: "First comet proven to be periodic",
    visualFeatures: [
      "Bright solid irregular nucleus",
      "Curved golden dust tail streaming behind",
      "Straight blue ion tail pointing away from sun",
      "Glowing coma envelope around nucleus",
      "Dark nucleus silhouetted against coma glow"
    ],
    colorDescription: "White-gray solid nucleus, golden dust tail, blue ion tail"
  },
  {
    name: "Comet Hale-Bopp",
    alternateNames: ["C/1995 O1"],
    objectType: "Comet",
    description: "One of the most widely observed comets of the 20th century. Visible for a record 18 months.",
    discoveryYear: 1995,
    notableFeatures: ["Visible for 18 months", "Great Comet of 1997", "Two distinct tails"],
    scientificSignificance: "Most observed comet in history",
    visualFeatures: [
      "Exceptionally bright and large nucleus",
      "Two distinct and prominent tails",
      "Brilliant curved yellowish-white dust tail",
      "Straight bright blue ion tail",
      "Large bright coma surrounding nucleus"
    ],
    colorDescription: "Bright white nucleus, yellow-white dust tail, vivid blue ion tail"
  },
];

// ============================================
// BLACK HOLES - 2 representatives
// ============================================
export const BLACK_HOLES: AstronomicalObject[] = [
  {
    name: "Sagittarius A*",
    alternateNames: ["Sgr A*"],
    objectType: "Black Hole",
    subType: "supermassive",
    description: "The supermassive black hole at the center of our Milky Way galaxy. First imaged by the Event Horizon Telescope in 2022.",
    constellation: "Sagittarius",
    distanceLy: 26000,
    mass: 4000000,
    discoveryYear: 1974,
    notableFeatures: ["Our galaxy's central black hole", "First Milky Way black hole imaged"],
    scientificSignificance: "Direct evidence for supermassive black hole",
    visualFeatures: [
      "Dark circular void of event horizon",
      "Bright asymmetric photon ring surrounding void",
      "Orange-gold swirling accretion disk with turbulent plasma",
      "Doppler beaming creating bright and dim sides",
      "Gravitational lensing warping background starlight"
    ],
    colorDescription: "Bright orange-gold plasma, absolute black void at center, lensed blue-shifted light arcs"
  },
  {
    name: "M87*",
    alternateNames: ["Powehi"],
    objectType: "Black Hole",
    subType: "supermassive",
    description: "The first black hole ever directly imaged in 2019. A supermassive black hole 6.5 billion times the Sun's mass.",
    constellation: "Virgo",
    distanceLy: 55000000,
    mass: 6500000000,
    notableFeatures: ["First black hole image", "Powerful relativistic jet"],
    scientificSignificance: "First direct image of a black hole",
    visualFeatures: [
      "Dark circular void of massive event horizon",
      "Bright asymmetric orange photon ring",
      "Turbulent swirling accretion disk plasma",
      "Powerful relativistic jet extending from polar region",
      "Gravitational lensing effects on background"
    ],
    colorDescription: "Bright orange-gold plasma on approaching side, dimmer red on receding side, absolute black void"
  },
];

// ============================================
// PULSARS - 2 representatives
// ============================================
export const PULSARS: AstronomicalObject[] = [
  {
    name: "Crab Pulsar",
    alternateNames: ["PSR B0531+21"],
    objectType: "Pulsar",
    description: "The pulsar at the center of the Crab Nebula, spinning 30 times per second.",
    constellation: "Taurus",
    distanceLy: 6500,
    discoveryYear: 1968,
    notableFeatures: ["30 rotations per second", "Powers Crab Nebula"],
    scientificSignificance: "Best studied young pulsar",
    visualFeatures: [
      "Small intensely luminous compact stellar sphere",
      "Brilliant white-blue opaque surface",
      "Subtle warm glow halo surrounding star",
      "Clean simple spherical shape",
      "Extremely compact stellar remnant"
    ],
    colorDescription: "Brilliant white-blue stellar surface with soft warm outer glow"
  },
  {
    name: "Vela Pulsar",
    alternateNames: ["PSR B0833-45"],
    objectType: "Pulsar",
    description: "One of the brightest radio pulsars. Powers the Vela Supernova Remnant.",
    constellation: "Vela",
    distanceLy: 815,
    discoveryYear: 1968,
    notableFeatures: ["Powers Vela remnant", "Exhibits glitches"],
    scientificSignificance: "Key for understanding pulsar glitches",
    visualFeatures: [
      "Compact intensely luminous stellar sphere",
      "White-blue hot surface",
      "Warm orange-gold atmospheric glow",
      "Small dense stellar remnant",
      "Starfield background"
    ],
    colorDescription: "Brilliant white-blue core with soft warm orange-gold outer glow"
  },
];

// ============================================
// NEUTRON STARS - 2 representatives
// ============================================
export const NEUTRON_STARS: AstronomicalObject[] = [
  {
    name: "RX J1856.5-3754",
    objectType: "Neutron Star",
    description: "One of the closest neutron stars to Earth. An isolated neutron star with no pulsar emission.",
    constellation: "Corona Australis",
    distanceLy: 400,
    temperature: 700000,
    discoveryYear: 1996,
    notableFeatures: ["One of closest neutron stars", "No pulsar emission", "Thermal X-ray source"],
    scientificSignificance: "Key for studying neutron star surfaces",
    visualFeatures: [
      "Small intensely luminous solid stellar sphere",
      "Brilliant white-blue opaque surface",
      "Subtle warm glow halo",
      "Clean simple spherical shape",
      "Thermal X-ray emission creating warm glow"
    ],
    colorDescription: "Brilliant white-blue stellar surface with soft orange-gold outer glow"
  },
  {
    name: "PSR J0348+0432",
    objectType: "Neutron Star",
    description: "One of the most massive neutron stars known, with about 2 solar masses. In a binary with a white dwarf.",
    constellation: "Taurus",
    distanceLy: 2100,
    mass: 2.01,
    discoveryYear: 2007,
    notableFeatures: ["One of most massive neutron stars", "Tests general relativity"],
    scientificSignificance: "Constrains neutron star equation of state",
    visualFeatures: [
      "Compact intensely luminous stellar sphere",
      "White-blue hot surface from extreme density",
      "Warm atmospheric glow halo",
      "Ultra-dense stellar remnant appearance",
      "White dwarf companion potentially visible"
    ],
    colorDescription: "Brilliant white-blue core with soft warm outer glow"
  },
];

// ============================================
// WHITE DWARFS - 2 representatives
// ============================================
export const WHITE_DWARFS: AstronomicalObject[] = [
  {
    name: "Sirius B",
    objectType: "White Dwarf",
    description: "The closest white dwarf to Earth, companion to Sirius A. First white dwarf discovered.",
    constellation: "Canis Major",
    distanceLy: 8.6,
    mass: 1.02,
    radius: 0.0084,
    temperature: 25200,
    discoveryYear: 1862,
    discoverer: "Alvan Graham Clark",
    notableFeatures: ["First white dwarf discovered", "Companion to Sirius A"],
    scientificSignificance: "Prototype white dwarf",
    visualFeatures: [
      "Small intensely luminous solid stellar sphere",
      "Brilliant white-blue hot opaque surface",
      "Subtle warm glow halo surrounding star",
      "Compact stellar remnant about Earth-sized",
      "Clean simple spherical shape"
    ],
    colorDescription: "Brilliant white-blue stellar surface with soft warm outer glow"
  },
  {
    name: "Procyon B",
    objectType: "White Dwarf",
    description: "A white dwarf companion to Procyon A. One of the nearest white dwarfs to Earth.",
    constellation: "Canis Minor",
    distanceLy: 11.46,
    mass: 0.6,
    radius: 0.0123,
    temperature: 7740,
    discoveryYear: 1896,
    notableFeatures: ["Very faint", "Companion to bright star Procyon A"],
    scientificSignificance: "Nearby white dwarf for detailed study",
    visualFeatures: [
      "Compact luminous white stellar sphere",
      "White-blue opaque surface",
      "Warm glow halo effect",
      "Smaller cooler white dwarf appearance",
      "Simple spherical stellar remnant"
    ],
    colorDescription: "White-blue stellar surface with soft warm outer glow"
  },
];

// ============================================
// BROWN DWARFS - 2 representatives
// ============================================
export const BROWN_DWARFS: AstronomicalObject[] = [
  {
    name: "Luhman 16",
    alternateNames: ["WISE 1049-5319"],
    objectType: "Brown Dwarf",
    description: "The closest known brown dwarf system to Earth. A binary pair of brown dwarfs.",
    constellation: "Vela",
    distanceLy: 6.5,
    temperature: 1350,
    discoveryYear: 2013,
    discoverer: "Kevin Luhman",
    notableFeatures: ["Closest brown dwarf system", "Binary pair", "Weather patterns observed"],
    scientificSignificance: "Best target for brown dwarf atmospheric studies",
    visualFeatures: [
      "Large Jupiter-like body with banded atmosphere",
      "Deep magenta-red coloration from cool temperature",
      "Faint self-luminous infrared glow at limb",
      "Atmospheric storm systems and cloud bands",
      "Darker atmospheric bands visible"
    ],
    colorDescription: "Deep magenta-red to brown surface, darker atmospheric bands, faint warm infrared glow at limb"
  },
  {
    name: "WISE 0855-0714",
    objectType: "Brown Dwarf",
    description: "The coldest known brown dwarf, with temperatures similar to Earth's poles. A failed star.",
    constellation: "Hydra",
    distanceLy: 7.2,
    temperature: 250,
    discoveryYear: 2014,
    notableFeatures: ["Coldest known brown dwarf", "Water ice clouds detected"],
    scientificSignificance: "Coldest object outside solar system",
    visualFeatures: [
      "Large Jupiter-like body with banded atmosphere",
      "Very dark brown-red coloration from extreme cold",
      "Minimal self-luminous glow (coldest brown dwarf)",
      "Water ice cloud formations",
      "Barely glowing failed star appearance"
    ],
    colorDescription: "Very dark brown-magenta, minimal infrared glow, water ice cloud bands"
  },
];

// ============================================
// QUASARS - 2 representatives
// ============================================
export const QUASARS: AstronomicalObject[] = [
  {
    name: "3C 273",
    objectType: "Quasar",
    description: "The first quasar ever identified and the brightest quasar in the sky. Visible with amateur telescopes despite being 2.4 billion light-years away.",
    constellation: "Virgo",
    distanceLy: 2400000000,
    magnitude: 12.9,
    luminosity: 4000000000000,
    discoveryYear: 1963,
    notableFeatures: ["First quasar identified", "Brightest optical quasar"],
    scientificSignificance: "Discovery established quasars as distant objects",
    visualFeatures: [
      "Brilliant intense point-like nucleus",
      "Visible relativistic jet extending outward",
      "Intense white-blue nuclear glow",
      "Faint host galaxy halo surrounding nucleus",
      "Orange-gold relativistic jet structure"
    ],
    colorDescription: "Intense white-blue nucleus, orange-gold relativistic jet, faint galactic halo"
  },
  {
    name: "3C 48",
    objectType: "Quasar",
    description: "The first object classified as a quasar. A compact, blue star-like object with peculiar emission lines.",
    constellation: "Triangulum",
    distanceLy: 3900000000,
    magnitude: 16.2,
    discoveryYear: 1960,
    notableFeatures: ["First quasar-class object found", "Strong radio source"],
    scientificSignificance: "First recognized quasar class member",
    visualFeatures: [
      "Compact brilliant point-like nucleus",
      "Intense blue-white nuclear emission",
      "Radio-loud active galactic nucleus",
      "Faint disturbed host galaxy",
      "Compact energetic appearance"
    ],
    colorDescription: "Intense blue-white nucleus with faint surrounding host galaxy"
  },
];

// ============================================
// SUPERNOVAE - 2 representatives
// ============================================
export const SUPERNOVAE: AstronomicalObject[] = [
  {
    name: "SN 1987A",
    objectType: "Supernova",
    description: "The closest observed supernova since the invention of the telescope. Located in the Large Magellanic Cloud.",
    constellation: "Dorado",
    distanceLy: 168000,
    discoveryYear: 1987,
    temperature: 15000,
    notableFeatures: ["Closest modern supernova", "Neutrinos detected", "Ring structure"],
    structureDetails: "Expanding debris shell with triple ring system",
    colorDescription: "Bright expanding debris with glowing rings",
    scientificSignificance: "First supernova with detected neutrinos",
    visualFeatures: [
      "Triple ring system surrounding central debris",
      "Bright inner equatorial ring glowing from shock interaction",
      "Two fainter outer rings above and below equator",
      "Expanding debris cloud in center",
      "Colorful emission from shock-heated gas"
    ]
  },
  {
    name: "SN 1604",
    alternateNames: ["Kepler's Supernova"],
    objectType: "Supernova",
    description: "The last supernova observed in the Milky Way. Witnessed by Johannes Kepler in 1604.",
    constellation: "Ophiuchus",
    distanceLy: 20000,
    discoveryYear: 1604,
    discoverer: "Johannes Kepler",
    notableFeatures: ["Last Milky Way supernova observed", "Type Ia supernova", "Visible for over a year"],
    structureDetails: "Spherical expanding shell remnant",
    scientificSignificance: "Important for understanding Type Ia supernovae",
    visualFeatures: [
      "Spherical expanding shell of shocked gas",
      "Filamentary structure in shell",
      "Multicolored emission from different elements",
      "Red hydrogen filaments, blue oxygen emission",
      "Green sulfur emission regions"
    ],
    colorDescription: "Multicolored filaments with red hydrogen, blue oxygen, green sulfur emissions"
  },
];

// ============================================
// SUPERNOVA REMNANTS - 2 representatives
// ============================================
export const SUPERNOVA_REMNANTS: AstronomicalObject[] = [
  {
    name: "Crab Nebula",
    alternateNames: ["M1", "NGC 1952"],
    objectType: "Supernova Remnant",
    description: "The remnant of a supernova observed in 1054 AD. Contains a pulsar spinning 30 times per second.",
    constellation: "Taurus",
    distanceLy: 6500,
    magnitude: 8.4,
    discoveryYear: 1731,
    notableFeatures: ["Supernova remnant from 1054 AD", "Contains Crab Pulsar"],
    scientificSignificance: "Best studied supernova remnant",
    visualFeatures: [
      "Complex filamentary structure expanding outward",
      "Bright chaotic center powered by Crab Pulsar",
      "Red hydrogen filaments in outer regions",
      "Blue synchrotron emission from pulsar wind nebula",
      "Green and yellow emission from ionized gas"
    ],
    colorDescription: "Multicolored filaments - red outer hydrogen, blue-white synchrotron core, green ionized gas"
  },
  {
    name: "Veil Nebula",
    alternateNames: ["NGC 6960", "Cygnus Loop"],
    objectType: "Supernova Remnant",
    description: "A large supernova remnant from a star that exploded 10,000-20,000 years ago. Known for delicate filamentary structure.",
    constellation: "Cygnus",
    distanceLy: 2400,
    magnitude: 7.0,
    discoveryYear: 1784,
    notableFeatures: ["Delicate filamentary structure", "Shock-heated gas"],
    scientificSignificance: "Example of supernova shock wave interaction",
    visualFeatures: [
      "Delicate lacework filamentary structure",
      "Expanding arc of shock-heated gas",
      "Red hydrogen emission along shock front",
      "Blue oxygen emission in shocked regions",
      "Green sulfur emission filaments"
    ],
    colorDescription: "Delicate multicolored filaments - red hydrogen, blue oxygen, green sulfur emissions"
  },
];

// Legacy exports for backwards compatibility
export const MESSIER_OBJECTS: AstronomicalObject[] = [
  ...NEBULAE,
  ...GALAXIES,
  ...STAR_CLUSTERS,
  ...GLOBULAR_CLUSTERS,
  ...SUPERNOVA_REMNANTS,
];

// Helper function to get all astronomical objects
export function getAllAstronomicalObjects(): AstronomicalObject[] {
  return [
    ...REAL_STARS,
    ...NEBULAE,
    ...GALAXIES,
    ...STAR_CLUSTERS,
    ...GLOBULAR_CLUSTERS,
    ...EXOPLANETS,
    ...PLANETS,
    ...MOONS,
    ...DWARF_PLANETS,
    ...ASTEROIDS,
    ...COMETS,
    ...BLACK_HOLES,
    ...PULSARS,
    ...NEUTRON_STARS,
    ...WHITE_DWARFS,
    ...BROWN_DWARFS,
    ...QUASARS,
    ...SUPERNOVAE,
    ...SUPERNOVA_REMNANTS,
  ];
}

// Get object count by type
export function getObjectCountsByType(): Record<string, number> {
  const all = getAllAstronomicalObjects();
  const counts: Record<string, number> = {};
  for (const obj of all) {
    counts[obj.objectType] = (counts[obj.objectType] || 0) + 1;
  }
  return counts;
}

// Get objects by type
export function getObjectsByType(objectType: string): AstronomicalObject[] {
  return getAllAstronomicalObjects().filter(obj => obj.objectType === objectType);
}

// Get random objects for NFT generation
export function getRandomObjects(count: number, excludeNames?: Set<string>): AstronomicalObject[] {
  const all = getAllAstronomicalObjects().filter(obj =>
    !excludeNames || !excludeNames.has(obj.name.toLowerCase())
  );
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const TOTAL_AVAILABLE_OBJECTS = getAllAstronomicalObjects().length;
