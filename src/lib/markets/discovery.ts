/**
 * Market discovery: live trending markets and search across Polymarket and Kalshi.
 * Server-only. Responses are cached by Next's fetch cache for REVALIDATE_SECONDS.
 */

import type { MarketPlatform } from "@/lib/tools/market-url-parser";

export interface DiscoveredMarket {
  id: string;
  platform: MarketPlatform;
  title: string;
  url: string;
  image: string | null;
  /** Most likely outcome right now, e.g. { label: "Marine Le Pen", probability: 0.45 }. */
  leader: { label: string; probability: number } | null;
  volume24h: number;
  endDate: string | null;
}

export const REVALIDATE_SECONDS = 300;

const POLYMARKET_API = "https://gamma-api.polymarket.com";
const KALSHI_API = "https://api.elections.kalshi.com/trade-api/v2";

/** Kalshi has no trending endpoint, so rank a set of broad-interest series by live 24h volume. */
const KALSHI_SERIES = [
  "KXFEDDECISION",
  "KXCPIYOY",
  "KXRECSSNBER",
  "KXBTCY",
  "KXBTCMAXY",
  "KXPRESNOMD",
  "KXSB",
  "KXNBA",
  "KXTIME",
  "KXLLM1",
  "KXAPRPOTUS",
  "KXOAIAGI",
];

const MIN_HOURS_LEFT = 6;
const SPORTS_TAGS = new Set(["sports", "esports", "games"]);
const MAX_SPORTS = 3;

type AnyObj = Record<string, unknown>;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return (await res.json()) as T;
}

