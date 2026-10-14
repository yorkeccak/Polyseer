"use client";

import { useCallback, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ThreeDCarousel, type CarouselItem } from "@/components/ui/3d-carousel";
import { PlatformLogo } from "@/components/markets/platform-logo";
import { getPlatformName } from "@/lib/tools/market-url-parser";
import {
  formatPercent,
  formatTimeLeft,
  formatVolume,
  useTrendingMarkets,
  type DiscoveredMarket,
} from "@/lib/markets/client";

const SIZES = {
  mobile: { width: 248, height: 160, gap: 16, count: 10 },
  compact: { width: 280, height: 168, gap: 24, count: 12 },
  desktop: { width: 300, height: 180, gap: 28, count: 12 },
  large: { width: 320, height: 192, gap: 32, count: 14 },
};

function useMediaQuery(media: string, serverValue: boolean): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const query = window.matchMedia(media);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    [media]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(media).matches,
    () => serverValue
  );
}

const SURFACE = "h-full w-full rounded-2xl border p-4";

function MarketCard({ market }: { market: DiscoveredMarket }) {
  const timeLeft = formatTimeLeft(market.endDate);
  const leader = market.leader;

  return (
    <div
      className={`${SURFACE} flex flex-col justify-between border-white/15 bg-neutral-950/80 text-left shadow-[0_24px_48px_-16px_rgba(0,0,0,0.55)] transition-colors group-hover:border-white/40 group-hover:bg-neutral-950/90`}
    >
      <div>
        <div className="flex items-center justify-between text-[11px] font-medium text-white/60">
          <span className="flex items-center gap-1.5 text-white/75">
            <PlatformLogo platform={market.platform} className="size-4" />
            {getPlatformName(market.platform)}
          </span>
          {timeLeft && <span className="tabular-nums">{timeLeft}</span>}
        </div>
        <h3 className="mt-2.5 line-clamp-2 text-[15px] font-medium leading-snug text-white md:text-base">
          {market.title}
        </h3>
      </div>

      <div className="space-y-2.5">
        {leader && (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-xs text-white/65">{leader.label}</span>
              <span className="text-sm font-semibold tabular-nums text-white">{formatPercent(leader.probability)}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${Math.round(leader.probability * 100)}%` }}
              />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between text-[11px]">
          <span className="tabular-nums text-white/50">{formatVolume(market)} vol 24h</span>
          <span className="flex items-center gap-1 text-xs font-medium text-white/75 transition-colors group-hover:text-white">
            Research <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

function CardBack({ market }: { market?: DiscoveredMarket }) {
  return (
    <div className={`${SURFACE} flex items-center justify-center border-white/15 bg-neutral-950/60`}>
      {market && <PlatformLogo platform={market.platform} className="size-8 rounded-lg opacity-80" />}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={`${SURFACE} flex flex-col justify-between border-white/15 bg-neutral-950/60`}>
      <div className="space-y-3">
        <div className="h-3 w-20 animate-pulse rounded bg-white/15" />
        <div className="h-4 w-full animate-pulse rounded bg-white/15" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-white/15" />
      </div>
      <div className="h-1 w-full animate-pulse rounded-full bg-white/15" />
    </div>
  );
}

interface TrendingMarketsProps {
  onAnalyze: (market: DiscoveredMarket) => void;
}

export default function TrendingMarkets({ onAnalyze }: TrendingMarketsProps) {
  const { markets, loading } = useTrendingMarkets();
  const wide = useMediaQuery("(min-width: 768px)", true);
  const short = useMediaQuery("(max-height: 820px)", false);
  const large = useMediaQuery("(min-width: 1600px) and (min-height: 1000px)", false);
  const size = !wide ? SIZES.mobile : short ? SIZES.compact : large ? SIZES.large : SIZES.desktop;

  if (!loading && markets.length === 0) return null;

  const items: CarouselItem[] = loading
    ? Array.from({ length: size.count }, (_, i) => ({
        key: `skeleton-${i}`,
        front: <SkeletonCard />,
        back: <CardBack />,
      }))
    : markets.slice(0, size.count).map((market) => ({
        key: market.id,
        front: (
          <button
            type="button"
            onClick={() => onAnalyze(market)}
            aria-label={`Research ${market.title}`}
            className="group block size-full cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <MarketCard market={market} />
          </button>
        ),
        back: <CardBack market={market} />,
      }));

  return (
    <section className="relative flex-1 overflow-hidden pb-14 pt-6 md:pt-8 short:md:pt-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.4, ease: "easeOut" }}
        className="flex justify-center px-6"
      >
        <h2 className="flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          Trending on Polymarket and Kalshi
          <span className="hidden text-white/50 sm:inline">· drag to spin, tap to research</span>
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5, ease: [0.215, 0.61, 0.355, 1] }}
        className="mt-2"
      >
        <ThreeDCarousel items={items} cardWidth={size.width} cardHeight={size.height} gap={size.gap} />
      </motion.div>
    </section>
  );
}
