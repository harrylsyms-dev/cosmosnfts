import express from 'express';
import { leonardoService } from '../services/leonardo.service';
import { requireAdmin } from '../middleware/adminAuth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/images/status
 * Check if image generation is properly configured
 */
router.get('/status', requireAdmin, async (req, res) => {
  const leonardoKey = process.env.LEONARDO_AI_API_KEY;
  const pinataKey = process.env.PINATA_API_KEY;
  const pinataSecret = process.env.PINATA_API_SECRET;

  res.json({
    success: true,
    configured: {
      leonardo: !!leonardoKey && leonardoKey.length > 10,
      pinata: !!pinataKey && !!pinataSecret,
    },
    message: !leonardoKey ? 'LEONARDO_AI_API_KEY not configured' :
             !pinataKey ? 'PINATA_API_KEY not configured' :
             !pinataSecret ? 'PINATA_API_SECRET not configured' :
             'All API keys configured',
  });
});

/**
 * POST /api/images/generate-phase1
 * Generate images for Phase 1 NFTs
 */
router.post('/generate-phase1', requireAdmin, async (req, res) => {
  try {
    // Start generation in background
    const generationPromise = leonardoService.generatePhase1();

    generationPromise.then((results) => {
      logger.info(`Phase 1 generation complete: ${results.length} images`);
    }).catch((error) => {
      logger.error('Phase 1 generation failed:', error);
    });

    res.json({
      success: true,
      message: 'Phase 1 image generation started',
      estimatedTime: '2-3 hours',
    });
  } catch (error) {
    logger.error('Failed to start Phase 1 generation:', error);
    res.status(500).json({ error: 'Failed to start generation' });
  }
});

/**
 * POST /api/images/generate-phase/:phaseNumber
 * Generate images for a specific phase
 */
router.post('/generate-phase/:phaseNumber', requireAdmin, async (req, res) => {
  try {
    const phaseNumber = parseInt(req.params.phaseNumber);

    if (isNaN(phaseNumber) || phaseNumber < 1 || phaseNumber > 77) {
      return res.status(400).json({ error: 'Invalid phase number (1-77)' });
    }

    // Start generation in background
    const generationPromise = leonardoService.generatePhase(phaseNumber);

    generationPromise.then((results) => {
      logger.info(`Phase ${phaseNumber} generation complete: ${results.length} images`);
    }).catch((error) => {
      logger.error(`Phase ${phaseNumber} generation failed:`, error);
    });

    res.json({
      success: true,
      message: `Phase ${phaseNumber} image generation started`,
    });
  } catch (error) {
    logger.error('Failed to start generation:', error);
    res.status(500).json({ error: 'Failed to start generation' });
  }
});

/**
 * POST /api/images/verify
 * Verify images exist on IPFS
 */
router.post('/verify', requireAdmin, async (req, res) => {
  try {
    const { tokenIds } = req.body;

    if (!Array.isArray(tokenIds)) {
      return res.status(400).json({ error: 'tokenIds must be an array' });
    }

    const result = await leonardoService.verifyImages(tokenIds);

    res.json({
      success: true,
      verified: result.verified,
      failed: result.failed,
      failedCount: result.failed.length,
    });
  } catch (error) {
    logger.error('Failed to verify images:', error);
    res.status(500).json({ error: 'Failed to verify images' });
  }
});

export default router;
