import { getContract, getWallet, blockchainConfig } from '../config/blockchain';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface MintResult {
  transactionHash: string;
  tokenIds: number[];
  gasUsed: string;
}

export async function mintNFTs(
  nftIds: number[],
  toAddress: string
): Promise<MintResult> {
  const contract = getContract();
  const wallet = getWallet();

  logger.info(`Minting ${nftIds.length} NFTs to ${toAddress}`);

  // Get next available token IDs
  const totalMinted = await contract.totalNFTsMinted();
  const startTokenId = Number(totalMinted) + 1;

  const tokenIds = nftIds.map((_, index) => startTokenId + index);

  try {
    let tx;

    if (nftIds.length === 1) {
      // Single mint
      tx = await contract.mint(toAddress, tokenIds[0], {
        gasLimit: blockchainConfig.gasLimit,
      });
    } else {
      // Batch mint
      tx = await contract.batchMint(toAddress, tokenIds, {
        gasLimit: blockchainConfig.gasLimit * nftIds.length,
      });
    }

    logger.info(`Transaction submitted: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();

    logger.info(`Transaction confirmed: ${receipt.hash}, gas used: ${receipt.gasUsed}`);

    return {
      transactionHash: receipt.hash,
      tokenIds,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error: any) {
    logger.error(`Minting failed:`, error);
    throw new Error(`Minting failed: ${error.message}`);
  }
}

export async function getCurrentPricing() {
  const contract = getContract();

  const [currentPrice, timeUntilNextTier, quantityRemaining, tierData] =
    await Promise.all([
      contract.getCurrentPrice(),
      contract.getTimeUntilNextTier(),
      contract.getQuantityRemaining(),
      contract.getCurrentTier(),
    ]);

  const [tierIndex, tier] = tierData;

  return {
    currentPrice: currentPrice.toString(),
    displayPrice: (Number(currentPrice) / 1e18).toFixed(2),
    timeUntilNextTier: Number(timeUntilNextTier),
    quantityRemaining: Number(quantityRemaining),
    tierIndex: Number(tierIndex),
    tier: {
      price: tier.price.toString(),
      quantityAvailable: Number(tier.quantityAvailable),
      quantitySold: Number(tier.quantitySold),
      startTime: Number(tier.startTime),
      duration: Number(tier.duration),
      active: tier.active,
    },
  };
}

export async function advanceTier(): Promise<string> {
  const contract = getContract();

  logger.info('Advancing to next tier...');

  const tx = await contract.advanceTier({
    gasLimit: blockchainConfig.gasLimit,
  });

  const receipt = await tx.wait();

  logger.info(`Tier advanced. Transaction: ${receipt.hash}`);

  return receipt.hash;
}

export async function getContractStats() {
  const contract = getContract();

  const [totalMinted, maxSupply, currentPrice] = await Promise.all([
    contract.totalNFTsMinted(),
    contract.MAX_SUPPLY(),
    contract.getCurrentPrice(),
  ]);

  return {
    totalMinted: Number(totalMinted),
    maxSupply: Number(maxSupply),
    remaining: Number(maxSupply) - Number(totalMinted),
    currentPrice: (Number(currentPrice) / 1e18).toFixed(2),
  };
}

export async function verifyOwnership(
  tokenId: number,
  expectedOwner: string
): Promise<boolean> {
  const contract = getContract();

  try {
    const owner = await contract.ownerOf(tokenId);
    return owner.toLowerCase() === expectedOwner.toLowerCase();
  } catch (error) {
    logger.error(`Failed to verify ownership for token ${tokenId}:`, error);
    return false;
  }
}

export async function getTokenMetadata(tokenId: number) {
  const contract = getContract();

  try {
    const tokenURI = await contract.tokenURI(tokenId);
    return tokenURI;
  } catch (error) {
    logger.error(`Failed to get metadata for token ${tokenId}:`, error);
    return null;
  }
}

// Auction-related blockchain operations
export async function createAuctionOnChain(
  tokenId: number,
  startingBidCents: number,
  durationDays: number
): Promise<string> {
  // Placeholder for auction creation on blockchain
  logger.info(`Creating auction on chain for token ${tokenId}`);
  return 'mock-tx-hash';
}

export async function finalizeAuctionOnChain(tokenId: number): Promise<string> {
  // Placeholder for auction finalization on blockchain
  logger.info(`Finalizing auction on chain for token ${tokenId}`);
  return 'mock-tx-hash';
}

// Export as service object for compatibility
export const blockchainService = {
  mintNFTs,
  getCurrentPricing,
  advanceTier,
  getContractStats,
  verifyOwnership,
  getTokenMetadata,
  createAuction: createAuctionOnChain,
  finalizeAuction: finalizeAuctionOnChain,
};
