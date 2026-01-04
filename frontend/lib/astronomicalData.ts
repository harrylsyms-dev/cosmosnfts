// Real Astronomical Data from NASA, ESA, and scientific catalogs
// Sources: NASA Exoplanet Archive, SIMBAD, Messier Catalog, NGC/IC Catalogs

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
  subType?: string; // Additional classification (e.g., "red supergiant", "barred spiral")
  galaxyType?: string; // For galaxies: spiral, elliptical, irregular, lenticular, barred spiral
  nebulaType?: string; // For nebulae: emission, reflection, planetary, dark, supernova remnant
  planetType?: string; // For planets: terrestrial, gas giant, ice giant, dwarf planet
  surfaceFeatures?: string; // Visual surface description for planets/moons
  atmosphereDescription?: string; // Atmosphere details for planets
  structureDetails?: string; // Structural details (spiral arms, accretion disk, etc.)
  colorDescription?: string; // Explicit color for image generation
  visualCharacteristics?: string; // Pre-written visual features for prompts
  imageStyleReference?: string; // Preferred imagery source (SDO, Hubble, JWST, EHT)
}

// ============================================
// FAMOUS STARS (Real data from SIMBAD/Wikipedia)
// ============================================
export const REAL_STARS: AstronomicalObject[] = [
  {
    name: "Sirius",
    alternateNames: ["Alpha Canis Majoris", "Dog Star", "HD 48915"],
    objectType: "Star",
    description: "The brightest star in Earth's night sky. A binary star system consisting of a main-sequence star Sirius A and a faint white dwarf companion Sirius B.",
    constellation: "Canis Major",
    distanceLy: 8.6,
    distanceDisplay: "8.6 light-years",
    mass: 2.06,
    radius: 1.71,
    temperature: 9940,
    luminosity: 25.4,
    magnitude: -1.46,
    spectralType: "A1V",
    notableFeatures: ["Brightest star visible from Earth", "Binary system with white dwarf companion"],
    scientificSignificance: "Used for navigation since ancient times, key reference star in astronomy"
  },
  {
    name: "Betelgeuse",
    alternateNames: ["Alpha Orionis", "HD 39801"],
    objectType: "Star",
    description: "A red supergiant star and one of the largest stars visible to the naked eye. It is expected to explode as a supernova within the next million years.",
    constellation: "Orion",
    distanceLy: 700,
    distanceDisplay: "~700 light-years",
    mass: 16.5,
    radius: 764,
    temperature: 3600,
    luminosity: 126000,
    magnitude: 0.5,
    spectralType: "M1-2Ia-Iab",
    age: 0.01,
    notableFeatures: ["One of the largest known stars", "Semi-regular variable star", "Will explode as supernova"],
    scientificSignificance: "Key object for studying stellar evolution and mass loss in red supergiants"
  },
  {
    name: "Proxima Centauri",
    alternateNames: ["Alpha Centauri C", "GJ 551"],
    objectType: "Star",
    description: "The closest known star to the Sun at just 4.24 light-years away. A small, low-mass red dwarf that hosts at least two confirmed exoplanets.",
    constellation: "Centaurus",
    distanceLy: 4.24,
    distanceDisplay: "4.24 light-years",
    mass: 0.12,
    radius: 0.15,
    temperature: 3042,
    luminosity: 0.0017,
    magnitude: 11.13,
    spectralType: "M5.5Ve",
    age: 4.85,
    notableFeatures: ["Closest star to the Sun", "Hosts potentially habitable exoplanet Proxima b", "Flare star"],
    scientificSignificance: "Primary target for interstellar exploration concepts like Breakthrough Starshot"
  },
  {
    name: "Vega",
    alternateNames: ["Alpha Lyrae", "HD 172167"],
    objectType: "Star",
    description: "One of the most luminous stars in the Sun's neighborhood and the fifth-brightest star in the night sky. Once used as the baseline for stellar photometry.",
    constellation: "Lyra",
    distanceLy: 25,
    distanceDisplay: "25 light-years",
    mass: 2.1,
    radius: 2.36,
    temperature: 9602,
    luminosity: 40.12,
    magnitude: 0.03,
    spectralType: "A0Va",
    age: 0.455,
    notableFeatures: ["Former North Star", "Surrounded by debris disk", "Rapid rotator"],
    scientificSignificance: "Standard reference for stellar brightness calibration"
  },
  {
    name: "Rigel",
    alternateNames: ["Beta Orionis", "HD 34085"],
    objectType: "Star",
    description: "A blue supergiant star and the brightest star in the constellation Orion. One of the most luminous stars in our galaxy.",
    constellation: "Orion",
    distanceLy: 860,
    distanceDisplay: "~860 light-years",
    mass: 21,
    radius: 78.9,
    temperature: 12100,
    luminosity: 120000,
    magnitude: 0.13,
    spectralType: "B8Ia",
    notableFeatures: ["Blue supergiant", "Multiple star system", "Extremely luminous"],
    scientificSignificance: "Important for studying massive star evolution"
  },
  {
    name: "Polaris",
    alternateNames: ["Alpha Ursae Minoris", "North Star", "HD 8890"],
    objectType: "Star",
    description: "The current North Star, a yellow supergiant and the brightest star in Ursa Minor. Actually a triple star system with the primary being a Cepheid variable.",
    constellation: "Ursa Minor",
    distanceLy: 433,
    distanceDisplay: "433 light-years",
    mass: 5.4,
    radius: 37.5,
    temperature: 6015,
    luminosity: 1260,
    magnitude: 1.98,
    spectralType: "F7Ib",
    notableFeatures: ["Current North Star", "Cepheid variable", "Triple star system"],
    scientificSignificance: "Key for navigation and Cepheid variable star studies"
  },
  {
    name: "Arcturus",
    alternateNames: ["Alpha Bootis", "HD 124897"],
    objectType: "Star",
    description: "The brightest star in the northern celestial hemisphere and the fourth-brightest in the night sky. An orange giant star that has exhausted its hydrogen core.",
    constellation: "Bootes",
    distanceLy: 36.7,
    distanceDisplay: "36.7 light-years",
    mass: 1.08,
    radius: 25.4,
    temperature: 4286,
    luminosity: 170,
    magnitude: -0.05,
    spectralType: "K1.5IIIpe",
    age: 7.1,
    notableFeatures: ["Brightest star in northern hemisphere", "Orange giant", "High proper motion"],
    scientificSignificance: "Important for studying stellar evolution of solar-mass stars"
  },
  {
    name: "Canopus",
    alternateNames: ["Alpha Carinae", "HD 45348"],
    objectType: "Star",
    description: "The second-brightest star in the night sky after Sirius. A bright giant or supergiant used for spacecraft navigation.",
    constellation: "Carina",
    distanceLy: 310,
    distanceDisplay: "310 light-years",
    mass: 8.0,
    radius: 71,
    temperature: 7350,
    luminosity: 10700,
    magnitude: -0.74,
    spectralType: "A9II",
    notableFeatures: ["Second brightest star", "Used for spacecraft navigation", "Visible from southern hemisphere"],
    scientificSignificance: "Key navigation star for deep space missions"
  },
  {
    name: "Aldebaran",
    alternateNames: ["Alpha Tauri", "HD 29139", "Eye of Taurus"],
    objectType: "Star",
    description: "An orange giant star that marks the eye of the Bull in Taurus. One of the easiest stars to find in the night sky.",
    constellation: "Taurus",
    distanceLy: 65,
    distanceDisplay: "65 light-years",
    mass: 1.16,
    radius: 44.13,
    temperature: 3910,
    luminosity: 439,
    magnitude: 0.86,
    spectralType: "K5III",
    age: 6.6,
    notableFeatures: ["Eye of the Bull", "Orange giant", "Hosts exoplanet"],
    scientificSignificance: "Well-studied example of stellar evolution"
  },
  {
    name: "Antares",
    alternateNames: ["Alpha Scorpii", "HD 148478", "Rival of Mars"],
    objectType: "Star",
    description: "A red supergiant star and the brightest star in Scorpius. Its name means 'rival of Mars' due to its reddish color.",
    constellation: "Scorpius",
    distanceLy: 550,
    distanceDisplay: "~550 light-years",
    mass: 12,
    radius: 680,
    temperature: 3660,
    luminosity: 75900,
    magnitude: 1.06,
    spectralType: "M1.5Iab-Ib",
    notableFeatures: ["Red supergiant", "Binary star system", "One of largest known stars"],
    scientificSignificance: "Key object for studying late-stage stellar evolution"
  },
  {
    name: "Spica",
    alternateNames: ["Alpha Virginis", "HD 116658"],
    objectType: "Star",
    description: "The brightest star in Virgo and the 16th brightest star in the night sky. A close binary system of two hot blue stars.",
    constellation: "Virgo",
    distanceLy: 250,
    distanceDisplay: "250 light-years",
    mass: 11.43,
    radius: 7.47,
    temperature: 25300,
    luminosity: 20512,
    magnitude: 0.97,
    spectralType: "B1V",
    notableFeatures: ["Spectroscopic binary", "Rotating ellipsoidal variable"],
    scientificSignificance: "Important for studying binary star evolution"
  },
  {
    name: "Deneb",
    alternateNames: ["Alpha Cygni", "HD 197345"],
    objectType: "Star",
    description: "A blue-white supergiant and one of the most luminous stars known. Forms one corner of the Summer Triangle asterism.",
    constellation: "Cygnus",
    distanceLy: 2615,
    distanceDisplay: "~2,600 light-years",
    mass: 19,
    radius: 203,
    temperature: 8525,
    luminosity: 196000,
    magnitude: 1.25,
    spectralType: "A2Ia",
    notableFeatures: ["One of most luminous stars known", "Part of Summer Triangle", "Blue supergiant"],
    scientificSignificance: "Prototype for Alpha Cygni variable stars"
  },
  {
    name: "Fomalhaut",
    alternateNames: ["Alpha Piscis Austrini", "HD 216956"],
    objectType: "Star",
    description: "A young star surrounded by a spectacular debris disk. One of the first stars to have an exoplanet directly imaged.",
    constellation: "Piscis Austrinus",
    distanceLy: 25,
    distanceDisplay: "25 light-years",
    mass: 1.92,
    radius: 1.84,
    temperature: 8590,
    luminosity: 16.63,
    magnitude: 1.16,
    spectralType: "A4V",
    age: 0.44,
    notableFeatures: ["Spectacular debris disk", "First directly imaged exoplanet candidate", "Young star"],
    scientificSignificance: "Key target for studying planet formation"
  },
  {
    name: "Altair",
    alternateNames: ["Alpha Aquilae", "HD 187642"],
    objectType: "Star",
    description: "One of the closest visible stars to Earth and a vertex of the Summer Triangle. Rotates extremely rapidly, causing it to be oblate.",
    constellation: "Aquila",
    distanceLy: 16.7,
    distanceDisplay: "16.7 light-years",
    mass: 1.79,
    radius: 1.63,
    temperature: 7670,
    luminosity: 10.6,
    magnitude: 0.76,
    spectralType: "A7V",
    notableFeatures: ["Rapid rotator", "Oblate shape", "Part of Summer Triangle"],
    scientificSignificance: "First star to have its surface directly imaged"
  },
  {
    name: "Capella",
    alternateNames: ["Alpha Aurigae", "HD 34029"],
    objectType: "Star",
    description: "The sixth-brightest star in the night sky. Actually a quadruple star system with two pairs of binary stars.",
    constellation: "Auriga",
    distanceLy: 42.9,
    distanceDisplay: "42.9 light-years",
    mass: 2.69,
    radius: 11.98,
    temperature: 4970,
    luminosity: 78.7,
    magnitude: 0.08,
    spectralType: "G3III",
    notableFeatures: ["Quadruple star system", "Two giant stars", "Sixth brightest star"],
    scientificSignificance: "Important for studying binary star evolution"
  },
  {
    name: "Procyon",
    alternateNames: ["Alpha Canis Minoris", "HD 61421"],
    objectType: "Star",
    description: "The brightest star in Canis Minor and the eighth-brightest in the night sky. A binary system with a white dwarf companion.",
    constellation: "Canis Minor",
    distanceLy: 11.46,
    distanceDisplay: "11.46 light-years",
    mass: 1.50,
    radius: 2.05,
    temperature: 6530,
    luminosity: 6.93,
    magnitude: 0.34,
    spectralType: "F5IV-V",
    notableFeatures: ["Binary with white dwarf", "One of nearest bright stars", "Subgiant star"],
    scientificSignificance: "Close binary system useful for stellar mass determination"
  },
  {
    name: "Achernar",
    alternateNames: ["Alpha Eridani", "HD 10144"],
    objectType: "Star",
    description: "The brightest star in Eridanus and the ninth-brightest in the sky. One of the flattest stars known due to rapid rotation.",
    constellation: "Eridanus",
    distanceLy: 139,
    distanceDisplay: "139 light-years",
    mass: 6.7,
    radius: 7.3,
    temperature: 14500,
    luminosity: 3150,
    magnitude: 0.46,
    spectralType: "B6Vep",
    notableFeatures: ["Flattest known star", "Extremely rapid rotation", "Be star"],
    scientificSignificance: "Key object for studying rapid stellar rotation"
  },
  {
    name: "Regulus",
    alternateNames: ["Alpha Leonis", "HD 87901", "Cor Leonis"],
    objectType: "Star",
    description: "The brightest star in Leo and the 21st brightest in the sky. A quadruple star system with the primary being a rapid rotator.",
    constellation: "Leo",
    distanceLy: 79,
    distanceDisplay: "79 light-years",
    mass: 3.8,
    radius: 3.09,
    temperature: 12460,
    luminosity: 288,
    magnitude: 1.35,
    spectralType: "B8IVn",
    notableFeatures: ["Quadruple system", "Rapid rotator", "Heart of the Lion"],
    scientificSignificance: "Useful for studying rapid rotation effects"
  },
  {
    name: "Castor",
    alternateNames: ["Alpha Geminorum", "HD 60179"],
    objectType: "Star",
    description: "One of the twin stars of Gemini. Actually a complex sextuple star system with three binary pairs.",
    constellation: "Gemini",
    distanceLy: 51,
    distanceDisplay: "51 light-years",
    mass: 2.76,
    radius: 2.4,
    temperature: 10286,
    luminosity: 52.4,
    magnitude: 1.58,
    spectralType: "A1V",
    notableFeatures: ["Sextuple star system", "One of the Gemini twins"],
    scientificSignificance: "Important for studying complex multiple star systems"
  },
  {
    name: "Pollux",
    alternateNames: ["Beta Geminorum", "HD 62509"],
    objectType: "Star",
    description: "The brighter of the twin stars of Gemini. An orange giant star that hosts a confirmed exoplanet.",
    constellation: "Gemini",
    distanceLy: 33.8,
    distanceDisplay: "33.8 light-years",
    mass: 1.91,
    radius: 9.06,
    temperature: 4666,
    luminosity: 43,
    magnitude: 1.14,
    spectralType: "K0III",
    age: 0.724,
    notableFeatures: ["Orange giant", "Hosts exoplanet", "One of the Gemini twins"],
    scientificSignificance: "One of closest stars with confirmed exoplanet"
  },
  // More stars...
  {
    name: "Mira",
    alternateNames: ["Omicron Ceti", "HD 14386", "The Wonderful Star"],
    objectType: "Star",
    description: "The prototype of the Mira variable stars. A red giant that varies dramatically in brightness over about 332 days.",
    constellation: "Cetus",
    distanceLy: 299,
    distanceDisplay: "299 light-years",
    mass: 1.18,
    radius: 400,
    temperature: 2918,
    magnitude: 6.53,
    spectralType: "M7IIIe",
    notableFeatures: ["Prototype Mira variable", "Dramatic brightness changes", "Has comet-like tail"],
    scientificSignificance: "First periodic variable star discovered, prototype for a class of variables"
  },
  {
    name: "Algol",
    alternateNames: ["Beta Persei", "HD 19356", "Demon Star"],
    objectType: "Star",
    description: "The prototype eclipsing binary star, known as the 'Demon Star' since antiquity for its regular dimming.",
    constellation: "Perseus",
    distanceLy: 93,
    distanceDisplay: "93 light-years",
    mass: 3.17,
    radius: 2.73,
    temperature: 13000,
    magnitude: 2.12,
    spectralType: "B8V",
    notableFeatures: ["Prototype eclipsing binary", "Triple star system", "Known since ancient times"],
    scientificSignificance: "First known eclipsing binary, key for understanding stellar masses"
  },
  {
    name: "Eta Carinae",
    alternateNames: ["HD 93308"],
    objectType: "Star",
    description: "One of the most massive and luminous stars in the Milky Way. A hypergiant star that could explode as a supernova at any time.",
    constellation: "Carina",
    distanceLy: 7500,
    distanceDisplay: "7,500 light-years",
    mass: 100,
    radius: 240,
    temperature: 36000,
    luminosity: 5000000,
    magnitude: 4.3,
    spectralType: "Peculiar",
    notableFeatures: ["One of most massive stars", "Could explode any time", "Surrounded by Homunculus Nebula"],
    scientificSignificance: "Key object for studying massive star evolution and instability"
  },
  {
    name: "VY Canis Majoris",
    alternateNames: ["HD 58061"],
    objectType: "Star",
    description: "One of the largest known stars, a red hypergiant with a radius over 1,400 times that of the Sun.",
    constellation: "Canis Major",
    distanceLy: 3900,
    distanceDisplay: "3,900 light-years",
    mass: 17,
    radius: 1420,
    temperature: 3490,
    luminosity: 270000,
    magnitude: 7.95,
    spectralType: "M5eIa",
    notableFeatures: ["One of largest known stars", "Red hypergiant", "Losing mass rapidly"],
    scientificSignificance: "Important for understanding stellar size limits"
  },
  {
    name: "UY Scuti",
    alternateNames: ["BD-12 5055"],
    objectType: "Star",
    description: "A red supergiant that was once considered the largest known star. Located in the constellation Scutum.",
    constellation: "Scutum",
    distanceLy: 9500,
    distanceDisplay: "9,500 light-years",
    mass: 10,
    radius: 1708,
    temperature: 3365,
    magnitude: 9.0,
    spectralType: "M4Ia",
    notableFeatures: ["One of largest known stars", "Extreme luminosity", "Red supergiant"],
    scientificSignificance: "Key for understanding upper limits of stellar size"
  },
  {
    name: "R136a1",
    alternateNames: ["RMC 136a1"],
    objectType: "Star",
    description: "The most massive and luminous star known. Located in the Tarantula Nebula in the Large Magellanic Cloud.",
    constellation: "Dorado",
    distanceLy: 163000,
    distanceDisplay: "163,000 light-years",
    mass: 196,
    radius: 42,
    temperature: 46000,
    luminosity: 6166000,
    magnitude: 12.28,
    spectralType: "WN5h",
    notableFeatures: ["Most massive known star", "Wolf-Rayet star", "In Tarantula Nebula"],
    scientificSignificance: "Challenges our understanding of stellar mass limits"
  },
  {
    name: "Tabby's Star",
    alternateNames: ["KIC 8462852", "Boyajian's Star"],
    objectType: "Star",
    description: "A star famous for its unusual and dramatic dimming events that sparked speculation about alien megastructures.",
    constellation: "Cygnus",
    distanceLy: 1470,
    distanceDisplay: "1,470 light-years",
    mass: 1.43,
    radius: 1.58,
    temperature: 6750,
    magnitude: 11.7,
    spectralType: "F3V",
    discoveryYear: 2015,
    discoverer: "Tabetha Boyajian",
    notableFeatures: ["Unusual dimming events", "Sparked alien megastructure speculation", "Likely dust clouds"],
    scientificSignificance: "Example of citizen science discovery, mysterious variability"
  },
];

