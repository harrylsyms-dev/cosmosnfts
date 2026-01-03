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
  badgeTier?: string;
}

interface ImagePromptConfig {
  basePromptTemplate: string | null;
  artStyle: string;
  colorPalette: string;
  lightingStyle: string;
  compositionStyle: string;
  qualityDescriptors: string;
  mediumDescriptors: string;
  realismLevel: number;
  usePhotorealistic: boolean;
  useScientificAccuracy: boolean;
  avoidArtisticStylization: boolean;
  leonardoModelId: string;
  imageWidth: number;
  imageHeight: number;
  promptMagic: boolean;
  guidanceScale: number;
  negativePrompt: string;
  objectTypeConfigs: string;
  premiumThreshold: number;
  eliteThreshold: number;
  legendaryThreshold: number;
  premiumModifier: string;
  eliteModifier: string;
  legendaryModifier: string;
  includeScoreInPrompt: boolean;
  useDescriptionTransform: boolean;
}

// Default object type configurations
const defaultObjectTypeConfigs: Record<string, { description: string; visualFeatures: string }> = {
  'Star': { description: 'A stellar body producing light and heat', visualFeatures: 'Radiant corona, solar flares, glowing plasma surface' },
  'Galaxy': { description: 'A massive collection of stars, gas, and dust', visualFeatures: 'Spiral arms, central bulge, billions of stars' },
  'Nebula': { description: 'An interstellar cloud of gas and dust', visualFeatures: 'Colorful gas clouds, dust pillars, stellar nurseries' },
  'Black Hole': { description: 'A region where gravity is so intense nothing escapes', visualFeatures: 'Accretion disk, event horizon, gravitational lensing' },
  'Planet': { description: 'A celestial body orbiting a star', visualFeatures: 'Atmospheric bands, surface features, possible rings' },
  'Moon': { description: 'A natural satellite orbiting a planet', visualFeatures: 'Crater impacts, surface texture, reflected light' },
  'Exoplanet': { description: 'A planet orbiting a star outside our solar system', visualFeatures: 'Alien atmospheres, exotic surface, parent star glow' },
  'Pulsar': { description: 'A rotating neutron star emitting radiation', visualFeatures: 'Rotating beams of light, magnetic field lines' },
  'Quasar': { description: 'An extremely luminous active galactic nucleus', visualFeatures: 'Brilliant central point, powerful jets, host galaxy' },
  'Supernova': { description: 'A powerful stellar explosion', visualFeatures: 'Expanding shock wave, debris cloud, colorful remnants' },
  'Asteroid': { description: 'A rocky body orbiting the Sun', visualFeatures: 'Irregular shape, cratered surface, rocky texture' },
  'Comet': { description: 'An icy body releasing gas near the Sun', visualFeatures: 'Bright coma, dust tail, ion tail, nucleus' },
  'Star Cluster': { description: 'A group of stars gravitationally bound', visualFeatures: 'Dense stellar concentration, varied star colors' },
  'Dwarf Planet': { description: 'A planetary-mass object not dominant in orbit', visualFeatures: 'Small spherical body, unique surface features' },
  'Magnetar': { description: 'A neutron star with powerful magnetic field', visualFeatures: 'Intense magnetic field lines, X-ray emissions' },
};

interface GenerationResult {
  tokenId: number;
  imageIpfsHash: string;
  metadataIpfsHash: string;
}

class LeonardoImageService {
  private apiUrl = 'https://cloud.leonardo.ai/api/rest/v1';
  private cachedLeonardoKey: string | null = null;
  private cachedPinataApiKey: string | null = null;
  private cachedPinataSecretKey: string | null = null;
  private cachedPromptConfig: ImagePromptConfig | null = null;

  /**
   * Get Leonardo API key from database or env var
   */
  private async getLeonardoKey(): Promise<string> {
    if (this.cachedLeonardoKey) return this.cachedLeonardoKey;
    const { getApiKey } = await import('../utils/apiKeys');
    this.cachedLeonardoKey = await getApiKey('leonardo') || '';
    return this.cachedLeonardoKey;
  }

