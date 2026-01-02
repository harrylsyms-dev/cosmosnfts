import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../hooks/useAuth';

export default function AccountDashboard() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
    updateEmail,
    orders,
    nfts,
    fetchOrders,
    fetchNfts,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'orders' | 'nfts' | 'settings'>('orders');
  const [email, setEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/account/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchNfts();
    }
  }, [isAuthenticated, fetchOrders, fetchNfts]);

  // Set initial email
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user?.email]);

  async function handleEmailSave(e: React.FormEvent) {
    e.preventDefault();
    setEmailSaving(true);
    setEmailMessage(null);

    const success = await updateEmail(email);

    if (success) {
      setEmailMessage({ type: 'success', text: 'Email updated successfully' });
    } else {
      setEmailMessage({ type: 'error', text: 'Failed to update email' });
    }

    setEmailSaving(false);
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  function getStatusColor(status: string) {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'MINTED':
        return 'bg-green-900 text-green-300';
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-yellow-900 text-yellow-300';
      case 'FAILED':
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>My Account | CosmoNFT</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">My Account</h1>
            <p className="text-gray-400 font-mono">
              {user?.walletAddress.slice(0, 6)}...{user?.walletAddress.slice(-4)}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-800 mb-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('nfts')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'nfts'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            My NFTs ({nfts.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-12 text-center">
                <p className="text-gray-400 text-xl mb-4">No orders yet</p>
                <Link
                  href="/browse"
                  className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg"
                >
                  Browse NFTs
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex flex-wrap gap-4 items-center">
                      <div>
                        <p className="text-gray-400 text-sm">Order ID</p>
                        <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Date</p>
                        <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total</p>
                        <p className="font-bold text-green-400">${order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded text-sm ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      {order.transactionHash && (
                        <a
                          href={`https://polygonscan.com/tx/${order.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-sm"
                        >
                          View on PolygonScan
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Order NFTs */}
                  <div className="p-4">
                    <p className="text-gray-400 text-sm mb-3">NFTs ({order.nfts.length})</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {order.nfts.map((nft) => (
                        <div
                          key={nft.id}
                          className="bg-gray-800 rounded-lg p-3 flex items-center gap-3"
                        >
                          {nft.image ? (
                            <img
                              src={nft.image}
                              alt={nft.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center text-2xl">
                              🌟
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{nft.name}</p>
                            <p className="text-gray-400 text-sm">#{nft.tokenId}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* NFTs Tab */}
        {activeTab === 'nfts' && (
          <div>
            {nfts.length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-12 text-center">
                <p className="text-gray-400 text-xl mb-4">No NFTs in your wallet yet</p>
                <p className="text-gray-500 mb-6">
                  Once your purchased NFTs are minted, they'll appear here.
                </p>
                <Link
                  href="/browse"
                  className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg"
                >
                  Browse NFTs
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.map((nft) => (
                  <Link
                    key={nft.id}
                    href={`/nft/${nft.id}`}
                    className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-blue-500 transition-colors"
                  >
                    {/* Image */}
                    <div className="aspect-square bg-gray-800">
                      {nft.image ? (
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          🌟
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold truncate">{nft.name}</h3>
                        {nft.badgeTier && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            nft.badgeTier === 'ELITE' ? 'bg-purple-900 text-purple-300' :
                            nft.badgeTier === 'PREMIUM' ? 'bg-yellow-900 text-yellow-300' :
                            nft.badgeTier === 'EXCEPTIONAL' ? 'bg-blue-900 text-blue-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {nft.badgeTier}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-3">Token #{nft.tokenId}</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Cosmic Score</span>
                        <span className="font-bold">{nft.cosmicScore || nft.totalScore}</span>
                      </div>
                      {nft.transactionHash && (
                        <a
                          href={`https://polygonscan.com/tx/${nft.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-xs mt-2 block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Transaction
                        </a>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-lg">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-bold mb-6">Account Settings</h2>

              {/* Wallet Address */}
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">Wallet Address</label>
                <div className="bg-gray-800 rounded-lg p-3 font-mono text-sm break-all">
                  {user?.walletAddress}
                </div>
              </div>

              {/* Email */}
              <form onSubmit={handleEmailSave}>
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">
                    Email (optional - for order notifications)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {emailMessage && (
                  <div className={`mb-4 p-3 rounded ${
                    emailMessage.type === 'success'
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-red-900/30 text-red-400'
                  }`}>
                    {emailMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={emailSaving}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-50"
                >
                  {emailSaving ? 'Saving...' : 'Save Email'}
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-gray-900 rounded-lg border border-red-900 p-6 mt-6">
              <h3 className="text-lg font-bold text-red-400 mb-4">Sign Out</h3>
              <p className="text-gray-400 text-sm mb-4">
                This will end your current session. You can sign in again anytime with your wallet.
              </p>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
