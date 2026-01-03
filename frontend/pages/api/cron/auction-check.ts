import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development or if no secret set
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const now = new Date();
    let activated = 0;
    let ended = 0;

    // Activate pending auctions that should start
    const pendingAuctions = await prisma.auction.findMany({
      where: {
        status: 'PENDING',
        startTime: { lte: now },
      },
    });

    for (const auction of pendingAuctions) {
      await prisma.auction.update({
        where: { id: auction.id },
        data: { status: 'ACTIVE' },
      });
      activated++;
    }

    // End active auctions that have expired
    const expiredAuctions = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endTime: { lte: now },
      },
      include: { bids: { orderBy: { bidAmountCents: 'desc' }, take: 1 } },
    });

    for (const auction of expiredAuctions) {
      const winningBid = auction.bids[0];

      await prisma.$transaction([
        prisma.auction.update({
          where: { id: auction.id },
          data: { status: 'ENDED' },
        }),
        // If there was a winning bid, mark the NFT as sold
        ...(winningBid
          ? [
              prisma.nFT.update({
                where: { tokenId: auction.tokenId },
                data: {
                  status: 'SOLD',
                  ownerAddress: winningBid.bidderAddress,
                },
              }),
              prisma.auctionHistory.create({
                data: {
                  tokenId: auction.tokenId,
                  nftName: auction.nftName,
                  finalPriceCents: winningBid.bidAmountCents,
                  winnerAddress: winningBid.bidderAddress,
                  winnerEmail: winningBid.bidderEmail,
                  auctionDate: now,
                },
              }),
            ]
          : [
              // No bids, release NFT back to available
              prisma.nFT.update({
                where: { tokenId: auction.tokenId },
                data: { status: 'AVAILABLE' },
              }),
            ]),
      ]);

      ended++;
    }

    res.json({
      message: 'Auction check complete',
      activated,
      ended,
    });
  } catch (error) {
    console.error('Auction check job failed:', error);
    res.status(500).json({ error: 'Auction check job failed' });
  }
}
