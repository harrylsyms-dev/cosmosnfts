import type { AppProps } from 'next/app';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import '../styles/globals.css';

// Dynamic import to avoid SSR issues with canvas
const CosmicBackground = dynamic(
  () => import('../components/CosmicBackground'),
  { ssr: false }
);

// Load Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_KEY || ''
);

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Show cosmic background on homepage
  const showCosmic = router.pathname === '/';

  return (
    <>
      {showCosmic && <CosmicBackground />}
      <Elements stripe={stripePromise}>
        <Component {...pageProps} />
      </Elements>
    </>
  );
}
