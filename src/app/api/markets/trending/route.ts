import { NextResponse } from "next/server";
import { getTrendingMarkets, REVALIDATE_SECONDS } from "@/lib/markets/discovery";

export const revalidate = 300;

export async function GET() {
  try {
    const markets = await getTrendingMarkets();
    return NextResponse.json(
      { markets, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=600` } }
    );
  } catch (error) {
    console.error("[markets] trending failed:", error);
    return NextResponse.json({ markets: [], error: "Trending markets are unavailable" }, { status: 502 });
  }
}
