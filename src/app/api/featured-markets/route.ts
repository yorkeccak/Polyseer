import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export interface FeaturedMarket {
  id: number;
  slug: string;
  question: string;
  category: string | null;
  polymarket_url: string;
  volume: number;
  end_date: string;
  current_odds: any;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

export interface FeaturedMarketsResponse {
  success: boolean;
  markets: FeaturedMarket[];
  count: number;
  last_updated?: string;
}

export async function GET() {
  try {
    console.log('[API] Fetching featured markets...');

    const supabase = await createClient();

    // Simple query - cron job does all the intelligence
    const { data: markets, error } = await supabase
      .from('featured_markets')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('volume', { ascending: false })
      .limit(4); // Reduced to 4 for better mobile experience

    if (error) {
      console.error('[API] Database error:', error);

      // In development mode without Supabase, return empty array gracefully
      const isDevelopment = process.env.NEXT_PUBLIC_APP_MODE === 'development';
      if (isDevelopment && error.message?.includes('not configured')) {
        console.log('[API] Supabase not configured, returning empty markets (dev mode)');
        return NextResponse.json({
          success: true,
          markets: [],
          count: 0,
          message: 'Database not configured (development mode)'
        });
      }

      return NextResponse.json(
        { success: false, error: 'Database query failed', markets: [], count: 0 },
        { status: 500 }
      );
    }

    if (!markets || markets.length === 0) {
      console.log('[API] No featured markets found');
      return NextResponse.json({
        success: true,
        markets: [],
        count: 0,
        message: 'No featured markets available'
      });
    }

    console.log(`[API] Returning ${markets.length} featured markets`);

    const response: FeaturedMarketsResponse = {
      success: true,
      markets: markets as FeaturedMarket[],
      count: markets.length,
      last_updated: markets[0]?.updated_at
    };

    // Cache for 1 hour
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800'
      }
    });

  } catch (error) {
    console.error('[API] Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        markets: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

// Optional: Handle CORS for client-side requests
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}