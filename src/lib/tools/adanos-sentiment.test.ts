import test from "node:test";
import assert from "node:assert/strict";

import { buildAdanosSummary, normalizeCompareRows, normalizeTickers } from "./adanos-sentiment";

test("normalizeTickers deduplicates and filters invalid symbols", () => {
  assert.deepEqual(
    normalizeTickers(["$tsla", " TSLA ", "AAPL", "bad ticker", "123", "msft"]),
    ["TSLA", "AAPL", "MSFT"]
  );
});

test("normalizeCompareRows maps compare payload fields across sources", () => {
  const redditRows = normalizeCompareRows("reddit", {
    stocks: [
      {
        ticker: "TSLA",
        company_name: "Tesla, Inc.",
        sentiment_score: "0.34",
        buzz_score: "72.5",
        bullish_pct: "61",
        mentions: "181",
        subreddit_count: "14",
        trend: "rising",
        trend_history: [48.2, 60.5, 72.5],
      },
    ],
  });

  assert.equal(redditRows[0]?.ticker, "TSLA");
  assert.equal(redditRows[0]?.companyName, "Tesla, Inc.");
  assert.equal(redditRows[0]?.sentimentScore, 0.34);
  assert.equal(redditRows[0]?.subredditCount, 14);
  assert.deepEqual(redditRows[0]?.trendHistory, [48.2, 60.5, 72.5]);

  const polymarketRows = normalizeCompareRows("polymarket", [
    {
      symbol: "$NVDA",
      company: "NVIDIA",
      sentiment: "0.18",
      buzz: "64.1",
      trade_count: "95",
      market_count: "6",
      total_liquidity: "50213.4",
      trend: "stable",
    },
  ]);

  assert.equal(polymarketRows[0]?.ticker, "NVDA");
  assert.equal(polymarketRows[0]?.companyName, "NVIDIA");
  assert.equal(polymarketRows[0]?.tradeCount, 95);
  assert.equal(polymarketRows[0]?.marketCount, 6);
  assert.equal(polymarketRows[0]?.totalLiquidity, 50213.4);
});

test("buildAdanosSummary includes successful rows and unavailable sources", () => {
  const summary = buildAdanosSummary([
    {
      source: "reddit",
      endpoint: "https://api.adanos.org/reddit/stocks/v1/compare",
      success: true,
      stocks: [
        {
          ticker: "TSLA",
          companyName: "Tesla, Inc.",
          source: "reddit",
          sentimentScore: 0.34,
          buzzScore: 72.5,
          bullishPct: 61,
          bearishPct: 18,
          mentions: 181,
          subredditCount: 14,
          sourceCount: null,
          uniqueTweets: null,
          tradeCount: null,
          marketCount: null,
          totalLiquidity: null,
          trend: "rising",
          trendHistory: [48.2, 60.5, 72.5],
        },
      ],
    },
    {
      source: "news",
      endpoint: "https://api.adanos.org/news/stocks/v1/compare",
      success: false,
      error: "HTTP 429",
      stocks: [],
    },
  ]);

  assert.match(summary, /reddit: TSLA \(Tesla, Inc\.\): sentiment=0.34, buzz=72.5/);
  assert.match(summary, /news: unavailable \(HTTP 429\)/);
});
