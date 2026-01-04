import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface NFT {
  id: number;
  tokenId: number;
  name: string;
  description?: string;
  objectType: string;
  totalScore: number;
  badgeTier: string;
  status: string;
  currentPrice: number;
  displayPrice?: string;
  priceFormula?: string;
  image: string | null;
}

interface NFTDetail {
  id: number;
  tokenId: number;
  name: string;
  description: string;
  objectType: string;
  status: string;
  totalScore: number;
  scores: {
    fameVisibility: number;
    scientificSignificance: number;
    rarity: number;
    discoveryRecency: number;
    culturalImpact: number;
  };
  discoveryYear: number | null;
  badgeTier: string;
  currentPrice: number;
  displayPrice: string;
  priceFormula: string;
  currentPhase: number;
  phaseMultiplier: string;
  image: string | null;
  imageIpfsHash: string | null;
  metadataIpfsHash: string | null;
  // Reference images from NASA/ESA
  referenceImageUrl: string | null;
  referenceImageSource: string | null;
  leonardoRefImageId: string | null;
  ownerAddress: string | null;
  transactionHash: string | null;
  createdAt: string;
  updatedAt: string;
  mintedAt: string | null;
  soldAt: string | null;
}

interface ImageGenJob {
  id: number;
  nftId: number;
  nftName: string;
  status: 'queued' | 'generating' | 'success' | 'error';
  message?: string;
  startedAt: Date;
}

const MAX_NFTS = 20000;

const OBJECT_TYPES = [
  'Star', 'Exoplanet', 'Galaxy', 'Nebula', 'Asteroid', 'Comet', 'Black Hole',
  'Pulsar', 'Quasar', 'Star Cluster', 'Moon', 'Planet', 'Dwarf Planet',
  'Supernova', 'White Dwarf', 'Neutron Star', 'Brown Dwarf', 'Globular Cluster'
];

