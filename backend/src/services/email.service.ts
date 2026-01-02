import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@cosmonfts.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@cosmonfts.com';

interface Purchase {
  id: string;
  totalAmountCents: number;
  nftIds: number[] | string; // Can be array or JSON string
  createdAt: Date;
}

interface NFT {
  id: number;
  name: string;
  cosmicScore: number;
  tokenId?: number | null;
  image?: string | null;
}

function getBadgeForScore(score: number): string {
  if (score >= 425) return 'ELITE';
  if (score >= 400) return 'PREMIUM';
  if (score >= 375) return 'EXCEPTIONAL';
  return 'STANDARD';
}

export async function sendPurchaseReceipt(email: string, purchase: Purchase) {
  // Parse nftIds if it's a string
  const nftIds = typeof purchase.nftIds === 'string'
    ? JSON.parse(purchase.nftIds) as number[]
    : purchase.nftIds;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 30px; border-radius: 10px; }
        .header { border-bottom: 2px solid #0066ff; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #ffffff; margin: 0; }
        .section { margin: 20px 0; padding: 15px; background: #16213e; border-radius: 8px; }
        .label { font-weight: bold; color: #a0a0a0; font-size: 12px; text-transform: uppercase; }
        .value { color: #ffffff; font-size: 18px; margin-top: 5px; }
        .price { color: #00ff88; font-size: 28px; font-weight: bold; }
        .processing { color: #ffaa00; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
        a { color: #0066ff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CosmoNFT Purchase Confirmed</h1>
        </div>

        <div class="section">
          <p class="label">Order ID</p>
          <p class="value">${purchase.id}</p>

          <p class="label">Date & Time</p>
          <p class="value">${new Date(purchase.createdAt).toLocaleString()}</p>

          <p class="label">Total Amount</p>
          <p class="price">$${(purchase.totalAmountCents / 100).toFixed(2)}</p>
        </div>

        <div class="section">
          <p class="label">Items Purchased</p>
          <p class="value">${nftIds.length} NFT${nftIds.length > 1 ? 's' : ''}</p>

          <p class="label">Status</p>
          <p class="value processing">Processing - Minting in progress</p>
        </div>

        <div class="section">
          <p>Your NFTs are being minted on the Polygon blockchain. This typically takes 1-2 minutes.</p>
          <p>You'll receive another email when minting is complete with your blockchain proof.</p>
        </div>

        <div class="section" style="background: #1e3a5f;">
          <p style="margin: 0;">30% of your purchase funds The Planetary Society's space exploration mission.</p>
        </div>

        <div class="footer">
          <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          <p>ALPHA AI LTD. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `CosmoNFT Purchase Confirmed - Order #${purchase.id}`, html);
}

export async function sendMintedEmail(
  email: string,
  purchase: Purchase,
  nfts: NFT[],
  transactionHash: string
) {
  const nftList = nfts
    .map(
      (nft) => `
      <div style="margin: 10px 0; padding: 15px; background: #0f3460; border-radius: 8px; border-left: 4px solid #00ff88;">
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #ffffff;">${nft.name}</p>
        <p style="margin: 5px 0; color: #a0a0a0;">Cosmic Score: ${nft.cosmicScore}/500 | ${getBadgeForScore(nft.cosmicScore)}</p>
        <p style="margin: 5px 0;">
          <a href="https://opensea.io/assets/polygon/${process.env.CONTRACT_ADDRESS}/${nft.tokenId}" style="color: #0066ff;">View on OpenSea</a>
        </p>
      </div>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 30px; border-radius: 10px; }
        .header { border-bottom: 2px solid #00ff88; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #00ff88; margin: 0; }
        .section { margin: 20px 0; padding: 15px; background: #16213e; border-radius: 8px; }
        .label { font-weight: bold; color: #a0a0a0; font-size: 12px; text-transform: uppercase; }
        .hash { background: #0f0f0f; padding: 10px; font-family: monospace; word-break: break-all; border-radius: 4px; font-size: 12px; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
        a { color: #0066ff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your NFTs are Ready!</h1>
        </div>

        <div class="section">
          <p>Your celestial objects have been minted and are now in your wallet!</p>
        </div>

        <div class="section">
          <p class="label">Your NFTs</p>
          ${nftList}
        </div>

        <div class="section">
          <p class="label">Blockchain Details</p>
          <p style="margin: 5px 0; color: #00ff88;">Minted on Polygon</p>

          <p class="label" style="margin-top: 15px;">Transaction Hash</p>
          <div class="hash">${transactionHash}</div>
          <p style="margin: 10px 0;">
            <a href="https://polygonscan.com/tx/${transactionHash}">View on PolygonScan</a>
          </p>

          <p class="label" style="margin-top: 15px;">Contract Address</p>
          <div class="hash">${process.env.CONTRACT_ADDRESS}</div>
        </div>

        <div class="section">
          <p class="label">What's Next?</p>
          <ol style="color: #a0a0a0;">
            <li>Connect your wallet to OpenSea to view your collection</li>
            <li>List your NFTs for secondary sales if desired</li>
            <li>Join our community on Discord and Twitter</li>
          </ol>
        </div>

        <div class="footer">
          <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          <p>ALPHA AI LTD. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `Your CosmoNFTs are Ready!`, html);
}

export async function sendFailureEmail(email: string, reason: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 30px; border-radius: 10px; }
        .header { border-bottom: 2px solid #ff4444; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #ff4444; margin: 0; }
        .section { margin: 20px 0; padding: 15px; background: #16213e; border-radius: 8px; }
        .error { color: #ff6666; background: #2a1a1a; padding: 15px; border-radius: 8px; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
        a { color: #0066ff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Failed</h1>
        </div>

        <div class="section">
          <p>Unfortunately, your payment could not be processed.</p>

          <div class="error">
            <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
          </div>
        </div>

        <div class="section">
          <p>Your items have been released back to inventory.</p>
          <p><strong>Note:</strong> Prices may have changed since you added items to cart.</p>
        </div>

        <div class="section">
          <p><strong>Having Issues?</strong></p>
          <ul style="color: #a0a0a0;">
            <li>Check card details are correct</li>
            <li>Ensure sufficient funds</li>
            <li>Try a different payment method</li>
            <li>Contact your bank if still failing</li>
          </ul>
        </div>

        <div class="footer">
          <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          <p>ALPHA AI LTD. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, 'Payment Failed - Please Try Again', html);
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SENDGRID_API_KEY) {
    logger.warn(`Email not sent (no API key): ${subject} to ${to}`);
    return;
  }

  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject,
      html,
    });
    logger.info(`Email sent: ${subject} to ${to}`);
  } catch (error) {
    logger.error(`Failed to send email: ${subject} to ${to}`, error);
    throw error;
  }
}

export async function sendOutbidNotification(
  email: string,
  nftName: string,
  newBidCents: number
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 30px; border-radius: 10px; }
        .header { border-bottom: 2px solid #ffaa00; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #ffaa00; margin: 0; }
        .section { margin: 20px 0; padding: 15px; background: #16213e; border-radius: 8px; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
        a { color: #0066ff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You've Been Outbid!</h1>
        </div>
        <div class="section">
          <p>Someone has placed a higher bid on <strong>${nftName}</strong>.</p>
          <p>New highest bid: <strong>$${(newBidCents / 100).toFixed(2)}</strong></p>
          <p>Visit the auction page to place a new bid!</p>
        </div>
        <div class="footer">
          <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `You've been outbid on ${nftName}!`, html);
}

export async function sendAuctionWonNotification(
  email: string,
  nftName: string,
  finalPriceCents: number,
  txHash: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 30px; border-radius: 10px; }
        .header { border-bottom: 2px solid #00ff88; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #00ff88; margin: 0; }
        .section { margin: 20px 0; padding: 15px; background: #16213e; border-radius: 8px; }
        .price { color: #00ff88; font-size: 24px; font-weight: bold; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
        a { color: #0066ff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Congratulations! You Won!</h1>
        </div>
        <div class="section">
          <p>You won the auction for <strong>${nftName}</strong>!</p>
          <p class="price">Final Price: $${(finalPriceCents / 100).toFixed(2)}</p>
        </div>
        <div class="section">
          <p>Transaction Hash: <code>${txHash}</code></p>
          <p><a href="https://polygonscan.com/tx/${txHash}">View on PolygonScan</a></p>
        </div>
        <div class="footer">
          <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `Congratulations! You won ${nftName}!`, html);
}

// Export as service object for compatibility
export const emailService = {
  sendPurchaseReceipt,
  sendMintedEmail,
  sendFailureEmail,
  sendOutbidNotification,
  sendAuctionWonNotification,
};
