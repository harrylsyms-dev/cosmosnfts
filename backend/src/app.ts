import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import pricingRoutes from './routes/pricing';
import cartRoutes from './routes/cart';
import purchaseRoutes from './routes/purchase';
import nftRoutes from './routes/nft';
import healthRoutes from './routes/health';
import webhookRoutes from './routes/webhooks';
import auctionRoutes from './routes/auctions';
import imageRoutes from './routes/images';
import adminRoutes from './routes/admin';
import settingsRoutes from './routes/settings';
import authRoutes from './routes/auth';
import marketplaceRoutes from './routes/marketplace';
import analyticsRoutes from './routes/analytics';
import benefactorRoutes from './routes/benefactor';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiting';
import { startTierAdvancementJob } from './jobs/tierAdvance.job';
import { startCartExpiryJob } from './jobs/cartExpiry.job';
import { startAuctionDeploymentJob } from './jobs/auctionDeploy.job';
import { startBenefactorReminderJob } from './jobs/benefactorReminder.job';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Simple health check BEFORE any middleware (for Railway)
app.get('/health', (req, res) => {
  res.status(200).json({ alive: true });
});

// Middleware
app.use(helmet());

// CORS - allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://cosmonfts.com',
  'https://www.cosmonfts.com',
  'https://cosmosnfts.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
}));
app.use(cookieParser());

// Raw body for Stripe webhooks (must come before express.json())
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// JSON parsing for other routes
app.use(express.json());

// Rate limiting
app.use(rateLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/nfts', nftRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/benefactor', benefactorRoutes);

// Error handling
app.use(errorHandler);

// Start cron jobs
startTierAdvancementJob();
startCartExpiryJob();
startAuctionDeploymentJob();
startBenefactorReminderJob();

app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
