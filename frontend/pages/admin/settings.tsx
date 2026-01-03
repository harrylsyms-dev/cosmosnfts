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

interface WalletConfig {
  ownerWalletAddress: string | null;
  benefactorWalletAddress: string | null;
  benefactorName: string | null;
  ownerSharePercent: number;
  benefactorSharePercent: number;
}

interface ConfigInfo {
  email: {
    provider: string;
    configured: boolean;
  };
  stripe: {
    configured: boolean;
    mode: 'live' | 'test';
  };
  ipfs: {
    provider: string;
    configured: boolean;
  };
  blockchain: {
    network: string;
    contractAddress: string | null;
  };
}

interface ApiKeyInfo {
  service: string;
  maskedKey: string | null;
  description: string;
  lastRotated: string | null;
}

interface ApiKeysResponse {
  apiKeys: ApiKeyInfo[];
  encryptionConfigured: boolean;
}

const API_KEY_SERVICES = [
  { id: 'stripe', name: 'Stripe Secret Key', description: 'Stripe API secret key for payment processing' },
  { id: 'stripe_webhook', name: 'Stripe Webhook Secret', description: 'Webhook signing secret for Stripe events' },
  { id: 'pinata_api', name: 'Pinata API Key', description: 'Pinata API key for IPFS uploads' },
  { id: 'pinata_secret', name: 'Pinata Secret Key', description: 'Pinata secret key for IPFS uploads' },
  { id: 'leonardo', name: 'Leonardo AI Key', description: 'Leonardo AI API key for image generation' },
  { id: 'polygon_rpc', name: 'Polygon RPC URL', description: 'RPC endpoint for Polygon blockchain' },
  { id: 'sendgrid', name: 'SendGrid API Key', description: 'SendGrid API key for email delivery' },
];

