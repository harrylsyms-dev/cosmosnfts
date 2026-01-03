import express from 'express';
import { userAuthService } from '../services/userAuth.service';
import { authRateLimiter } from '../middleware/rateLimiting';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * POST /api/auth/nonce
 * Get a nonce for wallet to sign (rate limited)
 */
router.post('/nonce', authRateLimiter, async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    const { nonce, isNewUser } = await userAuthService.getNonce(walletAddress);

    // Return the message that needs to be signed
    const message = `Sign this message to authenticate with CosmoNFT.\n\nNonce: ${nonce}`;

    res.json({
      success: true,
      message,
      nonce,
      isNewUser,
    });
  } catch (error) {
    logger.error('Error generating nonce:', error);
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
});

/**
 * POST /api/auth/verify
 * Verify the signed message and authenticate (rate limited)
 */
router.post('/verify', authRateLimiter, async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;

    if (!walletAddress || !signature) {
      return res.status(400).json({ error: 'Wallet address and signature are required' });
    }

    const result = await userAuthService.verifySignature(walletAddress, signature);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    // Set cookie for browser clients
    res.cookie('userToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    logger.error('Error verifying signature:', error);
    res.status(500).json({ error: 'Failed to verify signature' });
  }
});

/**
 * GET /api/auth/me
 * Get current user from token
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.userToken;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await userAuthService.getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    logger.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * POST /api/auth/logout
 * Logout and invalidate session
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.userToken;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

    if (token) {
      await userAuthService.logout(token);
    }

    res.clearCookie('userToken');
    res.json({ success: true });
  } catch (error) {
    logger.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

/**
 * PUT /api/auth/email
 * Update user email
 */
router.put('/email', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.userToken;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await userAuthService.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const success = await userAuthService.updateEmail(user.id, email);
    if (!success) {
      return res.status(500).json({ error: 'Failed to update email' });
    }

    res.json({ success: true, email });
  } catch (error) {
    logger.error('Error updating email:', error);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

/**
 * GET /api/auth/orders
 * Get user's orders
 */
router.get('/orders', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.userToken;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await userAuthService.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const orders = await userAuthService.getUserOrders(user.walletAddress);

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    logger.error('Error getting orders:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

/**
 * GET /api/auth/nfts
 * Get user's owned NFTs
 */
router.get('/nfts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.userToken;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await userAuthService.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const nfts = await userAuthService.getUserNfts(user.walletAddress);

    res.json({
      success: true,
      nfts,
    });
  } catch (error) {
    logger.error('Error getting NFTs:', error);
    res.status(500).json({ error: 'Failed to get NFTs' });
  }
});

export default router;
