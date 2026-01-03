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
  globalPrompt?: string;
}

interface PromptPreview {
  id: number;
  name: string;
  objectType: string;
  description: string;
  totalScore: number;
  badgeTier: string;
  prompt: string;
  hasImage: boolean;
}

interface ObjectTypeConfig {
  description: string;
  visualFeatures: string;
  customPrompt?: string;
  negativePrompt?: string;
}

interface ImagePromptConfig {
  id: string;
  basePromptTemplate: string | null;
  artStyle: string;
  colorPalette: string;
  lightingStyle: string;
  compositionStyle: string;
  qualityDescriptors: string;
  mediumDescriptors: string;
  realismLevel: number;
  usePhotorealistic: boolean;
  useScientificAccuracy: boolean;
  avoidArtisticStylization: boolean;
  leonardoModelId: string;
  imageWidth: number;
  imageHeight: number;
  promptMagic: boolean;
  guidanceScale: number;
  negativePrompt: string;
  objectTypeConfigs: Record<string, ObjectTypeConfig>;
  premiumThreshold: number;
  eliteThreshold: number;
  legendaryThreshold: number;
  premiumModifier: string;
  eliteModifier: string;
  legendaryModifier: string;
  includeScoreInPrompt: boolean;
  includeMetadataInPrompt: boolean;
  useDescriptionTransform: boolean;
}

interface LeonardoModel {
  id: string;
  name: string;
  description: string;
}

const OBJECT_TYPES = [
  'Star', 'Galaxy', 'Nebula', 'Black Hole', 'Planet', 'Moon', 'Exoplanet',
  'Pulsar', 'Quasar', 'Supernova', 'Supernova Remnant', 'Asteroid', 'Comet',
  'Star Cluster', 'Dwarf Planet', 'Magnetar'
];

