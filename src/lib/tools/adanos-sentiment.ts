import { tool } from "ai";
import { z } from "zod";

const ADANOS_BASE_URL = (process.env.ADANOS_API_BASE_URL || "https://api.adanos.org").replace(/\/+$/, "");
const ADANOS_DOCS_URL = "https://api.adanos.org/docs/";
const ALL_SOURCES = ["reddit", "x", "news", "polymarket"] as const;

type AdanosSource = (typeof ALL_SOURCES)[number];

export interface AdanosSentimentRow {
  ticker: string;
  companyName: string | null;
  source: AdanosSource;
  sentimentScore: number | null;
  buzzScore: number | null;
  bullishPct: number | null;
  bearishPct: number | null;
  mentions: number | null;
  subredditCount: number | null;
  sourceCount: number | null;
  uniqueTweets: number | null;
  tradeCount: number | null;
  marketCount: number | null;
  totalLiquidity: number | null;
  trend: string | null;
  trendHistory: number[];
}

export interface AdanosSourceSnapshot {
  source: AdanosSource;
  endpoint: string;
  success: boolean;
  error?: string;
  stocks: AdanosSentimentRow[];
}

export interface AdanosSentimentToolResult {
  success: boolean;
  enabled: boolean;
  tickers: string[];
  source: AdanosSource | "all";
  days: number;
  snapshots: AdanosSourceSnapshot[];
  summary: string;
  docsUrl: string;
  error?: string;
}

const adanosInputSchema = z.object({
  tickers: z.array(z.string()).min(1).max(5).describe("1-5 likely stock tickers relevant to the market, e.g. ['TSLA'] or ['AAPL','GOOGL']."),
  source: z.enum([...ALL_SOURCES, "all"]).default("all").describe("Sentiment source to query. Use 'all' for a cross-platform snapshot."),
  days: z.number().int().min(1).max(30).optional().describe("Lookback window in days. Defaults to ADANOS_SENTIMENT_DEFAULT_DAYS or 7."),
});

const TICKER_RE = /^[A-Z][A-Z0-9.]{0,9}$/;

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInt(value: unknown): number | null {
  const parsed = toFiniteNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function pick(record: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }
  return undefined;
}

export function normalizeTickers(tickers: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawTicker of tickers) {
    const ticker = String(rawTicker || "").trim().replace(/\$/g, "").toUpperCase();
    if (!ticker || !TICKER_RE.test(ticker) || seen.has(ticker)) {
      continue;
    }
    seen.add(ticker);
    normalized.push(ticker);
  }

  return normalized.slice(0, 5);
}

export function normalizeCompareRows(source: AdanosSource, payload: unknown): AdanosSentimentRow[] {
  const rows = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload
      ? (payload as Record<string, unknown>).stocks ?? (payload as Record<string, unknown>).data ?? (payload as Record<string, unknown>).results ?? []
      : [];

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const ticker = String(pick(record, "ticker", "symbol") || "").trim().replace(/\$/g, "").toUpperCase();
    if (!ticker || !TICKER_RE.test(ticker)) {
      return [];
    }

    const trendHistory = Array.isArray(record.trend_history)
      ? record.trend_history.map((value) => toFiniteNumber(value)).filter((value): value is number => value !== null)
      : [];

    return [{
      ticker,
      companyName: (pick(record, "company_name", "name", "company") as string | undefined) || null,
      source,
      sentimentScore: toFiniteNumber(pick(record, "sentiment_score", "sentiment", "score")),
      buzzScore: toFiniteNumber(pick(record, "buzz_score", "buzz")),
      bullishPct: toFiniteNumber(record.bullish_pct),
      bearishPct: toFiniteNumber(record.bearish_pct),
      mentions: toInt(pick(record, "mentions", "mention_count")),
      subredditCount: toInt(record.subreddit_count),
      sourceCount: toInt(record.source_count),
      uniqueTweets: toInt(record.unique_tweets),
      tradeCount: toInt(record.trade_count),
      marketCount: toInt(record.market_count),
      totalLiquidity: toFiniteNumber(record.total_liquidity),
      trend: typeof record.trend === "string" ? record.trend : null,
      trendHistory,
    }];
  });
}

