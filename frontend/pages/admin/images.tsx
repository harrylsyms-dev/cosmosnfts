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

interface PromptStats {
  total: number;
  withPrompts: number;
  withoutPrompts: number;
}

interface RegenerateProgress {
  processed: number;
  updated: number;
  failed: number;
  remaining: number;
  isRunning: boolean;
}

interface LeonardoModel {
  id: string;
  name: string;
  description: string;
}

interface DimensionPreset {
  width: number;
  height: number;
  label: string;
}

interface LeonardoSettings {
  modelId: string;
  modelName: string;
  width: number;
  height: number;
  contrast: number;
  enhancePrompt: boolean;
  guidanceScale: number;
  numImages: number;
  isPublic: boolean;
}

interface LeonardoSettingsResponse {
  success: boolean;
  settings: LeonardoSettings;
  availableModels: LeonardoModel[];
  contrastValues: number[];
  dimensionPresets: DimensionPreset[];
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

  // Prompt regeneration state
  const [promptStats, setPromptStats] = useState<PromptStats | null>(null);
  const [regenProgress, setRegenProgress] = useState<RegenerateProgress | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Leonardo settings state
  const [leonardoSettings, setLeonardoSettings] = useState<LeonardoSettings | null>(null);
  const [availableModels, setAvailableModels] = useState<LeonardoModel[]>([]);
  const [contrastValues, setContrastValues] = useState<number[]>([]);
  const [dimensionPresets, setDimensionPresets] = useState<DimensionPreset[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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

      await Promise.all([fetchStats(), fetchApiStatus(), fetchPromptStats(), fetchLeonardoSettings()]);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchLeonardoSettings() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/leonardo-settings`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data: LeonardoSettingsResponse = await res.json();
        setLeonardoSettings(data.settings);
        setAvailableModels(data.availableModels);
        setContrastValues(data.contrastValues);
        setDimensionPresets(data.dimensionPresets);
      }
    } catch (error) {
      console.error('Failed to fetch Leonardo settings:', error);
    }
  }

  async function saveLeonardoSettings() {
    if (!leonardoSettings) return;

    setIsSavingSettings(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/leonardo-settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(leonardoSettings),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Leonardo settings saved successfully!' });
        setLeonardoSettings(data.settings);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSavingSettings(false);
    }
  }

  function handleModelChange(modelId: string) {
    const model = availableModels.find(m => m.id === modelId);
    if (model && leonardoSettings) {
      setLeonardoSettings({
        ...leonardoSettings,
        modelId: model.id,
        modelName: model.name,
      });
    }
  }

  function handleDimensionChange(preset: DimensionPreset) {
    if (leonardoSettings) {
      setLeonardoSettings({
        ...leonardoSettings,
        width: preset.width,
        height: preset.height,
      });
    }
  }

  async function fetchPromptStats() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/nfts/regenerate-prompts`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPromptStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch prompt stats:', error);
    }
  }

  async function regenerateAllPrompts() {
    setIsRegenerating(true);
    setRegenProgress({ processed: 0, updated: 0, failed: 0, remaining: promptStats?.total || 0, isRunning: true });

    let offset = 0;
    const batchSize = 200;
    let totalUpdated = 0;
    let totalFailed = 0;

    try {
      const token = localStorage.getItem('adminToken');

      while (true) {
        const res = await fetch(`${apiUrl}/api/admin/nfts/regenerate-prompts`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ batchSize, offset }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to regenerate prompts');
        }

        totalUpdated += data.stats.updated;
        totalFailed += data.stats.failed;

        setRegenProgress({
          processed: offset + data.stats.processed,
          updated: totalUpdated,
          failed: totalFailed,
          remaining: data.pagination.remaining,
          isRunning: true,
        });

        if (!data.pagination.nextOffset) {
          break;
        }

        offset = data.pagination.nextOffset;

        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setMessage({
        type: 'success',
        text: `Successfully regenerated ${totalUpdated.toLocaleString()} prompts!`,
      });

      // Refresh stats
      await fetchPromptStats();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to regenerate prompts',
      });
    } finally {
      setIsRegenerating(false);
      setRegenProgress(prev => prev ? { ...prev, isRunning: false } : null);
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

        <main className="max-w-6xl mx-auto px-4 py-8">
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
            </div>
          )}

          {/* Leonardo AI Settings */}
          {leonardoSettings && (
            <div className="bg-gray-900 rounded-lg p-6 border border-purple-800 mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-purple-400">⚙</span>
                Leonardo AI Settings
              </h2>
              <p className="text-gray-400 mb-6">
                Configure the Leonardo AI image generation parameters. Changes will apply to all new image generations.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Model Selection */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Model</label>
                  <select
                    value={leonardoSettings.modelId}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  >
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                  <p className="text-gray-500 text-xs mt-1">
                    {leonardoSettings.modelId === 'flux-pro-2.0'
                      ? 'FLUX.2 Pro uses V2 API for best quality'
                      : 'Legacy models use V1 API'}
                  </p>
                </div>

                {/* Image Dimensions */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Dimensions</label>
                  <select
                    value={`${leonardoSettings.width}x${leonardoSettings.height}`}
                    onChange={(e) => {
                      const preset = dimensionPresets.find(d => `${d.width}x${d.height}` === e.target.value);
                      if (preset) handleDimensionChange(preset);
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  >
                    {dimensionPresets.map((preset) => (
                      <option key={preset.label} value={`${preset.width}x${preset.height}`}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contrast (for V1 models) */}
                {leonardoSettings.modelId !== 'flux-pro-2.0' && (
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Contrast</label>
                    <select
                      value={leonardoSettings.contrast}
                      onChange={(e) => setLeonardoSettings({ ...leonardoSettings, contrast: parseFloat(e.target.value) })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    >
                      {contrastValues.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Number of Images */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Images per Generation</label>
                  <select
                    value={leonardoSettings.numImages}
                    onChange={(e) => setLeonardoSettings({ ...leonardoSettings, numImages: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  >
                    {[1, 2, 3, 4].map((num) => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggle Options */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Prompt Enhance</p>
                    <p className="text-gray-400 text-sm">
                      Let Leonardo AI enhance your prompts (NOT recommended for scientific imagery)
                    </p>
                  </div>
                  <button
                    onClick={() => setLeonardoSettings({ ...leonardoSettings, enhancePrompt: !leonardoSettings.enhancePrompt })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      leonardoSettings.enhancePrompt ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        leonardoSettings.enhancePrompt ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Privacy Mode</p>
                    <p className="text-gray-400 text-sm">
                      {leonardoSettings.isPublic
                        ? 'Images are public on Leonardo AI'
                        : 'Images are private (only visible to you)'}
                    </p>
                  </div>
                  <button
                    onClick={() => setLeonardoSettings({ ...leonardoSettings, isPublic: !leonardoSettings.isPublic })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      !leonardoSettings.isPublic ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        !leonardoSettings.isPublic ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Current Settings Summary */}
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-sm">
                  <strong className="text-white">Current Configuration:</strong>{' '}
                  {leonardoSettings.modelName} at {leonardoSettings.width}x{leonardoSettings.height},{' '}
                  {leonardoSettings.enhancePrompt ? 'Enhanced Prompts' : 'Raw Prompts'},{' '}
                  {leonardoSettings.isPublic ? 'Public' : 'Private'} mode
                </p>
              </div>

              {/* Save Button */}
              <div className="mt-6">
                <button
                  onClick={saveLeonardoSettings}
                  disabled={isSavingSettings}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Prompt Info */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
            <h2 className="text-xl font-bold mb-4">Image Prompts</h2>
            <p className="text-gray-400 mb-4">
              Image prompts are automatically generated from astronomical data when NFTs are created.
              Each NFT stores its own optimized prompt based on object type, spectral classification,
              and other scientific properties.
            </p>
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                <strong>Prompt Templates:</strong> Defined in <code className="bg-gray-800 px-1 rounded">lib/imagePromptTemplates.ts</code>.
                These templates use NASA-style imagery references and object-specific visual characteristics
                to generate photorealistic space imagery.
              </p>
            </div>
          </div>

          {/* Regenerate Prompts */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
            <h2 className="text-xl font-bold mb-4">Regenerate Prompts</h2>
            <p className="text-gray-400 mb-4">
              Regenerate image prompts for all existing NFTs using the latest template system.
              This will update the stored prompts with improved formatting and object-specific negative prompts.
            </p>

            {/* Prompt Stats */}
            {promptStats && (
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-400 text-sm">Total NFTs</p>
                  <p className="text-2xl font-bold">{promptStats.total.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-green-800">
                  <p className="text-gray-400 text-sm">With Prompts</p>
                  <p className="text-2xl font-bold text-green-400">{promptStats.withPrompts.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-yellow-800">
                  <p className="text-gray-400 text-sm">Missing Prompts</p>
                  <p className="text-2xl font-bold text-yellow-400">{promptStats.withoutPrompts.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Progress */}
            {regenProgress && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">
                    {regenProgress.isRunning ? 'Regenerating...' : 'Complete'}
                  </span>
                  <span className="text-white">
                    {regenProgress.processed.toLocaleString()} / {(regenProgress.processed + regenProgress.remaining).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${regenProgress.isRunning ? 'bg-blue-500' : 'bg-green-500'}`}
                    style={{
                      width: `${((regenProgress.processed) / (regenProgress.processed + regenProgress.remaining)) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-green-400">Updated: {regenProgress.updated.toLocaleString()}</span>
                  {regenProgress.failed > 0 && (
                    <span className="text-red-400">Failed: {regenProgress.failed.toLocaleString()}</span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={regenerateAllPrompts}
              disabled={isRegenerating}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegenerating ? 'Regenerating...' : 'Regenerate All Prompts'}
            </button>

            <p className="text-gray-500 text-sm mt-3">
              This will process all NFTs in batches of 200. The process runs in the background.
            </p>
          </div>

          {/* Generate Form */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
            <h2 className="text-xl font-bold mb-4">Generate Images</h2>
            <p className="text-gray-400 mb-4">
              Generate AI images for NFTs by phase. Images are uploaded to Pinata IPFS.
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
                  disabled={isGenerating || !!(apiStatus && (!apiStatus.configured.leonardo || !apiStatus.configured.pinata))}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Starting...' : `Generate Phase ${selectedPhase}`}
                </button>
              </div>
            </form>
          </div>

          {/* Verify Images */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
            <h2 className="text-xl font-bold mb-4">Verify Images on IPFS</h2>
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
                  <p className="text-red-400">Failed: {verifyResult.failed.length}</p>
                )}
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
