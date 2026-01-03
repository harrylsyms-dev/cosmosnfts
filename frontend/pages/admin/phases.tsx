import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface Phase {
  phase: number;
  price: number;
  displayPrice: string;
  quantityAvailable: number;
  quantitySold: number;
  startTime: string;
  duration: number;
  durationDays?: number;
  active: boolean;
}

interface PhaseData {
  success?: boolean;
  currentPhase: (Phase & { isPaused?: boolean; pausedAt?: string | null; timeRemaining?: number }) | null;
  phases: Phase[];
  phaseIncreasePercent: number;
}

export default function AdminPhases() {
  const router = useRouter();
  const [phaseData, setPhaseData] = useState<PhaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingPhase, setEditingPhase] = useState<number | null>(null);
  const [newDuration, setNewDuration] = useState('');
  const [countdown, setCountdown] = useState<string>('');
  const [increasePercent, setIncreasePercent] = useState<string>('7.5');
  const [isEditingPercent, setIsEditingPercent] = useState(false);
  const [isEditingCurrentDuration, setIsEditingCurrentDuration] = useState(false);
  const [currentPhaseDuration, setCurrentPhaseDuration] = useState('');

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  // Sync increasePercent state when data loads
  useEffect(() => {
    if (phaseData?.phaseIncreasePercent !== undefined) {
      setIncreasePercent(phaseData.phaseIncreasePercent.toString());
    }
  }, [phaseData?.phaseIncreasePercent]);

  useEffect(() => {
    if (!phaseData?.currentPhase || phaseData.currentPhase.isPaused) return;

    const startTime = Date.now();
    const initialRemaining = phaseData.currentPhase.timeRemaining || 0;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = initialRemaining - elapsed;

      if (remaining <= 0) {
        setCountdown('Phase ended');
        fetchPhases();
      } else {
        const days = Math.floor(remaining / 86400);
        const hours = Math.floor((remaining % 86400) / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;

        if (days > 0) {
          setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else if (hours > 0) {
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setCountdown(`${minutes}m ${seconds}s`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phaseData]);

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

      await fetchPhases();
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchPhases() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/phases`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setPhaseData(data);
      }
    } catch (error) {
      console.error('Failed to fetch phases:', error);
    }
  }

  async function handlePauseResume() {
    const action = phaseData?.currentPhase?.isPaused ? 'resume' : 'pause';
    setActionLoading(action);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/phases/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await fetchPhases();
      } else {
        const data = await res.json();
        alert(data.error || `Failed to ${action} phase timer`);
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      alert(`Failed to ${action} phase timer`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAdvancePhase() {
    if (!confirm('Are you sure you want to advance to the next phase? This will update all NFT prices.')) {
      return;
    }

    setActionLoading('advance');

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/phases/advance`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await fetchPhases();
        alert('Phase advanced successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to advance phase');
      }
    } catch (error) {
      console.error('Failed to advance phase:', error);
      alert('Failed to advance phase');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetTimer() {
    if (!confirm('Are you sure you want to reset the phase timer? This will restart the countdown from now.')) {
      return;
    }

    setActionLoading('reset');

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/phases/reset`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await fetchPhases();
        alert('Phase timer reset successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reset timer');
      }
    } catch (error) {
      console.error('Failed to reset timer:', error);
      alert('Failed to reset timer');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdateIncreasePercent() {
    const percentNum = parseFloat(increasePercent);
    if (isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
      alert('Please enter a valid percentage between 0 and 100');
      return;
    }

    setActionLoading('percent');

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/phases/increase-percent`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ percent: percentNum }),
      });

      if (res.ok) {
        await fetchPhases();
        setIsEditingPercent(false);
        alert(`Phase increase updated to ${percentNum}%`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update percentage');
      }
    } catch (error) {
      console.error('Failed to update percentage:', error);
      alert('Failed to update percentage');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdateDuration(phase: number) {
    const days = parseFloat(newDuration);
    if (!newDuration || isNaN(days) || days <= 0) {
      alert('Please enter a valid duration in days');
      return;
    }

    setActionLoading(`update-${phase}`);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/phases/${phase}/duration`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ durationDays: days }),
      });

      if (res.ok) {
        await fetchPhases();
        setEditingPhase(null);
        setNewDuration('');
        alert(`Phase ${phase} duration updated to ${days} days!`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update phase duration');
      }
    } catch (error) {
      console.error('Failed to update duration:', error);
      alert('Failed to update phase duration');
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }

  function getPhaseEndTime(phase: Phase): Date {
    const start = new Date(phase.startTime);
    return new Date(start.getTime() + phase.duration * 1000);
  }

  function calculateEndDateFromDuration(durationDays: number): Date {
    // Calculate end date from now + duration
    return new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  }

  function getCalculatedEndDatePreview(durationStr: string): string {
    const days = parseFloat(durationStr);
    if (isNaN(days) || days <= 0) return '';
    const endDate = calculateEndDateFromDuration(days);
    return endDate.toLocaleString();
  }

  async function handleUpdateCurrentPhaseDuration() {
    if (!currentPhase) return;

    const days = parseFloat(currentPhaseDuration);
    if (!currentPhaseDuration || isNaN(days) || days <= 0) {
      alert('Please enter a valid duration in days (e.g., 7, 14, 30)');
      return;
    }

    setActionLoading('update-current');

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/phases/${currentPhase.phase}/duration`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ durationDays: days }),
      });

      if (res.ok) {
        await fetchPhases();
        setIsEditingCurrentDuration(false);
        setCurrentPhaseDuration('');
        alert(`Phase duration updated to ${days} days! End date will be recalculated.`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update phase duration');
      }
    } catch (error) {
      console.error('Failed to update duration:', error);
      alert('Failed to update phase duration');
    } finally {
      setActionLoading(null);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const currentPhase = phaseData?.currentPhase;

  return (
    <>
      <Head>
        <title>Phase Management | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold text-white hover:text-gray-300">
                CosmoNFT Admin
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-300">Phase Management</span>
            </div>
            <nav className="flex gap-4">
              <Link href="/admin/sales" className="text-gray-400 hover:text-white">Sales</Link>
              <Link href="/admin/auctions" className="text-gray-400 hover:text-white">Auctions</Link>
              <Link href="/admin/nfts" className="text-gray-400 hover:text-white">NFTs</Link>
              <Link href="/admin/settings" className="text-gray-400 hover:text-white">Settings</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Current Phase Card */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-6">Current Phase</h2>

            {currentPhase ? (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Phase</div>
                  <div className="text-3xl font-bold text-purple-400">
                    {currentPhase.phase} <span className="text-lg text-gray-500">/ 77</span>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Base Price Multiplier</div>
                  <div className="text-3xl font-bold text-green-400">
                    {(Math.pow(1 + (phaseData?.phaseIncreasePercent || 7.5) / 100, currentPhase.phase - 1)).toFixed(4)}x
                  </div>
                  <div className="text-sm text-gray-500">$0.10 per score point</div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">NFTs Remaining</div>
                  <div className="text-3xl font-bold text-blue-400">
                    {currentPhase.quantityAvailable - currentPhase.quantitySold}
                    <span className="text-lg text-gray-500"> / {currentPhase.quantityAvailable}</span>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Time Remaining</div>
                  <div className={`text-3xl font-bold ${phaseData?.currentPhase?.isPaused ? 'text-yellow-400' : 'text-orange-400'}`}>
                    {phaseData?.currentPhase?.isPaused ? 'PAUSED' : countdown || 'Calculating...'}
                  </div>
                  {phaseData?.currentPhase?.isPaused && phaseData.currentPhase.pausedAt && (
                    <div className="text-sm text-gray-500">
                      Paused at {formatDate(phaseData.currentPhase.pausedAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Pause Status Banner */}
              {phaseData?.currentPhase?.isPaused && (
                <div className="mt-6 bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div>
                      <h3 className="text-yellow-400 font-semibold">Phase Timer is Paused</h3>
                      <p className="text-yellow-200/70 text-sm">
                        The countdown is frozen. Time spent paused will be added to the phase duration when resumed.
                        {phaseData.currentPhase.pausedAt && (
                          <span className="ml-1">Paused since: {formatDate(phaseData.currentPhase.pausedAt)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Phase Duration Editor */}
              <div className="mt-6 bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold">Phase Duration</h3>
                    <p className="text-gray-400 text-sm">Set how long this phase lasts. End date is calculated automatically from the start time.</p>
                  </div>
                </div>

                {isEditingCurrentDuration ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-gray-400 text-sm mb-1">Duration (days)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={currentPhaseDuration}
                          onChange={(e) => setCurrentPhaseDuration(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-lg"
                          placeholder="e.g., 7, 14, 30"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-gray-400 text-sm mb-1">Calculated End Date</label>
                        <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-green-400 text-lg">
                          {getCalculatedEndDatePreview(currentPhaseDuration) || 'Enter duration...'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleUpdateCurrentPhaseDuration}
                        disabled={!!actionLoading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
                      >
                        {actionLoading === 'update-current' ? 'Saving...' : 'Save Duration'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingCurrentDuration(false);
                          setCurrentPhaseDuration('');
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-white">
                        {(currentPhase.duration / 86400).toFixed(1)} days
                      </span>
                      <span className="text-gray-500 ml-3">
                        (ends {formatDate(getPhaseEndTime(currentPhase).toISOString())})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setIsEditingCurrentDuration(true);
                        setCurrentPhaseDuration((currentPhase.duration / 86400).toString());
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                    >
                      Edit Duration
                    </button>
                  </div>
                )}
              </div>
              </>
            ) : (
              <div className="text-gray-400">No active phase</div>
            )}

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-4 mt-6">
              <button
                onClick={handlePauseResume}
                disabled={!!actionLoading}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  phaseData?.currentPhase?.isPaused
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                } disabled:opacity-50`}
              >
                {actionLoading === 'pause' || actionLoading === 'resume'
                  ? 'Processing...'
                  : phaseData?.currentPhase?.isPaused
                  ? 'Resume Timer'
                  : 'Pause Timer'}
              </button>

              <button
                onClick={handleResetTimer}
                disabled={!!actionLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading === 'reset' ? 'Resetting...' : 'Reset Timer'}
              </button>

              <button
                onClick={handleAdvancePhase}
                disabled={!!actionLoading || currentPhase?.phase === 77}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading === 'advance' ? 'Advancing...' : 'Advance to Next Phase'}
              </button>
            </div>

            {currentPhase?.phase === 77 && (
              <p className="text-yellow-400 mt-4">This is the final phase (77/77)</p>
            )}
          </div>

          {/* Phase Increase Configuration */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Phase Increase Rate</h2>
            <p className="text-gray-400 mb-4">
              Price multiplier increases by this percentage each phase.
            </p>

            <div className="flex items-center gap-4">
              {isEditingPercent ? (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={increasePercent}
                      onChange={(e) => setIncreasePercent(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-24"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                  <button
                    onClick={handleUpdateIncreasePercent}
                    disabled={!!actionLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold disabled:opacity-50"
                  >
                    {actionLoading === 'percent' ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingPercent(false);
                      setIncreasePercent((phaseData?.phaseIncreasePercent || 7.5).toString());
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-400">
                    {phaseData?.phaseIncreasePercent || 7.5}%
                  </div>
                  <span className="text-gray-400">per phase</span>
                  <button
                    onClick={() => setIsEditingPercent(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Price Examples */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Price Calculator</h2>
            <p className="text-gray-400 mb-4">
              Formula: <code className="bg-gray-800 px-2 py-1 rounded">$0.10 x Score x Phase Multiplier ({phaseData?.phaseIncreasePercent || 7.5}% increase per phase)</code>
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[350, 400, 425, 485].map((score) => {
                const multiplierBase = 1 + (phaseData?.phaseIncreasePercent || 7.5) / 100;
                const multiplier = Math.pow(multiplierBase, (currentPhase?.phase || 1) - 1);
                const price = 0.10 * score * multiplier;
                return (
                  <div key={score} className="bg-gray-800 rounded-lg p-3">
                    <div className="text-gray-400 text-sm">Score {score}</div>
                    <div className="text-xl font-bold text-white">${price.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Phases Table */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">All 77 Phases</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Phase</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Multiplier</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Sample Price (Score 400)</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">NFTs</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Start Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Duration</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {phaseData?.phases?.map((phase) => {
                    const multiplierBase = 1 + (phaseData?.phaseIncreasePercent || 7.5) / 100;
                    const multiplier = Math.pow(multiplierBase, phase.phase - 1);
                    const samplePrice = 0.10 * 400 * multiplier;
                    const endTime = getPhaseEndTime(phase);
                    const isPast = endTime < new Date() && !phase.active;
                    const isCurrent = phase.active;
                    const isFuture = new Date(phase.startTime) > new Date();

                    return (
                      <tr
                        key={phase.phase}
                        className={`${
                          isCurrent
                            ? 'bg-purple-900/30'
                            : isPast
                            ? 'bg-gray-900/50'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${isCurrent ? 'text-purple-400' : 'text-white'}`}>
                            Phase {phase.phase}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {multiplier.toFixed(4)}x
                        </td>
                        <td className="px-4 py-3 text-green-400 font-semibold">
                          ${samplePrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {phase.quantitySold} / {phase.quantityAvailable}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {formatDate(phase.startTime)}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {editingPhase === phase.phase ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0.5"
                                  value={newDuration}
                                  onChange={(e) => setNewDuration(e.target.value)}
                                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm w-20"
                                  placeholder="Days"
                                />
                                <span className="text-gray-500">days</span>
                                <button
                                  onClick={() => handleUpdateDuration(phase.phase)}
                                  disabled={!!actionLoading}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingPhase(null);
                                    setNewDuration('');
                                  }}
                                  className="px-2 py-1 bg-gray-600 text-white rounded text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                              {getCalculatedEndDatePreview(newDuration) && (
                                <div className="text-xs text-green-400">
                                  New end date: {getCalculatedEndDatePreview(newDuration)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span>
                              {(phase.duration / 86400).toFixed(1)} days
                              <span className="text-gray-600 ml-2">
                                (ends {formatDate(endTime.toISOString())})
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isCurrent ? (
                            <span className="px-2 py-1 bg-purple-600 text-white rounded-full text-xs font-semibold">
                              ACTIVE
                            </span>
                          ) : isPast ? (
                            <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded-full text-xs">
                              COMPLETED
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-blue-600/50 text-blue-300 rounded-full text-xs">
                              UPCOMING
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {(isCurrent || isFuture) && editingPhase !== phase.phase && (
                            <button
                              onClick={() => {
                                setEditingPhase(phase.phase);
                                setNewDuration((phase.duration / 86400).toString());
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              Edit Duration
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
