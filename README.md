# CosmoNFT

**NFT Marketplace for Celestial Objects**

CosmoNFT is a full-stack NFT marketplace that lets users purchase scientifically-scored celestial objects as NFTs. Built on Polygon for low gas fees, with credit card payments via Stripe.

## Features

- **20,000 Celestial NFTs** - Stars, planets, galaxies, nebulae, and more
- **Cosmic Scoring System** - 5 categories, max 500 points
- **Dynamic Pricing** - 7.5% weekly price increases across 81 phases
- **Premium Auctions** - 7-day English auctions for high-profile objects (Sun, Earth, Moon, etc.)
- **Credit Card Payments** - Stripe with 3D Secure protection
- **MetaMask Integration** - NFTs minted directly to user wallets on Polygon
- **AI-Generated Art** - Leonardo.AI creates unique celestial artwork
- **30% to Space Exploration** - Partnership with The Planetary Society

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Polygon PoS (ERC-721) |
| Smart Contract | Solidity + Hardhat |
| Backend | Node.js + Express + PostgreSQL |
| Frontend | Next.js + React + Tailwind CSS |
| Payments | Stripe (3D Secure enabled) |
| Wallet | MetaMask |

## Project Structure

```
cosmonfts/
├── backend/
│   ├── contracts/          # Solidity smart contracts
│   ├── prisma/             # Database schema
│   ├── scripts/            # Deploy & seed scripts
│   └── src/
│       ├── config/         # Database, Stripe, blockchain config
│       ├── routes/         # API endpoints
│       ├── services/       # Business logic
│       ├── jobs/           # Cron jobs
│       ├── middleware/     # Error handling, rate limiting
│       └── utils/          # Logger, validators
├── frontend/
│   ├── pages/              # Next.js pages
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   └── styles/             # Tailwind CSS
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- MetaMask browser extension
- Stripe account (test + live keys)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed sample data
npm run seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your values

# Start development server
npm run dev
```

### Smart Contract Deployment

```bash
cd backend

# Compile contracts
npx hardhat compile

# Deploy to Mumbai testnet
npx hardhat run scripts/deploy.ts --network mumbai

# Verify on PolygonScan
npx hardhat verify --network mumbai <CONTRACT_ADDRESS> <TPS_ADDRESS>
```

## API Endpoints

### Pricing
- `GET /api/pricing` - Current price, countdown, availability
- `GET /api/pricing/all-tiers` - All 81 pricing tiers

### Cart
- `POST /api/cart/add` - Add NFT to cart
- `GET /api/cart` - Get current cart
- `POST /api/cart/remove` - Remove item
- `POST /api/cart/clear` - Clear cart

### Purchase
- `POST /api/purchase/checkout` - Create payment intent
- `GET /api/purchase/:id` - Get purchase status

### NFTs
- `GET /api/nft/:id` - Single NFT details
- `GET /api/nfts/available` - Browse available NFTs
- `GET /api/nfts/search` - Search by name

### Auctions
- `GET /api/auctions/active` - List active auctions
- `GET /api/auctions/:id` - Single auction details
- `POST /api/auctions/:id/bid` - Place a bid
- `GET /api/auctions/history` - Past auction results
- `POST /api/auctions/create` - Create auction (admin)

### Image Generation
- `POST /api/images/generate-phase1` - Generate Phase 1 images
- `POST /api/images/generate-phase/:n` - Generate specific phase
- `POST /api/images/verify` - Verify IPFS images

## Badge System

| Badge | Score | Symbol |
|-------|-------|--------|
| ELITE | 425+ | ⭐ |
| PREMIUM | 400-424 | 💫 |
| EXCEPTIONAL | 375-399 | 🌟 |
| STANDARD | 350-374 | 🔷 |

## Pricing Phases

- **Phase 1** (Weeks 1-4): Base price, 1,000 NFTs
- **Phases 2-81** (1 week each): +7.5% price, 250 NFTs each

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://...
POLYGON_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x...
STRIPE_API_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG...
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_KEY=pk_...
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

## Deployment

### Backend (Railway)

1. Create account at [railway.app](https://railway.app)
2. Connect GitHub repository
3. Add PostgreSQL service
4. Set environment variables in Railway dashboard
5. Deploy automatically on push

### Frontend (Vercel)

1. Import project at [vercel.com](https://vercel.com)
2. Configure environment variables
3. Deploy automatically on push

### Image Generation (GitHub Actions)

Images are generated automatically via GitHub Actions:
- Daily at 2 AM UTC
- Manual trigger available
- Uses Leonardo.AI API Pro

### Smart Contract (Polygon)

```bash
cd backend
npx hardhat compile
npx hardhat run scripts/deploy.ts --network polygon
npx hardhat verify --network polygon <CONTRACT_ADDRESS> <TPS_ADDRESS>
```

## Security Features

- 3D Secure for purchases over $500
- Stripe Radar fraud detection
- Rate limiting on all endpoints
- Webhook signature verification
- Chargeback evidence collection

## License

Proprietary - ALPHA AI LTD

## Support

- Email: support@cosmonfts.com
- Discord: discord.gg/cosmonfts
- Twitter: @cosmonfts