  /**
   * Get Pinata API keys from database or env vars
   */
  private async getPinataKeys(): Promise<{ apiKey: string; secretKey: string }> {
    if (this.cachedPinataApiKey && this.cachedPinataSecretKey) {
      return { apiKey: this.cachedPinataApiKey, secretKey: this.cachedPinataSecretKey };
    }
    const { getApiKey } = await import('../utils/apiKeys');
    this.cachedPinataApiKey = await getApiKey('pinata_api') || '';
    this.cachedPinataSecretKey = await getApiKey('pinata_secret') || '';
    return { apiKey: this.cachedPinataApiKey, secretKey: this.cachedPinataSecretKey };
  }

  /**
   * Get Image Prompt Configuration from database
   */
  private async getPromptConfig(): Promise<ImagePromptConfig> {
    if (this.cachedPromptConfig) return this.cachedPromptConfig;

    try {
      const config = await prisma.imagePromptConfig.findUnique({
        where: { id: 'main' }
      });

      if (config) {
        this.cachedPromptConfig = config as ImagePromptConfig;
        return this.cachedPromptConfig;
      }
    } catch (error) {
      logger.warn('Failed to fetch ImagePromptConfig, using defaults:', error);
    }

    // Return default config
    return {
      basePromptTemplate: null,
      artStyle: 'photorealistic astrophotography',
      colorPalette: 'Natural space colors, deep blacks, subtle nebula hues',
      lightingStyle: 'Natural starlight, subtle glow effects',
      compositionStyle: 'Scientific, documentary-style',
      qualityDescriptors: '8K, ultra high definition, NASA-quality',
      mediumDescriptors: 'Telescope photography, Hubble-style imagery',
      realismLevel: 80,
      usePhotorealistic: true,
      useScientificAccuracy: true,
      avoidArtisticStylization: true,
      leonardoModelId: 'b24e16ff-06e3-43eb-8d33-4416c2d75876',
      imageWidth: 1024,
      imageHeight: 1024,
      promptMagic: false,
      guidanceScale: 7,
      negativePrompt: 'cartoon, anime, illustration, painting, artistic, stylized, fantasy, magical, glowing effects, text, watermarks',
      objectTypeConfigs: '{}',
      premiumThreshold: 400,
      eliteThreshold: 425,
      legendaryThreshold: 450,
      premiumModifier: 'Exceptional detail and clarity',
      eliteModifier: 'Museum-quality, breathtaking composition',
      legendaryModifier: 'Once-in-a-lifetime capture, iconic imagery',
      includeScoreInPrompt: false,
      useDescriptionTransform: false,
    };
  }

  /**
   * Clear cached config (call when config is updated)
   */
  public clearConfigCache(): void {
    this.cachedPromptConfig = null;
  }

  /**
   * Check if service is properly configured
   */
  async isConfigured(): Promise<{ leonardo: boolean; pinata: boolean }> {
    const leonardoKey = await this.getLeonardoKey();
    const pinata = await this.getPinataKeys();
    return {
      leonardo: !!leonardoKey,
      pinata: !!(pinata.apiKey && pinata.secretKey),
    };
  }

