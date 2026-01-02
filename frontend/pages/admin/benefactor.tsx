import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface BenefactorPayment {
  id: string;
  month: number;
  year: number;
  primarySalesCents: number;
  auctionSalesCents: number;
  totalOwedCents: number;
  primaryRevenueCents: number;
  auctionRevenueCents: number;
  paymentMethodName: string | null;
  referenceNumber: string | null;
  notes: string | null;
  status: string;
  dueDate: string;
  paidAt: string | null;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

interface ReminderInfo {
  showPopup: boolean;
  payment: BenefactorPayment;
  reminderType: string | null;
  daysOverdue: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function BenefactorPaymentTracker() {
  const [currentPayment, setCurrentPayment] = useState<BenefactorPayment | null>(null);
  const [reminder, setReminder] = useState<ReminderInfo | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<BenefactorPayment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Payment form
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [customMethod, setCustomMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New payment method
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodDesc, setNewMethodDesc] = useState('');

  // Filters
  const [filterYear, setFilterYear] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [currentRes, historyRes, methodsRes] = await Promise.all([
        fetch(`${apiUrl}/api/benefactor/admin/payments/current`),
        fetch(`${apiUrl}/api/benefactor/admin/payments/history`),
        fetch(`${apiUrl}/api/benefactor/admin/payment-methods`),
      ]);

      if (currentRes.ok) {
        const data = await currentRes.json();
        setCurrentPayment(data.payment);
        setReminder(data.reminder);
        if (data.reminder?.showPopup && data.payment?.status !== 'PAID') {
          setShowPopup(true);
        }
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setPaymentHistory(data.payments || []);
      }

      if (methodsRes.ok) {
        const data = await methodsRes.json();
        setPaymentMethods(data.methods || []);
        // Set default method
        const defaultMethod = data.methods?.find((m: PaymentMethod) => m.isDefault);
        if (defaultMethod) {
          setSelectedMethodId(defaultMethod.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkAsPaid() {
    if (!currentPayment) return;

    const methodName = selectedMethodId
      ? paymentMethods.find((m) => m.id === selectedMethodId)?.name
      : customMethod;

    if (!methodName) {
      alert('Please select or enter a payment method');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/benefactor/admin/payments/${currentPayment.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: selectedMethodId || undefined,
          paymentMethodName: methodName,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        setShowPayModal(false);
        setShowPopup(false);
        setReferenceNumber('');
        setNotes('');
        fetchData();
        alert('Payment marked as paid!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to mark as paid');
      }
    } catch (error) {
      console.error('Failed to mark as paid:', error);
      alert('Failed to mark as paid');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSnooze() {
    if (!currentPayment) return;

    try {
      await fetch(`${apiUrl}/api/benefactor/admin/payments/${currentPayment.id}/snooze`, {
        method: 'POST',
      });
      setShowPopup(false);
    } catch (error) {
      console.error('Failed to snooze:', error);
    }
  }

  async function handleAddPaymentMethod() {
    if (!newMethodName.trim()) {
      alert('Please enter a method name');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/benefactor/admin/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMethodName,
          description: newMethodDesc || undefined,
        }),
      });

      if (res.ok) {
        setNewMethodName('');
        setNewMethodDesc('');
        setShowMethodModal(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add payment method');
      }
    } catch (error) {
      console.error('Failed to add payment method:', error);
    }
  }

  async function handleDeleteMethod(id: string) {
    if (!confirm('Delete this payment method?')) return;

    try {
      await fetch(`${apiUrl}/api/benefactor/admin/payment-methods/${id}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete method:', error);
    }
  }

  async function handleExportCSV() {
    const url = filterYear
      ? `${apiUrl}/api/benefactor/admin/payments/export?year=${filterYear}`
      : `${apiUrl}/api/benefactor/admin/payments/export`;

    window.open(url, '_blank');
  }

  function formatCurrency(cents: number): string {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PAID':
        return 'bg-green-600/30 text-green-400';
      case 'UNPAID':
        return 'bg-yellow-600/30 text-yellow-400';
      case 'LATE':
        return 'bg-red-600/30 text-red-400';
      default:
        return 'bg-gray-600/30 text-gray-400';
    }
  }

  const filteredHistory = filterYear
    ? paymentHistory.filter((p) => p.year === filterYear)
    : paymentHistory;

  const years = Array.from(new Set(paymentHistory.map((p) => p.year))).sort((a, b) => b - a);

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
        <title>Benefactor Payment Tracker | Admin</title>
      </Head>

      {/* Payment Due Popup */}
      {showPopup && currentPayment && currentPayment.status !== 'PAID' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full mx-4 border-2 border-yellow-500">
            <div className="text-center mb-6">
              <div className="text-yellow-400 text-4xl mb-2">!</div>
              <h2 className="text-2xl font-bold text-white">
                Benefactor Payment Due - {MONTH_NAMES[currentPayment.month - 1]} {currentPayment.year}
              </h2>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="text-gray-400 text-sm mb-2">Amount Owed</div>
              <div className="text-3xl font-bold text-red-400 mb-4">
                {formatCurrency(currentPayment.totalOwedCents)}
              </div>

              <div className="text-sm text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Primary sales (Stripe):</span>
                  <span className="text-white">{formatCurrency(currentPayment.primarySalesCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Auction sales (Stripe/USD):</span>
                  <span className="text-white">{formatCurrency(currentPayment.auctionSalesCents)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  * Crypto transactions are NOT included (auto-paid by smart contract)
                </div>
              </div>
            </div>

            {reminder && reminder.daysOverdue > 0 && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-center">
                <span className="text-red-400 font-semibold">
                  Payment overdue by {reminder.daysOverdue} days
                </span>
              </div>
            )}

            <div className="text-gray-400 text-sm text-center mb-4">
              Status: <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(currentPayment.status)}`}>
                {currentPayment.status}
              </span>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowPopup(false);
                  setShowPayModal(true);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
              >
                Mark as Paid
              </button>
              <button
                onClick={handleSnooze}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
              >
                Snooze
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <Link href="/admin" className="text-gray-400 hover:text-white text-sm">
                &larr; Back to Admin
              </Link>
              <h1 className="text-xl font-bold text-white mt-1">Benefactor Payment Tracker</h1>
            </div>
            <nav className="flex gap-4">
              <Link
                href="/admin/benefactor-crypto"
                className="text-gray-400 hover:text-white text-sm"
              >
                Crypto Payments &rarr;
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Current Month Card */}
          {currentPayment && (
            <div className={`bg-gray-900 rounded-lg p-6 border mb-8 ${
              currentPayment.status === 'LATE' ? 'border-red-500' :
              currentPayment.status === 'UNPAID' ? 'border-yellow-500' : 'border-green-500'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {MONTH_NAMES[currentPayment.month - 1]} {currentPayment.year}
                  </h2>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(currentPayment.status)}`}>
                    {currentPayment.status}
                  </span>
                </div>
                {currentPayment.status !== 'PAID' && (
                  <button
                    onClick={() => setShowPayModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Total Owed (30%)</div>
                  <div className="text-2xl font-bold text-red-400">
                    {formatCurrency(currentPayment.totalOwedCents)}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Primary Sales (Stripe)</div>
                  <div className="text-lg text-white">
                    Revenue: {formatCurrency(currentPayment.primaryRevenueCents)}
                  </div>
                  <div className="text-sm text-gray-400">
                    Your 70%: {formatCurrency(currentPayment.primaryRevenueCents * 0.7)}
                  </div>
                  <div className="text-sm text-yellow-400">
                    Owed 30%: {formatCurrency(currentPayment.primarySalesCents)}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">USD Auction Sales</div>
                  <div className="text-lg text-white">
                    Revenue: {formatCurrency(currentPayment.auctionRevenueCents)}
                  </div>
                  <div className="text-sm text-gray-400">
                    Your 70%: {formatCurrency(currentPayment.auctionRevenueCents * 0.7)}
                  </div>
                  <div className="text-sm text-yellow-400">
                    Owed 30%: {formatCurrency(currentPayment.auctionSalesCents)}
                  </div>
                </div>
              </div>

              {currentPayment.status === 'PAID' && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400">
                    Paid on {new Date(currentPayment.paidAt!).toLocaleDateString()} via {currentPayment.paymentMethodName}
                    {currentPayment.referenceNumber && (
                      <span> (Ref: {currentPayment.referenceNumber})</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Methods */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Payment Methods</h2>
              <button
                onClick={() => setShowMethodModal(true)}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                + Add New
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="bg-gray-800 px-3 py-2 rounded-lg flex items-center gap-2"
                >
                  <span className="text-white">{method.name}</span>
                  {method.isDefault && (
                    <span className="text-xs text-green-400">(default)</span>
                  )}
                  <button
                    onClick={() => handleDeleteMethod(method.id)}
                    className="text-red-400 hover:text-red-300 text-xs ml-2"
                  >
                    x
                  </button>
                </div>
              ))}
              {paymentMethods.length === 0 && (
                <div className="text-gray-400 text-sm">No payment methods saved</div>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Payment History</h2>
              <div className="flex gap-4">
                <select
                  value={filterYear || ''}
                  onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : null)}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm"
                >
                  <option value="">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <button
                  onClick={handleExportCSV}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  Export CSV
                </button>
              </div>
            </div>
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Month</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Primary Sales</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Auction (USD)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Total Owed</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Date Paid</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Method</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Ref #</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-white">
                      {MONTH_NAMES[payment.month - 1]} {payment.year}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {formatCurrency(payment.primarySalesCents)}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {formatCurrency(payment.auctionSalesCents)}
                    </td>
                    <td className="px-4 py-3 text-yellow-400 font-semibold">
                      {formatCurrency(payment.totalOwedCents)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {payment.paymentMethodName || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {payment.referenceNumber || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      No payment history
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Mark as Paid Modal */}
      {showPayModal && currentPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">Mark Payment as Paid</h3>

            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="text-gray-400 text-sm">Amount</div>
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(currentPayment.totalOwedCents)}
              </div>
              <div className="text-gray-500 text-sm">
                {MONTH_NAMES[currentPayment.month - 1]} {currentPayment.year}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Payment Method</label>
                <select
                  value={selectedMethodId}
                  onChange={(e) => {
                    setSelectedMethodId(e.target.value);
                    if (e.target.value) setCustomMethod('');
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select or enter custom...</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedMethodId && (
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Custom Payment Method</label>
                  <input
                    type="text"
                    value={customMethod}
                    onChange={(e) => setCustomMethod(e.target.value)}
                    placeholder="e.g., PayPal, Venmo"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-sm mb-1">Reference/Confirmation #</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Transaction ID or confirmation number"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes"
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleMarkAsPaid}
                disabled={isSubmitting || (!selectedMethodId && !customMethod)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Confirm Payment'}
              </button>
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showMethodModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">Add Payment Method</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Method Name</label>
                <input
                  type="text"
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  placeholder="e.g., Bank Transfer, Wire, Check"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newMethodDesc}
                  onChange={(e) => setNewMethodDesc(e.target.value)}
                  placeholder="Additional details"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddPaymentMethod}
                disabled={!newMethodName.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
              >
                Add Method
              </button>
              <button
                onClick={() => setShowMethodModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
