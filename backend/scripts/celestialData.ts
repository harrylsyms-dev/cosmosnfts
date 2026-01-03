// Comprehensive Celestial Objects Database for CosmoNFT
// 20,000 real celestial objects with proper rarity distribution
//
// RARITY DISTRIBUTION FOR 20,000 NFTs:
// - Legendary (0.05%): ~10 objects (unique black holes, first discoveries)
// - Ultra Rare (0.45%): ~90 objects (supermassive black holes, famous quasars)
// - Very Rare (1%): ~200 objects (pulsars, magnetars, quasars)
// - Rare (3.5%): ~700 objects (supernovae, unusual stars, ring galaxies)
// - Uncommon (15%): ~3,000 objects (famous stars, galaxies, nebulae)
// - Common (80%): ~16,000 objects (catalog stars, galaxies, clusters)

export interface CelestialObject {
  name: string;
  description: string;
  fameVisibility: number;
  scientificSignificance: number;
  rarity: number;
  discoveryRecency: number;
  culturalImpact: number;
  discoveryYear: number;
  objectType: string;
  constellation?: string;
  distance?: string;
  rarityTier?: 'legendary' | 'ultra_rare' | 'very_rare' | 'rare' | 'uncommon' | 'common';
}

// Premium Auction Items - 20 ultra-rare objects reserved for auctions
// These are the most iconic and valuable celestial objects in the collection
export const auctionReservedObjects: CelestialObject[] = [
  // Solar System Treasures (10)
  { name: 'Sun', description: 'Our star, a G-type main-sequence star at the heart of our solar system. The source of all life on Earth, its nuclear fusion powers the entire system.', fameVisibility: 100, scientificSignificance: 100, rarity: 100, discoveryRecency: 30, culturalImpact: 100, discoveryYear: -10000, objectType: 'Star', distance: '0', rarityTier: 'legendary' },
  { name: 'Earth', description: 'Our home planet, the only known world to harbor life. A pale blue dot suspended in a sunbeam, precious beyond measure.', fameVisibility: 100, scientificSignificance: 100, rarity: 100, discoveryRecency: 30, culturalImpact: 100, discoveryYear: -10000, objectType: 'Planet', distance: '0', rarityTier: 'legendary' },
  { name: 'Moon', description: 'Earth\'s only natural satellite, shaping our tides and nights. The first celestial body visited by humans in 1969.', fameVisibility: 100, scientificSignificance: 98, rarity: 95, discoveryRecency: 30, culturalImpact: 100, discoveryYear: -10000, objectType: 'Moon', distance: '384,400 km', rarityTier: 'legendary' },
  { name: 'Mars', description: 'The Red Planet, named for the god of war. Our best hope for human colonization, with evidence of ancient water.', fameVisibility: 98, scientificSignificance: 98, rarity: 90, discoveryRecency: 40, culturalImpact: 98, discoveryYear: -2000, objectType: 'Planet', distance: '225M km', rarityTier: 'legendary' },
  { name: 'Jupiter', description: 'The king of planets, a gas giant with 95 known moons. Its Great Red Spot has raged for centuries.', fameVisibility: 98, scientificSignificance: 95, rarity: 92, discoveryRecency: 38, culturalImpact: 95, discoveryYear: -700, objectType: 'Planet', distance: '778M km', rarityTier: 'legendary' },
  { name: 'Saturn', description: 'The ringed wonder of our solar system. Its spectacular rings span 282,000 km but are only 10 meters thick.', fameVisibility: 98, scientificSignificance: 94, rarity: 94, discoveryRecency: 40, culturalImpact: 98, discoveryYear: -700, objectType: 'Planet', distance: '1.4B km', rarityTier: 'legendary' },
  { name: 'Milky Way', description: 'Our home galaxy, a barred spiral containing 100-400 billion stars. We orbit its center once every 230 million years.', fameVisibility: 100, scientificSignificance: 100, rarity: 100, discoveryRecency: 35, culturalImpact: 100, discoveryYear: -10000, objectType: 'Galaxy', distance: '0', rarityTier: 'legendary' },
  { name: 'Andromeda Galaxy', description: 'The nearest major galaxy to the Milky Way, containing one trillion stars. Will collide with our galaxy in 4.5 billion years.', fameVisibility: 98, scientificSignificance: 95, rarity: 95, discoveryRecency: 50, culturalImpact: 95, discoveryYear: 964, objectType: 'Galaxy', distance: '2.537M ly', rarityTier: 'legendary' },
  { name: 'Halley\'s Comet', description: 'The most famous comet, returning every 75-76 years. Observed since at least 240 BC, a celestial time capsule.', fameVisibility: 98, scientificSignificance: 90, rarity: 95, discoveryRecency: 45, culturalImpact: 99, discoveryYear: -240, objectType: 'Comet', rarityTier: 'legendary' },
  { name: 'Orion Nebula', description: 'The brightest diffuse nebula in the sky, a stellar nursery 1,344 light-years away. The closest massive star-forming region to Earth.', fameVisibility: 98, scientificSignificance: 95, rarity: 92, discoveryRecency: 50, culturalImpact: 95, discoveryYear: 1610, objectType: 'Nebula', constellation: 'Orion', distance: '1344 ly', rarityTier: 'legendary' },
  // Cosmic Wonders (10)
  { name: 'Sagittarius A*', description: 'The supermassive black hole at the center of the Milky Way, 4 million solar masses. The heart of our galaxy.', fameVisibility: 95, scientificSignificance: 99, rarity: 99, discoveryRecency: 85, culturalImpact: 92, discoveryYear: 1974, objectType: 'Black Hole', distance: '26,000 ly', rarityTier: 'legendary' },
  { name: 'M87*', description: 'The first black hole ever imaged by humanity, at the heart of galaxy M87. 6.5 billion solar masses of pure cosmic power.', fameVisibility: 92, scientificSignificance: 99, rarity: 99, discoveryRecency: 98, culturalImpact: 95, discoveryYear: 2019, objectType: 'Black Hole', distance: '53M ly', rarityTier: 'legendary' },
  { name: 'Pillars of Creation', description: 'Iconic elephant trunk structures in the Eagle Nebula, immortalized by Hubble. A cosmic cathedral of star birth.', fameVisibility: 95, scientificSignificance: 92, rarity: 95, discoveryRecency: 75, culturalImpact: 98, discoveryYear: 1995, objectType: 'Nebula', constellation: 'Serpens', distance: '7000 ly', rarityTier: 'legendary' },
  { name: 'Voyager 1 Position', description: 'The most distant human-made object, now in interstellar space. Carrying the Golden Record message to the cosmos.', fameVisibility: 95, scientificSignificance: 98, rarity: 100, discoveryRecency: 95, culturalImpact: 98, discoveryYear: 1977, objectType: 'Spacecraft', distance: '24B km', rarityTier: 'legendary' },
  { name: 'Proxima Centauri b', description: 'The closest known exoplanet to Earth, orbiting in the habitable zone of our nearest stellar neighbor. Our nearest other world.', fameVisibility: 85, scientificSignificance: 98, rarity: 98, discoveryRecency: 95, culturalImpact: 90, discoveryYear: 2016, objectType: 'Exoplanet', distance: '4.24 ly', rarityTier: 'legendary' },
  { name: 'Crab Nebula', description: 'The remnant of supernova SN 1054, containing a pulsar spinning 30 times per second. The first identified pulsar wind nebula.', fameVisibility: 90, scientificSignificance: 98, rarity: 95, discoveryRecency: 55, culturalImpact: 92, discoveryYear: 1054, objectType: 'Nebula', constellation: 'Taurus', distance: '6500 ly', rarityTier: 'legendary' },
  { name: 'TON 618', description: 'One of the most massive black holes known, estimated at 66 billion solar masses. A true cosmic monster.', fameVisibility: 75, scientificSignificance: 98, rarity: 99, discoveryRecency: 65, culturalImpact: 70, discoveryYear: 1957, objectType: 'Black Hole', distance: '10.4B ly', rarityTier: 'legendary' },
  { name: 'GW150914', description: 'The first gravitational waves ever detected by humanity, from two merging black holes. The dawn of gravitational wave astronomy.', fameVisibility: 82, scientificSignificance: 100, rarity: 100, discoveryRecency: 95, culturalImpact: 95, discoveryYear: 2015, objectType: 'Black Hole Merger', rarityTier: 'legendary' },
  { name: 'Cosmic Microwave Background', description: 'The oldest light in the universe, from 380,000 years after the Big Bang. The afterglow of creation itself.', fameVisibility: 80, scientificSignificance: 100, rarity: 100, discoveryRecency: 60, culturalImpact: 90, discoveryYear: 1965, objectType: 'Cosmic Phenomenon', rarityTier: 'legendary' },
  { name: 'Hubble Deep Field', description: 'One of the most iconic images in astronomy, showing nearly 10,000 galaxies in a tiny patch of sky. A window to the ancient universe.', fameVisibility: 90, scientificSignificance: 98, rarity: 100, discoveryRecency: 75, culturalImpact: 98, discoveryYear: 1995, objectType: 'Deep Field', rarityTier: 'legendary' },
];

// Additional Solar System Objects (remaining planets, moons, etc.)
export const solarSystemObjects: CelestialObject[] = [
  { name: 'Venus', description: 'Earth\'s twin in size, shrouded in thick clouds. The hottest planet with surface temperatures that melt lead.', fameVisibility: 95, scientificSignificance: 92, rarity: 88, discoveryRecency: 35, culturalImpact: 92, discoveryYear: -3000, objectType: 'Planet', distance: '108M km', rarityTier: 'ultra_rare' },
  { name: 'Mercury', description: 'The smallest planet and closest to the Sun, with extreme temperature swings from -180°C to 430°C.', fameVisibility: 85, scientificSignificance: 85, rarity: 85, discoveryRecency: 35, culturalImpact: 80, discoveryYear: -3000, objectType: 'Planet', distance: '58M km', rarityTier: 'ultra_rare' },
  { name: 'Uranus', description: 'The ice giant that spins on its side, likely knocked over by an ancient collision. First planet discovered by telescope.', fameVisibility: 85, scientificSignificance: 88, rarity: 90, discoveryRecency: 55, culturalImpact: 78, discoveryYear: 1781, objectType: 'Planet', distance: '2.9B km', rarityTier: 'ultra_rare' },
  { name: 'Neptune', description: 'The windiest planet with storms reaching 2,100 km/h. Its existence was predicted by mathematics before being seen.', fameVisibility: 82, scientificSignificance: 90, rarity: 92, discoveryRecency: 58, culturalImpact: 75, discoveryYear: 1846, objectType: 'Planet', distance: '4.5B km', rarityTier: 'ultra_rare' },
  { name: 'Pluto', description: 'The former ninth planet, now a dwarf planet with a heart-shaped glacier and five moons. Visited by New Horizons in 2015.', fameVisibility: 92, scientificSignificance: 88, rarity: 88, discoveryRecency: 85, culturalImpact: 95, discoveryYear: 1930, objectType: 'Dwarf Planet', distance: '5.9B km', rarityTier: 'ultra_rare' },
  { name: 'Titan', description: 'Saturn\'s largest moon with a thick atmosphere and liquid methane lakes. The only moon with a substantial atmosphere.', fameVisibility: 82, scientificSignificance: 95, rarity: 90, discoveryRecency: 80, culturalImpact: 78, discoveryYear: 1655, objectType: 'Moon', distance: '1.2B km', rarityTier: 'ultra_rare' },
  { name: 'Europa', description: 'Jupiter\'s ice-covered moon with a subsurface ocean. One of the most promising places to search for extraterrestrial life.', fameVisibility: 80, scientificSignificance: 98, rarity: 92, discoveryRecency: 85, culturalImpact: 82, discoveryYear: 1610, objectType: 'Moon', distance: '628M km', rarityTier: 'ultra_rare' },
  { name: 'Enceladus', description: 'Saturn\'s icy moon with geysers shooting water into space. Another prime candidate for alien life.', fameVisibility: 75, scientificSignificance: 96, rarity: 92, discoveryRecency: 88, culturalImpact: 75, discoveryYear: 1789, objectType: 'Moon', distance: '1.27B km', rarityTier: 'ultra_rare' },
  { name: 'Io', description: 'Jupiter\'s volcanic moon, the most geologically active body in the solar system with hundreds of active volcanoes.', fameVisibility: 78, scientificSignificance: 90, rarity: 88, discoveryRecency: 75, culturalImpact: 72, discoveryYear: 1610, objectType: 'Moon', distance: '628M km', rarityTier: 'ultra_rare' },
  { name: 'Ceres', description: 'The largest object in the asteroid belt and a dwarf planet, with bright spots and a possible subsurface ocean.', fameVisibility: 72, scientificSignificance: 88, rarity: 88, discoveryRecency: 78, culturalImpact: 68, discoveryYear: 1801, objectType: 'Dwarf Planet', distance: '413M km', rarityTier: 'ultra_rare' },
];

