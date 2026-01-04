import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  AstronomicalObject,
  REAL_STARS,
  MESSIER_OBJECTS,
  EXOPLANETS,
  BLACK_HOLES,
  PULSARS,
  QUASARS,
  COMETS,
  getAllAstronomicalObjects,
  getObjectCountsByType,
} from '../../lib/astronomicalData';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface DataSource {
  name: string;
  category: string;
  count: number;
  description: string;
  source: string;
  data: AstronomicalObject[];
}

const DATA_SOURCES: DataSource[] = [
  {
    name: 'Famous Stars',
    category: 'REAL_STARS',
    count: REAL_STARS.length,
    description: 'Well-known stars from SIMBAD database and astronomical catalogs',
    source: 'SIMBAD Astronomical Database, Wikipedia, NASA',
    data: REAL_STARS,
  },
  {
    name: 'Messier Objects',
    category: 'MESSIER_OBJECTS',
    count: MESSIER_OBJECTS.length,
    description: 'Objects from the famous Messier Catalog (nebulae, galaxies, star clusters)',
    source: 'Messier Catalog, NGC/IC Catalogs, NASA',
    data: MESSIER_OBJECTS,
  },
  {
    name: 'Exoplanets',
    category: 'EXOPLANETS',
    count: EXOPLANETS.length,
    description: 'Confirmed planets orbiting stars outside our solar system',
    source: 'NASA Exoplanet Archive, Kepler/TESS Mission Data',
    data: EXOPLANETS,
  },
  {
    name: 'Black Holes',
    category: 'BLACK_HOLES',
    count: BLACK_HOLES.length,
    description: 'Known black holes including stellar and supermassive types',
    source: 'NASA, Event Horizon Telescope, X-ray observations',
    data: BLACK_HOLES,
  },
  {
    name: 'Pulsars & Magnetars',
    category: 'PULSARS',
    count: PULSARS.length,
    description: 'Rotating neutron stars with intense magnetic fields',
    source: 'ATNF Pulsar Catalogue, NASA',
    data: PULSARS,
  },
  {
    name: 'Quasars',
    category: 'QUASARS',
    count: QUASARS.length,
    description: 'Extremely luminous active galactic nuclei',
    source: 'SDSS Quasar Catalog, NASA',
    data: QUASARS,
  },
  {
    name: 'Comets',
    category: 'COMETS',
    count: COMETS.length,
    description: 'Famous comets with historical or scientific significance',
    source: 'JPL Small-Body Database, ESA',
    data: COMETS,
  },
];

interface GenerationStats {
  totalRealObjects: number;
  availableToMint: number;
  alreadyMinted: number;
  byType: Record<string, { total: number; available: number }>;
}

interface NftStats {
  total: number;
  maxCapacity: number;
  remainingSlots: number;
}

