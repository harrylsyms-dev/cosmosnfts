import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';
import {
  getReferenceImage,
  getFallbackReferenceImage,
} from '../../../../lib/referenceImages';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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

    // Find all NFTs without reference images
    const nftsWithoutRef = await prisma.nFT.findMany({
      where: {
        referenceImageUrl: null,
      },
      select: {
        id: true,
        name: true,
        objectType: true,
      },
    });

    if (nftsWithoutRef.length === 0) {
      return res.json({
        success: true,
        message: 'All NFTs already have reference images',
        updated: 0,
        deleted: 0,
      });
    }

    console.log(`Backfilling reference images for ${nftsWithoutRef.length} NFTs...`);

    let updated = 0;
    let deleted = 0;
    const results: Array<{ id: number; name: string; status: string; source?: string }> = [];

    for (const nft of nftsWithoutRef) {
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 300));

      // Try to get reference image
      let referenceImage = await getReferenceImage(nft.name, nft.objectType || undefined);

      // Try fallback if no specific image found
      if (!referenceImage && nft.objectType) {
        referenceImage = getFallbackReferenceImage(nft.objectType);
      }

      if (referenceImage) {
        // Update the NFT with reference image
        await prisma.nFT.update({
          where: { id: nft.id },
          data: {
            referenceImageUrl: referenceImage.url,
            referenceImageSource: referenceImage.source,
          },
        });
        updated++;
        results.push({
          id: nft.id,
          name: nft.name,
          status: 'updated',
          source: referenceImage.source,
        });
        console.log(`Updated ${nft.name} with reference image from ${referenceImage.source}`);
      } else {
        // No reference image found - delete the NFT
        await prisma.nFT.delete({
          where: { id: nft.id },
        });
        deleted++;
        results.push({
          id: nft.id,
          name: nft.name,
          status: 'deleted - no reference image available',
        });
        console.log(`Deleted ${nft.name} - no reference image available`);
      }
    }

    console.log(`Backfill complete: ${updated} updated, ${deleted} deleted`);

    return res.json({
      success: true,
      message: `Backfilled ${updated} NFTs with reference images. Deleted ${deleted} NFTs without available reference images.`,
      updated,
      deleted,
      results,
    });
  } catch (error: any) {
    console.error('Backfill error:', error);
    return res.status(500).json({ error: 'Backfill failed', details: error?.message });
  }
}