// Famous Stars (100 objects)
export const famousStars: CelestialObject[] = [
  { name: 'Sirius', description: 'The brightest star in the night sky, a binary star system in Canis Major. Known as the "Dog Star", it has guided navigators for millennia.', fameVisibility: 98, scientificSignificance: 88, rarity: 75, discoveryRecency: 60, culturalImpact: 98, discoveryYear: -3000, objectType: 'Star', constellation: 'Canis Major', distance: '8.6 ly' },
  { name: 'Polaris', description: 'The North Star, a triple star system crucial for navigation. Currently aligned with Earth\'s rotational axis.', fameVisibility: 96, scientificSignificance: 82, rarity: 80, discoveryRecency: 55, culturalImpact: 99, discoveryYear: -2000, objectType: 'Star', constellation: 'Ursa Minor', distance: '433 ly' },
  { name: 'Betelgeuse', description: 'A red supergiant nearing the end of its life, one of the largest stars visible. Could explode as a supernova any time in the next 100,000 years.', fameVisibility: 94, scientificSignificance: 95, rarity: 88, discoveryRecency: 75, culturalImpact: 92, discoveryYear: -1000, objectType: 'Star', constellation: 'Orion', distance: '700 ly' },
  { name: 'Rigel', description: 'A blue supergiant, the brightest star in Orion and 7th brightest in the night sky. 120,000 times more luminous than the Sun.', fameVisibility: 90, scientificSignificance: 85, rarity: 82, discoveryRecency: 58, culturalImpact: 85, discoveryYear: -1500, objectType: 'Star', constellation: 'Orion', distance: '860 ly' },
  { name: 'Vega', description: 'The 5th brightest star, once used as the zero point for stellar magnitude. The first star other than the Sun to be photographed.', fameVisibility: 92, scientificSignificance: 90, rarity: 78, discoveryRecency: 65, culturalImpact: 88, discoveryYear: -2500, objectType: 'Star', constellation: 'Lyra', distance: '25 ly' },
  { name: 'Arcturus', description: 'The brightest star in the northern celestial hemisphere, a red giant 25 times larger than the Sun.', fameVisibility: 88, scientificSignificance: 80, rarity: 75, discoveryRecency: 55, culturalImpact: 82, discoveryYear: -2000, objectType: 'Star', constellation: 'Bootes', distance: '37 ly' },
  { name: 'Capella', description: 'A quadruple star system, the 6th brightest star. Two giant stars orbit each other every 104 days.', fameVisibility: 85, scientificSignificance: 82, rarity: 80, discoveryRecency: 60, culturalImpact: 78, discoveryYear: -1500, objectType: 'Star', constellation: 'Auriga', distance: '43 ly' },
  { name: 'Aldebaran', description: 'The "Eye of Taurus", an orange giant 44 times the Sun\'s diameter. Once a navigation star for Apollo missions.', fameVisibility: 87, scientificSignificance: 78, rarity: 76, discoveryRecency: 52, culturalImpact: 85, discoveryYear: -3000, objectType: 'Star', constellation: 'Taurus', distance: '65 ly' },
  { name: 'Antares', description: 'The "Heart of the Scorpion", a red supergiant rivaling Mars in color. 700 times the Sun\'s diameter.', fameVisibility: 86, scientificSignificance: 84, rarity: 85, discoveryRecency: 58, culturalImpact: 88, discoveryYear: -2500, objectType: 'Star', constellation: 'Scorpius', distance: '550 ly' },
  { name: 'Spica', description: 'A binary star system, the brightest star in Virgo. Both components are massive and luminous.', fameVisibility: 82, scientificSignificance: 80, rarity: 78, discoveryRecency: 55, culturalImpact: 75, discoveryYear: -2000, objectType: 'Star', constellation: 'Virgo', distance: '250 ly' },
  { name: 'Procyon', description: 'The 8th brightest star, a binary system with a white dwarf companion. Name means "before the dog" in Greek.', fameVisibility: 80, scientificSignificance: 82, rarity: 75, discoveryRecency: 62, culturalImpact: 72, discoveryYear: -1000, objectType: 'Star', constellation: 'Canis Minor', distance: '11.5 ly' },
  { name: 'Achernar', description: 'The flattest star known, spinning so fast it bulges at the equator. 9th brightest star.', fameVisibility: 78, scientificSignificance: 88, rarity: 90, discoveryRecency: 70, culturalImpact: 65, discoveryYear: -500, objectType: 'Star', constellation: 'Eridanus', distance: '139 ly' },
  { name: 'Deneb', description: 'One of the most luminous stars known, 200,000 times the Sun\'s luminosity. Tail of the Swan.', fameVisibility: 84, scientificSignificance: 86, rarity: 88, discoveryRecency: 58, culturalImpact: 80, discoveryYear: -2000, objectType: 'Star', constellation: 'Cygnus', distance: '2615 ly' },
  { name: 'Altair', description: 'One of the closest visible stars, spins extremely rapidly completing a rotation in just 9 hours.', fameVisibility: 82, scientificSignificance: 78, rarity: 72, discoveryRecency: 68, culturalImpact: 78, discoveryYear: -1500, objectType: 'Star', constellation: 'Aquila', distance: '17 ly' },
  { name: 'Fomalhaut', description: 'The "Lonely Star of Autumn", surrounded by a debris disk with a confirmed exoplanet.', fameVisibility: 76, scientificSignificance: 92, rarity: 85, discoveryRecency: 82, culturalImpact: 70, discoveryYear: -2500, objectType: 'Star', constellation: 'Piscis Austrinus', distance: '25 ly' },
  { name: 'Canopus', description: 'The 2nd brightest star, used for spacecraft navigation. Important in ancient Egyptian astronomy.', fameVisibility: 90, scientificSignificance: 82, rarity: 80, discoveryRecency: 50, culturalImpact: 88, discoveryYear: -3500, objectType: 'Star', constellation: 'Carina', distance: '310 ly' },
  { name: 'Regulus', description: 'The "Heart of the Lion", a quadruple star system spinning so fast it\'s nearly tearing itself apart.', fameVisibility: 80, scientificSignificance: 85, rarity: 82, discoveryRecency: 72, culturalImpact: 78, discoveryYear: -3000, objectType: 'Star', constellation: 'Leo', distance: '79 ly' },
  { name: 'Pollux', description: 'The brightest star in Gemini, an orange giant with a confirmed exoplanet. Twin of Castor.', fameVisibility: 78, scientificSignificance: 80, rarity: 76, discoveryRecency: 75, culturalImpact: 82, discoveryYear: -2000, objectType: 'Star', constellation: 'Gemini', distance: '34 ly' },
  { name: 'Castor', description: 'A sextuple star system, six stars bound gravitationally. Twin of Pollux in Gemini.', fameVisibility: 76, scientificSignificance: 88, rarity: 92, discoveryRecency: 68, culturalImpact: 80, discoveryYear: -2000, objectType: 'Star', constellation: 'Gemini', distance: '51 ly' },
  { name: 'Mimosa', description: 'The 2nd brightest star in the Southern Cross, a beta Cephei variable star.', fameVisibility: 72, scientificSignificance: 78, rarity: 75, discoveryRecency: 55, culturalImpact: 85, discoveryYear: -1000, objectType: 'Star', constellation: 'Crux', distance: '280 ly' },
  { name: 'Acrux', description: 'The southernmost first-magnitude star, a triple star system at the foot of the Southern Cross.', fameVisibility: 74, scientificSignificance: 80, rarity: 78, discoveryRecency: 52, culturalImpact: 88, discoveryYear: -500, objectType: 'Star', constellation: 'Crux', distance: '320 ly' },
  { name: 'Alpha Centauri A', description: 'The larger star in our nearest stellar neighbor system, very similar to the Sun.', fameVisibility: 88, scientificSignificance: 95, rarity: 92, discoveryRecency: 70, culturalImpact: 90, discoveryYear: 1689, objectType: 'Star', constellation: 'Centaurus', distance: '4.37 ly' },
  { name: 'Alpha Centauri B', description: 'The smaller companion in the Alpha Centauri system, an orange dwarf star.', fameVisibility: 85, scientificSignificance: 92, rarity: 90, discoveryRecency: 70, culturalImpact: 85, discoveryYear: 1689, objectType: 'Star', constellation: 'Centaurus', distance: '4.37 ly' },
  { name: 'Proxima Centauri', description: 'The closest star to the Sun, a red dwarf with confirmed exoplanets in the habitable zone.', fameVisibility: 82, scientificSignificance: 98, rarity: 95, discoveryRecency: 88, culturalImpact: 88, discoveryYear: 1915, objectType: 'Star', constellation: 'Centaurus', distance: '4.24 ly' },
  { name: 'Barnard\'s Star', description: 'The fastest-moving star in the sky relative to the Sun, a red dwarf with a possible exoplanet.', fameVisibility: 70, scientificSignificance: 90, rarity: 88, discoveryRecency: 75, culturalImpact: 72, discoveryYear: 1916, objectType: 'Star', constellation: 'Ophiuchus', distance: '5.96 ly' },
  { name: 'Wolf 359', description: 'One of the nearest stars, a faint red dwarf made famous by science fiction.', fameVisibility: 65, scientificSignificance: 75, rarity: 82, discoveryRecency: 68, culturalImpact: 78, discoveryYear: 1918, objectType: 'Star', constellation: 'Leo', distance: '7.86 ly' },
  { name: 'Tau Ceti', description: 'A Sun-like star with a planetary system, long considered a prime target for SETI.', fameVisibility: 72, scientificSignificance: 88, rarity: 85, discoveryRecency: 80, culturalImpact: 82, discoveryYear: -300, objectType: 'Star', constellation: 'Cetus', distance: '11.9 ly' },
  { name: 'Epsilon Eridani', description: 'One of the nearest Sun-like stars with a debris disk and at least one planet.', fameVisibility: 68, scientificSignificance: 85, rarity: 82, discoveryRecency: 78, culturalImpact: 75, discoveryYear: -200, objectType: 'Star', constellation: 'Eridanus', distance: '10.5 ly' },
  { name: 'Mira', description: 'The first non-supernova variable star discovered, pulsating over 332 days with a tail like a comet.', fameVisibility: 75, scientificSignificance: 92, rarity: 90, discoveryRecency: 60, culturalImpact: 78, discoveryYear: 1596, objectType: 'Star', constellation: 'Cetus', distance: '299 ly' },
  { name: 'Algol', description: 'The "Demon Star", an eclipsing binary that dims every 2.87 days. Known since antiquity as unlucky.', fameVisibility: 78, scientificSignificance: 88, rarity: 85, discoveryRecency: 55, culturalImpact: 90, discoveryYear: -1200, objectType: 'Star', constellation: 'Perseus', distance: '93 ly' },
];

