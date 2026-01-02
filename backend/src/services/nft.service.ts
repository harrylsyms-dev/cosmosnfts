import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface NFTCreateInput {
  tokenId: number;
  name: string;
  description: string;
  image: string;
  fameVisibility: number;
  scientificSignificance: number;
  rarity: number;
  discoveryRecency: number;
  culturalImpact: number;
  discoveryYear?: number;
  objectType?: string;
}

export function calculateCosmicScore(input: NFTCreateInput): number {
  // Calculate total score from 5 categories (max 100 each = 500 total)
  return (
    input.fameVisibility +
    input.scientificSignificance +
    input.rarity +
    input.discoveryRecency +
    input.culturalImpact
  );
}

export function calculateDiscoveryRecencyScore(discoveryYear: number): number {
  // Older discoveries score higher (more historical significance)
  // Formula: max(25, (2024 - year) / ((2024 - year) + 50) * 100)
  const currentYear = new Date().getFullYear();
  const yearsSinceDiscovery = currentYear - discoveryYear;

  if (yearsSinceDiscovery <= 0) return 25; // Minimum score for recent discoveries

  const score = (yearsSinceDiscovery / (yearsSinceDiscovery + 50)) * 100;
  return Math.max(25, Math.round(score));
}

export function getBadgeForScore(score: number): string {
  if (score >= 425) return 'ELITE';
  if (score >= 400) return 'PREMIUM';
  if (score >= 375) return 'EXCEPTIONAL';
  return 'STANDARD';
}

export async function createNFT(input: NFTCreateInput) {
  const cosmicScore = calculateCosmicScore(input);
  const basePrice = cosmicScore; // $1 per point

  const nft = await prisma.nFT.create({
    data: {
      tokenId: input.tokenId,
      name: input.name,
      description: input.description,
      image: input.image,
      fameVisibility: input.fameVisibility,
      scientificSignificance: input.scientificSignificance,
      rarity: input.rarity,
      discoveryRecency: input.discoveryRecency,
      culturalImpact: input.culturalImpact,
      cosmicScore,
      totalScore: cosmicScore,
      currentPrice: basePrice,
      basePriceCents: Math.round(basePrice * 100),
      status: 'AVAILABLE',
      discoveryYear: input.discoveryYear,
      objectType: input.objectType,
    },
  });

  logger.info(`NFT created: ${nft.id} - ${nft.name} (Score: ${cosmicScore})`);
  return nft;
}

export async function updateNFTPrices(phaseMultiplier: number) {
  // Update all available NFT prices based on new phase multiplier
  const nfts = await prisma.nFT.findMany({
    where: { status: 'AVAILABLE' },
  });

  for (const nft of nfts) {
    const newPrice = nft.cosmicScore * phaseMultiplier;
    await prisma.nFT.update({
      where: { id: nft.id },
      data: { currentPrice: newPrice },
    });
  }

  logger.info(`Updated prices for ${nfts.length} NFTs with multiplier ${phaseMultiplier}`);
}

export async function getAvailableNFTsByBadge(badge: string, limit: number = 20) {
  const badgeRanges: Record<string, { min: number; max: number }> = {
    ELITE: { min: 425, max: 500 },
    PREMIUM: { min: 400, max: 424 },
    EXCEPTIONAL: { min: 375, max: 399 },
    STANDARD: { min: 350, max: 374 },
  };

  const range = badgeRanges[badge];
  if (!range) return [];

  return prisma.nFT.findMany({
    where: {
      status: 'AVAILABLE',
      cosmicScore: {
        gte: range.min,
        lte: range.max,
      },
    },
    take: limit,
    orderBy: { cosmicScore: 'desc' },
  });
}

export async function reserveNFT(nftId: number) {
  return prisma.nFT.update({
    where: { id: nftId },
    data: { status: 'RESERVED' },
  });
}

export async function releaseNFT(nftId: number) {
  return prisma.nFT.update({
    where: { id: nftId },
    data: { status: 'AVAILABLE' },
  });
}

export async function markNFTAsSold(
  nftId: number,
  tokenId: number,
  ownerAddress: string,
  transactionHash: string
) {
  return prisma.nFT.update({
    where: { id: nftId },
    data: {
      status: 'SOLD',
      tokenId,
      ownerAddress,
      transactionHash,
    },
  });
}
