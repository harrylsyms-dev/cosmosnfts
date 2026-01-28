import { ReactNode } from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Head>
        {/* Preconnect to external services */}
        <link rel="preconnect" href="https://gateway.pinata.cloud" />
        <link rel="dns-prefetch" href="https://ipfs.io" />

        {/* Prefetch important pages */}
        <link rel="prefetch" href="/browse" />
        <link rel="prefetch" href="/auctions" />
      </Head>

      <div className="min-h-screen flex flex-col bg-transparent relative z-10">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </>
  );
}
