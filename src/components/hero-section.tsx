"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import ZoomTransition from "@/components/zoom-transition";
import Image from "next/image";
import { AuthModal } from "@/components/auth-modal";
import { EffortSelector } from "@/components/research/effort-selector";
import { DEFAULT_EFFORT, parseResearchEffort, type ResearchEffort } from "@/lib/research/effort";
import { isSelfHostedApp, startResearch } from "@/lib/research/client";
import { useAuthStore } from "@/lib/stores/use-auth-store";
import { isValidMarketUrl, detectPlatform } from "@/lib/tools/market-url-parser";
import { MarketSearch } from "@/components/markets/market-search";
import type { DiscoveredMarket } from "@/lib/markets/client";

interface HeroSectionProps {
  onShowHowItWorks: () => void;
  marketUrl?: string;
  setMarketUrl?: (url: string) => void;
  /** Increment to submit the current market URL (used by the trending carousel). */
  submitSignal?: number;
}

const DRAFT_KEY = "polyseer_research_draft";
const EFFORT_KEY = "polyseer_research_effort";
const PILL =
  "flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-sm font-medium text-white/85 backdrop-blur-md transition-colors hover:bg-black/40 hover:text-white";

function readDraft(): { url: string; effort: ResearchEffort } | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { url?: unknown; effort?: unknown };
    const effort = parseResearchEffort(parsed.effort);
    return typeof parsed.url === "string" && effort ? { url: parsed.url, effort } : null;
  } catch {
    return null;
  }
}

export default function HeroSection({ onShowHowItWorks, marketUrl, setMarketUrl, submitSignal }: HeroSectionProps) {
  const [url, setUrl] = useState("");
  const [effort, setEffort] = useState<ResearchEffort>(DEFAULT_EFFORT);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const lastSignal = useRef(submitSignal ?? 0);
  const resumedRef = useRef(false);

  // Sync with external URL prop
  useEffect(() => {
    if (marketUrl && marketUrl !== url) {
      setUrl(marketUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketUrl]);

  // Remember the chosen effort between visits.
  useEffect(() => {
    const saved = parseResearchEffort(localStorage.getItem(EFFORT_KEY) || undefined);
    if (saved) setEffort(saved);
  }, []);
  const changeEffort = (next: ResearchEffort) => {
    setEffort(next);
    try {
      localStorage.setItem(EFFORT_KEY, next);
    } catch {
      // Storage unavailable; the selection still applies for this visit.
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setMarketUrl?.(newUrl);
    setError("");
  };

  const submit = useCallback(
    async (candidateUrl: string, chosenEffort: ResearchEffort) => {
      setError("");
      const trimmed = candidateUrl.trim();
      if (!trimmed) {
        setError("Search for a market or paste a Polymarket or Kalshi link");
        return;
      }
      if (!isValidMarketUrl(trimmed)) {
        setError("Pick a market from the list, or paste a Polymarket or Kalshi link");
        return;
      }
      if (!isSelfHostedApp && !user) {
        try {
          sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ url: trimmed, effort: chosenEffort }));
        } catch {
          // Storage unavailable; the user can paste the URL again after sign-in.
        }
        setAuthOpen(true);
        return;
      }

      setSubmitting(true);
      try {
        import("@vercel/analytics").then(({ track }) => {
          track("Research Started", { platform: detectPlatform(trimmed) || "unknown", effort: chosenEffort });
        });
        const research = await startResearch(trimmed, chosenEffort);
        try {
          sessionStorage.removeItem(DRAFT_KEY);
        } catch {
          // Ignore storage errors.
        }
        setDestination(`/research/${research.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "The research could not start. Please try again.");
        setSubmitting(false);
      }
    },
    [user]
  );

  // Submit when the trending carousel picks a market.
  useEffect(() => {
    if (submitSignal === undefined || submitSignal === lastSignal.current) return;
    lastSignal.current = submitSignal;
    if (marketUrl) void submit(marketUrl, effort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitSignal]);

  // Resume a draft saved before the sign-in redirect.
  useEffect(() => {
    if (resumedRef.current || isSelfHostedApp || !initialized || !user) return;
    const draft = readDraft();
    if (!draft) return;
    resumedRef.current = true;
    setUrl(draft.url);
    setMarketUrl?.(draft.url);
    setEffort(draft.effort);
    void submit(draft.url, draft.effort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, user]);

  const pickMarket = (market: DiscoveredMarket) => {
    handleUrlChange(market.url);
    import("@vercel/analytics").then(({ track }) => {
      track("Market Picked", { platform: market.platform, source: "search" });
    });
    void submit(market.url, effort);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit(url, effort);
  };

  const emailNote = !isSelfHostedApp && user?.email ? user.email : null;

  return (
    <section className="relative z-30 flex-shrink-0 flex items-center justify-center px-4 pt-24 md:pt-32 short:md:pt-20">
      <div className="container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
          className="text-center space-y-8 short:md:space-y-6"
        >
          <div className="space-y-6 short:md:space-y-5">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7, ease: [0.215, 0.61, 0.355, 1] }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl short:lg:text-7xl font-bold tracking-tight font-[family-name:var(--font-space)]"
            >
              <span className="text-white drop-shadow-lg">See the future.</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
              className="flex justify-center"
            >
              <div className="max-w-2xl rounded-2xl border border-white/15 bg-black/25 px-5 py-2.5 backdrop-blur-md">
                <p className="text-center text-base leading-relaxed text-white md:text-lg">
                  Pick any Polymarket or Kalshi market.{" "}
                  <br className="hidden sm:block" />
                  Polyseer researches it and shows where the price is wrong.
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
            <div className="relative">
              <MarketSearch
                value={url}
                onChange={handleUrlChange}
                onPick={pickMarket}
                disabled={submitting}
                invalid={Boolean(error)}
                action={
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    aria-label="Start research"
                    className="h-11 md:h-12 rounded-xl px-4 md:px-5 bg-neutral-950 text-white hover:bg-neutral-800 font-medium"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <span className="hidden sm:inline">Research</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                }
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-7 left-2 text-sm font-medium text-red-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
            </div>

            {/* Powered by Valyu pill - below input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.3, ease: "easeOut" }}
              className="relative z-20 flex flex-wrap justify-center gap-2 pt-2"
            >
              <a
                href="https://valyu.ai"
                target="_blank"
                rel="noopener noreferrer"
                className={`${PILL} group`}
              >
                <span>Powered by</span>
                <Image
                  src="/valyu.svg"
                  alt="Valyu"
                  width={80}
                  height={80}
                  className="mt-0.5 h-3.5 w-auto opacity-80 brightness-0 invert transition-opacity group-hover:opacity-100"
                />
              </a>
              <EffortSelector
                value={effort}
                onChange={changeEffort}
                disabled={submitting}
                note={
                  emailNote ? (
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3" aria-hidden="true" />
                      We&apos;ll email {emailNote} when the research is ready.
                    </span>
                  ) : undefined
                }
              />
              <button
                type="button"
                onClick={onShowHowItWorks}
                className={PILL}
              >
                How it works
              </button>
            </motion.div>
          </motion.form>
        </motion.div>
      </div>

      <ZoomTransition isActive={destination !== null} onComplete={() => destination && router.push(destination)} />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </section>
  );
}
