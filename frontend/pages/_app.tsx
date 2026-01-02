import type { AppProps } from 'next/app';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import '../styles/globals.css';
import CosmicBackground from '../components/CosmicBackground';

// Load Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_KEY || ''
);

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Only render cosmic background on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show cosmic background on homepage
  const showCosmic = mounted && router.pathname === '/';

  return (
    <>
      {/* Always-visible test - bright red bar at top */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '5px',
        backgroundColor: 'red',
        zIndex: 9999
      }} />
      {showCosmic && <CosmicBackground />}
      <Elements stripe={stripePromise}>
        <Component {...pageProps} />
      </Elements>
    </>
  );
}
