import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface ScoringConfig {
  id: string;
  activeSystem: 'EQUAL' | 'PRIMARY_FIVE' | 'WEIGHTED';
  basePricePerPoint: number;
  distanceWeight: number;
  massWeight: number;
  ageWeight: number;
  luminosityWeight: number;
  sizeWeight: number;
  temperatureWeight: number;
  discoveryWeight: number;
  papersWeight: number;
  primaryMetrics: string;
  distanceLogMin: number;
  distanceLogMax: number;
  massLogMin: number;
  massLogMax: number;
  ageLogMin: number;
  ageLogMax: number;
  sizeLogMin: number;
  sizeLogMax: number;
  temperatureLogMin: number;
  temperatureLogMax: number;
  papersLogMin: number;
  papersLogMax: number;
  discoveryYearMin: number;
  discoveryYearMax: number;
}

interface ObjectTypeRule {
  objectType: string;
  hasDistance: boolean;
  hasMass: boolean;
  hasAge: boolean;
  hasLuminosity: boolean;
  hasSize: boolean;
  hasTemperature: boolean;
  hasDiscovery: boolean;
  hasPapers: boolean;
  defaultMissingScore: number;
}

const METRIC_NAMES: Record<string, string> = {
  distance: 'Distance (Light Years)',
  mass: 'Mass (Solar Masses)',
  age: 'Age (Years)',
  luminosity: 'Luminosity',
  size: 'Size (km)',
  temperature: 'Temperature (Kelvin)',
  discovery: 'Discovery Year',
  papers: 'Scientific Papers',
};

const ALL_METRICS = ['distance', 'mass', 'age', 'luminosity', 'size', 'temperature', 'discovery', 'papers'];

