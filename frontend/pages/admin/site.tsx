import { useState, useEffect, useCallback } from 'react';
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
  comingSoonHtml: string | null;
  comingSoonPassword: string | null;
  maintenanceHtml: string | null;
  leonardoPrompt: string | null;
  phasePaused: boolean;
  pausedAt: string | null;
  contractPaused: boolean;
}

interface SystemStatus {
  database: 'online' | 'offline' | 'error';
  stripe: 'online' | 'offline' | 'error';
  ipfs: 'online' | 'offline' | 'error';
  blockchain: 'online' | 'offline' | 'error';
}

export default function AdminSiteManagement() {
  const router = useRouter();
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Coming Soon editor state
  const [comingSoonHtml, setComingSoonHtml] = useState('');
  const [comingSoonPassword, setComingSoonPassword] = useState('');
  const [comingSoonEditorMode, setComingSoonEditorMode] = useState<'html' | 'preview'>('html');

  // Maintenance editor state
  const [maintenanceHtml, setMaintenanceHtml] = useState('');
  const [maintenanceEditorMode, setMaintenanceEditorMode] = useState<'html' | 'preview'>('html');

  // System status
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'online',
    stripe: 'online',
    ipfs: 'online',
    blockchain: 'online',
  });

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

      await Promise.all([fetchSiteSettings(), fetchSystemStatus()]);
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
        setComingSoonHtml(data.settings.comingSoonHtml || getDefaultComingSoonHtml());
        setComingSoonPassword(data.settings.comingSoonPassword || '');
        setMaintenanceHtml(data.settings.maintenanceHtml || getDefaultMaintenanceHtml());
      }
    } catch (error) {
      console.error('Failed to fetch site settings:', error);
    }
  }

  async function fetchSystemStatus() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/system-status`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data.status);
      }
    } catch (error) {
      // Silently fail - status display will show defaults
      console.error('Failed to fetch system status:', error);
    }
  }

  function getDefaultComingSoonHtml() {
    return `<div style="text-align: center; padding: 60px 20px; max-width: 600px; margin: 0 auto;">
  <h1 style="font-size: 48px; color: #8B5CF6; margin-bottom: 20px;">CosmoNFT</h1>
  <h2 style="font-size: 32px; color: white; margin-bottom: 30px;">Coming Soon</h2>
  <p style="font-size: 18px; color: #9CA3AF; line-height: 1.6;">
    Own a piece of the universe. Celestial objects immortalized as NFTs.
    Scientifically scored. Dynamically priced. 30% supports space exploration.
  </p>
  <div style="margin-top: 40px;">
    <p style="color: #6B7280; font-size: 14px;">Sign up for early access</p>
  </div>
</div>`;
  }

  function getDefaultMaintenanceHtml() {
    return `<div style="text-align: center; padding: 60px 20px; max-width: 600px; margin: 0 auto;">
  <h1 style="font-size: 48px; color: #EF4444; margin-bottom: 20px;">Under Maintenance</h1>
  <p style="font-size: 18px; color: #9CA3AF; line-height: 1.6;">
    We're currently performing scheduled maintenance to improve your experience.
    Please check back soon.
  </p>
  <div style="margin-top: 40px;">
    <p style="color: #6B7280; font-size: 14px;">Expected duration: 1-2 hours</p>
  </div>
