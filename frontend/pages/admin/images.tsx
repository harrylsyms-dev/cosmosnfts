import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface NFTStats {
  total: number;
  withImages: number;
  withoutImages: number;
}

interface APIStatus {
  configured: {
    leonardo: boolean;
    pinata: boolean;
  };
  message: string;
}

export default function AdminImages() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<NFTStats | null>(null);
  const [apiStatus, setApiStatus] = useState<APIStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState('1');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ verified: number; failed: number[] } | null>(null);

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

      await Promise.all([fetchStats(), fetchApiStatus()]);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchApiStatus() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/images/status`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setApiStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch API status:', error);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${apiUrl}/api/nfts/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats({
          total: data.total || 0,
          withImages: data.withImages || 0,
          withoutImages: data.total - (data.withImages || 0),
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  async function handleGeneratePhase(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('adminToken');
      const endpoint = selectedPhase === '1'
        ? `${apiUrl}/api/images/generate-phase1`
        : `${apiUrl}/api/images/generate-phase/${selectedPhase}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Phase ${selectedPhase} image generation started! ${data.estimatedTime || 'Check logs for progress.'}`
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to start generation' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start generation. Check if LEONARDO_AI_API_KEY is configured.' });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleVerify() {
    try {
      const token = localStorage.getItem('adminToken');
      // Verify first 100 NFTs as a sample
      const tokenIds = Array.from({ length: 100 }, (_, i) => i + 1);

      const res = await fetch(`${apiUrl}/api/images/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tokenIds }),
      });

      const data = await res.json();
      if (res.ok) {
        setVerifyResult({ verified: data.verified, failed: data.failed });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to verify images' });
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
        <title>Image Generation | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold text-white hover:text-gray-300">
                CosmoNFT Admin
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400">Image Generation</span>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {message && (
            <div className={`mb-6 p-4 rounded ${
              message.type === 'success'
                ? 'bg-green-900/30 border border-green-600 text-green-400'
                : 'bg-red-900/30 border border-red-600 text-red-400'
            }`}>
              {message.text}
              <button onClick={() => setMessage(null)} className="float-right hover:opacity-75">&times;</button>
            </div>
          )}

          <h1 className="text-2xl font-bold mb-6">NFT Image Generation</h1>

          {/* Stats */}
          {stats && (
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <p className="text-gray-400 text-sm">Total NFTs</p>
                <p className="text-3xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-green-800">
                <p className="text-gray-400 text-sm">With Images</p>
                <p className="text-3xl font-bold text-green-400">{stats.withImages.toLocaleString()}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-yellow-800">
                <p className="text-gray-400 text-sm">Need Images</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.withoutImages.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* API Status */}
          {apiStatus && (
            <div className={`mb-6 p-4 rounded-lg border ${
              apiStatus.configured.leonardo && apiStatus.configured.pinata
                ? 'bg-green-900/20 border-green-600'
                : 'bg-red-900/20 border-red-600'
            }`}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${apiStatus.configured.leonardo ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={apiStatus.configured.leonardo ? 'text-green-400' : 'text-red-400'}>
                    Leonardo AI: {apiStatus.configured.leonardo ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${apiStatus.configured.pinata ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={apiStatus.configured.pinata ? 'text-green-400' : 'text-red-400'}>
                    Pinata IPFS: {apiStatus.configured.pinata ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
              </div>
              {(!apiStatus.configured.leonardo || !apiStatus.configured.pinata) && (
                <p className="text-yellow-400 text-sm mt-2">
                  Add the missing API keys to your Render environment variables to enable image generation.
                </p>
              )}
            </div>
          )}

          {/* Generate Form */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
            <h2 className="text-xl font-bold mb-4">Generate Images with Leonardo AI</h2>
            <p className="text-gray-400 mb-4">
              Generate AI images for NFTs by phase. Images are uploaded to Pinata IPFS automatically.
            </p>

            <form onSubmit={handleGeneratePhase} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Select Phase</label>
                <select
                  value={selectedPhase}
                  onChange={(e) => setSelectedPhase(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="1">Phase 1 (1,000 NFTs)</option>
                  {Array.from({ length: 80 }, (_, i) => i + 2).map((phase) => (
                    <option key={phase} value={phase.toString()}>
                      Phase {phase} (250 NFTs)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isGenerating || !apiStatus?.configured.leonardo || !apiStatus?.configured.pinata}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Starting...' : `Generate Phase ${selectedPhase}`}
                </button>
              </div>
            </form>

            {(!apiStatus?.configured.leonardo || !apiStatus?.configured.pinata) && (
              <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  <strong>Required Environment Variables (add to Render):</strong>
                </p>
                <ul className="text-yellow-200 text-sm mt-2 list-disc list-inside">
                  <li className={apiStatus?.configured.leonardo ? 'line-through opacity-50' : ''}>
                    LEONARDO_AI_API_KEY - Your Leonardo AI API key
                  </li>
                  <li className={apiStatus?.configured.pinata ? 'line-through opacity-50' : ''}>
                    PINATA_API_KEY - Pinata IPFS API key
                  </li>
                  <li className={apiStatus?.configured.pinata ? 'line-through opacity-50' : ''}>
                    PINATA_API_SECRET - Pinata IPFS secret
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Verify Images */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
            <h2 className="text-xl font-bold mb-4">Verify Images on IPFS</h2>
            <p className="text-gray-400 mb-4">
              Check if generated images are accessible on IPFS (samples first 100 NFTs).
            </p>

            <button
              onClick={handleVerify}
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2 rounded-lg"
            >
              Verify Images
            </button>

            {verifyResult && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <p className="text-green-400">Verified: {verifyResult.verified}</p>
                {verifyResult.failed.length > 0 && (
                  <p className="text-red-400">Failed: {verifyResult.failed.length} ({verifyResult.failed.slice(0, 10).join(', ')}...)</p>
                )}
              </div>
            )}
          </div>

          {/* How It Works */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4">How Image Generation Works</h2>
            <div className="space-y-3 text-gray-400">
              <p><strong className="text-white">1.</strong> Select a phase to generate images for</p>
              <p><strong className="text-white">2.</strong> Leonardo AI generates cosmic artwork based on NFT data</p>
              <p><strong className="text-white">3.</strong> Images are uploaded to Pinata IPFS</p>
              <p><strong className="text-white">4.</strong> Metadata JSON is created with IPFS links</p>
              <p><strong className="text-white">5.</strong> Database is updated with IPFS hashes</p>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              Phase 1 (1,000 images) takes approximately 2-3 hours. Other phases (250 images) take ~45 minutes.
            </p>
          </div>

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
