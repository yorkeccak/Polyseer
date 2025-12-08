import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { OpenAICodexAnimatedBackground } from "@/components/ui/open-ai-codex-animated-background";
import Header from "@/components/header";
import { Providers } from "@/components/providers";
import { AuthInitializer } from "@/components/auth-initializer";
import Image from "next/image";
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polyseer | See the future.",
  description: "AI-powered deep research for prediction markets. Paste any Polymarket or Kalshi URL and get an analyst-grade research report in seconds.",
  keywords: ["polymarket", "kalshi", "prediction markets", "AI deep research", "forecasting", "analysis"],
  authors: [{ name: "Polyseer" }],
  openGraph: {
    title: "Polyseer | See the future.",
    description: "AI-powered deep research for prediction markets. Supports Polymarket and Kalshi.",
    url: "https://polyseer.xyz",
    siteName: "Polyseer",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Verdict: ✅ YES • Confidence 78% • polyseer.xyz",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Polyseer | See the future.",
    description: "AI-powered deep research for prediction markets. Supports Polymarket and Kalshi.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
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
            <OpenAICodexAnimatedBackground />
            <Header />
            <main className="relative min-h-screen">{children}</main>
            
            {/* Fixed Footer Elements */}
            <div className="fixed bottom-0 right-4 z-40 pointer-events-none">
              <div className="pb-4 flex items-center gap-3">
                {/* Terms of Service Link */}
                <div className="relative pointer-events-auto">
                  <div 
                    className="absolute -inset-4 rounded-full blur-2xl"
                    style={{
                      background: 'radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                    }}
                  ></div>
                  <div className="relative bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <a 
                      href="/terms" 
                      className="text-sm text-white/80 hover:text-white/100 font-medium transition-colors underline underline-offset-2"
                    >
                      Terms
                    </a>
                  </div>
                </div>

                {/* Not Financial Advice - Far Right */}
                <div className="relative pointer-events-auto">
                  {/* Background blur effect */}
                  <div 
                    className="absolute -inset-4 rounded-full blur-2xl"
                    style={{
                      background: 'radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
                    }}
                  ></div>
                  <div className="relative bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <span className="text-sm text-white/90 font-medium">Not financial advice</span>
                  </div>
                </div>
              </div>
            </div>
          </AuthInitializer>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
