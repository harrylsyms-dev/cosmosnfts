import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getReferenceImage,
  getFallbackReferenceImage,
} from '../../../lib/referenceImages';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const name = (req.query.name as string) || 'Sirius';
  const objectType = (req.query.type as string) || 'Star';

  console.log(`Testing reference image for: ${name} (${objectType})`);

  try {
    // Try specific search
    const refImage = await getReferenceImage(name, objectType);
    console.log('getReferenceImage result:', refImage);

    // Try fallback
    const fallback = getFallbackReferenceImage(objectType);
    console.log('getFallbackReferenceImage result:', fallback);

    return res.json({
      success: true,
      name,
      objectType,
      referenceImage: refImage,
      fallbackImage: fallback,
      wouldUse: refImage || fallback,
    });
  } catch (error: any) {
    console.error('Test error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}
