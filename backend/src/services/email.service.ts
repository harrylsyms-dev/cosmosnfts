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
          <p style="margin: 0;">30% of your purchase supports space exploration initiatives.</p>
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
          <a href="${process.env.FRONTEND_URL}/nft/${nft.tokenId}" style="color: #0066ff;">View NFT</a>
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
            <li>View your NFTs in your wallet or on our marketplace</li>
            <li>List your NFTs for secondary sales on our marketplace</li>
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

// ==================== MARKETPLACE NOTIFICATIONS ====================

export async function sendOfferMadeNotification(
  email: string,
  nftName: string,
  tokenId: number,
  offerAmountCents: number,
  offererAddress: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 30px; border-radius: 10px; }
        .header { border-bottom: 2px solid #9b59b6; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #9b59b6; margin: 0; }
        .section { margin: 20px 0; padding: 15px; background: #16213e; border-radius: 8px; }
        .price { color: #00ff88; font-size: 24px; font-weight: bold; }
        .address { font-family: monospace; color: #a0a0a0; }
        .button { display: inline-block; background: #9b59b6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
        a { color: #0066ff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Offer Received!</h1>
        </div>
        <div class="section">
          <p>You received an offer on your NFT:</p>
          <p style="font-size: 20px; font-weight: bold; color: white;">${nftName}</p>
          <p class="price">Offer: $${(offerAmountCents / 100).toFixed(2)}</p>
          <p>From: <span class="address">${offererAddress.slice(0, 8)}...${offererAddress.slice(-6)}</span></p>
        </div>
        <div class="section">
          <p>You can accept, counter, or reject this offer from your account.</p>
          <a href="${process.env.FRONTEND_URL}/marketplace/my-offers" class="button">View Offers</a>
        </div>
        <div class="footer">
          <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          <p>ALPHA AI LTD. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `New Offer on ${nftName} - $${(offerAmountCents / 100).toFixed(2)}`, html);
}

export async function sendOfferAcceptedNotification(
  email: string,
  nftName: string,
  tokenId: number,
  priceCents: number,
  transactionHash: string
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
        .hash { background: #0f0f0f; padding: 10px; font-family: monospace; word-break: break-all; border-radius: 4px; font-size: 12px; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
        a { color: #0066ff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Offer Accepted!</h1>
        </div>
        <div class="section">
          <p>Your offer on <strong>${nftName}</strong> has been accepted!</p>
          <p class="price">$${(priceCents / 100).toFixed(2)}</p>
          <p>The NFT is now in your wallet.</p>
        </div>
        <div class="section">
          <p style="color: #a0a0a0;">Transaction Hash:</p>
          <div class="hash">${transactionHash}</div>
          <p><a href="https://polygonscan.com/tx/${transactionHash}">View on PolygonScan</a></p>
        </div>
        <div class="footer">
          <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          <p>ALPHA AI LTD. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `Offer Accepted - ${nftName} is Now Yours!`, html);
}

export async function sendOfferCounteredNotification(
  email: string,
  nftName: string,
  tokenId: number,
  originalOfferCents: number,
  counterOfferCents: number
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 30px; border-radius: 10px; }
        .header { border-bottom: 2px solid #f1c40f; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #f1c40f; margin: 0; }
        .section { margin: 20px 0; padding: 15px; background: #16213e; border-radius: 8px; }
        .price { font-size: 20px; font-weight: bold; }
        .old-price { color: #666; text-decoration: line-through; }
        .new-price { color: #f1c40f; }
        .button { display: inline-block; background: #f1c40f; color: black; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
        a { color: #0066ff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Counter Offer Received</h1>
        </div>
        <div class="section">
          <p>The seller has countered your offer on <strong>${nftName}</strong>:</p>
          <p class="price old-price">Your offer: $${(originalOfferCents / 100).toFixed(2)}</p>
          <p class="price new-price">Counter offer: $${(counterOfferCents / 100).toFixed(2)}</p>
        </div>
        <div class="section">
          <p>You can accept the counter offer or make a new offer.</p>
          <a href="${process.env.FRONTEND_URL}/marketplace/${tokenId}" class="button">View Listing</a>
        </div>
        <div class="footer">
          <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          <p>ALPHA AI LTD. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `Counter Offer on ${nftName}`, html);
}

export async function sendOfferRejectedNotification(
  email: string,
  nftName: string,
  tokenId: number,
  offerAmountCents: number
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 30px; border-radius: 10px; }
        .header { border-bottom: 2px solid #e74c3c; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #e74c3c; margin: 0; }
        .section { margin: 20px 0; padding: 15px; background: #16213e; border-radius: 8px; }
        .button { display: inline-block; background: #0066ff; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
        a { color: #0066ff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Offer Declined</h1>
        </div>
        <div class="section">
          <p>Your offer of <strong>$${(offerAmountCents / 100).toFixed(2)}</strong> on <strong>${nftName}</strong> was declined.</p>
          <p>You can make a new offer or browse other listings.</p>
        </div>
        <div class="section">
          <a href="${process.env.FRONTEND_URL}/marketplace" class="button">Browse Marketplace</a>
        </div>
        <div class="footer">
          <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          <p>ALPHA AI LTD. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `Offer Declined - ${nftName}`, html);
}

export async function sendListingSoldNotification(
  email: string,
  nftName: string,
  tokenId: number,
  salePriceCents: number,
  royaltyCents: number,
  proceedsCents: number,
  transactionHash: string
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
        .breakdown { margin: 15px 0; }
        .breakdown-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2a2a4e; }
        .hash { background: #0f0f0f; padding: 10px; font-family: monospace; word-break: break-all; border-radius: 4px; font-size: 12px; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
        a { color: #0066ff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your NFT Sold!</h1>
        </div>
        <div class="section">
          <p><strong>${nftName}</strong> has been sold!</p>
          <p class="price">$${(salePriceCents / 100).toFixed(2)}</p>
        </div>
        <div class="section">
          <p style="color: #a0a0a0;">Payment Breakdown:</p>
          <div class="breakdown">
            <div class="breakdown-item">
              <span>Sale Price</span>
              <span>$${(salePriceCents / 100).toFixed(2)}</span>
            </div>
            <div class="breakdown-item">
              <span>Creator Royalty (20%)</span>
              <span style="color: #e74c3c;">-$${(royaltyCents / 100).toFixed(2)}</span>
            </div>
            <div class="breakdown-item" style="border-bottom: none; font-weight: bold;">
              <span>Your Proceeds</span>
              <span style="color: #00ff88;">$${(proceedsCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div class="section">
          <p style="color: #a0a0a0;">Transaction Hash:</p>
          <div class="hash">${transactionHash}</div>
          <p><a href="https://polygonscan.com/tx/${transactionHash}">View on PolygonScan</a></p>
        </div>
        <div class="footer">
          <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          <p>ALPHA AI LTD. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `Your NFT Sold - ${nftName}`, html);
}

export async function sendPriceAlertNotification(
  email: string,
  nftName: string,
  tokenId: number,
  currentPriceCents: number,
  targetPriceCents: number,
  alertType: 'BELOW' | 'ABOVE'
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 30px; border-radius: 10px; }
        .header { border-bottom: 2px solid #3498db; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #3498db; margin: 0; }
        .section { margin: 20px 0; padding: 15px; background: #16213e; border-radius: 8px; }
        .price { color: #00ff88; font-size: 24px; font-weight: bold; }
        .button { display: inline-block; background: #3498db; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
        a { color: #0066ff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Price Alert!</h1>
        </div>
        <div class="section">
          <p><strong>${nftName}</strong> has reached your target price!</p>
          <p>Current Price: <span class="price">$${(currentPriceCents / 100).toFixed(2)}</span></p>
          <p style="color: #a0a0a0;">Your alert: ${alertType === 'BELOW' ? 'Below' : 'Above'} $${(targetPriceCents / 100).toFixed(2)}</p>
        </div>
        <div class="section">
          <a href="${process.env.FRONTEND_URL}/marketplace/${tokenId}" class="button">View Listing</a>
        </div>
        <div class="footer">
          <p>Questions? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          <p>ALPHA AI LTD. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `Price Alert - ${nftName}`, html);
}

// Benefactor Payment Reminder
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export async function sendBenefactorPaymentReminder(data: {
  to: string;
  month: number;
  year: number;
  totalOwedCents: number;
  primarySalesCents: number;
  auctionSalesCents: number;
  daysOverdue: number;
  reminderType: string;
}) {
  const { to, month, year, totalOwedCents, primarySalesCents, auctionSalesCents, daysOverdue, reminderType } = data;

  const monthName = MONTH_NAMES[month - 1];
  const isOverdue = daysOverdue > 0;

  let subject = `Benefactor Payment Due - ${monthName} ${year}`;
  let headerColor = '#f1c40f'; // Yellow for due today
  let headerText = 'Payment Due Today';

  if (isOverdue) {
    subject = `OVERDUE: Benefactor Payment - ${monthName} ${year} (${daysOverdue} days)`;
    headerColor = '#e74c3c'; // Red for overdue
    headerText = `Payment Overdue by ${daysOverdue} Days`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 30px; border-radius: 10px; }
        .header { border-bottom: 2px solid ${headerColor}; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: ${headerColor}; margin: 0; }
        .section { margin: 20px 0; padding: 15px; background: #16213e; border-radius: 8px; }
        .total { color: ${isOverdue ? '#e74c3c' : '#f1c40f'}; font-size: 36px; font-weight: bold; text-align: center; }
        .breakdown-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2a2a4e; }
        .breakdown-item:last-child { border-bottom: none; }
        .label { color: #a0a0a0; }
        .value { color: #ffffff; font-weight: bold; }
        .alert { background: ${isOverdue ? '#5c1a1a' : '#5c4a1a'}; border: 1px solid ${headerColor}; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .button { display: inline-block; background: #0066ff; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${headerText}</h1>
          <p style="color: #a0a0a0; margin: 10px 0 0 0;">${monthName} ${year} Benefactor Payment</p>
        </div>

        <div class="alert">
          <p style="margin: 0; color: ${headerColor}; font-weight: bold;">
            ${isOverdue
              ? `This payment is ${daysOverdue} days overdue. Please process immediately.`
              : 'Payment is due today. Please process before end of day.'}
          </p>
        </div>

        <div class="section">
          <p class="total">$${(totalOwedCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p style="text-align: center; color: #a0a0a0;">Total Amount Owed (30%)</p>
        </div>

        <div class="section">
          <h3 style="margin-top: 0; color: #ffffff;">Breakdown</h3>
          <div class="breakdown-item">
            <span class="label">Primary Sales (Stripe)</span>
            <span class="value">$${(primarySalesCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="breakdown-item">
            <span class="label">Auction Sales (USD)</span>
            <span class="value">$${(auctionSalesCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="breakdown-item" style="border-top: 2px solid #3a3a5e; padding-top: 15px; margin-top: 10px;">
            <span class="label">Total Owed</span>
            <span class="value" style="color: ${headerColor};">$${(totalOwedCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div class="section" style="background: #1e3a5f;">
          <p style="margin: 0; font-size: 14px;">
            <strong>Note:</strong> Crypto auction sales and creator royalties are NOT included above -
            they are automatically paid to the benefactor wallet via smart contract.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/admin/benefactor" class="button">Mark as Paid</a>
        </div>

        <div class="footer">
          <p>This is an automated reminder from CosmoNFT.</p>
          <p>ALPHA AI LTD. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(to, subject, html);
}

// Export as service object for compatibility
export const emailService = {
  sendPurchaseReceipt,
  sendMintedEmail,
  sendFailureEmail,
  sendOutbidNotification,
  sendAuctionWonNotification,
  sendOfferMadeNotification,
  sendOfferAcceptedNotification,
  sendOfferCounteredNotification,
  sendOfferRejectedNotification,
  sendListingSoldNotification,
  sendPriceAlertNotification,
  sendBenefactorPaymentReminder,
};