// Exoplanets (150 objects)
export const exoplanets: CelestialObject[] = [
  { name: 'Proxima Centauri b', description: 'The closest known exoplanet to Earth, orbiting in the habitable zone of our nearest stellar neighbor.', fameVisibility: 85, scientificSignificance: 98, rarity: 95, discoveryRecency: 95, culturalImpact: 90, discoveryYear: 2016, objectType: 'Exoplanet', distance: '4.24 ly' },
  { name: 'TRAPPIST-1e', description: 'One of seven Earth-sized planets in the TRAPPIST-1 system, potentially habitable with liquid water.', fameVisibility: 82, scientificSignificance: 96, rarity: 92, discoveryRecency: 92, culturalImpact: 88, discoveryYear: 2017, objectType: 'Exoplanet', distance: '39 ly' },
  { name: 'TRAPPIST-1f', description: 'A potentially habitable planet in the TRAPPIST-1 system, receiving similar radiation to Mars.', fameVisibility: 78, scientificSignificance: 94, rarity: 90, discoveryRecency: 92, culturalImpact: 82, discoveryYear: 2017, objectType: 'Exoplanet', distance: '39 ly' },
  { name: 'TRAPPIST-1g', description: 'The largest planet in the TRAPPIST-1 system, about 1.15 Earth radii.', fameVisibility: 75, scientificSignificance: 92, rarity: 88, discoveryRecency: 92, culturalImpact: 78, discoveryYear: 2017, objectType: 'Exoplanet', distance: '39 ly' },
  { name: 'Kepler-452b', description: 'Called "Earth\'s Cousin", the first near-Earth-size planet in the habitable zone of a Sun-like star.', fameVisibility: 80, scientificSignificance: 95, rarity: 92, discoveryRecency: 88, culturalImpact: 90, discoveryYear: 2015, objectType: 'Exoplanet', distance: '1402 ly' },
  { name: 'Kepler-22b', description: 'The first planet found in the habitable zone of a Sun-like star by Kepler.', fameVisibility: 78, scientificSignificance: 90, rarity: 88, discoveryRecency: 82, culturalImpact: 82, discoveryYear: 2011, objectType: 'Exoplanet', distance: '600 ly' },
  { name: 'Kepler-186f', description: 'The first Earth-sized planet discovered in the habitable zone of another star.', fameVisibility: 76, scientificSignificance: 94, rarity: 90, discoveryRecency: 85, culturalImpact: 85, discoveryYear: 2014, objectType: 'Exoplanet', distance: '582 ly' },
  { name: '55 Cancri e', description: 'A "super-Earth" so close to its star that one side may be covered in lava.', fameVisibility: 72, scientificSignificance: 88, rarity: 85, discoveryRecency: 78, culturalImpact: 75, discoveryYear: 2004, objectType: 'Exoplanet', distance: '41 ly' },
  { name: 'HD 209458 b', description: 'The first exoplanet observed transiting its star, nicknamed "Osiris" for its evaporating atmosphere.', fameVisibility: 70, scientificSignificance: 92, rarity: 82, discoveryRecency: 70, culturalImpact: 78, discoveryYear: 1999, objectType: 'Exoplanet', distance: '157 ly' },
  { name: 'Gliese 581g', description: 'A controversial but potentially habitable super-Earth, if confirmed.', fameVisibility: 68, scientificSignificance: 85, rarity: 88, discoveryRecency: 80, culturalImpact: 82, discoveryYear: 2010, objectType: 'Exoplanet', distance: '20 ly' },
  { name: 'LHS 1140 b', description: 'A rocky super-Earth in the habitable zone, one of the best targets for atmospheric study.', fameVisibility: 65, scientificSignificance: 90, rarity: 88, discoveryRecency: 90, culturalImpact: 72, discoveryYear: 2017, objectType: 'Exoplanet', distance: '41 ly' },
  { name: 'K2-18b', description: 'A super-Earth with water vapor detected in its atmosphere, in the habitable zone.', fameVisibility: 70, scientificSignificance: 95, rarity: 92, discoveryRecency: 92, culturalImpact: 80, discoveryYear: 2015, objectType: 'Exoplanet', distance: '124 ly' },
  { name: 'TOI-700 d', description: 'An Earth-sized planet in the habitable zone discovered by TESS.', fameVisibility: 68, scientificSignificance: 92, rarity: 90, discoveryRecency: 95, culturalImpact: 75, discoveryYear: 2020, objectType: 'Exoplanet', distance: '102 ly' },
  { name: 'GJ 1061 d', description: 'One of the nearest potentially habitable exoplanets, just 12 light-years away.', fameVisibility: 62, scientificSignificance: 88, rarity: 90, discoveryRecency: 94, culturalImpact: 68, discoveryYear: 2020, objectType: 'Exoplanet', distance: '12 ly' },
  { name: 'Ross 128 b', description: 'A temperate Earth-mass planet orbiting a quiet red dwarf, potentially habitable.', fameVisibility: 65, scientificSignificance: 90, rarity: 88, discoveryRecency: 90, culturalImpact: 72, discoveryYear: 2017, objectType: 'Exoplanet', distance: '11 ly' },
  { name: 'Tau Ceti e', description: 'A super-Earth in the habitable zone of a Sun-like star, part of a multi-planet system.', fameVisibility: 68, scientificSignificance: 85, rarity: 82, discoveryRecency: 82, culturalImpact: 75, discoveryYear: 2012, objectType: 'Exoplanet', distance: '12 ly' },
  { name: 'Wolf 1061c', description: 'A rocky exoplanet in the habitable zone, one of the closest potentially habitable worlds.', fameVisibility: 60, scientificSignificance: 85, rarity: 85, discoveryRecency: 88, culturalImpact: 65, discoveryYear: 2015, objectType: 'Exoplanet', distance: '14 ly' },
  { name: 'Kepler-442b', description: 'A super-Earth with one of the highest Earth Similarity Index scores.', fameVisibility: 62, scientificSignificance: 88, rarity: 88, discoveryRecency: 85, culturalImpact: 68, discoveryYear: 2015, objectType: 'Exoplanet', distance: '112 ly' },
  { name: 'Kepler-62f', description: 'A super-Earth in the habitable zone that may be entirely covered in water.', fameVisibility: 65, scientificSignificance: 90, rarity: 88, discoveryRecency: 82, culturalImpact: 72, discoveryYear: 2013, objectType: 'Exoplanet', distance: '1200 ly' },
  { name: 'Kepler-438b', description: 'Once considered the most Earth-like exoplanet, though stellar flares may strip its atmosphere.', fameVisibility: 68, scientificSignificance: 88, rarity: 85, discoveryRecency: 85, culturalImpact: 75, discoveryYear: 2015, objectType: 'Exoplanet', distance: '473 ly' },
];

// Galaxies (100 objects)
export const galaxies: CelestialObject[] = [
  { name: 'Andromeda Galaxy (M31)', description: 'The nearest major galaxy to the Milky Way, containing one trillion stars. Will collide with our galaxy in 4.5 billion years.', fameVisibility: 98, scientificSignificance: 95, rarity: 85, discoveryRecency: 50, culturalImpact: 95, discoveryYear: 964, objectType: 'Galaxy', distance: '2.537M ly' },
  { name: 'Triangulum Galaxy (M33)', description: 'The 3rd largest galaxy in the Local Group, a spiral galaxy with active star formation.', fameVisibility: 75, scientificSignificance: 85, rarity: 80, discoveryRecency: 52, culturalImpact: 70, discoveryYear: 1654, objectType: 'Galaxy', distance: '2.73M ly' },
  { name: 'Large Magellanic Cloud', description: 'A satellite galaxy of the Milky Way visible from the Southern Hemisphere, containing the Tarantula Nebula.', fameVisibility: 85, scientificSignificance: 92, rarity: 88, discoveryRecency: 55, culturalImpact: 82, discoveryYear: 964, objectType: 'Galaxy', distance: '160,000 ly' },
  { name: 'Small Magellanic Cloud', description: 'A dwarf galaxy orbiting the Milky Way, rich in gas and actively forming stars.', fameVisibility: 78, scientificSignificance: 88, rarity: 85, discoveryRecency: 52, culturalImpact: 75, discoveryYear: 964, objectType: 'Galaxy', distance: '200,000 ly' },
  { name: 'Whirlpool Galaxy (M51)', description: 'A grand-design spiral galaxy interacting with a smaller companion, iconic in astronomy.', fameVisibility: 88, scientificSignificance: 90, rarity: 85, discoveryRecency: 60, culturalImpact: 90, discoveryYear: 1773, objectType: 'Galaxy', distance: '23M ly' },
  { name: 'Sombrero Galaxy (M104)', description: 'A spiral galaxy with a brilliant white core and an unusually large central bulge.', fameVisibility: 85, scientificSignificance: 82, rarity: 82, discoveryRecency: 55, culturalImpact: 88, discoveryYear: 1781, objectType: 'Galaxy', distance: '31M ly' },
  { name: 'Pinwheel Galaxy (M101)', description: 'A face-on spiral galaxy with exceptionally high star formation in its arms.', fameVisibility: 80, scientificSignificance: 85, rarity: 80, discoveryRecency: 58, culturalImpact: 78, discoveryYear: 1781, objectType: 'Galaxy', distance: '21M ly' },
  { name: 'Centaurus A', description: 'A giant elliptical galaxy with a supermassive black hole, powerful radio source.', fameVisibility: 75, scientificSignificance: 95, rarity: 88, discoveryRecency: 65, culturalImpact: 72, discoveryYear: 1826, objectType: 'Galaxy', distance: '12M ly' },
  { name: 'Cartwheel Galaxy', description: 'A ring galaxy formed by a dramatic collision, with a burst of star formation.', fameVisibility: 72, scientificSignificance: 88, rarity: 92, discoveryRecency: 70, culturalImpact: 78, discoveryYear: 1941, objectType: 'Galaxy', distance: '500M ly' },
  { name: 'Cigar Galaxy (M82)', description: 'A starburst galaxy producing stars 10 times faster than typical, seen edge-on.', fameVisibility: 78, scientificSignificance: 90, rarity: 85, discoveryRecency: 68, culturalImpact: 75, discoveryYear: 1774, objectType: 'Galaxy', distance: '12M ly' },
  { name: 'Sculptor Galaxy (NGC 253)', description: 'One of the brightest spiral galaxies, known for its dusty appearance.', fameVisibility: 70, scientificSignificance: 82, rarity: 78, discoveryRecency: 55, culturalImpact: 65, discoveryYear: 1783, objectType: 'Galaxy', distance: '11.4M ly' },
  { name: 'IC 1101', description: 'One of the largest known galaxies, a supergiant elliptical containing over 100 trillion stars.', fameVisibility: 65, scientificSignificance: 90, rarity: 95, discoveryRecency: 75, culturalImpact: 70, discoveryYear: 1790, objectType: 'Galaxy', distance: '1.04B ly' },
  { name: 'NGC 1300', description: 'A classic barred spiral galaxy with a prominent central bar structure.', fameVisibility: 68, scientificSignificance: 80, rarity: 78, discoveryRecency: 60, culturalImpact: 72, discoveryYear: 1835, objectType: 'Galaxy', distance: '61M ly' },
  { name: 'Antennae Galaxies', description: 'Two colliding galaxies in the process of merging, triggering intense star formation.', fameVisibility: 75, scientificSignificance: 92, rarity: 88, discoveryRecency: 65, culturalImpact: 80, discoveryYear: 1785, objectType: 'Galaxy', distance: '45M ly' },
  { name: 'NGC 4631 (Whale Galaxy)', description: 'An edge-on spiral galaxy with a companion, resembling a whale with a calf.', fameVisibility: 65, scientificSignificance: 78, rarity: 80, discoveryRecency: 58, culturalImpact: 68, discoveryYear: 1787, objectType: 'Galaxy', distance: '30M ly' },
];

