import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

// Database object interface (from NFT table)
interface DatabaseObject {
  id: number;
  tokenId: number;
  name: string;
  description: string;
  objectType: string;
  totalScore: number;
  badgeTier: string;
  status: string;
  spectralType?: string;
  distanceLy?: number;
  constellation?: string;
  distance?: string;
}

interface DataSourceInfo {
  name: string;
  description: string;
  source: string;
}

// Data source descriptions (for reference)
const DATA_SOURCE_INFO: DataSourceInfo[] = [
  {
    name: 'HYG Database',
    description: '~120,000 stars from Hipparcos, Yale Bright Star, and Gliese catalogs with spectral types, distances, and magnitudes',
    source: 'astronexus.com (CC BY-SA-4.0)',
  },
  {
    name: 'Messier Catalog',
    description: 'Famous deep-sky objects including galaxies, nebulae, and star clusters',
    source: 'Messier Catalog, NGC/IC Catalogs',
  },
  {
    name: 'Exoplanets',
    description: 'Confirmed planets orbiting stars outside our solar system',
    source: 'NASA Exoplanet Archive',
  },
  {
    name: 'Exotic Objects',
    description: 'Black holes, pulsars, quasars, and other extreme cosmic phenomena',
    source: 'NASA, ESA, Event Horizon Telescope',
  },
];

interface NftStats {
  total: number;
  maxCapacity: number;
  remainingSlots: number;
}

interface TypeCount {
  objectType: string;
  _count: number;
}

interface TierCount {
  badgeTier: string;
  _count: number;
}

