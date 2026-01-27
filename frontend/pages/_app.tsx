import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../styles/globals.css';

// Dynamically import Stripe to avoid SSR issues
const StripeProvider = dynamic(
  () => import('../components/StripeProvider'),
  { ssr: false }
);

// Dynamically import CosmicBackground to avoid SSR issues
const CosmicBackground = dynamic(
  () => import('../components/CosmicBackground'),
  { ssr: false }
);

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);
  const [isHomePage, setIsHomePage] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsHomePage(window.location.pathname === '/');

    // Auto-assign NFTs to phases on startup (runs once per session)
    const hasCheckedAutoAssign = sessionStorage.getItem('autoAssignChecked');
    if (!hasCheckedAutoAssign) {
      fetch('/api/admin/phases/auto-assign')
        .then(res => res.json())
        .then(data => {
          if (data.assigned > 0) {
            console.log(`Auto-assigned ${data.assigned} NFTs to phases`);
          }
        })
        .catch(() => {
          // Silently fail - auto-assign is not critical
        })
        .finally(() => {
          sessionStorage.setItem('autoAssignChecked', 'true');
        });
    }
  }, []);

  return (
    <ErrorBoundary>
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      {mounted && isHomePage && <CosmicBackground />}
      <StripeProvider>
        <Component {...pageProps} />
      </StripeProvider>
    </ErrorBoundary>
  );
}
