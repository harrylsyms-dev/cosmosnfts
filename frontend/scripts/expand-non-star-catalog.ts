/**
 * Expand Non-Star Catalog
 *
 * Adds Messier objects, notable NGC objects, and exoplanets
 * to the staging data for NFT selection.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ScoredObject, scoreAstronomicalObject, getTierDistribution, getScoreStats } from '../lib/catalogImporter';
import { AstronomicalObject } from '../lib/astronomicalData';

// ============================================
// MESSIER OBJECTS (Galaxies, Nebulae, Clusters)
// ============================================

const MESSIER_OBJECTS: AstronomicalObject[] = [
  // GALAXIES
  { name: 'M31', objectType: 'Galaxy', description: 'Andromeda Galaxy, nearest major galaxy to Milky Way', constellation: 'Andromeda', distanceLy: 2537000, galaxyType: 'Spiral', magnitude: 3.44, discoveryYear: 964, visualFeatures: ['Spiral arms visible', 'Bright central bulge', 'Dust lanes', 'Satellite galaxies nearby'] },
  { name: 'M33', objectType: 'Galaxy', description: 'Triangulum Galaxy, third largest in Local Group', constellation: 'Triangulum', distanceLy: 2730000, galaxyType: 'Spiral', magnitude: 5.72, discoveryYear: 1654, visualFeatures: ['Face-on spiral', 'Blue star-forming regions', 'Diffuse spiral arms'] },
  { name: 'M51', objectType: 'Galaxy', description: 'Whirlpool Galaxy with companion NGC 5195', constellation: 'Canes Venatici', distanceLy: 23000000, galaxyType: 'Spiral', magnitude: 8.4, discoveryYear: 1773, visualFeatures: ['Grand design spiral arms', 'Interacting with companion', 'Prominent dust lanes'] },
  { name: 'M81', objectType: 'Galaxy', description: "Bode's Galaxy, grand design spiral", constellation: 'Ursa Major', distanceLy: 11800000, galaxyType: 'Spiral', magnitude: 6.94, discoveryYear: 1774, visualFeatures: ['Bright nucleus', 'Sweeping spiral arms', 'Active star formation'] },
  { name: 'M82', objectType: 'Galaxy', description: 'Cigar Galaxy, starburst galaxy', constellation: 'Ursa Major', distanceLy: 11500000, galaxyType: 'Irregular', magnitude: 8.41, discoveryYear: 1774, visualFeatures: ['Edge-on view', 'Red hydrogen filaments', 'Starburst core'] },
  { name: 'M87', objectType: 'Galaxy', description: 'Virgo A, giant elliptical with supermassive black hole', constellation: 'Virgo', distanceLy: 53500000, galaxyType: 'Elliptical', magnitude: 8.6, discoveryYear: 1781, visualFeatures: ['Enormous elliptical', 'Relativistic jet visible', 'Thousands of globular clusters'] },
  { name: 'M101', objectType: 'Galaxy', description: 'Pinwheel Galaxy, face-on spiral', constellation: 'Ursa Major', distanceLy: 20900000, galaxyType: 'Spiral', magnitude: 7.86, discoveryYear: 1781, visualFeatures: ['Perfect face-on view', 'Asymmetric arms', 'Many HII regions'] },
  { name: 'M104', objectType: 'Galaxy', description: 'Sombrero Galaxy with prominent dust lane', constellation: 'Virgo', distanceLy: 29350000, galaxyType: 'Spiral', magnitude: 8.0, discoveryYear: 1781, visualFeatures: ['Edge-on spiral', 'Dark dust lane', 'Bright bulge like a sombrero'] },
  { name: 'M64', objectType: 'Galaxy', description: 'Black Eye Galaxy with dark dust band', constellation: 'Coma Berenices', distanceLy: 17000000, galaxyType: 'Spiral', magnitude: 8.52, discoveryYear: 1779, visualFeatures: ['Dark dust band near nucleus', 'Counter-rotating disk', 'Active star formation'] },
  { name: 'M83', objectType: 'Galaxy', description: 'Southern Pinwheel Galaxy', constellation: 'Hydra', distanceLy: 14700000, galaxyType: 'Spiral', magnitude: 7.54, discoveryYear: 1752, visualFeatures: ['Barred spiral', 'Many supernovae observed', 'Bright star-forming regions'] },
  { name: 'M49', objectType: 'Galaxy', description: 'Brightest galaxy in Virgo Cluster', constellation: 'Virgo', distanceLy: 55900000, galaxyType: 'Elliptical', magnitude: 8.4, discoveryYear: 1771, visualFeatures: ['Giant elliptical', 'Smooth appearance', 'Many globular clusters'] },
  { name: 'M66', objectType: 'Galaxy', description: 'Leo Triplet galaxy', constellation: 'Leo', distanceLy: 36000000, galaxyType: 'Spiral', magnitude: 8.9, discoveryYear: 1780, visualFeatures: ['Asymmetric spiral arms', 'Disturbed by interactions', 'Active star formation'] },
  { name: 'M77', objectType: 'Galaxy', description: 'Cetus A, Seyfert galaxy with active nucleus', constellation: 'Cetus', distanceLy: 47000000, galaxyType: 'Spiral', magnitude: 8.9, discoveryYear: 1780, visualFeatures: ['Active galactic nucleus', 'Bright core', 'Barred spiral structure'] },
  { name: 'M94', objectType: 'Galaxy', description: 'Cat\'s Eye Galaxy with ring structure', constellation: 'Canes Venatici', distanceLy: 16000000, galaxyType: 'Spiral', magnitude: 8.2, discoveryYear: 1781, visualFeatures: ['Inner starburst ring', 'Faint outer ring', 'Compact bright core'] },
  { name: 'M63', objectType: 'Galaxy', description: 'Sunflower Galaxy with many spiral arms', constellation: 'Canes Venatici', distanceLy: 29300000, galaxyType: 'Spiral', magnitude: 8.6, discoveryYear: 1779, visualFeatures: ['Flocculent spiral arms', 'Patchy appearance', 'Many star-forming regions'] },

  // NEBULAE
  { name: 'M42', objectType: 'Nebula', description: 'Orion Nebula, nearest stellar nursery', constellation: 'Orion', distanceLy: 1344, nebulaType: 'Emission', magnitude: 4.0, discoveryYear: 1610, visualFeatures: ['Glowing hydrogen gas', 'Trapezium star cluster', 'Dark dust lanes', 'Wings of nebulosity'] },
  { name: 'M1', objectType: 'Supernova Remnant', description: 'Crab Nebula, remnant of SN 1054', constellation: 'Taurus', distanceLy: 6500, nebulaType: 'Supernova Remnant', magnitude: 8.4, discoveryYear: 1731, visualFeatures: ['Filamentary structure', 'Pulsar at center', 'Expanding gas shell'] },
  { name: 'M8', objectType: 'Nebula', description: 'Lagoon Nebula with dark Bok globules', constellation: 'Sagittarius', distanceLy: 4100, nebulaType: 'Emission', magnitude: 6.0, discoveryYear: 1654, visualFeatures: ['Dark lagoon feature', 'Hourglass Nebula within', 'Open cluster NGC 6530'] },
  { name: 'M16', objectType: 'Nebula', description: 'Eagle Nebula with Pillars of Creation', constellation: 'Serpens', distanceLy: 7000, nebulaType: 'Emission', magnitude: 6.0, discoveryYear: 1745, visualFeatures: ['Pillars of Creation', 'Star-forming columns', 'Young star cluster'] },
  { name: 'M17', objectType: 'Nebula', description: 'Omega Nebula or Swan Nebula', constellation: 'Sagittarius', distanceLy: 5500, nebulaType: 'Emission', magnitude: 6.0, discoveryYear: 1745, visualFeatures: ['Swan-shaped gas cloud', 'Bright emission region', 'Young stellar objects'] },
  { name: 'M20', objectType: 'Nebula', description: 'Trifid Nebula with three-lobed structure', constellation: 'Sagittarius', distanceLy: 5200, nebulaType: 'Emission', magnitude: 6.3, discoveryYear: 1764, visualFeatures: ['Three-lobed by dark dust', 'Emission and reflection regions', 'Young hot stars'] },
  { name: 'M27', objectType: 'Nebula', description: 'Dumbbell Nebula, planetary nebula', constellation: 'Vulpecula', distanceLy: 1360, nebulaType: 'Planetary', magnitude: 7.5, discoveryYear: 1764, visualFeatures: ['Apple-core shape', 'Central white dwarf', 'Green oxygen emission'] },
  { name: 'M57', objectType: 'Nebula', description: 'Ring Nebula, classic planetary nebula', constellation: 'Lyra', distanceLy: 2300, nebulaType: 'Planetary', magnitude: 8.8, discoveryYear: 1779, visualFeatures: ['Perfect ring shape', 'Central white dwarf', 'Colorful ionized gas'] },
  { name: 'M97', objectType: 'Nebula', description: 'Owl Nebula with owl-like appearance', constellation: 'Ursa Major', distanceLy: 2030, nebulaType: 'Planetary', magnitude: 9.9, discoveryYear: 1781, visualFeatures: ['Owl face appearance', 'Two dark eye regions', 'Spherical shell'] },
  { name: 'M76', objectType: 'Nebula', description: 'Little Dumbbell Nebula', constellation: 'Perseus', distanceLy: 2500, nebulaType: 'Planetary', magnitude: 10.1, discoveryYear: 1780, visualFeatures: ['Bipolar structure', 'Cork or butterfly shape', 'Central star visible'] },
  { name: 'M78', objectType: 'Nebula', description: 'Reflection nebula in Orion', constellation: 'Orion', distanceLy: 1600, nebulaType: 'Reflection', magnitude: 8.3, discoveryYear: 1780, visualFeatures: ['Blue reflected starlight', 'Embedded young stars', 'Part of Orion complex'] },
  { name: 'M43', objectType: 'Nebula', description: 'De Mairan\'s Nebula, part of Orion complex', constellation: 'Orion', distanceLy: 1600, nebulaType: 'Emission', magnitude: 9.0, discoveryYear: 1731, visualFeatures: ['Comma-shaped', 'Single illuminating star', 'Connected to M42'] },

  // STAR CLUSTERS
  { name: 'M45', objectType: 'Star Cluster', description: 'Pleiades, Seven Sisters', constellation: 'Taurus', distanceLy: 444, magnitude: 1.6, discoveryYear: -1000, visualFeatures: ['Blue reflection nebulae', 'Bright hot stars', 'Distinctive dipper shape'], subType: 'Open' },
  { name: 'M44', objectType: 'Star Cluster', description: 'Beehive Cluster, Praesepe', constellation: 'Cancer', distanceLy: 577, magnitude: 3.7, discoveryYear: -260, visualFeatures: ['Large scattered cluster', 'Many solar-type stars', 'Visible to naked eye'], subType: 'Open' },
  { name: 'M7', objectType: 'Star Cluster', description: 'Ptolemy Cluster, bright open cluster', constellation: 'Scorpius', distanceLy: 980, magnitude: 3.3, discoveryYear: -130, visualFeatures: ['Scattered bright stars', 'Blue and yellow giants', 'Rich star field'], subType: 'Open' },
  { name: 'M6', objectType: 'Star Cluster', description: 'Butterfly Cluster', constellation: 'Scorpius', distanceLy: 1600, magnitude: 4.2, discoveryYear: 1654, visualFeatures: ['Butterfly wing pattern', 'Orange star BM Scorpii', 'Young cluster'], subType: 'Open' },
  { name: 'M11', objectType: 'Star Cluster', description: 'Wild Duck Cluster, dense open cluster', constellation: 'Scutum', distanceLy: 6200, magnitude: 6.3, discoveryYear: 1681, visualFeatures: ['V-shaped pattern', 'Very dense for open cluster', 'Rich star field'], subType: 'Open' },
  { name: 'M35', objectType: 'Star Cluster', description: 'Open cluster near Castor foot', constellation: 'Gemini', distanceLy: 2800, magnitude: 5.3, discoveryYear: 1745, visualFeatures: ['Large scattered cluster', 'Chains of stars', 'NGC 2158 nearby'], subType: 'Open' },
  { name: 'M37', objectType: 'Star Cluster', description: 'Richest Auriga cluster', constellation: 'Auriga', distanceLy: 4500, magnitude: 6.2, discoveryYear: 1764, visualFeatures: ['Dense stellar concentration', 'Many red giants', 'Orange central star'], subType: 'Open' },
  { name: 'M38', objectType: 'Star Cluster', description: 'Starfish Cluster', constellation: 'Auriga', distanceLy: 4200, magnitude: 7.4, discoveryYear: 1749, visualFeatures: ['Cross or starfish pattern', 'Yellow giant at center', 'Scattered outliers'], subType: 'Open' },

  // GLOBULAR CLUSTERS
  { name: 'M13', objectType: 'Globular Cluster', description: 'Great Globular Cluster in Hercules', constellation: 'Hercules', distanceLy: 22200, magnitude: 5.8, discoveryYear: 1714, visualFeatures: ['Dense spherical core', 'Resolved outer stars', 'Arecibo message target'] },
  { name: 'M3', objectType: 'Globular Cluster', description: 'One of brightest globular clusters', constellation: 'Canes Venatici', distanceLy: 33900, magnitude: 6.2, discoveryYear: 1764, visualFeatures: ['Bright concentrated core', 'Many variable stars', 'Well resolved'] },
  { name: 'M5', objectType: 'Globular Cluster', description: 'Rose Cluster, ancient globular', constellation: 'Serpens', distanceLy: 24500, magnitude: 6.7, discoveryYear: 1702, visualFeatures: ['Slightly elliptical', 'Dense bright core', '13 billion years old'] },
  { name: 'M15', objectType: 'Globular Cluster', description: 'Pegasus Cluster with dense core', constellation: 'Pegasus', distanceLy: 33600, magnitude: 6.2, discoveryYear: 1746, visualFeatures: ['Core-collapsed cluster', 'Planetary nebula inside', 'Dense stellar concentration'] },
  { name: 'M22', objectType: 'Globular Cluster', description: 'Sagittarius Cluster, one of nearest', constellation: 'Sagittarius', distanceLy: 10400, magnitude: 5.1, discoveryYear: 1665, visualFeatures: ['Loose structure', 'Easily resolved', 'Bright for globular'] },
  { name: 'M4', objectType: 'Globular Cluster', description: 'Nearest globular cluster', constellation: 'Scorpius', distanceLy: 7200, magnitude: 5.6, discoveryYear: 1746, visualFeatures: ['Bar of stars through center', 'Loose structure', 'White dwarfs detected'] },
  { name: 'M2', objectType: 'Globular Cluster', description: 'Rich compact globular', constellation: 'Aquarius', distanceLy: 37500, magnitude: 6.5, discoveryYear: 1746, visualFeatures: ['Compact bright core', 'Elliptical shape', 'Well concentrated'] },
  { name: 'M92', objectType: 'Globular Cluster', description: 'Second globular in Hercules', constellation: 'Hercules', distanceLy: 26700, magnitude: 6.4, discoveryYear: 1777, visualFeatures: ['Very old cluster', 'Compact core', 'Often overlooked near M13'] },
];

// ============================================
// FAMOUS NGC OBJECTS
// ============================================

const NGC_OBJECTS: AstronomicalObject[] = [
  // Famous Nebulae
  { name: 'NGC 7293', objectType: 'Nebula', description: 'Helix Nebula, Eye of God', constellation: 'Aquarius', distanceLy: 700, nebulaType: 'Planetary', magnitude: 7.6, discoveryYear: 1824, visualFeatures: ['Huge apparent size', 'Helical structure', 'Central white dwarf', 'Cometary knots'] },
  { name: 'NGC 6543', objectType: 'Nebula', description: "Cat's Eye Nebula, complex planetary", constellation: 'Draco', distanceLy: 3300, nebulaType: 'Planetary', magnitude: 8.1, discoveryYear: 1786, visualFeatures: ['Intricate structure', 'Concentric shells', 'Jets and knots'] },
  { name: 'NGC 2392', objectType: 'Nebula', description: 'Eskimo Nebula', constellation: 'Gemini', distanceLy: 2870, nebulaType: 'Planetary', magnitude: 9.2, discoveryYear: 1787, visualFeatures: ['Face-like appearance', 'Fur hood of gas', 'Central star visible'] },
  { name: 'NGC 6826', objectType: 'Nebula', description: 'Blinking Planetary Nebula', constellation: 'Cygnus', distanceLy: 2200, nebulaType: 'Planetary', magnitude: 8.8, discoveryYear: 1793, visualFeatures: ['Appears to blink', 'Bright central star', 'Green hue'] },
  { name: 'NGC 7009', objectType: 'Nebula', description: 'Saturn Nebula', constellation: 'Aquarius', distanceLy: 2400, nebulaType: 'Planetary', magnitude: 8.0, discoveryYear: 1782, visualFeatures: ['Ansae like Saturn rings', 'Elongated shape', 'Greenish color'] },
  { name: 'NGC 3132', objectType: 'Nebula', description: 'Eight-Burst Nebula, Southern Ring', constellation: 'Vela', distanceLy: 2000, nebulaType: 'Planetary', magnitude: 9.87, discoveryYear: 1835, visualFeatures: ['Double ring structure', 'Binary central star', 'JWST famous image'] },
  { name: 'NGC 6302', objectType: 'Nebula', description: 'Butterfly Nebula, Bug Nebula', constellation: 'Scorpius', distanceLy: 3400, nebulaType: 'Planetary', magnitude: 7.1, discoveryYear: 1880, visualFeatures: ['Bipolar lobes', 'Hottest known white dwarf', 'Complex dust disk'] },
  { name: 'NGC 2070', objectType: 'Nebula', description: 'Tarantula Nebula, largest known', constellation: 'Dorado', distanceLy: 160000, nebulaType: 'Emission', magnitude: 8.0, discoveryYear: 1751, visualFeatures: ['Enormous emission region', 'In Large Magellanic Cloud', 'Intense star formation'] },
  { name: 'NGC 604', objectType: 'Nebula', description: 'Giant HII region in M33', constellation: 'Triangulum', distanceLy: 2700000, nebulaType: 'Emission', magnitude: 15.0, discoveryYear: 1784, visualFeatures: ['Giant star-forming region', 'In Triangulum Galaxy', 'Over 200 young stars'] },
  { name: 'NGC 1952', objectType: 'Supernova Remnant', description: 'Crab Nebula (M1)', constellation: 'Taurus', distanceLy: 6500, nebulaType: 'Supernova Remnant', magnitude: 8.4, discoveryYear: 1731, visualFeatures: ['Filamentary structure', 'Crab Pulsar at center', 'Expanding debris'] },
  { name: 'NGC 6960', objectType: 'Supernova Remnant', description: "Western Veil Nebula, Witch's Broom", constellation: 'Cygnus', distanceLy: 2400, nebulaType: 'Supernova Remnant', magnitude: 7.0, discoveryYear: 1784, visualFeatures: ['Delicate filaments', '52 Cygni at edge', 'Part of Cygnus Loop'] },
  { name: 'NGC 6992', objectType: 'Supernova Remnant', description: 'Eastern Veil Nebula', constellation: 'Cygnus', distanceLy: 2400, nebulaType: 'Supernova Remnant', magnitude: 7.0, discoveryYear: 1784, visualFeatures: ['Bright filaments', 'Detailed structure', 'Hydrogen and oxygen emission'] },

  // Famous Galaxies
  { name: 'NGC 4565', objectType: 'Galaxy', description: 'Needle Galaxy, perfect edge-on spiral', constellation: 'Coma Berenices', distanceLy: 42400000, galaxyType: 'Spiral', magnitude: 9.6, discoveryYear: 1785, visualFeatures: ['Perfect edge-on view', 'Prominent dust lane', 'Visible bulge'] },
  { name: 'NGC 891', objectType: 'Galaxy', description: 'Silver Sliver Galaxy, edge-on spiral', constellation: 'Andromeda', distanceLy: 27300000, galaxyType: 'Spiral', magnitude: 10.1, discoveryYear: 1784, visualFeatures: ['Similar to Milky Way', 'Complex dust lane', 'Boxy bulge'] },
  { name: 'NGC 253', objectType: 'Galaxy', description: 'Sculptor Galaxy, Silver Coin', constellation: 'Sculptor', distanceLy: 11400000, galaxyType: 'Spiral', magnitude: 7.1, discoveryYear: 1783, visualFeatures: ['Nearly edge-on', 'Starburst activity', 'Dusty disk'] },
  { name: 'NGC 1300', objectType: 'Galaxy', description: 'Prototypical barred spiral', constellation: 'Eridanus', distanceLy: 61000000, galaxyType: 'Barred Spiral', magnitude: 10.4, discoveryYear: 1835, visualFeatures: ['Strong central bar', 'Grand design arms', 'Ring structure'] },
  { name: 'NGC 2403', objectType: 'Galaxy', description: 'Intermediate spiral in M81 group', constellation: 'Camelopardalis', distanceLy: 8000000, galaxyType: 'Spiral', magnitude: 8.5, discoveryYear: 1788, visualFeatures: ['Flocculent spiral arms', 'Many HII regions', 'Blue star-forming knots'] },
  { name: 'NGC 4631', objectType: 'Galaxy', description: 'Whale Galaxy, edge-on interacting', constellation: 'Canes Venatici', distanceLy: 30000000, galaxyType: 'Spiral', magnitude: 9.2, discoveryYear: 1787, visualFeatures: ['Whale-like shape', 'Wedge-shaped profile', 'Interacting with NGC 4627'] },
  { name: 'NGC 5128', objectType: 'Galaxy', description: 'Centaurus A, radio galaxy', constellation: 'Centaurus', distanceLy: 13000000, galaxyType: 'Elliptical', magnitude: 6.84, discoveryYear: 1826, visualFeatures: ['Dramatic dust lane', 'Radio jets', 'Result of merger'] },
  { name: 'NGC 4594', objectType: 'Galaxy', description: 'Sombrero Galaxy (M104)', constellation: 'Virgo', distanceLy: 29350000, galaxyType: 'Spiral', magnitude: 8.0, discoveryYear: 1781, visualFeatures: ['Large central bulge', 'Prominent dust ring', 'Sombrero appearance'] },
];

// ============================================
// NOTABLE EXOPLANETS
// ============================================

const EXOPLANETS: AstronomicalObject[] = [
  { name: 'Proxima Centauri b', objectType: 'Exoplanet', description: 'Nearest known exoplanet, potentially habitable', constellation: 'Centaurus', distanceLy: 4.24, discoveryYear: 2016, planetType: 'Rocky', visualFeatures: ['Rocky world', 'Tidally locked', 'Red-lit surface', 'Potential auroras'] },
  { name: 'TRAPPIST-1e', objectType: 'Exoplanet', description: 'Most Earth-like TRAPPIST-1 planet', constellation: 'Aquarius', distanceLy: 39.6, discoveryYear: 2017, planetType: 'Rocky', visualFeatures: ['Earth-sized', 'Potentially habitable', 'Red dwarf light', 'Sibling planets visible'] },
  { name: 'TRAPPIST-1d', objectType: 'Exoplanet', description: 'Inner habitable zone planet', constellation: 'Aquarius', distanceLy: 39.6, discoveryYear: 2017, planetType: 'Rocky', visualFeatures: ['Smaller than Earth', 'Warm climate', 'Red sky', 'Other planets in sky'] },
  { name: 'TRAPPIST-1f', objectType: 'Exoplanet', description: 'Potentially water-rich world', constellation: 'Aquarius', distanceLy: 39.6, discoveryYear: 2017, planetType: 'Rocky', visualFeatures: ['Earth-sized', 'Possible ocean', 'Cooler temperature', 'Red dwarf illumination'] },
  { name: 'Kepler-22b', objectType: 'Exoplanet', description: 'First confirmed habitable zone planet', constellation: 'Cygnus', distanceLy: 620, discoveryYear: 2011, planetType: 'Super-Earth', visualFeatures: ['Super-Earth size', 'Possible ocean world', 'Sun-like star', 'Potential clouds'] },
  { name: 'Kepler-452b', objectType: 'Exoplanet', description: "Earth's older cousin", constellation: 'Cygnus', distanceLy: 1402, discoveryYear: 2015, planetType: 'Super-Earth', visualFeatures: ['Earth-like size', 'G-star host', '385-day year', 'Potentially rocky'] },
  { name: 'Kepler-186f', objectType: 'Exoplanet', description: 'First Earth-size habitable zone planet', constellation: 'Cygnus', distanceLy: 582, discoveryYear: 2014, planetType: 'Rocky', visualFeatures: ['Earth-sized', 'Red dwarf host', 'Potential atmosphere', 'Possibly habitable'] },
  { name: 'LHS 1140 b', objectType: 'Exoplanet', description: 'Super-Earth in habitable zone', constellation: 'Cetus', distanceLy: 41, discoveryYear: 2017, planetType: 'Super-Earth', visualFeatures: ['Dense rocky world', 'Thick atmosphere possible', 'Red dwarf light', 'Transiting'] },
  { name: 'K2-18 b', objectType: 'Exoplanet', description: 'Water vapor detected in atmosphere', constellation: 'Leo', distanceLy: 124, discoveryYear: 2015, planetType: 'Mini-Neptune', visualFeatures: ['Water vapor atmosphere', 'Possible ocean', 'Cool temperature', 'Hazy sky'] },
  { name: 'TOI-700 d', objectType: 'Exoplanet', description: 'TESS-discovered habitable zone planet', constellation: 'Dorado', distanceLy: 101.4, discoveryYear: 2020, planetType: 'Rocky', visualFeatures: ['Earth-sized', 'Red dwarf host', 'Possible atmosphere', 'Tidally locked'] },
  { name: '55 Cancri e', objectType: 'Exoplanet', description: 'Lava world super-Earth', constellation: 'Cancer', distanceLy: 40, discoveryYear: 2004, planetType: 'Super-Earth', visualFeatures: ['Tidally locked', 'Molten lava surface', 'Possible diamond interior', 'Extreme temperatures'] },
  { name: 'HD 189733 b', objectType: 'Exoplanet', description: 'Blue hot Jupiter with glass rain', constellation: 'Vulpecula', distanceLy: 64.5, discoveryYear: 2005, planetType: 'Hot Jupiter', visualFeatures: ['Deep blue color', 'Silicate rain', 'Extreme winds', 'Close to star'] },
  { name: 'WASP-121 b', objectType: 'Exoplanet', description: 'Ultra-hot Jupiter with metal clouds', constellation: 'Puppis', distanceLy: 850, discoveryYear: 2016, planetType: 'Hot Jupiter', visualFeatures: ['Tidally distorted', 'Metal vapor atmosphere', 'Glowing hot', 'Near Roche limit'] },
  { name: 'HR 8799 b', objectType: 'Exoplanet', description: 'Directly imaged giant planet', constellation: 'Pegasus', distanceLy: 129, discoveryYear: 2008, planetType: 'Gas Giant', visualFeatures: ['Young and hot', 'Red color', 'Wide orbit', 'Four planet system'] },
  { name: 'Beta Pictoris b', objectType: 'Exoplanet', description: 'Young giant planet with debris disk', constellation: 'Pictor', distanceLy: 63, discoveryYear: 2008, planetType: 'Gas Giant', visualFeatures: ['Young system', 'Debris disk visible', 'Directly imaged', 'Rapid rotation'] },
  { name: 'GJ 1214 b', objectType: 'Exoplanet', description: 'Prototype mini-Neptune', constellation: 'Ophiuchus', distanceLy: 48, discoveryYear: 2009, planetType: 'Mini-Neptune', visualFeatures: ['Water world candidate', 'Thick atmosphere', 'Featureless spectrum', 'Dense cloud cover'] },
  { name: 'Kepler-16b', objectType: 'Exoplanet', description: 'Circumbinary planet, real Tatooine', constellation: 'Cygnus', distanceLy: 245, discoveryYear: 2011, planetType: 'Gas Giant', visualFeatures: ['Two suns in sky', 'Binary star orbit', 'Saturn-sized', 'Complex shadows'] },
  { name: 'PSR B1620-26 b', objectType: 'Exoplanet', description: 'Methuselah, oldest known planet', constellation: 'Scorpius', distanceLy: 12400, discoveryYear: 2003, planetType: 'Gas Giant', visualFeatures: ['13 billion years old', 'Pulsar host', 'Ancient relic', 'Globular cluster member'] },
  { name: 'Gliese 581 g', objectType: 'Exoplanet', description: 'Controversial habitable zone candidate', constellation: 'Libra', distanceLy: 20.4, discoveryYear: 2010, planetType: 'Super-Earth', visualFeatures: ['Possibly tidally locked', 'Terminator zone', 'Red dwarf light', 'Contested existence'] },
  { name: 'Ross 128 b', objectType: 'Exoplanet', description: 'Temperate planet around quiet red dwarf', constellation: 'Virgo', distanceLy: 11, discoveryYear: 2017, planetType: 'Rocky', visualFeatures: ['Earth-mass', 'Quiet host star', 'Mild temperature', 'Second nearest'] },
];

// ============================================
// ADDITIONAL EXOTIC OBJECTS
// ============================================

const EXOTIC_OBJECTS: AstronomicalObject[] = [
  // More Black Holes
  { name: 'Cygnus X-1', objectType: 'Black Hole', description: 'First confirmed stellar black hole', constellation: 'Cygnus', distanceLy: 6100, mass: 21, discoveryYear: 1964, visualFeatures: ['X-ray binary system', 'Accretion disk', 'Blue supergiant companion', 'Relativistic jets'] },
  { name: 'V404 Cygni', objectType: 'Black Hole', description: 'Nearest confirmed black hole', constellation: 'Cygnus', distanceLy: 7800, mass: 9, discoveryYear: 1989, visualFeatures: ['Low-mass X-ray binary', 'Outburst activity', 'Wobbling jets', 'Variable X-rays'] },
  { name: 'GRS 1915+105', objectType: 'Black Hole', description: 'First galactic microquasar', constellation: 'Aquila', distanceLy: 36000, mass: 12, discoveryYear: 1992, visualFeatures: ['Superluminal jets', 'High spin', 'Extreme variability', 'Accretion disk winds'] },

  // More Quasars
  { name: 'Markarian 421', objectType: 'Quasar', description: 'Nearest bright blazar', constellation: 'Ursa Major', distanceLy: 434000000, discoveryYear: 1992, visualFeatures: ['Relativistic jet toward Earth', 'Gamma-ray bright', 'Rapid variability', 'BL Lac type'] },
  { name: 'OJ 287', objectType: 'Quasar', description: 'Binary supermassive black hole quasar', constellation: 'Cancer', distanceLy: 3500000000, discoveryYear: 1891, visualFeatures: ['Binary black hole', '12-year flare cycle', 'Massive primary', 'Disk impacts'] },
  { name: 'TON 618', objectType: 'Quasar', description: 'One of most massive black holes known', constellation: 'Canes Venatici', distanceLy: 10400000000, discoveryYear: 1957, visualFeatures: ['66 billion solar masses', 'Hyperluminous', 'Distant beacon', 'Enormous accretion disk'] },

  // More Pulsars
  { name: 'PSR B1919+21', objectType: 'Pulsar', description: 'First pulsar discovered', constellation: 'Vulpecula', distanceLy: 2283, discoveryYear: 1967, visualFeatures: ['Historic discovery', 'Regular pulses', 'Joy Division artwork', 'Lighthouse beam'] },
  { name: 'PSR B1937+21', objectType: 'Pulsar', description: 'First millisecond pulsar', constellation: 'Vulpecula', distanceLy: 3600, discoveryYear: 1982, visualFeatures: ['642 spins per second', 'Recycled pulsar', 'Extremely stable', 'Atomic clock precision'] },

  // More Neutron Stars
  { name: 'SGR 1806-20', objectType: 'Magnetar', description: 'Magnetar with most powerful known flare', constellation: 'Sagittarius', distanceLy: 50000, discoveryYear: 1979, visualFeatures: ['Extreme magnetic field', 'Giant flare in 2004', 'Soft gamma repeater', 'Near galactic center'] },
  { name: 'PSR J1748-2446ad', objectType: 'Pulsar', description: 'Fastest spinning pulsar known', constellation: 'Sagittarius', distanceLy: 18000, discoveryYear: 2006, visualFeatures: ['716 Hz rotation', 'In globular cluster', 'Extreme surface speed', 'Near relativistic equator'] },
];

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('='.repeat(60));
  console.log('     NON-STAR CATALOG EXPANSION');
  console.log('='.repeat(60));

  // Combine all non-star objects
  const allNewObjects: AstronomicalObject[] = [
    ...MESSIER_OBJECTS,
    ...NGC_OBJECTS,
    ...EXOPLANETS,
    ...EXOTIC_OBJECTS,
  ];

  console.log(`\nTotal new objects to add: ${allNewObjects.length}`);
  console.log(`  Messier: ${MESSIER_OBJECTS.length}`);
  console.log(`  NGC: ${NGC_OBJECTS.length}`);
  console.log(`  Exoplanets: ${EXOPLANETS.length}`);
  console.log(`  Exotic: ${EXOTIC_OBJECTS.length}`);

  // Count by type
  const byType: Record<string, number> = {};
  for (const obj of allNewObjects) {
    byType[obj.objectType] = (byType[obj.objectType] || 0) + 1;
  }

  console.log('\nBy type:');
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type.padEnd(20)} ${count}`);
    });

  // Score all objects
  console.log('\nScoring objects...');
  const scored: ScoredObject[] = allNewObjects.map(obj => {
    const s = scoreAstronomicalObject(obj);
    s.catalogSource = 'Expanded';
    return s;
  });

  // Load existing HYG data
  const hygPath = path.resolve(__dirname, '..', 'staging', 'hyg-scored.json');
  let hygObjects: ScoredObject[] = [];

  if (fs.existsSync(hygPath)) {
    console.log('\nLoading existing HYG data...');
    const hygData = JSON.parse(fs.readFileSync(hygPath, 'utf-8'));
    hygObjects = Array.isArray(hygData) ? hygData : hygData.objects || [];
    console.log(`  Loaded ${hygObjects.length} HYG objects`);
  }

  // Merge (avoid duplicates by name)
  const existingNames = new Set(hygObjects.map(o => o.name.toLowerCase()));
  const newUnique = scored.filter(o => !existingNames.has(o.name.toLowerCase()));

  console.log(`\nNew unique objects to add: ${newUnique.length}`);

  const combined = [...hygObjects, ...newUnique];
  console.log(`Total combined objects: ${combined.length}`);

  // Stats
  const dist = getTierDistribution(combined);
  const stats = getScoreStats(combined);

  console.log('\nCombined tier distribution:');
  Object.entries(dist).forEach(([tier, count]) => {
    const pct = (count / combined.length * 100).toFixed(1);
    console.log(`  ${tier.padEnd(12)} ${count.toString().padStart(6)} (${pct}%)`);
  });

  console.log('\nScore stats:');
  console.log(`  Min: ${stats.min}, Max: ${stats.max}`);
  console.log(`  Mean: ${stats.mean}, Median: ${stats.median}`);

  // Save
  const outputPath = path.resolve(__dirname, '..', 'staging', 'expanded-catalog.json');
  fs.writeFileSync(outputPath, JSON.stringify(combined, null, 2));
  console.log(`\nSaved to: ${outputPath}`);

  // Also save just the new non-star objects for reference
  const nonStarPath = path.resolve(__dirname, '..', 'staging', 'non-star-objects.json');
  fs.writeFileSync(nonStarPath, JSON.stringify(newUnique, null, 2));
  console.log(`Non-star objects saved to: ${nonStarPath}`);

  console.log('\n' + '='.repeat(60));
  console.log('Expansion complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);
