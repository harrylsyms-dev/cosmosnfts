import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokenId } = req.query;

    if (!tokenId || Array.isArray(tokenId)) {
      return res.status(400).json({ error: 'Valid token ID required' });
    }

    const tokenIdNum = parseInt(tokenId, 10);
    if (isNaN(tokenIdNum)) {
      return res.status(400).json({ error: 'Token ID must be a number' });
    }

    // Get the NFT with its active listing and offers
    const nft = await prisma.nFT.findUnique({
      where: { tokenId: tokenIdNum },
      include: {
        listings: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    const activeListing = nft.listings[0] || null;

    // Get offers for this NFT if there's an active listing
    let offers: any[] = [];
    if (activeListing) {
      offers = await prisma.offer.findMany({
        where: {
          listingId: activeListing.id,
          status: { in: ['PENDING', 'COUNTERED'] },
        },
        orderBy: { offerAmountCents: 'desc' },
        take: 10,
      });
    }

    // Get trade history for this NFT
    const tradeHistory = await prisma.trade.findMany({
      where: { tokenId: tokenIdNum },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        tradeType: true,
        priceCents: true,
        sellerAddress: true,
        buyerAddress: true,
        createdAt: true,
      },
    });

    // Format the response
    const response = {
      nft: {
        id: nft.id,
        tokenId: nft.tokenId,
        name: nft.name,
        description: nft.description,
        image: nft.image || (nft.imageIpfsHash
          ? `https://gateway.pinata.cloud/ipfs/${nft.imageIpfsHash}`
          : null),
        objectType: nft.objectType,
        constellation: nft.constellation,
        distance: nft.distance,
        cosmicScore: nft.cosmicScore || nft.totalScore,
        totalScore: nft.totalScore,
        badgeTier: nft.badgeTier,
        ownerAddress: nft.ownerAddress,
        status: nft.status,
      },
      listing: activeListing ? {
        id: activeListing.id,
        priceCents: activeListing.priceCents,
        priceDisplay: `$${(activeListing.priceCents / 100).toFixed(2)}`,
        sellerAddress: activeListing.sellerAddress,
        createdAt: activeListing.createdAt.toISOString(),
        expiresAt: activeListing.expiresAt?.toISOString() || null,
      } : null,
      offers: offers.map((offer: any) => ({
        id: offer.id,
        offererAddress: offer.offererAddress.slice(0, 6) + '...' + offer.offererAddress.slice(-4),
        offerAmountCents: offer.offerAmountCents,
        offerDisplay: `$${(offer.offerAmountCents / 100).toFixed(2)}`,
        status: offer.status,
        expiresAt: offer.expiresAt.toISOString(),
        createdAt: offer.createdAt.toISOString(),
      })),
      tradeHistory: tradeHistory.map((trade: any) => ({
        id: trade.id,
        tradeType: trade.tradeType,
        priceCents: trade.priceCents,
        priceDisplay: `$${(trade.priceCents / 100).toFixed(2)}`,
        sellerAddress: trade.sellerAddress.slice(0, 6) + '...' + trade.sellerAddress.slice(-4),
        buyerAddress: trade.buyerAddress.slice(0, 6) + '...' + trade.buyerAddress.slice(-4),
        createdAt: trade.createdAt.toISOString(),
      })),
    };

    res.json(response);
  } catch (error: any) {
    console.error('Failed to fetch NFT listing details:', error);
    res.status(500).json({ error: 'Failed to fetch NFT details' });
  }
}
