import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useCart } from '../../hooks/useCart';
import { useMetaMask } from '../../hooks/useMetaMask';

interface ScientificData {
  distanceLy?: number | null;
  massSolar?: number | null;
  ageYears?: number | null;
  luminosity?: number | null;
  sizeKm?: number | null;
  temperatureK?: number | null;
  discoveryYear?: number | null;
  paperCount?: number | null;
}

interface ScoreBreakdownData {
  distance?: number | null;
  mass?: number | null;
  age?: number | null;
  luminosity?: number | null;
  size?: number | null;
  temperature?: number | null;
  discovery?: number | null;
  papers?: number | null;
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
  displayPrice: string;
  basePricePerPoint: number;
  status: string;
  scientificData?: ScientificData;
  scoreBreakdown?: ScoreBreakdownData;
  availablePhases: { phase: number; price: string }[];
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

  function getBadgeStyle(badge: string) {
    switch (badge) {
      case 'LEGENDARY':
        return 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 text-black';
      case 'ELITE':
        return 'badge-elite';
      case 'PREMIUM':
        return 'badge-premium';
      case 'EXCEPTIONAL':
        return 'badge-exceptional';
      default:
        return 'badge-standard';
    }
  }

  function getBadgeIcon(badge: string) {
    switch (badge) {
      case 'LEGENDARY':
        return '👑';
      case 'ELITE':
        return '⭐';
      case 'PREMIUM':
        return '💫';
      case 'EXCEPTIONAL':
        return '🌟';
      default:
        return '🔷';
    }
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
          <span className="text-white">{nft.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square bg-gray-900 rounded-2xl overflow-hidden">
              <img
                src={nft.image || '/images/placeholder.svg'}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Badge overlay */}
            <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg font-bold ${getBadgeStyle(nft.badge)}`}>
              {getBadgeIcon(nft.badge)} {nft.badge}
            </div>
          </div>

          {/* Details */}
          <div>
            <h1 className="text-4xl font-bold mb-4">{nft.name}</h1>

            <p className="text-gray-300 text-lg mb-6">{nft.description}</p>

            {/* Object Metadata */}
            <div className="flex flex-wrap gap-3 mb-6">
              {nft.objectType && (
                <span className="px-3 py-1 bg-blue-900/50 border border-blue-500/50 rounded-full text-blue-300 text-sm">
                  {nft.objectType}
                </span>
              )}
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

            {/* Price */}
            <div className="bg-gray-900 rounded-xl p-6 mb-6">
              <div className="text-gray-400 text-sm mb-1">Current Price</div>
              <div className="text-4xl font-bold text-white mb-1">
                {nft.displayPrice}
              </div>
              <div className="text-blue-400 text-sm mb-2 font-mono">
                ${nft.basePricePerPoint?.toFixed(2) || '0.10'} × {nft.score} = {nft.displayPrice}
              </div>
              <div className="text-gray-400 text-sm">
                Cosmic Score: {nft.score}/500
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 mb-8">
              {isAvailable ? (
                <>
                  {alreadyInCart ? (
                    <Link
                      href="/cart"
                      className="block w-full btn-success text-center text-lg"
                    >
                      View in Cart
                    </Link>
                  ) : (
                    <button
                      onClick={() => addToCart(nft.nftId)}
                      className="w-full btn-primary text-lg"
                    >
                      Add to Cart
                    </button>
                  )}

                  {!isConnected && (
                    <button
                      onClick={connect}
                      className="w-full btn-secondary text-lg"
                    >
                      Connect Wallet to Receive NFT
                    </button>
                  )}
                </>
              ) : (
                <div className="bg-gray-800 text-gray-400 py-4 px-6 rounded-lg text-center text-lg">
                  {nft.status === 'SOLD' ? 'Sold' :
                   nft.status === 'AUCTION_RESERVED' ? 'Reserved for Auction' : 'Reserved'}
                </div>
              )}
            </div>

            {/* Scientific Data */}
            {nft.scientificData && (
              <div className="bg-gray-900 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Scientific Properties</h3>
                <div className="grid grid-cols-2 gap-4">
                  {nft.scientificData.distanceLy != null && (
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase">Distance</div>
                      <div className="text-white font-semibold">
                        {nft.scientificData.distanceLy.toLocaleString()} ly
                      </div>
                    </div>
                  )}
                  {nft.scientificData.massSolar != null && (
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase">Mass</div>
                      <div className="text-white font-semibold">
                        {nft.scientificData.massSolar.toLocaleString()} M☉
                      </div>
                    </div>
                  )}
                  {nft.scientificData.ageYears != null && (
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase">Age</div>
                      <div className="text-white font-semibold">
                        {(nft.scientificData.ageYears / 1e9).toFixed(2)} billion years
                      </div>
                    </div>
                  )}
                  {nft.scientificData.sizeKm != null && (
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase">Size</div>
                      <div className="text-white font-semibold">
                        {nft.scientificData.sizeKm.toLocaleString()} km
                      </div>
                    </div>
                  )}
                  {nft.scientificData.temperatureK != null && (
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase">Temperature</div>
                      <div className="text-white font-semibold">
                        {nft.scientificData.temperatureK.toLocaleString()} K
                      </div>
                    </div>
                  )}
                  {nft.scientificData.discoveryYear != null && (
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase">Discovered</div>
                      <div className="text-white font-semibold">
                        {nft.scientificData.discoveryYear}
                      </div>
                    </div>
                  )}
                  {nft.scientificData.paperCount != null && (
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase">Scientific Papers</div>
                      <div className="text-white font-semibold">
                        {nft.scientificData.paperCount.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {nft.scientificData.luminosity != null && (
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase">Luminosity</div>
                      <div className="text-white font-semibold">
                        {nft.scientificData.luminosity.toLocaleString()} L☉
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Score Breakdown */}
            {nft.scoreBreakdown && (
              <div className="bg-gray-900 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Score Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { key: 'distance', label: 'Distance', score: nft.scoreBreakdown.distance },
                    { key: 'mass', label: 'Mass', score: nft.scoreBreakdown.mass },
                    { key: 'age', label: 'Age', score: nft.scoreBreakdown.age },
                    { key: 'luminosity', label: 'Luminosity', score: nft.scoreBreakdown.luminosity },
                    { key: 'size', label: 'Size', score: nft.scoreBreakdown.size },
                    { key: 'temperature', label: 'Temperature', score: nft.scoreBreakdown.temperature },
                    { key: 'discovery', label: 'Discovery Year', score: nft.scoreBreakdown.discovery },
                    { key: 'papers', label: 'Scientific Papers', score: nft.scoreBreakdown.papers },
                  ]
                    .filter(item => item.score != null)
                    .map(({ key, label, score }) => (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-28 text-gray-400 text-sm">{label}</div>
                        <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <div className="w-12 text-right text-white font-semibold text-sm">
                          {score?.toFixed(0)}/100
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Price Projection */}
            {nft.availablePhases && nft.availablePhases.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4">Price Over Time</h3>
                <div className="grid grid-cols-3 gap-4">
                  {nft.availablePhases.slice(0, 6).map((phase) => (
                    <div
                      key={phase.phase}
                      className={`p-3 rounded-lg text-center ${
                        phase.phase === 1
                          ? 'bg-blue-900/50 border border-blue-500'
                          : 'bg-gray-800'
                      }`}
                    >
                      <div className="text-gray-400 text-xs">Phase {phase.phase}</div>
                      <div className="font-semibold">{phase.price}</div>
                    </div>
                  ))}
                </div>
                <p className="text-gray-400 text-sm mt-4">
                  Prices increase 7.5% each phase. Buy early for the best price!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
