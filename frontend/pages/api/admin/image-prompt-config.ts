import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifyAdminToken } from '../../../lib/adminAuth';

// Default object type configurations for all 16 types
const defaultObjectTypeConfigs: Record<string, { description: string; visualFeatures: string; customPrompt?: string }> = {
  'Star': {
    description: 'A stellar body producing light and heat through nuclear fusion',
    visualFeatures: 'Radiant corona, solar flares, glowing plasma surface, stellar winds',
    customPrompt: ''
  },
  'Galaxy': {
    description: 'A massive collection of stars, gas, dust, and dark matter',
    visualFeatures: 'Spiral arms, central bulge, billions of tiny stars, galactic halo',
    customPrompt: ''
  },
  'Nebula': {
    description: 'An interstellar cloud of gas and dust',
    visualFeatures: 'Colorful gas clouds, dust pillars, stellar nurseries, intricate filaments',
    customPrompt: ''
  },
  'Black Hole': {
    description: 'A region of spacetime with gravity so intense nothing can escape',
    visualFeatures: 'Accretion disk, event horizon, gravitational lensing, relativistic jets',
    customPrompt: ''
  },
  'Planet': {
    description: 'A celestial body orbiting a star',
    visualFeatures: 'Atmospheric bands, surface features, rings, moons',
    customPrompt: ''
  },
  'Moon': {
    description: 'A natural satellite orbiting a planet',
    visualFeatures: 'Crater impacts, maria, surface texture, reflected light',
    customPrompt: ''
  },
  'Exoplanet': {
    description: 'A planet orbiting a star outside our solar system',
    visualFeatures: 'Alien atmospheres, exotic surface, parent star glow, unique coloring',
    customPrompt: ''
  },
  'Pulsar': {
    description: 'A highly magnetized rotating neutron star emitting electromagnetic radiation',
    visualFeatures: 'Rotating beams of light, magnetic field lines, intense radiation',
    customPrompt: ''
  },
  'Quasar': {
    description: 'An extremely luminous active galactic nucleus',
    visualFeatures: 'Brilliant central point, host galaxy, powerful jets, accretion disk',
    customPrompt: ''
  },
  'Supernova': {
    description: 'A powerful stellar explosion',
    visualFeatures: 'Expanding shock wave, debris cloud, brilliant flash, colorful remnants',
    customPrompt: ''
  },
  'Supernova Remnant': {
    description: 'The structure left behind after a supernova explosion',
    visualFeatures: 'Expanding shell, filamentary structure, hot gas, synchrotron radiation',
    customPrompt: ''
  },
  'Asteroid': {
    description: 'A rocky body orbiting the Sun',
    visualFeatures: 'Irregular shape, cratered surface, rocky texture, reflected sunlight',
    customPrompt: ''
  },
  'Comet': {
    description: 'An icy body that releases gas and dust when near the Sun',
    visualFeatures: 'Bright coma, dust tail, ion tail, nucleus, solar wind interaction',
    customPrompt: ''
  },
  'Star Cluster': {
    description: 'A group of stars gravitationally bound together',
    visualFeatures: 'Dense stellar concentration, varied star colors, gravitational center',
    customPrompt: ''
  },
  'Dwarf Planet': {
    description: 'A planetary-mass object not dominant in its orbit',
    visualFeatures: 'Small spherical body, unique surface features, distant orbit',
    customPrompt: ''
  },
  'Magnetar': {
    description: 'A neutron star with an extremely powerful magnetic field',
    visualFeatures: 'Intense magnetic field lines, X-ray emissions, starquakes',
    customPrompt: ''
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
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
      // Get current configuration or create default
      let config = await prisma.imagePromptConfig.findUnique({
        where: { id: 'main' }
      });

      if (!config) {
        // Create default config
        config = await prisma.imagePromptConfig.create({
          data: {
            id: 'main',
            objectTypeConfigs: JSON.stringify(defaultObjectTypeConfigs),
            basePromptTemplate: `Photorealistic astrophotography of {name}, a {objectType}.

{description}

Visual characteristics: {features}

Style: {artStyle}
Colors: {colorPalette}
Lighting: {lightingStyle}
Quality: {qualityDescriptors}
Medium: {mediumDescriptors}

{scoreModifier}

--no {negativePrompt}`
          }
        });
      }

      // Parse the object type configs
      let objectTypeConfigs = defaultObjectTypeConfigs;
      try {
        const parsed = JSON.parse(config.objectTypeConfigs);
        if (Object.keys(parsed).length > 0) {
          objectTypeConfigs = parsed;
        }
      } catch {
        // Use defaults
      }

      return res.json({
        config: {
          ...config,
          objectTypeConfigs
        },
        availableModels: [
          { id: 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3', name: 'Leonardo Phoenix', description: 'Latest model with style reference support (recommended)' },
          { id: 'b24e16ff-06e3-43eb-8d33-4416c2d75876', name: 'Leonardo Diffusion XL', description: 'High quality general purpose model' },
          { id: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3', name: 'Leonardo Creative', description: 'More artistic interpretations' },
          { id: 'e316348f-7773-490e-adcd-46757c738eb7', name: 'Leonardo Kino XL', description: 'Cinematic quality images' },
          { id: 'aa77f04e-3eec-4034-9c07-d0f619684628', name: 'Leonardo Anime XL', description: 'Anime/illustration style' },
          { id: '5c232a9e-9061-4777-980a-ddc8e65647c6', name: 'Leonardo PhotoReal', description: 'Photorealistic images' }
        ],
        placeholders: [
          { key: '{name}', description: 'NFT name (e.g., "Betelgeuse")' },
          { key: '{objectType}', description: 'Object type (e.g., "Star", "Galaxy")' },
          { key: '{description}', description: 'NFT description text' },
          { key: '{features}', description: 'Object type visual features' },
          { key: '{score}', description: 'Total cosmic score (0-500)' },
          { key: '{badge}', description: 'Badge tier (STANDARD, EXCEPTIONAL, PREMIUM, ELITE, LEGENDARY)' },
          { key: '{artStyle}', description: 'Art style from settings' },
          { key: '{colorPalette}', description: 'Color palette from settings' },
          { key: '{lightingStyle}', description: 'Lighting style from settings' },
          { key: '{qualityDescriptors}', description: 'Quality descriptors from settings' },
          { key: '{mediumDescriptors}', description: 'Medium descriptors from settings' },
          { key: '{scoreModifier}', description: 'Premium/Elite/Legendary modifier based on score' },
          { key: '{negativePrompt}', description: 'Negative prompt from settings' }
        ]
      });
    }

    if (req.method === 'PUT') {
      const {
        basePromptTemplate,
        artStyle,
        colorPalette,
        lightingStyle,
        compositionStyle,
        qualityDescriptors,
        mediumDescriptors,
        realismLevel,
        usePhotorealistic,
        useScientificAccuracy,
        avoidArtisticStylization,
        leonardoModelId,
        imageWidth,
        imageHeight,
        promptMagic,
        guidanceScale,
        negativePrompt,
        objectTypeConfigs,
        premiumThreshold,
        eliteThreshold,
        legendaryThreshold,
        premiumModifier,
        eliteModifier,
        legendaryModifier,
        includeScoreInPrompt,
        includeMetadataInPrompt,
        useDescriptionTransform
      } = req.body;

      // Serialize object type configs if provided as object
      const serializedConfigs = typeof objectTypeConfigs === 'object'
        ? JSON.stringify(objectTypeConfigs)
        : objectTypeConfigs;

      const config = await prisma.imagePromptConfig.upsert({
        where: { id: 'main' },
        create: {
          id: 'main',
          basePromptTemplate,
          artStyle: artStyle || 'photorealistic astrophotography',
          colorPalette: colorPalette || 'Natural space colors, deep blacks, subtle nebula hues',
          lightingStyle: lightingStyle || 'Natural starlight, subtle glow effects',
          compositionStyle: compositionStyle || 'Scientific, documentary-style',
          qualityDescriptors: qualityDescriptors || '8K, ultra high definition, NASA-quality',
          mediumDescriptors: mediumDescriptors || 'Telescope photography, Hubble-style imagery',
          realismLevel: realismLevel ?? 80,
          usePhotorealistic: usePhotorealistic ?? true,
          useScientificAccuracy: useScientificAccuracy ?? true,
          avoidArtisticStylization: avoidArtisticStylization ?? true,
          leonardoModelId: leonardoModelId || 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3', // Leonardo Phoenix
          imageWidth: imageWidth ?? 1024,
          imageHeight: imageHeight ?? 1024,
          promptMagic: promptMagic ?? false,
          guidanceScale: guidanceScale ?? 7,
          negativePrompt: negativePrompt || 'cartoon, anime, illustration, painting, artistic, stylized, fantasy, magical, glowing effects, text, watermarks',
          objectTypeConfigs: serializedConfigs || JSON.stringify(defaultObjectTypeConfigs),
          premiumThreshold: premiumThreshold ?? 400,
          eliteThreshold: eliteThreshold ?? 425,
          legendaryThreshold: legendaryThreshold ?? 450,
          premiumModifier: premiumModifier || 'Exceptional detail and clarity',
          eliteModifier: eliteModifier || 'Museum-quality, breathtaking composition',
          legendaryModifier: legendaryModifier || 'Once-in-a-lifetime capture, iconic imagery',
          includeScoreInPrompt: includeScoreInPrompt ?? false,
          includeMetadataInPrompt: includeMetadataInPrompt ?? true,
          useDescriptionTransform: useDescriptionTransform ?? false
        },
        update: {
          basePromptTemplate,
          artStyle,
          colorPalette,
          lightingStyle,
          compositionStyle,
          qualityDescriptors,
          mediumDescriptors,
          realismLevel,
          usePhotorealistic,
          useScientificAccuracy,
          avoidArtisticStylization,
          leonardoModelId,
          imageWidth,
          imageHeight,
          promptMagic,
          guidanceScale,
          negativePrompt,
          objectTypeConfigs: serializedConfigs,
          premiumThreshold,
          eliteThreshold,
          legendaryThreshold,
          premiumModifier,
          eliteModifier,
          legendaryModifier,
          includeScoreInPrompt,
          includeMetadataInPrompt,
          useDescriptionTransform
        }
      });

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'IMAGE_PROMPT_CONFIG_UPDATE',
            details: `Updated image prompt configuration`,
            ipAddress: req.headers['x-forwarded-for'] as string || 'unknown'
          }
        });
      } catch {
        // Audit log might not exist
      }

      console.log(`Image prompt config updated by ${admin.email}`);

      return res.json({
        success: true,
        config
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in image-prompt-config:', error);
    res.status(500).json({ error: 'Failed to process request', details: error?.message });
  }
}
