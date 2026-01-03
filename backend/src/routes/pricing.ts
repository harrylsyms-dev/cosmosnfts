import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/pricing - Returns current price, countdown, availability
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get site settings for phase increase percent
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });
    const phaseIncreasePercent = siteSettings?.phaseIncreasePercent || 7.5;

    // Get active tier from database (fallback when contract not deployed)
    const activeTier = await prisma.tier.findFirst({
      where: { active: true },
    });

    if (!activeTier) {
      // Default to phase 1 if no active tier
      const phase1 = await prisma.tier.findFirst({
        where: { phase: 1 },
      });

      if (!phase1) {
        return res.status(500).json({ error: 'No pricing tiers configured' });
      }

      // Activate phase 1
      await prisma.tier.update({
        where: { id: phase1.id },
        data: { active: true },
      });

      // Format price display (show more decimals for small prices)
      const displayPrice = phase1.price < 1
        ? phase1.price.toFixed(2)
        : phase1.price.toFixed(2);

      return res.json({
        currentPrice: (phase1.price * 1e18).toString(),
        displayPrice,
        timeUntilNextTier: phase1.duration,
        quantityAvailable: phase1.quantityAvailable - phase1.quantitySold,
        tierIndex: 0,
        phaseName: 'Phase 1',
        phaseIncreasePercent,
        tier: {
          price: (phase1.price * 1e18).toString(),
          quantityAvailable: phase1.quantityAvailable,
          quantitySold: phase1.quantitySold,
          startTime: Math.floor(phase1.startTime.getTime() / 1000),
          duration: phase1.duration,
          active: true,
        },
      });
    }

    // Calculate time until tier ends (accounting for pause duration)
    const tierEndTime = new Date(activeTier.startTime.getTime() + activeTier.duration * 1000);
    const adjustedEndTime = new Date(tierEndTime.getTime() + (siteSettings?.pauseDurationMs || 0));
    const timeUntilNextTier = Math.max(0, Math.floor((adjustedEndTime.getTime() - Date.now()) / 1000));

    // Format price display
    const displayPrice = activeTier.price < 1
      ? activeTier.price.toFixed(2)
      : activeTier.price.toFixed(2);

    res.json({
      currentPrice: (activeTier.price * 1e18).toString(),
      displayPrice,
      timeUntilNextTier,
      quantityAvailable: activeTier.quantityAvailable - activeTier.quantitySold,
      tierIndex: activeTier.phase - 1,
      phaseName: `Phase ${activeTier.phase}`,
      phaseIncreasePercent,
      isPaused: siteSettings?.phasePaused || false,
      pausedAt: siteSettings?.pausedAt || null,
      tier: {
        price: (activeTier.price * 1e18).toString(),
        quantityAvailable: activeTier.quantityAvailable,
        quantitySold: activeTier.quantitySold,
        startTime: Math.floor(activeTier.startTime.getTime() / 1000),
        duration: activeTier.duration,
        active: activeTier.active,
      },
    });
  } catch (error) {
    logger.error('Error fetching pricing:', error);
    res.status(500).json({ error: 'Failed to fetch pricing data' });
  }
});

// GET /api/pricing/all-tiers - Returns all 77 tiers
router.get('/all-tiers', async (req: Request, res: Response) => {
  try {
    const tiers = await prisma.tier.findMany({
      orderBy: { phase: 'asc' },
    });

    res.json({
      total: tiers.length,
      tiers: tiers.map((tier) => ({
        phase: tier.phase,
        price: tier.price,
        displayPrice: `$${tier.price.toFixed(2)}`,
        quantityAvailable: tier.quantityAvailable,
        quantitySold: tier.quantitySold,
        startTime: tier.startTime,
        duration: tier.duration,
        active: tier.active,
      })),
    });
  } catch (error) {
    logger.error('Error fetching all tiers:', error);
    res.status(500).json({ error: 'Failed to fetch tier data' });
  }
});

// GET /api/pricing/projection - Returns price projection for an NFT
router.get('/projection/:nftId', async (req: Request, res: Response) => {
  try {
    const { nftId } = req.params;

    const nft = await prisma.nFT.findUnique({
      where: { id: parseInt(nftId) },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Get current tier and site settings
    const [activeTier, siteSettings] = await Promise.all([
      prisma.tier.findFirst({ where: { active: true } }),
      prisma.siteSettings.findUnique({ where: { id: 'main' } }),
    ]);

    const currentPhase = activeTier?.phase || 1;
    const score = nft.cosmicScore;
    const increasePercent = siteSettings?.phaseIncreasePercent || 7.5;
    const multiplierBase = 1 + (increasePercent / 100);

    // Calculate prices for phases 1, 2, 5, 10, 20, 30, 50, 77
    // Formula: Price = Base ($0.10) × Score × Phase Multiplier
    const projections = [1, 2, 5, 10, 20, 30, 50, 77].map((phase) => {
      const multiplier = Math.pow(multiplierBase, phase - 1);
      const price = 0.10 * score * multiplier;
      return {
        phase,
        price: price.toFixed(2),
        multiplier: multiplier.toFixed(4),
        formula: `$0.10 × ${score} × ${multiplier.toFixed(4)}`,
      };
    });

    res.json({
      nftId: nft.id,
      name: nft.name,
      cosmicScore: score,
      currentPhase,
      currentPrice: nft.currentPrice,
      displayPrice: `$${nft.currentPrice.toFixed(2)}`,
      priceFormula: `$0.10 × ${score} (score) × phase multiplier`,
      projections,
    });
  } catch (error) {
    logger.error('Error fetching price projection:', error);
    res.status(500).json({ error: 'Failed to fetch price projection' });
  }
});

export default router;
