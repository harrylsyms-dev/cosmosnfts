# CosmoNFT Deployment Checklist

## Pre-Launch Wednesday Checklist

### 1. Smart Contract Deployment

- [ ] Fund deployer wallet with MATIC (recommended: 10 MATIC)
- [ ] Set TPS wallet address in environment
- [ ] Deploy to Polygon mainnet:
  ```bash
  cd backend
  npx hardhat run scripts/deploy.ts --network polygon
  ```
- [ ] Verify contract on PolygonScan:
  ```bash
  npx hardhat verify --network polygon <CONTRACT_ADDRESS> <TPS_ADDRESS>
  ```
- [ ] Update CONTRACT_ADDRESS in .env files

### 2. Database Setup

- [ ] Set up PostgreSQL production database
- [ ] Update DATABASE_URL in backend/.env
- [ ] Run migrations:
  ```bash
  cd backend
  npx prisma migrate deploy
  ```
- [ ] Seed production database:
  ```bash
  npx ts-node scripts/seed.ts
  ```

### 3. Stripe Configuration

- [ ] Switch from test to live Stripe keys
- [ ] Configure Stripe webhook endpoint: `https://api.cosmonfts.com/api/webhooks/stripe`
- [ ] Update STRIPE_SECRET_KEY
- [ ] Update STRIPE_WEBHOOK_SECRET
- [ ] Test payment flow with live keys (small amount)

### 4. SendGrid Email

- [ ] Verify sending domain in SendGrid
- [ ] Set up sender authentication
- [ ] Update SENDGRID_API_KEY
- [ ] Test email delivery

### 5. Frontend Deployment

- [ ] Build frontend: `npm run build`
- [ ] Deploy to Vercel/Netlify
- [ ] Configure environment variables
- [ ] Set up custom domain (cosmonfts.com)
- [ ] Enable HTTPS

### 6. Backend Deployment

- [ ] Deploy to Railway/Render/AWS
- [ ] Configure environment variables
- [ ] Set up custom domain (api.cosmonfts.com)
- [ ] Enable HTTPS
- [ ] Configure CORS for frontend domain

### 7. DNS & Domain

- [ ] Point cosmonfts.com to frontend
- [ ] Point api.cosmonfts.com to backend
- [ ] Enable SSL certificates
- [ ] Test all endpoints

### 8. Final Verification

- [ ] Visit homepage - pricing loads correctly
- [ ] Browse NFT gallery - all 1000 NFTs visible
- [ ] Add item to cart - cart works
- [ ] Connect MetaMask - wallet connects
- [ ] Complete test purchase (small amount)
- [ ] Verify NFT minting on PolygonScan
- [ ] Check email delivery
- [ ] Verify OpenSea listing

---

## Launch Day (Wednesday)

### Morning (Pre-Launch)

1. **09:00** - Final system check
2. **09:30** - Enable production tier timing
3. **10:00** - Social media announcements ready
4. **10:30** - Discord/community notifications ready

### Launch

5. **11:00** - GO LIVE
   - Announce on Twitter
   - Post in Discord
   - Send email to waitlist
   - Monitor error logs

### Post-Launch

6. **11:15** - First purchase verification
7. **12:00** - Monitor metrics
8. **Every hour** - Check:
   - Error logs
   - Payment success rate
   - Minting success rate
   - Email delivery

---

## Emergency Contacts

- Stripe Support: https://support.stripe.com
- Polygon Support: https://polygon.technology/support
- SendGrid Support: https://support.sendgrid.com

---

## Rollback Plan

If critical issues occur:

1. **Payment Issues**: Switch to maintenance mode, investigate Stripe dashboard
2. **Minting Issues**: Pause purchases, investigate blockchain logs
3. **Database Issues**: Restore from backup, check connection pool

---

## Post-Launch (First Week)

- [ ] Daily revenue report
- [ ] Monitor chargebacks
- [ ] Track Phase 1 sales progress
- [ ] Prepare Phase 2 marketing
- [ ] TPS donation tracking
- [ ] Community engagement

---

## Phase Transition

Phase 1 ends after 4 weeks. Before Phase 2:

- [ ] Verify tier advancement job running
- [ ] Announce price increase
- [ ] Update marketing materials
- [ ] Check NFT availability

---

*Last updated: January 2026*
*Launch Date: Wednesday, January 7, 2026*
