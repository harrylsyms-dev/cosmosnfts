import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';

interface DonationStats {
  totalDonated: number;
  totalSales: number;
  nftsSold: number;
}

const beneficiaries = [
  {
    name: 'The Planetary Society',
    logo: '/images/charities/planetary-society.png',
    description: 'Empowering citizens to advance space science and exploration. Founded by Carl Sagan.',
    focus: 'Space advocacy, education, and LightSail missions',
    website: 'https://planetary.org',
    donated: 25000,
  },
  {
    name: 'Space for Humanity',
    logo: '/images/charities/space-for-humanity.png',
    description: 'Democratizing access to space to expand human consciousness and improve life on Earth.',
    focus: 'Citizen astronaut program and overview effect research',
    website: 'https://spaceforhumanity.org',
    donated: 18500,
  },
  {
    name: 'SETI Institute',
    logo: '/images/charities/seti.png',
    description: 'Exploring, understanding, and explaining the origin and nature of life in the universe.',
    focus: 'Search for extraterrestrial intelligence and astrobiology',
    website: 'https://seti.org',
    donated: 22000,
  },
  {
    name: 'Students for the Exploration and Development of Space',
    logo: '/images/charities/seds.png',
    description: 'Inspiring and empowering students to be leaders in the space community.',
    focus: 'Student space education and project support',
    website: 'https://seds.org',
    donated: 12500,
  },
];

const milestones = [
  {
    amount: 50000,
    title: 'Launch Milestone',
    description: 'First $50K donated to space charities',
    achieved: true,
  },
  {
    amount: 100000,
    title: 'Orbit Milestone',
    description: 'Funding complete student research projects',
    achieved: false,
  },
  {
    amount: 250000,
    title: 'Deep Space Milestone',
    description: 'Sponsoring observatory equipment upgrades',
    achieved: false,
  },
  {
    amount: 500000,
    title: 'Cosmic Milestone',
    description: 'Funding full scholarship programs',
    achieved: false,
  },
];

export default function Impact() {
  const [stats, setStats] = useState<DonationStats>({
    totalDonated: 78000,
    totalSales: 260000,
    nftsSold: 3245,
  });

  // In production, this would fetch real stats from the API
  useEffect(() => {
    // Placeholder for API call
    // fetchDonationStats().then(setStats);
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
            <span className="text-purple-300 text-sm">Making a Difference</span>
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
                ${stats.totalDonated.toLocaleString()}
              </div>
              <div className="text-gray-400">Total Donated</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-blue-400 mb-2">
                {stats.nftsSold.toLocaleString()}
              </div>
              <div className="text-gray-400">NFTs Sold</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-purple-400 mb-2">
                30%
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
                Buy any NFT from our collection using your credit card.
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">We Donate</h3>
              <p className="text-gray-400">
                30% of net proceeds automatically go to our charity partners.
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

        {/* Beneficiary Organizations */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Beneficiary Partners</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {beneficiaries.map((org) => (
              <div
                key={org.name}
                className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold mb-2">{org.name}</h3>
                    <p className="text-gray-400 text-sm mb-3">{org.description}</p>
                    <p className="text-purple-400 text-sm mb-4">
                      Focus: {org.focus}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-green-400 font-semibold">
                        ${org.donated.toLocaleString()} donated
                      </span>
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-sm"
                      >
                        Visit website
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Milestones */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Donation Milestones</h2>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-800 md:left-1/2 md:-translate-x-0.5" />

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.amount}
                  className={`relative flex items-center gap-6 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Dot */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2">
                    <div
                      className={`w-4 h-4 rounded-full border-4 ${
                        milestone.achieved
                          ? 'bg-green-500 border-green-400'
                          : 'bg-gray-800 border-gray-600'
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 ml-16 md:ml-0">
                    <div
                      className={`bg-gray-900 rounded-xl p-6 ${
                        milestone.achieved ? 'border border-green-500/30' : ''
                      } ${index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`text-2xl font-bold ${
                            milestone.achieved ? 'text-green-400' : 'text-gray-500'
                          }`}
                        >
                          ${milestone.amount.toLocaleString()}
                        </span>
                        {milestone.achieved && (
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
              ))}
            </div>
          </div>
        </section>

        {/* Transparency */}
        <section className="mb-20">
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-8 border border-purple-500/30">
            <h2 className="text-3xl font-bold mb-6 text-center">Transparency Commitment</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">What We Promise</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-300">
                      Public donation records updated monthly
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
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">How Funds Are Allocated</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Research & Missions</span>
                      <span className="text-white">40%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Education & Outreach</span>
                      <span className="text-white">35%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '35%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Student Programs</span>
                      <span className="text-white">25%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Stories */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Impact Stories</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="text-4xl mb-4">🛰️</div>
              <h3 className="text-xl font-semibold mb-3">LightSail Mission Support</h3>
              <p className="text-gray-400 mb-4">
                Our donations to The Planetary Society contributed to the LightSail 2 mission,
                demonstrating solar sailing technology in Earth orbit.
              </p>
              <span className="text-purple-400 text-sm">January 2024</span>
            </div>
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold mb-3">Student Scholarships</h3>
              <p className="text-gray-400 mb-4">
                Funded three SEDS student scholarships for aerospace engineering students,
                supporting the next generation of space explorers.
              </p>
              <span className="text-purple-400 text-sm">March 2024</span>
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