// ============================================
// MESSIER CATALOG - 110 Famous Deep Sky Objects
// ============================================
export const MESSIER_OBJECTS: AstronomicalObject[] = [
  {
    name: "Crab Nebula",
    alternateNames: ["M1", "NGC 1952"],
    objectType: "Supernova Remnant",
    description: "The remnant of a supernova that was observed by Chinese astronomers in 1054 AD. Contains a pulsar at its center spinning 30 times per second.",
    constellation: "Taurus",
    distanceLy: 6500,
    distanceDisplay: "6,500 light-years",
    discoveryYear: 1731,
    discoverer: "John Bevis",
    magnitude: 8.4,
    notableFeatures: ["Supernova remnant from 1054 AD", "Contains Crab Pulsar", "Expanding at 1,500 km/s"],
    scientificSignificance: "Best studied supernova remnant, important for pulsar research"
  },
  {
    name: "Orion Nebula",
    alternateNames: ["M42", "NGC 1976", "Great Nebula in Orion"],
    objectType: "Nebula",
    description: "The closest region of massive star formation to Earth. A stellar nursery where new stars are being born right now.",
    constellation: "Orion",
    distanceLy: 1344,
    distanceDisplay: "1,344 light-years",
    discoveryYear: 1610,
    discoverer: "Nicolas-Claude Fabri de Peiresc",
    magnitude: 4.0,
    notableFeatures: ["Closest massive star-forming region", "Visible to naked eye", "Contains Trapezium Cluster"],
    scientificSignificance: "Prime laboratory for studying star formation"
  },
  {
    name: "Andromeda Galaxy",
    alternateNames: ["M31", "NGC 224"],
    objectType: "Galaxy",
    description: "The nearest major galaxy to the Milky Way and the most distant object visible to the naked eye. Contains about 1 trillion stars.",
    constellation: "Andromeda",
    distanceLy: 2537000,
    distanceDisplay: "2.537 million light-years",
    discoveryYear: 964,
    discoverer: "Abd al-Rahman al-Sufi",
    magnitude: 3.44,
    mass: 1500000000000,
    notableFeatures: ["Nearest major galaxy", "Will collide with Milky Way in 4.5 billion years", "Trillion stars"],
    scientificSignificance: "Key for understanding galaxy structure and dark matter"
  },
  {
    name: "Triangulum Galaxy",
    alternateNames: ["M33", "NGC 598", "Pinwheel Galaxy"],
    objectType: "Galaxy",
    description: "The third-largest galaxy in the Local Group after Andromeda and the Milky Way. A face-on spiral with active star formation.",
    constellation: "Triangulum",
    distanceLy: 2730000,
    distanceDisplay: "2.73 million light-years",
    magnitude: 5.72,
    notableFeatures: ["Third largest Local Group galaxy", "Face-on spiral", "Contains NGC 604 nebula"],
    scientificSignificance: "Important for studying spiral galaxy structure"
  },
  {
    name: "Whirlpool Galaxy",
    alternateNames: ["M51", "NGC 5194", "M51a"],
    objectType: "Galaxy",
    description: "A grand-design spiral galaxy interacting with its smaller companion NGC 5195. One of the most famous and photographed galaxies.",
    constellation: "Canes Venatici",
    distanceLy: 23000000,
    distanceDisplay: "23 million light-years",
    discoveryYear: 1773,
    discoverer: "Charles Messier",
    magnitude: 8.4,
    notableFeatures: ["Classic spiral structure", "Interacting with companion galaxy", "First spiral nebula identified"],
    scientificSignificance: "Key object for studying galaxy interactions and spiral structure"
  },
  {
    name: "Sombrero Galaxy",
    alternateNames: ["M104", "NGC 4594"],
    objectType: "Galaxy",
    description: "A galaxy famous for its bright nucleus, large central bulge, and dark dust lane that gives it the appearance of a sombrero hat.",
    constellation: "Virgo",
    distanceLy: 31000000,
    distanceDisplay: "31 million light-years",
    discoveryYear: 1781,
    discoverer: "Pierre Méchain",
    magnitude: 8.0,
    notableFeatures: ["Distinctive sombrero shape", "Supermassive black hole of 1 billion solar masses", "Prominent dust lane"],
    scientificSignificance: "Contains one of the most massive black holes known in nearby galaxies"
  },
  {
    name: "Ring Nebula",
    alternateNames: ["M57", "NGC 6720"],
    objectType: "Nebula",
    description: "A planetary nebula created when a Sun-like star expelled its outer layers at the end of its life, revealing the hot core within.",
    constellation: "Lyra",
    distanceLy: 2300,
    distanceDisplay: "2,300 light-years",
    discoveryYear: 1779,
    discoverer: "Antoine Darquier de Pellepoix",
    magnitude: 8.8,
    notableFeatures: ["Classic ring shape", "Visible white dwarf at center", "Expanding at 20 km/s"],
    scientificSignificance: "Prototype planetary nebula, shows future of our Sun"
  },
  {
    name: "Eagle Nebula",
    alternateNames: ["M16", "NGC 6611", "Star Queen Nebula"],
    objectType: "Nebula",
    description: "A young open cluster surrounded by a diffuse emission nebula. Famous for the 'Pillars of Creation' photographed by Hubble.",
    constellation: "Serpens",
    distanceLy: 7000,
    distanceDisplay: "7,000 light-years",
    discoveryYear: 1745,
    discoverer: "Jean-Philippe Loys de Chéseaux",
    magnitude: 6.0,
    notableFeatures: ["Pillars of Creation", "Active star formation", "Young star cluster"],
    scientificSignificance: "Iconic image of star formation, key for understanding stellar birth"
  },
  {
    name: "Lagoon Nebula",
    alternateNames: ["M8", "NGC 6523"],
    objectType: "Nebula",
    description: "A giant interstellar cloud and star-forming region. One of only two star-forming nebulae visible to the naked eye from mid-northern latitudes.",
    constellation: "Sagittarius",
    distanceLy: 4100,
    distanceDisplay: "4,100 light-years",
    discoveryYear: 1654,
    discoverer: "Giovanni Hodierna",
    magnitude: 6.0,
    notableFeatures: ["Visible to naked eye", "Contains Hourglass Nebula", "Active star formation"],
    scientificSignificance: "One of brightest nebulae, accessible to amateur astronomers"
  },
  {
    name: "Trifid Nebula",
    alternateNames: ["M20", "NGC 6514"],
    objectType: "Nebula",
    description: "A combination of an open cluster, emission nebula, reflection nebula, and dark nebula. Named for its three-lobed appearance.",
    constellation: "Sagittarius",
    distanceLy: 5200,
    distanceDisplay: "5,200 light-years",
    discoveryYear: 1764,
    discoverer: "Charles Messier",
    magnitude: 6.3,
    notableFeatures: ["Three-lobed structure", "Multiple nebula types", "Young stellar objects"],
    scientificSignificance: "Rare combination of different nebula types in one object"
  },
  {
    name: "Omega Nebula",
    alternateNames: ["M17", "NGC 6618", "Swan Nebula"],
    objectType: "Nebula",
    description: "One of the brightest and most massive star-forming regions in our galaxy. Also known as the Swan Nebula for its shape.",
    constellation: "Sagittarius",
    distanceLy: 5500,
    distanceDisplay: "5,500 light-years",
    discoveryYear: 1745,
    discoverer: "Jean-Philippe Loys de Chéseaux",
    magnitude: 6.0,
    notableFeatures: ["Massive star-forming region", "Swan-like shape", "Hidden star cluster"],
    scientificSignificance: "One of the most active star-forming regions in the Milky Way"
  },
  {
    name: "Dumbbell Nebula",
    alternateNames: ["M27", "NGC 6853", "Apple Core Nebula"],
    objectType: "Nebula",
    description: "The first planetary nebula ever discovered. Shows what our Sun will look like in about 5 billion years.",
    constellation: "Vulpecula",
    distanceLy: 1360,
    distanceDisplay: "1,360 light-years",
    discoveryYear: 1764,
    discoverer: "Charles Messier",
    magnitude: 7.5,
    notableFeatures: ["First planetary nebula discovered", "Dumbbell shape", "Preview of Sun's fate"],
    scientificSignificance: "First planetary nebula discovered, key for understanding stellar death"
  },
  {
    name: "Helix Nebula",
    alternateNames: ["NGC 7293", "Eye of God"],
    objectType: "Nebula",
    description: "One of the closest planetary nebulae to Earth. Its appearance resembles a human eye, earning it the nickname 'Eye of God'.",
    constellation: "Aquarius",
    distanceLy: 650,
    distanceDisplay: "650 light-years",
    discoveryYear: 1824,
    discoverer: "Karl Ludwig Harding",
    magnitude: 7.3,
    notableFeatures: ["Closest planetary nebulae", "Eye-like appearance", "Large angular size"],
    scientificSignificance: "Closest bright planetary nebula, excellent for detailed study"
  },
  {
    name: "Pleiades",
    alternateNames: ["M45", "Seven Sisters", "Subaru"],
    objectType: "Star Cluster",
    description: "The most famous open star cluster in the sky. Known since antiquity and visible to the naked eye, containing hot blue stars.",
    constellation: "Taurus",
    distanceLy: 444,
    distanceDisplay: "444 light-years",
    magnitude: 1.6,
    age: 0.1,
    notableFeatures: ["Most famous star cluster", "Reflection nebulosity", "Known since prehistory"],
    scientificSignificance: "Key calibrator for stellar distance measurements"
  },
  {
    name: "Beehive Cluster",
    alternateNames: ["M44", "NGC 2632", "Praesepe"],
    objectType: "Star Cluster",
    description: "One of the nearest open clusters to our solar system. Contains about 1,000 stars and is visible to the naked eye as a fuzzy patch.",
    constellation: "Cancer",
    distanceLy: 577,
    distanceDisplay: "577 light-years",
    magnitude: 3.7,
    age: 0.6,
    notableFeatures: ["One of nearest clusters", "Contains exoplanet-hosting stars", "Visible to naked eye"],
    scientificSignificance: "Excellent laboratory for studying stellar evolution"
  },
  {
    name: "Hercules Cluster",
    alternateNames: ["M13", "NGC 6205", "Great Globular Cluster"],
    objectType: "Star Cluster",
    description: "The brightest globular cluster in the northern sky. Contains several hundred thousand ancient stars packed into a ball 145 light-years across.",
    constellation: "Hercules",
    distanceLy: 22200,
    distanceDisplay: "22,200 light-years",
    discoveryYear: 1714,
    discoverer: "Edmond Halley",
    magnitude: 5.8,
    age: 11.65,
    notableFeatures: ["Brightest northern globular", "300,000+ stars", "Target of Arecibo message"],
    scientificSignificance: "Target of first intentional interstellar radio message"
  },
  {
    name: "Omega Centauri",
    alternateNames: ["NGC 5139", "ω Cen"],
    objectType: "Star Cluster",
    description: "The largest and brightest globular cluster in the Milky Way. May be the remnant core of a dwarf galaxy absorbed by our galaxy.",
    constellation: "Centaurus",
    distanceLy: 15800,
    distanceDisplay: "15,800 light-years",
    magnitude: 3.9,
    age: 12,
    mass: 4000000,
    notableFeatures: ["Largest Milky Way globular", "10 million stars", "May be dwarf galaxy core"],
    scientificSignificance: "Possibly a captured dwarf galaxy nucleus"
  },
  {
    name: "47 Tucanae",
    alternateNames: ["NGC 104"],
    objectType: "Star Cluster",
    description: "The second-brightest globular cluster after Omega Centauri. Contains millions of stars and is visible to the naked eye.",
    constellation: "Tucana",
    distanceLy: 14700,
    distanceDisplay: "14,700 light-years",
    magnitude: 4.09,
    age: 12.75,
    notableFeatures: ["Second brightest globular", "Contains millisecond pulsars", "Dense core"],
    scientificSignificance: "Important for studying stellar dynamics and millisecond pulsars"
  },
  {
    name: "Centaurus A",
    alternateNames: ["NGC 5128", "Hamburger Galaxy"],
    objectType: "Galaxy",
    description: "The closest active galaxy to Earth. Features a dramatic dust lane and is a strong radio source with jets emanating from its central black hole.",
    constellation: "Centaurus",
    distanceLy: 13000000,
    distanceDisplay: "13 million light-years",
    discoveryYear: 1826,
    discoverer: "James Dunlop",
    magnitude: 6.84,
    notableFeatures: ["Nearest active galaxy", "Powerful radio jets", "Result of galaxy merger"],
    scientificSignificance: "Closest active galactic nucleus, key for studying AGN physics"
  },
  {
    name: "Bode's Galaxy",
    alternateNames: ["M81", "NGC 3031"],
    objectType: "Galaxy",
    description: "A grand design spiral galaxy with well-defined spiral arms. Interacting gravitationally with its neighbor M82.",
    constellation: "Ursa Major",
    distanceLy: 11800000,
    distanceDisplay: "11.8 million light-years",
    discoveryYear: 1774,
    discoverer: "Johann Elert Bode",
    magnitude: 6.94,
    notableFeatures: ["Grand design spiral", "Interacting with M82", "Supermassive black hole"],
    scientificSignificance: "Excellent example of grand design spiral structure"
  },
  {
    name: "Cigar Galaxy",
    alternateNames: ["M82", "NGC 3034"],
    objectType: "Galaxy",
    description: "A starburst galaxy undergoing exceptionally rapid star formation, likely triggered by interaction with neighboring M81.",
    constellation: "Ursa Major",
    distanceLy: 11500000,
    distanceDisplay: "11.5 million light-years",
    discoveryYear: 1774,
    discoverer: "Johann Elert Bode",
    magnitude: 8.41,
    notableFeatures: ["Starburst galaxy", "Powerful outflows", "Rapid star formation"],
    scientificSignificance: "Prototype starburst galaxy, key for understanding extreme star formation"
  },
  {
    name: "Pinwheel Galaxy",
    alternateNames: ["M101", "NGC 5457"],
    objectType: "Galaxy",
    description: "A face-on spiral galaxy with prominent spiral arms. One of the largest known spiral galaxies with a diameter of 170,000 light-years.",
    constellation: "Ursa Major",
    distanceLy: 20870000,
    distanceDisplay: "20.87 million light-years",
    discoveryYear: 1781,
    discoverer: "Pierre Méchain",
    magnitude: 7.86,
    notableFeatures: ["Face-on spiral", "Giant HII regions", "Asymmetric structure"],
    scientificSignificance: "Excellent for studying spiral arm structure"
  },
  {
    name: "Southern Pinwheel Galaxy",
    alternateNames: ["M83", "NGC 5236"],
    objectType: "Galaxy",
    description: "A barred spiral galaxy with well-defined spiral arms. Known for having produced the most observed supernovae in any galaxy.",
    constellation: "Hydra",
    distanceLy: 14700000,
    distanceDisplay: "14.7 million light-years",
    discoveryYear: 1752,
    discoverer: "Nicolas-Louis de Lacaille",
    magnitude: 7.54,
    notableFeatures: ["Most observed supernovae", "Barred spiral", "Active star formation"],
    scientificSignificance: "Record holder for observed supernovae"
  },
  {
    name: "Black Eye Galaxy",
    alternateNames: ["M64", "NGC 4826", "Evil Eye Galaxy"],
    objectType: "Galaxy",
    description: "A spiral galaxy famous for its dark band of dust in front of the nucleus, giving it the appearance of a black eye.",
    constellation: "Coma Berenices",
    distanceLy: 17000000,
    distanceDisplay: "17 million light-years",
    discoveryYear: 1779,
    discoverer: "Edward Pigott",
    magnitude: 8.52,
    notableFeatures: ["Distinctive dust band", "Counter-rotating disk", "Result of ancient merger"],
    scientificSignificance: "Evidence of past galaxy merger"
  },
  {
    name: "Sunflower Galaxy",
    alternateNames: ["M63", "NGC 5055"],
    objectType: "Galaxy",
    description: "A spiral galaxy with a distinctive flocculent spiral structure that resembles the pattern of a sunflower.",
    constellation: "Canes Venatici",
    distanceLy: 29300000,
    distanceDisplay: "29.3 million light-years",
    discoveryYear: 1779,
    discoverer: "Pierre Méchain",
    magnitude: 8.59,
    notableFeatures: ["Flocculent spiral arms", "Extended HI disk", "Active nucleus"],
    scientificSignificance: "Excellent example of flocculent spiral structure"
  },
  {
    name: "Leo Triplet",
    alternateNames: ["M66 Group"],
    objectType: "Galaxy",
    description: "M66 is part of a famous group of three interacting galaxies in Leo, showing tidal distortion from gravitational interactions.",
    constellation: "Leo",
    distanceLy: 35000000,
    distanceDisplay: "35 million light-years",
    discoveryYear: 1780,
    discoverer: "Charles Messier",
    magnitude: 8.92,
    notableFeatures: ["Part of Leo Triplet", "Tidally distorted", "Active star formation"],
    scientificSignificance: "Excellent example of galaxy group interaction"
  },
  {
    name: "Needle Galaxy",
    alternateNames: ["NGC 4565", "Caldwell 38"],
    objectType: "Galaxy",
    description: "A classic edge-on spiral galaxy showing a prominent central bulge and thin disk. One of the most photographed edge-on galaxies.",
    constellation: "Coma Berenices",
    distanceLy: 42000000,
    distanceDisplay: "42 million light-years",
    discoveryYear: 1785,
    discoverer: "William Herschel",
    magnitude: 9.6,
    notableFeatures: ["Edge-on orientation", "Prominent dust lane", "Similar to Milky Way"],
    scientificSignificance: "Key for understanding how our galaxy looks from the side"
  },
];

