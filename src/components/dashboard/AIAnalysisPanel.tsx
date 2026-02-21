import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import type { SimulationParams, SimulationResult } from "@/types/simulation";
import { toast } from "sonner";

interface AIAnalysisPanelProps {
  params: SimulationParams;
  result: SimulationResult;
}

export function AIAnalysisPanel({ params, result }: AIAnalysisPanelProps) {
  const [bullCase, setBullCase] = useState("");
  const [bearCase, setBearCase] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setBullCase("");
    setBearCase("");

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-analysis`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          params: {
            probability: params.probability,
            leverage: params.leverage,
            positionSize: params.positionSize,
            bankroll: params.bankroll,
            marketTitle: params.marketTitle,
            marketUrl: params.marketUrl,
            marketPlatform: params.marketPlatform,
          },
          stats: {
            expectedValue: result.expectedValue,
            medianOutcome: result.medianOutcome,
            probabilityOfRuin: result.probabilityOfRuin,
            maxDrawdown: result.maxDrawdown,
            sharpeRatio: result.sharpeRatio,
            percentiles: result.percentiles,
          },
        }),
      });

      if (resp.status === 429) {
        toast.error("Rate limit exceeded — please try again in a moment.");
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits depleted — please add funds.");
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Failed to get AI analysis");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              // Split into bull/bear sections
              const parts = fullText.split(/---BEAR---/i);
              const bullPart = (parts[0] || "").replace(/---BULL---/i, "").trim();
              const bearPart = (parts[1] || "").trim();
              setBullCase(bullPart);
              setBearCase(bearPart);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast.error(e.message || "AI analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const hasAnalysis = bullCase || bearCase;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Bot className="h-3.5 w-3.5" />
            AI Position Analysis
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="h-7 text-xs font-mono"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Get AI Analysis"
            )}
          </Button>
        </div>
      </CardHeader>
      {hasAnalysis && (
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Bull Case */}
            <div className="rounded-md border border-profit/20 bg-profit/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-profit" />
                <span className="font-mono text-xs font-bold text-profit uppercase">Bull Case</span>
              </div>
              <div className="text-xs text-card-foreground leading-relaxed whitespace-pre-wrap">
                {bullCase || <span className="text-muted-foreground italic">Generating...</span>}
              </div>
            </div>
            {/* Bear Case */}
            <div className="rounded-md border border-loss/20 bg-loss/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-loss" />
                <span className="font-mono text-xs font-bold text-loss uppercase">Bear Case</span>
              </div>
              <div className="text-xs text-card-foreground leading-relaxed whitespace-pre-wrap">
                {bearCase || <span className="text-muted-foreground italic">Generating...</span>}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
