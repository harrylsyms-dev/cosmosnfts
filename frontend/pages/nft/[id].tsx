import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useCart } from '../../hooks/useCart';
import { useMetaMask } from '../../hooks/useMetaMask';
import {
  TIER_CONFIG,
  SCORE_METRICS,
  MAX_TOTAL_SCORE,
  PRICING,
  BadgeTier,
  getCategoryLabel,
  getCategoryIcon,
} from '../../lib/constants';

interface ScoreBreakdown {
  culturalSignificance?: number;
  scientificImportance?: number;
  historicalSignificance?: number;
  visualImpact?: number;
  uniqueness?: number;
  accessibility?: number;
  proximity?: number;
  storyFactor?: number;
  activeRelevance?: number;
  futurePotential?: number;
}

interface NFTDetail {
  nftId: number;
  name: string;
  description: string;
  image: string;
  objectType?: string;
  constellation?: string;
  distance?: string;
  score: number;
  badge: string;
  tierRank?: number;
  tierTotal?: number;
  displayPrice: string;
  currentPriceCents?: number;
  basePricePerPoint: number;
  tierMultiplier?: number;
  seriesMultiplier?: number;
  status: string;
  scoreBreakdown?: ScoreBreakdown;
}

export default function NFTDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [nft, setNft] = useState<NFTDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, isInCart } = useCart();
  const { isConnected, connect } = useMetaMask();

  useEffect(() => {
    if (id) {
      fetchNFT(id as string);
    }
  }, [id]);

  async function fetchNFT(nftId: string) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/nft/${nftId}`);
      if (!res.ok) throw new Error('NFT not found');
      const data = await res.json();
      setNft(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function getTierStyle(tier: string): { bg: string; border: string; text: string } {
    const config = TIER_CONFIG[tier as BadgeTier];
    if (!config) {
      return { bg: 'bg-gray-600', border: 'border-gray-500', text: 'text-gray-300' };
    }

    if (tier === 'MYTHIC') {
      return {
        bg: 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500',
        border: 'border-yellow-400',
        text: 'text-yellow-900',
      };
    }
    if (tier === 'LEGENDARY') {
      return {
        bg: 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500',
        border: 'border-purple-400',
        text: 'text-white',
      };
    }

    return {
      bg: config.bgColor,
      border: config.borderColor,
      text: 'text-white',
    };
  }

  function getTierIcon(tier: string): string {
    const config = TIER_CONFIG[tier as BadgeTier];
    return config?.icon || '○';
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !nft) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">NFT Not Found</h1>
          <Link href="/" className="text-blue-400 hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </Layout>
    );
  }

  const isAvailable = nft.status === 'AVAILABLE';
  const alreadyInCart = isInCart(nft.nftId);
  const tierStyle = getTierStyle(nft.badge);
  const tierConfig = TIER_CONFIG[nft.badge as BadgeTier];
  const scorePercentage = Math.round((nft.score / MAX_TOTAL_SCORE) * 100);
  const tierMultiplier = tierConfig?.multiplier || 1;
  const donationAmount = nft.currentPriceCents
    ? (nft.currentPriceCents * PRICING.donationPercentage / 100 / 100)
    : (nft.score * PRICING.baseRatePerPoint * tierMultiplier * PRICING.donationPercentage / 100);

  return (
    <Layout>
      <Head>
        <title>{nft.name} - CosmoNFT</title>
        <meta name="description" content={nft.description} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link href="/" className="text-gray-400 hover:text-white">
            Home
          </Link>
          <span className="text-gray-600 mx-2">/</span>
          <Link href="/browse" className="text-gray-400 hover:text-white">
            Browse
          </Link>
          <span className="text-gray-600 mx-2">/</span>
          <span className="text-white">{nft.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
              <img
                src={nft.image || '/images/placeholder.svg'}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Badge overlay */}
            <div
              className={`absolute top-4 right-4 px-4 py-2 rounded-lg font-bold shadow-lg ${tierStyle.bg} ${tierStyle.border} border ${tierStyle.text}`}
            >
              {getTierIcon(nft.badge)} {nft.badge}
            </div>
          </div>

          {/* Details */}
          <div>
            <h1 className="text-4xl font-bold mb-2">{nft.name}</h1>

            {/* Category */}
            {nft.objectType && (
              <div className="text-gray-400 text-lg mb-4">
                {getCategoryIcon(nft.objectType)} {getCategoryLabel(nft.objectType)}
              </div>
            )}

            {/* Tier Info */}
            <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg mb-6 ${tierConfig?.borderColor || 'border-gray-700'} border bg-gray-900/50`}>
              <span className="text-2xl">{getTierIcon(nft.badge)}</span>
              <div>
                <div className={`font-bold ${tierConfig?.textColor || 'text-gray-400'}`}>
                  {nft.badge}
                  {nft.tierRank && nft.tierTotal && (
                    <span className="text-gray-400 font-normal ml-2">
                      #{nft.tierRank} of {nft.tierTotal}
                    </span>
                  )}
                </div>
                <div className="text-gray-500 text-sm">{tierConfig?.description}</div>
              </div>
            </div>

            <p className="text-gray-300 text-lg mb-6">{nft.description}</p>

            {/* Object Metadata */}
            <div className="flex flex-wrap gap-3 mb-6">
              {nft.constellation && (
                <span className="px-3 py-1 bg-purple-900/50 border border-purple-500/50 rounded-full text-purple-300 text-sm">
                  {nft.constellation}
                </span>
              )}
              {nft.distance && (
                <span className="px-3 py-1 bg-green-900/50 border border-green-500/50 rounded-full text-green-300 text-sm">
                  {nft.distance}
                </span>
              )}
            </div>

            {/* Score */}
            <div className="bg-gray-900 rounded-xl p-6 mb-6 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Overall Score</h3>
                <div className="text-right">
                  <span className="text-2xl font-bold text-white">{nft.score}</span>
                  <span className="text-gray-400">/{MAX_TOTAL_SCORE}</span>
                  <span className="text-gray-500 ml-2">({scorePercentage}%)</span>
                </div>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all"
                  style={{ width: `${scorePercentage}%` }}
                />
              </div>
            </div>

            {/* Price */}
            <div className="bg-gray-900 rounded-xl p-6 mb-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Price</div>
              <div className="text-4xl font-bold text-white mb-4">
                {nft.displayPrice}
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <div className="text-gray-400 text-sm mb-2">How this price is calculated:</div>
                <div className="space-y-1 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Rate</span>
                    <span className="text-green-400">${PRICING.baseRatePerPoint.toFixed(2)} per point</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Score</span>
                    <span className="text-blue-400">{nft.score} points</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tier Multiplier</span>
                    <span className="text-purple-400">{tierMultiplier}x ({nft.badge})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Series Multiplier</span>
                    <span className="text-pink-400">{nft.seriesMultiplier || 1.0}x (Series 1)</span>
                  </div>
                  <div className="border-t border-gray-700 mt-2 pt-2">
                    <div className="flex justify-between text-white">
                      <span>${PRICING.baseRatePerPoint} × {nft.score} × {tierMultiplier} × {nft.seriesMultiplier || 1.0} =</span>
                      <span className="font-bold">{nft.displayPrice}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-green-400 text-sm flex items-center gap-2">
                <span>🚀</span>
                <span>
                  {PRICING.donationPercentage}% (${donationAmount.toFixed(2)}) supports space exploration
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 mb-8">
              {isAvailable ? (
                <>
                  {alreadyInCart ? (
                    <Link
                      href="/cart"
                      className="block w-full bg-green-600 hover:bg-green-700 text-white text-center text-lg py-4 rounded-xl font-semibold transition-colors"
                    >
                      View in Cart
                    </Link>
                  ) : (
                    <button
                      onClick={() => addToCart(nft.nftId)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-4 rounded-xl font-semibold transition-colors"
                    >
                      Add to Cart
                    </button>
                  )}

                  {!isConnected && (
                    <button
                      onClick={connect}
                      className="w-full bg-gray-800 hover:bg-gray-700 text-white text-lg py-4 rounded-xl font-semibold transition-colors border border-gray-700"
                    >
                      Connect Wallet to Receive NFT
                    </button>
                  )}
                </>
              ) : (
                <div className="bg-gray-800 text-gray-400 py-4 px-6 rounded-xl text-center text-lg">
                  {nft.status === 'SOLD'
                    ? 'Sold'
                    : nft.status === 'AUCTION_RESERVED'
                    ? 'Reserved for Auction'
                    : 'Reserved'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Score Breakdown Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Score Breakdown</h2>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="grid md:grid-cols-2 gap-4">
              {SCORE_METRICS.map((metric) => {
                const value = nft.scoreBreakdown?.[metric.key as keyof ScoreBreakdown] ?? 0;
                const percentage = (value / metric.max) * 100;

                return (
                  <div key={metric.key} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-white font-medium">{metric.label}</div>
                        <div className="text-gray-500 text-xs">{metric.tooltip}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-bold">{value}</span>
                        <span className="text-gray-400">/{metric.max}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <Link href="/browse" className="text-blue-400 hover:underline">
            &larr; Back to Browse
          </Link>
        </div>
      </div>
    </Layout>
  );
}
