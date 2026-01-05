import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifyAdminToken } from '../../../lib/adminAuth';
import formidable from 'formidable';
import fs from 'fs';

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Decrypt encrypted API key
function decryptApiKey(encryptedData: string): string {
  const crypto = require('crypto');
  const algorithm = 'aes-256-gcm';
  const encryptionKey = process.env.API_KEY_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'default-key-for-dev';
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);

  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Get Pinata API keys from database
async function getPinataKeys(): Promise<{ apiKey: string; secretKey: string } | null> {
  try {
    const apiKeyRecord = await prisma.apiKey.findUnique({ where: { service: 'pinata_api' } });
    const secretKeyRecord = await prisma.apiKey.findUnique({ where: { service: 'pinata_secret' } });

    if (!apiKeyRecord || !secretKeyRecord) return null;

    return {
      apiKey: decryptApiKey(apiKeyRecord.encryptedKey),
      secretKey: decryptApiKey(secretKeyRecord.encryptedKey),
    };
  } catch (error) {
    console.error('Failed to get Pinata keys:', error);
    return null;
  }
}

// Upload image to Pinata IPFS
async function uploadToPinata(
  filePath: string,
  fileName: string,
  apiKey: string,
  secretKey: string
): Promise<{ url: string; ipfsHash: string }> {
  const FormData = require('form-data');
  const formData = new FormData();

  formData.append('file', fs.createReadStream(filePath), fileName);
  formData.append('pinataMetadata', JSON.stringify({
    name: `baseline-${fileName}`,
  }));

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': apiKey,
      'pinata_secret_api_key': secretKey,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinata upload failed: ${error}`);
  }

  const data = await response.json();
  return {
    ipfsHash: data.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // GET - List all baseline images
    if (req.method === 'GET') {
      const baselines = await prisma.baselineImage.findMany({
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return res.json({
        success: true,
        baselines,
        count: baselines.length,
      });
    }

    // POST - Upload new baseline image
    if (req.method === 'POST') {
      const pinataKeys = await getPinataKeys();
      if (!pinataKeys) {
        return res.status(503).json({
          error: 'Pinata not configured',
          message: 'Please add Pinata API keys in Settings > API Keys',
        });
      }

      // Parse multipart form
      const form = formidable({
        maxFileSize: 10 * 1024 * 1024, // 10MB max
        allowEmptyFiles: false,
      });

      const [fields, files] = await form.parse(req);

      const file = files.image?.[0];
      if (!file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const name = fields.name?.[0] || file.originalFilename || 'Untitled';
      const description = fields.description?.[0] || null;
      const objectType = fields.objectType?.[0] || null;
      const category = fields.category?.[0] || 'style';
      const priority = parseInt(fields.priority?.[0] || '0', 10);

      // Upload to Pinata
      console.log(`Uploading baseline image: ${name}`);
      const { url, ipfsHash } = await uploadToPinata(
        file.filepath,
        file.originalFilename || 'baseline.jpg',
        pinataKeys.apiKey,
        pinataKeys.secretKey
      );

      // Clean up temp file
      fs.unlinkSync(file.filepath);

      // Save to database
      const baseline = await prisma.baselineImage.create({
        data: {
          name,
          description,
          url,
          ipfsHash,
          objectType,
          category,
          priority,
        },
      });

      console.log(`Baseline image uploaded: ${baseline.id}`);

      return res.json({
        success: true,
        message: 'Baseline image uploaded successfully',
        baseline,
      });
    }

    // DELETE - Remove baseline image
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Baseline image ID required' });
      }

      const baseline = await prisma.baselineImage.findUnique({
        where: { id },
      });

      if (!baseline) {
        return res.status(404).json({ error: 'Baseline image not found' });
      }

      await prisma.baselineImage.delete({
        where: { id },
      });

      console.log(`Baseline image deleted: ${id}`);

      return res.json({
        success: true,
        message: 'Baseline image deleted',
        deletedId: id,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Baseline image error:', error);
    return res.status(500).json({
      error: 'Operation failed',
      message: error?.message || 'Unknown error',
    });
  }
}