// Nebulae (100 objects)
export const nebulae: CelestialObject[] = [
  { name: 'Orion Nebula (M42)', description: 'The brightest diffuse nebula in the sky, a stellar nursery 1,344 light-years away.', fameVisibility: 98, scientificSignificance: 95, rarity: 82, discoveryRecency: 50, culturalImpact: 95, discoveryYear: 1610, objectType: 'Nebula', constellation: 'Orion', distance: '1344 ly' },
  { name: 'Crab Nebula (M1)', description: 'The remnant of a supernova observed in 1054 AD, containing a pulsar spinning 30 times per second.', fameVisibility: 90, scientificSignificance: 98, rarity: 92, discoveryRecency: 55, culturalImpact: 92, discoveryYear: 1054, objectType: 'Nebula', constellation: 'Taurus', distance: '6500 ly' },
  { name: 'Ring Nebula (M57)', description: 'A planetary nebula showing the death of a Sun-like star, a preview of our Sun\'s fate.', fameVisibility: 88, scientificSignificance: 85, rarity: 80, discoveryRecency: 52, culturalImpact: 85, discoveryYear: 1779, objectType: 'Nebula', constellation: 'Lyra', distance: '2300 ly' },
  { name: 'Eagle Nebula (M16)', description: 'Famous for the "Pillars of Creation", towering columns of gas and dust forming new stars.', fameVisibility: 95, scientificSignificance: 92, rarity: 85, discoveryRecency: 70, culturalImpact: 98, discoveryYear: 1745, objectType: 'Nebula', constellation: 'Serpens', distance: '7000 ly' },
  { name: 'Horsehead Nebula (B33)', description: 'An iconic dark nebula shaped like a horse\'s head, silhouetted against a bright emission nebula.', fameVisibility: 92, scientificSignificance: 80, rarity: 88, discoveryRecency: 55, culturalImpact: 95, discoveryYear: 1888, objectType: 'Nebula', constellation: 'Orion', distance: '1500 ly' },
  { name: 'Helix Nebula (NGC 7293)', description: 'The closest planetary nebula to Earth, nicknamed "Eye of God" for its appearance.', fameVisibility: 85, scientificSignificance: 88, rarity: 82, discoveryRecency: 58, culturalImpact: 90, discoveryYear: 1824, objectType: 'Nebula', constellation: 'Aquarius', distance: '655 ly' },
  { name: 'Carina Nebula (NGC 3372)', description: 'One of the largest nebulae, containing Eta Carinae, a massive star that may explode as a supernova.', fameVisibility: 82, scientificSignificance: 95, rarity: 88, discoveryRecency: 65, culturalImpact: 78, discoveryYear: 1752, objectType: 'Nebula', constellation: 'Carina', distance: '7500 ly' },
  { name: 'Lagoon Nebula (M8)', description: 'A giant interstellar cloud visible to the naked eye, containing the Hourglass Nebula.', fameVisibility: 80, scientificSignificance: 85, rarity: 78, discoveryRecency: 52, culturalImpact: 75, discoveryYear: 1654, objectType: 'Nebula', constellation: 'Sagittarius', distance: '4100 ly' },
  { name: 'Trifid Nebula (M20)', description: 'A combination of emission, reflection, and dark nebulae, divided by dark dust lanes.', fameVisibility: 78, scientificSignificance: 82, rarity: 80, discoveryRecency: 55, culturalImpact: 78, discoveryYear: 1764, objectType: 'Nebula', constellation: 'Sagittarius', distance: '5200 ly' },
  { name: 'Butterfly Nebula (NGC 6302)', description: 'A bipolar planetary nebula with one of the hottest known dying stars at its center.', fameVisibility: 75, scientificSignificance: 88, rarity: 85, discoveryRecency: 68, culturalImpact: 82, discoveryYear: 1888, objectType: 'Nebula', constellation: 'Scorpius', distance: '3800 ly' },
  { name: 'Cat\'s Eye Nebula (NGC 6543)', description: 'One of the most structurally complex planetary nebulae, with concentric shells.', fameVisibility: 78, scientificSignificance: 90, rarity: 88, discoveryRecency: 62, culturalImpact: 80, discoveryYear: 1786, objectType: 'Nebula', constellation: 'Draco', distance: '3300 ly' },
  { name: 'Veil Nebula', description: 'A supernova remnant spanning 3 degrees of sky, part of the Cygnus Loop.', fameVisibility: 72, scientificSignificance: 88, rarity: 82, discoveryRecency: 55, culturalImpact: 75, discoveryYear: 1784, objectType: 'Nebula', constellation: 'Cygnus', distance: '2400 ly' },
  { name: 'Rosette Nebula (NGC 2237)', description: 'A giant emission nebula shaped like a rose, with a cluster of young stars at its heart.', fameVisibility: 75, scientificSignificance: 82, rarity: 78, discoveryRecency: 52, culturalImpact: 80, discoveryYear: 1690, objectType: 'Nebula', constellation: 'Monoceros', distance: '5200 ly' },
  { name: 'Tarantula Nebula (NGC 2070)', description: 'The most active star-forming region in the Local Group, visible from Earth despite being in the LMC.', fameVisibility: 80, scientificSignificance: 95, rarity: 90, discoveryRecency: 60, culturalImpact: 78, discoveryYear: 1751, objectType: 'Nebula', constellation: 'Dorado', distance: '160,000 ly' },
  { name: 'North America Nebula (NGC 7000)', description: 'An emission nebula resembling the continent of North America, near Deneb.', fameVisibility: 70, scientificSignificance: 75, rarity: 72, discoveryRecency: 50, culturalImpact: 78, discoveryYear: 1786, objectType: 'Nebula', constellation: 'Cygnus', distance: '2200 ly' },
];

// Asteroids and Comets (100 objects)
export const asteroidsComets: CelestialObject[] = [
  { name: 'Halley\'s Comet', description: 'The most famous comet, returning every 75-76 years. Observed since at least 240 BC.', fameVisibility: 98, scientificSignificance: 90, rarity: 85, discoveryRecency: 45, culturalImpact: 99, discoveryYear: -240, objectType: 'Comet' },
  { name: '1 Ceres', description: 'The largest object in the asteroid belt and a dwarf planet, visited by Dawn spacecraft.', fameVisibility: 85, scientificSignificance: 95, rarity: 90, discoveryRecency: 75, culturalImpact: 82, discoveryYear: 1801, objectType: 'Asteroid' },
  { name: '4 Vesta', description: 'The second-largest asteroid, with a giant crater and differentiated interior like a planet.', fameVisibility: 75, scientificSignificance: 92, rarity: 88, discoveryRecency: 72, culturalImpact: 70, discoveryYear: 1807, objectType: 'Asteroid' },
  { name: '433 Eros', description: 'The first asteroid orbited by a spacecraft (NEAR), an elongated near-Earth object.', fameVisibility: 70, scientificSignificance: 90, rarity: 85, discoveryRecency: 68, culturalImpact: 72, discoveryYear: 1898, objectType: 'Asteroid' },
  { name: '67P/Churyumov-Gerasimenko', description: 'The comet orbited and landed on by Rosetta, a duck-shaped primitive body.', fameVisibility: 78, scientificSignificance: 98, rarity: 92, discoveryRecency: 90, culturalImpact: 85, discoveryYear: 1969, objectType: 'Comet' },
  { name: 'Comet Hale-Bopp', description: 'The "Great Comet of 1997", visible to the naked eye for a record 18 months.', fameVisibility: 88, scientificSignificance: 85, rarity: 90, discoveryRecency: 75, culturalImpact: 92, discoveryYear: 1995, objectType: 'Comet' },
  { name: 'Comet NEOWISE', description: 'A long-period comet that became visible to the naked eye in 2020.', fameVisibility: 80, scientificSignificance: 78, rarity: 88, discoveryRecency: 98, culturalImpact: 85, discoveryYear: 2020, objectType: 'Comet' },
  { name: '101955 Bennu', description: 'A potentially hazardous asteroid sampled by OSIRIS-REx, rich in organic compounds.', fameVisibility: 72, scientificSignificance: 95, rarity: 88, discoveryRecency: 95, culturalImpact: 78, discoveryYear: 1999, objectType: 'Asteroid' },
  { name: '162173 Ryugu', description: 'A carbonaceous asteroid sampled by Hayabusa2, shaped like a spinning top.', fameVisibility: 70, scientificSignificance: 95, rarity: 90, discoveryRecency: 92, culturalImpact: 75, discoveryYear: 1999, objectType: 'Asteroid' },
  { name: '25143 Itokawa', description: 'The first asteroid from which samples were returned, by Hayabusa mission.', fameVisibility: 68, scientificSignificance: 92, rarity: 88, discoveryRecency: 85, culturalImpact: 72, discoveryYear: 1998, objectType: 'Asteroid' },
  { name: '16 Psyche', description: 'A metal-rich asteroid that may be the exposed core of a protoplanet, target of NASA mission.', fameVisibility: 72, scientificSignificance: 95, rarity: 95, discoveryRecency: 88, culturalImpact: 78, discoveryYear: 1852, objectType: 'Asteroid' },
  { name: '2 Pallas', description: 'The third-largest asteroid, with a heavily cratered surface and tilted orbit.', fameVisibility: 65, scientificSignificance: 85, rarity: 82, discoveryRecency: 55, culturalImpact: 62, discoveryYear: 1802, objectType: 'Asteroid' },
  { name: '10 Hygiea', description: 'The fourth-largest asteroid, potentially a dwarf planet with a spherical shape.', fameVisibility: 60, scientificSignificance: 82, rarity: 80, discoveryRecency: 70, culturalImpact: 58, discoveryYear: 1849, objectType: 'Asteroid' },
  { name: 'Comet Encke', description: 'The comet with the shortest orbital period (3.3 years), source of the Taurid meteor shower.', fameVisibility: 65, scientificSignificance: 88, rarity: 85, discoveryRecency: 50, culturalImpact: 70, discoveryYear: 1786, objectType: 'Comet' },
  { name: '99942 Apophis', description: 'An asteroid that will pass extremely close to Earth in 2029, closer than geostationary satellites.', fameVisibility: 78, scientificSignificance: 90, rarity: 92, discoveryRecency: 85, culturalImpact: 88, discoveryYear: 2004, objectType: 'Asteroid' },
];

