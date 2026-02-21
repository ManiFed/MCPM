import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { params, stats } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a quantitative finance analyst and prediction market expert specializing in leveraged trading.
You will receive simulation parameters, Monte Carlo results, and information about a specific prediction market.

Your task: Write a concise bull case and bear case for taking this position. IMPORTANTLY, you should discuss the ACTUAL MARKET itself — what the question is about, why the current probability may be mispriced, what real-world factors could move it, and whether the bet makes fundamental sense — not just comment on the simulation numbers.

FORMAT YOUR RESPONSE EXACTLY AS:
---BULL---
[Your bull case argument here - 3-5 paragraphs. Start by discussing the market question itself and why YES might be underpriced, then tie in the simulation data.]
---BEAR---
[Your bear case argument here - 3-5 paragraphs. Start by discussing real-world risks to the position and why the current price might be fair or overpriced, then tie in the simulation data.]

Consider:
- The actual market question and what would need to happen for YES/NO to resolve
- Whether the current probability seems well-calibrated or mispriced, and why
- Real-world events, timelines, and catalysts that could move the market
- Expected value vs median outcome (skew) from the simulation
- Probability of ruin and max drawdown severity
- Risk-adjusted returns (Sharpe) and position sizing implications
- Liquidity, market manipulation, and platform-specific risks that Monte Carlo cannot capture`;

    const marketSection = params.marketTitle
      ? `Market: "${params.marketTitle}"${params.marketPlatform ? ` (${params.marketPlatform})` : ""}${params.marketUrl ? `\nURL: ${params.marketUrl}` : ""}`
      : "Market: Custom probability input (no specific market — focus on the simulation numbers)";

    const userMessage = `${marketSection}
- Base Probability: ${(params.probability * 100).toFixed(1)}%
- Leverage: ${params.leverage}x
- Risk Tolerance: ${params.riskTolerance}
- Bankroll: $${params.bankroll.toLocaleString()}

Monte Carlo Results:
- Expected Value: $${stats.expectedValue.toFixed(0)}
- Median Outcome: $${stats.medianOutcome.toFixed(0)}
- Probability of Ruin: ${(stats.probabilityOfRuin * 100).toFixed(1)}%
- Max Drawdown: ${(stats.maxDrawdown * 100).toFixed(1)}%
- Sharpe Ratio: ${stats.sharpeRatio.toFixed(2)}
- Percentiles: ${JSON.stringify(stats.percentiles)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
