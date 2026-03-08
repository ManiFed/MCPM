const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function detectPlatform(url: string): string {
  if (url.includes("polymarket.com")) return "Polymarket";
  if (url.includes("metaculus.com")) return "Metaculus";
  if (url.includes("manifold.markets")) return "Manifold";
  if (url.includes("kalshi.com")) return "Kalshi";
  if (url.includes("predictit.org")) return "PredictIt";
  return "Unknown";
}

function extractSlug(url: string, platform: string): any {
  const cleanUrl = url.split("?")[0].replace(/\/+$/, "");
  switch (platform) {
    case "Polymarket": {
      const eventMatch = cleanUrl.match(/polymarket\.com\/event\/([^/?#]+)(?:\/([^/?#]+))?/);
      if (eventMatch) return { type: "event", slug: eventMatch[2] || eventMatch[1] };
      const marketMatch = cleanUrl.match(/polymarket\.com\/(?:markets?|p)\/([^/?#]+)/);
      if (marketMatch) return { type: "market", slug: marketMatch[1] };
      return null;
    }
    case "Metaculus": {
      const m = cleanUrl.match(/metaculus\.com\/questions\/(\d+)/);
      return m ? m[1] : null;
    }
    case "Manifold": {
      const m = cleanUrl.match(/manifold\.markets\/([^/]+)\/([^/?#]+)/);
      return m ? m[2] : null;
    }
    case "Kalshi": {
      const parts = cleanUrl.match(/kalshi\.com\/(?:markets|events)\/(?:([^/]+)\/)?([^/?#]+)/);
      if (parts) return parts[2] || parts[1];
      return null;
    }
    case "PredictIt": {
      const m = cleanUrl.match(/predictit\.org\/markets\/detail\/(\d+)/);
      return m ? m[1] : null;
    }
    default:
      return null;
  }
}

async function fetchPolymarket(slugInfo: any) {
  const slug = typeof slugInfo === "string" ? slugInfo : slugInfo.slug;

  for (const tryFn of [
    () => fetch(`https://gamma-api.polymarket.com/markets/slug/${slug}`),
    () => fetch(`https://gamma-api.polymarket.com/events/slug/${slug}`),
    () => fetch(`https://gamma-api.polymarket.com/markets?slug_like=${slug}&limit=1`),
  ]) {
    try {
      const r = await tryFn();
      if (!r.ok) continue;
      const raw = await r.json();
      const data = Array.isArray(raw) ? raw[0] : raw;
      const market = data?.markets?.[0] || data;
      if (market?.outcomePrices) {
        const prices = JSON.parse(market.outcomePrices);
        return { probability: parseFloat(prices[0]), title: market.question || market.title || slug, platform: "Polymarket" };
      }
    } catch { /* next */ }
  }
  return null;
}

async function fetchManifold(slug: string) {
  try {
    const r = await fetch(`https://api.manifold.markets/v0/slug/${slug}`);
    if (!r.ok) return null;
    const d = await r.json();
    return { probability: d.probability ?? null, title: d.question || d.title || slug, platform: "Manifold" };
  } catch { return null; }
}

async function fetchMetaculus(qid: string) {
  try {
    const r = await fetch(`https://www.metaculus.com/api/posts/${qid}/`, { headers: { Accept: "application/json" } });
    if (r.ok) {
      const d = await r.json();
      const f = d?.question?.aggregations?.recency_weighted?.latest;
      const prob = f?.centers?.[0] ?? f?.means?.[0] ?? null;
      return { probability: prob, title: d.title || `Question ${qid}`, platform: "Metaculus" };
    }
  } catch { /* fallback */ }
  try {
    const r = await fetch(`https://www.metaculus.com/api2/questions/${qid}/`);
    if (r.ok) {
      const d = await r.json();
      const prob = d?.community_prediction?.full?.q2 ?? null;
      return { probability: prob, title: d.title || `Question ${qid}`, platform: "Metaculus" };
    }
  } catch { /* */ }
  return null;
}

async function fetchKalshi(ticker: string) {
  const variants = [ticker.toUpperCase().replace(/-/g, ""), ticker.toUpperCase(), ticker, ticker.toLowerCase()];
  const bases = ["https://api.elections.kalshi.com/trade-api/v2/markets", "https://trading-api.kalshi.com/trade-api/v2/markets"];
  for (const base of bases) {
    for (const v of variants) {
      try {
        const r = await fetch(`${base}/${v}`, { headers: { Accept: "application/json" } });
        if (!r.ok) continue;
        const body = await r.json();
        const m = body.market || body;
        const price = m.yes_price ?? m.last_price ?? m.yes_bid ?? null;
        if (price != null) {
          return { probability: price > 1 ? price / 100 : price, title: m.title || m.subtitle || ticker, platform: "Kalshi" };
        }
      } catch { /* */ }
    }
  }
  return null;
}

async function fetchPredictIt(marketId: string) {
  try {
    const r = await fetch(`https://www.predictit.org/api/marketdata/markets/${marketId}`);
    if (!r.ok) return null;
    const d = await r.json();
    const c = d.contracts?.[0];
    return { probability: c?.lastTradePrice ?? c?.bestBuyYesCost ?? null, title: d.name || `Market ${marketId}`, platform: "PredictIt" };
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const trimmed = url.trim().replace(/\/+$/, "");
    const platform = detectPlatform(trimmed);
    if (platform === "Unknown") {
      return new Response(JSON.stringify({ error: "Unsupported platform. Supported: Polymarket, Metaculus, Manifold, Kalshi, PredictIt." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const slug = extractSlug(trimmed, platform);
    if (!slug) {
      return new Response(JSON.stringify({ error: `Could not parse ${platform} URL.` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[scrape] ${platform} → slug:`, JSON.stringify(slug));

    const result =
      platform === "Polymarket" ? await fetchPolymarket(slug)
      : platform === "Metaculus" ? await fetchMetaculus(slug)
      : platform === "Manifold" ? await fetchManifold(slug)
      : platform === "Kalshi" ? await fetchKalshi(slug)
      : platform === "PredictIt" ? await fetchPredictIt(slug)
      : null;

    if (!result || result.probability == null) {
      return new Response(JSON.stringify({ error: `Could not extract probability from ${platform}. The market may be closed.`, platform }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
