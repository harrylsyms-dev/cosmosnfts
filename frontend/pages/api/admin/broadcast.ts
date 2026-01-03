import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifyAdminToken } from '../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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

    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    // Get SendGrid API key from database - check various possible names
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        OR: [
          { service: { contains: 'sendgrid', mode: 'insensitive' } },
          { service: { contains: 'send_grid', mode: 'insensitive' } },
          { service: { contains: 'email', mode: 'insensitive' } },
        ],
      },
    });

    const sendgridKey = apiKeyRecord?.encryptedKey || process.env.SENDGRID_API_KEY;

    if (!sendgridKey) {
      return res.status(400).json({ error: 'SendGrid API key not configured. Please add it in Settings > API Keys.' });
    }

    // Get from email from settings or use default
    const fromEmail = process.env.FROM_EMAIL || 'noreply@cosmonfts.com';

    // Get all users with email addresses
    const usersWithEmail = await prisma.user.findMany({
      where: {
        email: { not: null },
      },
      select: {
        email: true,
        walletAddress: true,
      },
    });

    if (usersWithEmail.length === 0) {
      return res.status(400).json({ error: 'No users with email addresses found' });
    }

    // Send emails using SendGrid
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(sendgridKey);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // Send in batches to avoid rate limits
    const batchSize = 100;
    for (let i = 0; i < usersWithEmail.length; i += batchSize) {
      const batch = usersWithEmail.slice(i, i + batchSize);

      const messages = batch
        .filter((user: { email: string | null; walletAddress: string }): user is { email: string; walletAddress: string } => !!user.email)
        .map((user: { email: string; walletAddress: string }) => ({
          to: user.email,
          from: {
            email: fromEmail,
            name: 'CosmoNFTs',
          },
          subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
                <h1 style="color: #fff; margin: 0;">CosmoNFTs</h1>
              </div>
              <div style="padding: 30px; background: #f5f5f5;">
                ${message}
              </div>
              <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
                <p>You're receiving this because you're a registered user at CosmoNFTs.</p>
                <p>Wallet: ${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}</p>
              </div>
            </div>
          `,
        }));

      try {
        await sgMail.send(messages, true); // true enables batch sending
        successCount += messages.length;
      } catch (error: any) {
        failCount += messages.length;
        errors.push(error.message || 'Batch send failed');
        console.error('SendGrid batch error:', error);
      }
    }

    // Log the broadcast
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'EMAIL_BROADCAST',
          details: JSON.stringify({
            subject,
            recipientCount: usersWithEmail.length,
            successCount,
            failCount,
          }),
        },
      });
    } catch {
      // Audit log is optional
    }

    if (failCount > 0 && successCount === 0) {
      return res.status(500).json({
        error: 'Failed to send emails',
        details: errors[0],
      });
    }

    res.json({
      success: true,
      message: `Broadcast sent to ${successCount} users${failCount > 0 ? `, ${failCount} failed` : ''}`,
      successCount,
      failCount,
    });
  } catch (error: any) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Failed to send broadcast', details: error?.message });
  }
}
