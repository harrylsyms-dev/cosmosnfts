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

interface WalletRecipient {
  id?: string;
  name: string;
  walletAddress: string;
  sharePercent: number;
  isActive: boolean;
  sortOrder?: number;
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

  // Wallet recipients state
  const [recipients, setRecipients] = useState<WalletRecipient[]>([]);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch wallet balance when recipients change
  useEffect(() => {
    const primaryWallet = recipients.find(r => r.isActive && r.walletAddress);
    if (primaryWallet?.walletAddress) {
      fetchWalletBalance(primaryWallet.walletAddress);
    }
  }, [recipients]);

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

      const fetchPromises = [fetchWalletRecipients(), fetchConfigInfo()];
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

  async function fetchWalletRecipients() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/wallet-config`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        if (data.recipients && data.recipients.length > 0) {
          setRecipients(data.recipients);
        } else {
          // Default: single owner wallet
          setRecipients([{
            name: 'Owner',
            walletAddress: '',
            sharePercent: 100,
            isActive: true,
          }]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallet recipients:', error);
      setRecipients([{
        name: 'Owner',
        walletAddress: '',
        sharePercent: 100,
        isActive: true,
      }]);
    }
  }

  async function fetchWalletBalance(address: string) {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setWalletBalance(null);
      return;
    }

    setBalanceLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/wallet/balance?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance);
      } else {
        setWalletBalance(null);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      setWalletBalance(null);
    } finally {
      setBalanceLoading(false);
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
        setConfigInfo({
          email: { provider: 'SendGrid', configured: false },
          stripe: { configured: true, mode: 'test' },
          ipfs: { provider: 'Pinata', configured: true },
          blockchain: { network: 'Polygon Mainnet', contractAddress: null },
        });
      }
    } catch (error) {
      setConfigInfo({
        email: { provider: 'SendGrid', configured: false },
        stripe: { configured: false, mode: 'test' },
        ipfs: { provider: 'Pinata', configured: false },
        blockchain: { network: 'Polygon Mainnet', contractAddress: null },
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

  // Wallet Recipients Functions
  function addRecipient() {
    setRecipients([...recipients, {
      name: '',
      walletAddress: '',
      sharePercent: 0,
      isActive: true,
    }]);
  }

  function removeRecipient(index: number) {
    if (recipients.length <= 1) {
      setMessage({ type: 'error', text: 'You must have at least one wallet recipient' });
      return;
    }
    const newRecipients = recipients.filter((_, i) => i !== index);
    setRecipients(newRecipients);
  }

  function updateRecipient(index: number, field: keyof WalletRecipient, value: string | number | boolean) {
    const newRecipients = [...recipients];
    newRecipients[index] = { ...newRecipients[index], [field]: value };
    setRecipients(newRecipients);
  }

  function getTotalPercent(): number {
    return recipients.filter(r => r.isActive).reduce((sum, r) => sum + (r.sharePercent || 0), 0);
  }

  async function handleSaveWalletConfig(e: React.FormEvent) {
    e.preventDefault();

    const total = getTotalPercent();
    if (total !== 100) {
      setMessage({ type: 'error', text: `Total percentage must equal 100%. Currently: ${total}%` });
      return;
    }

    // Validate all recipients
    for (const recipient of recipients) {
      if (!recipient.name.trim()) {
        setMessage({ type: 'error', text: 'All recipients must have a name' });
        return;
      }
      if (!recipient.walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(recipient.walletAddress)) {
        setMessage({ type: 'error', text: `Invalid wallet address for "${recipient.name}"` });
        return;
      }
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
        body: JSON.stringify({ recipients }),
      });

      const data = await res.json();

      if (res.ok) {
        setRecipients(data.recipients);
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
        await fetchWalletRecipients();
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

  const totalPercent = getTotalPercent();
  const isValidSplit = totalPercent === 100;

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
            <div className="space-y-6">
              {/* Wallet Balance Card */}
              {recipients.length > 0 && recipients[0].walletAddress && (
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-6 border border-purple-500/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-gray-400 text-sm">Primary Wallet Balance</h3>
                      <div className="text-3xl font-bold text-white mt-1">
                        {balanceLoading ? (
                          <span className="text-gray-500">Loading...</span>
                        ) : walletBalance !== null ? (
                          <>{walletBalance} POL</>
                        ) : (
                          <span className="text-gray-500">Unable to fetch</span>
                        )}
                      </div>
                      <div className="text-gray-500 text-sm mt-1 font-mono">
                        {recipients[0].walletAddress.slice(0, 6)}...{recipients[0].walletAddress.slice(-4)}
                      </div>
                    </div>
                    <button
                      onClick={() => recipients[0].walletAddress && fetchWalletBalance(recipients[0].walletAddress)}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                  {walletBalance !== null && parseFloat(walletBalance) < 1 && (
                    <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg text-yellow-400 text-sm">
                      Low balance! Add more POL for minting gas fees.
                    </div>
                  )}
                </div>
              )}

              {/* Recipients Card */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Payment Recipients</h2>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    isValidSplit
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    Total: {totalPercent}%
                  </div>
                </div>

                <form onSubmit={handleSaveWalletConfig} className="space-y-4">
                  {/* Recipients List */}
                  {recipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex gap-4 items-start">
                        {/* Name & Percentage */}
                        <div className="flex-1 space-y-3">
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label className="block text-gray-400 text-xs mb-1">Name</label>
                              <input
                                type="text"
                                value={recipient.name}
                                onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                                placeholder="Recipient name"
                                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-purple-500 outline-none"
                              />
                            </div>
                            <div className="w-24">
                              <label className="block text-gray-400 text-xs mb-1">Share %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={recipient.sharePercent}
                                onChange={(e) => updateRecipient(index, 'sharePercent', parseInt(e.target.value) || 0)}
                                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm text-center focus:border-purple-500 outline-none"
                              />
                            </div>
                          </div>

                          {/* Wallet Address */}
                          <div>
                            <label className="block text-gray-400 text-xs mb-1">Wallet Address</label>
                            <input
                              type="text"
                              value={recipient.walletAddress}
                              onChange={(e) => updateRecipient(index, 'walletAddress', e.target.value)}
                              placeholder="0x..."
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-purple-500 outline-none"
                            />
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeRecipient(index)}
                          className="text-red-400 hover:text-red-300 p-2 mt-5"
                          title="Remove recipient"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Percentage Bar */}
                      <div className="mt-3">
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 transition-all duration-300"
                            style={{ width: `${recipient.sharePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Recipient Button */}
                  <button
                    type="button"
                    onClick={addRecipient}
                    className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Recipient
                  </button>

