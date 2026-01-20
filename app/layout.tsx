import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Araviel - Your Intelligent AI Companion',
  description: 'Experience the next generation of AI assistance. Araviel intelligently routes your queries to the best AI model - Claude, GPT-4, or Gemini - for optimal results.',
  keywords: ['AI', 'chat', 'GPT-4', 'Claude', 'Gemini', 'assistant', 'productivity', 'auto-routing'],
  authors: [{ name: 'Araviel' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getInitialTheme() {
                  try {
                    const stored = localStorage.getItem('araviel-storage');
                    if (stored) {
                      const parsed = JSON.parse(stored);
                      if (parsed.state?.theme === 'dark' || parsed.state?.theme === 'light') {
                        return parsed.state.theme;
                      }
                    }
                  } catch(e) {}
                  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                const theme = getInitialTheme();
                document.documentElement.classList.toggle('dark', theme === 'dark');
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