// ============================================
// CONFIRMED EXOPLANETS (From NASA Exoplanet Archive)
// ============================================
export const EXOPLANETS: AstronomicalObject[] = [
  {
    name: "Proxima Centauri b",
    alternateNames: ["Proxima b"],
    objectType: "Exoplanet",
    description: "The closest known exoplanet to Earth, orbiting in the habitable zone of our nearest stellar neighbor. A rocky world with potential for liquid water.",
    constellation: "Centaurus",
    distanceLy: 4.24,
    distanceDisplay: "4.24 light-years",
    mass: 1.17, // Earth masses
    discoveryYear: 2016,
    discoverer: "Guillem Anglada-Escudé",
    temperature: 234,
    notableFeatures: ["Closest known exoplanet", "In habitable zone", "Orbits red dwarf"],
    scientificSignificance: "Primary target for future interstellar missions"
  },
  {
    name: "TRAPPIST-1e",
    alternateNames: [],
    objectType: "Exoplanet",
    description: "One of seven Earth-sized planets in the TRAPPIST-1 system. The most likely candidate in the system to support liquid water on its surface.",
    constellation: "Aquarius",
    distanceLy: 39,
    distanceDisplay: "39 light-years",
    mass: 0.69,
    radius: 0.92,
    discoveryYear: 2017,
    discoverer: "Michaël Gillon",
    temperature: 246,
    notableFeatures: ["Most habitable TRAPPIST-1 planet", "Rocky composition", "May have atmosphere"],
    scientificSignificance: "Prime target for atmospheric characterization by JWST"
  },
  {
    name: "TRAPPIST-1f",
    alternateNames: [],
    objectType: "Exoplanet",
    description: "An Earth-sized planet in the TRAPPIST-1 system with conditions that might allow for liquid water under certain atmospheric conditions.",
    constellation: "Aquarius",
    distanceLy: 39,
    distanceDisplay: "39 light-years",
    mass: 0.93,
    radius: 1.05,
    discoveryYear: 2017,
    temperature: 219,
    notableFeatures: ["Earth-sized", "In habitable zone", "Part of 7-planet system"],
    scientificSignificance: "Part of most studied planetary system outside our solar system"
  },
  {
    name: "Kepler-442b",
    alternateNames: ["KOI-4742.01"],
    objectType: "Exoplanet",
    description: "A super-Earth in the habitable zone of its star, considered one of the most Earth-like planets discovered by the Kepler mission.",
    constellation: "Lyra",
    distanceLy: 112,
    distanceDisplay: "112 light-years",
    mass: 2.34,
    radius: 1.34,
    discoveryYear: 2015,
    temperature: 233,
    notableFeatures: ["Super-Earth", "High Earth Similarity Index", "In habitable zone"],
    scientificSignificance: "One of most Earth-like planets known"
  },
  {
    name: "Kepler-452b",
    alternateNames: ["Earth's Cousin", "Earth 2.0"],
    objectType: "Exoplanet",
    description: "A super-Earth orbiting a Sun-like star in the habitable zone. The first near-Earth-size planet found in the habitable zone of a Sun-like star.",
    constellation: "Cygnus",
    distanceLy: 1402,
    distanceDisplay: "1,402 light-years",
    radius: 1.63,
    discoveryYear: 2015,
    discoverer: "Kepler Science Team",
    temperature: 265,
    notableFeatures: ["Orbits Sun-like star", "In habitable zone", "60% larger than Earth"],
    scientificSignificance: "First potentially habitable planet around a Sun-like star"
  },
  {
    name: "Kepler-22b",
    alternateNames: [],
    objectType: "Exoplanet",
    description: "The first planet confirmed by Kepler to orbit in the habitable zone of a Sun-like star. Could be a water world or mini-Neptune.",
    constellation: "Cygnus",
    distanceLy: 638,
    distanceDisplay: "638 light-years",
    radius: 2.38,
    discoveryYear: 2011,
    discoverer: "Kepler Science Team",
    temperature: 295,
    notableFeatures: ["First confirmed habitable zone planet", "May be water world", "290-day orbit"],
    scientificSignificance: "First Kepler confirmation of habitable zone planet"
  },
  {
    name: "LHS 1140 b",
    alternateNames: [],
    objectType: "Exoplanet",
    description: "A rocky super-Earth in the habitable zone of a red dwarf star. One of the best targets for atmospheric studies with current technology.",
    constellation: "Cetus",
    distanceLy: 41,
    distanceDisplay: "41 light-years",
    mass: 6.98,
    radius: 1.43,
    discoveryYear: 2017,
    temperature: 230,
    notableFeatures: ["Rocky super-Earth", "Prime JWST target", "Transiting planet"],
    scientificSignificance: "Excellent target for atmospheric characterization"
  },
  {
    name: "K2-18b",
    alternateNames: ["EPIC 201912552 b"],
    objectType: "Exoplanet",
    description: "A super-Earth where JWST detected signs of water vapor and possible biosignature gases in its atmosphere.",
    constellation: "Leo",
    distanceLy: 124,
    distanceDisplay: "124 light-years",
    mass: 8.63,
    radius: 2.61,
    discoveryYear: 2015,
    temperature: 250,
    notableFeatures: ["Water vapor detected", "Possible biosignatures", "Hycean world candidate"],
    scientificSignificance: "First habitable-zone planet with detected water vapor"
  },
  {
    name: "TOI-700 d",
    alternateNames: [],
    objectType: "Exoplanet",
    description: "An Earth-sized planet in the habitable zone discovered by TESS. One of the smallest habitable zone planets known.",
    constellation: "Dorado",
    distanceLy: 101,
    distanceDisplay: "101 light-years",
    radius: 1.19,
    discoveryYear: 2020,
    discoverer: "TESS Science Team",
    temperature: 268,
    notableFeatures: ["Earth-sized", "TESS discovery", "Possibly tidally locked"],
    scientificSignificance: "First Earth-sized habitable zone planet from TESS"
  },
  {
    name: "Gliese 667 Cc",
    alternateNames: ["GJ 667 Cc"],
    objectType: "Exoplanet",
    description: "A super-Earth orbiting a red dwarf star in a triple star system. Located in the habitable zone with potential for liquid water.",
    constellation: "Scorpius",
    distanceLy: 23.6,
    distanceDisplay: "23.6 light-years",
    mass: 3.8,
    discoveryYear: 2011,
    temperature: 277,
    notableFeatures: ["In triple star system", "Super-Earth", "Near habitable zone center"],
    scientificSignificance: "One of closest potentially habitable planets"
  },
  {
    name: "HD 40307 g",
    alternateNames: [],
    objectType: "Exoplanet",
    description: "A super-Earth orbiting in the habitable zone of its star. Part of a six-planet system discovered through radial velocity.",
    constellation: "Pictor",
    distanceLy: 42,
    distanceDisplay: "42 light-years",
    mass: 7.1,
    discoveryYear: 2012,
    notableFeatures: ["Super-Earth", "197-day orbit", "Part of 6-planet system"],
    scientificSignificance: "Example of planet in complex multi-planet system"
  },
  {
    name: "Kepler-438b",
    alternateNames: [],
    objectType: "Exoplanet",
    description: "A rocky planet with one of the highest Earth Similarity Index scores ever calculated. May experience severe stellar flares.",
    constellation: "Lyra",
    distanceLy: 472,
    distanceDisplay: "472 light-years",
    radius: 1.12,
    discoveryYear: 2015,
    temperature: 276,
    notableFeatures: ["Highest ESI score", "Rocky composition", "Subject to stellar flares"],
    scientificSignificance: "Highest Earth Similarity Index of confirmed planets"
  },
  {
    name: "51 Pegasi b",
    alternateNames: ["Dimidium", "Bellerophon"],
    objectType: "Exoplanet",
    description: "The first exoplanet discovered orbiting a Sun-like star. A hot Jupiter that revolutionized our understanding of planetary systems.",
    constellation: "Pegasus",
    distanceLy: 50,
    distanceDisplay: "50 light-years",
    mass: 150, // About 0.47 Jupiter masses = 150 Earth masses
    discoveryYear: 1995,
    discoverer: "Michel Mayor & Didier Queloz",
    temperature: 1200,
    notableFeatures: ["First exoplanet around Sun-like star", "Hot Jupiter", "Nobel Prize discovery"],
    scientificSignificance: "Discovery led to 2019 Nobel Prize in Physics"
  },
  {
    name: "HD 209458 b",
    alternateNames: ["Osiris"],
    objectType: "Exoplanet",
    description: "The first exoplanet observed to transit its star and the first to have its atmosphere detected. A hot Jupiter with an evaporating atmosphere.",
    constellation: "Pegasus",
    distanceLy: 157,
    distanceDisplay: "157 light-years",
    mass: 220,
    radius: 15.7,
    discoveryYear: 1999,
    temperature: 1130,
    notableFeatures: ["First transiting exoplanet", "First atmosphere detection", "Evaporating atmosphere"],
    scientificSignificance: "Pioneer for exoplanet atmospheric studies"
  },
  {
    name: "WASP-12b",
    alternateNames: [],
    objectType: "Exoplanet",
    description: "An extremely hot Jupiter being devoured by its star. The planet is stretched into an egg shape and is losing mass rapidly.",
    constellation: "Auriga",
    distanceLy: 871,
    distanceDisplay: "871 light-years",
    mass: 460,
    radius: 20.4,
    discoveryYear: 2008,
    temperature: 2580,
    notableFeatures: ["Being consumed by star", "Egg-shaped", "Extremely hot"],
    scientificSignificance: "Best example of a planet being destroyed by its star"
  },
  {
    name: "HR 8799 b",
    alternateNames: [],
    objectType: "Exoplanet",
    description: "Part of the first multi-planet system ever directly imaged. A massive young planet orbiting far from its star.",
    constellation: "Pegasus",
    distanceLy: 129,
    distanceDisplay: "129 light-years",
    mass: 2200, // ~7 Jupiter masses
    discoveryYear: 2008,
    discoverer: "Christian Marois",
    temperature: 870,
    notableFeatures: ["Directly imaged", "Part of 4-planet system", "Young planet"],
    scientificSignificance: "First directly imaged multi-planet system"
  },
  {
    name: "55 Cancri e",
    alternateNames: ["Janssen"],
    objectType: "Exoplanet",
    description: "A super-Earth that may be covered in lava. Orbits so close to its star that its year is only 18 hours long.",
    constellation: "Cancer",
    distanceLy: 41,
    distanceDisplay: "41 light-years",
    mass: 8.63,
    radius: 1.88,
    discoveryYear: 2004,
    temperature: 2573,
    notableFeatures: ["18-hour year", "May have lava oceans", "Ultra-short period"],
    scientificSignificance: "Prime target for studying extreme rocky planets"
  },
  {
    name: "GJ 1214 b",
    alternateNames: [],
    objectType: "Exoplanet",
    description: "A water world or mini-Neptune with a thick atmosphere. One of the first super-Earths to have its atmosphere studied.",
    constellation: "Ophiuchus",
    distanceLy: 48,
    distanceDisplay: "48 light-years",
    mass: 6.55,
    radius: 2.68,
    discoveryYear: 2009,
    temperature: 555,
    notableFeatures: ["Possible water world", "Thick atmosphere", "Super-Earth archetype"],
    scientificSignificance: "First super-Earth with detected atmosphere"
  },
  {
    name: "Kepler-186f",
    alternateNames: [],
    objectType: "Exoplanet",
    description: "The first Earth-sized planet discovered in the habitable zone of another star. A potentially rocky world orbiting a red dwarf.",
    constellation: "Cygnus",
    distanceLy: 582,
    distanceDisplay: "582 light-years",
    radius: 1.17,
    discoveryYear: 2014,
    discoverer: "Elisa Quintana",
    temperature: 188,
    notableFeatures: ["First Earth-sized habitable zone planet", "Rocky composition", "Orbits red dwarf"],
    scientificSignificance: "Milestone discovery in search for Earth-like worlds"
  },
  {
    name: "Beta Pictoris b",
    alternateNames: [],
    objectType: "Exoplanet",
    description: "A young giant planet directly imaged orbiting within a famous debris disk. Still glowing from the heat of its formation.",
    constellation: "Pictor",
    distanceLy: 63,
    distanceDisplay: "63 light-years",
    mass: 3500, // ~11 Jupiter masses
    discoveryYear: 2008,
    age: 0.023,
    notableFeatures: ["Directly imaged", "In debris disk", "Young planet"],
    scientificSignificance: "Key for understanding planet formation"
  },
];

