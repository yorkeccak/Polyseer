"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PlatformLogo } from "@/components/markets/platform-logo";
import { getPlatformName } from "@/lib/tools/market-url-parser";
import {
  formatPercent,
  formatTimeLeft,
  formatVolume,
  useTrendingMarkets,
  type DiscoveredMarket,
} from "@/lib/markets/client";

const CARD = "w-[260px] md:w-[300px] h-[150px] md:h-[180px] rounded-xl md:rounded-2xl border p-3 md:p-4";

function MarketCard({ market }: { market: DiscoveredMarket }) {
  const timeLeft = formatTimeLeft(market.endDate);
  const leader = market.leader;

  return (
    <div
      className={`${CARD} group flex flex-col justify-between bg-neutral-950/70 backdrop-blur-md border-white/15 shadow-xl transition-all cursor-pointer hover:bg-neutral-950/80 hover:border-white/40 hover:shadow-2xl`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] md:text-xs text-white/70">
          <span className="flex items-center gap-1.5 font-medium">
            <PlatformLogo platform={market.platform} className="size-4 md:size-5" />
            {getPlatformName(market.platform)}
          </span>
          {timeLeft && <span>{timeLeft}</span>}
        </div>
        <h3 className="font-medium text-sm md:text-base leading-snug text-white line-clamp-2">{market.title}</h3>
      </div>

      <div className="space-y-2">
        {leader && (
          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate text-white/70">{leader.label}</span>
              <span className="font-semibold text-white">{formatPercent(leader.probability)}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white/80" style={{ width: `${Math.round(leader.probability * 100)}%` }} />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">{formatVolume(market)} vol 24h</span>
          <span className="flex items-center gap-1 font-medium text-white/80 transition-colors group-hover:text-white">
            Research <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

interface TrendingMarketsProps {
  onAnalyze: (market: DiscoveredMarket) => void;
}

export default function TrendingMarkets({ onAnalyze }: TrendingMarketsProps) {
  const { markets, loading } = useTrendingMarkets();
  const reduceMotion = useReducedMotion();

  if (!loading && markets.length === 0) return null;

  const skeletons = Array.from({ length: 6 }, (_, i) => (
    <div key={i} className={`${CARD} shrink-0 bg-white/10 backdrop-blur-sm border-white/20 animate-pulse`}>
      <div className="h-3 w-24 rounded bg-white/20 mb-3" />
      <div className="h-4 rounded bg-white/20 mb-2" />
      <div className="h-4 w-3/4 rounded bg-white/20" />
    </div>
  ));

  // Without motion the strip scrolls by hand instead, so a single copy is enough.
  const loop = reduceMotion ? markets : [...markets, ...markets];
  const cards = loop.map((market, i) => (
    <button
      key={`${market.id}-${i}`}
      type="button"
      onClick={() => onAnalyze(market)}
      aria-hidden={i >= markets.length || undefined}
      tabIndex={i >= markets.length ? -1 : undefined}
      aria-label={`Research ${market.title}`}
      className="shrink-0 rounded-xl md:rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <MarketCard market={market} />
    </button>
  ));

  return (
    <section className="relative flex-1 py-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.4, ease: "easeOut" }}
        className="flex flex-col items-center gap-1 px-6 text-center"
      >
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white drop-shadow">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          Trending markets
        </h2>
        <p className="text-sm text-white/80 drop-shadow">Live from Polymarket and Kalshi. Tap one to research it.</p>
      </motion.div>

      <div
        className={`group/marquee mt-5 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] ${
          reduceMotion ? "overflow-x-auto scrollbar-hide" : "overflow-hidden"
        }`}
      >
        <div
          className={`flex w-max gap-3 md:gap-4 px-3 ${loading || reduceMotion ? "" : "animate-marquee"}`}
          style={{ "--marquee-duration": `${Math.max(markets.length, 1) * 5}s` } as React.CSSProperties}
        >
          {loading ? skeletons : cards}
        </div>
      </div>
    </section>
  );
}
