import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface User {
  id: string;
  walletAddress: string;
  email: string | null;
  createdAt: string;
  totalPurchases: number;
  totalSpentCents: number;
  nftCount: number;
}

interface BannedAddress {
  id: string;
  walletAddress: string;
  reason: string | null;
  bannedBy: string;
  bannedAt: string;
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [bannedAddresses, setBannedAddresses] = useState<BannedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'banned'>('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banAddress, setBanAddress] = useState('');

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

      await Promise.all([fetchUsers(), fetchBannedAddresses()]);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/users`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }

  async function fetchBannedAddresses() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/banned-addresses`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setBannedAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error('Failed to fetch banned addresses:', error);
    }
  }

  async function banUser(walletAddress: string, reason: string) {
    if (!confirm(`Ban wallet ${walletAddress}?`)) return;

    setActionLoading(`ban-${walletAddress}`);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/banned-addresses`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ walletAddress, reason }),
      });

      if (res.ok) {
        await fetchBannedAddresses();
        setBanAddress('');
        setBanReason('');
        alert('Address banned successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to ban address');
      }
    } catch (error) {
      console.error('Failed to ban user:', error);
      alert('Failed to ban address');
    } finally {
      setActionLoading(null);
    }
  }

  async function unbanUser(id: string) {
    if (!confirm('Unban this address?')) return;

    setActionLoading(`unban-${id}`);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/banned-addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await fetchBannedAddresses();
        alert('Address unbanned successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to unban address');
      }
    } catch (error) {
      console.error('Failed to unban user:', error);
      alert('Failed to unban address');
    } finally {
      setActionLoading(null);
    }
  }

  async function exportUsers() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/users/export`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export users');
      }
    } catch (error) {
      console.error('Failed to export users:', error);
      alert('Failed to export users');
    }
  }

  function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.walletAddress.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

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
        <title>User Management | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold text-white hover:text-gray-300">
                CosmoNFT Admin
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-300">User Management</span>
            </div>
            <nav className="flex gap-4">
              <Link href="/admin/site" className="text-gray-400 hover:text-white">Site</Link>
              <Link href="/admin/sales" className="text-gray-400 hover:text-white">Sales</Link>
              <Link href="/admin/security" className="text-gray-400 hover:text-white">Security</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Total Users</div>
              <div className="text-3xl font-bold text-white">{users.length}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">With Email</div>
              <div className="text-3xl font-bold text-blue-400">
                {users.filter((u) => u.email).length}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Buyers</div>
              <div className="text-3xl font-bold text-green-400">
                {users.filter((u) => u.totalPurchases > 0).length}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Banned</div>
              <div className="text-3xl font-bold text-red-400">{bannedAddresses.length}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('banned')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'banned'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Banned ({bannedAddresses.length})
            </button>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row gap-4 justify-between">
                <input
                  type="text"
                  placeholder="Search by wallet or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white w-full md:w-96"
                />
                <button
                  onClick={exportUsers}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-semibold transition-colors"
                >
                  Export CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Wallet</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Purchases</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Spent</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">NFTs</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Joined</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-3 font-mono text-sm text-white">
                            {formatAddress(user.walletAddress)}
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {user.email || <span className="text-gray-500">-</span>}
                          </td>
                          <td className="px-4 py-3 text-blue-400">{user.totalPurchases}</td>
                          <td className="px-4 py-3 text-green-400">
                            {formatPrice(user.totalSpentCents)}
                          </td>
                          <td className="px-4 py-3 text-purple-400">{user.nftCount}</td>
                          <td className="px-4 py-3 text-gray-400 text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 space-x-2">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                setBanAddress(user.walletAddress);
                                setActiveTab('banned');
                              }}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Ban
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Banned Tab */}
          {activeTab === 'banned' && (
            <div className="space-y-6">
              {/* Ban Form */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Ban an Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Wallet Address (0x...)"
                    value={banAddress}
                    onChange={(e) => setBanAddress(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <button
                    onClick={() => banUser(banAddress, banReason)}
                    disabled={!banAddress || !!actionLoading}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-semibold transition-colors disabled:opacity-50"
                  >
                    Ban Address
                  </button>
                </div>
              </div>

              {/* Banned List */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                  <h2 className="text-xl font-bold text-white">Banned Addresses</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Address</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Reason</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Banned By</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {bannedAddresses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                            No banned addresses
                          </td>
                        </tr>
                      ) : (
                        bannedAddresses.map((banned) => (
                          <tr key={banned.id}>
                            <td className="px-4 py-3 font-mono text-sm text-white">
                              {formatAddress(banned.walletAddress)}
                            </td>
                            <td className="px-4 py-3 text-gray-300">
                              {banned.reason || <span className="text-gray-500">-</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-400">{banned.bannedBy}</td>
                            <td className="px-4 py-3 text-gray-400 text-sm">
                              {new Date(banned.bannedAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => unbanUser(banned.id)}
                                disabled={!!actionLoading}
                                className="text-green-400 hover:text-green-300 text-sm"
                              >
                                Unban
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* User Detail Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-4">User Details</h3>

                <div className="space-y-4">
                  <div>
                    <div className="text-gray-400 text-sm">Wallet Address</div>
                    <div className="text-white font-mono text-sm break-all">
                      {selectedUser.walletAddress}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-sm">Email</div>
                    <div className="text-white">{selectedUser.email || '-'}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-gray-400 text-sm">Purchases</div>
                      <div className="text-blue-400 font-semibold">{selectedUser.totalPurchases}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Spent</div>
                      <div className="text-green-400 font-semibold">
                        {formatPrice(selectedUser.totalSpentCents)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">NFTs</div>
                      <div className="text-purple-400 font-semibold">{selectedUser.nftCount}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-sm">Joined</div>
                    <div className="text-white">
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => {
                      setBanAddress(selectedUser.walletAddress);
                      setActiveTab('banned');
                      setSelectedUser(null);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-semibold transition-colors"
                  >
                    Ban User
                  </button>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-2 font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
