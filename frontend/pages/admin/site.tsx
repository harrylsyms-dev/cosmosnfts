import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface SiteSettings {
  isLive: boolean;
  maintenanceMode: boolean;
  comingSoonMode: boolean;
  launchDate: string | null;
  comingSoonTitle: string | null;
  comingSoonMessage: string | null;
  phasePaused: boolean;
}

interface MarketplaceSettings {
  tradingEnabled: boolean;
  listingsEnabled: boolean;
  offersEnabled: boolean;
  creatorRoyaltyPercent: number;
}

interface WhitelistEntry {
  id: string;
  walletAddress: string;
  email: string | null;
  note: string | null;
  createdAt: string;
}

export default function AdminSiteManagement() {
  const router = useRouter();
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [marketplaceSettings, setMarketplaceSettings] = useState<MarketplaceSettings | null>(null);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newWhitelistAddress, setNewWhitelistAddress] = useState('');
  const [newWhitelistEmail, setNewWhitelistEmail] = useState('');
  const [newWhitelistNote, setNewWhitelistNote] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  async function checkAuthAndFetch() {
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

      await Promise.all([fetchSiteSettings(), fetchMarketplaceSettings(), fetchWhitelist()]);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSiteSettings() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/site-settings`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setSiteSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch site settings:', error);
    }
  }

  async function fetchMarketplaceSettings() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/marketplace/admin/settings`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setMarketplaceSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch marketplace settings:', error);
    }
  }

  async function fetchWhitelist() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/whitelist`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setWhitelist(data.addresses || []);
      }
    } catch (error) {
      console.error('Failed to fetch whitelist:', error);
    }
  }

  async function updateSiteMode(mode: 'live' | 'coming_soon' | 'maintenance') {
    setActionLoading(`mode-${mode}`);
    try {
      const token = localStorage.getItem('adminToken');
      const updates: Partial<SiteSettings> = {};

      if (mode === 'live') {
        updates.isLive = true;
        updates.comingSoonMode = false;
        updates.maintenanceMode = false;
      } else if (mode === 'coming_soon') {
        updates.isLive = false;
        updates.comingSoonMode = true;
        updates.maintenanceMode = false;
      } else if (mode === 'maintenance') {
        updates.maintenanceMode = true;
      }

      const res = await fetch(`${apiUrl}/api/admin/site-settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        await fetchSiteSettings();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to update mode:', error);
      alert('Failed to update site mode');
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleMarketplaceSetting(setting: keyof MarketplaceSettings) {
    setActionLoading(`marketplace-${setting}`);
    try {
      const token = localStorage.getItem('adminToken');
      const updates = {
        [setting]: !marketplaceSettings?.[setting],
      };

      const res = await fetch(`${apiUrl}/api/marketplace/admin/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        await fetchMarketplaceSettings();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to update marketplace setting:', error);
      alert('Failed to update setting');
    } finally {
      setActionLoading(null);
    }
  }

  async function addToWhitelist() {
    if (!newWhitelistAddress) {
      alert('Wallet address is required');
      return;
    }

    setActionLoading('add-whitelist');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/whitelist`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          walletAddress: newWhitelistAddress,
          email: newWhitelistEmail || null,
          note: newWhitelistNote || null,
        }),
      });

      if (res.ok) {
        await fetchWhitelist();
        setNewWhitelistAddress('');
        setNewWhitelistEmail('');
        setNewWhitelistNote('');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add to whitelist');
      }
    } catch (error) {
      console.error('Failed to add to whitelist:', error);
      alert('Failed to add to whitelist');
    } finally {
      setActionLoading(null);
    }
  }

  async function removeFromWhitelist(id: string) {
    if (!confirm('Remove this address from the whitelist?')) return;

    setActionLoading(`remove-${id}`);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/whitelist/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await fetchWhitelist();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove from whitelist');
      }
    } catch (error) {
      console.error('Failed to remove from whitelist:', error);
      alert('Failed to remove from whitelist');
    } finally {
      setActionLoading(null);
    }
  }

  async function sendBroadcast() {
    if (!broadcastSubject || !broadcastMessage) {
      alert('Subject and message are required');
      return;
    }

    if (!confirm('Send this email to all registered users?')) return;

    setActionLoading('broadcast');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/broadcast`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subject: broadcastSubject,
          message: broadcastMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Broadcast sent to ${data.sentCount} users`);
        setBroadcastSubject('');
        setBroadcastMessage('');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send broadcast');
      }
    } catch (error) {
      console.error('Failed to send broadcast:', error);
      alert('Failed to send broadcast');
    } finally {
      setActionLoading(null);
    }
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
        <title>Site Management | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold text-white hover:text-gray-300">
                CosmoNFT Admin
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-300">Site Management</span>
            </div>
            <nav className="flex gap-4">
              <Link href="/admin/phases" className="text-gray-400 hover:text-white">Phases</Link>
              <Link href="/admin/sales" className="text-gray-400 hover:text-white">Sales</Link>
              <Link href="/admin/settings" className="text-gray-400 hover:text-white">Settings</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* Site Mode Controls */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Site Mode</h2>
            <p className="text-gray-400 mb-4">Control the current state of the website</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => updateSiteMode('live')}
                disabled={!!actionLoading}
                className={`p-4 rounded-lg border-2 transition-all ${
                  siteSettings?.isLive && !siteSettings?.maintenanceMode
                    ? 'border-green-500 bg-green-500/20'
                    : 'border-gray-700 hover:border-green-500'
                }`}
              >
                <div className="text-2xl mb-2">
                  {siteSettings?.isLive && !siteSettings?.maintenanceMode ? '  ' : '  '}
                </div>
                <div className="text-white font-semibold">Live</div>
                <div className="text-gray-400 text-sm">Site is public and accessible</div>
              </button>

              <button
                onClick={() => updateSiteMode('coming_soon')}
                disabled={!!actionLoading}
                className={`p-4 rounded-lg border-2 transition-all ${
                  siteSettings?.comingSoonMode && !siteSettings?.isLive
                    ? 'border-yellow-500 bg-yellow-500/20'
                    : 'border-gray-700 hover:border-yellow-500'
                }`}
              >
                <div className="text-2xl mb-2">
                  {siteSettings?.comingSoonMode && !siteSettings?.isLive ? '  ' : '  '}
                </div>
                <div className="text-white font-semibold">Coming Soon</div>
                <div className="text-gray-400 text-sm">Show coming soon page</div>
              </button>

              <button
                onClick={() => updateSiteMode('maintenance')}
                disabled={!!actionLoading}
                className={`p-4 rounded-lg border-2 transition-all ${
                  siteSettings?.maintenanceMode
                    ? 'border-red-500 bg-red-500/20'
                    : 'border-gray-700 hover:border-red-500'
                }`}
              >
                <div className="text-2xl mb-2">
                  {siteSettings?.maintenanceMode ? '  ' : '  '}
                </div>
                <div className="text-white font-semibold">Maintenance</div>
                <div className="text-gray-400 text-sm">Site under maintenance</div>
              </button>
            </div>
          </div>

          {/* Marketplace Controls */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Marketplace Controls</h2>
            <p className="text-gray-400 mb-4">Enable/disable marketplace features</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <div className="text-white font-semibold">Trading</div>
                  <div className="text-gray-400 text-sm">Allow NFT purchases on marketplace</div>
                </div>
                <button
                  onClick={() => toggleMarketplaceSetting('tradingEnabled')}
                  disabled={!!actionLoading}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    marketplaceSettings?.tradingEnabled
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {marketplaceSettings?.tradingEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <div className="text-white font-semibold">Listings</div>
                  <div className="text-gray-400 text-sm">Allow users to list NFTs for sale</div>
                </div>
                <button
                  onClick={() => toggleMarketplaceSetting('listingsEnabled')}
                  disabled={!!actionLoading}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    marketplaceSettings?.listingsEnabled
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {marketplaceSettings?.listingsEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <div className="text-white font-semibold">Offers</div>
                  <div className="text-gray-400 text-sm">Allow users to make offers on NFTs</div>
                </div>
                <button
                  onClick={() => toggleMarketplaceSetting('offersEnabled')}
                  disabled={!!actionLoading}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    marketplaceSettings?.offersEnabled
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {marketplaceSettings?.offersEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>

          {/* Whitelist Management */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Whitelist Management</h2>
            <p className="text-gray-400 mb-4">Manage early access addresses</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <input
                type="text"
                placeholder="Wallet Address (0x...)"
                value={newWhitelistAddress}
                onChange={(e) => setNewWhitelistAddress(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={newWhitelistEmail}
                onChange={(e) => setNewWhitelistEmail(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Note (optional)"
                value={newWhitelistNote}
                onChange={(e) => setNewWhitelistNote(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
              <button
                onClick={addToWhitelist}
                disabled={!!actionLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 font-semibold transition-colors disabled:opacity-50"
              >
                Add to Whitelist
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Address</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Note</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Added</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {whitelist.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        No addresses whitelisted yet
                      </td>
                    </tr>
                  ) : (
                    whitelist.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-4 py-3 font-mono text-sm text-white">
                          {entry.walletAddress.slice(0, 8)}...{entry.walletAddress.slice(-6)}
                        </td>
                        <td className="px-4 py-3 text-gray-300">{entry.email || '-'}</td>
                        <td className="px-4 py-3 text-gray-400">{entry.note || '-'}</td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeFromWhitelist(entry.id)}
                            disabled={!!actionLoading}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Email Broadcast */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Email Broadcast</h2>
            <p className="text-gray-400 mb-4">Send an email to all registered users</p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Subject"
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
              <textarea
                placeholder="Message (supports basic HTML)"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
              <button
                onClick={sendBroadcast}
                disabled={!!actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading === 'broadcast' ? 'Sending...' : 'Send Broadcast'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
