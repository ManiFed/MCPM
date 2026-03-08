export interface MarketScrapeResult {
  probability: number;
  title: string;
  platform: string;
}

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

async function fetchPolymarket(slugInfo: any): Promise<MarketScrapeResult | null> {
  if (!slugInfo) return null;
  const slug = typeof slugInfo === "string" ? slugInfo : slugInfo.slug;

  // Try market slug
  try {
    const r = await fetch(`https://gamma-api.polymarket.com/markets/slug/${slug}`);
    if (r.ok) {
      const d = await r.json();
      if (d?.outcomePrices) {
        const prices = JSON.parse(d.outcomePrices);
        return { probability: parseFloat(prices[0]), title: d.question || d.title || slug, platform: "Polymarket" };
      }
    }
  } catch {}

  // Try event slug
  try {
    const r = await fetch(`https://gamma-api.polymarket.com/events/slug/${slug}`);
    if (r.ok) {
      const ev = await r.json();
      const m = ev?.markets?.[0];
      if (m?.outcomePrices) {
        const prices = JSON.parse(m.outcomePrices);
        return { probability: parseFloat(prices[0]), title: m.question || ev.title || slug, platform: "Polymarket" };
      }
    }
  } catch {}

  // Search fallback
  try {
    const r = await fetch(`https://gamma-api.polymarket.com/markets?slug_like=${slug}&limit=1`);
    if (r.ok) {
      const results = await r.json();
      const m = results?.[0];
      if (m?.outcomePrices) {
        const prices = JSON.parse(m.outcomePrices);
        return { probability: parseFloat(prices[0]), title: m.question || m.title || slug, platform: "Polymarket" };
      }
    }
  } catch {}

  return null;
}

async function fetchManifold(slug: string): Promise<MarketScrapeResult | null> {
  try {
    const r = await fetch(`https://api.manifold.markets/v0/slug/${slug}`);
    if (!r.ok) return null;
    const d = await r.json();
    return { probability: d.probability ?? null, title: d.question || d.title || slug, platform: "Manifold" };
  } catch {
    return null;
  }
}

async function fetchMetaculus(questionId: string): Promise<MarketScrapeResult | null> {
  try {
    const r = await fetch(`https://www.metaculus.com/api/posts/${questionId}/`, { headers: { Accept: "application/json" } });
    if (r.ok) {
      const d = await r.json();
      const forecast = d?.question?.aggregations?.recency_weighted?.latest;
      const prob = forecast?.centers?.[0] ?? forecast?.means?.[0] ?? null;
      return { probability: prob, title: d.title || d?.question?.title || `Question ${questionId}`, platform: "Metaculus" };
    }
  } catch {}
  try {
    const r = await fetch(`https://www.metaculus.com/api2/questions/${questionId}/`);
    if (r.ok) {
      const d = await r.json();
      const prob = d?.community_prediction?.full?.q2 ?? d?.prediction_timeseries?.[d.prediction_timeseries.length - 1]?.community_prediction;
      return { probability: prob ?? null, title: d.title || d.title_short || `Question ${questionId}`, platform: "Metaculus" };
    }
  } catch {}
  return null;
}

async function fetchKalshi(ticker: string): Promise<MarketScrapeResult | null> {
  const variants = [ticker.toUpperCase().replace(/-/g, ""), ticker.toUpperCase(), ticker, ticker.toLowerCase()];
  const bases = [
    "https://api.elections.kalshi.com/trade-api/v2/markets",
    "https://trading-api.kalshi.com/trade-api/v2/markets",
  ];
  for (const base of bases) {
    for (const variant of variants) {
      try {
        const r = await fetch(`${base}/${variant}`, { headers: { Accept: "application/json" } });
        if (!r.ok) continue;
        const body = await r.json();
        const market = body.market || body;
        if (market?.yes_price || market?.last_price || market?.yes_bid) {
          const price = market.yes_price ?? market.last_price ?? market.yes_bid ?? null;
          return {
            probability: price != null ? (price > 1 ? price / 100 : price) : null,
            title: market.title || market.subtitle || ticker,
            platform: "Kalshi",
          };
        }
      } catch {}
    }
  }
  return null;
}

async function fetchPredictIt(marketId: string): Promise<MarketScrapeResult | null> {
  try {
    const r = await fetch(`https://www.predictit.org/api/marketdata/markets/${marketId}`);
    if (!r.ok) return null;
    const d = await r.json();
    const contract = d.contracts?.[0];
    return {
      probability: contract?.lastTradePrice ?? contract?.bestBuyYesCost ?? null,
      title: d.name || d.shortName || `Market ${marketId}`,
      platform: "PredictIt",
    };
  } catch {
    return null;
  }
}

export async function scrapeMarketUrl(url: string): Promise<MarketScrapeResult> {
  const trimmed = url.trim().replace(/\/+$/, "");
  const platform = detectPlatform(trimmed);
  if (platform === "Unknown") {
    throw new Error("Unsupported platform. Supported: Polymarket, Metaculus, Manifold, Kalshi, PredictIt.");
  }

  const slug = extractSlug(trimmed, platform);
  if (!slug) {
    throw new Error(`Could not parse ${platform} URL. Try pasting the full market page URL.`);
  }

  const result =
    platform === "Polymarket" ? await fetchPolymarket(slug)
    : platform === "Metaculus" ? await fetchMetaculus(slug)
    : platform === "Manifold" ? await fetchManifold(slug)
    : platform === "Kalshi" ? await fetchKalshi(slug)
    : platform === "PredictIt" ? await fetchPredictIt(slug)
    : null;

  if (!result || result.probability == null) {
    throw new Error(`Could not extract probability from ${platform}. The market may be closed or the API format may have changed.`);
  }
  return result;
}
