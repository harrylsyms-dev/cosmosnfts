import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

/**
 * Legacy Phase Management Page
 *
 * This page previously managed the 77-phase system with 7.5% price increases.
 * That system has been replaced with a new Series-based structure:
 * - 4 Series x 5 Phases = 20 total phases
 * - No per-phase price increases
 * - Series multipliers based on sell-through rates (1.0x to 3.0x)
 *
 * This page now redirects to /admin/series for the new management interface.
 */
export default function LegacyPhasesRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new series management page
    router.replace('/admin/series');
  }, [router]);

  return (
    <>
      <Head>
        <title>Redirecting... | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Redirecting to Series Management...</div>
          <p className="text-gray-400 mb-4">
            The 77-phase system has been replaced with a new Series-based structure.
          </p>
          <p className="text-gray-500 text-sm">
            New structure: 4 Series x 5 Phases (no per-phase price increases)
          </p>
          <div className="mt-6">
            <a
              href="/admin/series"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Click here if you are not redirected automatically
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
