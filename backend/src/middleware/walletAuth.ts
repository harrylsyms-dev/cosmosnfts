import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { userAuthService } from '../services/userAuth.service';
import { logger } from '../utils/logger';

// Extend Express Request to include wallet user
declare global {
  namespace Express {
    interface Request {
      walletUser?: {
        id: string;
        walletAddress: string;
        email: string | null;
      };
      verifiedWallet?: string;
    }
  }
}

/**
 * Middleware to require wallet authentication via session token
 * Uses the existing session-based auth from userAuthService
 */
export async function requireWalletAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from header or cookie
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.userToken;

    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return res.status(401).json({
        error: 'Wallet authentication required',
        code: 'NO_TOKEN',
      });
    }

    // Validate session
    const user = await userAuthService.getUserFromToken(token);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired session. Please reconnect your wallet.',
        code: 'INVALID_SESSION',
      });
    }

    // Attach user to request
    req.walletUser = user;
    req.verifiedWallet = user.walletAddress;
    next();
  } catch (error) {
    logger.error('Wallet auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Middleware to verify wallet signature for sensitive operations
 * Requires x-wallet-signature header with a signed message
 * The message format is: "ACTION:timestamp:data"
 */
export async function requireWalletSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const signature = req.headers['x-wallet-signature'] as string;
    const signedMessage = req.headers['x-signed-message'] as string;
    const walletAddress = req.body.sellerAddress || req.body.buyerAddress || req.body.offererAddress;

    if (!signature || !signedMessage) {
      return res.status(401).json({
        error: 'Wallet signature required',
        code: 'NO_SIGNATURE',
        message: 'Please sign the transaction with your wallet',
      });
    }

    if (!walletAddress) {
      return res.status(400).json({
        error: 'Wallet address required in request body',
        code: 'NO_WALLET_ADDRESS',
      });
    }

    // Verify the signature
    try {
      const recoveredAddress = ethers.verifyMessage(signedMessage, signature);

      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({
          error: 'Signature does not match wallet address',
          code: 'SIGNATURE_MISMATCH',
        });
      }

      // Verify the message is recent (within 5 minutes)
      const messageParts = signedMessage.split(':');
      if (messageParts.length >= 2) {
        const timestamp = parseInt(messageParts[1], 10);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (isNaN(timestamp) || now - timestamp > fiveMinutes) {
          return res.status(401).json({
            error: 'Signature has expired. Please sign again.',
            code: 'SIGNATURE_EXPIRED',
          });
        }
      }

      // Attach verified wallet to request
      req.verifiedWallet = recoveredAddress.toLowerCase();
      next();
    } catch (error) {
      logger.warn('Invalid signature provided:', { walletAddress });
      return res.status(401).json({
        error: 'Invalid signature',
        code: 'INVALID_SIGNATURE',
      });
    }
  } catch (error) {
    logger.error('Wallet signature middleware error:', error);
    res.status(500).json({ error: 'Signature verification error' });
  }
}

/**
 * Middleware to verify the caller owns the wallet they claim to act on behalf of.
 * Can use either session-based auth OR per-request signature.
 * Session auth is preferred for better UX, signature is fallback.
 */
export async function verifyWalletOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const walletAddress = req.body.sellerAddress || req.body.buyerAddress || req.body.offererAddress;

    if (!walletAddress) {
      return res.status(400).json({
        error: 'Wallet address required in request body',
        code: 'NO_WALLET_ADDRESS',
      });
    }

    // First, try session-based authentication
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.userToken;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

    if (token) {
      const user = await userAuthService.getUserFromToken(token);
      if (user && user.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        req.walletUser = user;
        req.verifiedWallet = user.walletAddress;
        return next();
      }
    }

    // Fall back to signature-based verification
    const signature = req.headers['x-wallet-signature'] as string;
    const signedMessage = req.headers['x-signed-message'] as string;

    if (!signature || !signedMessage) {
      return res.status(401).json({
        error: 'Authentication required. Please connect your wallet and sign in.',
        code: 'AUTH_REQUIRED',
      });
    }

    try {
      const recoveredAddress = ethers.verifyMessage(signedMessage, signature);

      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({
          error: 'You can only perform this action with your own wallet',
          code: 'WALLET_MISMATCH',
        });
      }

      // Verify timestamp
      const messageParts = signedMessage.split(':');
      if (messageParts.length >= 2) {
        const timestamp = parseInt(messageParts[1], 10);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (isNaN(timestamp) || now - timestamp > fiveMinutes) {
          return res.status(401).json({
            error: 'Signature has expired. Please sign again.',
            code: 'SIGNATURE_EXPIRED',
          });
        }
      }

      req.verifiedWallet = recoveredAddress.toLowerCase();
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid signature',
        code: 'INVALID_SIGNATURE',
      });
    }
  } catch (error) {
    logger.error('Wallet ownership verification error:', error);
    res.status(500).json({ error: 'Verification error' });
  }
}
