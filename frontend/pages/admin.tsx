import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

interface Stats {
  total: number;
  available: number;
  sold: number;
  reserved: number;
  averageScore: number;
  badgeDistribution: {
    ELITE: number;
    PREMIUM: number;
    EXCEPTIONAL: number;
    STANDARD: number;
  };
}

interface Tier {
  phase: number;
  price: number;
  displayPrice: string;
  quantityAvailable: number;
  quantitySold: number;
  startTime: string;
  duration: number;
  active: boolean;
}

interface NFT {
  id: number;
  name: string;
  cosmicScore: number;
  currentPrice: number;
  status: string;
  objectType: string;
  badge: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [nftPage, setNftPage] = useState(1);
  const [nftTotal, setNftTotal] = useState(0);

  // Phase detail view
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  const [phaseNfts, setPhaseNfts] = useState<NFT[]>([]);
  const [phaseNftPage, setPhaseNftPage] = useState(1);
  const [phaseNftTotal, setPhaseNftTotal] = useState(0);
  const [loadingPhaseNfts, setLoadingPhaseNfts] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'nfts') {
      fetchNFTs();
    }
  }, [activeTab, nftPage]);

  useEffect(() => {
    if (selectedPhase !== null) {
      fetchPhaseNFTs(selectedPhase, phaseNftPage);
    }
  }, [selectedPhase, phaseNftPage]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [statsRes, tiersRes] = await Promise.all([
        fetch('/api/nfts/stats'),
        fetch('/api/pricing/all-tiers'),
      ]);

      const statsData = await statsRes.json();
      const tiersData = await tiersRes.json();

      setStats(statsData);
      setTiers(tiersData.tiers || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchNFTs() {
    try {
      const res = await fetch(`/api/nfts/available?limit=50&offset=${(nftPage - 1) * 50}`);
      const data = await res.json();
      setNfts(data.items || []);
      setNftTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    }
  }

  async function fetchPhaseNFTs(phase: number, page: number) {
    setLoadingPhaseNfts(true);
    try {
      // Calculate ID range for this phase
      // Phase 1: IDs 1-1000
      // Phase 2+: IDs start at 1001, each phase has 250
      const { minId, maxId } = getPhaseIdRange(phase);

      const res = await fetch(`/api/nfts/by-phase?phase=${phase}&minId=${minId}&maxId=${maxId}&limit=50&offset=${(page - 1) * 50}`);
      const data = await res.json();
      setPhaseNfts(data.items || []);
      setPhaseNftTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch phase NFTs:', error);
    } finally {
      setLoadingPhaseNfts(false);
    }
  }

  function getPhaseIdRange(phase: number): { minId: number; maxId: number } {
    if (phase === 1) {
      return { minId: 1, maxId: 1000 };
    }
    // Phase 2 starts at 1001, each subsequent phase has 250 NFTs
    const minId = 1001 + (phase - 2) * 250;
    const maxId = minId + 249;
    return { minId, maxId };
  }

  function handlePhaseClick(phase: number) {
    setSelectedPhase(phase);
    setPhaseNftPage(1);
  }

  function closePhaseModal() {
    setSelectedPhase(null);
    setPhaseNfts([]);
    setPhaseNftPage(1);
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading admin dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const activeTier = tiers.find(t => t.active);
  const totalRevenuePotential = tiers.reduce((sum, t) => sum + (t.price * t.quantityAvailable), 0);
  const soldRevenue = tiers.reduce((sum, t) => sum + (t.price * t.quantitySold), 0);
  const selectedTier = selectedPhase ? tiers.find(t => t.phase === selectedPhase) : null;

  return (
    <Layout>
      <Head>
        <title>Admin Dashboard - CosmoNFT</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-700">
          {['overview', 'tiers', 'nfts', 'purchases'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-900 rounded-lg p-6">
                <p className="text-gray-400 text-sm">Total NFTs</p>
                <p className="text-4xl font-bold text-white">{stats.total.toLocaleString()}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6">
                <p className="text-gray-400 text-sm">Available</p>
                <p className="text-4xl font-bold text-green-400">{stats.available.toLocaleString()}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6">
                <p className="text-gray-400 text-sm">Sold</p>
                <p className="text-4xl font-bold text-blue-400">{stats.sold.toLocaleString()}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6">
                <p className="text-gray-400 text-sm">Reserved</p>
                <p className="text-4xl font-bold text-yellow-400">{stats.reserved.toLocaleString()}</p>
              </div>
            </div>

            {/* Current Phase */}
            {activeTier && (
              <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Current Phase: {activeTier.phase}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Price</p>
                    <p className="text-2xl font-bold">{activeTier.displayPrice}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Available</p>
                    <p className="text-2xl font-bold">{activeTier.quantityAvailable - activeTier.quantitySold}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Sold This Phase</p>
                    <p className="text-2xl font-bold">{activeTier.quantitySold}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Duration</p>
                    <p className="text-2xl font-bold">{activeTier.duration / 86400} days</p>
                  </div>
                </div>
              </div>
            )}

            {/* Badge Distribution */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Badge Distribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-yellow-900/30 rounded-lg border border-yellow-600">
                  <p className="text-3xl font-bold text-yellow-400">{stats.badgeDistribution.ELITE.toLocaleString()}</p>
                  <p className="text-gray-400">ELITE</p>
                </div>
                <div className="text-center p-4 bg-blue-900/30 rounded-lg border border-blue-600">
                  <p className="text-3xl font-bold text-blue-400">{stats.badgeDistribution.PREMIUM.toLocaleString()}</p>
                  <p className="text-gray-400">PREMIUM</p>
                </div>
                <div className="text-center p-4 bg-cyan-900/30 rounded-lg border border-cyan-600">
                  <p className="text-3xl font-bold text-cyan-400">{stats.badgeDistribution.EXCEPTIONAL.toLocaleString()}</p>
                  <p className="text-gray-400">EXCEPTIONAL</p>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-600">
                  <p className="text-3xl font-bold text-gray-300">{stats.badgeDistribution.STANDARD.toLocaleString()}</p>
                  <p className="text-gray-400">STANDARD</p>
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Revenue</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Total Revenue (Sold)</p>
                  <p className="text-3xl font-bold text-green-400">${soldRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">TPS Share (30%)</p>
                  <p className="text-3xl font-bold text-purple-400">${(soldRevenue * 0.3).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Potential (All Phases)</p>
                  <p className="text-3xl font-bold text-gray-400">${totalRevenuePotential.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tiers Tab */}
        {activeTab === 'tiers' && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-800 border-b border-gray-700">
              <p className="text-sm text-gray-400">Click on any phase to view its NFTs</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Phase</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-left">NFTs</th>
                    <th className="px-4 py-3 text-left">Sold</th>
                    <th className="px-4 py-3 text-left">Duration</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier) => (
                    <tr
                      key={tier.phase}
                      className={`border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors ${tier.active ? 'bg-blue-900/20' : ''}`}
                      onClick={() => handlePhaseClick(tier.phase)}
                    >
                      <td className="px-4 py-3 font-medium">
                        Phase {tier.phase}
                        {tier.active && <span className="ml-2 text-xs text-blue-400">(ACTIVE)</span>}
                      </td>
                      <td className="px-4 py-3">{tier.displayPrice}</td>
                      <td className="px-4 py-3">{tier.quantityAvailable}</td>
                      <td className="px-4 py-3">{tier.quantitySold}</td>
                      <td className="px-4 py-3">{tier.duration / 86400} days</td>
                      <td className="px-4 py-3">
                        {tier.active ? (
                          <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-sm">Active</span>
                        ) : tier.quantitySold >= tier.quantityAvailable ? (
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">Sold Out</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-sm">Upcoming</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePhaseClick(tier.phase); }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        >
                          View NFTs
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NFTs Tab */}
        {activeTab === 'nfts' && (
          <div>
            <div className="mb-4 text-gray-400">
              Showing {nfts.length} of {nftTotal.toLocaleString()} NFTs
            </div>
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Score</th>
                      <th className="px-4 py-3 text-left">Badge</th>
                      <th className="px-4 py-3 text-left">Price</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nfts.map((nft) => (
                      <tr key={nft.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                        <td className="px-4 py-3">#{nft.id}</td>
                        <td className="px-4 py-3 font-medium">{nft.name}</td>
                        <td className="px-4 py-3 text-gray-400">{nft.objectType}</td>
                        <td className="px-4 py-3">{nft.cosmicScore}/500</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            nft.badge === 'ELITE' ? 'bg-yellow-900 text-yellow-300' :
                            nft.badge === 'PREMIUM' ? 'bg-blue-900 text-blue-300' :
                            nft.badge === 'EXCEPTIONAL' ? 'bg-cyan-900 text-cyan-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {nft.badge}
                          </span>
                        </td>
                        <td className="px-4 py-3">${nft.currentPrice.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            nft.status === 'AVAILABLE' ? 'bg-green-900 text-green-300' :
                            nft.status === 'SOLD' ? 'bg-blue-900 text-blue-300' :
                            'bg-yellow-900 text-yellow-300'
                          }`}>
                            {nft.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => setNftPage(p => Math.max(1, p - 1))}
                disabled={nftPage === 1}
                className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="text-gray-400">
                Page {nftPage} of {Math.ceil(nftTotal / 50)}
              </span>
              <button
                onClick={() => setNftPage(p => p + 1)}
                disabled={nftPage >= Math.ceil(nftTotal / 50)}
                className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <p className="text-gray-400">No purchases yet. Purchases will appear here after launch.</p>
          </div>
        )}
      </div>

      {/* Phase NFTs Modal */}
      {selectedPhase !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Phase {selectedPhase} NFTs</h2>
                {selectedTier && (
                  <p className="text-gray-400 mt-1">
                    Price: {selectedTier.displayPrice} | {selectedTier.quantityAvailable} NFTs
                  </p>
                )}
              </div>
              <button
                onClick={closePhaseModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6">
              {loadingPhaseNfts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : phaseNfts.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No NFTs found for this phase</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Score</th>
                      <th className="px-4 py-3 text-left">Badge</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phaseNfts.map((nft) => (
                      <tr key={nft.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                        <td className="px-4 py-3">#{nft.id}</td>
                        <td className="px-4 py-3 font-medium">{nft.name}</td>
                        <td className="px-4 py-3 text-gray-400">{nft.objectType}</td>
                        <td className="px-4 py-3">{nft.cosmicScore}/500</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            nft.badge === 'ELITE' ? 'bg-yellow-900 text-yellow-300' :
                            nft.badge === 'PREMIUM' ? 'bg-blue-900 text-blue-300' :
                            nft.badge === 'EXCEPTIONAL' ? 'bg-cyan-900 text-cyan-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {nft.badge}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            nft.status === 'AVAILABLE' ? 'bg-green-900 text-green-300' :
                            nft.status === 'SOLD' ? 'bg-blue-900 text-blue-300' :
                            'bg-yellow-900 text-yellow-300'
                          }`}>
                            {nft.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer with Pagination */}
            {phaseNftTotal > 50 && (
              <div className="p-4 border-t border-gray-700 flex justify-center items-center gap-4">
                <button
                  onClick={() => setPhaseNftPage(p => Math.max(1, p - 1))}
                  disabled={phaseNftPage === 1}
                  className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700"
                >
                  Previous
                </button>
                <span className="text-gray-400">
                  Page {phaseNftPage} of {Math.ceil(phaseNftTotal / 50)}
                </span>
                <button
                  onClick={() => setPhaseNftPage(p => p + 1)}
                  disabled={phaseNftPage >= Math.ceil(phaseNftTotal / 50)}
                  className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
