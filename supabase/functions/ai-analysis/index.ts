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

    const systemPrompt = `You are a quantitative finance analyst specializing in prediction markets and leveraged trading. 
You will receive simulation parameters and Monte Carlo results for a leveraged prediction market position.

Your task: Write a concise bull case and bear case for taking this position.

FORMAT YOUR RESPONSE EXACTLY AS:
---BULL---
[Your bull case argument here - 3-5 paragraphs]
---BEAR---
[Your bear case argument here - 3-5 paragraphs]

Be specific, reference the actual numbers provided, and consider:
- Expected value vs median outcome (skew)
- Probability of ruin
- Max drawdown severity
- Risk-adjusted returns (Sharpe)
- Position sizing implications
- Real-world factors that Monte Carlo may not capture`;

    const userMessage = `Simulation Parameters:
- Market: ${params.marketTitle || "Custom probability input"}
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
