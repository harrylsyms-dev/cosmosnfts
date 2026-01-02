# CosmoNFTs Deployment Guide

## Architecture
- **Frontend**: Vercel (Next.js) - www.cosmonfts.com
- **Backend**: Railway (Express.js + Prisma)
- **Database**: Railway PostgreSQL

---

## 1. Backend Deployment (Railway)

### Create Railway Project
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `harrylsyms-dev/cosmosnfts`
4. Set **Root Directory** to `backend`

### Add PostgreSQL Database
1. In Railway project, click "+ New" → "Database" → "PostgreSQL"
2. Railway auto-creates `DATABASE_URL` environment variable

### Required Environment Variables

```
# Database (auto-set by Railway when you add PostgreSQL)
DATABASE_URL=postgresql://...

# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://www.cosmonfts.com

# Stripe (from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Admin (set your own secure values)
ADMIN_JWT_SECRET=your-secure-random-string-32-chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Blockchain (Polygon Mainnet)
POLYGON_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your-wallet-private-key
CONTRACT_ADDRESS=0x... (after deployment)

# SendGrid (for emails)
SENDGRID_API_KEY=SG...
FROM_EMAIL=noreply@cosmonfts.com

# Leonardo AI (for image generation)
LEONARDO_API_KEY=...
```

### Deploy
Railway auto-deploys on push. Check logs for any errors.

---

## 2. Frontend Deployment (Vercel)

### Already deployed at www.cosmonfts.com

### Environment Variables (Vercel Dashboard → Settings → Environment Variables)

```
# Backend API
BACKEND_URL=https://your-railway-app.up.railway.app

# Site Password (for early access lock)
SITE_PASSWORD=your-password

# Stripe (publishable key)
NEXT_PUBLIC_STRIPE_KEY=pk_live_...

# Contract (after blockchain deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=137
```

---

## 3. Domain Setup

### Backend (Railway)
1. Railway Dashboard → your project → Settings → Domains
2. Add custom domain: `api.cosmonfts.com`
3. Add CNAME record in Namecheap:
   - Type: CNAME
   - Host: api
   - Value: (Railway provides this)

### Frontend (Vercel)
Already configured:
- cosmonfts.com → A record → 76.76.21.21
- www.cosmonfts.com → CNAME → cname.vercel-dns.com

---

## 4. Post-Deployment Steps

1. **Create Admin User**:
   ```bash
   # In Railway shell or locally with production DATABASE_URL
   npm run create-admin
   ```

2. **Seed Database** (optional test data):
   ```bash
   npm run seed
   ```

3. **Set up Stripe Webhook**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://api.cosmonfts.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy webhook secret to Railway env vars

4. **Deploy Smart Contract** (when ready):
   ```bash
   npm run deploy:polygon
   ```
   Then update `CONTRACT_ADDRESS` in both Railway and Vercel.

---

## Quick Reference

| Service | URL |
|---------|-----|
| Frontend | https://www.cosmonfts.com |
| Backend API | https://api.cosmonfts.com |
| Admin Panel | https://www.cosmonfts.com/admin |
| Railway Dashboard | https://railway.app |
| Vercel Dashboard | https://vercel.com |