// ============================================
// BLACK HOLES
// ============================================
export const BLACK_HOLES: AstronomicalObject[] = [
  {
    name: "Sagittarius A*",
    alternateNames: ["Sgr A*", "Milky Way Black Hole"],
    objectType: "Black Hole",
    description: "The supermassive black hole at the center of our Milky Way galaxy. First imaged by the Event Horizon Telescope in 2022.",
    constellation: "Sagittarius",
    distanceLy: 26000,
    distanceDisplay: "26,000 light-years",
    mass: 4000000, // 4 million solar masses
    discoveryYear: 1974,
    discoverer: "Bruce Balick & Robert Brown",
    notableFeatures: ["Our galaxy's central black hole", "First Milky Way black hole imaged", "4 million solar masses"],
    scientificSignificance: "Direct evidence for supermassive black hole at galaxy center"
  },
  {
    name: "M87*",
    alternateNames: ["Powehi", "Messier 87 Black Hole"],
    objectType: "Black Hole",
    description: "The first black hole ever directly imaged by the Event Horizon Telescope in 2019. A supermassive black hole 6.5 billion times the mass of the Sun.",
    constellation: "Virgo",
    distanceLy: 55000000,
    distanceDisplay: "55 million light-years",
    mass: 6500000000, // 6.5 billion solar masses
    discoveryYear: 1918,
    notableFeatures: ["First black hole image", "Powerful relativistic jet", "6.5 billion solar masses"],
    scientificSignificance: "First direct image of a black hole"
  },
  {
    name: "Cygnus X-1",
    alternateNames: ["Cygnus XR-1", "HDE 226868"],
    objectType: "Black Hole",
    description: "One of the strongest X-ray sources in the sky and the first widely accepted black hole candidate. Part of a binary system with a blue supergiant star.",
    constellation: "Cygnus",
    distanceLy: 6100,
    distanceDisplay: "6,100 light-years",
    mass: 21,
    discoveryYear: 1964,
    notableFeatures: ["First confirmed stellar black hole", "X-ray binary system", "Subject of famous Hawking-Thorne bet"],
    scientificSignificance: "First widely accepted black hole"
  },
  {
    name: "GRS 1915+105",
    alternateNames: [],
    objectType: "Black Hole",
    description: "A stellar-mass black hole famous for its relativistic jets that appear to move faster than light. One of the most energetic objects in the Milky Way.",
    constellation: "Aquila",
    distanceLy: 36000,
    distanceDisplay: "36,000 light-years",
    mass: 14,
    discoveryYear: 1992,
    notableFeatures: ["First galactic superluminal jets", "Extreme X-ray variability", "Record-breaking spin"],
    scientificSignificance: "Revealed relativistic jet physics"
  },
  {
    name: "V404 Cygni",
    alternateNames: ["GS 2023+338"],
    objectType: "Black Hole",
    description: "A stellar-mass black hole in a binary system that undergoes dramatic outbursts visible across the electromagnetic spectrum.",
    constellation: "Cygnus",
    distanceLy: 7800,
    distanceDisplay: "7,800 light-years",
    mass: 9,
    discoveryYear: 1989,
    notableFeatures: ["Major outbursts observed", "Low-mass X-ray binary", "Well-studied mass measurement"],
    scientificSignificance: "Best example of black hole accretion physics"
  },
  {
    name: "TON 618",
    alternateNames: [],
    objectType: "Black Hole",
    description: "One of the most massive known black holes in the universe, with a mass of 66 billion solar masses. Powers an extremely luminous quasar.",
    constellation: "Canes Venatici",
    distanceLy: 10400000000,
    distanceDisplay: "10.4 billion light-years",
    mass: 66000000000,
    discoveryYear: 1957,
    notableFeatures: ["One of most massive black holes known", "Powers hyperluminous quasar", "66 billion solar masses"],
    scientificSignificance: "Challenges understanding of black hole growth"
  },
  {
    name: "Phoenix A Black Hole",
    alternateNames: ["Phoenix A*"],
    objectType: "Black Hole",
    description: "The most massive black hole with a direct mass measurement. Located in the Phoenix Cluster, it has a mass of 100 billion solar masses.",
    constellation: "Phoenix",
    distanceLy: 5700000000,
    distanceDisplay: "5.7 billion light-years",
    mass: 100000000000,
    discoveryYear: 2012,
    notableFeatures: ["Most massive measured black hole", "In Phoenix Cluster", "100 billion solar masses"],
    scientificSignificance: "Most extreme known black hole"
  },
  {
    name: "NGC 1277 Black Hole",
    alternateNames: [],
    objectType: "Black Hole",
    description: "A black hole that makes up 14% of its galaxy's total mass - far more than typical. May represent a relic from the early universe.",
    constellation: "Perseus",
    distanceLy: 220000000,
    distanceDisplay: "220 million light-years",
    mass: 17000000000,
    discoveryYear: 2012,
    notableFeatures: ["14% of galaxy mass", "Possibly primordial", "Oversized for galaxy"],
    scientificSignificance: "Challenges black hole-galaxy co-evolution models"
  },
];

