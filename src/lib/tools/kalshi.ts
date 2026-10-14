import { z } from "zod";

// Kalshi API base
const KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2" as const;

type AnyObj = Record<string, any>;

interface MarketSummary {
  question: string;
  close_time?: string | number;
  resolution_source?: string;
  volume?: number;
  liquidity?: number;
  token_map: { [outcome: string]: string };
  ticker?: string;
  event_ticker?: string;
  category?: string;
  rules?: string;
}

interface MarketStateNowEntry {
  token_id: string;
  outcome?: string;
  bid?: number | null;
  ask?: number | null;
  mid?: number | null;
  top_bid_size?: number | null;
  top_ask_size?: number | null;
}

interface LLMPayload {
  market_facts: MarketSummary;
  market_state_now: MarketStateNowEntry[];
  history: { token_id: string; points: { t: number; p: number }[] }[];
  order_books?: AnyObj[];
  recent_trades?: AnyObj[];
}

interface LLMPayloadEnhanced extends LLMPayload {
  event_summary?: {
    is_multi_candidate: boolean;
    total_markets: number;
    active_markets: number;
    top_candidates: Array<{
      name: string;
      question: string;
      implied_probability: number;
      volume: number;
      liquidity: number;
      active: boolean;
      market: AnyObj;
    }>;
  };
}

// Utility
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function http<T = any>(
  input: RequestInfo,
  init?: RequestInit,
  retries = 3
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(input, {
        ...init,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
      });
      if (res.ok) {
        const text = await res.text();
        clearTimeout(timeoutId);
        return (text ? JSON.parse(text) : (undefined as any)) as T;
      }
      if (res.status >= 500 || res.status === 429) {
        await sleep(300 * (i + 1));
        continue;
      }
      const errorText = await res.text();
      clearTimeout(timeoutId);
      throw new Error(
        `HTTP ${res.status} ${res.statusText}: ${errorText} for ${
          typeof input === "string" ? input : (input as any).toString()
        }`
      );
    } catch (err) {
      clearTimeout(timeoutId);
      if (i === retries - 1) throw err;
      await sleep(300 * (i + 1));
    }
  }
  throw new Error(
    `Failed after ${retries} retries: ${
      typeof input === "string" ? input : (input as any).toString()
    }`
  );
}

// ---- Kalshi API Calls ----

/**
 * Get market data by ticker
 * Example ticker: "KXTIME-25", "KXGOVSHUT-25oct01"
 */
async function getMarketByTicker(ticker: string): Promise<AnyObj> {
  const url = `${KALSHI_API_BASE}/markets/${encodeURIComponent(ticker)}`;
  try {
    const response = await http<{ market: AnyObj }>(url);
    if (!response?.market) {
      throw new Error(`No market found for ticker: ${ticker}`);
    }
    return response.market;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      throw new Error(
        `Kalshi market "${ticker}" not found. This market may have closed, expired, or the ticker may be incorrect. Please verify the market URL is correct and the market is still active on Kalshi.`
      );
    }
    throw error;
  }
}

/**
 * Get event data by ticker
 */
async function getEventByTicker(eventTicker: string): Promise<AnyObj> {
  const url = `${KALSHI_API_BASE}/events/${encodeURIComponent(eventTicker)}`;
  const response = await http<{ event: AnyObj }>(url);
  if (!response?.event) {
    throw new Error(`No event found for ticker: ${eventTicker}`);
  }
  return response.event;
}

/**
 * Get series data
 */
async function getSeriesByTicker(seriesTicker: string): Promise<AnyObj> {
  const url = `${KALSHI_API_BASE}/series/${encodeURIComponent(seriesTicker)}`;
  const response = await http<{ series: AnyObj }>(url);
  if (!response?.series) {
    throw new Error(`No series found for ticker: ${seriesTicker}`);
  }
  return response.series;
}

/**
 * Get markets for an event (multi-candidate support)
 */
async function getMarketsForEvent(eventTicker: string): Promise<AnyObj[]> {
  const url = `${KALSHI_API_BASE}/markets?event_ticker=${encodeURIComponent(eventTicker)}&status=open`;
  const response = await http<{ markets: AnyObj[] }>(url);
  return response?.markets || [];
}

