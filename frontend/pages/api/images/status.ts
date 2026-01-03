import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if API keys are configured (from environment OR database)
    let leonardoConfigured = !!process.env.LEONARDO_API_KEY;
    let pinataConfigured = !!(process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET);

    // Also check database for stored API keys
    try {
      const storedKeys = await prisma.apiKey.findMany({
        where: {
          service: { in: ['leonardo', 'pinata_api', 'pinata_secret'] }
        },
        select: { service: true, encryptedKey: true }
      });

      const keyMap = new Map(storedKeys.map((k: { service: string; encryptedKey: string | null }) => [k.service, !!k.encryptedKey]));

      if (keyMap.get('leonardo')) {
        leonardoConfigured = true;
      }
      if (keyMap.get('pinata_api') && keyMap.get('pinata_secret')) {
        pinataConfigured = true;
      }
    } catch (e) {
      // Ignore if ApiKey table doesn't exist
    }

    // Get global prompt from site settings
    let globalPrompt = '';
    try {
      const settings = await prisma.siteSettings.findUnique({
        where: { id: 'main' },
        select: { leonardoPrompt: true },
      });
      globalPrompt = settings?.leonardoPrompt || '';
    } catch (e) {
      console.error('Failed to fetch site settings:', e);
    }

    res.json({
      configured: {
        leonardo: leonardoConfigured,
        pinata: pinataConfigured,
      },
      message: leonardoConfigured && pinataConfigured
        ? 'All services configured'
        : 'Missing API configuration',
      globalPrompt,
    });
  } catch (error: any) {
    console.error('Failed to get image status:', error);
    res.status(500).json({ error: 'Failed to get status', details: error?.message });
  }
}
