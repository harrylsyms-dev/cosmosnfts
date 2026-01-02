import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  lastLoginAt: string | null;
  createdAt: string;
}

interface AuditLogEntry {
  id: string;
  adminId: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface SiteSettings {
  phasePaused: boolean;
  contractPaused: boolean;
  maintenanceMode: boolean;
}

export default function AdminSecurity() {
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'password'>('overview');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

      const data = await res.json();
      setCurrentAdmin(data.admin);

      await Promise.all([fetchAuditLogs(), fetchSiteSettings()]);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchAuditLogs() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/audit-logs?limit=100`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
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

  async function changePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      alert('New password must be at least 8 characters');
      return;
    }

    setActionLoading('password');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        alert('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password');
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleEmergencyPause() {
    const isPaused = siteSettings?.contractPaused;
    if (!confirm(`${isPaused ? 'Resume' : 'PAUSE'} all contract operations?`)) return;

    setActionLoading('emergency');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/site-settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ contractPaused: !isPaused }),
      });

      if (res.ok) {
        await fetchSiteSettings();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update pause state');
      }
    } catch (error) {
      console.error('Failed to toggle pause:', error);
      alert('Failed to update pause state');
    } finally {
      setActionLoading(null);
    }
  }

  function getActionColor(action: string): string {
    if (action.includes('login')) return 'text-green-400';
    if (action.includes('delete') || action.includes('ban')) return 'text-red-400';
    if (action.includes('update') || action.includes('edit')) return 'text-yellow-400';
    if (action.includes('create') || action.includes('add')) return 'text-blue-400';
    return 'text-gray-400';
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
        <title>Security | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold text-white hover:text-gray-300">
                CosmoNFT Admin
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-300">Security</span>
            </div>
            <nav className="flex gap-4">
              <Link href="/admin/users" className="text-gray-400 hover:text-white">Users</Link>
              <Link href="/admin/site" className="text-gray-400 hover:text-white">Site</Link>
              <Link href="/admin/settings" className="text-gray-400 hover:text-white">Settings</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Current Admin Info */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Current Session</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-gray-400 text-sm">Email</div>
                <div className="text-white">{currentAdmin?.email}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Role</div>
                <div className="text-purple-400 font-semibold">{currentAdmin?.role}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Last Login</div>
                <div className="text-white">
                  {currentAdmin?.lastLoginAt
                    ? new Date(currentAdmin.lastLoginAt).toLocaleString()
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Account Created</div>
                <div className="text-white">
                  {currentAdmin?.createdAt
                    ? new Date(currentAdmin.createdAt).toLocaleDateString()
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'audit'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Audit Log
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'password'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Change Password
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Emergency Controls */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4">Emergency Controls</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold">Contract Pause</div>
                        <div className="text-gray-400 text-sm">
                          Pause all smart contract operations
                        </div>
                      </div>
                      <button
                        onClick={toggleEmergencyPause}
                        disabled={!!actionLoading}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                          siteSettings?.contractPaused
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {actionLoading === 'emergency'
                          ? 'Processing...'
                          : siteSettings?.contractPaused
                          ? 'Resume'
                          : 'PAUSE'}
                      </button>
                    </div>
                    {siteSettings?.contractPaused && (
                      <div className="mt-2 text-red-400 text-sm">
                        Contract is currently PAUSED
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold">Phase Timer</div>
                        <div className="text-gray-400 text-sm">
                          Current phase timer status
                        </div>
                      </div>
                      <Link
                        href="/admin/phases"
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                          siteSettings?.phasePaused
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {siteSettings?.phasePaused ? 'PAUSED' : 'Running'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4">System Status</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        !siteSettings?.maintenanceMode ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <div>
                      <div className="text-white">Site Status</div>
                      <div className="text-gray-400 text-sm">
                        {siteSettings?.maintenanceMode ? 'Maintenance' : 'Online'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        !siteSettings?.contractPaused ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <div>
                      <div className="text-white">Contracts</div>
                      <div className="text-gray-400 text-sm">
                        {siteSettings?.contractPaused ? 'Paused' : 'Active'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        !siteSettings?.phasePaused ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    />
                    <div>
                      <div className="text-white">Phase Timer</div>
                      <div className="text-gray-400 text-sm">
                        {siteSettings?.phasePaused ? 'Paused' : 'Running'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Log Tab */}
          {activeTab === 'audit' && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">Audit Log</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Last 100 admin actions
                </p>
              </div>

              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Action</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Details</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                          No audit logs found
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className={`px-4 py-3 font-semibold ${getActionColor(log.action)}`}>
                            {log.action}
                          </td>
                          <td className="px-4 py-3 text-gray-300 text-sm max-w-xs truncate">
                            {log.details || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-sm">
                            {log.ipAddress || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 max-w-md">
              <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <button
                  onClick={changePassword}
                  disabled={!!actionLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-3 font-semibold transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'password' ? 'Changing...' : 'Change Password'}
                </button>
              </div>

              <div className="mt-4 text-gray-500 text-sm">
                Password must be at least 8 characters long.
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