/**
 * Get orderbook for a market
 */
async function getOrderBook(marketTicker: string): Promise<AnyObj> {
  const url = `${KALSHI_API_BASE}/markets/${encodeURIComponent(marketTicker)}/orderbook`;
  const response = await http<{ orderbook: AnyObj }>(url);
  return response?.orderbook || { yes: [], no: [] };
}

/**
 * Get daily closing prices for the last 90 days from the candlesticks endpoint
 */
async function getPriceHistory(market: AnyObj): Promise<{ t: number; p: number }[]> {
  const marketTicker = market.ticker;
  const seriesTicker = market.series_ticker || String(market.event_ticker || marketTicker).split('-')[0];
  try {
    const end = Math.floor(Date.now() / 1000);
    const params = new URLSearchParams({
      start_ts: String(end - 90 * 86400),
      end_ts: String(end),
      period_interval: "1440",
    });
    const url = `${KALSHI_API_BASE}/series/${encodeURIComponent(seriesTicker)}/markets/${encodeURIComponent(marketTicker)}/candlesticks?${params}`;
    const response = await http<{ candlesticks: AnyObj[] }>(url);

    if (!Array.isArray(response?.candlesticks)) {
      return [];
    }

    return response.candlesticks
      .map((candle: AnyObj) => ({
        t: Number(candle.end_period_ts) * 1000,
        p: dollars(candle.price, "close") ?? dollars(candle.yes_bid, "close") ?? 0,
      }))
      .filter((point) => point.p > 0);
  } catch (error) {
    console.warn(`Failed to fetch price history for ${marketTicker}:`, error);
    return [];
  }
}

// ---- Extractors ----

function extractQuestion(market: AnyObj): string {
  return market.title || market.question || market.subtitle || "";
}

