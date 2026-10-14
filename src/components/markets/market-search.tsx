"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { detectPlatform } from "@/lib/tools/market-url-parser";
import { PlatformLogo } from "@/components/markets/platform-logo";
import {
  formatPercent,
  formatTimeLeft,
  formatVolume,
  searchMarkets,
  useTrendingMarkets,
  type DiscoveredMarket,
} from "@/lib/markets/client";

const MAX_RESULTS = 8;

interface MarketSearchProps {
  value: string;
  onChange: (value: string) => void;
  onPick: (market: DiscoveredMarket) => void;
  /** Rendered to the right of the input, e.g. the submit button. */
  action?: ReactNode;
  disabled?: boolean;
  invalid?: boolean;
}

function leaderText(market: DiscoveredMarket): string | null {
  if (!market.leader) return null;
  const pct = formatPercent(market.leader.probability);
  return market.leader.label === "Yes" ? `${pct} Yes` : `${market.leader.label} ${pct}`;
}

function looksLikeUrl(text: string): boolean {
  return /^https?:\/\//i.test(text) || /\.(com|xyz)\//i.test(text);
}

export function MarketSearch({ value, onChange, onPick, action, disabled, invalid }: MarketSearchProps) {
  const { markets: trending, loading: trendingLoading } = useTrendingMarkets();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [remote, setRemote] = useState<{ query: string; markets: DiscoveredMarket[] } | null>(null);
  const listId = useId();

  const query = value.trim();
  const isUrl = looksLikeUrl(query);
  const isSearch = query.length >= 2 && !isUrl;
  const platform = isUrl ? detectPlatform(query) : null;
  const searching = isSearch && remote?.query !== query;

  // Search Polymarket and the Kalshi shortlist as the user types.
  useEffect(() => {
    if (!isSearch) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchMarkets(query, controller.signal)
        .then((markets) => setRemote({ query, markets }))
        .catch(() => {
          if (!controller.signal.aborted) setRemote({ query, markets: [] });
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isSearch]);

  const results = useMemo(() => {
    if (!isSearch) return trending.slice(0, MAX_RESULTS);
    const terms = query.toLowerCase().split(/\s+/);
    const local = trending.filter((m) => terms.every((t) => m.title.toLowerCase().includes(t)));
    const seen = new Set(local.map((m) => m.id));
    const fromSearch = remote?.query === query ? remote.markets.filter((m) => !seen.has(m.id)) : [];
    return [...local, ...fromSearch].slice(0, MAX_RESULTS);
  }, [isSearch, query, trending, remote]);

  const showList = open && !isUrl && !disabled;
  // Results can shrink under a stale highlight (search response, trending load).
  const highlighted = active < results.length ? active : -1;
  const pick = (market: DiscoveredMarket) => {
    setOpen(false);
    onPick(market);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (results.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + results.length) % results.length);
      return;
    }
    if (e.key === "Enter" && showList && results.length > 0) {
      // Typed text is a search, not a link: research the highlighted or top match.
      if (highlighted >= 0 || isSearch) {
        e.preventDefault();
        pick(results[Math.max(highlighted, 0)]);
      }
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-neutral-500">
            {platform ? <PlatformLogo platform={platform} className="size-5" /> : <Search className="size-5" />}
          </span>
          <input
            type="text"
            inputMode="search"
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && highlighted >= 0 ? `${listId}-${highlighted}` : undefined}
            aria-invalid={invalid}
            aria-label="Search markets or paste a Polymarket or Kalshi link"
            placeholder="Search markets or paste a Polymarket / Kalshi link"
            value={value}
            disabled={disabled}
            onChange={(e) => {
              onChange(e.target.value);
              setActive(-1);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={handleKeyDown}
            className={cn(
              "h-12 md:h-14 w-full rounded-md border bg-white/95 pl-12 pr-4 text-base text-neutral-900 shadow-xs outline-none backdrop-blur-sm transition-[color,box-shadow,background-color]",
              "placeholder:text-neutral-500 focus:bg-white focus-visible:ring-[3px] focus-visible:ring-white/40 disabled:opacity-60",
              invalid ? "border-red-500 animate-shake" : "border-white/20"
            )}
          />
        </div>
        {action}
      </div>

      {showList && (
        <div
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-black/5 bg-white text-left text-neutral-900 shadow-2xl"
          // Keep focus in the input so a click registers before blur closes the list.
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-2 text-xs font-medium text-neutral-500">
            <span className="flex items-center gap-2">
              {isSearch ? (
                <>Markets matching &ldquo;{query}&rdquo;</>
              ) : (
                <>
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  Trending now
                </>
              )}
            </span>
            {(searching || (trendingLoading && !isSearch)) && <Loader2 className="size-3.5 animate-spin" />}
          </div>

          <ul id={listId} role="listbox" className="max-h-[min(420px,55vh)] overflow-y-auto pb-2">
            {results.map((market, i) => {
              const meta = [leaderText(market), `${formatVolume(market)} vol 24h`, formatTimeLeft(market.endDate)]
                .filter(Boolean)
                .join(" · ");
              return (
                <li
                  key={market.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === highlighted}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(market)}
                  className={cn(
                    "group flex cursor-pointer items-center gap-3 px-4 py-2.5",
                    i === highlighted ? "bg-neutral-100" : "hover:bg-neutral-50"
                  )}
                >
                  <PlatformLogo platform={market.platform} className="size-6 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{market.title}</p>
                    <p className="truncate text-xs text-neutral-500">{meta}</p>
                  </div>
                  <span
                    className={cn(
                      "hidden shrink-0 items-center gap-1 text-xs font-medium text-neutral-900 sm:flex",
                      i === highlighted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    Research <ArrowRight className="size-3.5" />
                  </span>
                </li>
              );
            })}

            {results.length === 0 && (
              <li className="px-4 py-3 text-sm text-neutral-500">
                {isSearch
                  ? searching
                    ? "Searching markets..."
                    : "No open markets found. Try another search or paste a link."
                  : trendingLoading
                    ? "Loading trending markets..."
                    : "Paste a Polymarket or Kalshi market link to start."}
              </li>
            )}
          </ul>

          <p className="border-t border-neutral-100 px-4 py-2 text-[11px] text-neutral-400">
            Pick a market to research it, or paste any Polymarket or Kalshi link.
          </p>
        </div>
      )}
    </div>
  );
}
