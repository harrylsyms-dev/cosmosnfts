import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import crypto from 'crypto';
import { applyAuthSecurity, setCorsMethodsHeader, setCorsAllowedHeaders } from '../../../lib/authSecurity';

function generateNonce(): string {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply CORS and rate limiting security
  setCorsMethodsHeader(res, 'POST, OPTIONS');
  setCorsAllowedHeaders(res, 'Content-Type');

  if (!applyAuthSecurity(req, res)) {
    return; // Request was handled (rate limited or CORS rejected)
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const nonce = generateNonce();

    // Create or update user with new nonce
    await prisma.user.upsert({
      where: { walletAddress: normalizedAddress },
      update: { nonce },
      create: {
        walletAddress: normalizedAddress,
        nonce,
      },
    });

    // Create message for signing
    const message = `Welcome to CosmoNFT!\n\nSign this message to verify your wallet ownership.\n\nNonce: ${nonce}`;

    res.json({ message, nonce });
  } catch (error: any) {
    console.error('Nonce generation failed:', error);
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
}
