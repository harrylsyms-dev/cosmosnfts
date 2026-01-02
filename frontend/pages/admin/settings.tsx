import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

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

export default function AdminSettings() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Coming soon form
  const [comingSoonTitle, setComingSoonTitle] = useState('');
  const [comingSoonMessage, setComingSoonMessage] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/me', {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      setAdmin(data.admin);

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
      const res = await fetch('/api/admin/settings', {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setComingSoonTitle(data.settings.comingSoonTitle || '');
        setComingSoonMessage(data.settings.comingSoonMessage || '');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setActionLoading('password');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully. Please login again.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Redirect to login after a short delay
        setTimeout(() => {
          localStorage.removeItem('adminToken');
          router.push('/admin/login');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleGoLive() {
    if (!confirm('Are you sure you want to take the site live? Customers will be able to access the site.')) {
      return;
    }

    setActionLoading('go-live');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/settings/go-live', {
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
      const res = await fetch('/api/admin/settings/coming-soon', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: comingSoonTitle || undefined,
          message: comingSoonMessage || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSettings(data.settings);
        setMessage({ type: 'success', text: 'Coming Soon mode enabled. Customers will see the coming soon page.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to enable coming soon' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to enable coming soon' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleMaintenance() {
    const newState = !settings?.maintenanceMode;
    setActionLoading('maintenance');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/settings/maintenance', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ enabled: newState }),
      });

      const data = await res.json();

      if (res.ok) {
        setSettings(data.settings);
        setMessage({ type: 'success', text: `Maintenance mode ${newState ? 'enabled' : 'disabled'}` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to toggle maintenance' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to toggle maintenance' });
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
              <span className="text-gray-400">Settings</span>
            </div>
            <span className="text-gray-400">{admin?.email}</span>
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

          {/* Site Status */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
            <h2 className="text-xl font-bold mb-6">Site Status</h2>

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
                <div className="text-gray-400 text-sm mb-1">Coming Soon</div>
                <div className={`text-2xl font-bold ${
                  settings?.comingSoonMode ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {settings?.comingSoonMode ? 'ON' : 'OFF'}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Maintenance</div>
                <div className={`text-2xl font-bold ${
                  settings?.maintenanceMode ? 'text-red-400' : 'text-green-400'
                }`}>
                  {settings?.maintenanceMode ? 'ON' : 'OFF'}
                </div>
              </div>
            </div>

            {/* Coming Soon Settings */}
            <div className="border-t border-gray-700 pt-6 mb-6">
              <h3 className="font-bold mb-4">Coming Soon Page Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Title</label>
                  <input
                    type="text"
                    value={comingSoonTitle}
                    onChange={(e) => setComingSoonTitle(e.target.value)}
                    placeholder="CosmoNFT is Coming Soon"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Message</label>
                  <textarea
                    value={comingSoonMessage}
                    onChange={(e) => setComingSoonMessage(e.target.value)}
                    placeholder="Own a piece of the universe..."
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              {settings?.isLive ? (
                <button
                  onClick={handleEnableComingSoon}
                  disabled={actionLoading === 'coming-soon'}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-50"
                >
                  {actionLoading === 'coming-soon' ? 'Enabling...' : 'Enable Coming Soon'}
                </button>
              ) : (
                <button
                  onClick={handleGoLive}
                  disabled={actionLoading === 'go-live'}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-50"
                >
                  {actionLoading === 'go-live' ? 'Going Live...' : 'Go Live'}
                </button>
              )}

              <button
                onClick={handleToggleMaintenance}
                disabled={actionLoading === 'maintenance'}
                className={`font-bold px-6 py-3 rounded-lg disabled:opacity-50 ${
                  settings?.maintenanceMode
                    ? 'bg-gray-600 hover:bg-gray-500 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {actionLoading === 'maintenance'
                  ? 'Updating...'
                  : settings?.maintenanceMode
                    ? 'Disable Maintenance'
                    : 'Enable Maintenance'}
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-6">Change Password</h2>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                  minLength={8}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading === 'password'}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-50"
              >
                {actionLoading === 'password' ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Back Link */}
          <div className="mt-8">
            <Link href="/admin" className="text-gray-400 hover:text-white">
              &larr; Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
