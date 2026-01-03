import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

// Build prompt for Leonardo AI - same as generate-image.ts
function buildPrompt(nft: any): string {
  const poeticDescriptions: Record<string, string> = {
    'Star': 'A brilliant celestial beacon, burning with ancient light across the cosmic void',
    'Galaxy': 'A vast island universe, swirling with billions of stars in an eternal cosmic dance',
    'Nebula': 'A cosmic nursery of gas and dust, painting the heavens with ethereal colors',
    'Exoplanet': 'An alien world orbiting a distant sun, holding mysteries of the unknown',
    'Black Hole': 'The ultimate abyss, where light itself cannot escape the crushing grip of gravity',
    'Pulsar': 'A rapidly spinning neutron star, beaming lighthouse signals across the cosmos',
    'Quasar': 'The blazing heart of a distant galaxy, outshining trillions of suns',
    'Star Cluster': 'A dazzling congregation of stars, born together in cosmic brotherhood',
    'Asteroid': 'A primordial rock, a remnant from the dawn of our solar system',
    'Comet': 'A wanderer of ice and dust, trailing a magnificent tail across the sky',
    'Moon': 'A celestial companion, scarred with ancient craters and bathed in reflected starlight',
    'Planet': 'A majestic world with swirling atmospheres and hidden mysteries',
    'Dwarf Planet': 'A distant icy world at the edge of the solar system',
    'Supernova': 'The spectacular death of a star, scattering elements across the cosmos',
    'White Dwarf': 'The glowing ember of a dead star, slowly cooling for eternity',
    'Neutron Star': 'An impossibly dense stellar corpse, spinning with immense energy',
    'Brown Dwarf': 'A failed star, too small to ignite but still glowing with heat',
    'Globular Cluster': 'An ancient sphere of stars, orbiting the galaxy for billions of years',
  };

  const typeFeatures: Record<string, string> = {
    'Star': '- Brilliant corona and solar flares\n- Stellar surface with plasma dynamics',
    'Galaxy': '- Spiral arms or elliptical structure\n- Central bright core with dark matter halo',
    'Nebula': '- Colorful gas clouds with embedded stars\n- Pillars of creation aesthetic',
    'Exoplanet': '- Alien landscapes and atmospheres\n- Multiple moons or ring systems possible',
    'Black Hole': '- Event horizon with accretion disk\n- Gravitational lensing effects',
    'Pulsar': '- Magnetic field lines and radiation beams\n- Rapidly rotating compact star',
    'Quasar': '- Supermassive black hole with jets\n- Incredibly luminous active core',
    'Star Cluster': '- Hundreds of stars in close proximity\n- Varied star colors and sizes',
    'Asteroid': '- Cratered rocky surface\n- Irregular shape with dramatic lighting',
    'Comet': '- Icy nucleus with glowing coma\n- Long dust and ion tails',
    'Moon': '- Cratered surface with maria and highlands\n- Dramatic shadows and earth-shine',
    'Planet': '- Atmospheric bands and cloud formations\n- Possible ring systems and moons',
    'Dwarf Planet': '- Icy surface with complex geology\n- Distant and mysterious appearance',
    'Supernova': '- Explosive shockwave and debris field\n- Brilliant multicolored remnant',
    'White Dwarf': '- Compact glowing core\n- Fading stellar remnant',
    'Neutron Star': '- Intense magnetic field lines\n- Rapid rotation and energy beams',
    'Brown Dwarf': '- Dim reddish glow\n- Atmospheric bands like a giant planet',
    'Globular Cluster': '- Dense central core of stars\n- Spherical ancient stellar population',
  };

  // Use NFT's own description if available, otherwise fall back to type-based
  const description = nft.description || poeticDescriptions[nft.objectType] || `A magnificent ${nft.objectType || 'cosmic object'} in the depths of space`;
  const features = typeFeatures[nft.objectType] || '';
  const totalScore = nft.totalScore || nft.cosmicScore || 300;
  const isPremium = totalScore >= 400;
  const isElite = totalScore >= 450;

  return `Stunning artistic interpretation of ${nft.name} as a cosmic masterpiece.

${description}

Visual Style: Bold digital art, vibrant colors, stylized but detailed, cosmic art with ethereal glow
${features}
- Nebulae in vivid purples, blues, golds, oranges, and reds
- Stars twinkling with magical light effects
- Isolated cosmic object against deep black void
- Pure black space background
- No landscape or environmental elements
- Dreamlike, fantastical yet scientifically inspired
${isElite ? '- Ultra premium, museum-worthy composition with breathtaking detail' : ''}
${isPremium ? '- Premium quality with exceptional luminosity' : ''}

Composition: Eye-catching, dramatic, energetic, centered cosmic object
Quality: Professional digital art, vibrant, gallery-quality illustration
Medium: Digital painting, concept art, stylized 3D render
Color: Vibrant, saturated, cosmic palette with glow effects and deep space blacks
Lighting: Magical cosmic glow, ethereal light effects, volumetric rays`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id } = req.query;
    const nftId = parseInt(id as string);

    if (isNaN(nftId)) {
      return res.status(400).json({ error: 'Invalid NFT ID' });
    }

    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    const prompt = buildPrompt(nft);

    res.json({
      success: true,
      nftId: nft.id,
      nftName: nft.name,
      objectType: nft.objectType,
      totalScore: nft.totalScore,
      prompt,
      negativePrompt: 'text, watermarks, signatures, logos, words, letters, blurry, low quality',
    });
  } catch (error: any) {
    console.error('Failed to preview prompt:', error);
    res.status(500).json({ error: 'Failed to preview prompt', details: error?.message });
  }
}