function num(value: unknown): number {
  const n = typeof value === "string" ? parseFloat(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(n) ? n : 0;
}

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function hasTimeLeft(endDate: string | null): boolean {
  if (!endDate) return true;
  const end = Date.parse(endDate);
  return Number.isNaN(end) || end > Date.now() + MIN_HOURS_LEFT * 3600_000;
}

/** A market priced at the extremes is effectively decided and not worth researching. */
function isOpenQuestion(leader: DiscoveredMarket["leader"]): boolean {
  return !leader || (leader.probability > 0.02 && leader.probability < 0.98);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "market";
}

// ---------------------------------------------------------------------------
// Polymarket
// ---------------------------------------------------------------------------

/** Yes price of a market, or its leading outcome for non Yes/No markets. */
function polymarketOutcome(market: AnyObj): { label: string; probability: number } | null {
  const outcomes = parseList(market.outcomes);
  const prices = parseList(market.outcomePrices).map(num);
  if (outcomes.length === 0 || outcomes.length !== prices.length) return null;

  const yes = outcomes.findIndex((o) => o.toLowerCase() === "yes");
  if (yes >= 0) {
    return { label: String(market.groupItemTitle || "Yes"), probability: prices[yes] };
  }
  const best = prices.indexOf(Math.max(...prices));
  return { label: outcomes[best], probability: prices[best] };
}

function polymarketLeader(event: AnyObj): DiscoveredMarket["leader"] {
  const markets = ((event.markets as AnyObj[]) || []).filter((m) => m.active !== false && m.closed !== true);
  if (markets.length === 0) return null;
  if (markets.length === 1) return polymarketOutcome(markets[0]);

  // Mutually exclusive outcomes: show the favourite. Otherwise show the busiest market.
  if (event.negRisk) {
    let best: DiscoveredMarket["leader"] = null;
    for (const market of markets) {
      const outcome = polymarketOutcome(market);
      if (outcome && (!best || outcome.probability > best.probability)) best = outcome;
    }
    return best;
  }
  const busiest = markets.reduce((a, b) => (num(b.volume24hr) > num(a.volume24hr) ? b : a));
  return polymarketOutcome(busiest);
}

function fromPolymarketEvent(event: AnyObj): DiscoveredMarket | null {
  if (!event.slug || !event.title || event.closed === true) return null;
  const endDate = typeof event.endDate === "string" ? event.endDate : null;
  return {
    id: `polymarket:${event.slug}`,
    platform: "polymarket",
    title: String(event.title),
    url: `https://polymarket.com/event/${event.slug}`,
    image: typeof event.icon === "string" ? event.icon : typeof event.image === "string" ? event.image : null,
    leader: polymarketLeader(event),
    volume24h: num(event.volume24hr),
    endDate,
  };
}

function isSports(event: AnyObj): boolean {
  return ((event.tags as AnyObj[]) || []).some((tag) => SPORTS_TAGS.has(String(tag.slug).toLowerCase()));
}

async function trendingPolymarket(limit: number): Promise<DiscoveredMarket[]> {
  const params = new URLSearchParams({
    active: "true",
    closed: "false",
    order: "volume24hr",
    ascending: "false",
    limit: "60",
  });
  const events = await getJson<AnyObj[]>(`${POLYMARKET_API}/events?${params}`);

  // Sports and esports dominate daily volume; cap them, and show one event per recurring series.
  let sports = 0;
  const series = new Set<string>();
  const results: DiscoveredMarket[] = [];
  for (const event of events) {
    const market = fromPolymarketEvent(event);
    if (!market || !hasTimeLeft(market.endDate) || !isOpenQuestion(market.leader)) continue;
    if (typeof event.seriesSlug === "string") {
      if (series.has(event.seriesSlug)) continue;
      series.add(event.seriesSlug);
    }
    if (isSports(event)) {
      if (sports >= MAX_SPORTS) continue;
      sports++;
    }
    results.push(market);
    if (results.length >= limit) break;
  }
  return results;
}

async function searchPolymarket(query: string, limit: number): Promise<DiscoveredMarket[]> {
  const params = new URLSearchParams({
    q: query,
    limit_per_type: String(limit * 2),
    events_status: "active",
    search_profiles: "false",
    search_tags: "false",
  });
  const data = await getJson<{ events?: AnyObj[] }>(`${POLYMARKET_API}/public-search?${params}`);
  return (data.events || [])
    .map(fromPolymarketEvent)
    .filter((m): m is DiscoveredMarket => m !== null && hasTimeLeft(m.endDate) && isOpenQuestion(m.leader))
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Kalshi
// ---------------------------------------------------------------------------

function kalshiPrice(market: AnyObj): number {
  const bid = num(market.yes_bid_dollars);
  const ask = num(market.yes_ask_dollars);
  return bid > 0 && ask > 0 ? (bid + ask) / 2 : num(market.last_price_dollars);
}

function fromKalshiEvent(event: AnyObj): DiscoveredMarket | null {
  const markets = ((event.markets as AnyObj[]) || []).filter((m) => m.status === "active" || m.status === "open");
  if (!event.event_ticker || !event.series_ticker || markets.length === 0) return null;

  let leader: DiscoveredMarket["leader"];
  if (markets.length === 1) {
    leader = { label: "Yes", probability: kalshiPrice(markets[0]) };
  } else {
    const pick = event.mutually_exclusive
      ? markets.reduce((a, b) => (kalshiPrice(b) > kalshiPrice(a) ? b : a))
      : markets.reduce((a, b) => (num(b.volume_24h_fp) > num(a.volume_24h_fp) ? b : a));
    leader = { label: String(pick.yes_sub_title || pick.title || "Yes"), probability: kalshiPrice(pick) };
  }

  const title = String(event.title || event.event_ticker);
  // close_time can sit years past the outcome; expected expiry is when it actually resolves.
  const endTimes = markets.map((m) => String(m.expected_expiration_time || m.close_time || "")).filter(Boolean).sort();
  return {
    id: `kalshi:${event.event_ticker}`,
    platform: "kalshi",
    title,
    url: `https://kalshi.com/markets/${String(event.series_ticker).toLowerCase()}/${slugify(title)}/${String(
      event.event_ticker
    ).toLowerCase()}`,
    image: null,
    leader,
    volume24h: markets.reduce((sum, m) => sum + num(m.volume_24h_fp), 0),
    endDate: endTimes[0] || null,
  };
}

async function trendingKalshi(limit: number): Promise<DiscoveredMarket[]> {
  const perSeries = await Promise.allSettled(
    KALSHI_SERIES.map(async (series) => {
      const params = new URLSearchParams({
        series_ticker: series,
        status: "open",
        with_nested_markets: "true",
        limit: "3",
      });
      const data = await getJson<{ events?: AnyObj[] }>(`${KALSHI_API}/events?${params}`);
      // The nearest open event in a series is the one people trade.
      const markets = (data.events || [])
        .map(fromKalshiEvent)
        .filter((m): m is DiscoveredMarket => m !== null && hasTimeLeft(m.endDate) && isOpenQuestion(m.leader));
      return markets.sort((a, b) => b.volume24h - a.volume24h)[0];
    })
  );

  return perSeries
    .flatMap((result) => (result.status === "fulfilled" && result.value ? [result.value] : []))
    .filter((m) => m.volume24h > 0)
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, limit);
}

function matches(market: DiscoveredMarket, terms: string[]): boolean {
  const haystack = `${market.title} ${market.leader?.label ?? ""}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Two Polymarket markets for every Kalshi one, each list in trending order. */
function interleave(polymarket: DiscoveredMarket[], kalshi: DiscoveredMarket[]): DiscoveredMarket[] {
  const merged: DiscoveredMarket[] = [];
  let p = 0;
  let k = 0;
  while (p < polymarket.length || k < kalshi.length) {
    if (p < polymarket.length) merged.push(polymarket[p++]);
    if (p < polymarket.length) merged.push(polymarket[p++]);
    if (k < kalshi.length) merged.push(kalshi[k++]);
  }
  return merged;
}

export async function getTrendingMarkets(): Promise<DiscoveredMarket[]> {
  const [polymarket, kalshi] = await Promise.allSettled([trendingPolymarket(16), trendingKalshi(8)]);
  return interleave(
    polymarket.status === "fulfilled" ? polymarket.value : [],
    kalshi.status === "fulfilled" ? kalshi.value : []
  );
}

export async function searchMarkets(query: string, limit = 8): Promise<DiscoveredMarket[]> {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const [polymarket, kalshi] = await Promise.allSettled([searchPolymarket(query, limit), trendingKalshi(KALSHI_SERIES.length)]);
  const kalshiHits = kalshi.status === "fulfilled" ? kalshi.value.filter((m) => matches(m, terms)) : [];
  return interleave(polymarket.status === "fulfilled" ? polymarket.value : [], kalshiHits).slice(0, limit);
}