export default function AstronomicalDataAdmin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [selectedObject, setSelectedObject] = useState<AstronomicalObject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  // Generation state
  const [generationStats, setGenerationStats] = useState<GenerationStats | null>(null);
  const [nftStats, setNftStats] = useState<NftStats | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reference image lookup state
  const [refLookupName, setRefLookupName] = useState('');
  const [refLookupResult, setRefLookupResult] = useState<{ url: string; source: string; title?: string } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const allObjects = getAllAstronomicalObjects();
  const typeCounts = getObjectCountsByType();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchGenerationStats();
    }
  }, [isLoading]);

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

  async function fetchGenerationStats() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/nfts/generate-from-real-data`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setGenerationStats(data.realDataStats);
        setNftStats(data.nftStats);
      }
    } catch (error) {
      console.error('Failed to fetch generation stats:', error);
    }
  }

  async function handleGenerateFromRealData() {
    setIsGenerating(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/nfts/generate-from-real-data`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ count: generateCount }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchGenerationStats();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to generate NFTs' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate NFTs' });
    } finally {
      setIsGenerating(false);
    }
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
        fetchGenerationStats();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to clear NFTs' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to clear NFTs' });
    } finally {
      setIsClearing(false);
    }
  }

  async function handleGenerateAll() {
    if (!generationStats) return;
    setIsGenerating(true);
    setMessage(null);

    const batchSize = 50;
    let generated = 0;
    const toGenerate = generationStats.availableToMint;

    try {
      const token = localStorage.getItem('adminToken');

      while (generated < toGenerate) {
        const count = Math.min(batchSize, toGenerate - generated);
        const res = await fetch(`${apiUrl}/api/admin/nfts/generate-from-real-data`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ count }),
        });

        const data = await res.json();
        if (!res.ok) {
          setMessage({ type: 'error', text: data.error || 'Failed during batch generation' });
          break;
        }

        generated += data.generated?.length || 0;
        setMessage({ type: 'success', text: `Generated ${generated} of ${toGenerate} NFTs...` });
        await fetchGenerationStats();
      }

      if (generated >= toGenerate) {
        setMessage({ type: 'success', text: `Successfully generated all ${generated} NFTs from real data!` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed during batch generation' });
    } finally {
      setIsGenerating(false);
      fetchGenerationStats();
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

    // Find object type from our data
    const matchingObj = allObjects.find(obj =>
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

  const filteredObjects = allObjects.filter(obj => {
    const matchesSearch = !searchQuery ||
      obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.alternateNames?.some(n => n.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = !filterType || obj.objectType === filterType;
    return matchesSearch && matchesType;
  });

  const objectTypes = Object.keys(typeCounts).sort();

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
                {allObjects.length} Total Objects
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

          {/* NFT Generation Controls */}
          <div className="mb-8 p-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-lg border border-purple-500/30">
            <h2 className="text-lg font-semibold text-purple-400 mb-4">NFT Generation from Real Data</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">
                  {generationStats?.totalRealObjects ?? allObjects.length}
                </div>
                <div className="text-sm text-gray-400">Total Real Objects</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">
                  {generationStats?.availableToMint ?? 0}
                </div>
                <div className="text-sm text-gray-400">Available to Mint</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">
                  {generationStats?.alreadyMinted ?? 0}
                </div>
                <div className="text-sm text-gray-400">Already Minted</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">
                  {nftStats?.total ?? 0}
                </div>
                <div className="text-sm text-gray-400">Total NFTs in DB</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-gray-300">Generate:</label>
                <input
                  type="number"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                  min={1}
                  max={100}
                />
                <button
                  onClick={handleGenerateFromRealData}
                  disabled={isGenerating || !generationStats?.availableToMint}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition-colors"
                >
                  {isGenerating ? 'Generating...' : 'Generate NFTs'}
                </button>
              </div>

              <button
                onClick={handleGenerateAll}
                disabled={isGenerating || !generationStats?.availableToMint}
                className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition-colors"
              >
                {isGenerating ? 'Generating...' : `Generate All (${generationStats?.availableToMint ?? 0})`}
              </button>

              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={isClearing || !nftStats?.total}
                className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition-colors"
              >
                Clear All NFTs
              </button>

              <button
                onClick={fetchGenerationStats}
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

          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            {DATA_SOURCES.map(source => (
              <button
                key={source.category}
                onClick={() => {
                  setSelectedSource(source);
                  setSelectedObject(null);
                }}
                className={`p-4 rounded-lg border transition-all ${
                  selectedSource?.category === source.category
                    ? 'bg-purple-600 border-purple-400'
                    : 'bg-gray-800 border-gray-700 hover:border-purple-500'
                }`}
              >
                <div className="text-2xl font-bold text-purple-400">{source.count}</div>
                <div className="text-sm text-gray-300">{source.name}</div>
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Data Sources List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-semibold text-purple-400 mb-4">Data Sources</h2>
              {DATA_SOURCES.map(source => (
                <div
                  key={source.category}
                  onClick={() => {
                    setSelectedSource(source);
                    setSelectedObject(null);
                  }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedSource?.category === source.category
                      ? 'bg-purple-600/20 border-purple-500'
                      : 'bg-gray-800 border-gray-700 hover:border-purple-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white">{source.name}</h3>
                    <span className="bg-purple-600 text-white px-2 py-0.5 rounded text-sm">
                      {source.count}
                    </span>
                  </div>
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
              {selectedSource ? (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-purple-400">
                      {selectedSource.name} ({selectedSource.count} objects)
                    </h2>
                    <button
                      onClick={() => setSelectedSource(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      &times; Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                    {selectedSource.data.map((obj, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedObject(obj)}
                        className={`p-3 rounded border cursor-pointer transition-all ${
                          selectedObject?.name === obj.name
                            ? 'bg-purple-600/30 border-purple-400'
                            : 'bg-gray-700/50 border-gray-600 hover:border-purple-500'
                        }`}
                      >
                        <div className="font-semibold text-white">{obj.name}</div>
                        <div className="text-xs text-purple-400">{obj.objectType}</div>
                        {obj.constellation && (
                          <div className="text-xs text-gray-400">
                            Constellation: {obj.constellation}
                          </div>
                        )}
                        {obj.distanceDisplay && (
                          <div className="text-xs text-gray-500">{obj.distanceDisplay}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Search and Filter */}
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-4">
                    <div className="flex gap-4">
                      <input
                        type="text"
                        placeholder="Search objects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                      />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                      >
                        <option value="">All Types</option>
                        {objectTypes.map(type => (
                          <option key={type} value={type}>{type} ({typeCounts[type]})</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      Showing {filteredObjects.length} of {allObjects.length} objects
                    </div>
                  </div>

                  {/* All Objects Grid */}
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <h2 className="text-lg font-semibold text-purple-400 mb-4">
                      All Astronomical Objects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                      {filteredObjects.map((obj, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedObject(obj)}
                          className={`p-3 rounded border cursor-pointer transition-all ${
                            selectedObject?.name === obj.name
                              ? 'bg-purple-600/30 border-purple-400'
                              : 'bg-gray-700/50 border-gray-600 hover:border-purple-500'
                          }`}
                        >
                          <div className="font-semibold text-white">{obj.name}</div>
                          <div className="text-xs text-purple-400">{obj.objectType}</div>
                          {obj.constellation && (
                            <div className="text-xs text-gray-400">
                              Constellation: {obj.constellation}
                            </div>
                          )}
                          {obj.distanceDisplay && (
                            <div className="text-xs text-gray-500">{obj.distanceDisplay}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
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
                  {/* Type Badge */}
                  <div className="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                    {selectedObject.objectType}
                  </div>

                  {/* Alternate Names */}
                  {selectedObject.alternateNames && selectedObject.alternateNames.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400">Also Known As</h3>
                      <p className="text-gray-300">{selectedObject.alternateNames.join(', ')}</p>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400">Description</h3>
                    <p className="text-white">{selectedObject.description}</p>
                  </div>

                  {/* Properties Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedObject.constellation && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400">Constellation</h3>
                        <p className="text-white">{selectedObject.constellation}</p>
                      </div>
                    )}
                    {selectedObject.distanceDisplay && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400">Distance</h3>
                        <p className="text-white">{selectedObject.distanceDisplay}</p>
                      </div>
                    )}
                    {selectedObject.mass && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400">Mass</h3>
                        <p className="text-white">{selectedObject.mass.toLocaleString()} solar masses</p>
                      </div>
                    )}
                    {selectedObject.temperature && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400">Temperature</h3>
                        <p className="text-white">{selectedObject.temperature.toLocaleString()} K</p>
                      </div>
                    )}
                    {selectedObject.luminosity && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400">Luminosity</h3>
                        <p className="text-white">{selectedObject.luminosity.toLocaleString()} solar luminosities</p>
                      </div>
                    )}
                    {selectedObject.magnitude !== undefined && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400">Apparent Magnitude</h3>
                        <p className="text-white">{selectedObject.magnitude}</p>
                      </div>
                    )}
                    {selectedObject.spectralType && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400">Spectral Type</h3>
                        <p className="text-white">{selectedObject.spectralType}</p>
                      </div>
                    )}
                    {selectedObject.discoveryYear && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400">Discovery Year</h3>
                        <p className="text-white">
                          {selectedObject.discoveryYear < 0
                            ? `${Math.abs(selectedObject.discoveryYear)} BC`
                            : selectedObject.discoveryYear}
                        </p>
                      </div>
                    )}
                    {selectedObject.discoverer && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400">Discoverer</h3>
                        <p className="text-white">{selectedObject.discoverer}</p>
                      </div>
                    )}
                    {selectedObject.age && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400">Age</h3>
                        <p className="text-white">{selectedObject.age} billion years</p>
                      </div>
                    )}
                  </div>

                  {/* Notable Features */}
                  {selectedObject.notableFeatures && selectedObject.notableFeatures.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Notable Features</h3>
                      <ul className="list-disc list-inside text-gray-300 space-y-1">
                        {selectedObject.notableFeatures.map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Scientific Significance */}
                  {selectedObject.scientificSignificance && (
                    <div className="bg-purple-600/20 border border-purple-500/30 rounded p-4">
                      <h3 className="text-sm font-semibold text-purple-400 mb-1">Scientific Significance</h3>
                      <p className="text-white">{selectedObject.scientificSignificance}</p>
                    </div>
                  )}
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