</div>`;
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

  async function saveComingSoonPage() {
    setActionLoading('save-coming-soon');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/site-settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          comingSoonHtml,
          comingSoonPassword: comingSoonPassword || null,
        }),
      });

      if (res.ok) {
        await fetchSiteSettings();
        alert('Coming Soon page saved successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Failed to save coming soon page:', error);
      alert('Failed to save');
    } finally {
      setActionLoading(null);
    }
  }

  async function saveMaintenancePage() {
    setActionLoading('save-maintenance');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/site-settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          maintenanceHtml,
        }),
      });

      if (res.ok) {
        await fetchSiteSettings();
        alert('Maintenance page saved successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Failed to save maintenance page:', error);
      alert('Failed to save');
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusColor(status: 'online' | 'offline' | 'error') {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
    }
  }

  function getStatusText(status: 'online' | 'offline' | 'error') {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'error':
        return 'Error';
    }
  }

  function getCurrentModeDisplay() {
    if (siteSettings?.maintenanceMode) {
      return { label: 'Maintenance', color: 'text-red-400', bg: 'bg-red-500/20' };
    }
    if (siteSettings?.comingSoonMode && !siteSettings?.isLive) {
      return { label: 'Coming Soon', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    }
    return { label: 'Live', color: 'text-green-400', bg: 'bg-green-500/20' };
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const currentMode = getCurrentModeDisplay();

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
              <Link href="/admin/users" className="text-gray-400 hover:text-white">Users</Link>
              <Link href="/admin/settings" className="text-gray-400 hover:text-white">Settings</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* System Status */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">System Status</h2>
              <div className={`px-3 py-1 rounded-full ${currentMode.bg}`}>
                <span className={`font-semibold ${currentMode.color}`}>{currentMode.label}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(systemStatus.database)}`}></div>
                  <span className="text-gray-400 text-sm">Database</span>
                </div>
                <span className="text-white font-semibold">{getStatusText(systemStatus.database)}</span>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(systemStatus.stripe)}`}></div>
                  <span className="text-gray-400 text-sm">Stripe</span>
                </div>
                <span className="text-white font-semibold">{getStatusText(systemStatus.stripe)}</span>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(systemStatus.ipfs)}`}></div>
                  <span className="text-gray-400 text-sm">IPFS</span>
                </div>
                <span className="text-white font-semibold">{getStatusText(systemStatus.ipfs)}</span>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(systemStatus.blockchain)}`}></div>
                  <span className="text-gray-400 text-sm">Blockchain</span>
                </div>
                <span className="text-white font-semibold">{getStatusText(systemStatus.blockchain)}</span>
              </div>
            </div>

            {/* Phase Status */}
            {siteSettings && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Phase Timer:</span>
                    <span className={siteSettings.phasePaused ? 'text-yellow-400' : 'text-green-400'}>
                      {siteSettings.phasePaused ? 'Paused' : 'Running'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Contract:</span>
                    <span className={siteSettings.contractPaused ? 'text-red-400' : 'text-green-400'}>
                      {siteSettings.contractPaused ? 'Paused' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

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

          {/* Coming Soon Page Editor */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Coming Soon Page</h2>
                <p className="text-gray-400 text-sm mt-1">Customize the coming soon page content</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setComingSoonEditorMode('html')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    comingSoonEditorMode === 'html'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  HTML
                </button>
                <button
                  onClick={() => setComingSoonEditorMode('preview')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    comingSoonEditorMode === 'preview'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {/* Password Protection */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">Password Protection (optional)</label>
              <input
                type="text"
                placeholder="Leave empty to disable password protection"
                value={comingSoonPassword}
                onChange={(e) => setComingSoonPassword(e.target.value)}
                className="w-full md:w-1/2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
              <p className="text-gray-500 text-xs mt-1">Users with this password can bypass the coming soon page</p>
            </div>

            {comingSoonEditorMode === 'html' ? (
              <textarea
                value={comingSoonHtml}
                onChange={(e) => setComingSoonHtml(e.target.value)}
                rows={15}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                placeholder="Enter HTML content..."
              />
            ) : (
              <div className="bg-gray-950 border border-gray-700 rounded-lg p-6 min-h-[400px]">
                <div dangerouslySetInnerHTML={{ __html: comingSoonHtml }} />
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setComingSoonHtml(getDefaultComingSoonHtml())}
                className="text-gray-400 hover:text-white text-sm"
              >
                Reset to Default
              </button>
              <button
                onClick={saveComingSoonPage}
                disabled={!!actionLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-2 font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading === 'save-coming-soon' ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Maintenance Page Editor */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Maintenance Page</h2>
                <p className="text-gray-400 text-sm mt-1">Customize the maintenance page content</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMaintenanceEditorMode('html')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    maintenanceEditorMode === 'html'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  HTML
                </button>
                <button
                  onClick={() => setMaintenanceEditorMode('preview')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    maintenanceEditorMode === 'preview'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {maintenanceEditorMode === 'html' ? (
              <textarea
                value={maintenanceHtml}
                onChange={(e) => setMaintenanceHtml(e.target.value)}
                rows={15}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                placeholder="Enter HTML content..."
              />
            ) : (
              <div className="bg-gray-950 border border-gray-700 rounded-lg p-6 min-h-[400px]">
                <div dangerouslySetInnerHTML={{ __html: maintenanceHtml }} />
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setMaintenanceHtml(getDefaultMaintenanceHtml())}
                className="text-gray-400 hover:text-white text-sm"
              >
                Reset to Default
              </button>
              <button
                onClick={saveMaintenancePage}
                disabled={!!actionLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-2 font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading === 'save-maintenance' ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
