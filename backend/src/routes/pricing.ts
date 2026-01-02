import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/pricing - Returns current price, countdown, availability
router.get('/', async (req: Request, res: Response) => {
  try {
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

      return res.json({
        currentPrice: (phase1.price * 1e18).toString(),
        displayPrice: phase1.price.toFixed(2),
        timeUntilNextTier: phase1.duration,
        quantityAvailable: phase1.quantityAvailable - phase1.quantitySold,
        tierIndex: 0,
        phaseName: 'Phase 1',
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

    // Calculate time until tier ends
    const tierEndTime = new Date(activeTier.startTime.getTime() + activeTier.duration * 1000);
    const timeUntilNextTier = Math.max(0, Math.floor((tierEndTime.getTime() - Date.now()) / 1000));

    res.json({
      currentPrice: (activeTier.price * 1e18).toString(),
      displayPrice: activeTier.price.toFixed(2),
      timeUntilNextTier,
      quantityAvailable: activeTier.quantityAvailable - activeTier.quantitySold,
      tierIndex: activeTier.phase - 1,
      phaseName: `Phase ${activeTier.phase}`,
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

// GET /api/pricing/all-tiers - Returns all 81 tiers
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

    const basePrice = nft.cosmicScore; // Score = base price in dollars

    // Calculate prices for phases 1, 2, 5, 10, 20, 30
    const projections = [1, 2, 5, 10, 20, 30].map((phase) => {
      const multiplier = Math.pow(1.075, phase - 1);
      const price = basePrice * multiplier;
      return {
        phase,
        price: price.toFixed(2),
        multiplier: multiplier.toFixed(4),
      };
    });

    res.json({
      nftId: nft.id,
      name: nft.name,
      basePrice,
      projections,
    });
  } catch (error) {
    logger.error('Error fetching price projection:', error);
    res.status(500).json({ error: 'Failed to fetch price projection' });
  }
});

export default router;
