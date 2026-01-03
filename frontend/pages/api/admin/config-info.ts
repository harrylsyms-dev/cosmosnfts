import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifyAdminToken } from '../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check which API keys are configured
    const apiKeys = await prisma.apiKey.findMany({
      select: {
        service: true,
        encryptedKey: true,
        updatedAt: true,
      },
    });

    // Only count as configured if there's actually a key value
    const configuredServices = new Set(
      apiKeys
        .filter((k: { service: string; encryptedKey: string | null }) => k.encryptedKey && k.encryptedKey.length > 0)
        .map((k: { service: string }) => k.service.toLowerCase())
    );

    // Check for Stripe key (could be in env or stored)
    const stripeConfigured = configuredServices.has('stripe') ||
                             configuredServices.has('stripe_secret') ||
                             !!process.env.STRIPE_SECRET_KEY;

    // Determine Stripe mode
    let stripeMode = 'test';
    if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live')) {
      stripeMode = 'live';
    }

    // Check SendGrid
    const sendgridConfigured = configuredServices.has('sendgrid') ||
                               configuredServices.has('sendgrid_api_key') ||
                               !!process.env.SENDGRID_API_KEY;

    // Check Pinata/IPFS
    const pinataConfigured = configuredServices.has('pinata') ||
                             configuredServices.has('pinata_api_key') ||
                             (!!process.env.PINATA_API_KEY && !!process.env.PINATA_SECRET_KEY);

    // Check Leonardo AI
    const leonardoConfigured = configuredServices.has('leonardo') ||
                               configuredServices.has('leonardo_ai') ||
                               !!process.env.LEONARDO_AI_API_KEY;

    // Get contract address from settings
    let contractAddress = process.env.CONTRACT_ADDRESS || null;
    try {
      const settings = await prisma.siteSettings.findUnique({
        where: { id: 'main' },
        select: { contractAddress: true },
      });
      if (settings?.contractAddress) {
        contractAddress = settings.contractAddress;
      }
    } catch {
      // Settings might not exist
    }

    res.json({
      config: {
        email: {
          provider: 'SendGrid',
          configured: sendgridConfigured,
        },
        stripe: {
          configured: stripeConfigured,
          mode: stripeMode,
        },
        ipfs: {
          provider: 'Pinata',
          configured: pinataConfigured,
        },
        imageGeneration: {
          provider: 'Leonardo AI',
          configured: leonardoConfigured,
        },
        blockchain: {
          network: process.env.NEXT_PUBLIC_CHAIN_ID === '137' ? 'Polygon Mainnet' : 'Polygon Amoy',
          contractAddress,
        },
      },
      apiKeysConfigured: Array.from(configuredServices),
    });
  } catch (error: any) {
    console.error('Failed to fetch config info:', error);
    res.status(500).json({ error: 'Failed to fetch config info' });
  }
}
