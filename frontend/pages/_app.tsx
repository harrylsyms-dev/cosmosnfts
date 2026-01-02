import type { AppProps } from 'next/app';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ComingSoon from './coming-soon';
import '../styles/globals.css';

// Load Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_KEY || ''
);

interface SiteStatus {
  isLive: boolean;
  maintenanceMode: boolean;
  comingSoonMode: boolean;
  comingSoonTitle: string | null;
  comingSoonMessage: string | null;
  launchDate: string | null;
}

// Pages that should always be accessible (admin routes, account, etc.)
const BYPASS_PATHS = ['/admin', '/coming-soon', '/account'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [siteStatus, setSiteStatus] = useState<SiteStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkSiteStatus() {
      try {
        const res = await fetch('/api/settings/status');
        if (res.ok) {
          const data = await res.json();
          setSiteStatus(data);
        }
      } catch (error) {
        console.error('Failed to check site status:', error);
        // If we can't check, assume the site is live to avoid blocking
        setSiteStatus({
          isLive: true,
          maintenanceMode: false,
          comingSoonMode: false,
          comingSoonTitle: null,
          comingSoonMessage: null,
          launchDate: null,
        });
      } finally {
        setIsLoading(false);
      }
    }

    checkSiteStatus();
  }, []);

  // Check if current path should bypass coming soon
  const shouldBypass = BYPASS_PATHS.some(path => router.pathname.startsWith(path));

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show coming soon page if site is not live and not on bypass path
  if (siteStatus && !siteStatus.isLive && siteStatus.comingSoonMode && !shouldBypass) {
    return (
      <ComingSoon
        title={siteStatus.comingSoonTitle || undefined}
        message={siteStatus.comingSoonMessage || undefined}
        launchDate={siteStatus.launchDate}
      />
    );
  }

  // Show maintenance page if in maintenance mode
  if (siteStatus && siteStatus.maintenanceMode && !shouldBypass) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Under Maintenance</h1>
          <p className="text-gray-400">We're making some improvements. Please check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <Component {...pageProps} />
    </Elements>
  );
}
