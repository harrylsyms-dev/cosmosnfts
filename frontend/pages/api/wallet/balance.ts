import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

/**
 * API: Get wallet POL balance
 *
 * Fetches the native token (POL/MATIC) balance for a wallet address on Polygon.
 * Uses the configured RPC endpoint or falls back to public RPC.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Get RPC URL from database or use default
    let rpcUrl = 'https://polygon-rpc.com';

    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { service: 'polygon_rpc' },
        select: { encryptedKey: true },
      });

      if (apiKey?.encryptedKey) {
        // For simplicity, we're using the key directly (it may be encrypted or plain)
        // In production, you'd decrypt if ENCRYPTION_KEY is set
        const key = apiKey.encryptedKey;
        // If it looks like a URL, use it directly
        if (key.startsWith('http')) {
          rpcUrl = key;
        }
      }
    } catch (error) {
      // Use default RPC if database access fails
      console.error('Failed to fetch RPC URL from database:', error);
    }

    // Fetch balance using eth_getBalance RPC call
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'RPC error');
    }

    // Convert hex balance to decimal and format as POL
    const balanceWei = BigInt(data.result);
    const balanceEth = Number(balanceWei) / 1e18;

    // Format to 6 decimal places
    const formattedBalance = balanceEth.toFixed(6);

    res.json({
      address,
      balance: formattedBalance,
      balanceWei: balanceWei.toString(),
      symbol: 'POL',
    });
  } catch (error: any) {
    console.error('Failed to fetch wallet balance:', error);
    res.status(500).json({
      error: 'Failed to fetch wallet balance',
      details: error?.message,
    });
  }
}
