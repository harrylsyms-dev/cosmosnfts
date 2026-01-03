import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';
import crypto from 'crypto';

// Simple encryption using AES-256-GCM
function encryptApiKey(apiKey: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  // If no encryption key, store as-is (not recommended for production)
  if (!encryptionKey) {
    return apiKey;
  }

  // Create a 32-byte key from the environment variable
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return IV + authTag + encrypted data
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

// Decrypt API key
function decryptApiKey(encryptedData: string): string | null {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  // If no encryption key was used, return as-is
  if (!encryptionKey || !encryptedData.includes(':')) {
    return encryptedData;
  }

  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return encryptedData;

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

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

    // Only super admins can manage API keys
    if (admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { service } = req.query;
    const serviceId = service as string;

    // Validate service name
    const validServices = ['stripe', 'stripe_webhook', 'pinata_api', 'pinata_secret', 'leonardo', 'polygon_rpc', 'sendgrid'];
    if (!validServices.includes(serviceId)) {
      return res.status(400).json({ error: 'Invalid service name' });
    }

    if (req.method === 'PUT') {
      // Update or create API key
      const { apiKey, description } = req.body || {};

      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({ error: 'API key is required' });
      }

      // Encrypt the API key
      const encryptedKey = encryptApiKey(apiKey);

      // Upsert the API key
      await prisma.apiKey.upsert({
        where: { service: serviceId },
        update: {
          encryptedKey,
          description: description || null,
          lastRotated: new Date(),
          updatedAt: new Date(),
          createdBy: admin.id,
        },
        create: {
          service: serviceId,
          encryptedKey,
          description: description || null,
          lastRotated: new Date(),
          createdBy: admin.id,
        },
      });

      res.json({ success: true, message: `API key for ${serviceId} updated successfully` });
    } else if (req.method === 'DELETE') {
      // Delete API key
      const existing = await prisma.apiKey.findUnique({
        where: { service: serviceId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'API key not found' });
      }

      await prisma.apiKey.delete({
        where: { service: serviceId },
      });

      res.json({ success: true, message: `API key for ${serviceId} deleted successfully` });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API key operation failed:', error);
    res.status(500).json({ error: 'Operation failed', details: error?.message });
  }
}
