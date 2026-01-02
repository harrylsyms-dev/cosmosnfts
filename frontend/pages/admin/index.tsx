import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface Admin {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface SiteSettings {
  isLive: boolean;
  maintenanceMode: boolean;
  comingSoonMode: boolean;
  launchDate: string | null;
  comingSoonTitle: string | null;
  comingSoonMessage: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/me`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      setAdmin(data.admin);

      // Fetch settings
      await fetchSettings();
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSettings() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/settings`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }

  async function handleGoLive() {
    if (!confirm('Are you sure you want to take the site live? This will disable the "Coming Soon" page.')) {
      return;
    }

    setActionLoading('go-live');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/settings/go-live`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();

      if (res.ok) {
        setSettings(data.settings);
        setMessage({ type: 'success', text: 'Site is now live!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to go live' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to go live' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEnableComingSoon() {
    setActionLoading('coming-soon');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/settings/coming-soon`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (res.ok) {
        setSettings(data.settings);
        setMessage({ type: 'success', text: 'Coming Soon mode enabled' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to enable coming soon' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to enable coming soon' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleLogout() {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${apiUrl}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      // Ignore errors
    }

    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard | CosmoNFT</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white">CosmoNFT Admin</h1>
              {settings?.isLive ? (
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">LIVE</span>
              ) : settings?.comingSoonMode ? (
                <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold">COMING SOON</span>
              ) : (
                <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold">OFFLINE</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">{admin?.email}</span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded ${
              message.type === 'success'
                ? 'bg-green-900/30 border border-green-600 text-green-400'
                : 'bg-red-900/30 border border-red-600 text-red-400'
            }`}>
              {message.text}
              <button
                onClick={() => setMessage(null)}
                className="float-right hover:opacity-75"
              >
                &times;
              </button>
            </div>
          )}

          {/* Site Status Card */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
            <h2 className="text-xl font-bold mb-4">Site Status</h2>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Status</div>
                <div className={`text-2xl font-bold ${
                  settings?.isLive ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {settings?.isLive ? 'LIVE' : settings?.comingSoonMode ? 'Coming Soon' : 'Offline'}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Maintenance Mode</div>
                <div className={`text-2xl font-bold ${
                  settings?.maintenanceMode ? 'text-red-400' : 'text-green-400'
                }`}>
                  {settings?.maintenanceMode ? 'ON' : 'OFF'}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Coming Soon Mode</div>
                <div className={`text-2xl font-bold ${
                  settings?.comingSoonMode ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {settings?.comingSoonMode ? 'ON' : 'OFF'}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              {!settings?.isLive && (
                <button
                  onClick={handleGoLive}
                  disabled={actionLoading === 'go-live'}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-50"
                >
                  {actionLoading === 'go-live' ? 'Going Live...' : 'Go Live'}
                </button>
              )}

              {settings?.isLive && (
                <button
                  onClick={handleEnableComingSoon}
                  disabled={actionLoading === 'coming-soon'}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-50"
                >
                  {actionLoading === 'coming-soon' ? 'Enabling...' : 'Enable Coming Soon'}
                </button>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link href="/admin/sales" className="bg-gray-900 rounded-lg p-6 border border-green-800 hover:border-green-500 transition-colors">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-bold mb-1">Sales Dashboard</h3>
              <p className="text-gray-400 text-sm">Revenue & analytics</p>
            </Link>

            <Link href="/admin/orders" className="bg-gray-900 rounded-lg p-6 border border-blue-800 hover:border-blue-500 transition-colors">
              <div className="text-3xl mb-2">📦</div>
              <h3 className="font-bold mb-1">Orders</h3>
              <p className="text-gray-400 text-sm">View & manage orders</p>
            </Link>

            <Link href="/admin/auctions" className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-blue-500 transition-colors">
              <div className="text-3xl mb-2">🔨</div>
              <h3 className="font-bold mb-1">Auctions</h3>
              <p className="text-gray-400 text-sm">Create and manage auctions</p>
            </Link>

            <Link href="/admin/trading" className="bg-gray-900 rounded-lg p-6 border border-purple-800 hover:border-purple-500 transition-colors">
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="font-bold mb-1">Marketplace</h3>
              <p className="text-gray-400 text-sm">Listings & offers</p>
            </Link>

            <Link href="/admin/nfts" className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-blue-500 transition-colors">
              <div className="text-3xl mb-2">🌟</div>
              <h3 className="font-bold mb-1">NFTs</h3>
              <p className="text-gray-400 text-sm">Browse and manage NFTs</p>
            </Link>

            <Link href="/admin/phases" className="bg-gray-900 rounded-lg p-6 border border-orange-800 hover:border-orange-500 transition-colors">
              <div className="text-3xl mb-2">⏱️</div>
              <h3 className="font-bold mb-1">Phases & Pricing</h3>
              <p className="text-gray-400 text-sm">Timer controls & pricing</p>
            </Link>

            <Link href="/admin/users" className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-blue-500 transition-colors">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-bold mb-1">Users</h3>
              <p className="text-gray-400 text-sm">User management</p>
            </Link>

            <Link href="/admin/benefactor-dashboard" className="bg-gray-900 rounded-lg p-6 border border-pink-800 hover:border-pink-500 transition-colors">
              <div className="text-3xl mb-2">💝</div>
              <h3 className="font-bold mb-1">Benefactor</h3>
              <p className="text-gray-400 text-sm">Donation tracking</p>
            </Link>

            <Link href="/admin/images" className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-blue-500 transition-colors">
              <div className="text-3xl mb-2">🎨</div>
              <h3 className="font-bold mb-1">Image Generation</h3>
              <p className="text-gray-400 text-sm">Generate NFT images</p>
            </Link>

            <Link href="/admin/site" className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-blue-500 transition-colors">
              <div className="text-3xl mb-2">🌐</div>
              <h3 className="font-bold mb-1">Site Management</h3>
              <p className="text-gray-400 text-sm">Whitelist & broadcasts</p>
            </Link>

            <Link href="/admin/security" className="bg-gray-900 rounded-lg p-6 border border-red-800 hover:border-red-500 transition-colors">
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="font-bold mb-1">Security</h3>
              <p className="text-gray-400 text-sm">Audit logs & access</p>
            </Link>

            <Link href="/admin/settings" className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-blue-500 transition-colors">
              <div className="text-3xl mb-2">⚙️</div>
              <h3 className="font-bold mb-1">Settings</h3>
              <p className="text-gray-400 text-sm">Configure site settings</p>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