// ============================================
// PULSARS AND NEUTRON STARS
// ============================================
export const PULSARS: AstronomicalObject[] = [
  {
    name: "Crab Pulsar",
    alternateNames: ["PSR B0531+21", "PSR J0534+2200"],
    objectType: "Pulsar",
    description: "The pulsar at the center of the Crab Nebula, spinning 30 times per second. One of the most studied pulsars in the sky.",
    constellation: "Taurus",
    distanceLy: 6500,
    distanceDisplay: "6,500 light-years",
    discoveryYear: 1968,
    discoverer: "David Staelin & Edward Reifenstein",
    age: 0.001,
    notableFeatures: ["30 rotations per second", "Powers Crab Nebula", "Young pulsar"],
    scientificSignificance: "Best studied young pulsar"
  },
  {
    name: "Vela Pulsar",
    alternateNames: ["PSR B0833-45", "PSR J0835-4510"],
    objectType: "Pulsar",
    description: "One of the brightest radio pulsars in the sky. Powers the Vela Supernova Remnant and was formed about 11,000 years ago.",
    constellation: "Vela",
    distanceLy: 815,
    distanceDisplay: "815 light-years",
    discoveryYear: 1968,
    age: 0.011,
    notableFeatures: ["Powers Vela remnant", "Exhibits glitches", "Third brightest gamma-ray source"],
    scientificSignificance: "Key for understanding pulsar glitches"
  },
  {
    name: "PSR B1919+21",
    alternateNames: ["CP 1919", "LGM-1"],
    objectType: "Pulsar",
    description: "The first pulsar ever discovered, initially suspected to be a signal from extraterrestrial intelligence before its true nature was understood.",
    constellation: "Vulpecula",
    distanceLy: 2283,
    distanceDisplay: "2,283 light-years",
    discoveryYear: 1967,
    discoverer: "Jocelyn Bell Burnell & Antony Hewish",
    notableFeatures: ["First discovered pulsar", "Initially called 'LGM-1'", "Nobel Prize discovery"],
    scientificSignificance: "Discovery revolutionized astrophysics"
  },
  {
    name: "PSR J0437-4715",
    alternateNames: [],
    objectType: "Pulsar",
    description: "The closest and brightest millisecond pulsar to Earth. Rotates 173 times per second with incredible precision.",
    constellation: "Pictor",
    distanceLy: 510,
    distanceDisplay: "510 light-years",
    discoveryYear: 1993,
    notableFeatures: ["Closest millisecond pulsar", "Extremely stable", "173 Hz rotation"],
    scientificSignificance: "Best timing precision of any pulsar"
  },
  {
    name: "PSR J1748-2446ad",
    alternateNames: [],
    objectType: "Pulsar",
    description: "The fastest spinning pulsar known, rotating 716 times per second. At this speed, its surface moves at nearly a quarter the speed of light.",
    constellation: "Sagittarius",
    distanceLy: 18000,
    distanceDisplay: "18,000 light-years",
    discoveryYear: 2004,
    discoverer: "Jason Hessels",
    notableFeatures: ["Fastest known pulsar", "716 Hz rotation", "Surface at 24% light speed"],
    scientificSignificance: "Tests limits of neutron star physics"
  },
  {
    name: "PSR B1257+12",
    alternateNames: ["Lich"],
    objectType: "Pulsar",
    description: "The first pulsar found to host exoplanets. Its three planets were the first planets discovered outside our solar system.",
    constellation: "Virgo",
    distanceLy: 2300,
    distanceDisplay: "2,300 light-years",
    discoveryYear: 1990,
    discoverer: "Aleksander Wolszczan",
    notableFeatures: ["First pulsar planets", "Three-planet system", "First exoplanets confirmed"],
    scientificSignificance: "First confirmed exoplanetary system"
  },
  {
    name: "Magnetar SGR 1806-20",
    alternateNames: [],
    objectType: "Magnetar",
    description: "The magnetar that produced the most powerful stellar explosion ever observed in 2004. Its magnetic field is the strongest known in the universe.",
    constellation: "Sagittarius",
    distanceLy: 50000,
    distanceDisplay: "50,000 light-years",
    discoveryYear: 1979,
    notableFeatures: ["Most powerful stellar explosion", "Strongest magnetic field known", "Giant flare in 2004"],
    scientificSignificance: "Most extreme magnetic object known"
  },
  {
    name: "Magnetar 1E 2259+586",
    alternateNames: [],
    objectType: "Magnetar",
    description: "A magnetar that exhibited an anti-glitch - a sudden spin-down instead of the typical spin-up. Located in the supernova remnant CTB 109.",
    constellation: "Cassiopeia",
    distanceLy: 13000,
    distanceDisplay: "13,000 light-years",
    discoveryYear: 1981,
    notableFeatures: ["Anti-glitch observed", "In supernova remnant", "X-ray pulsar"],
    scientificSignificance: "First observed anti-glitch challenges pulsar models"
  },
];

