import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import crypto from 'crypto';
import { ethers } from 'ethers';

function generateToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, signature } = req.body;

    console.log('Verify attempt:', { walletAddress: walletAddress?.slice(0, 10), hasSignature: !!signature });

    if (!walletAddress || !signature) {
      return res.status(400).json({ error: 'Wallet address and signature required' });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Get user and their nonce
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      console.log('User not found for address:', normalizedAddress.slice(0, 10));
      return res.status(401).json({ error: 'User not found. Please get a nonce first.' });
    }

    console.log('User found, verifying signature...');

    // Reconstruct the message that was signed
    const message = `Welcome to CosmoNFT!\n\nSign this message to verify your wallet ownership.\n\nNonce: ${user.nonce}`;

    // Verify signature
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== normalizedAddress) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } catch {
      return res.status(401).json({ error: 'Invalid signature format' });
    }

    // Generate new nonce for security (prevents replay attacks)
    const newNonce = crypto.randomBytes(32).toString('hex');

    // Create session token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update user and create session
    await prisma.user.update({
      where: { walletAddress: normalizedAddress },
      data: {
        nonce: newNonce,
        lastLoginAt: new Date(),
      },
    });

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    console.log('Auth successful for:', normalizedAddress.slice(0, 10));

    res.json({
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Verification failed:', error?.message || error);
    res.status(500).json({ error: 'Authentication failed', details: error?.message });
  }
}
