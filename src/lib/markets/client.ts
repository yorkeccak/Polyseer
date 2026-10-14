"use client";

import { useEffect, useState } from "react";
import type { DiscoveredMarket } from "@/lib/markets/discovery";

export type { DiscoveredMarket };

// One request per page load, shared by the search box and the carousel.
let trendingRequest: Promise<DiscoveredMarket[]> | null = null;

function loadTrending(): Promise<DiscoveredMarket[]> {
  trendingRequest ??= fetch("/api/markets/trending")
    .then((res) => (res.ok ? res.json() : { markets: [] }))
    .then((data: { markets?: DiscoveredMarket[] }) => data.markets ?? [])
    .catch(() => {
      trendingRequest = null;
      return [];
    });
  return trendingRequest;
}

export function useTrendingMarkets(): { markets: DiscoveredMarket[]; loading: boolean } {
  const [markets, setMarkets] = useState<DiscoveredMarket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadTrending().then((result) => {
      if (!active) return;
      setMarkets(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { markets, loading };
}

export async function searchMarkets(query: string, signal: AbortSignal): Promise<DiscoveredMarket[]> {
  const res = await fetch(`/api/markets/search?q=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as { markets?: DiscoveredMarket[] };
  return data.markets ?? [];
}

export function formatVolume(market: DiscoveredMarket): string {
  const v = market.volume24h;
  const amount = v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : `${Math.round(v)}`;
  // Polymarket reports dollars; Kalshi reports contracts.
  return market.platform === "polymarket" ? `$${amount}` : amount;
}

export function formatPercent(probability: number): string {
  const pct = probability * 100;
  return pct > 0 && pct < 1 ? "<1%" : `${Math.round(pct)}%`;
}

export function formatTimeLeft(endDate: string | null): string | null {
  if (!endDate) return null;
  const ms = Date.parse(endDate) - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return null;
  const hours = ms / 3600_000;
  if (hours < 24) return `${Math.max(1, Math.round(hours))}h left`;
  const days = hours / 24;
  if (days < 60) return `${Math.round(days)}d left`;
  const months = days / 30.4;
  return months < 24 ? `${Math.round(months)}mo left` : `${Math.round(days / 365)}y left`;
}
