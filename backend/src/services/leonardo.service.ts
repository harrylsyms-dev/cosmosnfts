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
  private apiUrl = 'https://cloud.leonardo.ai/api/rest/v1';
  private cachedLeonardoKey: string | null = null;
  private cachedPinataApiKey: string | null = null;
  private cachedPinataSecretKey: string | null = null;

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
   * Generate artistic prompt for Leonardo AI
   * Uses vibrant, stylized aesthetic that tested better for NFT appeal
   */
  private generatePrompt(nft: NFTData): string {
    const isPremium = nft.totalScore > 400;
    const isElite = nft.totalScore > 425;

    // Create poetic description from scientific one
    const poeticDescription = this.makePoetic(nft.description, nft.objectType);

    // Dynamic features based on object type
    const typeFeatures = this.getTypeFeatures(nft.objectType);

    return `
Stunning artistic interpretation of ${nft.name} as a cosmic masterpiece.

${poeticDescription}

Visual Style: Bold digital art, vibrant colors, stylized but detailed, cosmic art with ethereal glow
${typeFeatures}
- Nebulae in vivid purples, blues, golds, oranges, and reds
- Stars twinkling with magical light effects
- Surreal cosmic landscape
- Dreamlike, fantastical yet scientifically inspired
${isElite ? '- Ultra premium, museum-worthy composition with breathtaking detail' : ''}
${isPremium ? '- Premium quality with exceptional luminosity' : ''}

Composition: Eye-catching, dramatic, energetic
Quality: Professional digital art, vibrant, gallery-quality illustration
Medium: Digital painting, concept art, stylized 3D render
Color: Vibrant, saturated, cosmic palette with glow effects and deep space blacks
Lighting: Magical cosmic glow, ethereal light effects, volumetric rays

Fame: ${nft.fameScore} | Significance: ${nft.significanceScore} | Rarity: ${nft.rarityScore} | Age: ${nft.discoveryRecencyScore} | Cultural Impact: ${nft.culturalImpactScore}

--no text, watermarks, signatures, logos, words, letters
`.trim();
  }

  /**
   * Transform scientific description into poetic, evocative language
   */
  private makePoetic(description: string, objectType?: string): string {
    // Add poetic flourishes based on object type
    const poeticPrefixes: Record<string, string> = {
      'Star': 'A celestial beacon burning with ancient fire,',
      'Galaxy': 'A cosmic island of billions of stars swirling in eternal dance,',
      'Nebula': 'A stellar nursery painted across the void in luminous clouds,',
      'Black Hole': 'A mysterious void where light itself surrenders,',
      'Pulsar': 'A cosmic lighthouse spinning through the darkness,',
      'Quasar': 'A blazing heart of creation at the edge of the universe,',
      'Asteroid': 'A wandering remnant from the birth of our solar system,',
      'Comet': 'A celestial traveler trailing stardust across the heavens,',
      'Star Cluster': 'A glittering congregation of stellar siblings,',
      'Globular Cluster': 'An ancient spherical city of a million suns,',
      'White Dwarf': 'The glowing ember of a star that once blazed bright,',
      'Brown Dwarf': 'A cosmic wanderer caught between star and planet,',
      'Star System': 'A celestial family bound by invisible threads of gravity,',
    };

    const prefix = poeticPrefixes[objectType || ''] || 'A magnificent cosmic wonder,';

    // Transform the description to be more evocative
    let poetic = description
      .replace(/approximately/gi, 'roughly')
      .replace(/located/gi, 'dwelling')
      .replace(/discovered/gi, 'revealed to humanity')
      .replace(/contains/gi, 'harbors')
      .replace(/light-years/gi, 'light-years of cosmic distance')
      .replace(/visible/gi, 'visible to those who gaze skyward');

    return `${prefix} ${poetic}`;
  }

  /**
   * Get dynamic visual features based on object type
   */
  private getTypeFeatures(objectType?: string): string {
    const features: Record<string, string> = {
      'Star': '- Radiant corona with dancing solar flares\n- Glowing surface with swirling plasma storms\n- Brilliant light rays piercing the cosmic darkness',
      'Galaxy': '- Glowing spiral arms with dynamic swirling energy\n- Billions of tiny stars creating luminous patterns\n- Majestic rotation captured in cosmic time',
      'Nebula': '- Billowing clouds of cosmic gas in ethereal formations\n- Newborn stars emerging from glowing cocoons\n- Pillars of creation reaching toward infinity',
      'Black Hole': '- Mesmerizing accretion disk of superheated matter\n- Light bending around the event horizon\n- Jets of energy erupting into the void',
      'Pulsar': '- Spinning beams of light cutting through space\n- Intense magnetic field lines visualized\n- Rhythmic pulses of cosmic energy',
      'Quasar': '- Blindingly brilliant core outshining galaxies\n- Enormous jets of plasma spanning light-years\n- The most luminous objects in existence',
      'Asteroid': '- Rugged, cratered surface catching starlight\n- Tumbling through the asteroid belt\n- Ancient minerals glinting in the darkness',
      'Comet': '- Glorious tail streaming across the stars\n- Icy nucleus glowing with reflected sunlight\n- Dust and gas creating ethereal aurora',
      'Star Cluster': '- Dozens of brilliant stars in close embrace\n- Colorful stellar variety from blue to gold\n- Gravitational dance of cosmic siblings',
      'Globular Cluster': '- Dense sphere of ancient stars\n- Millions of suns in gravitational harmony\n- The oldest structures in the galaxy',
    };

    return features[objectType || ''] || '- Mysterious cosmic energy emanating from within\n- Ethereal glow against the infinite darkness\n- Captivating celestial presence';
  }

  /**
   * Generate single image using Leonardo AI
   */
  async generateImage(nft: NFTData): Promise<string> {
    try {
      logger.info(`Generating image for: ${nft.name} (Token #${nft.tokenId})`);

      const apiKey = await this.getLeonardoKey();
      if (!apiKey) {
        throw new Error('Leonardo AI API key not configured');
      }

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
