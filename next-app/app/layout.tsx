import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { TopNavbar } from '../components/layout/TopNavbar';
import { Footer } from '../components/layout/Footer';

import { getBaseUrl, SITE_CONFIG } from '@/lib/seo/site';

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "The Abstract Take — An Independent Cinema & Television Publication",
    template: "%s | The Abstract Take",
  },
  description: SITE_CONFIG.description,
  openGraph: {
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: getBaseUrl(),
    siteName: SITE_CONFIG.name,
    locale: "en_US",
    type: "website",
    images: [{ url: SITE_CONFIG.defaultOgImage, width: 1200, height: 630, alt: SITE_CONFIG.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    images: [SITE_CONFIG.defaultOgImage],
    creator: SITE_CONFIG.creator.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FAF9F6] text-gray-900 selection:bg-[#008CFF] selection:text-white">
        <TopNavbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
