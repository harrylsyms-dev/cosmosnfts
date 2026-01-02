import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface SmartContractPayment {
  id: string;
  transactionType: string;
  ethAmount: number;
  usdValueAtTime: number;
  ethPriceAtTime: number;
  tokenId: number | null;
  nftName: string | null;
  transactionHash: string;
  fromWallet: string;
  toWallet: string;
  status: string;
  createdAt: string;
}

interface MonthlyAggregate {
  month: number;
  year: number;
  auctionEth: number;
  royaltyEth: number;
  totalEth: number;
  usdValueAtTime: number;
  currentUsdValue: number;
  transactionCount: number;
  transactions: SmartContractPayment[];
  ethPrice: number;
}

interface ContractStatus {
  benefactorWallet: string | null;
  creatorWallet: string | null;
  splitPercent: { benefactor: number; creator: number };
  lastTransaction: SmartContractPayment | null;
  allTime: {
    totalEth: number;
    totalUsdAtTime: number;
    currentUsdValue: number;
    transactionCount: number;
  };
  currentEthPrice: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function BenefactorCryptoReport() {
  const [monthlyData, setMonthlyData] = useState<MonthlyAggregate[]>([]);
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'aggregate' | 'individual'>('aggregate');
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [searchHash, setSearchHash] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [monthlyRes, statusRes] = await Promise.all([
        fetch(`${apiUrl}/api/benefactor/admin/crypto/payments/monthly`),
        fetch(`${apiUrl}/api/benefactor/admin/crypto/status`),
      ]);

      if (monthlyRes.ok) {
        const data = await monthlyRes.json();
        setMonthlyData(data.months || []);
      }

      if (statusRes.ok) {
        const data = await statusRes.json();
        setContractStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatEth(amount: number): string {
    return `${amount.toFixed(6)} ETH`;
  }

  function shortenAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function shortenHash(hash: string): string {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  }

  function getPolygonscanUrl(hash: string): string {
    return `https://polygonscan.com/tx/${hash}`;
  }

  function getPolygonscanAddressUrl(address: string): string {
    return `https://polygonscan.com/address/${address}`;
  }

  function handleExportCSV() {
    window.open(`${apiUrl}/api/benefactor/admin/crypto/export`, '_blank');
  }

  // Get all individual transactions
  const allTransactions = monthlyData.flatMap((m) => m.transactions);

  // Filter transactions
  const filteredTransactions = allTransactions.filter((t) => {
    if (filterType && t.transactionType !== filterType) return false;
    if (searchHash && !t.transactionHash.toLowerCase().includes(searchHash.toLowerCase())) return false;
    return true;
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
        <title>Smart Contract Payments | Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <Link href="/admin" className="text-gray-400 hover:text-white text-sm">
                &larr; Back to Admin
              </Link>
              <h1 className="text-xl font-bold text-white mt-1">Smart Contract Payment Report</h1>
            </div>
            <nav className="flex gap-4">
              <Link
                href="/admin/benefactor"
                className="text-gray-400 hover:text-white text-sm"
              >
                &larr; Manual Payments
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Contract Status */}
          {contractStatus && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Smart Contract Status</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Total Sent (All-Time)</div>
                  <div className="text-xl font-bold text-purple-400">
                    {formatEth(contractStatus.allTime.totalEth)}
                  </div>
                  <div className="text-sm text-gray-500">
                    = {formatCurrency(contractStatus.allTime.currentUsdValue)}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Transaction Count</div>
                  <div className="text-xl font-bold text-blue-400">
                    {contractStatus.allTime.transactionCount}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Current ETH Price</div>
                  <div className="text-xl font-bold text-green-400">
                    {formatCurrency(contractStatus.currentEthPrice)}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Split Ratio</div>
                  <div className="text-xl font-bold text-white">
                    {contractStatus.splitPercent.creator}% / {contractStatus.splitPercent.benefactor}%
                  </div>
                  <div className="text-xs text-gray-500">Creator / Benefactor</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Creator Wallet</div>
                  {contractStatus.creatorWallet ? (
                    <a
                      href={getPolygonscanAddressUrl(contractStatus.creatorWallet)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 font-mono text-sm"
                    >
                      {contractStatus.creatorWallet}
                    </a>
                  ) : (
                    <span className="text-gray-500">Not configured</span>
                  )}
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Benefactor Wallet</div>
                  {contractStatus.benefactorWallet ? (
                    <a
                      href={getPolygonscanAddressUrl(contractStatus.benefactorWallet)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 font-mono text-sm"
                    >
                      {contractStatus.benefactorWallet}
                    </a>
                  ) : (
                    <span className="text-gray-500">Not configured</span>
                  )}
                </div>
              </div>

              {contractStatus.lastTransaction && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-gray-400 text-sm">Last Transaction</div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-white">
                      {formatEth(contractStatus.lastTransaction.ethAmount)}
                    </span>
                    <span className="text-gray-500">
                      {new Date(contractStatus.lastTransaction.createdAt).toLocaleString()}
                    </span>
                    <a
                      href={getPolygonscanUrl(contractStatus.lastTransaction.transactionHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      View on Polygonscan
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View Toggle */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('aggregate')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  viewMode === 'aggregate'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                View Monthly Aggregate
              </button>
              <button
                onClick={() => setViewMode('individual')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  viewMode === 'individual'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                View Individual Transactions
              </button>
            </div>
            <button
              onClick={handleExportCSV}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              Export CSV
            </button>
          </div>

          {/* Monthly Aggregate View */}
          {viewMode === 'aggregate' && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Month</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Auction Sales</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Creator Royalties</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Total ETH</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">USD Value (Current)</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Transactions</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {monthlyData.map((month) => {
                    const key = `${month.year}-${month.month}`;
                    const isExpanded = expandedMonth === key;

                    return (
                      <>
                        <tr key={key} className="hover:bg-gray-800/50 cursor-pointer" onClick={() => setExpandedMonth(isExpanded ? null : key)}>
                          <td className="px-4 py-3 text-white font-semibold">
                            {MONTH_NAMES[month.month - 1]} {month.year}
                          </td>
                          <td className="px-4 py-3 text-purple-400">
                            {formatEth(month.auctionEth)}
                          </td>
                          <td className="px-4 py-3 text-blue-400">
                            {formatEth(month.royaltyEth)}
                          </td>
                          <td className="px-4 py-3 text-green-400 font-semibold">
                            {formatEth(month.totalEth)}
                          </td>
                          <td className="px-4 py-3 text-yellow-400">
                            {formatCurrency(month.currentUsdValue)}
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            {month.transactionCount}
                          </td>
                          <td className="px-4 py-3 text-purple-400">
                            {isExpanded ? '▼' : '▶'}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${key}-expanded`}>
                            <td colSpan={7} className="bg-gray-800/50">
                              <div className="p-4">
                                <table className="w-full">
                                  <thead>
                                    <tr className="text-gray-400 text-sm">
                                      <th className="text-left py-2">Date</th>
                                      <th className="text-left py-2">Type</th>
                                      <th className="text-left py-2">ETH Amount</th>
                                      <th className="text-left py-2">USD (at time)</th>
                                      <th className="text-left py-2">NFT</th>
                                      <th className="text-left py-2">Transaction</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {month.transactions.map((tx) => (
                                      <tr key={tx.id} className="text-sm border-t border-gray-700">
                                        <td className="py-2 text-gray-300">
                                          {new Date(tx.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-2">
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            tx.transactionType === 'AUCTION_SALE'
                                              ? 'bg-purple-600/30 text-purple-400'
                                              : 'bg-blue-600/30 text-blue-400'
                                          }`}>
                                            {tx.transactionType === 'AUCTION_SALE' ? 'Auction' : 'Royalty'}
                                          </span>
                                        </td>
                                        <td className="py-2 text-green-400">{formatEth(tx.ethAmount)}</td>
                                        <td className="py-2 text-gray-400">{formatCurrency(tx.usdValueAtTime)}</td>
                                        <td className="py-2 text-gray-300">{tx.nftName || '-'}</td>
                                        <td className="py-2">
                                          <a
                                            href={getPolygonscanUrl(tx.transactionHash)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-400 hover:text-purple-300"
                                          >
                                            {shortenHash(tx.transactionHash)}
                                          </a>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                  {monthlyData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        No smart contract payments recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Individual Transactions View */}
          {viewMode === 'individual' && (
            <>
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="">All Types</option>
                  <option value="AUCTION_SALE">Auction Sales</option>
                  <option value="CREATOR_ROYALTY">Creator Royalties</option>
                </select>
                <input
                  type="text"
                  value={searchHash}
                  onChange={(e) => setSearchHash(e.target.value)}
                  placeholder="Search by transaction hash..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                />
              </div>

              <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Date/Time</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">ETH Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">USD (at time)</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">ETH Price</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">NFT</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Transaction Hash</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">To Wallet</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-4 py-3 text-gray-300 text-sm">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            tx.transactionType === 'AUCTION_SALE'
                              ? 'bg-purple-600/30 text-purple-400'
                              : 'bg-blue-600/30 text-blue-400'
                          }`}>
                            {tx.transactionType === 'AUCTION_SALE' ? 'Auction Sale' : 'Creator Royalty'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-green-400 font-semibold">
                          {formatEth(tx.ethAmount)}
                        </td>
                        <td className="px-4 py-3 text-yellow-400">
                          {formatCurrency(tx.usdValueAtTime)}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {formatCurrency(tx.ethPriceAtTime)}
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {tx.nftName || (tx.tokenId ? `#${tx.tokenId}` : '-')}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={getPolygonscanUrl(tx.transactionHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 font-mono text-sm"
                          >
                            {shortenHash(tx.transactionHash)}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={getPolygonscanAddressUrl(tx.toWallet)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-300 font-mono text-sm"
                          >
                            {shortenAddress(tx.toWallet)}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            tx.status === 'CONFIRMED'
                              ? 'bg-green-600/30 text-green-400'
                              : tx.status === 'PENDING'
                              ? 'bg-yellow-600/30 text-yellow-400'
                              : 'bg-red-600/30 text-red-400'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
