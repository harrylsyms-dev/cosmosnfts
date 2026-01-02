import express from 'express';
import { leonardoService } from '../services/leonardo.service';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * POST /api/images/generate-phase1
 * Generate images for Phase 1 NFTs
 */
router.post('/generate-phase1', async (req, res) => {
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
router.post('/generate-phase/:phaseNumber', async (req, res) => {
  try {
    const phaseNumber = parseInt(req.params.phaseNumber);

    if (isNaN(phaseNumber) || phaseNumber < 1 || phaseNumber > 81) {
      return res.status(400).json({ error: 'Invalid phase number (1-81)' });
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
router.post('/verify', async (req, res) => {
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
