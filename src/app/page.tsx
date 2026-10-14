"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HeroSection from "@/components/hero-section";
import TrendingMarkets from "@/components/trending-markets";
import HowItWorksModal from "@/components/how-it-works-modal";
import LoadingScreen from "@/components/loading-screen";
import { useAuthStore } from "@/lib/stores/use-auth-store";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [marketUrl, setMarketUrl] = useState("");
  const [submitSignal, setSubmitSignal] = useState(0);
  const [howItWorksModalOpen, setHowItWorksModalOpen] = useState(false);

  const { user, initialized } = useAuthStore();

  // Track home page visit
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@vercel/analytics").then(({ track }) => {
        track("Home Page Visited", {
          userType: user ? "authenticated" : "anonymous",
        });
      });
    }
  }, [user]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    // Delay content appearance for smooth transition
    setTimeout(() => {
      setContentVisible(true);
    }, 100);
  };

  // Skip loading screen on auth redirect or if already initialized
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromAuth = urlParams.get("from_auth");

    if (fromAuth || (initialized && user)) {
      setIsLoading(false);
      setContentVisible(true);
    }
  }, [initialized, user]);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      </AnimatePresence>

      <motion.div
        className="relative min-h-screen overflow-hidden flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: contentVisible ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <HeroSection
          onShowHowItWorks={() => setHowItWorksModalOpen(true)}
          marketUrl={marketUrl}
          setMarketUrl={setMarketUrl}
          submitSignal={submitSignal}
        />

        <TrendingMarkets
          onAnalyze={(market) => {
            import("@vercel/analytics").then(({ track }) => {
              track("Market Picked", { platform: market.platform, source: "carousel" });
            });
            setMarketUrl(market.url);
            setSubmitSignal((value) => value + 1);
          }}
        />
      </motion.div>

      <HowItWorksModal open={howItWorksModalOpen} onOpenChange={setHowItWorksModalOpen} />
    </>
  );
}
