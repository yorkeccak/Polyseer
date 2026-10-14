import { NextRequest, NextResponse } from "next/server";
import { searchMarkets, REVALIDATE_SECONDS } from "@/lib/markets/discovery";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);
  if (query.length < 2) return NextResponse.json({ markets: [] });

  try {
    const markets = await searchMarkets(query);
    return NextResponse.json(
      { markets },
      { headers: { "Cache-Control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=600` } }
    );
  } catch (error) {
    console.error("[markets] search failed:", error);
    return NextResponse.json({ markets: [], error: "Search is unavailable" }, { status: 502 });
  }
}