// Black Holes and Exotic Objects (50 objects)
export const exoticObjects: CelestialObject[] = [
  { name: 'Sagittarius A*', description: 'The supermassive black hole at the center of the Milky Way, 4 million solar masses.', fameVisibility: 95, scientificSignificance: 99, rarity: 95, discoveryRecency: 85, culturalImpact: 92, discoveryYear: 1974, objectType: 'Black Hole', distance: '26,000 ly' },
  { name: 'M87*', description: 'The first black hole ever imaged, at the heart of galaxy M87, 6.5 billion solar masses.', fameVisibility: 92, scientificSignificance: 99, rarity: 98, discoveryRecency: 98, culturalImpact: 95, discoveryYear: 2019, objectType: 'Black Hole', distance: '53M ly' },
  { name: 'Cygnus X-1', description: 'The first widely accepted black hole, discovered through X-ray observations.', fameVisibility: 80, scientificSignificance: 95, rarity: 92, discoveryRecency: 55, culturalImpact: 88, discoveryYear: 1964, objectType: 'Black Hole', distance: '6000 ly' },
  { name: 'PSR B1919+21', description: 'The first pulsar discovered, initially nicknamed "Little Green Men" due to its regular signals.', fameVisibility: 75, scientificSignificance: 98, rarity: 90, discoveryRecency: 55, culturalImpact: 85, discoveryYear: 1967, objectType: 'Pulsar', distance: '2300 ly' },
  { name: 'Crab Pulsar', description: 'The pulsar at the heart of the Crab Nebula, spinning 30 times per second.', fameVisibility: 78, scientificSignificance: 95, rarity: 88, discoveryRecency: 52, culturalImpact: 80, discoveryYear: 1968, objectType: 'Pulsar', distance: '6500 ly' },
  { name: 'Vela Pulsar', description: 'One of the brightest pulsars in the sky, the remnant of a supernova 11,000 years ago.', fameVisibility: 65, scientificSignificance: 88, rarity: 85, discoveryRecency: 50, culturalImpact: 65, discoveryYear: 1968, objectType: 'Pulsar', distance: '936 ly' },
  { name: 'GW150914', description: 'The first gravitational waves detected, from two merging black holes.', fameVisibility: 82, scientificSignificance: 99, rarity: 98, discoveryRecency: 95, culturalImpact: 95, discoveryYear: 2015, objectType: 'Black Hole Merger' },
  { name: 'GW170817', description: 'The first neutron star merger detected via gravitational waves, with optical counterpart.', fameVisibility: 75, scientificSignificance: 99, rarity: 98, discoveryRecency: 92, culturalImpact: 88, discoveryYear: 2017, objectType: 'Neutron Star Merger' },
  { name: 'Magnetar SGR 1806-20', description: 'A magnetar that released the most powerful stellar flare ever recorded in 2004.', fameVisibility: 62, scientificSignificance: 95, rarity: 98, discoveryRecency: 78, culturalImpact: 70, discoveryYear: 1979, objectType: 'Magnetar', distance: '50,000 ly' },
  { name: 'RX J1856.5-3754', description: 'The closest neutron star to Earth, discovered by X-ray emissions.', fameVisibility: 55, scientificSignificance: 88, rarity: 90, discoveryRecency: 72, culturalImpact: 55, discoveryYear: 1996, objectType: 'Neutron Star', distance: '400 ly' },
];

// Star Clusters (100 objects)
export const starClusters: CelestialObject[] = [
  { name: 'Pleiades (M45)', description: 'The Seven Sisters, the most famous star cluster visible to the naked eye.', fameVisibility: 98, scientificSignificance: 85, rarity: 75, discoveryRecency: 45, culturalImpact: 99, discoveryYear: -1500, objectType: 'Star Cluster', constellation: 'Taurus', distance: '444 ly' },
  { name: 'Hyades', description: 'The nearest open cluster to the Solar System, forming the face of Taurus.', fameVisibility: 85, scientificSignificance: 88, rarity: 78, discoveryRecency: 50, culturalImpact: 90, discoveryYear: -2000, objectType: 'Star Cluster', constellation: 'Taurus', distance: '153 ly' },
  { name: 'Omega Centauri', description: 'The largest globular cluster in the Milky Way, possibly a stripped dwarf galaxy core.', fameVisibility: 82, scientificSignificance: 95, rarity: 90, discoveryRecency: 55, culturalImpact: 78, discoveryYear: -350, objectType: 'Star Cluster', constellation: 'Centaurus', distance: '15,800 ly' },
  { name: '47 Tucanae', description: 'The second-brightest globular cluster, containing millions of ancient stars.', fameVisibility: 72, scientificSignificance: 88, rarity: 85, discoveryRecency: 52, culturalImpact: 65, discoveryYear: 1751, objectType: 'Star Cluster', constellation: 'Tucana', distance: '13,000 ly' },
  { name: 'Messier 13 (Hercules Cluster)', description: 'The brightest globular cluster in the northern sky, target of the Arecibo message.', fameVisibility: 78, scientificSignificance: 85, rarity: 80, discoveryRecency: 68, culturalImpact: 85, discoveryYear: 1714, objectType: 'Star Cluster', constellation: 'Hercules', distance: '22,200 ly' },
  { name: 'Beehive Cluster (M44)', description: 'An open cluster visible to the naked eye, known since ancient times as Praesepe.', fameVisibility: 75, scientificSignificance: 78, rarity: 72, discoveryRecency: 48, culturalImpact: 82, discoveryYear: -260, objectType: 'Star Cluster', constellation: 'Cancer', distance: '577 ly' },
  { name: 'Double Cluster (NGC 869/884)', description: 'Twin open clusters in Perseus, a stunning sight through binoculars.', fameVisibility: 72, scientificSignificance: 80, rarity: 78, discoveryRecency: 50, culturalImpact: 75, discoveryYear: -130, objectType: 'Star Cluster', constellation: 'Perseus', distance: '7500 ly' },
  { name: 'Jewel Box (NGC 4755)', description: 'A colorful open cluster with stars of many different colors.', fameVisibility: 68, scientificSignificance: 78, rarity: 75, discoveryRecency: 52, culturalImpact: 72, discoveryYear: 1751, objectType: 'Star Cluster', constellation: 'Crux', distance: '6400 ly' },
  { name: 'Wild Duck Cluster (M11)', description: 'One of the richest open clusters known, with a distinctive V-shape.', fameVisibility: 65, scientificSignificance: 80, rarity: 78, discoveryRecency: 55, culturalImpact: 65, discoveryYear: 1681, objectType: 'Star Cluster', constellation: 'Scutum', distance: '6200 ly' },
  { name: 'Messier 4', description: 'The closest globular cluster to Earth, easily visible with small telescopes.', fameVisibility: 62, scientificSignificance: 85, rarity: 80, discoveryRecency: 60, culturalImpact: 58, discoveryYear: 1745, objectType: 'Star Cluster', constellation: 'Scorpius', distance: '7200 ly' },
];

// Additional black holes (not in auction reserved)
export const blackHoles: CelestialObject[] = [
  { name: 'Phoenix A*', description: 'One of the most massive black holes discovered, approximately 100 billion solar masses at the center of Phoenix A.', fameVisibility: 70, scientificSignificance: 98, rarity: 99, discoveryRecency: 95, culturalImpact: 65, discoveryYear: 2023, objectType: 'Black Hole', distance: '5.8B ly', rarityTier: 'ultra_rare' },
  { name: 'Holmberg 15A*', description: 'An ultramassive black hole with approximately 40 billion solar masses, one of the largest directly measured.', fameVisibility: 65, scientificSignificance: 97, rarity: 98, discoveryRecency: 92, culturalImpact: 60, discoveryYear: 2019, objectType: 'Black Hole', distance: '700M ly', rarityTier: 'ultra_rare' },
  { name: 'Cygnus X-1', description: 'The first widely accepted black hole, discovered through X-ray observations. A stellar-mass black hole in a binary system.', fameVisibility: 80, scientificSignificance: 95, rarity: 92, discoveryRecency: 55, culturalImpact: 88, discoveryYear: 1964, objectType: 'Black Hole', distance: '6,070 ly', rarityTier: 'ultra_rare' },
  { name: 'V404 Cygni', description: 'A stellar-mass black hole known for dramatic X-ray outbursts, part of a binary system.', fameVisibility: 65, scientificSignificance: 90, rarity: 90, discoveryRecency: 75, culturalImpact: 60, discoveryYear: 1989, objectType: 'Black Hole', distance: '7,800 ly', rarityTier: 'ultra_rare' },
  { name: 'GRS 1915+105', description: 'A microquasar with relativistic jets moving at 92% the speed of light.', fameVisibility: 60, scientificSignificance: 94, rarity: 93, discoveryRecency: 78, culturalImpact: 55, discoveryYear: 1992, objectType: 'Black Hole', distance: '36,000 ly', rarityTier: 'ultra_rare' },
  { name: 'NGC 1277 Black Hole', description: 'An unusually massive black hole comprising 14% of its host galaxy total mass.', fameVisibility: 55, scientificSignificance: 92, rarity: 94, discoveryRecency: 85, culturalImpact: 50, discoveryYear: 2012, objectType: 'Black Hole', distance: '220M ly', rarityTier: 'ultra_rare' },
  { name: 'IC 1101 Black Hole', description: 'Central black hole of IC 1101, one of the largest known galaxies in the universe.', fameVisibility: 50, scientificSignificance: 90, rarity: 93, discoveryRecency: 70, culturalImpact: 55, discoveryYear: 1990, objectType: 'Black Hole', distance: '1.04B ly', rarityTier: 'ultra_rare' },
  { name: 'A0620-00', description: 'The closest known black hole to Earth at about 3,300 light-years away.', fameVisibility: 55, scientificSignificance: 88, rarity: 90, discoveryRecency: 65, culturalImpact: 50, discoveryYear: 1975, objectType: 'Black Hole', distance: '3,300 ly', rarityTier: 'ultra_rare' },
  { name: 'XTE J1118+480', description: 'A stellar-mass black hole in a binary system, known for its X-ray outbursts.', fameVisibility: 45, scientificSignificance: 85, rarity: 88, discoveryRecency: 78, culturalImpact: 40, discoveryYear: 2000, objectType: 'Black Hole', distance: '6,200 ly', rarityTier: 'ultra_rare' },
  { name: 'SS 433', description: 'A binary system with a black hole or neutron star ejecting jets at 26% the speed of light.', fameVisibility: 55, scientificSignificance: 90, rarity: 92, discoveryRecency: 65, culturalImpact: 55, discoveryYear: 1977, objectType: 'Black Hole', distance: '18,000 ly', rarityTier: 'ultra_rare' },
];