                  {/* Validation Message */}
                  {!isValidSplit && (
                    <div className="p-3 bg-red-900/30 border border-red-600/50 rounded-lg text-red-400 text-sm">
                      Total percentage must equal 100%. Currently: {totalPercent}%
                    </div>
                  )}

                  {/* Save Button */}
                  <button
                    type="submit"
                    disabled={actionLoading === 'wallet' || !isValidSplit}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === 'wallet' ? 'Saving...' : 'Save Configuration'}
                  </button>
                </form>
              </div>
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
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export/Import Tab */}
          {activeTab === 'export' && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-6">Export / Import Settings</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="font-semibold text-white mb-2">Export Settings</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Download current settings as a JSON file for backup or transfer.
                  </p>
                  <button
                    onClick={handleExportSettings}
                    disabled={actionLoading === 'export'}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {actionLoading === 'export' ? 'Exporting...' : 'Export Settings'}
                  </button>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="font-semibold text-white mb-2">Import Settings</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Upload a settings JSON file to restore configuration.
                  </p>
                  <label className="cursor-pointer">
                    <span className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg inline-block">
                      {actionLoading === 'import' ? 'Importing...' : 'Import Settings'}
                    </span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportSettings}
                      disabled={actionLoading === 'import'}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'apikeys' && admin?.role === 'SUPER_ADMIN' && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              {!isEncryptionConfigured && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 text-xl">!</span>
                    <div>
                      <h3 className="font-semibold text-red-400">Encryption Not Configured</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        API keys will be stored without encryption. Set the <code className="bg-gray-800 px-1 rounded">ENCRYPTION_KEY</code> environment variable to enable secure storage.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <h2 className="text-xl font-bold text-white mb-2">API Key Management</h2>
              <p className="text-gray-400 mb-6">
                Manage API keys for external services. Keys are stored securely and shown masked for security.
              </p>

              <div className="space-y-4">
                {API_KEY_SERVICES.map((service) => {
                  const status = getKeyStatus(service.id);
                  const isEditing = editingKey === service.id;

                  return (
                    <div key={service.id} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{service.name}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              status.configured
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-600/50 text-gray-400'
                            }`}>
                              {status.configured ? 'Configured' : 'Not Set'}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mt-1">{service.description}</p>
                          {status.maskedKey && (
                            <div className="flex items-center gap-2 mt-2">
                              <code className="bg-gray-700 px-2 py-1 rounded text-sm text-gray-300">
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditingKey(service.id)}
                              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-sm"
                            >
                              {status.configured ? 'Edit' : 'Add'}
                            </button>
                            {status.configured && (
                              <button
                                onClick={() => handleDeleteApiKey(service.id)}
                                disabled={actionLoading === `apikey-delete-${service.id}`}
                                className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {isEditing && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <div className="space-y-3">
                            <input
                              type="password"
                              value={editKeyValue}
                              onChange={(e) => setEditKeyValue(e.target.value)}
                              placeholder="Enter API key..."
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateApiKey(service.id)}
                                disabled={actionLoading === `apikey-${service.id}`}
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                              >
                                {actionLoading === `apikey-${service.id}` ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={cancelEditingKey}
                                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm"
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
          )}
        </main>
      </div>
    </>
  );
}
