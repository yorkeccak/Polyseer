"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import ZoomTransition from "@/components/zoom-transition";
import Image from "next/image";

interface HeroSectionProps {
  onAnalyze: (url: string) => void;
  isAnalyzing: boolean;
  onShowHowItWorks: () => void;
  polymarketUrl?: string; // Add prop for URL population
  setPolymarketUrl?: (url: string) => void; // Add prop for URL setting
}

export default function HeroSection({ onAnalyze, isAnalyzing, onShowHowItWorks, polymarketUrl, setPolymarketUrl }: HeroSectionProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();

  // Sync with external URL prop
  useEffect(() => {
    if (polymarketUrl && polymarketUrl !== url) {
      setUrl(polymarketUrl);
    }
  }, [polymarketUrl]);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setPolymarketUrl?.(newUrl);
    setError("");
  };

  const validateMarketUrl = (url: string) => {
    // Support both Polymarket and Kalshi URLs
    const polymarketRegex = /^https?:\/\/(www\.)?polymarket\.com\/.+/i;
    const kalshiRegex = /^https?:\/\/(www\.)?kalshi\.com\/markets\/.+/i;
    return polymarketRegex.test(url) || kalshiRegex.test(url);
  };

  const detectPlatform = (url: string): 'polymarket' | 'kalshi' | null => {
    if (!url) return null;
    if (url.includes('polymarket.com')) return 'polymarket';
    if (url.includes('kalshi.com')) return 'kalshi';
    return null;
  };

  const detectedPlatform = detectPlatform(url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url) {
      setError("Please enter a Polymarket or Kalshi URL");
      return;
    }

    if (!validateMarketUrl(url)) {
      setError("Please enter a valid Polymarket or Kalshi market URL");
      return;
    }

    // Trigger zoom transition
    setIsTransitioning(true);
  };

  const handleTransitionComplete = () => {
    // Navigate to analysis page
    router.push(`/analysis?url=${encodeURIComponent(url)}`);
  };

  const handleTrySample = () => {
    const sampleUrl = "https://polymarket.com/event/bitcoin-100k-2024";
    setUrl(sampleUrl);
    // Small delay to let URL populate, then trigger transition
    setTimeout(() => {
      setIsTransitioning(true);
    }, 100);
  };

  return (
    <section className="relative flex-shrink-0 flex items-center justify-center px-4 pt-24 md:pt-32 md:pb-6">
      <div className="container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
          className="text-center space-y-8"
        >
          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7, ease: [0.215, 0.61, 0.355, 1] }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight font-[family-name:var(--font-space)]"
            >
              <span className="text-white drop-shadow-lg">
                See the future.
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
              className="flex justify-center"
            >
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-2xl border border-white/30 max-w-2xl">
                <p className="text-lg md:text-xl text-white/90 leading-relaxed text-center">
                  In hindsight, we all would&apos;ve bought Bitcoin. 
                  <br className="hidden sm:block" />
                  Seer into the future, so you can retire off the next one.
                </p>
              </div>
            </motion.div>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1, ease: [0.215, 0.61, 0.355, 1] }}
            onSubmit={handleSubmit}
            className="space-y-4 max-w-2xl mx-auto"
          >
            <div className="relative flex gap-2 transition-all duration-300">
              <motion.div 
                className="relative"
                initial={{ width: "100%" }}
                animate={{ width: url ? "75%" : "100%" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Input
                  type="url"
                  placeholder="Paste Polymarket or Kalshi URL... Or click one of the trending markets below 👇"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={`h-12 md:h-14 text-base px-4 md:px-6 bg-white/95 backdrop-blur-sm border-white/20 focus:bg-white focus:border-white/40 placeholder:text-neutral-500 w-full ${
                    error ? "border-red-500 animate-shake" : ""
                  }`}
                  disabled={isAnalyzing}
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-6 left-0 text-sm text-red-400 drop-shadow-md"
                  >
                    {error}
                  </motion.p>
                )}
              </motion.div>
              
              <AnimatePresence>
                {url && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, width: 0 }}
                    animate={{ opacity: 1, scale: 1, width: "15%" }}
                    exit={{ opacity: 0, scale: 0.8, width: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isAnalyzing || isTransitioning}
                      className="h-12 md:h-14 w-full bg-black text-white hover:bg-black/90 transition-all font-medium"
                    >
                      {isAnalyzing || isTransitioning ? (
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 animate-pulse" />
                        </span>
                      ) : detectedPlatform ? (
                        <span className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={detectedPlatform === 'polymarket'
                              ? 'https://www.google.com/s2/favicons?domain=polymarket.com&sz=32'
                              : 'https://kalshi.com/logo192.png'
                            }
                            alt={detectedPlatform}
                            className="w-5 h-5 md:w-6 md:h-6 rounded-sm"
                          />
                          <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                        </span>
                      ) : (
                        <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Powered by Valyu pill - below input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.3, ease: "easeOut" }}
              className="flex justify-center mt-4"
            >
              <div className="relative flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30">
                <span className="text-sm text-white/80 font-medium">Powered by</span>
                <a
                  href="https://valyu.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center hover:scale-105 transition-transform pt-0.5"
                >
                  <Image
                    src="/valyu.svg"
                    alt="Valyu"
                    width={80}
                    height={80}
                    className="h-4 w-auto opacity-80 hover:opacity-100 transition-opacity"
                  />
                </a>
              </div>
            </motion.div>
          </motion.form>
        </motion.div>
      </div>
      
      <ZoomTransition 
        isActive={isTransitioning} 
        onComplete={handleTransitionComplete}
      />
    </section>
  );
}