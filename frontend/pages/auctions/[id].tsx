import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import CountdownTimer from '../../components/CountdownTimer';
import ScoreBreakdown from '../../components/ScoreBreakdown';
import BidInterface from '../../components/BidInterface';
import { useMetaMask } from '../../hooks/useMetaMask';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface AuctionDetail {
  id: string;
  tokenId: number;
  nftName: string;
  nft: {
    name: string;
    description: string;
    image: string | null;
    totalScore: number;
    badgeTier: string;
    scores: {
      fame: number;
      significance: number;
      rarity: number;
      discoveryRecency: number;
      culturalImpact: number;
    };
  } | null;
  startingBid: number;
  currentBid: number;
  displayCurrentBid: string;
  minimumNextBid: number;
  displayMinimumNextBid: string;
  highestBidder: string | null;
  bidCount: number;
  bids: {
    bidder: string;
    amount: number;
    displayAmount: string;
    timestamp: string;
  }[];
  startTime: string;
  endTime: string;
  timeRemaining: number;
  isEnded: boolean;
  status: string;
}

export default function AuctionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { address, isConnected, connect } = useMetaMask();

  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAuction();
      // Refresh every 10 seconds for live updates
      const interval = setInterval(fetchAuction, 10000);
      return () => clearInterval(interval);
    }
  }, [id]);

  async function fetchAuction() {
    try {
      const res = await fetch(`${apiUrl}/api/auctions/${id}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Auction not found');
        return;
      }

      setAuction(data.auction);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch auction:', err);
      setError('Failed to load auction');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBidPlaced() {
    // Refresh auction data after bid
    await fetchAuction();
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-800 rounded-lg h-96" />
              <div className="space-y-4">
                <div className="h-6 bg-gray-700 rounded w-1/2" />
                <div className="h-12 bg-gray-700 rounded" />
                <div className="h-24 bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !auction) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold mb-4">{error || 'Auction not found'}</h1>
          <Link href="/auctions" className="btn-primary">
            Back to Auctions
          </Link>
        </div>
      </Layout>
    );
  }

  const badgeColors: Record<string, string> = {
    ELITE: 'badge-elite',
    PREMIUM: 'badge-premium',
    EXCEPTIONAL: 'badge-exceptional',
    STANDARD: 'badge-standard',
  };

  return (
    <Layout>
      <Head>
        <title>{auction.nftName} Auction | CosmoNFT</title>
        <meta name="description" content={`Bid on ${auction.nftName} - Current bid: ${auction.displayCurrentBid}`} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href="/auctions" className="text-blue-400 hover:text-blue-300">
            &larr; Back to Auctions
          </Link>
        </nav>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Image & Details */}
          <div>
            {/* NFT Image */}
            <div className="bg-gray-900 rounded-lg overflow-hidden mb-6">
              {auction.nft?.image ? (
                <img
                  src={auction.nft.image}
                  alt={auction.nftName}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="w-full h-96 flex items-center justify-center text-gray-500">
                  <span className="text-6xl">🌟</span>
                </div>
              )}
            </div>

            {/* NFT Details */}
            {auction.nft && (
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold">{auction.nft.name}</h2>
                  <span className={`${badgeColors[auction.nft.badgeTier]} px-3 py-1 rounded text-sm font-bold`}>
                    {auction.nft.badgeTier}
                  </span>
                </div>
                <p className="text-gray-300 mb-6">{auction.nft.description}</p>

                <ScoreBreakdown
                  scores={{
                    fame: auction.nft.scores.fame,
                    significance: auction.nft.scores.significance,
                    rarity: auction.nft.scores.rarity,
                    discoveryRecency: auction.nft.scores.discoveryRecency,
                    culturalImpact: auction.nft.scores.culturalImpact,
                  }}
                  totalScore={auction.nft.totalScore}
                />
              </div>
            )}
          </div>

          {/* Right Column - Bidding */}
          <div>
            {/* Auction Status */}
            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold">{auction.nftName}</h1>
                <span className={`px-3 py-1 rounded text-sm font-bold ${
                  auction.isEnded ? 'bg-red-600' : 'bg-green-600'
                }`}>
                  {auction.isEnded ? 'ENDED' : 'LIVE'}
                </span>
              </div>

              {/* Countdown */}
              {!auction.isEnded && (
                <div className="mb-6">
                  <p className="text-gray-400 mb-2">Auction ends in:</p>
                  <CountdownTimer
                    targetTime={new Date(auction.endTime).getTime()}
                    onComplete={fetchAuction}
                    large
                  />
                </div>
              )}

              {/* Current Bid */}
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <p className="text-gray-400 text-sm mb-1">Current Bid</p>
                <p className="text-4xl font-bold text-green-400">{auction.displayCurrentBid}</p>
                {auction.highestBidder && (
                  <p className="text-gray-400 text-sm mt-2">
                    by <span className="font-mono">{auction.highestBidder.slice(0, 6)}...{auction.highestBidder.slice(-4)}</span>
                  </p>
                )}
              </div>

              {/* Bid Interface */}
              {!auction.isEnded && (
                <BidInterface
                  auctionId={auction.id}
                  minimumBid={auction.minimumNextBid}
                  displayMinimumBid={auction.displayMinimumNextBid}
                  currentBid={auction.currentBid}
                  isConnected={isConnected}
                  walletAddress={address}
                  onConnect={connect}
                  onBidPlaced={handleBidPlaced}
                />
              )}

              {auction.isEnded && auction.highestBidder && (
                <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 text-center">
                  <p className="text-green-400 font-bold mb-2">Auction Ended</p>
                  <p className="text-gray-300">
                    Won by <span className="font-mono">{auction.highestBidder.slice(0, 6)}...{auction.highestBidder.slice(-4)}</span>
                  </p>
                  <p className="text-2xl font-bold mt-2">{auction.displayCurrentBid}</p>
                </div>
              )}
            </div>

            {/* Bid History */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">
                Bid History ({auction.bidCount} bids)
              </h3>

              {auction.bids.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {auction.bids.map((bid, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center p-3 rounded ${
                        index === 0 ? 'bg-green-900/30 border border-green-600' : 'bg-gray-800'
                      }`}
                    >
                      <div>
                        <span className="font-mono text-sm">{bid.bidder}</span>
                        {index === 0 && (
                          <span className="ml-2 text-green-400 text-xs font-bold">HIGHEST</span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${index === 0 ? 'text-green-400' : 'text-white'}`}>
                          {bid.displayAmount}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(bid.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No bids yet. Be the first to bid!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
