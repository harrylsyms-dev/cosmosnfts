import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

// Contract ABI (minimal for minting)
export const COSMO_NFT_ABI = [
  'function mint(address to, uint256 tokenId) external returns (bool)',
  'function batchMint(address to, uint256[] calldata tokenIds) external returns (bool)',
  'function getCurrentPrice() external view returns (uint256)',
  'function getTimeUntilNextTier() external view returns (uint256)',
  'function getQuantityRemaining() external view returns (uint256)',
  'function getCurrentTier() public view returns (uint256, tuple(uint256 price, uint256 quantityAvailable, uint256 quantitySold, uint256 startTime, uint256 duration, bool active))',
  'function advanceTier() external',
  'function totalNFTsMinted() public view returns (uint256)',
  'function MAX_SUPPLY() public view returns (uint256)',
  'event NFTMinted(address indexed to, uint256 indexed tokenId, uint256 price)',
  'event TierAdvanced(uint256 indexed tierIndex, uint256 newPrice)',
];

let provider: ethers.JsonRpcProvider | null = null;
let wallet: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;

export function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    const rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
    provider = new ethers.JsonRpcProvider(rpcUrl);
    logger.info(`Connected to RPC: ${rpcUrl}`);
  }
  return provider;
}

export function getWallet(): ethers.Wallet {
  if (!wallet) {
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY is required');
    }
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, getProvider());
    logger.info(`Wallet initialized: ${wallet.address}`);
  }
  return wallet;
}

export function getContract(): ethers.Contract {
  if (!contract) {
    if (!process.env.CONTRACT_ADDRESS) {
      throw new Error('CONTRACT_ADDRESS is required');
    }
    contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      COSMO_NFT_ABI,
      getWallet()
    );
    logger.info(`Contract initialized: ${process.env.CONTRACT_ADDRESS}`);
  }
  return contract;
}

export const blockchainConfig = {
  // Polygon Mainnet
  chainId: 137,
  chainName: 'Polygon',
  rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  blockExplorer: 'https://polygonscan.com',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },

  // Contract details
  contractAddress: process.env.CONTRACT_ADDRESS || '',

  // Gas settings
  gasLimit: 300000,
  maxFeePerGas: ethers.parseUnits('50', 'gwei'),
  maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'),
};

export default { getProvider, getWallet, getContract, blockchainConfig };
