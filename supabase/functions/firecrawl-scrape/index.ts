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
  return "Unknown";
}

function extractPolymarketProbability(html: string): { probability: number | null; title: string } {
  // Polymarket often has JSON-LD or meta tags with probability data
  let title = "";
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) title = titleMatch[1].replace(/ \| Polymarket.*$/, "").trim();

  // Look for probability in various patterns
  // Pattern: "probability":0.XX or outcome price data
  const probPatterns = [
    /"probability"\s*:\s*(0?\.\d+)/,
    /"outcomePrices"\s*:\s*\[\s*"(0?\.\d+)"/,
    /"price"\s*:\s*(0?\.\d+)/,
    /data-probability="(0?\.\d+)"/,
    /"yes"\s*:\s*(0?\.\d+)/i,
  ];

  for (const pattern of probPatterns) {
    const match = html.match(pattern);
    if (match) {
      const prob = parseFloat(match[1]);
      if (prob > 0 && prob < 1) return { probability: prob, title };
    }
  }

  // Try to find percentage text like "65%" near key words
  const pctMatch = html.match(/(\d{1,2})%\s*(?:chance|probability|yes)/i);
  if (pctMatch) {
    return { probability: parseInt(pctMatch[1]) / 100, title };
  }

  return { probability: null, title };
}

function extractMetaculusProbability(html: string): { probability: number | null; title: string } {
  let title = "";
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) title = titleMatch[1].replace(/ - Metaculus.*$/, "").trim();

  const patterns = [
    /"community_prediction"\s*:\s*(0?\.\d+)/,
    /"q2"\s*:\s*(0?\.\d+)/,
    /"median"\s*:\s*(0?\.\d+)/,
    /(\d{1,2})%\s*community/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const val = parseFloat(match[1]);
      return { probability: val > 1 ? val / 100 : val, title };
    }
  }

  return { probability: null, title };
}

function extractManifoldProbability(html: string): { probability: number | null; title: string } {
  let title = "";
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) title = titleMatch[1].replace(/ - Manifold.*$/, "").trim();

  const patterns = [
    /"probability"\s*:\s*(0?\.\d+)/,
    /"prob"\s*:\s*(0?\.\d+)/,
    /(\d{1,2})%\s*chance/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const val = parseFloat(match[1]);
      return { probability: val > 1 ? val / 100 : val, title };
    }
  }

  return { probability: null, title };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    const platform = detectPlatform(url);

    // For Manifold, try the API first
    if (platform === "Manifold") {
      const slugMatch = url.match(/manifold\.markets\/([^/]+)\/([^/?#]+)/);
      if (slugMatch) {
        try {
          const apiResp = await fetch(`https://api.manifold.markets/v0/slug/${slugMatch[2]}`);
          if (apiResp.ok) {
            const data = await apiResp.json();
            return new Response(
              JSON.stringify({
                probability: data.probability,
                title: data.question || data.title || slugMatch[2],
                platform,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch { /* fall through to HTML scraping */ }
      }
    }

    // Fetch the page HTML
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LeverageSim/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!resp.ok) throw new Error(`Failed to fetch URL: ${resp.status}`);
    const html = await resp.text();

    let result: { probability: number | null; title: string };

    switch (platform) {
      case "Polymarket":
        result = extractPolymarketProbability(html);
        break;
      case "Metaculus":
        result = extractMetaculusProbability(html);
        break;
      case "Manifold":
        result = extractManifoldProbability(html);
        break;
      default:
        // Generic extraction
        result = { probability: null, title: "" };
        const titleM = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleM) result.title = titleM[1].trim();
        // Look for any probability-like pattern
        const genericMatch = html.match(/"probability"\s*:\s*(0?\.\d+)/);
        if (genericMatch) result.probability = parseFloat(genericMatch[1]);
    }

    return new Response(
      JSON.stringify({ ...result, platform }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("firecrawl-scrape error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
