
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: {
    default: 'TimeBubble: Visual Time Management with AI Insights',
    template: '%s | TimeBubble',
  },
  description: 'Transform your day with TimeBubble. A visual time-blocking tool that uses AI to provide insights, smart suggestions, and helps you achieve focus. Plan your day with draggable bubbles and reflect on your productivity.',
  keywords: ['time management', 'productivity app', 'time blocking', 'AI assistant', 'daily planner', 'visual calendar', 'focus tool', 'Next.js', 'React'],
  authors: [{ name: 'TimeBubble Team' }],
  creator: 'TimeBubble Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://timebubble.app', // Replace with your actual domain
    title: 'TimeBubble: Visual Time Management with AI Insights',
    description: 'Stop managing lists and start shaping your time visually. Plan with clarity and achieve focus like never before with TimeBubble.',
    siteName: 'TimeBubble',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TimeBubble: Visual Time Management with AI Insights',
    description: 'Transform your day into floating moments of intention with TimeBubble. The visual time-blocking tool powered by AI.',
    // images: ['/og-image.png'], // Replace with your actual OG image URL
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TimeBubble',
    operatingSystem: 'WEB',
    applicationCategory: 'ProductivityApplication',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '8864',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <AuthProvider>
            {children}
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
