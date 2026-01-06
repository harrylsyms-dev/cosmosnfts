import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useMetaMask } from '../hooks/useMetaMask';
import { usePricing } from '../hooks/usePricing';
import { useCart } from '../hooks/useCart';
import Layout from '../components/Layout';
import NFTCard from '../components/NFTCard';
import CountdownTimer from '../components/CountdownTimer';
import PricingDisplay from '../components/PricingDisplay';
import CosmicBackground from '../components/CosmicBackground';
import SeriesProgress from '../components/SeriesProgress';
import { TIER_CONFIG, TIER_ORDER, MAX_TOTAL_SCORE } from '../lib/constants';

interface NFT {
  id: number;
  name: string;
  image: string;
  score: number;
  badge: string;
  displayPrice: string;
  currentPrice: number;
}

export default function Home() {
  const { address, isConnected, connect } = useMetaMask();
  const { pricing, isLoading: pricingLoading } = usePricing();
  const { cart, addToCart } = useCart();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(true);

  useEffect(() => {
    fetchNfts();
  }, []);

  async function fetchNfts() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/nfts/available?limit=12`);
      const data = await res.json();
      setNfts(data.items || []);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    } finally {
      setIsLoadingNfts(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>CosmoNFT - Own a Piece of the Universe</title>
        <meta name="description" content="Celestial objects immortalized as NFTs. Scientifically scored. Dynamically priced." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Cosmic Background with Solar System and Black Hole */}
        <CosmicBackground />

        {/* Gradient overlay at bottom for transition */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-950 to-transparent z-[1]" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center py-20">
          {/* Floating badge */}
          <div className={`inline-flex items-center gap-2 backdrop-blur-sm border rounded-full px-4 py-2 mb-8 ${
            pricing?.isPaused
              ? 'bg-yellow-900/30 border-yellow-500/30'
              : 'bg-white/10 border-white/20 animate-pulse'
          }`}>
            <span className={`w-2 h-2 rounded-full ${pricing?.isPaused ? 'bg-yellow-400' : 'bg-green-400'}`} />
            <span className="text-sm text-gray-300">
              {pricing?.isPaused
                ? 'Timer Paused - Price Locked'
                : `Phase ${pricing?.tierIndex || 1} Now Live`}
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Own a Piece
            </span>
            <br />
            <span className="text-white">of the Universe</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Celestial objects immortalized as NFTs. Scientifically scored.
            <br className="hidden md:block" />
            Dynamically priced. <span className="text-purple-400 font-semibold">30% funds space exploration.</span>
          </p>

          {/* Pricing Display */}
          <div className="max-w-md mx-auto mb-10">
            <PricingDisplay pricing={pricing} isLoading={pricingLoading} />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#nfts"
              className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(124,58,237,0.5)]"
            >
              <span className="relative z-10">Browse NFTs</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            {!isConnected ? (
              <button
                onClick={connect}
                className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white border-2 border-white/30 rounded-xl backdrop-blur-sm hover:bg-white/10 hover:border-white/50 transition-all"
              >
                Connect MetaMask
              </button>
            ) : (
              <div className="inline-flex items-center gap-3 bg-green-900/30 backdrop-blur-sm border border-green-500/30 px-6 py-4 rounded-xl">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-300 font-medium">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
            )}
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-12 px-4 border-y border-gray-800 bg-gray-950">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-400">20,000</div>
            <div className="text-gray-400">Total NFTs</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-400">
              {pricing ? `$${pricing.displayPrice}` : '$0.10'}
            </div>
            <div className="text-gray-400">Base Rate × Score</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-purple-400">{pricing?.phaseIncreasePercent || 7.5}%</div>
            <div className="text-gray-400">Per Phase Increase</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-yellow-400">30%</div>
            <div className="text-gray-400">To Space Exploration</div>
          </div>
        </div>
      </section>

      {/* Series Progress Section */}
      <section className="relative py-12 px-4 bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <SeriesProgress variant="full" showTrajectory={true} showCountdown={true} />
        </div>
      </section>

      {/* NFT Grid Section */}
      <section id="nfts" className="relative py-16 px-4 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Available Now</h2>
            <Link href="/browse" className="text-blue-400 hover:text-blue-300">
              View All &rarr;
            </Link>
          </div>

          {isLoadingNfts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-lg h-96 loading-shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nfts.map((nft) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  onAddToCart={() => addToCart(nft.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-16 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-5xl mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Browse & Select</h3>
              <p className="text-gray-400">
                Explore our collection of scientifically scored celestial objects.
                Each has a unique Cosmic Score based on 10 metrics.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="text-5xl mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Purchase with Card</h3>
              <p className="text-gray-400">
                Pay securely with credit card via Stripe. No crypto needed to buy.
                3D Secure protection for high-value purchases.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="text-5xl mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Receive Your NFT</h3>
              <p className="text-gray-400">
                NFT mints automatically to your wallet on Polygon.
                View and trade on our marketplace within minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Badge Explanation */}
      <section className="relative py-16 px-4 bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">6 Rarity Tiers</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Each NFT is assigned a rarity tier based on its score ranking.
            Higher tiers have price multipliers that reflect their rarity.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TIER_ORDER.map((tier) => {
              const config = TIER_CONFIG[tier];
              return (
                <div
                  key={tier}
                  className={`bg-gray-900 rounded-lg p-5 border ${config.borderColor}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{config.icon}</span>
                    <div>
                      <span className={`font-bold text-lg ${config.textColor}`}>{tier}</span>
                      <span className="text-gray-500 text-sm ml-2">{config.multiplier}x</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{config.rarity}</p>
                  <p className="text-gray-500 text-xs mt-2">{config.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/scoring"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              Learn more about scoring & pricing
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-blue-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Prices Go Up Every Phase
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {pricing?.isPaused
              ? 'Timer is paused. Prices are locked until resumed.'
              : `Don't miss Phase ${pricing?.tierIndex || 1} pricing. Once it ends, prices increase ${pricing?.phaseIncreasePercent || 7.5}%.`}
          </p>

          {pricing && (
            <div className="mb-8">
              {pricing.isPaused ? (
                <div className="inline-flex items-center gap-3 bg-yellow-900/30 border border-yellow-500/30 px-6 py-4 rounded-xl">
                  <span className="text-yellow-400 text-2xl">⏸️</span>
                  <span className="text-yellow-300 font-medium">
                    Timer paused - price will not increase until resumed
                  </span>
                </div>
              ) : (
                <CountdownTimer
                  targetTime={Date.now() + pricing.timeUntilNextTier * 1000}
                  onComplete={() => window.location.reload()}
                />
              )}
            </div>
          )}

          <Link href="#nfts" className="btn-primary text-lg px-12 py-4">
            Start Collecting
          </Link>
        </div>
      </section>
    </Layout>
  );
}
