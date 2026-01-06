import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

// Milestone targets in dollars
const MILESTONES = {
  launch: 50000,
  orbit: 100000,
  deepSpace: 250000,
  cosmic: 500000,
};

interface DonationStats {
  totalDonated: number;
  totalDonatedFormatted: string;
  nftsSold: number;
  donationPercentage: number;
  milestones: {
    launch: { target: number; reached: boolean };
    orbit: { target: number; reached: boolean };
    deepSpace: { target: number; reached: boolean };
    cosmic: { target: number; reached: boolean };
  };
}

const defaultStats: DonationStats = {
  totalDonated: 0,
  totalDonatedFormatted: '$0',
  nftsSold: 0,
  donationPercentage: 30,
  milestones: {
    launch: { target: MILESTONES.launch, reached: false },
    orbit: { target: MILESTONES.orbit, reached: false },
    deepSpace: { target: MILESTONES.deepSpace, reached: false },
    cosmic: { target: MILESTONES.cosmic, reached: false },
  },
};

const milestoneInfo = [
  {
    key: 'launch',
    title: 'Launch Milestone',
    description: 'First $50K donated to space charities',
  },
  {
    key: 'orbit',
    title: 'Orbit Milestone',
    description: 'Funding complete student research projects',
  },
  {
    key: 'deepSpace',
    title: 'Deep Space Milestone',
    description: 'Sponsoring observatory equipment upgrades',
  },
  {
    key: 'cosmic',
    title: 'Cosmic Milestone',
    description: 'Funding full scholarship programs',
  },
];

export default function Impact() {
  const [stats, setStats] = useState<DonationStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch from existing backend endpoint
        const res = await fetch(`${apiUrl}/api/benefactor/total-donated`);
        if (res.ok) {
          const data = await res.json();
          // Validate response has expected structure
          if (data?.grandTotal?.usd !== undefined) {
            const totalDonated = data.grandTotal.usd;
            setStats({
              totalDonated,
              totalDonatedFormatted: data.grandTotal.formatted || '$0',
              nftsSold: 0, // Will be updated when sales tracking is added
              donationPercentage: 30,
              milestones: {
                launch: { target: MILESTONES.launch, reached: totalDonated >= MILESTONES.launch },
                orbit: { target: MILESTONES.orbit, reached: totalDonated >= MILESTONES.orbit },
                deepSpace: { target: MILESTONES.deepSpace, reached: totalDonated >= MILESTONES.deepSpace },
                cosmic: { target: MILESTONES.cosmic, reached: totalDonated >= MILESTONES.cosmic },
              },
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch donation stats:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <Layout>
      <Head>
        <title>Our Impact - CosmoNFT</title>
        <meta name="description" content="See how CosmoNFT supports space exploration - 30% of all proceeds go directly to verified space research and education charities." />
      </Head>

      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span className="text-purple-300 text-sm">Supporting Space Exploration</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              30% to the Stars
            </span>
          </h1>
          <p className="text-gray-300 text-xl max-w-2xl mx-auto">
            Every CosmoNFT purchase directly funds space exploration, research,
            and education. Together, we are advancing humanity's cosmic journey.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 bg-gray-900 border-y border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-green-400 mb-2">
                {isLoading ? '...' : stats.totalDonatedFormatted}
              </div>
              <div className="text-gray-400">Total Donated</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-blue-400 mb-2">
                {isLoading ? '...' : stats.nftsSold.toLocaleString()}
              </div>
              <div className="text-gray-400">NFTs Sold</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-purple-400 mb-2">
                {stats.donationPercentage}%
              </div>
              <div className="text-gray-400">Of Every Sale</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* How It Works */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">How Your Purchase Helps</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">You Purchase</h3>
              <p className="text-gray-400">
                Buy any NFT from our collection.
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">We Donate</h3>
              <p className="text-gray-400">
                30% of net proceeds go to space exploration charities.
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Space Advances</h3>
              <p className="text-gray-400">
                Funds support research, education, and exploration missions.
              </p>
            </div>
          </div>
        </section>

        {/* Where Funds Go */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Where Funds Go</h2>
          <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
            <p className="text-gray-300 text-lg mb-6 text-center">
              We are currently selecting verified 501(c)(3) space exploration and education
              charities to partner with. Our beneficiary partners will be announced before
              the first donation is made.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl">🚀</span>
                <span className="text-gray-300">Space exploration research and missions</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl">🎓</span>
                <span className="text-gray-300">STEM education and outreach programs</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl">📚</span>
                <span className="text-gray-300">Student scholarships and project grants</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl">🔭</span>
                <span className="text-gray-300">Public space science initiatives</span>
              </div>
            </div>
          </div>
        </section>

        {/* Milestones */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Donation Milestones</h2>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-800 md:left-1/2 md:-translate-x-0.5" />

            <div className="space-y-8">
              {milestoneInfo.map((milestone, index) => {
                const milestoneData = stats.milestones[milestone.key as keyof typeof stats.milestones];
                const isAchieved = milestoneData?.reached || false;
                const target = milestoneData?.target || 0;

                return (
                  <div
                    key={milestone.key}
                    className={`relative flex items-center gap-6 ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    {/* Dot */}
                    <div className="absolute left-8 md:left-1/2 -translate-x-1/2">
                      <div
                        className={`w-4 h-4 rounded-full border-4 ${
                          isAchieved
                            ? 'bg-green-500 border-green-400'
                            : 'bg-gray-800 border-gray-600'
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 ml-16 md:ml-0">
                      <div
                        className={`bg-gray-900 rounded-xl p-6 ${
                          isAchieved ? 'border border-green-500/30' : ''
                        } ${index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'}`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`text-2xl font-bold ${
                              isAchieved ? 'text-green-400' : 'text-gray-500'
                            }`}
                          >
                            ${target.toLocaleString()}
                          </span>
                          {isAchieved && (
                            <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full">
                              Achieved
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold mb-1">{milestone.title}</h3>
                        <p className="text-gray-400 text-sm">{milestone.description}</p>
                      </div>
                    </div>

                    {/* Spacer for alternating layout */}
                    <div className="hidden md:block flex-1" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Transparency */}
        <section className="mb-20">
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-8 border border-purple-500/30">
            <h2 className="text-3xl font-bold mb-6 text-center">Transparency Commitment</h2>
            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold mb-4">What We Promise</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">
                    Public donation records updated after each donation
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">
                    Verified receipts from all beneficiary organizations
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">
                    Annual impact reports showing how funds were used
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">
                    Direct relationships with verified 501(c)(3) organizations
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">
                    Beneficiary partners announced before first donation
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-4">Join the Mission</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Every NFT you purchase brings us one step closer to the stars.
            Start your collection and make an impact today.
          </p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            Browse Collection
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
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
