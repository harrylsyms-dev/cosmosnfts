import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

// Default object type configurations (fallback if not configured)
const defaultObjectTypeConfigs: Record<string, { description: string; visualFeatures: string }> = {
  'Star': { description: 'A stellar body producing light and heat', visualFeatures: 'Radiant corona, solar flares, glowing plasma surface' },
  'Galaxy': { description: 'A massive collection of stars, gas, and dust', visualFeatures: 'Spiral arms, central bulge, billions of stars' },
  'Nebula': { description: 'An interstellar cloud of gas and dust', visualFeatures: 'Colorful gas clouds, dust pillars, stellar nurseries' },
  'Black Hole': { description: 'A region where gravity is so intense nothing escapes', visualFeatures: 'Accretion disk, event horizon, gravitational lensing' },
  'Planet': { description: 'A celestial body orbiting a star', visualFeatures: 'Atmospheric bands, surface features, possible rings' },
  'Moon': { description: 'A natural satellite orbiting a planet', visualFeatures: 'Crater impacts, surface texture, reflected light' },
  'Exoplanet': { description: 'A planet orbiting a star outside our solar system', visualFeatures: 'Alien atmospheres, exotic surface, parent star glow' },
  'Pulsar': { description: 'A rotating neutron star emitting radiation', visualFeatures: 'Rotating beams of light, magnetic field lines' },
  'Quasar': { description: 'An extremely luminous active galactic nucleus', visualFeatures: 'Brilliant central point, powerful jets, host galaxy' },
  'Supernova': { description: 'A powerful stellar explosion', visualFeatures: 'Expanding shock wave, debris cloud, colorful remnants' },
  'Supernova Remnant': { description: 'Structure left after a supernova explosion', visualFeatures: 'Expanding shell, filamentary structure, hot gas' },
  'Asteroid': { description: 'A rocky body orbiting the Sun', visualFeatures: 'Irregular shape, cratered surface, rocky texture' },
  'Comet': { description: 'An icy body releasing gas near the Sun', visualFeatures: 'Bright coma, dust tail, ion tail, nucleus' },
  'Star Cluster': { description: 'A group of stars gravitationally bound', visualFeatures: 'Dense stellar concentration, varied star colors' },
  'Dwarf Planet': { description: 'A planetary-mass object not dominant in orbit', visualFeatures: 'Small spherical body, unique surface features' },
  'Magnetar': { description: 'A neutron star with powerful magnetic field', visualFeatures: 'Intense magnetic field lines, X-ray emissions' },
};

interface ImagePromptConfig {
  basePromptTemplate: string | null;
  artStyle: string;
  colorPalette: string;
  lightingStyle: string;
  compositionStyle: string;
  qualityDescriptors: string;
  mediumDescriptors: string;
  realismLevel: number;
  usePhotorealistic: boolean;
  useScientificAccuracy: boolean;
  avoidArtisticStylization: boolean;
  negativePrompt: string;
  objectTypeConfigs: string;
  premiumThreshold: number;
  eliteThreshold: number;
  legendaryThreshold: number;
  premiumModifier: string;
  eliteModifier: string;
  legendaryModifier: string;
  includeScoreInPrompt: boolean;
  useDescriptionTransform: boolean;
}

