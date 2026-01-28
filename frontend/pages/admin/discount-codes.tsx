import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minPurchaseCents: number | null;
  maxDiscountCents: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function DiscountCodesAdmin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [formDiscountValue, setFormDiscountValue] = useState(0);
  const [formMinPurchase, setFormMinPurchase] = useState('');
  const [formMaxDiscount, setFormMaxDiscount] = useState('');
  const [formMaxUses, setFormMaxUses] = useState('');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

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

      await fetchCodes();
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCodes() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/discount-codes`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes || []);
      }
    } catch (error) {
      console.error('Failed to fetch discount codes:', error);
    }
  }

  function resetForm() {
    setFormCode('');
    setFormDescription('');
    setFormDiscountType('PERCENT');
    setFormDiscountValue(0);
    setFormMinPurchase('');
    setFormMaxDiscount('');
    setFormMaxUses('');
    setFormExpiresAt('');
    setFormIsActive(true);
    setEditingCode(null);
  }

  function openEditForm(code: DiscountCode) {
    setEditingCode(code);
    setFormCode(code.code);
    setFormDescription(code.description || '');
    setFormDiscountType(code.discountType);
    setFormDiscountValue(code.discountValue);
    setFormMinPurchase(code.minPurchaseCents ? (code.minPurchaseCents / 100).toString() : '');
    setFormMaxDiscount(code.maxDiscountCents ? (code.maxDiscountCents / 100).toString() : '');
    setFormMaxUses(code.maxUses?.toString() || '');
    setFormExpiresAt(code.expiresAt ? code.expiresAt.slice(0, 16) : '');
    setFormIsActive(code.isActive);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading('save');
    setMessage(null);

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingCode
        ? `${apiUrl}/api/admin/discount-codes/${editingCode.id}`
        : `${apiUrl}/api/admin/discount-codes`;

      const res = await fetch(url, {
        method: editingCode ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code: formCode,
          description: formDescription || null,
          discountType: formDiscountType,
          discountValue: formDiscountValue,
          minPurchaseCents: formMinPurchase ? Math.round(parseFloat(formMinPurchase) * 100) : null,
          maxDiscountCents: formMaxDiscount ? Math.round(parseFloat(formMaxDiscount) * 100) : null,
          maxUses: formMaxUses ? parseInt(formMaxUses) : null,
          expiresAt: formExpiresAt || null,
          isActive: formIsActive,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: editingCode ? 'Discount code updated' : 'Discount code created' });
        setShowForm(false);
        resetForm();
        await fetchCodes();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save discount code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save discount code' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this discount code?')) return;

    setActionLoading(`delete-${id}`);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/discount-codes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Discount code deleted' });
        await fetchCodes();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete discount code' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleActive(code: DiscountCode) {
    setActionLoading(`toggle-${code.id}`);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/discount-codes/${code.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isActive: !code.isActive }),
      });

      if (res.ok) {
        await fetchCodes();
      }
    } catch (error) {
      console.error('Failed to toggle code:', error);
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
        <title>Discount Codes | CosmoNFT Admin</title>
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
              <span className="text-gray-300">Discount Codes</span>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold"
            >
              + New Code
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded ${
              message.type === 'success'
                ? 'bg-green-900/30 border border-green-600 text-green-400'
                : 'bg-red-900/30 border border-red-600 text-red-400'
            }`}>
              {message.text}
              <button onClick={() => setMessage(null)} className="float-right">&times;</button>
            </div>
          )}

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-white mb-6">
                  {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Code *</label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                      placeholder="e.g., LAUNCH50"
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Description</label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Internal note"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Discount Type</label>
                      <select
                        value={formDiscountType}
                        onChange={(e) => setFormDiscountType(e.target.value as 'PERCENT' | 'FIXED')}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      >
                        <option value="PERCENT">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Value {formDiscountType === 'PERCENT' ? '(%)' : '($)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={formDiscountType === 'PERCENT' ? 100 : undefined}
                        value={formDiscountValue}
                        onChange={(e) => setFormDiscountValue(parseInt(e.target.value) || 0)}
                        required
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Min Purchase ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formMinPurchase}
                        onChange={(e) => setFormMinPurchase(e.target.value)}
                        placeholder="Optional"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Max Discount ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formMaxDiscount}
                        onChange={(e) => setFormMaxDiscount(e.target.value)}
                        placeholder="Optional"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Max Uses</label>
                      <input
                        type="number"
                        min="1"
                        value={formMaxUses}
                        onChange={(e) => setFormMaxUses(e.target.value)}
                        placeholder="Unlimited"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Expires At</label>
                      <input
                        type="datetime-local"
                        value={formExpiresAt}
                        onChange={(e) => setFormExpiresAt(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isActive" className="text-gray-300">Active</label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={actionLoading === 'save'}
                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
                    >
                      {actionLoading === 'save' ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); resetForm(); }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Codes List */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Code</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Discount</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Usage</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No discount codes yet. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  codes.map((code) => (
                    <tr key={code.id} className="hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-white">{code.code}</div>
                        {code.description && (
                          <div className="text-gray-500 text-sm">{code.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-green-400 font-semibold">
                          {code.discountType === 'PERCENT'
                            ? `${code.discountValue}% off`
                            : `$${code.discountValue} off`
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {code.usedCount} / {code.maxUses || '∞'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(code)}
                          disabled={actionLoading === `toggle-${code.id}`}
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            code.isActive
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-gray-600/50 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          {code.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditForm(code)}
                          className="text-purple-400 hover:text-purple-300 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(code.id)}
                          disabled={actionLoading === `delete-${code.id}`}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </>
  );
}
