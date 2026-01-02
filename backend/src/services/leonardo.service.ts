import axios from 'axios';
import FormData from 'form-data';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface NFTData {
  tokenId: number;
  name: string;
  description: string;
  fameScore: number;
  significanceScore: number;
  rarityScore: number;
  discoveryRecencyScore: number;
  culturalImpactScore: number;
  totalScore: number;
  objectType?: string;
}

interface GenerationResult {
  tokenId: number;
  imageIpfsHash: string;
  metadataIpfsHash: string;
}

class LeonardoImageService {
  private apiKey: string;
  private apiUrl = 'https://cloud.leonardo.ai/api/rest/v1';
  private pinataApiKey: string;
  private pinataApiSecret: string;

  constructor() {
    this.apiKey = process.env.LEONARDO_AI_API_KEY || '';
    this.pinataApiKey = process.env.PINATA_API_KEY || '';
    this.pinataApiSecret = process.env.PINATA_API_SECRET || '';
  }

  /**
   * Generate premium prompt for Leonardo AI
   */
  private generatePrompt(nft: NFTData): string {
    const isIconic = nft.fameScore > 85;
    const isPremium = nft.totalScore > 400;

    const aestheticStyle = nft.totalScore > 450
      ? 'cinematic, award-winning digital art, museum quality, 8K, masterpiece'
      : nft.totalScore > 400
      ? 'professional digital art, gallery quality, high-end illustration, 4K'
      : 'detailed digital art, high quality illustration';

    return `
Scientifically accurate representation of ${nft.name}, a ${nft.objectType || 'celestial object'}.

${nft.description}

Visual Style: ${aestheticStyle}
- Detailed surface features and textures
- Cosmic rays, stellar radiation, volumetric lighting
- Surrounding nebulae and cosmic dust particles
- Deep space background with distant stars and galaxies
- ${isIconic ? 'Iconic and universally recognizable' : 'Detailed and intricate'}
${isPremium ? '- Premium quality, gallery-ready composition' : ''}

Composition: Balanced, professional, centered
Quality: ${isPremium ? 'Museum-grade, masterpiece' : 'High quality, professional'}
Medium: Digital illustration, 3D render
Color: Vibrant, scientifically inspired, saturated cosmic palette
Lighting: Dramatic cosmic lighting with realistic physics

--no text, watermarks, signatures, logos
`.trim();
  }

  /**
   * Generate single image using Leonardo AI
   */
  async generateImage(nft: NFTData): Promise<string> {
    try {
      logger.info(`Generating image for: ${nft.name} (Token #${nft.tokenId})`);

      const prompt = this.generatePrompt(nft);

      // Create generation request
      const response = await axios.post(
        `${this.apiUrl}/generations`,
        {
          prompt,
          modelId: 'b24e16ff-06e3-43eb-8d33-4416c2d75876', // Leonardo Diffusion XL
          width: 1024,
          height: 1024,
          num_images: 1,
          promptMagic: true,
          public: false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const generationId = response.data.sdGenerationJob.generationId;

      // Poll for completion
      let imageUrl: string | null = null;
      let attempts = 0;
      const maxAttempts = 60; // 5 minute timeout

      while (!imageUrl && attempts < maxAttempts) {
        await this.delay(5000);

        const statusResponse = await axios.get(
          `${this.apiUrl}/generations/${generationId}`,
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
          }
        );

        const generation = statusResponse.data.generations_by_pk;

        if (generation.status === 'COMPLETE') {
          imageUrl = generation.generated_images[0]?.url;
        } else if (generation.status === 'FAILED') {
          throw new Error(`Generation failed: ${generation.error || 'Unknown error'}`);
        }

        attempts++;
      }

      if (!imageUrl) {
        throw new Error('Generation timeout after 5 minutes');
      }

      logger.info(`Generated: ${nft.name}`);

      // Download image
      const imageBuffer = await this.downloadImage(imageUrl);

      // Upload to Pinata IPFS
      const ipfsHash = await this.uploadToPinata(imageBuffer, `${nft.name.replace(/\s+/g, '_')}_${nft.tokenId}.png`);

      return ipfsHash;
    } catch (error) {
      logger.error(`Failed to generate ${nft.name}:`, error);
      throw error;
    }
  }

  /**
   * Generate metadata JSON and upload to IPFS
   */
  async generateMetadata(nft: NFTData, imageIpfsHash: string): Promise<string> {
    const metadata = {
      name: nft.name,
      description: nft.description,
      image: `ipfs://${imageIpfsHash}`,
      external_url: `https://cosmonfts.com/nft/${nft.tokenId}`,
      attributes: [
        { trait_type: 'Fame Score', value: nft.fameScore },
        { trait_type: 'Significance Score', value: nft.significanceScore },
        { trait_type: 'Rarity Score', value: nft.rarityScore },
        { trait_type: 'Discovery Recency Score', value: nft.discoveryRecencyScore },
        { trait_type: 'Cultural Impact Score', value: nft.culturalImpactScore },
        { trait_type: 'Total Score', value: nft.totalScore },
        { trait_type: 'Badge Tier', value: this.getBadgeTier(nft.totalScore) },
        { trait_type: 'Object Type', value: nft.objectType || 'Celestial Object' },
      ],
      properties: {
        category: 'celestial',
        creators: [{ address: process.env.OWNER_WALLET_ADDRESS, share: 100 }],
      },
    };

    const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
    const metadataHash = await this.uploadToPinata(
      metadataBuffer,
      `${nft.name.replace(/\s+/g, '_')}_${nft.tokenId}_metadata.json`
    );

    return metadataHash;
  }

  /**
   * Get badge tier from total score
   */
  private getBadgeTier(totalScore: number): string {
    if (totalScore >= 425) return 'ELITE';
    if (totalScore >= 400) return 'PREMIUM';
    if (totalScore >= 375) return 'EXCEPTIONAL';
    return 'STANDARD';
  }

  /**
   * Batch generate images with parallel requests
   */
  async generateBatch(nfts: NFTData[], parallelRequests = 5): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];
    const queue = [...nfts];
    let activeJobs = 0;
    const pending: Promise<void>[] = [];