// Build prompt using the Advanced Prompt Editor configuration
function buildPromptFromConfig(nft: any, config: ImagePromptConfig): { prompt: string; combinedNegativePrompt: string } {
  // Parse object type configs
  let objectTypeConfigs: Record<string, { description: string; visualFeatures: string; customPrompt?: string; negativePrompt?: string }> = defaultObjectTypeConfigs;
  try {
    const parsed = JSON.parse(config.objectTypeConfigs);
    if (Object.keys(parsed).length > 0) {
      objectTypeConfigs = { ...defaultObjectTypeConfigs, ...parsed };
    }
  } catch {
    // Use defaults
  }

  // Get object type specific config
  const typeConfig = objectTypeConfigs[nft.objectType] || { description: '', visualFeatures: '' };

  // Combine global and object-specific negative prompts
  const objectNegative = (typeConfig as any).negativePrompt || '';
  const combinedNegativePrompt = objectNegative
    ? `${config.negativePrompt}, ${objectNegative}`
    : config.negativePrompt;

  // Check for custom prompt override for this type
  if (typeConfig.customPrompt && typeConfig.customPrompt.trim()) {
    const prompt = typeConfig.customPrompt
      .replace(/\{name\}/g, nft.name || 'Unknown')
      .replace(/\{description\}/g, nft.description || typeConfig.description)
      .replace(/\{objectType\}/g, nft.objectType || 'Cosmic Object')
      .replace(/\{features\}/g, typeConfig.visualFeatures || '')
      .replace(/\{score\}/g, String(nft.totalScore || 0))
      .replace(/\{badge\}/g, nft.badgeTier || 'STANDARD');
    return { prompt, combinedNegativePrompt };
  }

  // Use the NFT's actual description (not transformed)
  const description = nft.description || typeConfig.description || `A ${nft.objectType || 'cosmic object'}`;
  const features = typeConfig.visualFeatures || '';
  const totalScore = nft.totalScore || 0;

  // Determine score modifier
  let scoreModifier = '';
  if (totalScore >= config.legendaryThreshold) {
    scoreModifier = config.legendaryModifier;
  } else if (totalScore >= config.eliteThreshold) {
    scoreModifier = config.eliteModifier;
  } else if (totalScore >= config.premiumThreshold) {
    scoreModifier = config.premiumModifier;
  }

  // Build realism prefix if enabled
  let realismPrefix = '';
  if (config.usePhotorealistic) {
    realismPrefix = 'Photorealistic, ';
  }
  if (config.useScientificAccuracy) {
    realismPrefix += 'scientifically accurate, ';
  }

  // If base template is configured, use it
  if (config.basePromptTemplate && config.basePromptTemplate.trim()) {
    const prompt = config.basePromptTemplate
      .replace(/\{name\}/g, nft.name || 'Unknown')
      .replace(/\{description\}/g, description)
      .replace(/\{objectType\}/g, nft.objectType || 'Cosmic Object')
      .replace(/\{features\}/g, features)
      .replace(/\{score\}/g, String(totalScore))
      .replace(/\{badge\}/g, nft.badgeTier || 'STANDARD')
      .replace(/\{artStyle\}/g, config.artStyle)
      .replace(/\{colorPalette\}/g, config.colorPalette)
      .replace(/\{lightingStyle\}/g, config.lightingStyle)
      .replace(/\{compositionStyle\}/g, config.compositionStyle)
      .replace(/\{qualityDescriptors\}/g, config.qualityDescriptors)
      .replace(/\{mediumDescriptors\}/g, config.mediumDescriptors)
      .replace(/\{scoreModifier\}/g, scoreModifier)
      .replace(/\{negativePrompt\}/g, combinedNegativePrompt);
    return { prompt, combinedNegativePrompt };
  }

  // Default template using configured styles
  const prompt = `${realismPrefix}${config.artStyle} of ${nft.name}, a ${nft.objectType || 'cosmic object'}.

${description}

Visual characteristics: ${features}

Style: ${config.artStyle}
Colors: ${config.colorPalette}
Lighting: ${config.lightingStyle}
Composition: ${config.compositionStyle}
Quality: ${config.qualityDescriptors}
Medium: ${config.mediumDescriptors}

${scoreModifier ? `Quality tier: ${scoreModifier}` : ''}
${config.includeScoreInPrompt ? `Cosmic Score: ${totalScore}/500` : ''}

--no ${combinedNegativePrompt}`.trim();

  return { prompt, combinedNegativePrompt };
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

    // Get the Advanced Prompt Editor configuration
    let promptConfig = await prisma.imagePromptConfig.findUnique({
      where: { id: 'main' }
    });

    // Create default config if not exists
    if (!promptConfig) {
      promptConfig = await prisma.imagePromptConfig.create({
        data: {
          id: 'main',
          objectTypeConfigs: JSON.stringify(defaultObjectTypeConfigs),
        }
      });
    }

    const { prompt, combinedNegativePrompt } = buildPromptFromConfig(nft, promptConfig as ImagePromptConfig);

    res.json({
      success: true,
      nftId: nft.id,
      nftName: nft.name,
      objectType: nft.objectType,
      totalScore: nft.totalScore,
      prompt,
      negativePrompt: combinedNegativePrompt,
      globalNegativePrompt: promptConfig.negativePrompt,
    });
  } catch (error: any) {
    console.error('Failed to preview prompt:', error);
    res.status(500).json({ error: 'Failed to preview prompt', details: error?.message });
  }
}
