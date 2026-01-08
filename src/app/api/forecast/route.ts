import { NextRequest, NextResponse } from 'next/server';
import { runUnifiedForecastPipeline } from '@/lib/agents/orchestrator';
import { parseMarketUrl, isValidMarketUrl } from '@/lib/tools/market-url-parser';
import { checkRateLimit, getIpAddress, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit';

export const maxDuration = 800;

/**
 * Public Forecast API
 * No authentication required - rate limited by IP address
 * Valyu API key is server-side only
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const ip = getIpAddress(req);
    const rateLimit = checkRateLimit(ip);

    console.log(`[Forecast API] Request from IP: ${ip}, Remaining: ${rateLimit.remaining}/${rateLimit.limit}`);

    if (!rateLimit.allowed) {
      console.warn(`[Forecast API] Rate limit exceeded for IP: ${ip}`);
      return rateLimitResponse(rateLimit.resetAt);
    }

    const body = await req.json();
    const {
      polymarketSlug, // Legacy support
      marketUrl, // New unified support
      drivers = [],
      historyInterval = '1d',
      withBooks = true,
      withTrades = false,
    } = body;

    // Determine which parameter was provided and validate
    let finalMarketUrl: string;
    let identifier: string;

    if (marketUrl) {
      // New unified approach - supports both Polymarket and Kalshi URLs
      if (typeof marketUrl !== 'string' || !marketUrl) {
        return NextResponse.json(
          { error: 'marketUrl must be a non-empty string' },
          { status: 400 }
        );
      }

      if (!isValidMarketUrl(marketUrl)) {
        const parsed = parseMarketUrl(marketUrl);
        return NextResponse.json(
          { error: parsed.error || 'Invalid market URL. Only Polymarket and Kalshi URLs are supported.' },
          { status: 400 }
        );
      }

      finalMarketUrl = marketUrl;
      const parsed = parseMarketUrl(marketUrl);
      identifier = parsed.identifier;
    } else if (polymarketSlug) {
      // Legacy support - convert Polymarket slug to URL
      if (typeof polymarketSlug !== 'string' || !polymarketSlug) {
        return NextResponse.json(
          { error: 'polymarketSlug must be a non-empty string' },
          { status: 400 }
        );
      }

      finalMarketUrl = `https://polymarket.com/event/${polymarketSlug}`;
      identifier = polymarketSlug;
    } else {
      return NextResponse.json(
        { error: 'Either marketUrl or polymarketSlug is required' },
        { status: 400 }
      );
    }

    console.log(`[Forecast API] Analyzing: ${finalMarketUrl}`);
    console.log(`[Forecast API] Parameters: interval=${historyInterval}, books=${withBooks}, trades=${withTrades}`);

    // Create a ReadableStream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Helper function to send SSE event
        const sendEvent = (data: any, event?: string) => {
          const eventData = event ? `event: ${event}\n` : '';
          const payload = `${eventData}data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        };

        try {
          // Send initial connection event
          sendEvent({
            type: 'connected',
            message: 'Starting analysis...',
            rateLimit: {
              remaining: rateLimit.remaining,
              limit: rateLimit.limit,
              resetAt: new Date(rateLimit.resetAt).toISOString()
            }
          });

          // Create progress callback for the orchestrator
          const onProgress = (step: string, details: any) => {
            sendEvent({
              type: 'progress',
              step,
              details,
              timestamp: new Date().toISOString()
            }, 'progress');
          };

          const startTime = Date.now();

          // Run unified forecasting pipeline with progress tracking (auto-detects platform)
          // Valyu API is called server-side with VALYU_API_KEY from environment
          const forecastCard = await runUnifiedForecastPipeline({
            marketUrl: finalMarketUrl,
            drivers,
            historyInterval,
            withBooks,
            withTrades,
            onProgress,
          });

          const durationSeconds = Math.round((Date.now() - startTime) / 1000);

          console.log(`[Forecast API] Analysis complete in ${durationSeconds}s`);

          // Send final result
          sendEvent({
            type: 'complete',
            forecast: forecastCard,
            durationSeconds,
            timestamp: new Date().toISOString(),
            rateLimit: {
              remaining: rateLimit.remaining - 1,
              limit: rateLimit.limit,
              resetAt: new Date(rateLimit.resetAt).toISOString()
            }
          }, 'complete');

        } catch (error) {
          console.error('[Forecast API] Error during analysis:', error);

          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

          sendEvent({
            type: 'error',
            error: errorMessage,
            details: error instanceof Error ? error.stack : 'No stack trace available',
            timestamp: new Date().toISOString()
          }, 'error');
        } finally {
          controller.close();
        }
      }
    });

    // Create response with rate limit headers
    const response = new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

    return addRateLimitHeaders(response, rateLimit);

  } catch (error) {
    console.error('[Forecast API] Error setting up forecast stream:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Public AI Forecasting API',
    description: 'AI-powered forecasting using GPT-5 agents - works with Polymarket and Kalshi',
    rateLimit: {
      limit: 20,
      window: '24 hours',
      note: 'Rate limit is per IP address'
    },
    usage: 'POST with { marketUrl: string, drivers?: string[], historyInterval?: string, withBooks?: boolean, withTrades?: boolean }',
    parameters: {
      marketUrl: 'Required. Full market URL (Polymarket or Kalshi). Platform is auto-detected.',
      polymarketSlug: 'Deprecated. Use marketUrl instead. Still supported for backward compatibility.',
      drivers: 'Optional. Key factors to focus analysis on. Auto-generated if not provided.',
      historyInterval: 'Optional. Price history granularity ("1h", "4h", "1d", "1w"). Auto-optimized if not provided.',
      withBooks: 'Optional. Include order book data (default: true)',
      withTrades: 'Optional. Include recent trades (default: false)'
    },
    supportedPlatforms: {
      polymarket: {
        name: 'Polymarket',
        urlFormat: 'https://polymarket.com/event/{slug}',
        example: 'https://polymarket.com/event/will-trump-win-2024'
      },
      kalshi: {
        name: 'Kalshi',
        urlFormat: 'https://kalshi.com/markets/{series}/{category}/{ticker}',
        example: 'https://kalshi.com/markets/kxtime/times-person-of-the-year/KXTIME-25'
      }
    },
    autoGeneration: {
      drivers: 'System automatically analyzes the market question and generates relevant drivers using GPT-5',
      historyInterval: 'System selects optimal interval based on market volume, time until close, and volatility'
    },
    examples: {
      basic: {
        marketUrl: 'https://polymarket.com/event/will-ai-achieve-agi-by-2030'
      },
      withCustomization: {
        marketUrl: 'https://polymarket.com/event/will-trump-win-2024',
        drivers: ['Polling data', 'Economic indicators', 'Swing states'],
        historyInterval: '4h'
      }
    }
  });
}
