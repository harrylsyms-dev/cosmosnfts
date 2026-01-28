import type { NextApiRequest, NextApiResponse } from 'next';
import { BadgeTier } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import {
  BASE_PRICE_PER_SCORE,
  TIER_MULTIPLIERS,
  calculatePrice,
  getCurrentSeriesMultiplier,
  SERIES_MULTIPLIER_THRESHOLDS,
} from '../../../lib/pricing';

function getBadgeForScore(score: number): BadgeTier {
  if (score >= 450) return 'LEGENDARY';
  if (score >= 425) return 'ELITE';
  if (score >= 400) return 'PREMIUM';
  if (score >= 375) return 'EXCEPTIONAL';
  return 'STANDARD';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const nftId = parseInt(id as string);

    if (isNaN(nftId)) {
      return res.status(400).json({ error: 'Invalid NFT ID' });
    }

    // First try to find by database ID, then by tokenId
    let nft = await prisma.nFT.findUnique({
      where: { id: nftId },
    });

    // If not found by id, try by tokenId (for backward compatibility with links using tokenId)
    if (!nft) {
      nft = await prisma.nFT.findUnique({
        where: { tokenId: nftId },
      });
    }

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Get current series multiplier
    const seriesMultiplier = await getCurrentSeriesMultiplier(prisma);

    // Use scientific scores if available, fall back to legacy scores
    const totalScore = nft.totalScore || nft.cosmicScore || 0;
    const badge = (nft.badgeTier as BadgeTier) || getBadgeForScore(totalScore);
    const tierMultiplier = TIER_MULTIPLIERS[badge];
    const priceCalc = calculatePrice(totalScore, badge, seriesMultiplier);

    // Calculate price projections for future series (based on sell-through rates)
    const projections = SERIES_MULTIPLIER_THRESHOLDS.map((threshold) => {
      const futurePrice = calculatePrice(totalScore, badge, threshold.multiplier);
      return {
        sellThroughRate: `${(threshold.minSellThrough * 100).toFixed(0)}%+`,
        multiplier: threshold.multiplier,
        price: `$${futurePrice.priceUsd.toFixed(2)}`,
      };
    });

    res.status(200).json({
      nftId: nft.id,
      tokenId: nft.tokenId,
      name: nft.name,
      description: nft.description,
      image: nft.image || (nft.imageIpfsHash ? `https://gateway.pinata.cloud/ipfs/${nft.imageIpfsHash}` : null),
      objectType: nft.objectType,
      constellation: nft.constellation,
      distance: nft.distance,
      score: totalScore,
      badge,

      // Scientific data (objective measurements)
      scientificData: {
        distanceLy: nft.distanceLy,
        massSolar: nft.massSolar,
        luminosity: nft.luminosity,
        temperatureK: nft.temperatureK,
        discoveryYear: nft.discoveryYear,
        spectralType: nft.spectralType,
        apparentMagnitude: nft.apparentMagnitude,
        absoluteMagnitude: nft.absoluteMagnitude,
      },

      // Score breakdown (new 10-metric system)
      scoreBreakdown: {
        culturalSignificance: nft.culturalSignificance,
        scientificImportance: nft.scientificImportance,
        historicalSignificance: nft.historicalSignificance,
        visualImpact: nft.visualImpact,
        uniqueness: nft.uniqueness,
        accessibility: nft.accessibility,
        proximity: nft.proximity,
        storyFactor: nft.storyFactor,
        activeRelevance: nft.activeRelevance,
        futurePotential: nft.futurePotential,
      },

      // Pricing info
      seriesMultiplier,
      tierMultiplier,
      basePricePerPoint: BASE_PRICE_PER_SCORE,
      currentPrice: priceCalc.priceUsd,
      displayPrice: `$${priceCalc.priceUsd.toFixed(2)}`,
      priceFormula: `$${BASE_PRICE_PER_SCORE.toFixed(2)} x ${totalScore} x ${tierMultiplier} x ${seriesMultiplier}`,
      status: nft.status,
      priceProjections: projections,
    });
  } catch (error) {
    console.error('Error fetching NFT:', error);
    res.status(500).json({ error: 'Failed to fetch NFT' });
  }
}
