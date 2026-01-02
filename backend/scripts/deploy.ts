import { ethers } from 'hardhat';

async function main() {
  console.log('Deploying CosmoNFT contract...');

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.formatEther(balance), 'MATIC');

  // Benefactor wallet address for royalties (30% of proceeds)
  // Replace with actual benefactor wallet address
  const benefactorAddress = process.env.BENEFACTOR_ADDRESS || deployer.address;
  console.log('Benefactor royalty address:', benefactorAddress);

  // Deploy contract
  const CosmoNFT = await ethers.getContractFactory('CosmoNFT');
  const cosmoNFT = await CosmoNFT.deploy(benefactorAddress);

  await cosmoNFT.waitForDeployment();

  const contractAddress = await cosmoNFT.getAddress();
  console.log('CosmoNFT deployed to:', contractAddress);

  // Verify initial state
  const totalMinted = await cosmoNFT.totalNFTsMinted();
  const maxSupply = await cosmoNFT.MAX_SUPPLY();
  const currentPrice = await cosmoNFT.getCurrentPrice();

  console.log('\nContract State:');
  console.log('- Total Minted:', totalMinted.toString());
  console.log('- Max Supply:', maxSupply.toString());
  console.log('- Current Price:', ethers.formatEther(currentPrice), 'USD');

  // Get tier info
  const [tierIndex, tier] = await cosmoNFT.getCurrentTier();
  console.log('\nCurrent Tier:');
  console.log('- Phase:', Number(tierIndex) + 1);
  console.log('- Price:', ethers.formatEther(tier.price), 'USD');
  console.log('- Quantity Available:', tier.quantityAvailable.toString());
  console.log('- Duration:', Number(tier.duration) / 86400, 'days');

  console.log('\n---');
  console.log('Add to your .env file:');
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log('---\n');

  // Verification command
  console.log('To verify on PolygonScan:');
  console.log(`npx hardhat verify --network polygon ${contractAddress} ${benefactorAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
