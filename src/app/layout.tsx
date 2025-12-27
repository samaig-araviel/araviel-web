import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { StoreProvider } from './StoreProvider';
import './globals.css';

// Font configurations
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

// Metadata
export const metadata: Metadata = {
  title: 'Araviel - AI Chat Assistant',
  description:
    'Your intelligent AI assistant powered by multiple models. Choose the best AI for your task or let Auto mode decide.',
  keywords: [
    'AI',
    'chat',
    'assistant',
    'Claude',
    'ChatGPT',
    'Gemini',
    'Perplexity',
    'artificial intelligence',
  ],
  authors: [{ name: 'Araviel Team' }],
  creator: 'Araviel',
  publisher: 'Araviel',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://araviel.app',
    siteName: 'Araviel',
    title: 'Araviel - AI Chat Assistant',
    description:
      'Your intelligent AI assistant powered by multiple models.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Araviel - AI Chat Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Araviel - AI Chat Assistant',
    description:
      'Your intelligent AI assistant powered by multiple models.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0f12' },
  ],
};

// Root Layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
