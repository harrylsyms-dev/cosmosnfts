import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import {
  SCORE_METRICS,
  MAX_TOTAL_SCORE,
  TIER_CONFIG,
  TIER_ORDER,
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  PRICING,
  BadgeTier,
} from '../lib/constants';

export default function Scoring() {
  return (
    <Layout>
      <Head>
        <title>How Pricing Works - CosmoNFT</title>
        <meta
          name="description"
          content="Learn how CosmoNFT pricing works - 10 scientific metrics, 6 rarity tiers, and a transparent pricing formula."
        />
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How Pricing Works</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Every CosmoNFT price is calculated using a transparent, scientific formula based on
            10 metrics and 6 rarity tiers.
          </p>
        </div>

        {/* Pricing Formula */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-pink-900/30 rounded-xl p-8 border border-purple-500/30">
            <h2 className="text-2xl font-bold mb-6 text-center">The Pricing Formula</h2>
            <div className="text-center mb-8">
              <div className="inline-block bg-gray-900/80 rounded-xl px-8 py-6 font-mono text-xl">
                <span className="text-gray-400">Price = </span>
                <span className="text-green-400">$0.10</span>
                <span className="text-gray-400"> × </span>
                <span className="text-blue-400">Score</span>
                <span className="text-gray-400"> × </span>
                <span className="text-purple-400">Tier Multiplier</span>
                <span className="text-gray-400"> × </span>
                <span className="text-pink-400">Series</span>
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-green-400 font-bold text-xl">$0.10</div>
                <div className="text-gray-400 text-sm">Base Rate Per Point</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-blue-400 font-bold text-xl">0-300</div>
                <div className="text-gray-400 text-sm">Score (10 Metrics)</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-purple-400 font-bold text-xl">1x-200x</div>
                <div className="text-gray-400 text-sm">Tier Multiplier</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-pink-400 font-bold text-xl">1.0x</div>
                <div className="text-gray-400 text-sm">Series 1 (Current)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Score Breakdown */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-4 text-center">Score (0-300)</h2>
          <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
            Each celestial object is evaluated across 10 scientific metrics. Higher scores indicate
            more significant, well-known, or unique objects.
          </p>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="grid md:grid-cols-2 gap-4">
              {SCORE_METRICS.map((metric) => (
                <div
                  key={metric.key}
                  className="flex items-center justify-between bg-gray-800 rounded-lg p-4"
                >
                  <div>
                    <div className="font-semibold text-white">{metric.label}</div>
                    <div className="text-gray-400 text-sm">{metric.tooltip}</div>
                  </div>
                  <div className="text-blue-400 font-bold text-lg whitespace-nowrap ml-4">
                    0-{metric.max}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-700 text-center">
              <div className="inline-flex items-center gap-4 bg-gray-800 rounded-lg px-6 py-3">
                <span className="text-gray-400">Maximum Total Score:</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {MAX_TOTAL_SCORE}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Tier Multipliers */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-4 text-center">Rarity Tiers</h2>
          <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
            Based on total score ranking, each NFT receives a rarity tier that determines its
            multiplier. Rarer tiers have higher multipliers.
          </p>
          <div className="space-y-4">
            {TIER_ORDER.map((tier) => {
              const config = TIER_CONFIG[tier];
              return (
                <div
                  key={tier}
                  className={`bg-gray-900 rounded-xl p-6 border ${config.borderColor}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{config.icon}</span>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl font-bold ${config.textColor}`}>
                            {tier}
                          </span>
                          <span className="px-2 py-1 bg-gray-800 rounded text-gray-400 text-sm">
                            {config.count.toLocaleString()} objects
                          </span>
                        </div>
                        <div className="text-gray-400 text-sm mt-1">{config.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${config.textColor}`}>
                          {config.multiplier}x
                        </div>
                        <div className="text-gray-500 text-sm">Multiplier</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-300 font-semibold">{config.rarity}</div>
                        <div className="text-gray-500 text-sm">Rarity</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 text-center">
            <span className="text-yellow-400 font-semibold">HARD CAP:</span>
            <span className="text-gray-300 ml-2">
              20,000 NFTs total — No more will ever be created
            </span>
          </div>
        </section>

        {/* Example Calculations */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Example Calculations</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Earth Example */}
            <div className="bg-gray-900 rounded-xl p-6 border border-yellow-500/50">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🌍</span>
                <div>
                  <div className="font-bold text-xl">Earth</div>
                  <div className="text-gray-400 text-sm">Planet • MYTHIC</div>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Rate</span>
                  <span className="text-green-400">$0.10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Score</span>
                  <span className="text-blue-400">295 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tier Multiplier</span>
                  <span className="text-purple-400">200x (MYTHIC)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Series</span>
                  <span className="text-pink-400">1.0x</span>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-4">
                <div className="text-gray-400 text-sm mb-1">
                  $0.10 × 295 × 200 × 1.0 =
                </div>
                <div className="text-3xl font-bold text-white">$5,900</div>
                <div className="text-green-400 text-sm mt-1">
                  30% ($1,770) supports space exploration
                </div>
              </div>
            </div>

            {/* Standard Star Example */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">⭐</span>
                <div>
                  <div className="font-bold text-xl">HD 219134</div>
                  <div className="text-gray-400 text-sm">Star • STANDARD</div>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Rate</span>
                  <span className="text-green-400">$0.10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Score</span>
                  <span className="text-blue-400">45 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tier Multiplier</span>
                  <span className="text-gray-400">1x (STANDARD)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Series</span>
                  <span className="text-pink-400">1.0x</span>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-4">
                <div className="text-gray-400 text-sm mb-1">
                  $0.10 × 45 × 1 × 1.0 =
                </div>
                <div className="text-3xl font-bold text-white">$4.50</div>
                <div className="text-green-400 text-sm mt-1">
                  30% ($1.35) supports space exploration
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Series Multipliers */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-4 text-center">Series Multipliers</h2>
          <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
            Prices increase with demand. Early buyers get the best prices!
          </p>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
                <div className="text-green-400 font-bold text-2xl">1.0x</div>
                <div className="text-white font-semibold">Series 1</div>
                <div className="text-gray-400 text-sm">Current</div>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg opacity-60">
                <div className="text-gray-400 font-bold text-2xl">up to 3.0x</div>
                <div className="text-gray-300 font-semibold">Series 2</div>
                <div className="text-gray-500 text-sm">If 90%+ sold</div>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg opacity-60">
                <div className="text-gray-400 font-bold text-2xl">up to 9.0x</div>
                <div className="text-gray-300 font-semibold">Series 3</div>
                <div className="text-gray-500 text-sm">Future</div>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg opacity-60">
                <div className="text-gray-400 font-bold text-2xl">up to 27.0x</div>
                <div className="text-gray-300 font-semibold">Series 4</div>
                <div className="text-gray-500 text-sm">Future</div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-4 text-center">19 Object Categories</h2>
          <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
            Our collection spans every type of celestial object, from nearby planets to
            distant quasars.
          </p>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {CATEGORY_ORDER.map((cat) => {
                const config = CATEGORY_CONFIG[cat];
                return (
                  <div
                    key={cat}
                    className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2"
                  >
                    <span className="text-xl">{config.icon}</span>
                    <div>
                      <div className="text-white text-sm font-medium">{config.label}</div>
                      <div className="text-gray-500 text-xs">
                        {config.targetCount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Donation */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-8 border border-purple-500/30 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-3xl font-bold mb-4">30% to Space Exploration</h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              From every purchase, 30% of net proceeds goes directly to verified space
              exploration and research charities. Your purchase helps fund humanity's
              journey to the stars.
            </p>
            <Link
              href="/impact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Learn About Our Impact
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-bold mb-4">Start Exploring</h2>
          <p className="text-gray-400 mb-6">
            Browse our collection and find the perfect celestial object for your collection.
          </p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            Browse Collection
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </section>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <Link href="/" className="text-blue-400 hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}