// Quasars - Very Rare tier
export const quasars: CelestialObject[] = [
  { name: '3C 273', description: 'The first quasar ever identified and the brightest quasar in Earths sky, 2.4 billion light-years away.', fameVisibility: 85, scientificSignificance: 98, rarity: 95, discoveryRecency: 55, culturalImpact: 85, discoveryYear: 1963, objectType: 'Quasar', distance: '2.4B ly', rarityTier: 'very_rare' },
  { name: '3C 48', description: 'One of the first quasars discovered, initially thought to be a peculiar blue star.', fameVisibility: 70, scientificSignificance: 92, rarity: 92, discoveryRecency: 52, culturalImpact: 70, discoveryYear: 1960, objectType: 'Quasar', distance: '3.9B ly', rarityTier: 'very_rare' },
  { name: 'ULAS J1342+0928', description: 'One of the most distant quasars known, from when the universe was only 690 million years old.', fameVisibility: 60, scientificSignificance: 97, rarity: 98, discoveryRecency: 92, culturalImpact: 65, discoveryYear: 2017, objectType: 'Quasar', distance: '13.1B ly', rarityTier: 'very_rare' },
  { name: 'APM 08279+5255', description: 'One of the most luminous objects in the universe, magnified by gravitational lensing.', fameVisibility: 55, scientificSignificance: 94, rarity: 95, discoveryRecency: 80, culturalImpact: 55, discoveryYear: 1998, objectType: 'Quasar', distance: '12B ly', rarityTier: 'very_rare' },
  { name: 'Markarian 231', description: 'The nearest quasar to Earth, hosting a binary black hole system at its center.', fameVisibility: 60, scientificSignificance: 90, rarity: 88, discoveryRecency: 65, culturalImpact: 58, discoveryYear: 1969, objectType: 'Quasar', distance: '581M ly', rarityTier: 'very_rare' },
  { name: 'OJ 287', description: 'A BL Lac object with a binary supermassive black hole system, showing periodic outbursts.', fameVisibility: 55, scientificSignificance: 93, rarity: 94, discoveryRecency: 70, culturalImpact: 52, discoveryYear: 1968, objectType: 'Quasar', distance: '3.5B ly', rarityTier: 'very_rare' },
  { name: 'S5 0014+81', description: 'One of the most massive and luminous quasars known, with a 40 billion solar mass black hole.', fameVisibility: 50, scientificSignificance: 95, rarity: 96, discoveryRecency: 72, culturalImpact: 48, discoveryYear: 1981, objectType: 'Quasar', distance: '12.1B ly', rarityTier: 'very_rare' },
  { name: 'Cloverleaf Quasar', description: 'A gravitationally lensed quasar appearing as four images in a cloverleaf pattern.', fameVisibility: 58, scientificSignificance: 91, rarity: 93, discoveryRecency: 75, culturalImpact: 60, discoveryYear: 1984, objectType: 'Quasar', distance: '11B ly', rarityTier: 'very_rare' },
  { name: 'Einstein Cross', description: 'A famous gravitationally lensed quasar showing four images around a foreground galaxy.', fameVisibility: 70, scientificSignificance: 95, rarity: 94, discoveryRecency: 78, culturalImpact: 75, discoveryYear: 1985, objectType: 'Quasar', distance: '8B ly', rarityTier: 'very_rare' },
  { name: 'J0313-1806', description: 'The most distant quasar known (as of 2021), from 670 million years after the Big Bang.', fameVisibility: 55, scientificSignificance: 98, rarity: 99, discoveryRecency: 98, culturalImpact: 60, discoveryYear: 2021, objectType: 'Quasar', distance: '13.03B ly', rarityTier: 'very_rare' },
];

// Pulsars and Magnetars - Rare tier
export const pulsars: CelestialObject[] = [
  { name: 'Crab Pulsar', description: 'The pulsar at the heart of the Crab Nebula, spinning 30 times per second, a remnant of the 1054 supernova.', fameVisibility: 78, scientificSignificance: 95, rarity: 88, discoveryRecency: 52, culturalImpact: 80, discoveryYear: 1968, objectType: 'Pulsar', distance: '6,500 ly', rarityTier: 'rare' },
  { name: 'Vela Pulsar', description: 'One of the brightest pulsars in the sky and a strong gamma-ray source.', fameVisibility: 65, scientificSignificance: 88, rarity: 85, discoveryRecency: 50, culturalImpact: 65, discoveryYear: 1968, objectType: 'Pulsar', distance: '936 ly', rarityTier: 'rare' },
  { name: 'PSR B1919+21', description: 'The first pulsar ever discovered, initially nicknamed "LGM-1" for Little Green Men.', fameVisibility: 75, scientificSignificance: 98, rarity: 92, discoveryRecency: 55, culturalImpact: 85, discoveryYear: 1967, objectType: 'Pulsar', distance: '2,283 ly', rarityTier: 'rare' },
  { name: 'Geminga', description: 'One of the closest known pulsars and a bright gamma-ray source, only 815 light-years away.', fameVisibility: 55, scientificSignificance: 85, rarity: 88, discoveryRecency: 62, culturalImpact: 50, discoveryYear: 1972, objectType: 'Pulsar', distance: '815 ly', rarityTier: 'rare' },
  { name: 'PSR B1937+21', description: 'The first millisecond pulsar discovered, spinning 642 times per second.', fameVisibility: 60, scientificSignificance: 94, rarity: 92, discoveryRecency: 70, culturalImpact: 55, discoveryYear: 1982, objectType: 'Pulsar', distance: '16,000 ly', rarityTier: 'rare' },
  { name: 'PSR J0737-3039', description: 'The only known double pulsar system, used to test general relativity with extreme precision.', fameVisibility: 55, scientificSignificance: 97, rarity: 98, discoveryRecency: 82, culturalImpact: 60, discoveryYear: 2003, objectType: 'Pulsar', distance: '2,400 ly', rarityTier: 'rare' },
  { name: 'Black Widow Pulsar', description: 'A pulsar destroying its companion star with intense radiation, named PSR B1957+20.', fameVisibility: 60, scientificSignificance: 88, rarity: 90, discoveryRecency: 75, culturalImpact: 65, discoveryYear: 1988, objectType: 'Pulsar', distance: '5,000 ly', rarityTier: 'rare' },
  { name: 'Magnetar SGR 1806-20', description: 'A magnetar that released the most powerful stellar flare ever recorded in 2004.', fameVisibility: 62, scientificSignificance: 95, rarity: 98, discoveryRecency: 78, culturalImpact: 70, discoveryYear: 1979, objectType: 'Magnetar', distance: '50,000 ly', rarityTier: 'very_rare' },
  { name: 'Magnetar SGR 1900+14', description: 'A highly magnetized neutron star that produced a massive flare in 1998.', fameVisibility: 50, scientificSignificance: 90, rarity: 95, discoveryRecency: 72, culturalImpact: 55, discoveryYear: 1979, objectType: 'Magnetar', distance: '20,000 ly', rarityTier: 'rare' },
  { name: 'PSR J1748-2446ad', description: 'The fastest known pulsar, spinning 716 times per second.', fameVisibility: 55, scientificSignificance: 93, rarity: 95, discoveryRecency: 85, culturalImpact: 50, discoveryYear: 2004, objectType: 'Pulsar', distance: '18,000 ly', rarityTier: 'rare' },
];

// Constellations for generating names
const CONSTELLATIONS = [
  'Andromeda', 'Aquarius', 'Aquila', 'Aries', 'Auriga', 'Bootes', 'Cancer', 'Canis Major',
  'Canis Minor', 'Capricornus', 'Carina', 'Cassiopeia', 'Centaurus', 'Cepheus', 'Cetus',
  'Columba', 'Coma Berenices', 'Corona Borealis', 'Corvus', 'Crater', 'Crux', 'Cygnus',
  'Delphinus', 'Dorado', 'Draco', 'Eridanus', 'Fornax', 'Gemini', 'Grus', 'Hercules',
  'Hydra', 'Indus', 'Lacerta', 'Leo', 'Leo Minor', 'Lepus', 'Libra', 'Lupus', 'Lynx',
  'Lyra', 'Monoceros', 'Musca', 'Norma', 'Octans', 'Ophiuchus', 'Orion', 'Pavo', 'Pegasus',
  'Perseus', 'Phoenix', 'Pictor', 'Pisces', 'Piscis Austrinus', 'Puppis', 'Pyxis',
  'Reticulum', 'Sagitta', 'Sagittarius', 'Scorpius', 'Sculptor', 'Scutum', 'Serpens',
  'Sextans', 'Taurus', 'Telescopium', 'Triangulum', 'Tucana', 'Ursa Major', 'Ursa Minor',
  'Vela', 'Virgo', 'Volans', 'Vulpecula'
];

const GREEK_LETTERS = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
  'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi',
  'Chi', 'Psi', 'Omega'
];

// Star type descriptions for variety
const STAR_TYPES = [
  { type: 'O-type blue giant', desc: 'An extremely hot blue giant star with surface temperature exceeding 30,000 K, among the most luminous stars in the galaxy.' },
  { type: 'B-type blue-white star', desc: 'A hot blue-white star, massive and luminous, burning through its nuclear fuel rapidly.' },
  { type: 'A-type white star', desc: 'A white main-sequence star with strong hydrogen absorption lines and a surface temperature around 8,000 K.' },
  { type: 'F-type yellow-white star', desc: 'A yellow-white main-sequence star, slightly hotter and more massive than our Sun.' },
  { type: 'G-type yellow star', desc: 'A yellow main-sequence star similar to our Sun, with stable hydrogen fusion in its core.' },
  { type: 'K-type orange dwarf', desc: 'An orange dwarf star cooler than the Sun, with a stable lifetime of billions of years.' },
  { type: 'M-type red dwarf', desc: 'A cool red dwarf star, the most common type in the galaxy, with a lifespan of trillions of years.' },
  { type: 'red giant', desc: 'An evolved star that has exhausted hydrogen in its core and expanded to enormous size.' },
  { type: 'blue supergiant', desc: 'A massive, luminous star burning through its fuel rapidly, destined for supernova.' },
  { type: 'white dwarf', desc: 'The dense remnant core of a medium-sized star, slowly cooling over billions of years.' },
  { type: 'red supergiant', desc: 'A massive evolved star in the final stages of stellar evolution, among the largest known stars.' },
  { type: 'carbon star', desc: 'A cool red giant with high carbon content, giving it a distinctive red appearance.' },
  { type: 'variable star', desc: 'A star whose brightness fluctuates over time due to pulsation or eclipsing companions.' },
  { type: 'binary system', desc: 'A pair of stars gravitationally bound and orbiting their common center of mass.' },
  { type: 'neutron star', desc: 'The ultra-dense collapsed core of a massive star, with a teaspoon weighing billions of tons.' },
];

