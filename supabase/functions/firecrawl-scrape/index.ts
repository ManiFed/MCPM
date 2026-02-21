import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function detectPlatform(url: string): string {
  if (url.includes("polymarket.com")) return "Polymarket";
  if (url.includes("metaculus.com")) return "Metaculus";
  if (url.includes("manifold.markets")) return "Manifold";
  if (url.includes("kalshi.com")) return "Kalshi";
  return "Unknown";
}

function extractSlug(url: string, platform: string): string | null {
  switch (platform) {
    case "Polymarket": {
      const match = url.match(/polymarket\.com\/event\/([^/?#]+)(?:\/([^/?#]+))?/);
      return match ? (match[2] || match[1]) : null;
    }
    case "Metaculus": {
      const match = url.match(/metaculus\.com\/questions\/(\d+)/);
      return match ? match[1] : null;
    }
    case "Manifold": {
      const match = url.match(/manifold\.markets\/([^/]+)\/([^/?#]+)/);
      return match ? match[2] : null;
    }
    case "Kalshi": {
      // https://kalshi.com/markets/kx-event/market-ticker or /markets/market-ticker
      const match = url.match(/kalshi\.com\/markets\/(?:[^/]+\/)?([^/?#]+)/);
      return match ? match[1] : null;
    }
    default:
      return null;
  }
}

async function fetchPolymarket(slug: string) {
  // Try fetching as a market slug first
  const marketResp = await fetch(`https://gamma-api.polymarket.com/markets/slug/${slug}`);
  if (marketResp.ok) {
    const data = await marketResp.json();
    if (data && data.outcomePrices) {
      const prices = JSON.parse(data.outcomePrices);
      const yesPrice = parseFloat(prices[0]);
      return {
        probability: yesPrice,
        title: data.question || data.title || slug,
        platform: "Polymarket",
      };
    }
  }

  // Try as event slug — get first market from event
  const eventResp = await fetch(`https://gamma-api.polymarket.com/events/slug/${slug}`);
  if (eventResp.ok) {
    const event = await eventResp.json();
    if (event?.markets?.length > 0) {
      const market = event.markets[0];
      if (market.outcomePrices) {
        const prices = JSON.parse(market.outcomePrices);
        return {
          probability: parseFloat(prices[0]),
          title: market.question || event.title || slug,
          platform: "Polymarket",
        };
      }
    }
  }

  return null;
}

async function fetchMetaculus(questionId: string) {
  const resp = await fetch(`https://www.metaculus.com/api/posts/${questionId}/`, {
    headers: { Accept: "application/json" },
  });
  if (!resp.ok) {
    // Try legacy API
    const legacyResp = await fetch(`https://www.metaculus.com/api2/questions/${questionId}/`);
    if (legacyResp.ok) {
      const data = await legacyResp.json();
      const prob =
        data?.community_prediction?.full?.q2 ??
        data?.prediction_timeseries?.[data.prediction_timeseries.length - 1]
          ?.community_prediction;
      return {
        probability: prob ?? null,
        title: data.title || data.title_short || `Question ${questionId}`,
        platform: "Metaculus",
      };
    }
    return null;
  }

  const data = await resp.json();
  // New API structure
  const question = data?.question;
  const forecast = question?.aggregations?.recency_weighted?.latest;
  const prob = forecast?.centers?.[0] ?? forecast?.means?.[0] ?? null;

  return {
    probability: prob,
    title: data.title || question?.title || `Question ${questionId}`,
    platform: "Metaculus",
  };
}

async function fetchManifold(slug: string) {
  const resp = await fetch(`https://api.manifold.markets/v0/slug/${slug}`);
  if (!resp.ok) return null;
  const data = await resp.json();
  return {
    probability: data.probability ?? null,
    title: data.question || data.title || slug,
    platform: "Manifold",
  };
}

async function fetchKalshi(ticker: string) {
  // Try the ticker directly (uppercase)
  const upperTicker = ticker.toUpperCase().replace(/-/g, "");
  const urls = [
    `https://api.elections.kalshi.com/trade-api/v2/markets/${upperTicker}`,
    `https://api.elections.kalshi.com/trade-api/v2/markets/${ticker}`,
    `https://trading-api.kalshi.com/trade-api/v2/markets/${upperTicker}`,
    `https://trading-api.kalshi.com/trade-api/v2/markets/${ticker}`,
  ];

  for (const apiUrl of urls) {
    try {
      const resp = await fetch(apiUrl, {
        headers: { Accept: "application/json" },
      });
      if (!resp.ok) continue;
      const data = await resp.json();
      const market = data.market;
      if (market) {
        // yes_price is in cents (0-100) on Kalshi
        const yesPrice = market.yes_price ?? market.last_price ?? null;
        const prob = yesPrice != null ? yesPrice / 100 : null;
        return {
          probability: prob,
          title: market.title || market.subtitle || ticker,
          platform: "Kalshi",
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    const platform = detectPlatform(url);
    const slug = extractSlug(url, platform);

    if (!slug) {
      return new Response(
        JSON.stringify({ error: `Could not extract identifier from URL. Supported: Polymarket, Metaculus, Manifold, Kalshi.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    switch (platform) {
      case "Polymarket":
        result = await fetchPolymarket(slug);
        break;
      case "Metaculus":
        result = await fetchMetaculus(slug);
        break;
      case "Manifold":
        result = await fetchManifold(slug);
        break;
      case "Kalshi":
        result = await fetchKalshi(slug);
        break;
      default:
        result = null;
    }

    if (!result || result.probability == null) {
      return new Response(
        JSON.stringify({ error: `Could not extract probability from ${platform} API`, platform }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`${platform} API: "${result.title}" → ${(result.probability * 100).toFixed(1)}%`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("firecrawl-scrape error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
