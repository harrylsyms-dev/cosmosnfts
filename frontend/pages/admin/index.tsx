import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import WidgetGrid, {
  DEFAULT_WIDGETS,
  DEFAULT_LAYOUT,
  DashboardLayout,
} from '../../components/admin/WidgetGrid';

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
  phasePaused: boolean;
  contractPaused: boolean;
}

interface SystemStatus {
  database: 'online' | 'offline' | 'error';
  stripe: 'online' | 'offline' | 'error';
  ipfs: 'online' | 'offline' | 'error';
  blockchain: 'online' | 'offline' | 'error';
}

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalNFTs: number;
  totalUsers: number;
  pendingOrders: number;
  activeAuctions: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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

      await Promise.all([
        fetchSettings(),
        fetchSystemStatus(),
        fetchDashboardPreferences(),
        fetchStats(),
      ]);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSettings() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/site-settings`, {
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
      console.error('Failed to fetch system status:', error);
    }
  }

  async function fetchDashboardPreferences() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/dashboard-preferences`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setLayout({
          positions: data.preferences.layout || [],
          starredWidgets: data.preferences.starredWidgets || DEFAULT_LAYOUT.starredWidgets,
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard preferences:', error);
    }
  }

  async function fetchStats() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/dashboard-stats`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      // Stats endpoint might not exist yet
      console.error('Failed to fetch stats:', error);
    }
  }

  const handleLayoutChange = useCallback(async (newLayout: DashboardLayout) => {
    setLayout(newLayout);

    // Auto-save with debounce
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${apiUrl}/api/admin/dashboard-preferences`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          layout: newLayout.positions,
          starredWidgets: newLayout.starredWidgets,
        }),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save layout:', error);
      setSaveStatus('idle');
    }
  }, []);

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

  function getSiteStatusBadge() {
    if (settings?.maintenanceMode) {
      return { label: 'MAINTENANCE', color: 'bg-red-600' };
    }
    if (settings?.isLive) {
      return { label: 'LIVE', color: 'bg-green-600' };
    }
    if (settings?.comingSoonMode) {
      return { label: 'COMING SOON', color: 'bg-yellow-600' };
    }
    return { label: 'OFFLINE', color: 'bg-gray-600' };
  }

  // Generate widget stats content
  const widgetStats: Record<string, React.ReactNode> = {};
  if (stats) {
    widgetStats.sales = (
      <div className="text-green-400 font-bold text-lg">
        ${(stats.totalSales / 100).toLocaleString()}
      </div>
    );
    widgetStats.orders = (
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Total: {stats.totalOrders}</span>
        <span className="text-yellow-400">Pending: {stats.pendingOrders}</span>
      </div>
    );
    widgetStats.nfts = (
      <div className="text-purple-400 font-bold text-lg">
        {stats.totalNFTs.toLocaleString()} NFTs
      </div>
    );
    widgetStats.users = (
      <div className="text-blue-400 font-bold text-lg">
        {stats.totalUsers.toLocaleString()} Users
      </div>
    );
    widgetStats.auctions = (
      <div className="text-orange-400 font-bold text-lg">
        {stats.activeAuctions} Active
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const siteStatus = getSiteStatusBadge();

  return (
    <>
      <Head>
        <title>Admin Dashboard | CosmoNFT</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-white">CosmoNFT Admin</h1>
                <span className={`${siteStatus.color} text-white px-2 py-1 rounded text-xs font-bold`}>
                  {siteStatus.label}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* System Status Indicators */}
                {systemStatus && (
                  <div className="hidden md:flex items-center gap-2 mr-4">
                    <div className="flex items-center gap-1" title="Database">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(systemStatus.database)}`} />
                      <span className="text-gray-500 text-xs">DB</span>
                    </div>
                    <div className="flex items-center gap-1" title="Stripe">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(systemStatus.stripe)}`} />
                      <span className="text-gray-500 text-xs">Pay</span>
                    </div>
                    <div className="flex items-center gap-1" title="IPFS">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(systemStatus.ipfs)}`} />
                      <span className="text-gray-500 text-xs">IPFS</span>
                    </div>
                    <div className="flex items-center gap-1" title="Blockchain">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(systemStatus.blockchain)}`} />
                      <span className="text-gray-500 text-xs">Chain</span>
                    </div>
                  </div>
                )}

                {/* Phase/Contract Status */}
                {settings && (
                  <div className="hidden md:flex items-center gap-2 mr-4">
                    {settings.phasePaused && (
                      <span className="bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded text-xs">
                        Timer Paused
                      </span>
                    )}
                    {settings.contractPaused && (
                      <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded text-xs">
                        Contract Paused
                      </span>
                    )}
                  </div>
                )}

                <span className="text-gray-400">{admin?.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Dashboard Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Dashboard</h2>
              <p className="text-gray-400 text-sm">
                {showStarredOnly
                  ? `${layout.starredWidgets.length} starred widgets`
                  : 'All widgets'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Save Status */}
              {saveStatus !== 'idle' && (
                <span className={`text-sm ${saveStatus === 'saving' ? 'text-yellow-400' : 'text-green-400'}`}>
                  {saveStatus === 'saving' ? 'Saving...' : 'Saved!'}
                </span>
              )}

              {/* View Toggle */}
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setShowStarredOnly(false)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    !showStarredOnly ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setShowStarredOnly(true)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    showStarredOnly ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Starred
                </button>
              </div>

              {/* Edit Mode Toggle */}
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  editMode
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {editMode ? 'Done Editing' : 'Customize'}
              </button>
            </div>
          </div>

          {/* Edit Mode Instructions */}
          {editMode && (
            <div className="bg-purple-900/20 border border-purple-600 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-purple-400 mb-2">Customization Mode</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>Click the <span className="text-yellow-400">☆</span> to star/unstar widgets for your quick access view</li>
                <li>Use the dropdown on each widget to change its size</li>
                <li>Drag widgets to reorder them (coming soon)</li>
                <li>Changes are saved automatically</li>
              </ul>
            </div>
          )}

          {/* Quick Stats Bar */}
          {stats && !editMode && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="text-gray-400 text-sm mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-green-400">
                  ${(stats.totalSales / 100).toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="text-gray-400 text-sm mb-1">Total Orders</div>
                <div className="text-2xl font-bold text-blue-400">{stats.totalOrders}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="text-gray-400 text-sm mb-1">Total NFTs</div>
                <div className="text-2xl font-bold text-purple-400">{stats.totalNFTs.toLocaleString()}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="text-gray-400 text-sm mb-1">Total Users</div>
                <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              </div>
            </div>
          )}

          {/* Widget Grid */}
          <WidgetGrid
            widgets={DEFAULT_WIDGETS}
            layout={layout}
            onLayoutChange={handleLayoutChange}
            editMode={editMode}
            showStarred={showStarredOnly}
            stats={widgetStats}
          />

          {/* Empty State for Starred View */}
          {showStarredOnly && layout.starredWidgets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">☆</div>
              <h3 className="text-white font-bold mb-2">No starred widgets</h3>
              <p className="text-gray-400 mb-4">Click "Customize" to star widgets for quick access</p>
              <button
                onClick={() => {
                  setShowStarredOnly(false);
                  setEditMode(true);
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Customize Dashboard
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