export default function AdminScoring() {
  const router = useRouter();
  const [config, setConfig] = useState<ScoringConfig | null>(null);
  const [objectTypeRules, setObjectTypeRules] = useState<ObjectTypeRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [editedConfig, setEditedConfig] = useState<Partial<ScoringConfig>>({});
  const [primaryMetrics, setPrimaryMetrics] = useState<string[]>([]);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    if (config) {
      try {
        setPrimaryMetrics(JSON.parse(config.primaryMetrics));
      } catch {
        setPrimaryMetrics(['distance', 'mass', 'age', 'luminosity', 'size']);
      }
    }
  }, [config]);

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

      await Promise.all([fetchConfig(), fetchObjectTypeRules()]);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchConfig() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/scoring/config`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setEditedConfig({});
      }
    } catch (error) {
      console.error('Failed to fetch scoring config:', error);
    }
  }

  async function fetchObjectTypeRules() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/scoring/object-types`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setObjectTypeRules(data.rules || []);
      }
    } catch (error) {
      console.error('Failed to fetch object type rules:', error);
    }
  }

  async function handleSaveConfig() {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const updates = { ...editedConfig };

      // Include primary metrics if changed
      if (primaryMetrics.length === 5) {
        updates.primaryMetrics = JSON.stringify(primaryMetrics);
      }

      const res = await fetch(`${apiUrl}/api/admin/scoring/config`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        await fetchConfig();
        alert('Scoring configuration saved successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRecalculateAll() {
    if (!confirm('This will recalculate scores for ALL NFTs based on the current scoring system. This may take a while. Continue?')) {
      return;
    }

    setIsRecalculating(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/scoring/recalculate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ batchSize: 50 }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Recalculated ${data.processed} NFTs! ${data.errors > 0 ? `(${data.errors} errors)` : ''}`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to recalculate scores');
      }
    } catch (error) {
      console.error('Failed to recalculate scores:', error);
      alert('Failed to recalculate scores');
    } finally {
      setIsRecalculating(false);
    }
  }

  function getCurrentValue<K extends keyof ScoringConfig>(key: K): ScoringConfig[K] | undefined {
    if (key in editedConfig) {
      return editedConfig[key] as ScoringConfig[K];
    }
    return config?.[key];
  }

  function handleInputChange(key: keyof ScoringConfig, value: any) {
    setEditedConfig(prev => ({ ...prev, [key]: value }));
  }

  function togglePrimaryMetric(metric: string) {
    setPrimaryMetrics(prev => {
      if (prev.includes(metric)) {
        return prev.filter(m => m !== metric);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, metric];
    });
  }

  function calculateWeightTotal(): number {
    const weights = [
      'distanceWeight', 'massWeight', 'ageWeight', 'luminosityWeight',
      'sizeWeight', 'temperatureWeight', 'discoveryWeight', 'papersWeight'
    ] as const;

    return weights.reduce((sum, key) => {
      const value = getCurrentValue(key);
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const activeSystem = getCurrentValue('activeSystem') || 'EQUAL';
  const basePricePerPoint = getCurrentValue('basePricePerPoint') ?? 0.10;
  const weightTotal = calculateWeightTotal();
  const hasChanges = Object.keys(editedConfig).length > 0 || (config && JSON.stringify(primaryMetrics) !== config.primaryMetrics);

  return (
    <>
      <Head>
        <title>Scoring System | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold text-white hover:text-gray-300">
                CosmoNFT Admin
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-300">Scoring System</span>
            </div>
            <nav className="flex gap-4">
              <Link href="/admin/phases" className="text-gray-400 hover:text-white">Phases</Link>
              <Link href="/admin/nfts" className="text-gray-400 hover:text-white">NFTs</Link>
              <Link href="/admin/settings" className="text-gray-400 hover:text-white">Settings</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Scoring System Selection */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">Scoring System</h2>
            <p className="text-gray-400 mb-6">
              Choose how NFTs are scored based on their scientific properties. All systems produce scores from 0-500.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* EQUAL System */}
              <div
                onClick={() => handleInputChange('activeSystem', 'EQUAL')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  activeSystem === 'EQUAL'
                    ? 'border-purple-500 bg-purple-900/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${activeSystem === 'EQUAL' ? 'border-purple-500 bg-purple-500' : 'border-gray-500'}`} />
                  <h3 className="text-lg font-semibold text-white">Equal Weights</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  All 8 metrics weighted equally at 62.5 points each (8 x 62.5 = 500)
                </p>
              </div>

              {/* PRIMARY_FIVE System */}
              <div
                onClick={() => handleInputChange('activeSystem', 'PRIMARY_FIVE')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  activeSystem === 'PRIMARY_FIVE'
                    ? 'border-purple-500 bg-purple-900/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${activeSystem === 'PRIMARY_FIVE' ? 'border-purple-500 bg-purple-500' : 'border-gray-500'}`} />
                  <h3 className="text-lg font-semibold text-white">Primary Five</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Select 5 primary metrics at 100 points each (5 x 100 = 500)
                </p>
              </div>

              {/* WEIGHTED System */}
              <div
                onClick={() => handleInputChange('activeSystem', 'WEIGHTED')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  activeSystem === 'WEIGHTED'
                    ? 'border-purple-500 bg-purple-900/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${activeSystem === 'WEIGHTED' ? 'border-purple-500 bg-purple-500' : 'border-gray-500'}`} />
                  <h3 className="text-lg font-semibold text-white">Custom Weights</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Set custom weight for each metric (must sum to 500)
                </p>
              </div>
            </div>
          </div>

          {/* Base Price Configuration */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Base Price Per Point</h2>
            <p className="text-gray-400 mb-4">
              Formula: <code className="bg-gray-800 px-2 py-1 rounded">NFT Price = Base Price x Total Score x Phase Multiplier</code>
            </p>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-2xl">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={basePricePerPoint}
                  onChange={(e) => handleInputChange('basePricePerPoint', parseFloat(e.target.value) || 0)}
                  className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white text-2xl w-32"
                />
                <span className="text-gray-400">per point</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[300, 400, 450, 500].map(score => (
                <div key={score} className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400 text-sm">Score {score}</div>
                  <div className="text-xl font-bold text-green-400">
                    ${(basePricePerPoint * score).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Primary Five Selection (shown when PRIMARY_FIVE is active) */}
          {activeSystem === 'PRIMARY_FIVE' && (
            <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">
                Select Primary Metrics
                <span className={`ml-2 text-sm ${primaryMetrics.length === 5 ? 'text-green-400' : 'text-yellow-400'}`}>
                  ({primaryMetrics.length}/5 selected)
                </span>
              </h2>
              <p className="text-gray-400 mb-4">
                Choose exactly 5 metrics. Each will contribute 100 points to the total score.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ALL_METRICS.map(metric => (
                  <button
                    key={metric}
                    onClick={() => togglePrimaryMetric(metric)}
                    disabled={!primaryMetrics.includes(metric) && primaryMetrics.length >= 5}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      primaryMetrics.includes(metric)
                        ? 'border-green-500 bg-green-900/20'
                        : 'border-gray-700 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border-2 ${
                        primaryMetrics.includes(metric) ? 'border-green-500 bg-green-500' : 'border-gray-500'
                      }`}>
                        {primaryMetrics.includes(metric) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-white text-sm">{METRIC_NAMES[metric]}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Weights (shown when WEIGHTED is active) */}
          {activeSystem === 'WEIGHTED' && (
            <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">
                Custom Weights
                <span className={`ml-2 text-sm ${Math.abs(weightTotal - 500) < 0.1 ? 'text-green-400' : 'text-red-400'}`}>
                  (Total: {weightTotal.toFixed(1)} / 500)
                </span>
              </h2>
              <p className="text-gray-400 mb-4">
                Set custom weights for each metric. Total must equal 500.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {ALL_METRICS.map(metric => {
                  const weightKey = `${metric}Weight` as keyof ScoringConfig;
                  const currentWeight = getCurrentValue(weightKey) as number || 62.5;

                  return (
                    <div key={metric} className="bg-gray-800 rounded-lg p-4">
                      <label className="block text-gray-400 text-sm mb-2">{METRIC_NAMES[metric]}</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="500"
                        value={currentWeight}
                        onChange={(e) => handleInputChange(weightKey, parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                      />
                    </div>
                  );
                })}
              </div>

              {Math.abs(weightTotal - 500) >= 0.1 && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
                  Weights must sum to exactly 500. Current total: {weightTotal.toFixed(1)}
                </div>
              )}
            </div>
          )}

          {/* Save and Recalculate Buttons */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleSaveConfig}
                disabled={isSaving || !hasChanges || (activeSystem === 'WEIGHTED' && Math.abs(weightTotal - 500) >= 0.1) || (activeSystem === 'PRIMARY_FIVE' && primaryMetrics.length !== 5)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>

              <button
                onClick={handleRecalculateAll}
                disabled={isRecalculating || hasChanges}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRecalculating ? 'Recalculating...' : 'Recalculate All NFT Scores'}
              </button>

              {hasChanges && (
                <span className="text-yellow-400 self-center">
                  * Save changes before recalculating
                </span>
              )}
            </div>

            <p className="text-gray-500 text-sm mt-4">
              Note: Recalculating will update all NFT scores and prices based on the saved configuration.
              This may take a while for large collections.
            </p>
          </div>

          {/* Object Type Rules */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Object Type Rules</h2>
              <p className="text-gray-400 mt-1">
                Configure which metrics apply to each cosmic object type.
              </p>
            </div>

            {objectTypeRules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Object Type</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Distance</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Mass</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Age</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Luminosity</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Size</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Temp</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Discovery</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Papers</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Default</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {objectTypeRules.map(rule => (
                      <tr key={rule.objectType}>
                        <td className="px-4 py-3 font-semibold text-white">{rule.objectType}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={rule.hasDistance ? 'text-green-400' : 'text-gray-600'}>
                            {rule.hasDistance ? '✓' : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={rule.hasMass ? 'text-green-400' : 'text-gray-600'}>
                            {rule.hasMass ? '✓' : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={rule.hasAge ? 'text-green-400' : 'text-gray-600'}>
                            {rule.hasAge ? '✓' : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={rule.hasLuminosity ? 'text-green-400' : 'text-gray-600'}>
                            {rule.hasLuminosity ? '✓' : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={rule.hasSize ? 'text-green-400' : 'text-gray-600'}>
                            {rule.hasSize ? '✓' : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={rule.hasTemperature ? 'text-green-400' : 'text-gray-600'}>
                            {rule.hasTemperature ? '✓' : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={rule.hasDiscovery ? 'text-green-400' : 'text-gray-600'}>
                            {rule.hasDiscovery ? '✓' : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={rule.hasPapers ? 'text-green-400' : 'text-gray-600'}>
                            {rule.hasPapers ? '✓' : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-400">
                          {rule.defaultMissingScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-gray-400 text-center">
                <p>No object type rules configured yet.</p>
                <p className="text-sm mt-2">All object types will use all metrics with default scoring.</p>
              </div>
            )}
          </div>

          {/* Metrics Reference */}
          <div className="bg-gray-900 rounded-lg p-6 mt-8 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Scientific Metrics Reference</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Distance (Light Years)</h3>
                <p className="text-gray-400 text-sm">Range: 1 - 13 billion LY. Logarithmic scale.</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Mass (Solar Masses)</h3>
                <p className="text-gray-400 text-sm">Range: 0.00000001 - 100 billion M☉. Logarithmic scale.</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Age (Years)</h3>
                <p className="text-gray-400 text-sm">Range: 1 - 14 billion years. Logarithmic scale.</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Luminosity</h3>
                <p className="text-gray-400 text-sm">Absolute magnitude or solar luminosities. Logarithmic scale.</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Size (km)</h3>
                <p className="text-gray-400 text-sm">Range: 1 km - 100 trillion km. Logarithmic scale.</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Temperature (Kelvin)</h3>
                <p className="text-gray-400 text-sm">Range: 3 K - 1 billion K. Logarithmic scale.</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Discovery Year</h3>
                <p className="text-gray-400 text-sm">Range: 1600 - 2025. Linear scale (older = higher score).</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Scientific Papers</h3>
                <p className="text-gray-400 text-sm">Range: 1 - 100,000 papers. Logarithmic scale.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
