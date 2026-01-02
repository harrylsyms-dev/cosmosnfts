import { prisma } from '../config/database';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';

interface AuthResult {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    walletAddress: string;
    email: string | null;
  };
  error?: string;
}

class UserAuthService {
  /**
   * Generate a random nonce for wallet signature
   */
  generateNonce(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get or create a user by wallet address
   * Returns the nonce for signing
   */
  async getNonce(walletAddress: string): Promise<{ nonce: string; isNewUser: boolean }> {
    const normalizedAddress = walletAddress.toLowerCase();

    let user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (user) {
      // Generate new nonce for this login attempt
      const nonce = this.generateNonce();
      await prisma.user.update({
        where: { id: user.id },
        data: { nonce },
      });
      return { nonce, isNewUser: false };
    }

    // Create new user with nonce
    const nonce = this.generateNonce();
    await prisma.user.create({
      data: {
        walletAddress: normalizedAddress,
        nonce,
      },
    });

    return { nonce, isNewUser: true };
  }

  /**
   * Verify the signed message and authenticate user
   */
  async verifySignature(
    walletAddress: string,
    signature: string
  ): Promise<AuthResult> {
    const normalizedAddress = walletAddress.toLowerCase();

    try {
      const user = await prisma.user.findUnique({
        where: { walletAddress: normalizedAddress },
      });

      if (!user) {
        return { success: false, error: 'User not found. Please request a nonce first.' };
      }

      // Construct the message that was signed
      const message = `Sign this message to authenticate with CosmoNFT.\n\nNonce: ${user.nonce}`;

      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== normalizedAddress) {
        return { success: false, error: 'Invalid signature' };
      }

      // Generate session token
      const token = crypto.randomBytes(64).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create session and update user
      await prisma.$transaction([
        prisma.userSession.create({
          data: {
            userId: user.id,
            token,
            expiresAt,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            nonce: this.generateNonce(), // Rotate nonce after successful auth
            lastLoginAt: new Date(),
          },
        }),
      ]);

      logger.info(`User authenticated: ${normalizedAddress}`);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          email: user.email,
        },
      };
    } catch (error) {
      logger.error('Signature verification failed:', error);
      return { success: false, error: 'Signature verification failed' };
    }
  }

  /**
   * Get user from session token
   */
  async getUserFromToken(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) return null;

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await prisma.userSession.delete({ where: { id: session.id } });
      return null;
    }

    return {
      id: session.user.id,
      walletAddress: session.user.walletAddress,
      email: session.user.email,
    };
  }

  /**
   * Logout - invalidate session
   */
  async logout(token: string): Promise<boolean> {
    try {
      await prisma.userSession.delete({ where: { token } });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update user email
   */
  async updateEmail(userId: string, email: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { email },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get user's orders by wallet address
   */
  async getUserOrders(walletAddress: string) {
    const normalizedAddress = walletAddress.toLowerCase();

    const purchases = await prisma.purchase.findMany({
      where: {
        OR: [
          { walletAddress: normalizedAddress },
          { walletAddress: walletAddress }, // Also check non-normalized
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get NFT details for each purchase
    const ordersWithNfts = await Promise.all(
      purchases.map(async (purchase) => {
        const nftIds = JSON.parse(purchase.nftIds || '[]');
        const nfts = await prisma.nFT.findMany({
          where: { id: { in: nftIds } },
          select: {
            id: true,
            tokenId: true,
            name: true,
            image: true,
            currentPrice: true,
            status: true,
            transactionHash: true,
          },
        });

        return {
          id: purchase.id,
          totalAmount: purchase.totalAmountCents / 100,
          status: purchase.status,
          createdAt: purchase.createdAt,
          mintedAt: purchase.mintedAt,
          transactionHash: purchase.transactionHash,
          nfts,
        };
      })
    );

    return ordersWithNfts;
  }

  /**
   * Get user's NFTs (owned)
   */
  async getUserNfts(walletAddress: string) {
    const normalizedAddress = walletAddress.toLowerCase();

    const nfts = await prisma.nFT.findMany({
      where: {
        ownerAddress: {
          in: [normalizedAddress, walletAddress],
        },
        status: 'MINTED',
      },
      select: {
        id: true,
        tokenId: true,
        name: true,
        description: true,
        image: true,
        imageIpfsHash: true,
        currentPrice: true,
        totalScore: true,
        cosmicScore: true,
        badgeTier: true,
        transactionHash: true,
        mintedAt: true,
      },
      orderBy: { mintedAt: 'desc' },
    });

    return nfts;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.userSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }
}

export const userAuthService = new UserAuthService();