export default function AdminImages() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<NFTStats | null>(null);
  const [apiStatus, setApiStatus] = useState<APIStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState('1');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ verified: number; failed: number[] } | null>(null);
  const [promptPreviews, setPromptPreviews] = useState<PromptPreview[]>([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [showPreviews, setShowPreviews] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<PromptPreview | null>(null);

  // Advanced Prompt Editor State
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [promptConfig, setPromptConfig] = useState<ImagePromptConfig | null>(null);
  const [availableModels, setAvailableModels] = useState<LeonardoModel[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'template' | 'style' | 'realism' | 'leonardo' | 'objects' | 'modifiers'>('template');
  const [selectedObjectType, setSelectedObjectType] = useState<string>('Star');

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

      await Promise.all([fetchStats(), fetchApiStatus(), fetchPromptConfig()]);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchPromptConfig() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/image-prompt-config`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPromptConfig(data.config);
        setAvailableModels(data.availableModels || []);
      }
    } catch (error) {
      console.error('Failed to fetch prompt config:', error);
    }
  }

  async function savePromptConfig() {
    if (!promptConfig) return;

    setIsSavingConfig(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/image-prompt-config`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(promptConfig),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Prompt configuration saved successfully!' });
        // Refresh previews if visible
        if (showPreviews) {
          fetchPromptPreviews();
        }
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setIsSavingConfig(false);
    }
  }

  function updateConfig<K extends keyof ImagePromptConfig>(key: K, value: ImagePromptConfig[K]) {
    setPromptConfig(prev => prev ? { ...prev, [key]: value } : null);
  }

  function updateObjectTypeConfig(objectType: string, field: keyof ObjectTypeConfig, value: string) {
    if (!promptConfig) return;
    const newConfigs = {
      ...promptConfig.objectTypeConfigs,
      [objectType]: {
        ...promptConfig.objectTypeConfigs[objectType],
        [field]: value
      }
    };
    updateConfig('objectTypeConfigs', newConfigs);
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

  async function fetchPromptPreviews() {
    setIsLoadingPreviews(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/nfts/preview-prompts`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setPromptPreviews(data.previews || []);
        setShowPreviews(true);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch prompt previews' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch prompt previews' });
    } finally {
      setIsLoadingPreviews(false);
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

          {/* Advanced Prompt Editor Toggle */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 mb-8">
            <button
              onClick={() => setShowAdvancedEditor(!showAdvancedEditor)}
              className="w-full p-6 flex items-center justify-between text-left"
            >
              <div>
                <h2 className="text-xl font-bold text-white">Advanced Prompt Editor</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Full control over every aspect of image generation prompts
                </p>
              </div>
              <span className="text-2xl text-gray-400">{showAdvancedEditor ? '−' : '+'}</span>
            </button>

            {showAdvancedEditor && promptConfig && (
              <div className="border-t border-gray-800">
                {/* Tab Navigation */}
                <div className="flex overflow-x-auto border-b border-gray-800">
                  {[
                    { id: 'template', label: 'Base Template' },
                    { id: 'style', label: 'Style & Colors' },
                    { id: 'realism', label: 'Realism' },
                    { id: 'leonardo', label: 'Leonardo AI' },
                    { id: 'objects', label: 'Object Types' },
                    { id: 'modifiers', label: 'Score Modifiers' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'text-blue-400 border-b-2 border-blue-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* Base Template Tab */}
                  {activeTab === 'template' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-white font-medium mb-2">Base Prompt Template</label>
                        <p className="text-gray-400 text-sm mb-3">
                          The main template used for all image generation. Use placeholders like {'{name}'}, {'{objectType}'}, etc.
                        </p>
                        <textarea
                          value={promptConfig.basePromptTemplate || ''}
                          onChange={(e) => updateConfig('basePromptTemplate', e.target.value)}
                          rows={10}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                          placeholder="Photorealistic astrophotography of {name}, a {objectType}..."
                        />
                      </div>

                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-gray-400 text-sm font-semibold mb-3">Available Placeholders:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {[
                            ['{name}', 'NFT name', 'From NFT database'],
                            ['{objectType}', 'Object type', 'From NFT database'],
                            ['{description}', 'NFT description', 'From NFT database'],
                            ['{score}', 'Cosmic score (0-500)', 'From NFT database'],
                            ['{badge}', 'Badge tier', 'From NFT database'],
                            ['{features}', 'Visual Features', 'Object Types tab'],
                            ['{artStyle}', 'Art Style', 'Style & Colors tab'],
                            ['{colorPalette}', 'Color Palette', 'Style & Colors tab'],
                            ['{lightingStyle}', 'Lighting Style', 'Style & Colors tab'],
                            ['{qualityDescriptors}', 'Quality Descriptors', 'Style & Colors tab'],
                            ['{mediumDescriptors}', 'Medium Descriptors', 'Style & Colors tab'],
                            ['{scoreModifier}', 'Score Modifier Text', 'Score Modifiers tab'],
                            ['{negativePrompt}', 'Negative Prompt', 'Below on this tab'],
                          ].map(([key, desc, source]) => (
                            <div key={key} className="flex items-center gap-2 py-1">
                              <code className="text-blue-400 bg-gray-900 px-2 py-0.5 rounded text-xs">{key}</code>
                              <span className="text-white text-xs">{desc}</span>
                              <span className="text-gray-500 text-xs">← {source}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-1">Negative Prompt <code className="text-blue-400 text-xs ml-2">{'{negativePrompt}'}</code></label>
                        <p className="text-gray-400 text-sm mb-3">
                          What to exclude from generated images
                        </p>
                        <textarea
                          value={promptConfig.negativePrompt}
                          onChange={(e) => updateConfig('negativePrompt', e.target.value)}
                          rows={3}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                          placeholder="cartoon, anime, illustration, text, watermarks..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Style & Colors Tab */}
                  {activeTab === 'style' && (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-white font-medium mb-1">Art Style <code className="text-blue-400 text-xs ml-2">{'{artStyle}'}</code></label>
                          <input
                            type="text"
                            value={promptConfig.artStyle}
                            onChange={(e) => updateConfig('artStyle', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                            placeholder="photorealistic astrophotography"
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-1">Color Palette <code className="text-blue-400 text-xs ml-2">{'{colorPalette}'}</code></label>
                          <input
                            type="text"
                            value={promptConfig.colorPalette}
                            onChange={(e) => updateConfig('colorPalette', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                            placeholder="Natural space colors, deep blacks..."
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-1">Lighting Style <code className="text-blue-400 text-xs ml-2">{'{lightingStyle}'}</code></label>
                          <input
                            type="text"
                            value={promptConfig.lightingStyle}
                            onChange={(e) => updateConfig('lightingStyle', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                            placeholder="Natural starlight, subtle glow..."
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-1">Composition Style <code className="text-gray-500 text-xs ml-2">(no placeholder)</code></label>
                          <input
                            type="text"
                            value={promptConfig.compositionStyle}
                            onChange={(e) => updateConfig('compositionStyle', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                            placeholder="Scientific, documentary-style"
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-1">Quality Descriptors <code className="text-blue-400 text-xs ml-2">{'{qualityDescriptors}'}</code></label>
                          <input
                            type="text"
                            value={promptConfig.qualityDescriptors}
                            onChange={(e) => updateConfig('qualityDescriptors', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                            placeholder="8K, ultra high definition, NASA-quality"
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-1">Medium Descriptors <code className="text-blue-400 text-xs ml-2">{'{mediumDescriptors}'}</code></label>
                          <input
                            type="text"
                            value={promptConfig.mediumDescriptors}
                            onChange={(e) => updateConfig('mediumDescriptors', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                            placeholder="Telescope photography, Hubble-style"
                          />
                        </div>
                      </div>

                      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                        <p className="text-blue-300 text-sm">
                          <strong>Tip for realistic images:</strong> Use terms like &quot;photorealistic&quot;, &quot;NASA imagery&quot;,
                          &quot;Hubble telescope&quot;, &quot;scientific photograph&quot;, &quot;actual space photo&quot; in your style descriptors.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Realism Tab */}
                  {activeTab === 'realism' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Realism Level: {promptConfig.realismLevel}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={promptConfig.realismLevel}
                          onChange={(e) => updateConfig('realismLevel', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Artistic</span>
                          <span>Balanced</span>
                          <span>Photorealistic</span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <label className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={promptConfig.usePhotorealistic}
                            onChange={(e) => updateConfig('usePhotorealistic', e.target.checked)}
                            className="w-5 h-5 rounded bg-gray-700 border-gray-600"
                          />
                          <div>
                            <p className="text-white font-medium">Photorealistic Mode</p>
                            <p className="text-gray-400 text-xs">Adds &quot;photorealistic&quot; to prompts</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={promptConfig.useScientificAccuracy}
                            onChange={(e) => updateConfig('useScientificAccuracy', e.target.checked)}
                            className="w-5 h-5 rounded bg-gray-700 border-gray-600"
                          />
                          <div>
                            <p className="text-white font-medium">Scientific Accuracy</p>
                            <p className="text-gray-400 text-xs">Prioritize accurate depiction</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={promptConfig.avoidArtisticStylization}
                            onChange={(e) => updateConfig('avoidArtisticStylization', e.target.checked)}
                            className="w-5 h-5 rounded bg-gray-700 border-gray-600"
                          />
                          <div>
                            <p className="text-white font-medium">Avoid Stylization</p>
                            <p className="text-gray-400 text-xs">No artistic filters</p>
                          </div>
                        </label>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={promptConfig.includeScoreInPrompt}
                            onChange={(e) => updateConfig('includeScoreInPrompt', e.target.checked)}
                            className="w-5 h-5 rounded bg-gray-700 border-gray-600"
                          />
                          <div>
                            <p className="text-white font-medium">Include Score in Prompt</p>
                            <p className="text-gray-400 text-xs">Add numeric score to prompt</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={promptConfig.useDescriptionTransform}
                            onChange={(e) => updateConfig('useDescriptionTransform', e.target.checked)}
                            className="w-5 h-5 rounded bg-gray-700 border-gray-600"
                          />
                          <div>
                            <p className="text-white font-medium">Poetic Description Transform</p>
                            <p className="text-gray-400 text-xs">Convert to artistic language</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Leonardo AI Tab */}
                  {activeTab === 'leonardo' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-white font-medium mb-2">Leonardo Model</label>
                        <select
                          value={promptConfig.leonardoModelId}
                          onChange={(e) => updateConfig('leonardoModelId', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        >
                          {availableModels.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name} - {model.description}
                            </option>
                          ))}
                        </select>
                        <p className="text-gray-400 text-sm mt-2">
                          For realistic images, try &quot;Leonardo PhotoReal&quot; or &quot;Leonardo Diffusion XL&quot;
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-white font-medium mb-2">Image Width</label>
                          <select
                            value={promptConfig.imageWidth}
                            onChange={(e) => updateConfig('imageWidth', parseInt(e.target.value))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                          >
                            <option value="512">512px</option>
                            <option value="768">768px</option>
                            <option value="1024">1024px</option>
                            <option value="1536">1536px</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-2">Image Height</label>
                          <select
                            value={promptConfig.imageHeight}
                            onChange={(e) => updateConfig('imageHeight', parseInt(e.target.value))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                          >
                            <option value="512">512px</option>
                            <option value="768">768px</option>
                            <option value="1024">1024px</option>
                            <option value="1536">1536px</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          Guidance Scale: {promptConfig.guidanceScale}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="0.5"
                          value={promptConfig.guidanceScale}
                          onChange={(e) => updateConfig('guidanceScale', parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Creative (1)</span>
                          <span>Balanced (7)</span>
                          <span>Strict (20)</span>
                        </div>
                        <p className="text-gray-400 text-sm mt-2">
                          Higher values follow the prompt more strictly. Lower values allow more creativity.
                        </p>
                      </div>

                      <label className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={promptConfig.promptMagic}
                          onChange={(e) => updateConfig('promptMagic', e.target.checked)}
                          className="w-5 h-5 rounded bg-gray-700 border-gray-600"
                        />
                        <div>
                          <p className="text-white font-medium">Prompt Magic</p>
                          <p className="text-gray-400 text-xs">
                            Leonardo&apos;s automatic prompt enhancement. Disable for more control over exact prompts.
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Object Types Tab */}
                  {activeTab === 'objects' && (
                    <div className="space-y-6">
                      <p className="text-gray-400">
                        Configure visual descriptions for each celestial object type. These are used as the {'{features}'} placeholder.
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {OBJECT_TYPES.map(type => (
                          <button
                            key={type}
                            onClick={() => setSelectedObjectType(type)}
                            className={`px-3 py-1.5 rounded-lg text-sm ${
                              selectedObjectType === type
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>

                      {promptConfig.objectTypeConfigs[selectedObjectType] && (
                        <div className="space-y-4 p-4 bg-gray-800 rounded-lg">
                          <h3 className="text-lg font-bold text-white">{selectedObjectType}</h3>

                          <div>
                            <label className="block text-gray-400 text-sm mb-2">
                              Description <span className="text-gray-600">(fallback if NFT has no description)</span>
                            </label>
                            <textarea
                              value={promptConfig.objectTypeConfigs[selectedObjectType]?.description || ''}
                              onChange={(e) => updateObjectTypeConfig(selectedObjectType, 'description', e.target.value)}
                              rows={2}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
                              placeholder="A brief description of this object type..."
                            />
                          </div>

                          <div>
                            <label className="block text-white font-medium text-sm mb-2">
                              Visual Features <code className="text-blue-400 text-xs ml-2">{'{features}'}</code>
                            </label>
                            <textarea
                              value={promptConfig.objectTypeConfigs[selectedObjectType]?.visualFeatures || ''}
                              onChange={(e) => updateObjectTypeConfig(selectedObjectType, 'visualFeatures', e.target.value)}
                              rows={3}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
                              placeholder="Visual characteristics to include in prompts..."
                            />
                          </div>

                          <div>
                            <label className="block text-gray-400 text-sm mb-2">Custom Prompt Override (Optional)</label>
                            <p className="text-gray-500 text-xs mb-2">Leave empty to use base template. Enter a complete prompt to override for this type only.</p>
                            <textarea
                              value={promptConfig.objectTypeConfigs[selectedObjectType]?.customPrompt || ''}
                              onChange={(e) => updateObjectTypeConfig(selectedObjectType, 'customPrompt', e.target.value)}
                              rows={4}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
                              placeholder="Complete custom prompt for this object type..."
                            />
                          </div>

                          <div>
                            <label className="block text-white font-medium text-sm mb-2">
                              Negative Prompt <span className="text-gray-500 font-normal">(Object-Specific)</span>
                            </label>
                            <p className="text-gray-500 text-xs mb-2">
                              Additional terms to exclude for this object type. These are ADDED to the global negative prompt.
                            </p>
                            <textarea
                              value={promptConfig.objectTypeConfigs[selectedObjectType]?.negativePrompt || ''}
                              onChange={(e) => updateObjectTypeConfig(selectedObjectType, 'negativePrompt', e.target.value)}
                              rows={2}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
                              placeholder="e.g., surface features, atmosphere (for stars)"
                            />
                            {promptConfig.negativePrompt && (
                              <div className="mt-2 text-xs text-gray-500">
                                <span className="text-gray-400">Global negative prompt: </span>
                                <span className="text-red-400/70">{promptConfig.negativePrompt.slice(0, 80)}...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Score Modifiers Tab */}
                  {activeTab === 'modifiers' && (
                    <div className="space-y-6">
                      <p className="text-gray-400">
                        Add special text to prompts based on the NFT&apos;s cosmic score. Higher scores get enhanced descriptions.
                      </p>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-800 rounded-lg">
                          <label className="block text-gray-400 text-sm mb-2">Premium Threshold</label>
                          <input
                            type="number"
                            value={promptConfig.premiumThreshold}
                            onChange={(e) => updateConfig('premiumThreshold', parseInt(e.target.value))}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                          />
                          <p className="text-gray-500 text-xs mt-1">Score &gt; this = Premium</p>
                        </div>
                        <div className="p-4 bg-gray-800 rounded-lg">
                          <label className="block text-gray-400 text-sm mb-2">Elite Threshold</label>
                          <input
                            type="number"
                            value={promptConfig.eliteThreshold}
                            onChange={(e) => updateConfig('eliteThreshold', parseInt(e.target.value))}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                          />
                          <p className="text-gray-500 text-xs mt-1">Score &gt; this = Elite</p>
                        </div>
                        <div className="p-4 bg-gray-800 rounded-lg">
                          <label className="block text-gray-400 text-sm mb-2">Legendary Threshold</label>
                          <input
                            type="number"
                            value={promptConfig.legendaryThreshold}
                            onChange={(e) => updateConfig('legendaryThreshold', parseInt(e.target.value))}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                          />
                          <p className="text-gray-500 text-xs mt-1">Score &gt; this = Legendary</p>
                        </div>
                      </div>

                      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3 mb-4">
                        <p className="text-blue-300 text-sm">
                          These values are inserted into the <code className="text-blue-400">{'{scoreModifier}'}</code> placeholder based on the NFT&apos;s score.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-white font-medium mb-1">
                            Premium Modifier Text <code className="text-blue-400 text-xs ml-2">{'{scoreModifier}'}</code>
                          </label>
                          <p className="text-gray-500 text-xs mb-2">Used when score &gt; Premium Threshold</p>
                          <input
                            type="text"
                            value={promptConfig.premiumModifier}
                            onChange={(e) => updateConfig('premiumModifier', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                            placeholder="Exceptional detail and clarity"
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-1">
                            Elite Modifier Text <code className="text-blue-400 text-xs ml-2">{'{scoreModifier}'}</code>
                          </label>
                          <p className="text-gray-500 text-xs mb-2">Used when score &gt; Elite Threshold</p>
                          <input
                            type="text"
                            value={promptConfig.eliteModifier}
                            onChange={(e) => updateConfig('eliteModifier', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                            placeholder="Museum-quality, breathtaking composition"
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-1">
                            Legendary Modifier Text <code className="text-blue-400 text-xs ml-2">{'{scoreModifier}'}</code>
                          </label>
                          <p className="text-gray-500 text-xs mb-2">Used when score &gt; Legendary Threshold</p>
                          <input
                            type="text"
                            value={promptConfig.legendaryModifier}
                            onChange={(e) => updateConfig('legendaryModifier', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                            placeholder="Once-in-a-lifetime capture, iconic imagery"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-between">
                    <button
                      onClick={fetchPromptPreviews}
                      disabled={isLoadingPreviews}
                      className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50"
                    >
                      {isLoadingPreviews ? 'Loading...' : 'Preview Prompts'}
                    </button>
                    <button
                      onClick={savePromptConfig}
                      disabled={isSavingConfig}
                      className="px-8 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg disabled:opacity-50"
                    >
                      {isSavingConfig ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Previews */}
          {showPreviews && promptPreviews.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Prompt Previews</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Showing how prompts will look for {promptPreviews.length} sample NFTs
                  </p>
                </div>
                <button
                  onClick={() => setShowPreviews(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Hide
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {promptPreviews.map((preview) => (
                  <div
                    key={preview.id}
                    className={`p-3 bg-gray-800 rounded-lg border cursor-pointer transition-colors ${
                      selectedPreview?.id === preview.id
                        ? 'border-blue-500'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedPreview(selectedPreview?.id === preview.id ? null : preview)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-sm">#{preview.id}</span>
                        <span className="font-semibold text-white">{preview.name}</span>
                        <span className="px-2 py-0.5 bg-purple-900/50 text-purple-300 text-xs rounded">
                          {preview.objectType}
                        </span>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {selectedPreview?.id === preview.id ? '▼' : '▶'}
                      </span>
                    </div>

                    {selectedPreview?.id === preview.id && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <pre className="text-gray-300 text-xs whitespace-pre-wrap font-mono bg-gray-900 p-3 rounded max-h-48 overflow-y-auto">
                          {preview.prompt}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
