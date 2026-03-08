export function jsonResponse(status, payload) {
  return { status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
}

function detectPlatform(url) {
  if (url.includes("polymarket.com")) return "Polymarket";
  if (url.includes("metaculus.com")) return "Metaculus";
  if (url.includes("manifold.markets")) return "Manifold";
  if (url.includes("kalshi.com")) return "Kalshi";
  if (url.includes("predictit.org")) return "PredictIt";
  return "Unknown";
}

function extractSlug(url, platform) {
  // Clean URL: remove trailing slashes, query strings for matching
  const cleanUrl = url.split("?")[0].replace(/\/+$/, "");

  switch (platform) {
    case "Polymarket": {
      // /event/slug/sub-slug OR /event/slug
      const eventMatch = cleanUrl.match(/polymarket\.com\/event\/([^/?#]+)(?:\/([^/?#]+))?/);
      if (eventMatch) return { type: "event", slug: eventMatch[2] || eventMatch[1] };
      // /markets/slug (newer format) or /market/slug
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
      // /markets/category/TICKER or /markets/TICKER or /events/category/TICKER
      const parts = cleanUrl.match(/kalshi\.com\/(?:markets|events)\/(?:([^/]+)\/)?([^/?#]+)/);
      if (parts) return parts[2] || parts[1];
      return null;
    }
    case "PredictIt": {
      const m = cleanUrl.match(/predictit\.org\/markets\/detail\/(\d+)/);
      return m ? m[1] : null;
    }
    default: return null;
  }
}

async function fetchPolymarket(slugInfo) {
  if (!slugInfo) return null;
  const slug = typeof slugInfo === "string" ? slugInfo : slugInfo.slug;

  // Try as market slug first
  try {
    const marketResp = await fetch(`https://gamma-api.polymarket.com/markets/slug/${slug}`);
    if (marketResp.ok) {
      const data = await marketResp.json();
      if (data?.outcomePrices) {
        const prices = JSON.parse(data.outcomePrices);
        return { probability: parseFloat(prices[0]), title: data.question || data.title || slug, platform: "Polymarket" };
      }
    }
  } catch {}

  // Try as event slug
  try {
    const eventResp = await fetch(`https://gamma-api.polymarket.com/events/slug/${slug}`);
    if (eventResp.ok) {
      const event = await eventResp.json();
      const market = event?.markets?.[0];
      if (market?.outcomePrices) {
        const prices = JSON.parse(market.outcomePrices);
        return { probability: parseFloat(prices[0]), title: market.question || event.title || slug, platform: "Polymarket" };
      }
    }
  } catch {}

  // Try search as fallback
  try {
    const searchResp = await fetch(`https://gamma-api.polymarket.com/markets?slug_like=${slug}&limit=1`);
    if (searchResp.ok) {
      const results = await searchResp.json();
      const market = results?.[0];
      if (market?.outcomePrices) {
        const prices = JSON.parse(market.outcomePrices);
        return { probability: parseFloat(prices[0]), title: market.question || market.title || slug, platform: "Polymarket" };
      }
    }
  } catch {}

  return null;
}
async function fetchMetaculus(questionId) {
  try {
    const resp = await fetch(`https://www.metaculus.com/api/posts/${questionId}/`, { headers: { Accept: "application/json" } });
    if (resp.ok) {
      const data = await resp.json();
      const forecast = data?.question?.aggregations?.recency_weighted?.latest;
      const prob = forecast?.centers?.[0] ?? forecast?.means?.[0] ?? null;
      return { probability: prob, title: data.title || data?.question?.title || `Question ${questionId}`, platform: "Metaculus" };
    }
  } catch {}
  try {
    const legacyResp = await fetch(`https://www.metaculus.com/api2/questions/${questionId}/`);
    if (legacyResp.ok) {
      const data = await legacyResp.json();
      const prob = data?.community_prediction?.full?.q2 ?? data?.prediction_timeseries?.[data.prediction_timeseries.length - 1]?.community_prediction;
      return { probability: prob ?? null, title: data.title || data.title_short || `Question ${questionId}`, platform: "Metaculus" };
    }
  } catch {}
  return null;
}
async function fetchManifold(slug) {
  try {
    const resp = await fetch(`https://api.manifold.markets/v0/slug/${slug}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return { probability: data.probability ?? null, title: data.question || data.title || slug, platform: "Manifold" };
  } catch { return null; }
}
async function fetchKalshi(ticker) {
  // Try multiple ticker formats
  const variants = [
    ticker.toUpperCase().replace(/-/g, ""),
    ticker.toUpperCase(),
    ticker,
    ticker.toLowerCase(),
  ];
  const bases = [
    "https://api.elections.kalshi.com/trade-api/v2/markets",
    "https://trading-api.kalshi.com/trade-api/v2/markets",
  ];
  for (const base of bases) {
    for (const variant of variants) {
      try {
        const resp = await fetch(`${base}/${variant}`, { headers: { Accept: "application/json" } });
        if (!resp.ok) continue;
        const body = await resp.json();
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
async function fetchPredictIt(marketId) {
  try {
    const resp = await fetch(`https://www.predictit.org/api/marketdata/markets/${marketId}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const contract = data.contracts?.[0];
    return {
      probability: contract?.lastTradePrice ?? contract?.bestBuyYesCost ?? null,
      title: data.name || data.shortName || `Market ${marketId}`,
      platform: "PredictIt",
    };
  } catch { return null; }
}

export async function firecrawlScrape(body) {
  const { url } = body ?? {};
  if (!url || typeof url !== "string") return jsonResponse(400, { error: "URL is required" });
  const platform = detectPlatform(url);
  const slug = extractSlug(url, platform);
  if (!slug) return jsonResponse(400, { error: "Could not extract identifier from URL. Supported: Polymarket, Metaculus, Manifold, Kalshi." });
  const result = platform === "Polymarket" ? await fetchPolymarket(slug)
    : platform === "Metaculus" ? await fetchMetaculus(slug)
    : platform === "Manifold" ? await fetchManifold(slug)
    : platform === "Kalshi" ? await fetchKalshi(slug)
    : null;
  if (!result || result.probability == null) return jsonResponse(422, { error: `Could not extract probability from ${platform} API`, platform });
  return jsonResponse(200, result);
}

function formatAiPrompt(params, stats) {
  const systemPrompt = `You are a quantitative finance analyst and prediction market expert specializing in leveraged trading.\nYou will receive simulation parameters, Monte Carlo results, and information about a specific prediction market.\n\nYour task: Write a concise bull case and bear case for taking this position. IMPORTANTLY, you should discuss the ACTUAL MARKET itself — what the question is about, why the current probability may be mispriced, what real-world factors could move it, and whether the bet makes fundamental sense — not just comment on the simulation numbers.\n\nFORMAT YOUR RESPONSE EXACTLY AS:\n---BULL---\n[Your bull case argument here - 3-5 paragraphs.]\n---BEAR---\n[Your bear case argument here - 3-5 paragraphs.]`;
  const marketSection = params.marketTitle
    ? `Market: "${params.marketTitle}"${params.marketPlatform ? ` (${params.marketPlatform})` : ""}${params.marketUrl ? `\nURL: ${params.marketUrl}` : ""}`
    : "Market: Custom probability input (no specific market — focus on the simulation numbers)";
  const userMessage = `${marketSection}\n- Base Probability: ${(params.probability * 100).toFixed(1)}%\n- Leverage: ${params.leverage}x\n- Position Size: ${(params.positionSize * 100).toFixed(1)}%\n- Bankroll: $${params.bankroll.toLocaleString()}\n\nMonte Carlo Results:\n- Expected Value: $${stats.expectedValue.toFixed(0)}\n- Median Outcome: $${stats.medianOutcome.toFixed(0)}\n- Probability of Ruin: ${(stats.probabilityOfRuin * 100).toFixed(1)}%\n- Max Drawdown: ${(stats.maxDrawdown * 100).toFixed(1)}%\n- Sharpe Ratio: ${stats.sharpeRatio.toFixed(2)}\n- Percentiles: ${JSON.stringify(stats.percentiles)}`;
  return { systemPrompt, userMessage };
}

export async function aiAnalysis(body) {
  const { params, stats } = body ?? {};
  if (!params || !stats) return jsonResponse(400, { error: "params and stats are required" });
  const key = process.env.AI_GATEWAY_API_KEY;
  if (!key) return jsonResponse(500, { error: "AI_GATEWAY_API_KEY is not configured" });
  const { systemPrompt, userMessage } = formatAiPrompt(params, stats);
  const upstream = await fetch(process.env.AI_GATEWAY_URL ?? "https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }], stream: true }),
  });
  if (!upstream.ok) {
    if (upstream.status === 429) return jsonResponse(429, { error: "Rate limit exceeded" });
    if (upstream.status === 402) return jsonResponse(402, { error: "Payment required" });
    return jsonResponse(502, { error: "AI gateway error" });
  }
  return { status: 200, headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" }, stream: upstream.body };
}