  /**
   * Generate prompt using Advanced Prompt Editor configuration
   * Uses the NFT's actual description - no transformation
   */
  private async generatePrompt(nft: NFTData): Promise<string> {
    const config = await this.getPromptConfig();

    // Parse object type configs from database
    let objectTypeConfigs: Record<string, { description: string; visualFeatures: string; customPrompt?: string }> = defaultObjectTypeConfigs;
    try {
      const parsed = JSON.parse(config.objectTypeConfigs);
      if (Object.keys(parsed).length > 0) {
        objectTypeConfigs = { ...defaultObjectTypeConfigs, ...parsed };
      }
    } catch {
      // Use defaults
    }

    // Get object type specific config
    const typeConfig = objectTypeConfigs[nft.objectType || ''] || { description: '', visualFeatures: '' };

    // Check for custom prompt override for this type
    if (typeConfig.customPrompt && typeConfig.customPrompt.trim()) {
      return typeConfig.customPrompt
        .replace(/\{name\}/g, nft.name || 'Unknown')
        .replace(/\{description\}/g, nft.description || typeConfig.description)
        .replace(/\{objectType\}/g, nft.objectType || 'Cosmic Object')
        .replace(/\{features\}/g, typeConfig.visualFeatures || '')
        .replace(/\{score\}/g, String(nft.totalScore || 0))
        .replace(/\{badge\}/g, nft.badgeTier || 'STANDARD');
    }

    // Use the NFT's ACTUAL description (not transformed)
    const description = nft.description || typeConfig.description || `A ${nft.objectType || 'cosmic object'}`;
    const features = typeConfig.visualFeatures || '';
    const totalScore = nft.totalScore || 0;

    // Determine score modifier based on thresholds
    let scoreModifier = '';
    if (totalScore >= config.legendaryThreshold) {
      scoreModifier = config.legendaryModifier;
    } else if (totalScore >= config.eliteThreshold) {
      scoreModifier = config.eliteModifier;
    } else if (totalScore >= config.premiumThreshold) {
      scoreModifier = config.premiumModifier;
    }

    // Build realism prefix if enabled
    let realismPrefix = '';
    if (config.usePhotorealistic) {
      realismPrefix = 'Photorealistic, ';
    }
    if (config.useScientificAccuracy) {
      realismPrefix += 'scientifically accurate, ';
    }

    // If base template is configured in Advanced Prompt Editor, use it
    if (config.basePromptTemplate && config.basePromptTemplate.trim()) {
      return config.basePromptTemplate
        .replace(/\{name\}/g, nft.name || 'Unknown')
        .replace(/\{description\}/g, description)
        .replace(/\{objectType\}/g, nft.objectType || 'Cosmic Object')
        .replace(/\{features\}/g, features)
        .replace(/\{score\}/g, String(totalScore))
        .replace(/\{badge\}/g, nft.badgeTier || 'STANDARD')
        .replace(/\{artStyle\}/g, config.artStyle)
        .replace(/\{colorPalette\}/g, config.colorPalette)
        .replace(/\{lightingStyle\}/g, config.lightingStyle)
        .replace(/\{compositionStyle\}/g, config.compositionStyle)
        .replace(/\{qualityDescriptors\}/g, config.qualityDescriptors)
        .replace(/\{mediumDescriptors\}/g, config.mediumDescriptors)
        .replace(/\{scoreModifier\}/g, scoreModifier)
        .replace(/\{negativePrompt\}/g, config.negativePrompt);
    }

    // Default template using configured styles from Advanced Prompt Editor
    return `${realismPrefix}${config.artStyle} of ${nft.name}, a ${nft.objectType || 'cosmic object'}.

${description}

Visual characteristics: ${features}

Style: ${config.artStyle}
Colors: ${config.colorPalette}
Lighting: ${config.lightingStyle}
Composition: ${config.compositionStyle}
Quality: ${config.qualityDescriptors}
Medium: ${config.mediumDescriptors}

${scoreModifier ? `Quality tier: ${scoreModifier}` : ''}
${config.includeScoreInPrompt ? `Cosmic Score: ${totalScore}/500` : ''}

--no ${config.negativePrompt}`.trim();
  }

  /**
   * Generate single image using Leonardo AI
   * Uses parameters from Advanced Prompt Editor configuration
   */
  async generateImage(nft: NFTData): Promise<string> {
    try {
      logger.info(`Generating image for: ${nft.name} (Token #${nft.tokenId})`);

      const apiKey = await this.getLeonardoKey();
      if (!apiKey) {
        throw new Error('Leonardo AI API key not configured');
      }

      // Get config for Leonardo AI parameters
      const config = await this.getPromptConfig();
      const prompt = await this.generatePrompt(nft);

      logger.info(`Using prompt config - Model: ${config.leonardoModelId}, Size: ${config.imageWidth}x${config.imageHeight}, PromptMagic: ${config.promptMagic}`);

      // Create generation request with configured parameters
      const response = await axios.post(
        `${this.apiUrl}/generations`,
        {
          prompt,
          modelId: config.leonardoModelId,
          width: config.imageWidth,
          height: config.imageHeight,
          num_images: 1,
          promptMagic: config.promptMagic,
          public: false,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
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
              Authorization: `Bearer ${apiKey}`,
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
    const pinata = await this.getPinataKeys();
    if (!pinata.apiKey || !pinata.secretKey) {
      throw new Error('Pinata IPFS credentials not configured');
    }

    const formData = new FormData();
    formData.append('file', buffer, fileName);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          pinata_api_key: pinata.apiKey,
          pinata_secret_api_key: pinata.secretKey,
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
