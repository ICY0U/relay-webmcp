import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://relay-webmcp.creamy-ibex-1200.chatgpt.site'),
  title: 'RELAY — One intent. Many websites.',
  description: 'A safe delegation layer for AI agents acting across the web.',
  icons: { icon: '/og.png' },
  openGraph: {
    title: 'RELAY — One intent. Many websites.',
    description: 'Safely delegate one life event across many WebMCP-enabled services.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'RELAY — One intent. Many websites.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RELAY — One intent. Many websites.',
    description: 'Safely delegate one life event across many WebMCP-enabled services.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
