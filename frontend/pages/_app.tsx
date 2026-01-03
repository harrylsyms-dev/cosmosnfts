import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
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

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#030712',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          color: 'white'
        }}>
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '0.5rem',
            padding: '2rem',
            maxWidth: '32rem',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💥</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <pre style={{
              textAlign: 'left',
              fontSize: '0.75rem',
              color: '#f87171',
              backgroundColor: '#1f2937',
              padding: '1rem',
              borderRadius: '0.25rem',
              overflow: 'auto',
              maxHeight: '10rem',
              marginBottom: '1.5rem'
            }}>
              {this.state.error?.stack?.slice(0, 500)}
            </pre>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);
  const [isHomePage, setIsHomePage] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsHomePage(window.location.pathname === '/');
  }, []);

  return (
    <ErrorBoundary>
      {mounted && isHomePage && <CosmicBackground />}
      <StripeProvider>
        <Component {...pageProps} />
      </StripeProvider>
    </ErrorBoundary>
  );
}
