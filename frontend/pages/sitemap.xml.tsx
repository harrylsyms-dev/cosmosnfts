import { GetServerSideProps } from 'next';
import { prisma } from '../lib/prisma';

const STATIC_PAGES = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/browse', priority: 0.9, changefreq: 'hourly' },
  { path: '/auctions', priority: 0.9, changefreq: 'hourly' },
  { path: '/marketplace', priority: 0.9, changefreq: 'hourly' },
  { path: '/pricing', priority: 0.7, changefreq: 'weekly' },
  { path: '/faq', priority: 0.6, changefreq: 'monthly' },
  { path: '/impact', priority: 0.6, changefreq: 'monthly' },
  { path: '/scoring', priority: 0.6, changefreq: 'weekly' },
  { path: '/terms', priority: 0.3, changefreq: 'yearly' },
  { path: '/privacy', priority: 0.3, changefreq: 'yearly' },
];

interface NFTForSitemap {
  id: number;
  name: string;
  image: string | null;
  updatedAt: Date;
}

interface AuctionForSitemap {
  id: string;
  createdAt: Date;
}

function generateSiteMap(
  staticPages: typeof STATIC_PAGES,
  nfts: NFTForSitemap[],
  auctions: AuctionForSitemap[]
) {
  const baseUrl = 'https://www.cosmonfts.com';
  const today = new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${staticPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('')}
  ${nfts
    .map(
      (nft) => `
  <url>
    <loc>${baseUrl}/nft/${nft.id}</loc>
    <lastmod>${nft.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${
      nft.image
        ? `
    <image:image>
      <image:loc>${nft.image}</image:loc>
      <image:title>${escapeXml(nft.name)}</image:title>
    </image:image>`
        : ''
    }
  </url>`
    )
    .join('')}
  ${auctions
    .map(
      (auction) => `
  <url>
    <loc>${baseUrl}/auctions/${auction.id}</loc>
    <lastmod>${auction.createdAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.85</priority>
  </url>`
    )
    .join('')}
</urlset>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    // Fetch available NFTs (limit to 1000 for sitemap performance)
    const nfts = await prisma.nFT.findMany({
      where: { status: 'AVAILABLE' },
      select: {
        id: true,
        name: true,
        image: true,
        updatedAt: true,
      },
      take: 1000,
      orderBy: { totalScore: 'desc' },
    });

    // Fetch active auctions
    const auctions = await prisma.auction.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        createdAt: true,
      },
    });

    const sitemap = generateSiteMap(STATIC_PAGES, nfts, auctions);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return a basic sitemap with just static pages
    const basicSitemap = generateSiteMap(STATIC_PAGES, [], []);
    res.setHeader('Content-Type', 'application/xml');
    res.write(basicSitemap);
    res.end();
  }

  return { props: {} };
};

export default function Sitemap() {
  return null;
}
