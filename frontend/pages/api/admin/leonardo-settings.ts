import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifyAdminToken } from '../../../lib/adminAuth';

// Available Leonardo models
// Note: FLUX.2 Pro uses V2 API with model name, others use V1 API with modelId
export const LEONARDO_MODELS = [
  { id: 'flux-pro-2.0', name: 'FLUX.2 Pro', description: 'FLUX.2 Pro - Best quality (Recommended)', apiVersion: 'v2' },
  { id: 'b2614463-296c-462a-9586-aafdb8f00e36', name: 'FLUX', description: 'FLUX Precision - High quality', apiVersion: 'v1' },
  { id: 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3', name: 'Phoenix', description: 'Leonardo Phoenix - Good quality, faster', apiVersion: 'v1' },
  { id: 'e316348f-7773-490e-adcd-46757c738eb7', name: 'Diffusion XL', description: 'Leonardo Diffusion XL - Balanced', apiVersion: 'v1' },
  { id: 'aa77f04e-3eec-4034-9c07-d0f619684628', name: 'Kino XL', description: 'Leonardo Kino XL - Cinematic style', apiVersion: 'v1' },
  { id: '5c232a9e-9061-4777-980a-ddc8e65647c6', name: 'Vision XL', description: 'Leonardo Vision XL - Photorealistic', apiVersion: 'v1' },
];

// Valid contrast values for FLUX
export const CONTRAST_VALUES = [1.0, 1.3, 1.8, 2.5, 3.0, 3.5, 4.0, 4.5];

// Common image dimensions
export const IMAGE_DIMENSIONS = [
  { width: 512, height: 512, label: '512x512' },
  { width: 768, height: 768, label: '768x768' },
  { width: 1024, height: 1024, label: '1024x1024' },
  { width: 1280, height: 1280, label: '1280x1280' },
  { width: 1440, height: 1440, label: '1440x1440 (Recommended)' },
  { width: 1024, height: 1536, label: '1024x1536 (Portrait)' },
  { width: 1536, height: 1024, label: '1536x1024 (Landscape)' },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

    // GET: Fetch current settings
    if (req.method === 'GET') {
      let config = await prisma.imagePromptConfig.findUnique({
        where: { id: 'main' },
      });

      // Create default config if it doesn't exist
      if (!config) {
        config = await prisma.imagePromptConfig.create({
          data: { id: 'main' },
        });
      }

      return res.json({
        success: true,
        settings: {
          modelId: config.leonardoModelId,
          modelName: config.leonardoModelName,
          width: config.imageWidth,
          height: config.imageHeight,
          contrast: config.contrast,
          enhancePrompt: config.enhancePrompt,
          guidanceScale: config.guidanceScale,
          numImages: config.numImages,
          isPublic: config.isPublic,
        },
        availableModels: LEONARDO_MODELS,
        contrastValues: CONTRAST_VALUES,
        dimensionPresets: IMAGE_DIMENSIONS,
      });
    }

    // PUT: Update settings
    if (req.method === 'PUT') {
      const {
        modelId,
        modelName,
        width,
        height,
        contrast,
        enhancePrompt,
        guidanceScale,
        numImages,
        isPublic,
      } = req.body;

      // Validate contrast value for FLUX
      if (contrast !== undefined && !CONTRAST_VALUES.includes(contrast)) {
        return res.status(400).json({
          error: `Invalid contrast value. Must be one of: ${CONTRAST_VALUES.join(', ')}`,
        });
      }

      // Validate dimensions
      if (width && (width < 512 || width > 2048)) {
        return res.status(400).json({ error: 'Width must be between 512 and 2048' });
      }
      if (height && (height < 512 || height > 2048)) {
        return res.status(400).json({ error: 'Height must be between 512 and 2048' });
      }

      const updatedConfig = await prisma.imagePromptConfig.upsert({
        where: { id: 'main' },
        update: {
          leonardoModelId: modelId,
          leonardoModelName: modelName,
          imageWidth: width,
          imageHeight: height,
          contrast: contrast,
          enhancePrompt: enhancePrompt,
          guidanceScale: guidanceScale,
          numImages: numImages,
          isPublic: isPublic,
          updatedAt: new Date(),
        },
        create: {
          id: 'main',
          leonardoModelId: modelId || 'flux-pro-2.0',
          leonardoModelName: modelName || 'FLUX.2 Pro',
          imageWidth: width || 1440,
          imageHeight: height || 1440,
          contrast: contrast || 3.5,
          enhancePrompt: enhancePrompt ?? false,
          guidanceScale: guidanceScale || 7,
          numImages: numImages || 1,
          isPublic: isPublic ?? false,
        },
      });

      console.log(`Admin ${admin.email} updated Leonardo settings`);

      return res.json({
        success: true,
        message: 'Settings updated successfully',
        settings: {
          modelId: updatedConfig.leonardoModelId,
          modelName: updatedConfig.leonardoModelName,
          width: updatedConfig.imageWidth,
          height: updatedConfig.imageHeight,
          contrast: updatedConfig.contrast,
          enhancePrompt: updatedConfig.enhancePrompt,
          guidanceScale: updatedConfig.guidanceScale,
          numImages: updatedConfig.numImages,
          isPublic: updatedConfig.isPublic,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Leonardo settings error:', error);
    return res.status(500).json({ error: 'Failed to manage settings', details: error?.message });
  }
}