export function buildAdanosSummary(snapshots: AdanosSourceSnapshot[]): string {
  const lines = snapshots.flatMap((snapshot) => {
    if (!snapshot.success || snapshot.stocks.length === 0) {
      return snapshot.error
        ? [`- ${snapshot.source}: unavailable (${snapshot.error})`]
        : [`- ${snapshot.source}: no qualifying sentiment rows returned`];
    }

    const top = snapshot.stocks
      .slice()
      .sort((a, b) => (b.buzzScore ?? Number.NEGATIVE_INFINITY) - (a.buzzScore ?? Number.NEGATIVE_INFINITY))
      .slice(0, 3)
      .map((row) => {
        const metrics = [
          row.sentimentScore !== null ? `sentiment=${row.sentimentScore.toFixed(2)}` : null,
          row.buzzScore !== null ? `buzz=${row.buzzScore.toFixed(1)}` : null,
          row.bullishPct !== null ? `bullish=${row.bullishPct.toFixed(0)}%` : null,
          row.mentions !== null ? `mentions=${row.mentions}` : null,
          row.tradeCount !== null ? `trades=${row.tradeCount}` : null,
          row.trend ? `trend=${row.trend}` : null,
        ].filter(Boolean);

        return `${row.ticker}${row.companyName ? ` (${row.companyName})` : ""}: ${metrics.join(", ")}`;
      });

    return [`- ${snapshot.source}: ${top.join(" | ")}`];
  });

  return lines.join("\n");
}

function getAdanosApiKey(): string {
  return (process.env.ADANOS_API_KEY || "").trim();
}

function getDefaultDays(): number {
  const parsed = Number(process.env.ADANOS_SENTIMENT_DEFAULT_DAYS || 7);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.min(Math.trunc(parsed), 30) : 7;
}

function getTimeoutMs(): number {
  const parsed = Number(process.env.ADANOS_API_TIMEOUT_MS || 10000);
  return Number.isFinite(parsed) && parsed >= 1000 ? Math.trunc(parsed) : 10000;
}

async function fetchSourceSnapshot(source: AdanosSource, tickers: string[], days: number, apiKey: string): Promise<AdanosSourceSnapshot> {
  const endpoint = `${ADANOS_BASE_URL}/${source}/stocks/v1/compare`;
  const url = new URL(endpoint);
  url.searchParams.set("tickers", tickers.join(","));
  url.searchParams.set("days", String(days));

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(getTimeoutMs()),
    });

    if (!response.ok) {
      return {
        source,
        endpoint,
        success: false,
        error: `HTTP ${response.status}`,
        stocks: [],
      };
    }

    const payload = await response.json();
    return {
      source,
      endpoint,
      success: true,
      stocks: normalizeCompareRows(source, payload),
    };
  } catch (error) {
    return {
      source,
      endpoint,
      success: false,
      error: error instanceof Error ? error.message : "Unknown Adanos request error",
      stocks: [],
    };
  }
}

export const adanosMarketSentimentTool = tool({
  description:
    "Optional cross-platform stock sentiment snapshots from Adanos. Use only when the market clearly concerns a public company, stock, earnings, or ticker-linked catalyst. Treat the output as directional context to guide further research, not as standalone proof.",
  inputSchema: adanosInputSchema,
  execute: async ({ tickers, source, days }) => executeAdanosMarketSentiment({ tickers, source, days }),
});

export async function executeAdanosMarketSentiment({
  tickers,
  source,
  days,
}: z.infer<typeof adanosInputSchema>): Promise<AdanosSentimentToolResult> {
  const normalizedTickers = normalizeTickers(tickers);
  const apiKey = getAdanosApiKey();
  const lookbackDays = days ?? getDefaultDays();

  if (normalizedTickers.length === 0) {
    return {
      success: false,
      enabled: false,
      tickers: [],
      source,
      days: lookbackDays,
      snapshots: [],
      summary: "No valid stock tickers were provided.",
      error: "No valid stock tickers were provided.",
      docsUrl: ADANOS_DOCS_URL,
    };
  }

  if (!apiKey) {
    return {
      success: false,
      enabled: false,
      tickers: normalizedTickers,
      source,
      days: lookbackDays,
      snapshots: [],
      summary: "Adanos sentiment enrichment is disabled because ADANOS_API_KEY is not configured.",
      error: "ADANOS_API_KEY is not configured.",
      docsUrl: ADANOS_DOCS_URL,
    };
  }

  const sources = source === "all" ? [...ALL_SOURCES] : [source];
  const snapshots = await Promise.all(
    sources.map((entry) => fetchSourceSnapshot(entry, normalizedTickers, lookbackDays, apiKey))
  );
  const success = snapshots.some((snapshot) => snapshot.success && snapshot.stocks.length > 0);

  return {
    success,
    enabled: true,
    tickers: normalizedTickers,
    source,
    days: lookbackDays,
    snapshots,
    summary: buildAdanosSummary(snapshots),
    docsUrl: ADANOS_DOCS_URL,
    error: success ? undefined : "No Adanos sentiment rows were returned for the requested tickers.",
  };
}
