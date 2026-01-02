import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface GenerationJob {
  id: string;
  status: string;
  totalNfts: number;
  processedNfts: number;
  startedAt: string;
  completedAt: string | null;
}

export default function AdminImages() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    startId: '1',
    endId: '100',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

      await fetchJobs();
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchJobs() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/images/jobs`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/images/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          startId: parseInt(generateForm.startId),
          endId: parseInt(generateForm.endId),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Image generation started for NFTs ${generateForm.startId}-${generateForm.endId}` });
        await fetchJobs();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to start generation' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start generation' });
    } finally {
      setIsGenerating(false);
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

          {/* Generate Form */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
            <h2 className="text-xl font-bold mb-4">Generate Images</h2>
            <p className="text-gray-400 mb-4">
              Generate AI images for NFTs that don't have images yet. This uses the configured image generation API.
            </p>

            <form onSubmit={handleGenerate} className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Start NFT ID</label>
                <input
                  type="number"
                  value={generateForm.startId}
                  onChange={(e) => setGenerateForm({ ...generateForm, startId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">End NFT ID</label>
                <input
                  type="number"
                  value={generateForm.endId}
                  onChange={(e) => setGenerateForm({ ...generateForm, endId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  min="1"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {isGenerating ? 'Starting...' : 'Start Generation'}
                </button>
              </div>
            </form>

            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
              <p className="text-yellow-200 text-sm">
                <strong>Note:</strong> Image generation requires an API key for the image generation service.
                Make sure OPENAI_API_KEY or similar is configured in your environment.
              </p>
            </div>
          </div>

          {/* Jobs List */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4">Generation Jobs</h2>

            {jobs.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No generation jobs yet</p>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Job #{job.id.slice(0, 8)}</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        job.status === 'completed' ? 'bg-green-900 text-green-300' :
                        job.status === 'running' ? 'bg-blue-900 text-blue-300' :
                        job.status === 'failed' ? 'bg-red-900 text-red-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      Progress: {job.processedNfts} / {job.totalNfts}
                    </div>
                    {job.status === 'running' && (
                      <div className="mt-2 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${(job.processedNfts / job.totalNfts) * 100}%` }}
                        />
                      </div>
                    )}
                    <div className="text-gray-500 text-xs mt-2">
                      Started: {new Date(job.startedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