export default function AdminSettings() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [walletConfig, setWalletConfig] = useState<WalletConfig | null>(null);
  const [configInfo, setConfigInfo] = useState<ConfigInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'wallet' | 'config' | 'export' | 'apikeys'>('wallet');

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [isEncryptionConfigured, setIsEncryptionConfigured] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editKeyValue, setEditKeyValue] = useState('');
  const [editKeyDescription, setEditKeyDescription] = useState('');

  // Wallet config form
  const [ownerWallet, setOwnerWallet] = useState('');
  const [benefactorWallet, setBenefactorWallet] = useState('');
  const [benefactorName, setBenefactorName] = useState('');
  const [ownerShare, setOwnerShare] = useState(70);
  const [benefactorShare, setBenefactorShare] = useState(30);

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

      const fetchPromises = [fetchWalletConfig(), fetchConfigInfo()];
      if (data.admin?.role === 'SUPER_ADMIN') {
        fetchPromises.push(fetchApiKeys());
      }
      await Promise.all(fetchPromises);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchWalletConfig() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/wallet-config`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setWalletConfig(data.config);
        setOwnerWallet(data.config.ownerWalletAddress || '');
        setBenefactorWallet(data.config.benefactorWalletAddress || '');
        setBenefactorName(data.config.benefactorName || '');
        setOwnerShare(data.config.ownerSharePercent);
        setBenefactorShare(data.config.benefactorSharePercent);
      }
    } catch (error) {
      console.error('Failed to fetch wallet config:', error);
    }
  }

  async function fetchConfigInfo() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/config-info`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setConfigInfo(data.config);
      } else {
        // Set defaults if endpoint doesn't exist
        setConfigInfo({
          email: { provider: 'SendGrid', configured: !!process.env.NEXT_PUBLIC_SENDGRID_CONFIGURED },
          stripe: { configured: true, mode: 'test' },
          ipfs: { provider: 'Pinata', configured: true },
          blockchain: { network: 'Polygon Amoy', contractAddress: null },
        });
      }
    } catch (error) {
      setConfigInfo({
        email: { provider: 'SendGrid', configured: false },
        stripe: { configured: false, mode: 'test' },
        ipfs: { provider: 'Pinata', configured: false },
        blockchain: { network: 'Polygon Amoy', contractAddress: null },
      });
    }
  }

  async function fetchApiKeys() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/api-keys`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data: ApiKeysResponse = await res.json();
        setApiKeys(data.apiKeys);
        setIsEncryptionConfigured(data.encryptionConfigured);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  }

  async function handleUpdateApiKey(service: string) {
    if (!editKeyValue.trim()) {
      setMessage({ type: 'error', text: 'API key value is required' });
      return;
    }

    setActionLoading(`apikey-${service}`);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/api-keys/${service}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          apiKey: editKeyValue,
          description: editKeyDescription,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `API key for ${service} updated successfully` });
        setEditingKey(null);
        setEditKeyValue('');
        setEditKeyDescription('');
        await fetchApiKeys();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update API key' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update API key' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteApiKey(service: string) {
    if (!confirm(`Are you sure you want to delete the API key for ${service}? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(`apikey-delete-${service}`);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/api-keys/${service}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `API key for ${service} deleted successfully` });
        await fetchApiKeys();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete API key' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete API key' });
    } finally {
      setActionLoading(null);
    }
  }

  function startEditingKey(service: string) {
    const existingKey = apiKeys.find(k => k.service === service);
    setEditingKey(service);
    setEditKeyValue('');
    setEditKeyDescription(existingKey?.description || '');
  }

  function cancelEditingKey() {
    setEditingKey(null);
    setEditKeyValue('');
    setEditKeyDescription('');
  }

  function getServiceInfo(serviceId: string) {
    return API_KEY_SERVICES.find(s => s.id === serviceId);
  }

  function getKeyStatus(serviceId: string): { configured: boolean; maskedKey: string | null; lastRotated: string | null } {
    const key = apiKeys.find(k => k.service === serviceId);
    return {
      configured: !!key?.maskedKey,
      maskedKey: key?.maskedKey || null,
      lastRotated: key?.lastRotated || null,
    };
  }

  async function handleSaveWalletConfig(e: React.FormEvent) {
    e.preventDefault();

    if (ownerShare + benefactorShare !== 100) {
      setMessage({ type: 'error', text: 'Owner and benefactor shares must add up to 100%' });
      return;
    }

    setActionLoading('wallet');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/wallet-config`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ownerWalletAddress: ownerWallet || null,
          benefactorWalletAddress: benefactorWallet || null,
          benefactorName: benefactorName || null,
          ownerSharePercent: ownerShare,
          benefactorSharePercent: benefactorShare,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setWalletConfig(data.config);
        setMessage({ type: 'success', text: 'Wallet configuration saved successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save wallet configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save wallet configuration' });
    } finally {
      setActionLoading(null);
    }
  }

  function handleShareChange(type: 'owner' | 'benefactor', value: number) {
    if (value < 0 || value > 100) return;
    if (type === 'owner') {
      setOwnerShare(value);
      setBenefactorShare(100 - value);
    } else {
      setBenefactorShare(value);
      setOwnerShare(100 - value);
    }
  }

  async function handleExportSettings() {
    setActionLoading('export');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/settings/export`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cosmonfts-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: 'Settings exported successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to export settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export settings' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleImportSettings(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('This will overwrite current settings. Continue?')) {
      e.target.value = '';
      return;
    }

    setActionLoading('import');
    try {
      const content = await file.text();
      const settings = JSON.parse(content);

      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/settings/import`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings imported successfully' });
        await fetchWalletConfig();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to import settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid settings file' });
    } finally {
      setActionLoading(null);
      e.target.value = '';
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
        <title>Settings | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold text-white hover:text-gray-300">
                CosmoNFT Admin
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-300">Settings</span>
            </div>
            <nav className="flex gap-4">
              <Link href="/admin/site" className="text-gray-400 hover:text-white">Site</Link>
              <Link href="/admin/security" className="text-gray-400 hover:text-white">Security</Link>
              <Link href="/admin/users" className="text-gray-400 hover:text-white">Users</Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
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

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('wallet')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'wallet'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Wallet & Revenue
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'config'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Configuration
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'export'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Export / Import
            </button>
            {admin?.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => setActiveTab('apikeys')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'apikeys'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                API Keys
              </button>
            )}
          </div>

          {/* Wallet & Revenue Tab */}
          {activeTab === 'wallet' && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-6">Wallet & Revenue Split</h2>

              <form onSubmit={handleSaveWalletConfig} className="space-y-6">
                {/* Revenue Split Slider */}
                <div className="border-b border-gray-700 pb-6">
                  <h3 className="font-bold text-white mb-4">Revenue Split</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-blue-400">Owner: {ownerShare}%</span>
                        <span className="text-purple-400">Benefactor: {benefactorShare}%</span>
                      </div>
                      <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-blue-500"
                          style={{ width: `${ownerShare}%` }}
                        />
                        <div
                          className="absolute right-0 top-0 h-full bg-purple-500"
                          style={{ width: `${benefactorShare}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={ownerShare}
                        onChange={(e) => handleShareChange('owner', parseInt(e.target.value))}
                        className="w-full mt-2 opacity-0 h-4 cursor-pointer absolute"
                        style={{ marginTop: '-24px' }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Owner Share (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={ownerShare}
                        onChange={(e) => handleShareChange('owner', parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Benefactor Share (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={benefactorShare}
                        onChange={(e) => handleShareChange('benefactor', parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Wallet Addresses */}
                <div className="space-y-4">
                  <h3 className="font-bold text-white">Wallet Addresses</h3>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Owner Wallet Address
                      <span className="text-gray-500 ml-2">(receives {ownerShare}%)</span>
                    </label>
                    <input
                      type="text"
                      value={ownerWallet}
                      onChange={(e) => setOwnerWallet(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Benefactor Wallet Address
                      <span className="text-gray-500 ml-2">(receives {benefactorShare}%)</span>
                    </label>
                    <input
                      type="text"
                      value={benefactorWallet}
                      onChange={(e) => setBenefactorWallet(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Benefactor Name</label>
                    <input
                      type="text"
                      value={benefactorName}
                      onChange={(e) => setBenefactorName(e.target.value)}
                      placeholder="Space Exploration Fund"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading === 'wallet'}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-50"
                >
                  {actionLoading === 'wallet' ? 'Saving...' : 'Save Wallet Configuration'}
                </button>
              </form>
            </div>
          )}

          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-6">System Configuration</h2>
                <p className="text-gray-400 mb-6">
                  These settings are configured via environment variables and cannot be changed from the admin panel.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email Configuration */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">Email Service</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        configInfo?.email.configured
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {configInfo?.email.configured ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      Provider: {configInfo?.email.provider || 'N/A'}
                    </div>
                  </div>

                  {/* Stripe Configuration */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">Payment (Stripe)</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        configInfo?.stripe.configured
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {configInfo?.stripe.configured ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      Mode: <span className={configInfo?.stripe.mode === 'live' ? 'text-green-400' : 'text-yellow-400'}>
                        {configInfo?.stripe.mode === 'live' ? 'Live' : 'Test'}
                      </span>
                    </div>
                  </div>

                  {/* IPFS Configuration */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">IPFS Storage</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        configInfo?.ipfs.configured
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {configInfo?.ipfs.configured ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      Provider: {configInfo?.ipfs.provider || 'N/A'}
                    </div>
                  </div>

                  {/* Blockchain Configuration */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">Blockchain</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        configInfo?.blockchain.contractAddress
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {configInfo?.blockchain.contractAddress ? 'Deployed' : 'Not Deployed'}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      Network: {configInfo?.blockchain.network || 'N/A'}
                    </div>
                    {configInfo?.blockchain.contractAddress && (
                      <div className="text-gray-500 text-xs font-mono mt-1 truncate">
                        {configInfo.blockchain.contractAddress}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* API Endpoints Info */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="font-bold text-white mb-4">API Endpoints</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                    <span className="text-gray-400">API</span>
                    <code className="text-purple-400 text-sm">{typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api'}</code>
                  </div>
                  <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                    <span className="text-gray-400">Platform</span>
                    <code className="text-green-400 text-sm">Vercel Serverless</code>
                  </div>
                  <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                    <span className="text-gray-400">Site URL</span>
                    <code className="text-purple-400 text-sm">{typeof window !== 'undefined' ? window.location.origin : ''}</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export/Import Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Export */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-4">Export Settings</h2>
                <p className="text-gray-400 mb-6">
                  Download all admin-configurable settings as a JSON file. This includes wallet configuration,
                  site settings, and marketplace settings. Sensitive data like API keys are not exported.
                </p>
                <button
                  onClick={handleExportSettings}
                  disabled={!!actionLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-50"
                >
                  {actionLoading === 'export' ? 'Exporting...' : 'Export Settings'}
                </button>
              </div>

              {/* Import */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-4">Import Settings</h2>
                <p className="text-gray-400 mb-6">
                  Upload a previously exported settings file to restore configuration.
                  This will overwrite current settings.
                </p>
                <div className="flex items-center gap-4">
                  <label className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-lg cursor-pointer disabled:opacity-50">
                    {actionLoading === 'import' ? 'Importing...' : 'Import Settings'}
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportSettings}
                      disabled={!!actionLoading}
                      className="hidden"
                    />
                  </label>
                  <span className="text-gray-500 text-sm">.json files only</span>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-gray-900 rounded-lg p-6 border border-red-800">
                <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
                <p className="text-gray-400 mb-6">
                  These actions are destructive and cannot be undone.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                    <div>
                      <div className="text-white font-semibold">Reset to Defaults</div>
                      <div className="text-gray-500 text-sm">Reset all settings to their default values</div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
                          alert('Feature not implemented yet');
                        }
                      }}
                      className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-lg"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Keys Tab - Super Admin Only */}
          {activeTab === 'apikeys' && admin?.role === 'SUPER_ADMIN' && (
            <div className="space-y-6">
              {/* Encryption Warning */}
              {!isEncryptionConfigured && (
                <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-400 text-xl">!</span>
                    <div>
                      <h3 className="font-semibold text-yellow-400">Encryption Not Configured</h3>
                      <p className="text-yellow-300/80 text-sm mt-1">
                        API keys will be stored without encryption. Set the <code className="bg-yellow-900/50 px-1 rounded">ENCRYPTION_KEY</code> environment variable to enable secure storage.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-2">API Key Management</h2>
                <p className="text-gray-400 mb-6">
                  Manage API keys for external services. Keys are stored securely and shown masked for security.
                </p>

                <div className="space-y-4">
                  {API_KEY_SERVICES.map((service) => {
                    const status = getKeyStatus(service.id);
                    const isEditing = editingKey === service.id;
                    const isLoading = actionLoading === `apikey-${service.id}` || actionLoading === `apikey-delete-${service.id}`;

                    return (
                      <div
                        key={service.id}
                        className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-white">{service.name}</h3>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                status.configured
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-gray-600/50 text-gray-400'
                              }`}>
                                {status.configured ? 'Configured' : 'Not Set'}
                              </span>
                            </div>
                            <p className="text-gray-500 text-sm">{service.description}</p>
                            {status.configured && status.maskedKey && (
                              <div className="mt-2 flex items-center gap-4">
                                <code className="text-purple-400 text-sm bg-gray-900 px-2 py-1 rounded">
                                  {status.maskedKey}
                                </code>
                                {status.lastRotated && (
                                  <span className="text-gray-500 text-xs">
                                    Last updated: {new Date(status.lastRotated).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {!isEditing && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEditingKey(service.id)}
                                disabled={isLoading}
                                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-3 py-1.5 rounded disabled:opacity-50"
                              >
                                {status.configured ? 'Edit' : 'Add'}
                              </button>
                              {status.configured && (
                                <button
                                  onClick={() => handleDeleteApiKey(service.id)}
                                  disabled={isLoading}
                                  className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-3 py-1.5 rounded disabled:opacity-50"
                                >
                                  {actionLoading === `apikey-delete-${service.id}` ? '...' : 'Delete'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Inline Edit Form */}
                        {isEditing && (
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <div className="space-y-3">
                              <div>
                                <label className="block text-gray-400 text-sm mb-1">
                                  API Key Value
                                </label>
                                <input
                                  type="password"
                                  value={editKeyValue}
                                  onChange={(e) => setEditKeyValue(e.target.value)}
                                  placeholder={status.configured ? 'Enter new key to replace existing' : 'Enter API key'}
                                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-purple-500 outline-none"
                                  autoFocus
                                />
                              </div>
                              <div>
                                <label className="block text-gray-400 text-sm mb-1">
                                  Description (optional)
                                </label>
                                <input
                                  type="text"
                                  value={editKeyDescription}
                                  onChange={(e) => setEditKeyDescription(e.target.value)}
                                  placeholder="e.g., Production key, Test key"
                                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm focus:border-purple-500 outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateApiKey(service.id)}
                                  disabled={isLoading || !editKeyValue.trim()}
                                  className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-50"
                                >
                                  {actionLoading === `apikey-${service.id}` ? 'Saving...' : 'Save Key'}
                                </button>
                                <button
                                  onClick={cancelEditingKey}
                                  disabled={isLoading}
                                  className="bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="font-bold text-white mb-4">Configuration Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {API_KEY_SERVICES.filter(s => getKeyStatus(s.id).configured).length}
                    </div>
                    <div className="text-gray-500 text-sm">Configured</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-400">
                      {API_KEY_SERVICES.filter(s => !getKeyStatus(s.id).configured).length}
                    </div>
                    <div className="text-gray-500 text-sm">Not Set</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {API_KEY_SERVICES.length}
                    </div>
                    <div className="text-gray-500 text-sm">Total Services</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className={`text-2xl font-bold ${isEncryptionConfigured ? 'text-green-400' : 'text-yellow-400'}`}>
                      {isEncryptionConfigured ? 'Yes' : 'No'}
                    </div>
                    <div className="text-gray-500 text-sm">Encryption</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="mt-8 flex items-center justify-between">
            <Link href="/admin" className="text-gray-400 hover:text-white">
              &larr; Back to Dashboard
            </Link>
            <div className="flex gap-4">
              <Link href="/admin/site" className="text-purple-400 hover:text-purple-300">
                Site Management &rarr;
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
