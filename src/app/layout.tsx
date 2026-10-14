import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { OpenAICodexAnimatedBackground } from "@/components/ui/open-ai-codex-animated-background";
import Header from "@/components/header";
import { Providers } from "@/components/providers";
import { AuthInitializer } from "@/components/auth-initializer";
import Image from "next/image";
import { Analytics } from '@vercel/analytics/next';
import { DiscordBanner } from "@/components/discord-banner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const baseUrl = "https://polyseer.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Polyseer | AI-Powered Prediction Market Research",
    template: "%s | Polyseer",
  },
  description: "AI-powered deep research for prediction markets. Paste any Polymarket or Kalshi URL and get an analyst-grade research report in seconds.",
  keywords: [
    "polymarket",
    "kalshi",
    "prediction markets",
    "AI deep research",
    "forecasting",
    "analysis",
    "market research",
    "probability",
    "betting markets",
    "event contracts",
    "prediction market analysis",
    "AI forecasting",
  ],
  authors: [{ name: "Polyseer", url: baseUrl }],
  creator: "Polyseer",
  publisher: "Polyseer",
  alternates: {
    canonical: baseUrl,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/favicon.ico" },
    ],
  },
  openGraph: {
    title: "Polyseer | AI-Powered Prediction Market Research",
    description: "AI-powered deep research for prediction markets. Supports Polymarket and Kalshi.",
    url: baseUrl,
    siteName: "Polyseer",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Polyseer - AI-Powered Prediction Market Research",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Polyseer | AI-Powered Prediction Market Research",
    description: "AI-powered deep research for prediction markets. Supports Polymarket and Kalshi.",
    images: ["/og.png"],
    creator: "@polyseer",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Polyseer",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: "AI-powered deep research for prediction markets. Paste any Polymarket or Kalshi URL and get an analyst-grade research report in seconds.",
  url: baseUrl,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "100",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth light" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var root = document.documentElement;
                  root.classList.remove('light', 'dark');
                  if (theme === 'dark') {
                    root.classList.add('dark');
                  } else if (theme === 'system') {
                    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.classList.add(systemDark ? 'dark' : 'light');
                  } else {
                    root.classList.add('light');
                  }
                } catch (e) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100`}
      >
        <Providers>
          <AuthInitializer>
            <DiscordBanner />
            <OpenAICodexAnimatedBackground />
            <Header />
            <main className="relative min-h-screen">{children}</main>
            
            <div className="pointer-events-none fixed bottom-4 right-4 z-40">
              <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md">
                <a href="/terms" className="transition-colors hover:text-white">
                  Terms
                </a>
                <span className="text-white/30" aria-hidden="true">
                  ·
                </span>
                <span>Not financial advice</span>
              </div>
            </div>
          </AuthInitializer>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
