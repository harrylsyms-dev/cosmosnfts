import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

// Build prompt for Leonardo AI - same logic as generate-image.ts
function buildPrompt(nft: any, globalPromptOverride?: string): string {
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

  // If global prompt override is provided, use it with variable substitution
  if (globalPromptOverride) {
    return globalPromptOverride
      .replace(/\{name\}/g, nft.name || 'Unknown')
      .replace(/\{description\}/g, description)
      .replace(/\{objectType\}/g, nft.objectType || 'Unknown')
      .replace(/\{features\}/g, features)
      .replace(/\{score\}/g, String(totalScore))
      .replace(/\{badge\}/g, nft.badgeTier || 'STANDARD');
  }

  return `Stunning artistic interpretation of ${nft.name} as a cosmic masterpiece.

${description}

Visual Style: Bold digital art, vibrant colors, stylized but detailed, cosmic art with ethereal glow
${features}
- Nebulae in vivid purples, blues, golds, oranges, and reds
- Stars twinkling with magical light effects
- Surreal cosmic landscape
- Dreamlike, fantastical yet scientifically inspired
${isElite ? '- Ultra premium, museum-worthy composition with breathtaking detail' : ''}
${isPremium ? '- Premium quality with exceptional luminosity' : ''}

Composition: Eye-catching, dramatic, energetic
Quality: Professional digital art, vibrant, gallery-quality illustration
Medium: Digital painting, concept art, stylized 3D render
Color: Vibrant, saturated, cosmic palette with glow effects and deep space blacks
Lighting: Magical cosmic glow, ethereal light effects, volumetric rays`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    if (req.method === 'GET') {
      // Get sample prompts for preview
      const { limit = '10', objectTypes } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 10, 50);

      // Get diverse sample of NFTs
      let nfts;
      if (objectTypes) {
        const types = (objectTypes as string).split(',');
        nfts = await prisma.nFT.findMany({
          where: { objectType: { in: types } },
          take: limitNum,
          orderBy: { id: 'asc' },
        });
      } else {
        // Get sample from different object types
        nfts = await prisma.nFT.findMany({
          take: limitNum,
          orderBy: { id: 'asc' },
        });
      }

      // Get global prompt from settings
      const settings = await prisma.siteSettings.findFirst();
      const globalPrompt = settings?.leonardoPrompt || undefined;

      const previews = nfts.map((nft: any) => ({
        id: nft.id,
        name: nft.name,
        objectType: nft.objectType,
        description: nft.description,
        totalScore: nft.totalScore,
        badgeTier: nft.badgeTier,
        prompt: buildPrompt(nft, globalPrompt),
        hasImage: !!nft.imageIpfsHash,
      }));

      return res.json({
        success: true,
        count: previews.length,
        globalPromptConfigured: !!globalPrompt,
        previews,
      });
    }

    if (req.method === 'POST') {
      // Preview with a test global prompt (without saving)
      const { testPrompt, nftIds, limit = 10 } = req.body;
      const limitNum = Math.min(limit, 50);

      let nfts;
      if (nftIds && Array.isArray(nftIds)) {
        nfts = await prisma.nFT.findMany({
          where: { id: { in: nftIds } },
        });
      } else {
        nfts = await prisma.nFT.findMany({
          take: limitNum,
          orderBy: { id: 'asc' },
        });
      }

      const previews = nfts.map((nft: any) => ({
        id: nft.id,
        name: nft.name,
        objectType: nft.objectType,
        description: nft.description,
        totalScore: nft.totalScore,
        badgeTier: nft.badgeTier,
        prompt: buildPrompt(nft, testPrompt || undefined),
        hasImage: !!nft.imageIpfsHash,
      }));

      return res.json({
        success: true,
        count: previews.length,
        usingTestPrompt: !!testPrompt,
        previews,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Failed to preview prompts:', error);
    res.status(500).json({ error: 'Failed to preview prompts', details: error?.message });
  }
}
