export function jsonResponse(status, payload) {
  return { status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
}

function detectPlatform(url) {
  if (url.includes("polymarket.com")) return "Polymarket";
  if (url.includes("metaculus.com")) return "Metaculus";
  if (url.includes("manifold.markets")) return "Manifold";
  if (url.includes("kalshi.com")) return "Kalshi";
  return "Unknown";
}

function extractSlug(url, platform) {
  switch (platform) {
    case "Polymarket": return url.match(/polymarket\.com\/event\/([^/?#]+)(?:\/([^/?#]+))?/)?.[2] ?? url.match(/polymarket\.com\/event\/([^/?#]+)/)?.[1] ?? null;
    case "Metaculus": return url.match(/metaculus\.com\/questions\/(\d+)/)?.[1] ?? null;
    case "Manifold": return url.match(/manifold\.markets\/([^/]+)\/([^/?#]+)/)?.[2] ?? null;
    case "Kalshi": return url.match(/kalshi\.com\/markets\/(?:[^/]+\/)?([^/?#]+)/)?.[1] ?? null;
    default: return null;
  }
}

async function fetchPolymarket(slug) { /* same */
  const marketResp = await fetch(`https://gamma-api.polymarket.com/markets/slug/${slug}`);
  if (marketResp.ok) {
    const data = await marketResp.json();
    if (data?.outcomePrices) {
      const prices = JSON.parse(data.outcomePrices);
      return { probability: parseFloat(prices[0]), title: data.question || data.title || slug, platform: "Polymarket" };
    }
  }
  const eventResp = await fetch(`https://gamma-api.polymarket.com/events/slug/${slug}`);
  if (eventResp.ok) {
    const event = await eventResp.json();
    const market = event?.markets?.[0];
    if (market?.outcomePrices) {
      const prices = JSON.parse(market.outcomePrices);
      return { probability: parseFloat(prices[0]), title: market.question || event.title || slug, platform: "Polymarket" };
    }
  }
  return null;
}
async function fetchMetaculus(questionId) {
  const resp = await fetch(`https://www.metaculus.com/api/posts/${questionId}/`, { headers: { Accept: "application/json" } });
  if (!resp.ok) {
    const legacyResp = await fetch(`https://www.metaculus.com/api2/questions/${questionId}/`);
    if (!legacyResp.ok) return null;
    const data = await legacyResp.json();
    const prob = data?.community_prediction?.full?.q2 ?? data?.prediction_timeseries?.[data.prediction_timeseries.length - 1]?.community_prediction;
    return { probability: prob ?? null, title: data.title || data.title_short || `Question ${questionId}`, platform: "Metaculus" };
  }
  const data = await resp.json();
  const forecast = data?.question?.aggregations?.recency_weighted?.latest;
  const prob = forecast?.centers?.[0] ?? forecast?.means?.[0] ?? null;
  return { probability: prob, title: data.title || data?.question?.title || `Question ${questionId}`, platform: "Metaculus" };
}
async function fetchManifold(slug) {
  const resp = await fetch(`https://api.manifold.markets/v0/slug/${slug}`); if (!resp.ok) return null;
  const data = await resp.json(); return { probability: data.probability ?? null, title: data.question || data.title || slug, platform: "Manifold" };
}
async function fetchKalshi(ticker) {
  const upper = ticker.toUpperCase().replace(/-/g, "");
  for (const apiUrl of [`https://api.elections.kalshi.com/trade-api/v2/markets/${upper}`,`https://api.elections.kalshi.com/trade-api/v2/markets/${ticker}`,`https://trading-api.kalshi.com/trade-api/v2/markets/${upper}`,`https://trading-api.kalshi.com/trade-api/v2/markets/${ticker}`]) {
    try {
      const resp = await fetch(apiUrl, { headers: { Accept: "application/json" } });
      if (!resp.ok) continue;
      const market = (await resp.json()).market;
      if (market) return { probability: (market.yes_price ?? market.last_price ?? null) / 100, title: market.title || market.subtitle || ticker, platform: "Kalshi" };
    } catch {}
  }
  return null;
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
