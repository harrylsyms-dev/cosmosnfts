import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface SalesStats {
  totalRevenue: number;
  totalOrders: number;
  totalNftsSold: number;
  todayRevenue: number;
  todayOrders: number;
  weekRevenue: number;
  weekOrders: number;
  monthRevenue: number;
  monthOrders: number;
  tpsShare: number;
  averageOrderValue: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
}

export default function AdminSales() {
  const router = useRouter();
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

      await fetchStats();
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/sales/stats`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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
        <title>Sales Dashboard | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold text-white hover:text-gray-300">
                CosmoNFT Admin
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400">Sales Dashboard</span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Sales Dashboard</h1>
            <Link
              href="/admin/orders"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg"
            >
              View All Orders
            </Link>
          </div>

          {stats ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-400">${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold">{stats.totalOrders.toLocaleString()}</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <p className="text-gray-400 text-sm">NFTs Sold</p>
                  <p className="text-3xl font-bold text-blue-400">{stats.totalNftsSold.toLocaleString()}</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-6 border border-purple-800">
                  <p className="text-gray-400 text-sm">TPS Share (30%)</p>
                  <p className="text-3xl font-bold text-purple-400">${stats.tpsShare.toLocaleString()}</p>
                </div>
              </div>

              {/* Period Stats */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold mb-4">Today</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Revenue</span>
                      <span className="text-green-400 font-bold">${stats.todayRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Orders</span>
                      <span className="font-bold">{stats.todayOrders}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold mb-4">This Week</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Revenue</span>
                      <span className="text-green-400 font-bold">${stats.weekRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Orders</span>
                      <span className="font-bold">{stats.weekOrders}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold mb-4">This Month</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Revenue</span>
                      <span className="text-green-400 font-bold">${stats.monthRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Orders</span>
                      <span className="font-bold">{stats.monthOrders}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Average Order Value */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-sm">Average Order Value</p>
                    <p className="text-2xl font-bold">${stats.averageOrderValue.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">NFTs per Order (avg)</p>
                    <p className="text-2xl font-bold">
                      {stats.totalOrders > 0 ? (stats.totalNftsSold / stats.totalOrders).toFixed(1) : '0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenue Area Chart */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
                <h3 className="text-lg font-semibold mb-4">Revenue Trend (Last 30 Days)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.revenueByDay}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(value) => value.slice(5)}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value) => [`$${(value as number)?.toLocaleString() ?? '0'}`, 'Revenue']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10B981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Orders Bar Chart */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
                <h3 className="text-lg font-semibold mb-4">Daily Orders (Last 30 Days)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(value) => value.slice(5)}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value) => [value ?? 0, 'Orders']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Bar
                        dataKey="orders"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Combined Chart */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
                <h3 className="text-lg font-semibold mb-4">Revenue vs Orders</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(value) => value.slice(5)}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="#10B981"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#3B82F6"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value, name) => [
                          name === 'revenue' ? `$${(value as number)?.toLocaleString() ?? '0'}` : (value ?? 0),
                          name === 'revenue' ? 'Revenue' : 'Orders'
                        ]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend
                        wrapperStyle={{ color: '#9CA3AF' }}
                        formatter={(value) => value === 'revenue' ? 'Revenue' : 'Orders'}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="revenue"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                        name="revenue"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="orders"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        name="orders"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-900 rounded-lg p-12 text-center">
              <p className="text-gray-400 text-xl">No sales data yet</p>
              <p className="text-gray-500 mt-2">Sales statistics will appear here once you have orders.</p>
            </div>
          )}

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
