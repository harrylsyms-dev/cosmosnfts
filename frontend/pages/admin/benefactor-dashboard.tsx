import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface TotalDonated {
  benefactorName: string;
  manual: {
    totalCents: number;
    totalUsd: number;
    formatted: string;
  };
  crypto: {
    totalEth: number;
    usdAtTimeOfPayment: number;
    currentUsd: number;
    formattedEth: string;
    formattedUsd: string;
  };
  grandTotal: {
    usd: number;
    formatted: string;
  };
  ethPrice: {
    current: number;
    formatted: string;
  };
  lastUpdated: string;
}

interface MonthlyBreakdown {
  month: number;
  year: number;
  manualUsd: number;
  cryptoEth: number;
  cryptoUsd: number;
  totalUsd: number;
}

interface TimelineEntry {
  date: string;
  type: 'manual' | 'crypto';
  amountUsd: number;
  amountEth?: number;
  description: string;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function BenefactorDashboard() {
  const [totalDonated, setTotalDonated] = useState<TotalDonated | null>(null);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'manual' | 'crypto'>('all');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchData();

    // Auto-refresh every minute
    const interval = setInterval(fetchData, 60000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    fetchTimeline();
  }, [filterType]);

  async function fetchData() {
    try {
      const [dashboardRes, breakdownRes] = await Promise.all([
        fetch(`${apiUrl}/api/benefactor/admin/dashboard`),
        fetch(`${apiUrl}/api/benefactor/admin/monthly-breakdown`),
      ]);

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        // Validate the response has the expected structure
        if (data.totalDonated?.grandTotal?.formatted && data.totalDonated?.manual?.formatted) {
          setTotalDonated(data.totalDonated);
        }
      }

      if (breakdownRes.ok) {
        const data = await breakdownRes.json();
        setMonthlyBreakdown(data.breakdown || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchTimeline() {
    try {
      const res = await fetch(
        `${apiUrl}/api/benefactor/admin/timeline?type=${filterType}`
      );
      if (res.ok) {
        const data = await res.json();
        setTimeline(data.timeline || []);
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    }
  }

  function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function handleExportCombined() {
    window.open(`${apiUrl}/api/benefactor/admin/export/combined`, '_blank');
  }

  // Calculate percentages for pie chart
  const manualPercent = totalDonated
    ? (totalDonated.manual.totalUsd / totalDonated.grandTotal.usd) * 100
    : 0;
  const cryptoPercent = totalDonated
    ? (totalDonated.crypto.currentUsd / totalDonated.grandTotal.usd) * 100
    : 0;

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
        <title>Total Donated Dashboard | Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <Link href="/admin" className="text-gray-400 hover:text-white text-sm">
                &larr; Back to Admin
              </Link>
              <h1 className="text-xl font-bold text-white mt-1">Total Donated Dashboard</h1>
            </div>
            <nav className="flex gap-4">
              <Link href="/admin/benefactor" className="text-gray-400 hover:text-white text-sm">
                Manual Payments
              </Link>
              <Link href="/admin/benefactor-crypto" className="text-gray-400 hover:text-white text-sm">
                Crypto Payments
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Grand Total Card */}
          {totalDonated && (
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-8 border border-purple-500/30 mb-8">
              <div className="text-center mb-6">
                <div className="text-gray-400 text-sm mb-2">Supporting Space Exploration</div>
                <div className="text-5xl font-bold text-white mb-2">
                  {totalDonated.grandTotal.formatted}
                </div>
                <div className="text-gray-400 text-sm">
                  Total Donated (All-Time)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-gray-400 text-sm">Manual Payments (USD)</div>
                  <div className="text-2xl font-bold text-green-400">
                    {totalDonated.manual.formatted}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {manualPercent.toFixed(1)}% of total
                  </div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-gray-400 text-sm">Smart Contract (ETH)</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {totalDonated.crypto.formattedEth}
                  </div>
                  <div className="text-yellow-400 text-sm">
                    = {totalDonated.crypto.formattedUsd}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {cryptoPercent.toFixed(1)}% of total
                  </div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-gray-400 text-sm">Current ETH Price</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {totalDonated.ethPrice.formatted}
                  </div>
                  <div className="text-gray-500 text-xs">
                    Updates every 30 seconds
                  </div>
                </div>
              </div>

              <div className="text-center mt-4 text-gray-500 text-xs">
                Last updated: {new Date(totalDonated.lastUpdated).toLocaleString()}
              </div>
            </div>
          )}

          {/* Split Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Pie Chart Representation */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-4">Donation Split</h2>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Manual payments slice */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#22c55e"
                      strokeWidth="20"
                      strokeDasharray={`${manualPercent * 2.51327} ${251.327 - manualPercent * 2.51327}`}
                      strokeDashoffset="62.83"
                      transform="rotate(-90 50 50)"
                    />
                    {/* Crypto payments slice */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#a855f7"
                      strokeWidth="20"
                      strokeDasharray={`${cryptoPercent * 2.51327} ${251.327 - cryptoPercent * 2.51327}`}
                      strokeDashoffset={`${62.83 - manualPercent * 2.51327}`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-400 text-sm">Manual (USD)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-gray-400 text-sm">Crypto (ETH)</span>
                </div>
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-4">Monthly Donations</h2>
              <div className="space-y-2">
                {monthlyBreakdown.slice(0, 6).map((month) => (
                  <div key={`${month.year}-${month.month}`} className="flex items-center gap-3">
                    <div className="w-16 text-gray-400 text-sm">
                      {MONTH_NAMES[month.month - 1]} {month.year.toString().slice(-2)}
                    </div>
                    <div className="flex-1 h-6 bg-gray-800 rounded overflow-hidden flex">
                      <div
                        className="h-full bg-green-500/70"
                        style={{
                          width: `${(month.manualUsd / (monthlyBreakdown[0]?.totalUsd || 1)) * 100}%`,
                        }}
                      />
                      <div
                        className="h-full bg-purple-500/70"
                        style={{
                          width: `${(month.cryptoUsd / (monthlyBreakdown[0]?.totalUsd || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="w-24 text-right text-white text-sm">
                      {formatCurrency(month.totalUsd)}
                    </div>
                  </div>
                ))}
                {monthlyBreakdown.length === 0 && (
                  <div className="text-gray-400 text-center py-4">No data yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Combined Timeline */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Donation Timeline</h2>
              <div className="flex gap-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm"
                >
                  <option value="all">All Donations</option>
                  <option value="manual">Manual Only</option>
                  <option value="crypto">Crypto Only</option>
                </select>
                <button
                  onClick={handleExportCombined}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  Export CSV
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Amount (USD)</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Amount (ETH)</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {timeline.map((entry, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          entry.type === 'manual'
                            ? 'bg-green-600/30 text-green-400'
                            : 'bg-purple-600/30 text-purple-400'
                        }`}>
                          {entry.type === 'manual' ? 'Manual' : 'Crypto'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-yellow-400 font-semibold">
                        {formatCurrency(entry.amountUsd)}
                      </td>
                      <td className="px-4 py-3 text-purple-400">
                        {entry.amountEth ? `${entry.amountEth.toFixed(6)} ETH` : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {entry.description}
                      </td>
                    </tr>
                  ))}
                  {timeline.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        No donations recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