// ============================================
// QUASARS
// ============================================
export const QUASARS: AstronomicalObject[] = [
  {
    name: "3C 273",
    alternateNames: [],
    objectType: "Quasar",
    description: "The first quasar ever identified and the optically brightest quasar in the sky. Despite being 2.4 billion light-years away, it's visible with amateur telescopes.",
    constellation: "Virgo",
    distanceLy: 2400000000,
    distanceDisplay: "2.4 billion light-years",
    discoveryYear: 1963,
    discoverer: "Maarten Schmidt",
    magnitude: 12.9,
    luminosity: 4000000000000, // 4 trillion solar luminosities
    notableFeatures: ["First quasar identified", "Brightest optical quasar", "Visible jet"],
    scientificSignificance: "Discovery established quasars as distant, powerful objects"
  },
  {
    name: "3C 48",
    alternateNames: [],
    objectType: "Quasar",
    description: "The first object classified as a quasar, though its true nature was understood after 3C 273. A compact, blue star-like object with peculiar emission lines.",
    constellation: "Triangulum",
    distanceLy: 3900000000,
    distanceDisplay: "3.9 billion light-years",
    discoveryYear: 1960,
    discoverer: "Allan Sandage",
    magnitude: 16.2,
    notableFeatures: ["First quasar-class object found", "Compact blue appearance", "Strong radio source"],
    scientificSignificance: "First recognized member of quasar class"
  },
  {
    name: "ULAS J1342+0928",
    alternateNames: [],
    objectType: "Quasar",
    description: "One of the most distant quasars known, shining from when the universe was only 690 million years old. Powered by a 800-million-solar-mass black hole.",
    constellation: "Bootes",
    distanceLy: 13100000000,
    distanceDisplay: "13.1 billion light-years",
    discoveryYear: 2017,
    discoverer: "Eduardo Bañados",
    mass: 800000000,
    notableFeatures: ["Most distant known quasar", "Very early universe", "800 million solar mass black hole"],
    scientificSignificance: "Probes earliest epoch of black hole formation"
  },
  {
    name: "Markarian 421",
    alternateNames: ["Mrk 421"],
    objectType: "Quasar",
    description: "One of the closest blazars to Earth. A quasar with its jet pointed directly at us, making it extremely bright in gamma rays.",
    constellation: "Ursa Major",
    distanceLy: 397000000,
    distanceDisplay: "397 million light-years",
    discoveryYear: 1968,
    magnitude: 13.3,
    notableFeatures: ["Closest bright blazar", "Extreme gamma-ray variability", "Relativistic jet aimed at Earth"],
    scientificSignificance: "Key object for studying relativistic jets"
  },
  {
    name: "APM 08279+5255",
    alternateNames: [],
    objectType: "Quasar",
    description: "An extremely luminous quasar gravitationally lensed by a foreground galaxy. Contains the largest known reservoir of water in the universe.",
    constellation: "Lynx",
    distanceLy: 12100000000,
    distanceDisplay: "12.1 billion light-years",
    discoveryYear: 1998,
    luminosity: 100000000000000,
    notableFeatures: ["Largest water reservoir known", "Gravitationally lensed", "Hyperluminous"],
    scientificSignificance: "Contains 140 trillion times Earth's ocean water"
  },
  {
    name: "OJ 287",
    alternateNames: [],
    objectType: "Quasar",
    description: "A binary supermassive black hole system where a smaller black hole orbits and periodically crashes through the accretion disk of the larger one.",
    constellation: "Cancer",
    distanceLy: 3500000000,
    distanceDisplay: "3.5 billion light-years",
    discoveryYear: 1891,
    mass: 18400000000,
    notableFeatures: ["Binary supermassive black hole", "12-year orbital period", "Periodic outbursts"],
    scientificSignificance: "Best evidence for supermassive black hole binary"
  },
];

