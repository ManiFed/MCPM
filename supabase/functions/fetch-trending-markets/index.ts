const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TrendingMarket {
  id: string;
  title: string;
  probability: number;
  volume: number | null;
  platform: string;
  url: string;
  category?: string;
  endDate?: string;
}

async function fetchPolymarketTrending(): Promise<TrendingMarket[]> {
  try {
    const r = await fetch("https://gamma-api.polymarket.com/markets?active=true&closed=false&order=volume24hr&ascending=false&limit=20");
    if (!r.ok) return [];
    const markets = await r.json();
    return markets
      .filter((m: any) => m.outcomePrices && m.question)
      .map((m: any) => {
        const prices = JSON.parse(m.outcomePrices);
        return {
          id: `poly-${m.id || m.slug}`,
          title: m.question || m.title,
          probability: parseFloat(prices[0]) || 0,
          volume: m.volume24hr ? parseFloat(m.volume24hr) : (m.volume ? parseFloat(m.volume) : null),
          platform: "Polymarket",
          url: `https://polymarket.com/event/${m.slug}`,
          category: m.category || undefined,
          endDate: m.endDate || undefined,
        };
      });
  } catch (e) {
    console.error("[trending] Polymarket error:", e);
    return [];
  }
}

async function fetchManifoldTrending(): Promise<TrendingMarket[]> {
  try {
    const r = await fetch("https://api.manifold.markets/v0/search-markets?sort=score&filter=open&contractType=BINARY&limit=20");
    if (!r.ok) return [];
    const markets = await r.json();
    return markets
      .filter((m: any) => m.probability != null)
      .map((m: any) => ({
        id: `mani-${m.id}`,
        title: m.question || m.title,
        probability: m.probability,
        volume: m.volume ?? m.totalLiquidity ?? null,
        platform: "Manifold",
        url: m.url || `https://manifold.markets/${m.creatorUsername}/${m.slug}`,
        category: m.groupSlugs?.[0] || undefined,
        endDate: m.closeTime ? new Date(m.closeTime).toISOString() : undefined,
      }));
  } catch (e) {
    console.error("[trending] Manifold error:", e);
    return [];
  }
}

async function fetchMetaculusTrending(): Promise<TrendingMarket[]> {
  try {
    const r = await fetch("https://www.metaculus.com/api/posts/?limit=15&order_by=-activity&forecast_type=binary&statuses=open", {
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return [];
    const data = await r.json();
    const results = data.results || data;
    return (Array.isArray(results) ? results : [])
      .filter((p: any) => p.question?.aggregations?.recency_weighted?.latest)
      .map((p: any) => {
        const f = p.question.aggregations.recency_weighted.latest;
        const prob = f.centers?.[0] ?? f.means?.[0] ?? 0.5;
        return {
          id: `meta-${p.id}`,
          title: p.title || p.question?.title || `Question ${p.id}`,
          probability: prob,
          volume: p.nr_forecasters ?? null,
          platform: "Metaculus",
          url: `https://www.metaculus.com/questions/${p.id}/`,
          category: p.group?.name || undefined,
          endDate: p.scheduled_close_time || undefined,
        };
      });
  } catch (e) {
    console.error("[trending] Metaculus error:", e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let platforms = ["polymarket", "manifold", "metaculus"];
    try {
      const body = await req.json();
      if (body?.platforms) platforms = body.platforms;
    } catch { /* no body is fine */ }

    const fetchers: Promise<TrendingMarket[]>[] = [];
    if (platforms.includes("polymarket")) fetchers.push(fetchPolymarketTrending());
    if (platforms.includes("manifold")) fetchers.push(fetchManifoldTrending());
    if (platforms.includes("metaculus")) fetchers.push(fetchMetaculusTrending());

    const results = await Promise.all(fetchers);
    const markets = results.flat();

    // Sort by volume descending (null last)
    markets.sort((a, b) => (b.volume ?? -1) - (a.volume ?? -1));

    return new Response(JSON.stringify({ markets }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