    const processOne = async (nft: NFTData): Promise<void> => {
      activeJobs++;
      try {
        // Generate image
        const imageIpfsHash = await this.generateImage(nft);

        // Generate metadata
        const metadataIpfsHash = await this.generateMetadata(nft, imageIpfsHash);

        results.push({
          tokenId: nft.tokenId,
          imageIpfsHash,
          metadataIpfsHash,
        });

        logger.info(`[${results.length}/${nfts.length}] ${nft.name} -> ${imageIpfsHash}`);

        // Update database
        await prisma.nFT.update({
          where: { tokenId: nft.tokenId },
          data: {
            imageIpfsHash,
            metadataIpfsHash,
          },
        });
      } catch (error) {
        logger.error(`Failed to generate ${nft.name}:`, error);
      } finally {
        activeJobs--;
      }
    };

    while (queue.length > 0 || activeJobs > 0) {
      while (activeJobs < parallelRequests && queue.length > 0) {
        const nft = queue.shift()!;
        pending.push(processOne(nft));
      }
      await this.delay(1000);
    }

    await Promise.all(pending);
    return results;
  }

  /**
   * Generate Phase 1 images (1,000 NFTs)
   */
  async generatePhase1(): Promise<GenerationResult[]> {
    const phase1NFTs = await prisma.nFT.findMany({
      where: {
        currentTier: 1,
        imageIpfsHash: null,
      },
      orderBy: { tokenId: 'asc' },
    });

    if (phase1NFTs.length === 0) {
      logger.info('No Phase 1 NFTs need image generation');
      return [];
    }

    logger.info(`Starting Phase 1 image generation (${phase1NFTs.length} images)`);
    logger.info('Estimated time: 2-3 hours');

    const nftData: NFTData[] = phase1NFTs.map((nft) => ({
      tokenId: nft.tokenId,
      name: nft.name,
      description: nft.description,
      fameScore: nft.fameScore,
      significanceScore: nft.significanceScore,
      rarityScore: nft.rarityScore,
      discoveryRecencyScore: nft.discoveryRecencyScore,
      culturalImpactScore: nft.culturalImpactScore,
      totalScore: nft.totalScore,
      objectType: nft.objectType || undefined,
    }));

    const startTime = Date.now();
    const results = await this.generateBatch(nftData, 5);
    const duration = (Date.now() - startTime) / 1000 / 60;

    logger.info(`Phase 1 complete: ${results.length} images in ${duration.toFixed(1)} minutes`);

    return results;
  }

  /**
   * Generate images for specific phase
   */
  async generatePhase(phaseNumber: number): Promise<GenerationResult[]> {
    const phaseNFTs = await prisma.nFT.findMany({
      where: {
        currentTier: phaseNumber,
        imageIpfsHash: null,
      },
      orderBy: { tokenId: 'asc' },
    });

    if (phaseNFTs.length === 0) {
      logger.info(`No Phase ${phaseNumber} NFTs need image generation`);
      return [];
    }

    logger.info(`Starting Phase ${phaseNumber} image generation (${phaseNFTs.length} images)`);

    const nftData: NFTData[] = phaseNFTs.map((nft) => ({
      tokenId: nft.tokenId,
      name: nft.name,
      description: nft.description,
      fameScore: nft.fameScore,
      significanceScore: nft.significanceScore,
      rarityScore: nft.rarityScore,
      discoveryRecencyScore: nft.discoveryRecencyScore,
      culturalImpactScore: nft.culturalImpactScore,
      totalScore: nft.totalScore,
      objectType: nft.objectType || undefined,
    }));

    return this.generateBatch(nftData, 5);
  }

  /**
   * Download image from URL
   */
  private async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }

  /**
   * Upload to Pinata IPFS
   */
  private async uploadToPinata(buffer: Buffer, fileName: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', buffer, fileName);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          pinata_api_key: this.pinataApiKey,
          pinata_secret_api_key: this.pinataApiSecret,
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    return response.data.IpfsHash;
  }

  /**
   * Verify images exist on IPFS
   */
  async verifyImages(tokenIds: number[]): Promise<{ verified: number; failed: number[] }> {
    const nfts = await prisma.nFT.findMany({
      where: {
        tokenId: { in: tokenIds },
        imageIpfsHash: { not: null },
      },
      select: { tokenId: true, imageIpfsHash: true },
    });

    let verified = 0;
    const failed: number[] = [];

    for (const nft of nfts) {
      try {
        const url = `https://gateway.pinata.cloud/ipfs/${nft.imageIpfsHash}`;
        await axios.head(url, { timeout: 5000 });
        verified++;
      } catch {
        failed.push(nft.tokenId);
      }
    }

    return { verified, failed };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const leonardoService = new LeonardoImageService();