// ============================================
// FAMOUS COMETS
// ============================================
export const COMETS: AstronomicalObject[] = [
  {
    name: "Halley's Comet",
    alternateNames: ["1P/Halley", "Comet Halley"],
    objectType: "Comet",
    description: "The most famous comet in history, visible from Earth every 75-79 years. Named after Edmond Halley who predicted its return.",
    constellation: "Aquarius",
    discoveryYear: -239,
    discoverer: "Edmond Halley (predicted return)",
    notableFeatures: ["Most famous comet", "75-79 year period", "Recorded since 240 BC"],
    scientificSignificance: "First comet proven to be periodic"
  },
  {
    name: "Comet Hale-Bopp",
    alternateNames: ["C/1995 O1"],
    objectType: "Comet",
    description: "One of the most widely observed comets of the 20th century. Visible to the naked eye for a record 18 months in 1996-1997.",
    distanceLy: 0.00004,
    distanceDisplay: "Perihelion: 0.91 AU",
    discoveryYear: 1995,
    discoverer: "Alan Hale & Thomas Bopp",
    notableFeatures: ["Visible for 18 months", "Great Comet of 1997", "Two distinct tails"],
    scientificSignificance: "Most observed comet in history"
  },
  {
    name: "Comet NEOWISE",
    alternateNames: ["C/2020 F3"],
    objectType: "Comet",
    description: "A spectacular naked-eye comet visible in 2020. The brightest comet in the northern hemisphere since Hale-Bopp.",
    discoveryYear: 2020,
    discoverer: "NEOWISE spacecraft",
    notableFeatures: ["Brightest comet since Hale-Bopp", "2020 Great Comet", "Spectacular dust tail"],
    scientificSignificance: "Brightest comet of the 21st century so far"
  },
  {
    name: "Comet 67P/Churyumov-Gerasimenko",
    alternateNames: ["67P", "Chury"],
    objectType: "Comet",
    description: "The first comet to be orbited and landed on by a spacecraft. ESA's Rosetta mission revealed its duck-shaped nucleus.",
    discoveryYear: 1969,
    discoverer: "Klim Churyumov & Svetlana Gerasimenko",
    notableFeatures: ["First comet orbited by spacecraft", "Duck-shaped nucleus", "Philae lander"],
    scientificSignificance: "Most thoroughly studied comet"
  },
  {
    name: "Comet Shoemaker-Levy 9",
    alternateNames: ["D/1993 F2"],
    objectType: "Comet",
    description: "The comet that broke apart and spectacularly collided with Jupiter in 1994. The first direct observation of an extraterrestrial collision.",
    discoveryYear: 1993,
    discoverer: "Carolyn & Eugene Shoemaker, David Levy",
    notableFeatures: ["Collided with Jupiter", "First observed impact", "Broke into 21 fragments"],
    scientificSignificance: "First observed planetary impact"
  },
  {
    name: "Comet Wild 2",
    alternateNames: ["81P/Wild"],
    objectType: "Comet",
    description: "A comet sampled by NASA's Stardust mission, which returned cometary dust to Earth for analysis in 2006.",
    discoveryYear: 1978,
    discoverer: "Paul Wild",
    notableFeatures: ["Sample returned to Earth", "Contains pre-solar grains", "Stardust mission target"],
    scientificSignificance: "First comet sample return mission"
  },
];

// Helper function to get all astronomical objects
export function getAllAstronomicalObjects(): AstronomicalObject[] {
  return [
    ...REAL_STARS,
    ...MESSIER_OBJECTS,
    ...EXOPLANETS,
    ...BLACK_HOLES,
    ...PULSARS,
    ...QUASARS,
    ...COMETS,
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

  // Shuffle and return requested count
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const TOTAL_AVAILABLE_OBJECTS = getAllAstronomicalObjects().length;
