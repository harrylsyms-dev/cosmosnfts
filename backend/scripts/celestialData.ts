// Comprehensive Celestial Objects Database for CosmoNFT
// 1000 real celestial objects for Phase 1 Launch

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
}

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

// Generate more unique objects to reach 1000
export function generateAllCelestialObjects(): CelestialObject[] {
  const allObjects: CelestialObject[] = [
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

  // More exoplanets with Kepler designations
  for (let i = 1; i <= 200; i++) {
    const keplerNum = 100 + i;
    allObjects.push({
      name: `Kepler-${keplerNum}b`,
      description: `An exoplanet discovered by the Kepler Space Telescope, orbiting a distant star.`,
      fameVisibility: 50 + Math.floor(Math.random() * 25),
      scientificSignificance: 70 + Math.floor(Math.random() * 25),
      rarity: 75 + Math.floor(Math.random() * 20),
      discoveryRecency: 80 + Math.floor(Math.random() * 15),
      culturalImpact: 50 + Math.floor(Math.random() * 25),
      discoveryYear: 2009 + Math.floor(Math.random() * 10),
      objectType: 'Exoplanet',
    });
  }

  // More galaxies with NGC designations
  for (let i = 1; i <= 150; i++) {
    const ngcNum = 1000 + i * 50;
    allObjects.push({
      name: `NGC ${ngcNum}`,
      description: `A distant galaxy catalogued in the New General Catalogue of deep sky objects.`,
      fameVisibility: 45 + Math.floor(Math.random() * 25),
      scientificSignificance: 65 + Math.floor(Math.random() * 25),
      rarity: 70 + Math.floor(Math.random() * 25),
      discoveryRecency: 50 + Math.floor(Math.random() * 30),
      culturalImpact: 45 + Math.floor(Math.random() * 25),
      discoveryYear: 1750 + Math.floor(Math.random() * 150),
      objectType: 'Galaxy',
    });
  }

  // More nebulae
  const nebulaTypes = ['Emission', 'Reflection', 'Planetary', 'Dark', 'Supernova Remnant'];
  for (let i = 1; i <= 100; i++) {
    const type = nebulaTypes[Math.floor(Math.random() * nebulaTypes.length)];
    allObjects.push({
      name: `IC ${2000 + i}`,
      description: `A ${type.toLowerCase()} nebula catalogued in the Index Catalogue of deep sky objects.`,
      fameVisibility: 40 + Math.floor(Math.random() * 30),
      scientificSignificance: 65 + Math.floor(Math.random() * 25),
      rarity: 70 + Math.floor(Math.random() * 25),
      discoveryRecency: 55 + Math.floor(Math.random() * 25),
      culturalImpact: 45 + Math.floor(Math.random() * 25),
      discoveryYear: 1880 + Math.floor(Math.random() * 100),
      objectType: 'Nebula',
    });
  }

  // Ensure we have at least 1000 objects
  while (allObjects.length < 1000) {
    const types = ['Star', 'Exoplanet', 'Galaxy', 'Nebula', 'Asteroid', 'Star Cluster'];
    const type = types[Math.floor(Math.random() * types.length)];
    const id = allObjects.length + 1;

    allObjects.push({
      name: `COSMO-${id.toString().padStart(4, '0')}`,
      description: `A unique celestial ${type.toLowerCase()} waiting to be fully catalogued and studied.`,
      fameVisibility: 50 + Math.floor(Math.random() * 40),
      scientificSignificance: 60 + Math.floor(Math.random() * 35),
      rarity: 65 + Math.floor(Math.random() * 30),
      discoveryRecency: 60 + Math.floor(Math.random() * 35),
      culturalImpact: 50 + Math.floor(Math.random() * 35),
      discoveryYear: 1900 + Math.floor(Math.random() * 125),
      objectType: type,
    });
  }

  return allObjects.slice(0, 1000);
}