export default function AdminNFTs() {
  const router = useRouter();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBadge, setFilterBadge] = useState('all');
  const [filterObjectType, setFilterObjectType] = useState('all');
  const [selectedNft, setSelectedNft] = useState<NFTDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [promptData, setPromptData] = useState<{ prompt: string; negativePrompt: string } | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk select state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Auction scheduling state
  const [showAuctionSchedule, setShowAuctionSchedule] = useState(false);
  const [auctionWeek, setAuctionWeek] = useState(1);
  const [auctionStartingBid, setAuctionStartingBid] = useState('100');
  const [isSchedulingAuction, setIsSchedulingAuction] = useState(false);

  // Image Generation Queue
  const [imageGenQueue, setImageGenQueue] = useState<ImageGenJob[]>([]);
  const [showGenQueue, setShowGenQueue] = useState(false);
  const [nextJobId, setNextJobId] = useState(1);

  // NFT Generation state
  const [capacity, setCapacity] = useState({ current: 0, max: MAX_NFTS, remaining: MAX_NFTS });
  const [isGeneratingNft, setIsGeneratingNft] = useState(false);
  const [generateNftCount, setGenerateNftCount] = useState(1);
  const [generateNftType, setGenerateNftType] = useState('');
  const [generateNftMessage, setGenerateNftMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);

  const limit = 50;

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchNFTs();
    }
  }, [page, filterStatus, filterBadge, filterObjectType]);

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

      await Promise.all([fetchNFTs(), fetchCapacity()]);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCapacity() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/nfts/generate-from-real-data`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setCapacity({
          current: data.nftStats?.total || 0,
          max: data.nftStats?.maxCapacity || MAX_NFTS,
          remaining: data.nftStats?.remainingSlots || MAX_NFTS,
        });
      }
    } catch (error) {
      console.error('Failed to fetch capacity:', error);
    }
  }

  async function handleGenerateNft() {
    if (capacity.remaining <= 0) {
      setGenerateNftMessage({ type: 'error', text: 'Maximum NFT limit reached (20,000)' });
      return;
    }

    setIsGeneratingNft(true);
    setGenerateNftMessage(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/nfts/generate-from-real-data`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          count: generateNftCount,
          objectType: generateNftType || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const nftNames = data.generated?.map((n: any) => n.name).join(', ') || '';
        const promptStats = data.promptStats ? ` (${data.promptStats.generated} prompts generated)` : '';
        setGenerateNftMessage({
          type: 'success',
          text: `Generated ${data.generated?.length || 0} NFT(s)${promptStats}: ${nftNames}`
        });
        setCapacity({
          current: data.nftStats?.total || 0,
          max: MAX_NFTS,
          remaining: data.nftStats?.remainingSlots || 0,
        });
        // Refresh the list
        await fetchNFTs();
      } else {
        setGenerateNftMessage({ type: 'error', text: data.error || data.details || 'Failed to generate NFTs' });
      }
    } catch (error) {
      setGenerateNftMessage({ type: 'error', text: 'Failed to generate NFTs' });
    } finally {
      setIsGeneratingNft(false);
    }
  }

  async function fetchNFTs() {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
      });

      if (search) params.append('search', search);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterBadge !== 'all') params.append('badge', filterBadge);
      if (filterObjectType !== 'all') params.append('objectType', filterObjectType);

      const res = await fetch(`${apiUrl}/api/admin/nfts?${params}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setNfts(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    }
  }

  async function handleViewNft(id: number) {
    setIsLoadingDetail(true);
    setShowPrompt(false);
    setPromptData(null);
    setGenerateMessage(null);
    try {
      const token = localStorage.getItem('adminToken');
      const fetchUrl = `${apiUrl}/api/admin/nfts/${id}`;
      console.log('[Modal] Fetching:', fetchUrl);

      const res = await fetch(fetchUrl, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      console.log('[Modal] Response status:', res.status, res.ok);

      // Parse JSON even for error responses to get detailed error info
      const data = await res.json().catch(() => ({ error: 'Failed to parse response' }));
      console.log('[Modal] Response:', res.status, data);

      if (!res.ok) {
        console.error('[Modal] HTTP Error:', res.status, data);
        alert(`Error: ${data.error || 'Unknown error'}\n${data.details || ''}`);
        return;
      }
      console.log('[Modal] Response:', { success: data.success, hasNft: !!data.nft, error: data.error });

      if (data.success && data.nft) {
        setSelectedNft(data.nft);
      } else {
        console.error('[Modal] API returned error:', data);
        alert('Failed: ' + (data.error || 'No NFT data returned'));
      }
    } catch (error) {
      console.error('[Modal] Exception caught:', error);
      alert('Network error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchNFTs();
  }

  function formatAddress(address: string | null): string {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  async function handleGenerateImage(nftId: number, nftName?: string) {
    // Check if this NFT is already in the queue
    if (imageGenQueue.some(job => job.nftId === nftId && (job.status === 'queued' || job.status === 'generating'))) {
      setGenerateMessage({ type: 'error', text: 'This NFT is already in the generation queue' });
      return;
    }

    const jobId = nextJobId;
    setNextJobId(prev => prev + 1);

    // Add to queue
    const newJob: ImageGenJob = {
      id: jobId,
      nftId,
      nftName: nftName || selectedNft?.name || `NFT #${nftId}`,
      status: 'generating',
      startedAt: new Date(),
    };

    setImageGenQueue(prev => [...prev, newJob]);
    setShowGenQueue(true);
    setGenerateMessage({ type: 'success', text: 'Added to generation queue!' });

    // Make the API call in the background
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/nfts/${nftId}/generate-image`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();

      if (res.ok) {
        // Update job status to success
        setImageGenQueue(prev => prev.map(job =>
          job.id === jobId
            ? { ...job, status: 'success' as const, message: data.message || 'Image generation started!' }
            : job
        ));
      } else {
        // Update job status to error
        setImageGenQueue(prev => prev.map(job =>
          job.id === jobId
            ? { ...job, status: 'error' as const, message: data.error || 'Failed to generate image' }
            : job
        ));
      }
    } catch (error) {
      setImageGenQueue(prev => prev.map(job =>
        job.id === jobId
          ? { ...job, status: 'error' as const, message: 'Failed to generate image' }
          : job
      ));
    }
  }

  function removeFromQueue(jobId: number) {
    setImageGenQueue(prev => prev.filter(job => job.id !== jobId));
  }

  function clearCompletedJobs() {
    setImageGenQueue(prev => prev.filter(job => job.status === 'queued' || job.status === 'generating'));
  }

  async function handleDeleteNft(nftId: number) {
    if (!selectedNft) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/nfts/${nftId}/delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();

      if (res.ok) {
        setGenerateMessage({ type: 'success', text: data.message || 'NFT deleted successfully!' });
        setShowDeleteConfirm(false);
        setSelectedNft(null);
        // Refresh the list
        await fetchNFTs();
      } else {
        setGenerateMessage({ type: 'error', text: data.message || data.error || 'Failed to delete NFT' });
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      setGenerateMessage({ type: 'error', text: 'Failed to delete NFT' });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

  // Bulk selection functions
  function handleSelectAll() {
    if (selectedIds.size === nfts.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all on current page (only AVAILABLE without owner)
      const selectableIds = nfts
        .filter(nft => nft.status === 'AVAILABLE')
        .map(nft => nft.id);
      setSelectedIds(new Set(selectableIds));
    }
  }

  function handleSelectOne(nftId: number) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(nftId)) {
      newSelected.delete(nftId);
    } else {
      newSelected.add(nftId);
    }
    setSelectedIds(newSelected);
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    setIsBulkDeleting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const idsToDelete = Array.from(selectedIds);

      // Delete NFTs one by one (could be optimized with a bulk endpoint)
      let successCount = 0;
      let errorCount = 0;

      for (const nftId of idsToDelete) {
        try {
          const res = await fetch(`${apiUrl}/api/admin/nfts/${nftId}/delete`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);

      if (errorCount === 0) {
        setGenerateMessage({ type: 'success', text: `Successfully deleted ${successCount} NFT(s)` });
      } else {
        setGenerateMessage({ type: 'error', text: `Deleted ${successCount}, failed ${errorCount}` });
      }

      // Refresh the list
      await fetchNFTs();
      await fetchCapacity();
    } catch (error) {
      setGenerateMessage({ type: 'error', text: 'Failed to delete NFTs' });
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  }

  async function handleScheduleAuction() {
    if (!selectedNft) return;

    setIsSchedulingAuction(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/auctions/schedule`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nftId: selectedNft.id,
          week: auctionWeek,
          startingBidCents: Math.round(parseFloat(auctionStartingBid) * 100),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setGenerateMessage({ type: 'success', text: data.message || 'NFT scheduled for auction!' });
        setShowAuctionSchedule(false);
        // Refresh the list to show updated status
        await fetchNFTs();
      } else {
        setGenerateMessage({ type: 'error', text: data.error || 'Failed to schedule auction' });
      }
    } catch (error) {
      setGenerateMessage({ type: 'error', text: 'Failed to schedule auction' });
    } finally {
      setIsSchedulingAuction(false);
    }
  }

  async function handlePreviewPrompt(nftId: number) {
    setIsLoadingPrompt(true);
    setShowPrompt(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/nfts/${nftId}/preview-prompt`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setPromptData({
          prompt: data.prompt,
          negativePrompt: data.negativePrompt,
        });
      }
    } catch (error) {
      console.error('Failed to fetch prompt:', error);
    } finally {
      setIsLoadingPrompt(false);
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
        <title>NFTs | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold text-white hover:text-gray-300">
                CosmoNFT Admin
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400">NFTs</span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Header with Capacity Display */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold">Browse NFTs</h1>
            <div className="flex items-center gap-4">
              {/* Capacity Bar */}
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-400">
                    <span className="text-white font-bold">{(capacity?.current ?? 0).toLocaleString()}</span>
                    <span className="mx-1">/</span>
                    <span>{(capacity?.max ?? MAX_NFTS).toLocaleString()}</span>
                  </div>
                  <div className="w-32 bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        (capacity?.remaining ?? MAX_NFTS) === 0 ? 'bg-red-500' :
                        (capacity?.remaining ?? MAX_NFTS) < 1000 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${((capacity?.current ?? 0) / (capacity?.max ?? MAX_NFTS)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{(capacity?.remaining ?? MAX_NFTS).toLocaleString()} left</span>
                </div>
              </div>
              {/* Generate Button */}
              <button
                onClick={() => setShowGeneratePanel(!showGeneratePanel)}
                disabled={(capacity?.remaining ?? MAX_NFTS) === 0}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <span>+</span>
                <span>Generate NFT</span>
              </button>
            </div>
          </div>

          {/* Generate Panel */}
          {showGeneratePanel && (
            <div className="bg-gray-900 border border-purple-600/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-purple-400">Generate New NFTs</h2>
                <button
                  onClick={() => setShowGeneratePanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  &times;
                </button>
              </div>

              {generateNftMessage && (
                <div className={`mb-4 p-3 rounded-lg ${
                  generateNftMessage.type === 'success'
                    ? 'bg-green-900/30 border border-green-600 text-green-400'
                    : 'bg-red-900/30 border border-red-600 text-red-400'
                }`}>
                  {generateNftMessage.text}
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Number to Generate</label>
                  <select
                    value={generateNftCount}
                    onChange={(e) => setGenerateNftCount(parseInt(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  >
                    {[1, 5, 10, 25, 50, 100].map(n => (
                      <option key={n} value={n} disabled={n > capacity.remaining}>
                        {n} {n > capacity.remaining ? '(exceeds capacity)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Object Type (Optional)</label>
                  <select
                    value={generateNftType}
                    onChange={(e) => setGenerateNftType(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Random (weighted)</option>
                    {OBJECT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleGenerateNft}
                    disabled={isGeneratingNft || capacity.remaining === 0}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-lg"
                  >
                    {isGeneratingNft ? 'Generating...' : `Generate ${generateNftCount} NFT(s)`}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                NFTs are generated with unique catalog-style names and cannot be duplicated.
                Each NFT receives randomized scores and appropriate badge tiers.
              </p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <form onSubmit={handleSearch} className="grid md:grid-cols-5 gap-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
              <select
                value={filterObjectType}
                onChange={(e) => { setFilterObjectType(e.target.value); setPage(1); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="all">All Types</option>
                {OBJECT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="all">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="SOLD">Sold</option>
                <option value="MINTED">Minted</option>
                <option value="RESERVED">Reserved</option>
                <option value="AUCTION_RESERVED">Auction Reserved</option>
                <option value="AUCTIONED">Auctioned</option>
              </select>
              <select
                value={filterBadge}
                onChange={(e) => { setFilterBadge(e.target.value); setPage(1); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="all">All Badges</option>
                <option value="ELITE">Elite</option>
                <option value="PREMIUM">Premium</option>
                <option value="EXCEPTIONAL">Exceptional</option>
                <option value="STANDARD">Standard</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg"
              >
                Search
              </button>
            </form>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <span className="text-gray-400">
              Showing {nfts.length} of {total.toLocaleString()} NFTs
              {selectedIds.size > 0 && (
                <span className="ml-2 text-purple-400">
                  ({selectedIds.size} selected)
                </span>
              )}
            </span>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <span>🗑️</span>
                Delete {selectedIds.size} Selected
              </button>
            )}
          </div>

          {/* Bulk Delete Confirmation */}
          {showBulkDeleteConfirm && (
            <div className="mb-4 bg-red-900/30 border border-red-600 rounded-lg p-4">
              <p className="text-red-400 font-medium mb-3">
                Are you sure you want to delete {selectedIds.size} NFT(s)?
              </p>
              <p className="text-red-300 text-sm mb-4">
                This action cannot be undone. All selected NFTs and their associated data will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg"
                >
                  {isBulkDeleting ? `Deleting... (${selectedIds.size} remaining)` : `Yes, Delete ${selectedIds.size} NFT(s)`}
                </button>
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={isBulkDeleting}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* NFT Table */}
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === nfts.filter(n => n.status === 'AVAILABLE').length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                        title="Select all available NFTs on this page"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Score</th>
                    <th className="px-4 py-3 text-left">Badge</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nfts.map((nft) => (
                    <tr
                      key={nft.id}
                      className={`border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer ${
                        selectedIds.has(nft.id) ? 'bg-purple-900/20' : ''
                      }`}
                      onClick={() => handleViewNft(nft.id)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(nft.id)}
                          onChange={() => handleSelectOne(nft.id)}
                          disabled={nft.status !== 'AVAILABLE'}
                          className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500 disabled:opacity-30"
                          title={nft.status !== 'AVAILABLE' ? 'Only available NFTs can be deleted' : 'Select for bulk delete'}
                        />
                      </td>
                      <td className="px-4 py-3">#{nft.id}</td>
                      <td className="px-4 py-3 font-medium">{nft.name}</td>
                      <td className="px-4 py-3 text-gray-400">{nft.objectType}</td>
                      <td className="px-4 py-3">{nft.totalScore}/500</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          nft.badgeTier === 'ELITE' ? 'bg-yellow-900 text-yellow-300' :
                          nft.badgeTier === 'PREMIUM' ? 'bg-blue-900 text-blue-300' :
                          nft.badgeTier === 'EXCEPTIONAL' ? 'bg-cyan-900 text-cyan-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {nft.badgeTier}
                        </span>
                      </td>
                      <td className="px-4 py-3" title={nft.priceFormula || ''}>
                        {nft.displayPrice || `$${nft.currentPrice?.toFixed(2)}` || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          nft.status === 'AVAILABLE' ? 'bg-green-900 text-green-300' :
                          nft.status === 'SOLD' || nft.status === 'MINTED' ? 'bg-blue-900 text-blue-300' :
                          nft.status === 'AUCTION_RESERVED' || nft.status === 'AUCTIONED' ? 'bg-purple-900 text-purple-300' :
                          'bg-yellow-900 text-yellow-300'
                        }`}>
                          {nft.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateImage(nft.id, nft.name);
                            }}
                            disabled={imageGenQueue.some(j => j.nftId === nft.id && (j.status === 'queued' || j.status === 'generating'))}
                            className="text-purple-400 hover:text-purple-300 disabled:text-gray-600 text-sm"
                            title="Generate Image"
                          >
                            {imageGenQueue.some(j => j.nftId === nft.id && j.status === 'generating')
                              ? '...'
                              : '🎨'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewNft(nft.id); }}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {page} of {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / limit)}
              className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700"
            >
              Next
            </button>
          </div>

          <div className="mt-8">
            <Link href="/admin" className="text-gray-400 hover:text-white">
              &larr; Back to Dashboard
            </Link>
          </div>
        </main>

        {/* Image Generation Queue Panel */}
        {imageGenQueue.length > 0 && (
          <div className="fixed bottom-4 right-4 z-40">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden" style={{ width: showGenQueue ? '320px' : 'auto' }}>
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 bg-gray-800 cursor-pointer"
                onClick={() => setShowGenQueue(!showGenQueue)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    imageGenQueue.some(j => j.status === 'generating') ? 'bg-yellow-500 animate-pulse' :
                    imageGenQueue.some(j => j.status === 'error') ? 'bg-red-500' :
                    'bg-green-500'
                  }`} />
                  <span className="font-medium text-white">
                    Image Queue ({imageGenQueue.length})
                  </span>
                </div>
                <span className="text-gray-400">{showGenQueue ? '−' : '+'}</span>
              </div>

              {/* Queue List */}
              {showGenQueue && (
                <div className="max-h-64 overflow-y-auto">
                  {imageGenQueue.map(job => (
                    <div
                      key={job.id}
                      className={`px-4 py-3 border-t border-gray-800 flex items-center justify-between ${
                        job.status === 'error' ? 'bg-red-900/20' :
                        job.status === 'success' ? 'bg-green-900/20' :
                        ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {job.status === 'generating' && (
                            <svg className="w-4 h-4 text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          {job.status === 'success' && (
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {job.status === 'error' && (
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          <span className="text-white text-sm truncate">{job.nftName}</span>
                        </div>
                        {job.message && (
                          <p className={`text-xs mt-1 truncate ${
                            job.status === 'error' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {job.message}
                          </p>
                        )}
                      </div>
                      {(job.status === 'success' || job.status === 'error') && (
                        <button
                          onClick={() => removeFromQueue(job.id)}
                          className="ml-2 text-gray-500 hover:text-white text-lg"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Clear All Button */}
                  {imageGenQueue.some(j => j.status === 'success' || j.status === 'error') && (
                    <div className="px-4 py-2 border-t border-gray-800 bg-gray-800/50">
                      <button
                        onClick={clearCompletedJobs}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        Clear completed
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* NFT Detail Modal */}
        {(selectedNft || isLoadingDetail) && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {isLoadingDetail ? (
                <div className="p-8 text-center">
                  <div className="text-white text-xl">Loading...</div>
                </div>
              ) : selectedNft && (
                <>
                  <div className="p-6 border-b border-gray-800 flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedNft.name}</h2>
                      <p className="text-gray-400">Token ID: #{selectedNft.tokenId}</p>
                    </div>
                    <button
                      onClick={() => setSelectedNft(null)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      &times;
                    </button>
                  </div>

                  <div className="p-6 grid md:grid-cols-2 gap-6">
                    {/* Left Column - Image & Description */}
                    <div>
                      {selectedNft.image ? (
                        <img
                          src={selectedNft.image}
                          alt={selectedNft.name}
                          className="w-full rounded-lg mb-4"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                          <span className="text-gray-500">No Image</span>
                        </div>
                      )}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-2">Description</h3>
                        <p className="text-gray-400 text-sm">{selectedNft.description || 'No description'}</p>
                      </div>

                      {/* Reference Image from NASA/ESA */}
                      <div className="bg-gray-800 rounded-lg p-4 mt-4">
                        <h3 className="font-semibold text-white mb-2">Reference Image</h3>
                        {selectedNft.referenceImageUrl ? (
                          <div>
                            <img
                              src={selectedNft.referenceImageUrl}
                              alt={`${selectedNft.name} reference`}
                              className="w-full rounded-lg mb-2"
                            />
                            <p className="text-xs text-gray-400">
                              Source: {selectedNft.referenceImageSource || 'NASA'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No reference image available</p>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="space-y-4">
                      {/* Status & Badge */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            selectedNft.status === 'AVAILABLE' ? 'bg-green-600 text-white' :
                            selectedNft.status === 'SOLD' || selectedNft.status === 'MINTED' ? 'bg-blue-600 text-white' :
                            'bg-yellow-600 text-white'
                          }`}>
                            {selectedNft.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            selectedNft.badgeTier === 'ELITE' ? 'bg-yellow-600 text-white' :
                            selectedNft.badgeTier === 'PREMIUM' ? 'bg-blue-600 text-white' :
                            selectedNft.badgeTier === 'EXCEPTIONAL' ? 'bg-cyan-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {selectedNft.badgeTier}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Type: {selectedNft.objectType}
                          {selectedNft.discoveryYear && ` | Discovered: ${selectedNft.discoveryYear}`}
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-3">Score Breakdown</h3>
                        <div className="text-3xl font-bold text-purple-400 mb-4">
                          {selectedNft.totalScore}/500
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Distance</span>
                            <span className="text-white">{selectedNft.scores.fameVisibility}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Mass</span>
                            <span className="text-white">{selectedNft.scores.scientificSignificance}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Luminosity</span>
                            <span className="text-white">{selectedNft.scores.rarity}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Temperature</span>
                            <span className="text-white">{selectedNft.scores.discoveryRecency}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Discovery</span>
                            <span className="text-white">{selectedNft.scores.culturalImpact}/100</span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-3">Pricing</h3>
                        <div className="text-3xl font-bold text-green-400 mb-2">
                          {selectedNft.displayPrice}
                        </div>
                        <div className="text-sm text-gray-400">
                          <p>Formula: {selectedNft.priceFormula}</p>
                          <p>Phase: {selectedNft.currentPhase} | Multiplier: {selectedNft.phaseMultiplier}x</p>
                        </div>
                      </div>

                      {/* Ownership & Blockchain */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-3">Ownership & Blockchain</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Owner</span>
                            <span className="text-white font-mono">
                              {formatAddress(selectedNft.ownerAddress)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">TX Hash</span>
                            <span className="text-white font-mono">
                              {selectedNft.transactionHash ? (
                                <a
                                  href={`https://polygonscan.com/tx/${selectedNft.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  {formatAddress(selectedNft.transactionHash)}
                                </a>
                              ) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* IPFS */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-3">IPFS</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Image Hash</span>
                            <span className="text-white font-mono text-xs">
                              {selectedNft.imageIpfsHash ? (
                                <a
                                  href={`https://gateway.pinata.cloud/ipfs/${selectedNft.imageIpfsHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  {selectedNft.imageIpfsHash.slice(0, 12)}...
                                </a>
                              ) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Metadata Hash</span>
                            <span className="text-white font-mono text-xs">
                              {selectedNft.metadataIpfsHash ? (
                                <a
                                  href={`https://gateway.pinata.cloud/ipfs/${selectedNft.metadataIpfsHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  {selectedNft.metadataIpfsHash.slice(0, 12)}...
                                </a>
                              ) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Leonardo AI Prompt */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-white">Leonardo AI Prompt</h3>
                          <button
                            onClick={() => {
                              if (!showPrompt) {
                                handlePreviewPrompt(selectedNft.id);
                              } else {
                                setShowPrompt(false);
                                setPromptData(null);
                              }
                            }}
                            className="text-purple-400 hover:text-purple-300 text-sm"
                          >
                            {showPrompt ? 'Hide' : 'View Prompt'}
                          </button>
                        </div>
                        {showPrompt && (
                          <div className="space-y-3">
                            {isLoadingPrompt ? (
                              <div className="text-gray-400 text-sm">Loading prompt...</div>
                            ) : promptData ? (
                              <>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Positive Prompt:</div>
                                  <div className="bg-gray-900 rounded p-3 text-xs text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                    {promptData.prompt}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Negative Prompt:</div>
                                  <div className="bg-gray-900 rounded p-2 text-xs text-red-400">
                                    {promptData.negativePrompt}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(promptData.prompt);
                                    setGenerateMessage({ type: 'success', text: 'Prompt copied to clipboard!' });
                                    setTimeout(() => setGenerateMessage(null), 2000);
                                  }}
                                  className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                  Copy Prompt
                                </button>
                              </>
                            ) : (
                              <div className="text-gray-400 text-sm">Failed to load prompt</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Timestamps */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-3">Timestamps</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Created</span>
                            <span className="text-white">{new Date(selectedNft.createdAt).toLocaleString()}</span>
                          </div>
                          {selectedNft.mintedAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Minted</span>
                              <span className="text-white">{new Date(selectedNft.mintedAt).toLocaleString()}</span>
                            </div>
                          )}
                          {selectedNft.soldAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Sold</span>
                              <span className="text-white">{new Date(selectedNft.soldAt).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-6 border-t border-gray-800">
                    {generateMessage && (
                      <div className={`mb-4 p-3 rounded-lg ${
                        generateMessage.type === 'success'
                          ? 'bg-green-900/30 border border-green-600 text-green-400'
                          : 'bg-red-900/30 border border-red-600 text-red-400'
                      }`}>
                        {generateMessage.text}
                      </div>
                    )}
                    {/* Delete Confirmation */}
                    {showDeleteConfirm && (
                      <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-4">
                        <p className="text-red-400 font-medium mb-3">
                          Are you sure you want to delete &quot;{selectedNft.name}&quot;?
                        </p>
                        <p className="text-red-300 text-sm mb-4">
                          This action cannot be undone. The NFT and any associated image data will be permanently removed.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleDeleteNft(selectedNft.id)}
                            disabled={isDeleting}
                            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg"
                          >
                            {isDeleting ? 'Deleting...' : 'Yes, Delete NFT'}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Auction Schedule Form */}
                    {showAuctionSchedule && (
                      <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-4 mb-4">
                        <p className="text-purple-400 font-medium mb-3">
                          Schedule &quot;{selectedNft.name}&quot; for Auction
                        </p>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Auction Week</label>
                            <input
                              type="number"
                              value={auctionWeek}
                              onChange={(e) => setAuctionWeek(parseInt(e.target.value) || 1)}
                              min={1}
                              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Starting Bid ($)</label>
                            <input
                              type="number"
                              value={auctionStartingBid}
                              onChange={(e) => setAuctionStartingBid(e.target.value)}
                              min={1}
                              step="0.01"
                              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleScheduleAuction}
                            disabled={isSchedulingAuction}
                            className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg"
                          >
                            {isSchedulingAuction ? 'Scheduling...' : 'Schedule Auction'}
                          </button>
                          <button
                            onClick={() => setShowAuctionSchedule(false)}
                            disabled={isSchedulingAuction}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleGenerateImage(selectedNft.id, selectedNft.name)}
                        disabled={imageGenQueue.some(j => j.nftId === selectedNft.id && (j.status === 'queued' || j.status === 'generating'))}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg"
                      >
                        {imageGenQueue.some(j => j.nftId === selectedNft.id && j.status === 'generating')
                          ? 'In Queue...'
                          : 'Generate Image'}
                      </button>
                      <Link
                        href={`/nft/${selectedNft.tokenId}`}
                        target="_blank"
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-center"
                      >
                        View Public Page
                      </Link>
                      {/* Schedule Auction button - only show for AVAILABLE NFTs */}
                      {selectedNft.status === 'AVAILABLE' && !selectedNft.ownerAddress && (
                        <button
                          onClick={() => setShowAuctionSchedule(true)}
                          className="bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-600 text-yellow-400 font-medium px-4 py-2 rounded-lg"
                        >
                          Schedule Auction
                        </button>
                      )}
                      {/* Delete button - only show for AVAILABLE NFTs */}
                      {selectedNft.status === 'AVAILABLE' && !selectedNft.ownerAddress && (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="bg-red-600/20 hover:bg-red-600/40 border border-red-600 text-red-400 font-medium px-4 py-2 rounded-lg"
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedNft(null);
                          setGenerateMessage(null);
                          setShowDeleteConfirm(false);
                          setShowAuctionSchedule(false);
                        }}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
