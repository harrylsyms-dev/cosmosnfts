import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminToken } from '../../../lib/adminAuth';
import * as fs from 'fs';
import * as path from 'path';

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
    // Verify admin token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Read the report file
    const reportPath = path.join(process.cwd(), 'SYSTEM_REPORT.txt');

    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ error: 'System report not found' });
    }

    const content = fs.readFileSync(reportPath, 'utf-8');

    res.json({
      success: true,
      content,
      generatedAt: fs.statSync(reportPath).mtime.toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to fetch system report:', error);
    res.status(500).json({ error: 'Failed to fetch report', details: error?.message });
  }
}