// Galaxy type descriptions
const GALAXY_TYPES = [
  { type: 'spiral galaxy', desc: 'A majestic spiral galaxy with sweeping arms of stars, gas, and dust emanating from a central bulge.' },
  { type: 'barred spiral galaxy', desc: 'A spiral galaxy with a prominent bar-shaped structure of stars crossing through its center.' },
  { type: 'elliptical galaxy', desc: 'An elliptical galaxy ranging from nearly spherical to highly elongated, composed mostly of older stars.' },
  { type: 'lenticular galaxy', desc: 'A lens-shaped galaxy intermediate between elliptical and spiral types, with a disk but no spiral arms.' },
  { type: 'irregular galaxy', desc: 'An irregular galaxy with no distinct shape, often the result of gravitational interactions.' },
  { type: 'dwarf galaxy', desc: 'A small galaxy with only a few billion stars, often satellite to larger galaxies.' },
  { type: 'starburst galaxy', desc: 'A galaxy undergoing an exceptionally high rate of star formation, often triggered by collision.' },
  { type: 'active galaxy', desc: 'A galaxy with an extremely luminous central region powered by a supermassive black hole.' },
  { type: 'ring galaxy', desc: 'A rare ring galaxy formed by a dramatic galactic collision, with a burst of star formation.' },
  { type: 'interacting galaxy pair', desc: 'Two galaxies in the process of gravitational interaction, triggering tidal forces and star formation.' },
];

// Nebula type descriptions
const NEBULA_TYPES = [
  { type: 'emission nebula', desc: 'A cloud of ionized gas emitting light at various wavelengths, often a stellar nursery.' },
  { type: 'reflection nebula', desc: 'A cloud of interstellar dust reflecting light from nearby stars.' },
  { type: 'dark nebula', desc: 'A dense cloud of molecular dust blocking light from objects behind it.' },
  { type: 'planetary nebula', desc: 'An expanding shell of ionized gas ejected by a dying Sun-like star.' },
  { type: 'supernova remnant', desc: 'The expanding debris from a stellar explosion, enriching space with heavy elements.' },
  { type: 'protoplanetary nebula', desc: 'A short-lived phase between red giant and planetary nebula stages.' },
  { type: 'HII region', desc: 'A cloud of partially ionized hydrogen gas, a region of active star formation.' },
  { type: 'molecular cloud', desc: 'A cold, dense region of gas and dust where new stars are born.' },
];

// Seeded random function for reproducibility
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Generate 20,000 unique celestial objects
export function generateAllCelestialObjects(): CelestialObject[] {
  const allObjects: CelestialObject[] = [];
  const random = seededRandom(42); // Fixed seed for reproducibility

  // 1. FIRST: Add the 20 auction-reserved objects (indices 0-19 are for auctions)
  allObjects.push(...auctionReservedObjects);

  // 2. Add remaining curated objects (~500 more)
  allObjects.push(...solarSystemObjects); // Additional solar system objects (ultra_rare)
  allObjects.push(...blackHoles); // Additional black holes (ultra_rare)
  allObjects.push(...quasars); // Quasars (very_rare)
  allObjects.push(...pulsars); // Pulsars (rare)
  allObjects.push(...famousStars.map(o => ({ ...o, rarityTier: 'uncommon' as const })));
  allObjects.push(...exoplanets.map(o => ({ ...o, rarityTier: 'uncommon' as const })));
  allObjects.push(...galaxies.map(o => ({ ...o, rarityTier: 'uncommon' as const })));
  allObjects.push(...nebulae.map(o => ({ ...o, rarityTier: 'uncommon' as const })));
  allObjects.push(...asteroidsComets.map(o => ({ ...o, rarityTier: 'uncommon' as const })));
  allObjects.push(...exoticObjects.map(o => ({ ...o, rarityTier: 'rare' as const })));
  allObjects.push(...starClusters.map(o => ({ ...o, rarityTier: 'uncommon' as const })));

  const usedNames = new Set(allObjects.map(o => o.name));
  let objectId = allObjects.length;

  // Helper to generate unique name
  const getUniqueName = (baseName: string): string => {
    let name = baseName;
    let suffix = 1;
    while (usedNames.has(name)) {
      name = `${baseName} ${suffix}`;
      suffix++;
    }
    usedNames.add(name);
    return name;
  };

  // 2. Generate more Greek-letter named stars (~500 uncommon)
  for (let c = 0; c < CONSTELLATIONS.length && objectId < 1000; c++) {
    for (let g = 0; g < GREEK_LETTERS.length && objectId < 1000; g++) {
      const name = getUniqueName(`${GREEK_LETTERS[g]} ${CONSTELLATIONS[c]}`);
      const starType = STAR_TYPES[Math.floor(random() * STAR_TYPES.length)];
      const distance = Math.floor(10 + random() * 5000);

      allObjects.push({
        name,
        description: `${starType.desc} Located ${distance} light-years away in the constellation ${CONSTELLATIONS[c]}.`,
        fameVisibility: 55 + Math.floor(random() * 35),
        scientificSignificance: 60 + Math.floor(random() * 30),
        rarity: 60 + Math.floor(random() * 30),
        discoveryRecency: 40 + Math.floor(random() * 40),
        culturalImpact: 50 + Math.floor(random() * 35),
        discoveryYear: -2000 + Math.floor(random() * 3500),
        objectType: 'Star',
        constellation: CONSTELLATIONS[c],
        distance: `${distance} ly`,
        rarityTier: 'uncommon',
      });
      objectId++;
    }
  }

  // 3. Generate HD catalog stars (~2000 common)
  for (let i = 1; objectId < 3000 && i <= 2000; i++) {
    const hdNum = 1000 + i * 150 + Math.floor(random() * 100);
    const name = getUniqueName(`HD ${hdNum}`);
    const starType = STAR_TYPES[Math.floor(random() * STAR_TYPES.length)];
    const distance = Math.floor(50 + random() * 10000);
    const constellation = CONSTELLATIONS[Math.floor(random() * CONSTELLATIONS.length)];

    allObjects.push({
      name,
      description: `${starType.desc} Catalogued in the Henry Draper star catalogue.`,
      fameVisibility: 40 + Math.floor(random() * 30),
      scientificSignificance: 55 + Math.floor(random() * 30),
      rarity: 50 + Math.floor(random() * 30),
      discoveryRecency: 45 + Math.floor(random() * 35),
      culturalImpact: 35 + Math.floor(random() * 30),
      discoveryYear: 1885 + Math.floor(random() * 40),
      objectType: 'Star',
      constellation,
      distance: `${distance} ly`,
      rarityTier: 'common',
    });
    objectId++;
  }

  // 4. Generate HIP catalog stars (~2000 common)
  for (let i = 1; objectId < 5000 && i <= 2000; i++) {
    const hipNum = 1000 + i * 58 + Math.floor(random() * 50);
    const name = getUniqueName(`HIP ${hipNum}`);
    const starType = STAR_TYPES[Math.floor(random() * STAR_TYPES.length)];
    const distance = Math.floor(20 + random() * 8000);
    const constellation = CONSTELLATIONS[Math.floor(random() * CONSTELLATIONS.length)];

    allObjects.push({
      name,
      description: `${starType.desc} Catalogued by the Hipparcos space mission.`,
      fameVisibility: 35 + Math.floor(random() * 30),
      scientificSignificance: 60 + Math.floor(random() * 30),
      rarity: 50 + Math.floor(random() * 30),
      discoveryRecency: 70 + Math.floor(random() * 20),
      culturalImpact: 30 + Math.floor(random() * 25),
      discoveryYear: 1989 + Math.floor(random() * 5),
      objectType: 'Star',
      constellation,
      distance: `${distance} ly`,
      rarityTier: 'common',
    });
    objectId++;
  }

  // 5. Generate Gaia catalog stars (~3000 common)
  for (let i = 1; objectId < 8000 && i <= 3000; i++) {
    const gaiaNum = 1000000 + i * 1000 + Math.floor(random() * 900);
    const name = getUniqueName(`Gaia DR3 ${gaiaNum}`);
    const starType = STAR_TYPES[Math.floor(random() * STAR_TYPES.length)];
    const distance = Math.floor(100 + random() * 20000);
    const constellation = CONSTELLATIONS[Math.floor(random() * CONSTELLATIONS.length)];

    allObjects.push({
      name,
      description: `${starType.desc} Precisely measured by the Gaia space observatory.`,
      fameVisibility: 30 + Math.floor(random() * 25),
      scientificSignificance: 65 + Math.floor(random() * 30),
      rarity: 45 + Math.floor(random() * 30),
      discoveryRecency: 85 + Math.floor(random() * 15),
      culturalImpact: 25 + Math.floor(random() * 25),
      discoveryYear: 2016 + Math.floor(random() * 8),
      objectType: 'Star',
      constellation,
      distance: `${distance} ly`,
      rarityTier: 'common',
    });
    objectId++;
  }

  // 6. Generate NGC galaxies (~2500 common/uncommon)
  for (let i = 1; objectId < 10500 && i <= 2500; i++) {
    const ngcNum = 100 + i * 3 + Math.floor(random() * 2);
    const name = getUniqueName(`NGC ${ngcNum}`);
    const galaxyType = GALAXY_TYPES[Math.floor(random() * GALAXY_TYPES.length)];
    const distance = Math.floor(10 + random() * 500);
    const rarityTier = random() < 0.15 ? 'uncommon' : 'common';

    allObjects.push({
      name,
      description: `A ${galaxyType.type}. ${galaxyType.desc}`,
      fameVisibility: 35 + Math.floor(random() * 35),
      scientificSignificance: 55 + Math.floor(random() * 35),
      rarity: 55 + Math.floor(random() * 35),
      discoveryRecency: 45 + Math.floor(random() * 30),
      culturalImpact: 35 + Math.floor(random() * 30),
      discoveryYear: 1750 + Math.floor(random() * 150),
      objectType: 'Galaxy',
      distance: `${distance}M ly`,
      rarityTier: rarityTier as 'common' | 'uncommon',
    });
    objectId++;
  }

  // 7. Generate IC catalog galaxies (~1500 common)
  for (let i = 1; objectId < 12000 && i <= 1500; i++) {
    const icNum = 100 + i * 3 + Math.floor(random() * 2);
    const name = getUniqueName(`IC ${icNum}`);
    const galaxyType = GALAXY_TYPES[Math.floor(random() * GALAXY_TYPES.length)];
    const distance = Math.floor(20 + random() * 800);

    allObjects.push({
      name,
      description: `A ${galaxyType.type}. ${galaxyType.desc}`,
      fameVisibility: 30 + Math.floor(random() * 30),
      scientificSignificance: 50 + Math.floor(random() * 35),
      rarity: 50 + Math.floor(random() * 35),
      discoveryRecency: 50 + Math.floor(random() * 30),
      culturalImpact: 30 + Math.floor(random() * 25),
      discoveryYear: 1880 + Math.floor(random() * 100),
      objectType: 'Galaxy',
      distance: `${distance}M ly`,
      rarityTier: 'common',
    });
    objectId++;
  }

  // 8. Generate Kepler exoplanets (~1500 uncommon/common)
  for (let i = 1; objectId < 13500 && i <= 1500; i++) {
    const keplerNum = 10 + i;
    const suffix = ['b', 'c', 'd', 'e', 'f'][Math.floor(random() * 5)];
    const name = getUniqueName(`Kepler-${keplerNum}${suffix}`);
    const distance = Math.floor(100 + random() * 3000);
    const rarityTier = random() < 0.2 ? 'uncommon' : 'common';
    const planetTypes = ['rocky super-Earth', 'gas giant', 'ice giant', 'hot Jupiter', 'mini-Neptune', 'Earth-like'];
    const planetType = planetTypes[Math.floor(random() * planetTypes.length)];

    allObjects.push({
      name,
      description: `A ${planetType} exoplanet discovered by the Kepler Space Telescope, orbiting its host star ${distance} light-years from Earth.`,
      fameVisibility: 35 + Math.floor(random() * 35),
      scientificSignificance: 65 + Math.floor(random() * 30),
      rarity: 60 + Math.floor(random() * 30),
      discoveryRecency: 80 + Math.floor(random() * 18),
      culturalImpact: 40 + Math.floor(random() * 30),
      discoveryYear: 2009 + Math.floor(random() * 10),
      objectType: 'Exoplanet',
      distance: `${distance} ly`,
      rarityTier: rarityTier as 'common' | 'uncommon',
    });
    objectId++;
  }

  // 9. Generate TESS exoplanets (~1000 uncommon/common)
  for (let i = 1; objectId < 14500 && i <= 1000; i++) {
    const toiNum = 100 + i * 2 + Math.floor(random() * 2);
    const suffix = ['b', 'c', 'd'][Math.floor(random() * 3)];
    const name = getUniqueName(`TOI-${toiNum}${suffix}`);
    const distance = Math.floor(50 + random() * 1000);
    const rarityTier = random() < 0.25 ? 'uncommon' : 'common';
    const planetTypes = ['rocky world', 'sub-Neptune', 'super-Earth', 'hot Jupiter', 'temperate world'];
    const planetType = planetTypes[Math.floor(random() * planetTypes.length)];

    allObjects.push({
      name,
      description: `A ${planetType} discovered by NASA's TESS mission, located ${distance} light-years away.`,
      fameVisibility: 35 + Math.floor(random() * 30),
      scientificSignificance: 70 + Math.floor(random() * 25),
      rarity: 65 + Math.floor(random() * 30),
      discoveryRecency: 90 + Math.floor(random() * 10),
      culturalImpact: 40 + Math.floor(random() * 30),
      discoveryYear: 2018 + Math.floor(random() * 7),
      objectType: 'Exoplanet',
      distance: `${distance} ly`,
      rarityTier: rarityTier as 'common' | 'uncommon',
    });
    objectId++;
  }

  // 10. Generate nebulae (~1500 common/uncommon)
  for (let i = 1; objectId < 16000 && i <= 1500; i++) {
    const catalog = random() < 0.5 ? 'Sh2' : 'LBN';
    const catNum = 100 + Math.floor(random() * 300);
    const name = getUniqueName(`${catalog}-${catNum}`);
    const nebulaType = NEBULA_TYPES[Math.floor(random() * NEBULA_TYPES.length)];
    const distance = Math.floor(500 + random() * 15000);
    const constellation = CONSTELLATIONS[Math.floor(random() * CONSTELLATIONS.length)];
    const rarityTier = random() < 0.15 ? 'uncommon' : 'common';

    allObjects.push({
      name,
      description: `A ${nebulaType.type} in ${constellation}. ${nebulaType.desc}`,
      fameVisibility: 30 + Math.floor(random() * 35),
      scientificSignificance: 55 + Math.floor(random() * 35),
      rarity: 55 + Math.floor(random() * 35),
      discoveryRecency: 50 + Math.floor(random() * 35),
      culturalImpact: 30 + Math.floor(random() * 30),
      discoveryYear: 1900 + Math.floor(random() * 100),
      objectType: 'Nebula',
      constellation,
      distance: `${distance} ly`,
      rarityTier: rarityTier as 'common' | 'uncommon',
    });
    objectId++;
  }

  // 11. Generate globular and open clusters (~1000 common)
  for (let i = 1; objectId < 17000 && i <= 1000; i++) {
    const isGlobular = random() < 0.3;
    const prefix = isGlobular ? 'Palomar' : 'Berkeley';
    const num = Math.floor(random() * 100) + 1;
    const name = getUniqueName(`${prefix} ${num}`);
    const distance = isGlobular ? Math.floor(10000 + random() * 50000) : Math.floor(1000 + random() * 10000);
    const constellation = CONSTELLATIONS[Math.floor(random() * CONSTELLATIONS.length)];

    allObjects.push({
      name,
      description: isGlobular
        ? `An ancient globular cluster containing hundreds of thousands of stars bound by gravity for billions of years.`
        : `An open star cluster, a group of stars born from the same molecular cloud, gravitationally bound.`,
      fameVisibility: 35 + Math.floor(random() * 30),
      scientificSignificance: 55 + Math.floor(random() * 35),
      rarity: 50 + Math.floor(random() * 35),
      discoveryRecency: 50 + Math.floor(random() * 35),
      culturalImpact: 30 + Math.floor(random() * 30),
      discoveryYear: 1800 + Math.floor(random() * 150),
      objectType: 'Star Cluster',
      constellation,
      distance: `${distance} ly`,
      rarityTier: 'common',
    });
    objectId++;
  }

  // 12. Generate 2MASS stars (~1500 common)
  for (let i = 1; objectId < 18500 && i <= 1500; i++) {
    const ra = String(Math.floor(random() * 24)).padStart(2, '0');
    const dec = String(Math.floor(random() * 90)).padStart(2, '0');
    const suffix = String(Math.floor(random() * 10000)).padStart(4, '0');
    const name = getUniqueName(`2MASS J${ra}${dec}${suffix}`);
    const starType = STAR_TYPES[Math.floor(random() * STAR_TYPES.length)];
    const distance = Math.floor(100 + random() * 15000);

    allObjects.push({
      name,
      description: `${starType.desc} Catalogued by the Two Micron All Sky Survey infrared survey.`,
      fameVisibility: 25 + Math.floor(random() * 25),
      scientificSignificance: 55 + Math.floor(random() * 30),
      rarity: 45 + Math.floor(random() * 30),
      discoveryRecency: 75 + Math.floor(random() * 20),
      culturalImpact: 20 + Math.floor(random() * 25),
      discoveryYear: 1997 + Math.floor(random() * 5),
      objectType: 'Star',
      distance: `${distance} ly`,
      rarityTier: 'common',
    });
    objectId++;
  }

  // 13. Generate WISE infrared objects (~1500 common)
  for (let i = 1; objectId < 20000 && i <= 1500; i++) {
    const ra = String(Math.floor(random() * 24)).padStart(2, '0');
    const dec = String(Math.floor(random() * 90)).padStart(2, '0');
    const suffix = String(Math.floor(random() * 1000)).padStart(3, '0');
    const name = getUniqueName(`WISE J${ra}${dec}.${suffix}`);
    const types = ['brown dwarf', 'cool red dwarf', 'distant infrared galaxy', 'dusty star-forming region'];
    const type = types[Math.floor(random() * types.length)];
    const distance = Math.floor(50 + random() * 100000);

    allObjects.push({
      name,
      description: `A ${type} discovered by NASA's Wide-field Infrared Survey Explorer, detecting objects invisible in optical light.`,
      fameVisibility: 25 + Math.floor(random() * 25),
      scientificSignificance: 60 + Math.floor(random() * 30),
      rarity: 50 + Math.floor(random() * 35),
      discoveryRecency: 85 + Math.floor(random() * 15),
      culturalImpact: 20 + Math.floor(random() * 25),
      discoveryYear: 2010 + Math.floor(random() * 10),
      objectType: random() < 0.7 ? 'Star' : 'Galaxy',
      distance: `${distance} ly`,
      rarityTier: 'common',
    });
    objectId++;
  }

  // Fill remaining to exactly 20,000 with SDSS objects
  while (allObjects.length < 20000) {
    const id = allObjects.length + 1;
    const ra = String(Math.floor(random() * 360)).padStart(3, '0');
    const dec = String(Math.floor(-90 + random() * 180)).padStart(3, '0');
    const name = getUniqueName(`SDSS J${ra}.${dec}`);
    const isGalaxy = random() < 0.6;

    if (isGalaxy) {
      const galaxyType = GALAXY_TYPES[Math.floor(random() * GALAXY_TYPES.length)];
      const distance = Math.floor(100 + random() * 2000);
      allObjects.push({
        name,
        description: `A ${galaxyType.type} observed by the Sloan Digital Sky Survey. ${galaxyType.desc}`,
        fameVisibility: 25 + Math.floor(random() * 25),
        scientificSignificance: 50 + Math.floor(random() * 35),
        rarity: 45 + Math.floor(random() * 35),
        discoveryRecency: 75 + Math.floor(random() * 20),
        culturalImpact: 20 + Math.floor(random() * 25),
        discoveryYear: 2000 + Math.floor(random() * 20),
        objectType: 'Galaxy',
        distance: `${distance}M ly`,
        rarityTier: 'common',
      });
    } else {
      const starType = STAR_TYPES[Math.floor(random() * STAR_TYPES.length)];
      const distance = Math.floor(500 + random() * 20000);
      allObjects.push({
        name,
        description: `${starType.desc} Observed by the Sloan Digital Sky Survey.`,
        fameVisibility: 25 + Math.floor(random() * 25),
        scientificSignificance: 50 + Math.floor(random() * 30),
        rarity: 45 + Math.floor(random() * 30),
        discoveryRecency: 75 + Math.floor(random() * 20),
        culturalImpact: 20 + Math.floor(random() * 25),
        discoveryYear: 2000 + Math.floor(random() * 20),
        objectType: 'Star',
        distance: `${distance} ly`,
        rarityTier: 'common',
      });
    }
  }

  return allObjects.slice(0, 20000);
}

