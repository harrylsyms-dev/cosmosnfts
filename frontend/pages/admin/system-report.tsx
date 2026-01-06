import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

export default function SystemReportAdmin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reportContent, setReportContent] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, []);

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

      // Fetch the report
      await fetchReport();
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchReport() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/system-report`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setReportContent(data.content);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    }
  }

  const sections = [
    { id: '1', title: 'Executive Summary' },
    { id: '2', title: 'Database Schema' },
    { id: '3', title: 'NFT System' },
    { id: '4', title: 'Pricing System' },
    { id: '5', title: 'Phase/Tier System' },
    { id: '6', title: 'Image Generation' },
    { id: '7', title: 'Auction System' },
    { id: '8', title: 'Authentication' },
    { id: '9', title: 'Purchase Flow' },
    { id: '10', title: 'Marketplace' },
    { id: '11', title: 'Revenue Sharing' },
    { id: '12', title: 'API Reference' },
    { id: '13', title: 'Configuration' },
    { id: '14', title: 'Business Logic' },
  ];

  function scrollToSection(sectionId: string) {
    setActiveSection(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function parseReportSections(content: string) {
    const lines = content.split('\n');
    const parsed: { id: string; title: string; content: string[] }[] = [];
    let currentSection: { id: string; title: string; content: string[] } | null = null;

    for (const line of lines) {
      // Match section headers like "1. EXECUTIVE SUMMARY"
      const sectionMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (sectionMatch && line === line.toUpperCase()) {
        if (currentSection) {
          parsed.push(currentSection);
        }
        currentSection = {
          id: sectionMatch[1],
          title: sectionMatch[2],
          content: [],
        };
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    }

    if (currentSection) {
      parsed.push(currentSection);
    }

    return parsed;
  }

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
        <title>System Report | CosmoNFTs Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-purple-400 hover:text-purple-300">
                &larr; Dashboard
              </Link>
              <h1 className="text-xl font-bold text-white">System Architecture Report</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">
                Comprehensive Technical Overview
              </span>
            </div>
          </div>
        </nav>

        <div className="flex">
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen p-4 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
            <h2 className="text-sm font-semibold text-gray-400 uppercase mb-4">Sections</h2>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {section.id}. {section.title}
                </button>
              ))}
            </nav>

            <div className="mt-8 p-4 bg-gray-700/50 rounded-lg">
              <h3 className="text-sm font-semibold text-purple-400 mb-2">Quick Stats</h3>
              <div className="space-y-2 text-xs text-gray-300">
                <div>Total NFTs: 20,000</div>
                <div>LEGENDARY: 164</div>
                <div>ELITE: 598</div>
                <div>PREMIUM: 1,200</div>
                <div>EXCEPTIONAL: 3,000</div>
                <div>STANDARD: 15,038</div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-indigo-900/30 rounded-lg border border-indigo-500/30">
              <h3 className="text-sm font-semibold text-indigo-400 mb-2">Pricing Formula</h3>
              <code className="text-xs text-gray-300 block">
                Price = $0.10 × score × 1.075^(phase-1)
              </code>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {/* Report Content */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 leading-relaxed">
                  {reportContent || 'Loading report...'}
                </pre>
              </div>

              {/* Key Files Reference */}
              <div className="mt-8 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30 p-6">
                <h3 className="text-lg font-semibold text-purple-400 mb-4">Key Files for Pricing Changes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded p-3">
                    <code className="text-cyan-400 text-sm">prisma/schema.prisma</code>
                    <p className="text-gray-400 text-xs mt-1">Tier model, SiteSettings</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3">
                    <code className="text-cyan-400 text-sm">lib/scoring.ts</code>
                    <p className="text-gray-400 text-xs mt-1">Base price, badge tiers</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3">
                    <code className="text-cyan-400 text-sm">pages/api/pricing.ts</code>
                    <p className="text-gray-400 text-xs mt-1">Public pricing calculation</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3">
                    <code className="text-cyan-400 text-sm">pages/api/cart/add.ts</code>
                    <p className="text-gray-400 text-xs mt-1">Price at checkout</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