/** Kalshi reports prices as dollar strings (`yes_bid_dollars`); older responses used integer cents (`yes_bid`). */
function dollars(obj: AnyObj | undefined, field: string): number | null {
  if (!obj) return null;
  const value = obj[`${field}_dollars`] ?? (typeof obj[field] === "number" ? obj[field] / 100 : undefined);
  const n = typeof value === "string" ? parseFloat(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/** Counts are fixed-point strings (`volume_fp`) in current responses. */
function count(market: AnyObj, field: string): number {
  const n = parseFloat(market[`${field}_fp`] ?? market[field] ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function isOpen(market: AnyObj): boolean {
  return market.status === 'active' || market.status === 'open';
}

function extractCloseTime(market: AnyObj): string | number | undefined {
  // close_time can sit years past the real outcome date; expected expiry is when it resolves.
  return market.expected_expiration_time || market.close_time || market.expiration_time;
}

function extractResolutionSource(market: AnyObj, series?: AnyObj): string | undefined {
  if (market.rules_primary) return market.rules_primary;
  if (series?.settlement_sources && Array.isArray(series.settlement_sources)) {
    return series.settlement_sources.map((s: any) => s.name).join(", ");
  }
  return market.settlement_source || "Kalshi official rules";
}

function extractVolume(market: AnyObj): number | undefined {
  return count(market, 'volume') || count(market, 'volume_24h') || undefined;
}

function extractLiquidity(market: AnyObj): number | undefined {
  const liquidity = dollars(market, 'liquidity') || 0;
  return liquidity > 0 ? liquidity : undefined;
}

function yesMid(market: AnyObj): number | null {
  const bid = dollars(market, 'yes_bid') || 0;
  const ask = dollars(market, 'yes_ask') || 0;
  return bid > 0 && ask > 0 ? (bid + ask) / 2 : null;
}

/**
 * Build token map for Kalshi (always binary: Yes/No)
 * We create synthetic token IDs using the market ticker
 */
function buildTokenMap(market: AnyObj): { [outcome: string]: string } {
  const ticker = market.ticker;
  return {
    "Yes": `${ticker}:YES`,
    "No": `${ticker}:NO`
  };
}

async function buildMarketSummary(market: AnyObj, series?: AnyObj): Promise<MarketSummary> {
  return {
    question: extractQuestion(market),
    close_time: extractCloseTime(market),
    resolution_source: extractResolutionSource(market, series),
    volume: extractVolume(market),
    liquidity: extractLiquidity(market),
    token_map: buildTokenMap(market),
    ticker: market.ticker,
    event_ticker: market.event_ticker,
    category: market.category || series?.category,
    rules: market.rules_primary || market.rules_secondary,
  };
}

/**
 * Build current market state with bid/ask/mid prices
 */
function buildMarketStateNow(market: AnyObj): MarketStateNowEntry[] {
  const tokenMap = buildTokenMap(market);

  const yesBid = dollars(market, 'yes_bid') || 0;
  const yesAsk = dollars(market, 'yes_ask') || 0;
  const noBid = dollars(market, 'no_bid') || 0;
  const noAsk = dollars(market, 'no_ask') || 0;

  const yesEntry: MarketStateNowEntry = {
    token_id: tokenMap["Yes"],
    outcome: "Yes",
    bid: yesBid > 0 ? yesBid : null,
    ask: yesAsk > 0 ? yesAsk : null,
    mid: yesBid > 0 && yesAsk > 0 ? (yesBid + yesAsk) / 2 : null,
    top_bid_size: null, // Kalshi doesn't expose this directly in market endpoint
    top_ask_size: null,
  };

  const noEntry: MarketStateNowEntry = {
    token_id: tokenMap["No"],
    outcome: "No",
    bid: noBid > 0 ? noBid : null,
    ask: noAsk > 0 ? noAsk : null,
    mid: noBid > 0 && noAsk > 0 ? (noBid + noAsk) / 2 : null,
    top_bid_size: null,
    top_ask_size: null,
  };

  return [yesEntry, noEntry];
}

/**
 * Build orderbook data with top bid/ask sizes
 */
async function buildOrderBooks(market: AnyObj, withBooks: boolean): Promise<AnyObj[]> {
  if (!withBooks) return [];

  const ticker = market.ticker;
  const tokenMap = buildTokenMap(market);

  try {
    const orderbook = await getOrderBook(ticker);

    // Kalshi orderbook structure: { yes: [...], no: [...] }
    // Each order: { price (in cents), quantity }
    const yesOrders = Array.isArray(orderbook.yes) ? orderbook.yes : [];
    const noOrders = Array.isArray(orderbook.no) ? orderbook.no : [];

    return [
      {
        token_id: tokenMap["Yes"],
        outcome: "Yes",
        book: {
          bids: yesOrders.map((o: any) => ({ price: (o.price || 0) / 100, size: o.quantity || 0 })),
          asks: yesOrders.map((o: any) => ({ price: (o.price || 0) / 100, size: o.quantity || 0 }))
        }
      },
      {
        token_id: tokenMap["No"],
        outcome: "No",
        book: {
          bids: noOrders.map((o: any) => ({ price: (o.price || 0) / 100, size: o.quantity || 0 })),
          asks: noOrders.map((o: any) => ({ price: (o.price || 0) / 100, size: o.quantity || 0 }))
        }
      }
    ];
  } catch (error) {
    console.warn(`Failed to fetch orderbook for ${ticker}:`, error);
    return [];
  }
}

/**
 * Build price history for both Yes and No outcomes
 */
async function buildPriceHistory(market: AnyObj): Promise<LLMPayload["history"]> {
  const tokenMap = buildTokenMap(market);

  const yesHistory = await getPriceHistory(market);

  // For No, invert the prices since Yes + No = 1
  const noHistory = yesHistory.map(point => ({
    t: point.t,
    p: 1 - point.p
  }));

  return [
    { token_id: tokenMap["Yes"], points: yesHistory },
    { token_id: tokenMap["No"], points: noHistory }
  ];
}

/**
 * Main function: Build LLM payload from Kalshi market ticker
 */
export async function buildLLMPayloadFromKalshiTicker(
  ticker: string,
  options: { withBooks?: boolean; withTrades?: boolean; maxCandidates?: number } = {}
): Promise<LLMPayloadEnhanced> {
  const { withBooks = true, withTrades = false, maxCandidates = 10 } = options;

  console.log(`🔍 Fetching Kalshi data for identifier: ${ticker}`);

  // Try to get as a market first, if that fails try as an event
  let market: AnyObj;
  let isEventLevel = false;

  try {
    market = await getMarketByTicker(ticker);
    console.log(`✅ Found Kalshi market: ${market.title || ticker}`);
  } catch (marketError) {
    // If market fetch fails, try as an event
    console.log(`🔄 Ticker "${ticker}" not found as market, trying as event...`);
    try {
      const eventData = await http<{ event: AnyObj; markets: AnyObj[] }>(
        `${KALSHI_API_BASE}/events/${encodeURIComponent(ticker)}`
      );

      if (eventData?.markets && eventData.markets.length > 0) {
        console.log(`✅ Found Kalshi event "${ticker}" with ${eventData.markets.length} markets`);
        isEventLevel = true;

        // Find the most active market from the event
        const activeMarkets = eventData.markets.filter(isOpen);
        if (activeMarkets.length === 0) {
          throw new Error(
            `Event "${ticker}" found but all ${eventData.markets.length} markets are closed or settled. This event may have concluded.`
          );
        }

        // Use the market with highest volume as the primary
        market = activeMarkets.reduce((best: AnyObj, current: AnyObj) =>
          count(current, 'volume') > count(best, 'volume') ? current : best
        );

        console.log(`📊 Using most active market: ${market.ticker} (${market.yes_sub_title || 'Unknown'})`);
      } else {
        throw new Error(
          `Kalshi identifier "${ticker}" not found. This market/event may not exist, be closed, or the URL may be incorrect. Please verify the URL on Kalshi.com`
        );
      }
    } catch (eventError) {
      console.error(`❌ Failed to fetch as market or event: ${ticker}`, eventError);
      throw new Error(
        `Kalshi identifier "${ticker}" not found. This could mean:\n` +
        `1. The market/event has closed or been settled\n` +
        `2. The ticker is incorrect\n` +
        `3. The URL format is not recognized\n\n` +
        `Please verify the URL is correct and the market is still active on Kalshi.com`
      );
    }
  }

  // Get series data for additional context
  let series: AnyObj | undefined;
  try {
    const seriesTicker = market.ticker?.split('-')[0]; // Extract series from market ticker
    if (seriesTicker) {
      series = await getSeriesByTicker(seriesTicker);
    }
  } catch (error) {
    console.warn('Failed to fetch series data:', error);
  }

  // Check if this is part of a multi-candidate event
  let eventSummary: LLMPayloadEnhanced["event_summary"] | undefined;
  if (market.event_ticker) {
    try {
      const eventMarkets = await getMarketsForEvent(market.event_ticker);

      if (eventMarkets.length > 2) {
        // Multi-candidate event
        const activeMarkets = eventMarkets.filter(isOpen);

        const topCandidates = activeMarkets
          .map((m: AnyObj) => {
            const volume = extractVolume(m) || 0;
            const liquidity = extractLiquidity(m) || 0;
            const question = extractQuestion(m);
            const candidateName = question.replace(/^Will\s+/, '').replace(/\s+win\s+.*$/, '').trim();

            const implied_probability = yesMid(m) ?? dollars(m, 'last_price') ?? 0;

            return {
              name: candidateName,
              question,
              implied_probability,
              volume,
              liquidity,
              active: isOpen(m),
              market: m
            };
          })
          .sort((a, b) => (b.implied_probability ?? 0) - (a.implied_probability ?? 0))
          .slice(0, maxCandidates);

        eventSummary = {
          is_multi_candidate: true,
          total_markets: eventMarkets.length,
          active_markets: activeMarkets.length,
          top_candidates: topCandidates
        };
      }
    } catch (error) {
      console.warn('Failed to fetch event markets:', error);
    }
  }

  // Build the payload
  const facts = await buildMarketSummary(market, series);
  const market_state_now = buildMarketStateNow(market);
  const history = await buildPriceHistory(market);
  const order_books = await buildOrderBooks(market, withBooks);

  // Note: Kalshi doesn't have a public trades endpoint in the same way Polymarket does
  // We skip recent_trades for now
  const recent_trades = undefined;

  return {
    market_facts: facts,
    market_state_now,
    history,
    order_books: withBooks ? order_books : undefined,
    recent_trades,
    event_summary: eventSummary,
  };
}