export default function AstronomicalDataAdmin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedObject, setSelectedObject] = useState<DatabaseObject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterTier, setFilterTier] = useState<string>('');

  // Database objects state
  const [dbObjects, setDbObjects] = useState<DatabaseObject[]>([]);
  const [totalObjects, setTotalObjects] = useState(0);
  const [page, setPage] = useState(1);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({});
  const limit = 100;

  // Generation state
  const [nftStats, setNftStats] = useState<NftStats | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reference image lookup state
  const [refLookupName, setRefLookupName] = useState('');
  const [refLookupResult, setRefLookupResult] = useState<{ url: string; source: string; title?: string } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchObjects();
      fetchStats();
    }
  }, [isLoading, page, filterType, filterTier]);

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
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchObjects() {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (filterType) params.append('objectType', filterType);
      if (filterTier) params.append('badge', filterTier);

      const res = await fetch(`${apiUrl}/api/admin/nfts?${params}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setDbObjects(data.items || []);
        setTotalObjects(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch objects:', error);
    }
  }

  async function fetchStats() {
    try {
      const token = localStorage.getItem('adminToken');

      // Fetch type and tier counts
      const statsRes = await fetch(`${apiUrl}/api/admin/nfts/stats`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.typeCounts) {
          const typeMap: Record<string, number> = {};
          statsData.typeCounts.forEach((t: TypeCount) => {
            typeMap[t.objectType] = t._count;
          });
          setTypeCounts(typeMap);
        }
        if (statsData.tierCounts) {
          const tierMap: Record<string, number> = {};
          statsData.tierCounts.forEach((t: TierCount) => {
            tierMap[t.badgeTier] = t._count;
          });
          setTierCounts(tierMap);
        }
        if (statsData.total !== undefined) {
          setNftStats({
            total: statsData.total,
            maxCapacity: 20000,
            remainingSlots: 20000 - statsData.total,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchObjects();
  }

  async function handleClearAllNfts(includeOwned: boolean) {
    setIsClearing(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/nfts/clear-all`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          confirmation: 'DELETE_ALL_NFTS',
          includeOwned,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setShowClearConfirm(false);
        fetchStats();
        fetchObjects();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to clear NFTs' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to clear NFTs' });
    } finally {
      setIsClearing(false);
    }
  }

  // Curated reference images (same as server-side)
  const CURATED_IMAGES: Record<string, { url: string; source: string; title: string }> = {
    'Sirius': { url: 'https://cdn.esahubble.org/archives/images/screen/heic0516a.jpg', source: 'Hubble', title: 'Sirius A and B' },
    'Betelgeuse': { url: 'https://cdn.esahubble.org/archives/images/screen/opo2003a.jpg', source: 'Hubble', title: 'Betelgeuse' },
    'Proxima Centauri': { url: 'https://cdn.esahubble.org/archives/images/screen/heic1324a.jpg', source: 'Hubble', title: 'Proxima Centauri' },
    'Alpha Centauri': { url: 'https://cdn.esahubble.org/archives/images/screen/heic1324a.jpg', source: 'Hubble', title: 'Alpha Centauri system' },
    'Vega': { url: 'https://images-assets.nasa.gov/image/PIA17005/PIA17005~medium.jpg', source: 'NASA', title: 'Vega debris disk' },
    'Crab Nebula': { url: 'https://cdn.esahubble.org/archives/images/screen/heic0515a.jpg', source: 'Hubble', title: 'Crab Nebula M1' },
    'Andromeda Galaxy': { url: 'https://cdn.esahubble.org/archives/images/screen/heic1502a.jpg', source: 'Hubble', title: 'Andromeda Galaxy M31' },
    'Orion Nebula': { url: 'https://cdn.esahubble.org/archives/images/screen/heic0601a.jpg', source: 'Hubble', title: 'Orion Nebula M42' },
    'Pleiades': { url: 'https://cdn.esahubble.org/archives/images/screen/opo0420a.jpg', source: 'Hubble', title: 'Pleiades M45' },
    'Whirlpool Galaxy': { url: 'https://cdn.esahubble.org/archives/images/screen/heic0506a.jpg', source: 'Hubble', title: 'Whirlpool Galaxy M51' },
    'Sombrero Galaxy': { url: 'https://cdn.esahubble.org/archives/images/screen/opo0328a.jpg', source: 'Hubble', title: 'Sombrero Galaxy M104' },
    'Eagle Nebula': { url: 'https://cdn.esahubble.org/archives/images/screen/heic1501a.jpg', source: 'Hubble', title: 'Pillars of Creation' },
    'Helix Nebula': { url: 'https://cdn.esahubble.org/archives/images/screen/heic0707a.jpg', source: 'Hubble', title: 'Helix Nebula' },
    'Ring Nebula': { url: 'https://cdn.esahubble.org/archives/images/screen/heic1310a.jpg', source: 'Hubble', title: 'Ring Nebula M57' },
    'Horsehead Nebula': { url: 'https://cdn.esahubble.org/archives/images/screen/heic1307a.jpg', source: 'Hubble', title: 'Horsehead Nebula' },
    'Sagittarius A*': { url: 'https://images-assets.nasa.gov/image/PIA25440/PIA25440~medium.jpg', source: 'NASA', title: 'Sagittarius A* Black Hole' },
    'M87*': { url: 'https://images-assets.nasa.gov/image/PIA23122/PIA23122~medium.jpg', source: 'NASA', title: 'M87 Black Hole' },
    'Milky Way': { url: 'https://images-assets.nasa.gov/image/PIA12348/PIA12348~medium.jpg', source: 'NASA', title: 'Milky Way Galaxy Center' },
  };

  // Fallback images by object type
  const FALLBACK_IMAGES: Record<string, { url: string; source: string; title: string }> = {
    'Star': { url: 'https://images-assets.nasa.gov/image/PIA03149/PIA03149~medium.jpg', source: 'NASA', title: 'The Sun (Star fallback)' },
    'Galaxy': { url: 'https://cdn.esahubble.org/archives/images/screen/heic1502a.jpg', source: 'Hubble', title: 'Andromeda (Galaxy fallback)' },
    'Nebula': { url: 'https://cdn.esahubble.org/archives/images/screen/heic1501a.jpg', source: 'Hubble', title: 'Pillars of Creation (Nebula fallback)' },
    'Black Hole': { url: 'https://images-assets.nasa.gov/image/PIA23122/PIA23122~medium.jpg', source: 'NASA', title: 'M87 (Black Hole fallback)' },
    'Star Cluster': { url: 'https://cdn.esahubble.org/archives/images/screen/heic0913a.jpg', source: 'Hubble', title: 'Omega Centauri (Cluster fallback)' },
    'Exoplanet': { url: 'https://images-assets.nasa.gov/image/PIA23002/PIA23002~medium.jpg', source: 'NASA', title: 'Exoplanet (fallback)' },
    'Pulsar': { url: 'https://cdn.esahubble.org/archives/images/screen/heic0515a.jpg', source: 'Hubble', title: 'Crab Nebula (Pulsar fallback)' },
    'Quasar': { url: 'https://cdn.esahubble.org/archives/images/screen/heic1509a.jpg', source: 'Hubble', title: 'Galaxy Cluster (Quasar fallback)' },
    'Comet': { url: 'https://images-assets.nasa.gov/image/PIA17485/PIA17485~medium.jpg', source: 'NASA', title: 'Comet ISON (Comet fallback)' },
  };

  // Look up reference image - curated first, then fallback
  function handleRefLookup() {
    if (!refLookupName.trim()) return;

    setIsLookingUp(true);
    setLookupError(null);
    setRefLookupResult(null);

    const searchName = refLookupName.trim();

    // Check curated images first (exact match)
    if (CURATED_IMAGES[searchName]) {
      setRefLookupResult(CURATED_IMAGES[searchName]);
      setIsLookingUp(false);
      return;
    }

    // Check for partial matches
    for (const [name, image] of Object.entries(CURATED_IMAGES)) {
      if (searchName.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(searchName.toLowerCase())) {
        setRefLookupResult({ ...image, title: `${image.title} (matched: ${name})` });
        setIsLookingUp(false);
        return;
      }
    }

    // Find object type from database
    const matchingObj = dbObjects.find(obj =>
      obj.name.toLowerCase() === searchName.toLowerCase() ||
      obj.name.toLowerCase().includes(searchName.toLowerCase())
    );

    if (matchingObj && FALLBACK_IMAGES[matchingObj.objectType]) {
      setRefLookupResult({
        ...FALLBACK_IMAGES[matchingObj.objectType],
        title: `${FALLBACK_IMAGES[matchingObj.objectType].title} - for ${matchingObj.objectType}`,
      });
      setIsLookingUp(false);
      return;
    }

    setLookupError(`No curated image for "${searchName}". Objects without curated images will use type-based fallbacks.`);
    setIsLookingUp(false);
  }

  const objectTypes = Object.keys(typeCounts).sort();
  const tierOrder = ['LEGENDARY', 'ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-purple-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Astronomical Data Sources | CosmoNFTs Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-purple-400 hover:text-purple-300">
                &larr; Dashboard
              </Link>
              <h1 className="text-xl font-bold text-white">Astronomical Data Sources</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-semibold">
                {(nftStats?.total ?? totalObjects).toLocaleString()} Total Objects
              </span>
            </div>
          </div>
        </nav>

        <div className="p-6">
          {/* Message Alert */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-900/30 border-green-500 text-green-300'
                : 'bg-red-900/30 border-red-500 text-red-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Database Stats */}
          <div className="mb-8 p-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-lg border border-purple-500/30">
            <h2 className="text-lg font-semibold text-purple-400 mb-4">Astronomical Objects in Database</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">
                  {(nftStats?.total ?? 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Total Objects</div>
              </div>
              {tierOrder.map(tier => (
                <div key={tier} className="bg-gray-800/50 rounded-lg p-4">
                  <div className={`text-2xl font-bold ${
                    tier === 'LEGENDARY' ? 'text-yellow-400' :
                    tier === 'ELITE' ? 'text-purple-400' :
                    tier === 'PREMIUM' ? 'text-blue-400' :
                    tier === 'EXCEPTIONAL' ? 'text-cyan-400' :
                    'text-gray-400'
                  }`}>
                    {(tierCounts[tier] ?? 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">{tier}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <Link
                href="/admin/nfts"
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-semibold transition-colors"
              >
                Manage NFTs &rarr;
              </Link>

              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={isClearing || !nftStats?.total}
                className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition-colors"
              >
                Clear All NFTs
              </button>

              <button
                onClick={() => { fetchStats(); fetchObjects(); }}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold transition-colors"
              >
                Refresh Stats
              </button>
            </div>
          </div>

          {/* Clear Confirmation Modal */}
          {showClearConfirm && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg border border-red-500 max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-red-400 mb-4">Confirm Delete All NFTs</h3>
                <p className="text-gray-300 mb-4">
                  This will permanently delete all NFTs from the database.
                  This action cannot be undone.
                </p>
                <p className="text-yellow-400 text-sm mb-6">
                  Current NFT count: {nftStats?.total ?? 0}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleClearAllNfts(false)}
                    disabled={isClearing}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold"
                  >
                    {isClearing ? 'Deleting...' : 'Delete Unowned Only'}
                  </button>
                  <button
                    onClick={() => handleClearAllNfts(true)}
                    disabled={isClearing}
                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold"
                  >
                    {isClearing ? 'Deleting...' : 'Delete ALL (Dangerous)'}
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    disabled={isClearing}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reference Image Lookup */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg border border-cyan-500/30">
            <h2 className="text-lg font-semibold text-cyan-400 mb-4">Reference Image Lookup (NASA)</h2>
            <p className="text-gray-400 text-sm mb-4">
              Test if a reference image is available from NASA for any astronomical object.
            </p>

            <div className="flex flex-wrap gap-4 items-start">
              <div className="flex-1 min-w-[300px]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={refLookupName}
                    onChange={(e) => setRefLookupName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRefLookup()}
                    placeholder="Enter object name (e.g., Sirius, Orion Nebula, Andromeda)"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                  <button
                    onClick={handleRefLookup}
                    disabled={isLookingUp || !refLookupName.trim()}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition-colors"
                  >
                    {isLookingUp ? 'Searching...' : 'Look Up'}
                  </button>
                </div>

                {lookupError && (
                  <div className="mt-3 p-3 bg-red-900/30 border border-red-500 rounded text-red-300 text-sm">
                    {lookupError}
                  </div>
                )}

                {refLookupResult && (
                  <div className="mt-3 p-3 bg-green-900/30 border border-green-500 rounded">
                    <div className="text-green-300 text-sm mb-2">
                      Found: {refLookupResult.title || 'Image'}
                    </div>
                    <div className="text-gray-400 text-xs mb-2">
                      Source: {refLookupResult.source}
                    </div>
                    <a
                      href={refLookupResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 text-xs break-all hover:underline"
                    >
                      {refLookupResult.url}
                    </a>
                  </div>
                )}
              </div>

              {refLookupResult && (
                <div className="w-48 flex-shrink-0">
                  <img
                    src={refLookupResult.url}
                    alt={refLookupResult.title || 'Reference image'}
                    className="w-full rounded-lg border border-gray-600"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Data Sources Info */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-semibold text-purple-400 mb-4">Data Sources</h2>
              {DATA_SOURCE_INFO.map(source => (
                <div
                  key={source.name}
                  className="p-4 rounded-lg border bg-gray-800 border-gray-700"
                >
                  <h3 className="font-semibold text-white mb-2">{source.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{source.description}</p>
                  <div className="text-xs text-gray-500">
                    Source: {source.source}
                  </div>
                </div>
              ))}

              {/* Type Breakdown */}
              <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="font-semibold text-purple-400 mb-3">Object Types</h3>
                <div className="space-y-2">
                  {objectTypes.map(type => (
                    <div
                      key={type}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-300">{type}</span>
                      <span className="text-purple-400 font-mono">{typeCounts[type]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Objects Browser */}
            <div className="lg:col-span-2">
              {/* Search and Filter */}
              <form onSubmit={handleSearch} className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
                <div className="flex flex-wrap gap-4">
                  <input
                    type="text"
                    placeholder="Search objects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 min-w-[200px] bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                  />
                  <select
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                    className="bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                  >
                    <option value="">All Types</option>
                    {objectTypes.map(type => (
                      <option key={type} value={type}>{type} ({(typeCounts[type] ?? 0).toLocaleString()})</option>
                    ))}
                  </select>
                  <select
                    value={filterTier}
                    onChange={(e) => { setFilterTier(e.target.value); setPage(1); }}
                    className="bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                  >
                    <option value="">All Tiers</option>
                    {tierOrder.map(tier => (
                      <option key={tier} value={tier}>{tier} ({(tierCounts[tier] ?? 0).toLocaleString()})</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-semibold"
                  >
                    Search
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  Showing {dbObjects.length} of {totalObjects.toLocaleString()} objects (page {page})
                </div>
              </form>

              {/* Objects Grid */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h2 className="text-lg font-semibold text-purple-400 mb-4">
                  Astronomical Objects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                  {dbObjects.map((obj) => (
                    <div
                      key={obj.id}
                      onClick={() => setSelectedObject(obj)}
                      className={`p-3 rounded border cursor-pointer transition-all ${
                        selectedObject?.id === obj.id
                          ? 'bg-purple-600/30 border-purple-400'
                          : 'bg-gray-700/50 border-gray-600 hover:border-purple-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-semibold text-white truncate">{obj.name}</div>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          obj.badgeTier === 'LEGENDARY' ? 'bg-yellow-600 text-white' :
                          obj.badgeTier === 'ELITE' ? 'bg-purple-600 text-white' :
                          obj.badgeTier === 'PREMIUM' ? 'bg-blue-600 text-white' :
                          obj.badgeTier === 'EXCEPTIONAL' ? 'bg-cyan-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {obj.badgeTier}
                        </span>
                      </div>
                      <div className="text-xs text-purple-400">{obj.objectType}</div>
                      <div className="text-xs text-gray-500">Score: {obj.totalScore}</div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-4 mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <span className="text-gray-400">
                    Page {page} of {Math.ceil(totalObjects / limit)}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= Math.ceil(totalObjects / limit)}
                    className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Object Detail Modal */}
          {selectedObject && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg border border-purple-500 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">{selectedObject.name}</h2>
                  <button
                    onClick={() => setSelectedObject(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    &times;
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Type and Tier Badges */}
                  <div className="flex gap-2">
                    <span className="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                      {selectedObject.objectType}
                    </span>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                      selectedObject.badgeTier === 'LEGENDARY' ? 'bg-yellow-600 text-white' :
                      selectedObject.badgeTier === 'ELITE' ? 'bg-purple-600 text-white' :
                      selectedObject.badgeTier === 'PREMIUM' ? 'bg-blue-600 text-white' :
                      selectedObject.badgeTier === 'EXCEPTIONAL' ? 'bg-cyan-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {selectedObject.badgeTier}
                    </span>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400">Description</h3>
                    <p className="text-white">{selectedObject.description || 'No description available'}</p>
                  </div>

                  {/* Properties Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400">Token ID</h3>
                      <p className="text-white">#{selectedObject.tokenId}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400">Total Score</h3>
                      <p className="text-white">{selectedObject.totalScore}/500</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400">Status</h3>
                      <p className="text-white">{selectedObject.status}</p>
                    </div>
                    {selectedObject.spectralType && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400">Spectral Type</h3>
                        <p className="text-white">{selectedObject.spectralType}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-700">
                    <Link
                      href={`/admin/nfts?search=${encodeURIComponent(selectedObject.name)}`}
                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-semibold text-center"
                    >
                      View in NFT Manager
                    </Link>
                    <button
                      onClick={() => setSelectedObject(null)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
            <h3 className="text-lg font-semibold text-purple-400 mb-2">About This Data</h3>
            <p className="text-gray-300 mb-4">
              This astronomical data is sourced from reputable scientific databases and catalogs.
              Each object includes verified scientific data including distance, mass, temperature,
              and other properties where available.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-purple-400 font-semibold">NASA</div>
                <div className="text-gray-400">Exoplanet Archive, IPAC</div>
              </div>
              <div>
                <div className="text-purple-400 font-semibold">SIMBAD</div>
                <div className="text-gray-400">CDS, Strasbourg</div>
              </div>
              <div>
                <div className="text-purple-400 font-semibold">Messier Catalog</div>
                <div className="text-gray-400">Charles Messier, 1774</div>
              </div>
              <div>
                <div className="text-purple-400 font-semibold">ESA/ESO</div>
                <div className="text-gray-400">European Space Agency</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
