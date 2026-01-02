import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import AuctionCard from '../../components/AuctionCard';
import CountdownTimer from '../../components/CountdownTimer';

interface Auction {
  id: string;
  tokenId: number;
  nftName: string;
  image: string | null;
  currentBid: number;
  displayCurrentBid: string;
  bidCount: number;
  endTime: string;
  timeRemaining: number;
  status: string;
}

export default function AuctionsPage() {
  const [activeAuctions, setActiveAuctions] = useState<Auction[]>([]);
  const [pastAuctions, setPastAuctions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    fetchAuctions();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAuctions, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAuctions() {
    try {
      const [activeRes, historyRes] = await Promise.all([
        fetch('/api/auctions/active'),
        fetch('/api/auctions/history'),
      ]);

      const activeData = await activeRes.json();
      const historyData = await historyRes.json();

      setActiveAuctions(activeData.auctions || []);
      setPastAuctions(historyData.history || []);
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>Auctions | CosmoNFT</title>
        <meta name="description" content="Bid on exclusive celestial NFTs in our live auctions" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Premium Auctions</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Bid on the most iconic celestial objects. Each auction runs for 7 days
            with real-time bidding.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-900 rounded-lg p-1 inline-flex">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Active ({activeAuctions.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Past Auctions
            </button>
          </div>
        </div>

        {/* Active Auctions */}
        {activeTab === 'active' && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-900 rounded-lg h-96 loading-shimmer" />
                ))}
              </div>
            ) : activeAuctions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeAuctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔭</div>
                <h3 className="text-2xl font-bold mb-2">No Active Auctions</h3>
                <p className="text-gray-400 mb-6">
                  Check back soon for exclusive celestial auctions!
                </p>
                <Link href="/" className="btn-primary">
                  Browse Available NFTs
                </Link>
              </div>
            )}
          </>
        )}

        {/* Past Auctions */}
        {activeTab === 'history' && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">NFT</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Final Price</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Winner</th>
                  <th className="px-6 py-4 text-left text-gray-400 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {pastAuctions.map((auction) => (
                  <tr key={auction.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <span className="font-medium">{auction.nftName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-400 font-bold">{auction.displayPrice}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 font-mono">{auction.winnerDisplay}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(auction.auctionDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {pastAuctions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      No past auctions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* How Auctions Work */}
        <section className="mt-16 py-12 px-4 bg-gray-900/50 rounded-lg">
          <h2 className="text-2xl font-bold text-center mb-8">How Auctions Work</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">1</div>
              <h3 className="font-semibold mb-2">Browse Active</h3>
              <p className="text-gray-400 text-sm">
                View current auctions and their bid history
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">2</div>
              <h3 className="font-semibold mb-2">Place Your Bid</h3>
              <p className="text-gray-400 text-sm">
                Minimum increment is 5% or $25, whichever is higher
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">3</div>
              <h3 className="font-semibold mb-2">Monitor Progress</h3>
              <p className="text-gray-400 text-sm">
                Get notified if you're outbid. Watch the countdown.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">4</div>
              <h3 className="font-semibold mb-2">Win & Own</h3>
              <p className="text-gray-400 text-sm">
                NFT mints to your wallet instantly upon winning
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
