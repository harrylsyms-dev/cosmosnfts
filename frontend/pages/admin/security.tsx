import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  privileges: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  isDisabled?: boolean;
}

interface AuditLogEntry {
  id: string;
  adminId: string;
  adminEmail: string;
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

interface ContractInfo {
  address: string | null;
  network: string;
  explorerUrl: string;
}

export default function AdminSecurity() {
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'contract' | 'admins' | 'audit' | 'password'>('overview');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // New admin form
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin'>('admin');

  // Contract address editing
  const [editContractAddress, setEditContractAddress] = useState('');
  const [showEditContract, setShowEditContract] = useState(false);

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

      await Promise.all([
        fetchAuditLogs(),
        fetchSiteSettings(),
        fetchAdminUsers(),
        fetchContractInfo(),
      ]);
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

  async function fetchAdminUsers() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/admin-users`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data.admins || []);
      }
    } catch (error) {
      console.error('Failed to fetch admin users:', error);
    }
  }

  async function fetchContractInfo() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/contract-info`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setContractInfo(data.contract);
      } else {
        // Set defaults if endpoint doesn't exist yet
        setContractInfo({
          address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || null,
          network: 'Polygon Amoy',
          explorerUrl: 'https://amoy.polygonscan.com',
        });
      }
    } catch (error) {
      // Set defaults on error
      setContractInfo({
        address: null,
        network: 'Polygon Amoy',
        explorerUrl: 'https://amoy.polygonscan.com',
      });
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

  async function createAdmin() {
    if (!newAdminEmail || !newAdminPassword) {
      alert('Email and password are required');
      return;
    }

    if (newAdminPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setActionLoading('create-admin');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/admin-users`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: newAdminEmail,
          password: newAdminPassword,
          role: newAdminRole,
        }),
      });

      if (res.ok) {
        await fetchAdminUsers();
        setNewAdminEmail('');
        setNewAdminPassword('');
        setNewAdminRole('admin');
        alert('Admin user created successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create admin');
      }
    } catch (error) {
      console.error('Failed to create admin:', error);
      alert('Failed to create admin');
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleAdminDisabled(adminId: string, currentlyDisabled: boolean) {
    if (!confirm(currentlyDisabled ? 'Enable this admin?' : 'Disable this admin?')) return;

    setActionLoading(`toggle-${adminId}`);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/admin-users/${adminId}/toggle`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ disabled: !currentlyDisabled }),
      });

      if (res.ok) {
        await fetchAdminUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update admin');
      }
    } catch (error) {
      console.error('Failed to toggle admin:', error);
      alert('Failed to update admin');
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteAdmin(adminId: string) {
    if (!confirm('Are you sure you want to delete this admin? This cannot be undone.')) return;

    setActionLoading(`delete-${adminId}`);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/admin-users/${adminId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await fetchAdminUsers();
        alert('Admin deleted successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Failed to delete admin:', error);
      alert('Failed to delete admin');
    } finally {
      setActionLoading(null);
    }
  }

  function getActionColor(action: string): string {
    if (action.includes('LOGIN') || action.includes('login')) return 'text-green-400';
    if (action.includes('DELETE') || action.includes('BAN') || action.includes('delete') || action.includes('ban')) return 'text-red-400';
    if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('update') || action.includes('edit')) return 'text-yellow-400';
    if (action.includes('CREATE') || action.includes('ADD') || action.includes('create') || action.includes('add')) return 'text-blue-400';
    if (action.includes('PAUSE')) return 'text-orange-400';
    return 'text-gray-400';
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const isSuperAdmin = currentAdmin?.role?.toUpperCase() === 'SUPER_ADMIN';

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
                <div className="text-purple-400 font-semibold capitalize">
                  {currentAdmin?.role?.replace('_', ' ')}
                </div>
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
          <div className="flex flex-wrap gap-2 mb-6">
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
              onClick={() => setActiveTab('contract')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'contract'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Smart Contract
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('admins')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'admins'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Admin Users ({adminUsers.length})
              </button>
            )}
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
              {/* Quick Access */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4">Quick Access</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link
                    href="/admin/phases"
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${siteSettings?.phasePaused ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      <div>
                        <div className="text-white font-semibold">Phase Timer</div>
                        <div className="text-gray-400 text-sm">
                          {siteSettings?.phasePaused ? 'Paused' : 'Running'}
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/admin/site"
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${siteSettings?.maintenanceMode ? 'bg-red-500' : 'bg-green-500'}`} />
                      <div>
                        <div className="text-white font-semibold">Site Status</div>
                        <div className="text-gray-400 text-sm">
                          {siteSettings?.maintenanceMode ? 'Maintenance' : 'Online'}
                        </div>
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={() => setActiveTab('contract')}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${siteSettings?.contractPaused ? 'bg-red-500' : 'bg-green-500'}`} />
                      <div>
                        <div className="text-white font-semibold">Contract</div>
                        <div className="text-gray-400 text-sm">
                          {siteSettings?.contractPaused ? 'Paused' : 'Active'}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isSuperAdmin && (
                    <button
                      onClick={() => setActiveTab('admins')}
                      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <div>
                          <div className="text-white font-semibold">Admin Users</div>
                          <div className="text-gray-400 text-sm">
                            {adminUsers.length} users
                          </div>
                        </div>
                      </div>
                    </button>
                  )}
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

          {/* Smart Contract Tab */}
          {activeTab === 'contract' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-6">NFT Contract</h3>

                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Network</div>
                    <div className="text-white font-semibold">{contractInfo?.network || 'Polygon Amoy'}</div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-gray-400 text-sm">Contract Address</div>
                      {!showEditContract && (
                        <button
                          onClick={() => {
                            setEditContractAddress(contractInfo?.address || '');
                            setShowEditContract(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {showEditContract ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editContractAddress}
                          onChange={(e) => setEditContractAddress(e.target.value)}
                          placeholder="0x..."
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white font-mono text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              // Save to environment - this would need a backend endpoint
                              alert('Contract address is configured via environment variables (CONTRACT_ADDRESS). Update this in your Render dashboard.');
                              setShowEditContract(false);
                            }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setShowEditContract(false)}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                        <p className="text-gray-500 text-xs">
                          Note: Contract address is set via the CONTRACT_ADDRESS environment variable in Render.
                        </p>
                      </div>
                    ) : contractInfo?.address ? (
                      <div className="flex items-center gap-3">
                        <code className="text-purple-400 font-mono text-sm break-all">
                          {contractInfo.address}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(contractInfo.address!);
                            alert('Address copied to clipboard');
                          }}
                          className="text-gray-400 hover:text-white text-sm"
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        Not configured yet. Set the CONTRACT_ADDRESS environment variable in Render.
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-2">Contract Status</div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          siteSettings?.contractPaused ? 'bg-red-500' : 'bg-green-500'
                        }`}
                      />
                      <span className={siteSettings?.contractPaused ? 'text-red-400' : 'text-green-400'}>
                        {siteSettings?.contractPaused ? 'Paused' : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={toggleEmergencyPause}
                      disabled={!!actionLoading}
                      className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                        siteSettings?.contractPaused
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {actionLoading === 'emergency'
                        ? 'Processing...'
                        : siteSettings?.contractPaused
                        ? 'Unpause Contract'
                        : 'Pause Contract'}
                    </button>

                    {contractInfo?.address && (
                      <a
                        href={`${contractInfo.explorerUrl}/address/${contractInfo.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        View on Polygonscan
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Users Tab */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              {!isSuperAdmin && (
                <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                  <p className="text-yellow-400">
                    You need Super Admin privileges to manage other admin users.
                    Contact the system administrator if you need access.
                  </p>
                </div>
              )}

              {isSuperAdmin && (
              <>
              {/* Create Admin Form */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4">Create Admin User</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'super_admin')}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <button
                    onClick={createAdmin}
                    disabled={!!actionLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 font-semibold transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'create-admin' ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </div>

              {/* Admin Users List */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                  <h2 className="text-xl font-bold text-white">Admin Users</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Last Login</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Created</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {adminUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                            No admin users found
                          </td>
                        </tr>
                      ) : (
                        adminUsers.map((admin) => (
                          <tr key={admin.id} className={admin.isDisabled ? 'opacity-50' : ''}>
                            <td className="px-4 py-3 text-white">
                              {admin.email}
                              {admin.id === currentAdmin?.id && (
                                <span className="ml-2 text-purple-400 text-xs">(You)</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-purple-400 capitalize">
                              {admin.role?.replace('_', ' ')}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm">
                              {admin.lastLoginAt
                                ? new Date(admin.lastLoginAt).toLocaleString()
                                : 'Never'}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm">
                              {new Date(admin.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  admin.isDisabled
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-green-500/20 text-green-400'
                                }`}
                              >
                                {admin.isDisabled ? 'Disabled' : 'Active'}
                              </span>
                            </td>
                            <td className="px-4 py-3 space-x-2">
                              {admin.id !== currentAdmin?.id && (
                                <>
                                  <button
                                    onClick={() => toggleAdminDisabled(admin.id, !!admin.isDisabled)}
                                    disabled={!!actionLoading}
                                    className={`text-sm ${
                                      admin.isDisabled
                                        ? 'text-green-400 hover:text-green-300'
                                        : 'text-yellow-400 hover:text-yellow-300'
                                    }`}
                                  >
                                    {admin.isDisabled ? 'Enable' : 'Disable'}
                                  </button>
                                  <button
                                    onClick={() => deleteAdmin(admin.id)}
                                    disabled={!!actionLoading}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              </>
              )}
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Admin</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Action</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Details</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          No audit logs found
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-gray-300 text-sm">
                            {log.adminEmail}
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