// Legacy function for backward compatibility
export function generateLegacyCelestialObjects(): CelestialObject[] {
  const allObjects: CelestialObject[] = [
    ...solarSystemObjects,
    ...famousStars,
    ...exoplanets,
    ...galaxies,
    ...nebulae,
    ...asteroidsComets,
    ...exoticObjects,
    ...starClusters,
  ];

  // Additional stars
  const additionalStars = [
    'Hadar', 'Gacrux', 'Shaula', 'Alnilam', 'Alnitak', 'Mintaka', 'Bellatrix', 'Wezen', 'Saiph', 'Diphda',
    'Peacock', 'Mirzam', 'Alkaid', 'Mizar', 'Alioth', 'Megrez', 'Phecda', 'Merak', 'Dubhe', 'Thuban',
    'Kochab', 'Schedar', 'Caph', 'Ruchbah', 'Segin', 'Achird', 'Navi', 'Mirfak', 'Almach', 'Hamal',
    'Sheratan', 'Mesarthim', 'Zaurak', 'Cursa', 'Sadalsuud', 'Sadalmelik', 'Sadachbia', 'Skat', 'Algenib',
    'Markab', 'Enif', 'Biham', 'Homam', 'Matar', 'Sadalbari', 'Alderamin', 'Alfirk', 'Errai', 'Iota Draconis',
  ].map((name, i) => ({
    name,
    description: `A notable star with unique properties studied by astronomers worldwide.`,
    fameVisibility: 60 + Math.floor(Math.random() * 30),
    scientificSignificance: 65 + Math.floor(Math.random() * 25),
    rarity: 60 + Math.floor(Math.random() * 30),
    discoveryRecency: 40 + Math.floor(Math.random() * 40),
    culturalImpact: 55 + Math.floor(Math.random() * 35),
    discoveryYear: -2000 + Math.floor(Math.random() * 3000),
    objectType: 'Star',
  }));

  allObjects.push(...additionalStars);

  return allObjects.slice(0, 1000);
}
