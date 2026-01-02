import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface Order {
  id: string;
  email: string;
  walletAddress: string | null;
  status: string;
  totalAmount: number;
  nftCount: number;
  stripeId: string | null;
  createdAt: string;
  mintedAt: string | null;
}

interface OrderDetail {
  id: string;
  email: string;
  walletAddress: string | null;
  status: string;
  totalAmount: number;
  stripeId: string | null;
  createdAt: string;
  mintedAt: string | null;
  nfts: {
    id: number;
    tokenId: number;
    name: string;
    price: number;
    status: string;
    transactionHash: string | null;
  }[];
}

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchOrders();
    }
  }, [page, filterStatus]);

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

      await fetchOrders();
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchOrders() {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (search) params.append('search', search);

      const res = await fetch(`${apiUrl}/api/admin/orders?${params}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }

  async function fetchOrderDetail(orderId: string) {
    setLoadingDetail(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/orders/${orderId}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data.order);
      }
    } catch (error) {
      console.error('Failed to fetch order detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  }

  function getStatusColor(status: string) {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-900 text-green-300';
      case 'PENDING':
        return 'bg-yellow-900 text-yellow-300';
      case 'FAILED':
        return 'bg-red-900 text-red-300';
      case 'MINTED':
        return 'bg-blue-900 text-blue-300';
      default:
        return 'bg-gray-700 text-gray-300';
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
        <title>Orders | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold text-white hover:text-gray-300">
                CosmoNFT Admin
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400">Orders</span>
            </div>
            <Link
              href="/admin/sales"
              className="text-blue-400 hover:text-blue-300"
            >
              View Sales Dashboard
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Order Management</h1>

          {/* Filters */}
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <form onSubmit={handleSearch} className="grid md:grid-cols-3 gap-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email, order ID, or wallet..."
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="MINTED">Minted</option>
                <option value="FAILED">Failed</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg"
              >
                Search
              </button>
            </form>
          </div>

          {/* Orders Table */}
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <p className="text-xl mb-2">No orders found</p>
                <p>Orders will appear here when customers make purchases.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left">Order ID</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Amount</th>
                      <th className="px-4 py-3 text-left">NFTs</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm">{order.id.slice(0, 8)}...</span>
                        </td>
                        <td className="px-4 py-3">{order.email}</td>
                        <td className="px-4 py-3 font-bold text-green-400">
                          ${order.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">{order.nftCount}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => fetchOrderDetail(order.id)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}

          <div className="mt-8">
            <Link href="/admin" className="text-gray-400 hover:text-white">
              &larr; Back to Dashboard
            </Link>
          </div>
        </main>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {loadingDetail ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="space-y-6">
                  {/* Order Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Order ID</p>
                      <p className="font-mono text-sm">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Status</p>
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Email</p>
                      <p>{selectedOrder.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Amount</p>
                      <p className="text-green-400 font-bold">${selectedOrder.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Wallet Address</p>
                      <p className="font-mono text-sm break-all">{selectedOrder.walletAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Created At</p>
                      <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    </div>
                    {selectedOrder.stripeId && (
                      <div className="col-span-2">
                        <p className="text-gray-400 text-sm">Stripe Transaction ID</p>
                        <p className="font-mono text-sm">{selectedOrder.stripeId}</p>
                      </div>
                    )}
                  </div>

                  {/* NFTs */}
                  <div>
                    <h3 className="font-semibold mb-3">NFTs ({selectedOrder.nfts.length})</h3>
                    <div className="space-y-2">
                      {selectedOrder.nfts.map((nft) => (
                        <div key={nft.id} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium">{nft.name}</p>
                            <p className="text-gray-400 text-sm">Token #{nft.tokenId}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${nft.price.toFixed(2)}</p>
                            {nft.transactionHash && (
                              <a
                                href={`https://polygonscan.com/tx/${nft.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 text-sm hover:underline"
                              >
                                View TX
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
