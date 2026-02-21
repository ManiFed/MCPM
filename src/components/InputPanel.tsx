import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, Play, Loader2 } from "lucide-react";
import type { SimulationParams, RiskTolerance, MarketInfo } from "@/types/simulation";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InputPanelProps {
  onRunSimulation: (params: SimulationParams) => void;
  isRunning: boolean;
}

const LEVERAGE_PRESETS = [2, 3, 5, 10];

export function InputPanel({ onRunSimulation, isRunning }: InputPanelProps) {
  const [marketUrl, setMarketUrl] = useState("");
  const [probability, setProbability] = useState(50);
  const [leverage, setLeverage] = useState(2);
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>("moderate");
  const [numSimulations, setNumSimulations] = useState(10000);
  const [bankroll, setBankroll] = useState(10000);
  const [numBets, setNumBets] = useState(100);
  const [marketInfo, setMarketInfo] = useState<MarketInfo | null>(null);
  const [isScraping, setIsScraping] = useState(false);

  const handleScrapeUrl = async () => {
    if (!marketUrl.trim()) return;
    setIsScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("firecrawl-scrape", {
        body: { url: marketUrl.trim() },
      });
      if (error) throw error;
      if (data?.probability != null) {
        setProbability(Math.round(data.probability * 100));
        setMarketInfo({
          title: data.title || "Unknown Market",
          probability: data.probability,
          platform: data.platform || "Unknown",
          url: marketUrl.trim(),
        });
        toast.success(`Extracted ${Math.round(data.probability * 100)}% from ${data.platform || "market"}`);
      } else {
        toast.error("Could not extract probability from that URL");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to scrape URL");
    } finally {
      setIsScraping(false);
    }
  };

  const handleRun = () => {
    onRunSimulation({
      probability: probability / 100,
      leverage,
      riskTolerance,
      numSimulations,
      bankroll,
      numBets,
      marketTitle: marketInfo?.title,
      marketUrl: marketInfo?.url,
      marketPlatform: marketInfo?.platform,
    });
  };

  const riskToleranceFromSlider = (val: number): RiskTolerance => {
    if (val <= 33) return "conservative";
    if (val <= 66) return "moderate";
    return "aggressive";
  };

  const riskSliderValue = riskTolerance === "conservative" ? 15 : riskTolerance === "moderate" ? 50 : 85;

  const riskLabel = riskTolerance === "conservative" ? "Conservative (5%)" : riskTolerance === "moderate" ? "Moderate (15%)" : "Aggressive (30%)";

  return (
    <div className="space-y-4">
      {/* Market Input */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
            Market Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Paste Polymarket / Metaculus / Manifold / Kalshi URL..."
              value={marketUrl}
              onChange={(e) => setMarketUrl(e.target.value)}
              className="font-mono text-xs bg-background/50"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleScrapeUrl}
              disabled={isScraping || !marketUrl.trim()}
              className="shrink-0"
            >
              {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            </Button>
          </div>

          {marketInfo && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-mono text-primary">{marketInfo.platform}</p>
              <p className="text-sm mt-1 text-card-foreground">{marketInfo.title}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-mono text-muted-foreground">PROBABILITY</Label>
              <span className="font-mono text-lg font-bold text-primary">{probability}%</span>
            </div>
            <Slider
              value={[probability]}
              onValueChange={([v]) => setProbability(v)}
              min={1}
              max={99}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Simulation Parameters */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
            Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Leverage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-mono text-muted-foreground">LEVERAGE</Label>
              <span className="font-mono text-lg font-bold text-accent">{leverage}x</span>
            </div>
            <Slider
              value={[leverage]}
              onValueChange={([v]) => setLeverage(v)}
              min={1}
              max={10}
              step={0.5}
            />
            <div className="flex gap-1.5 mt-2">
              {LEVERAGE_PRESETS.map((l) => (
                <Button
                  key={l}
                  size="sm"
                  variant={leverage === l ? "default" : "outline"}
                  className="flex-1 h-7 text-xs font-mono"
                  onClick={() => setLeverage(l)}
                >
                  {l}x
                </Button>
              ))}
            </div>
          </div>

          {/* Risk Tolerance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-mono text-muted-foreground">RISK TOLERANCE</Label>
              <span className="font-mono text-sm font-bold text-accent">{riskLabel}</span>
            </div>
            <Slider
              value={[riskSliderValue]}
              onValueChange={([v]) => setRiskTolerance(riskToleranceFromSlider(v))}
              min={0}
              max={100}
              step={1}
            />
          </div>

          {/* Simulations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-mono text-muted-foreground">SIMULATIONS</Label>
              <span className="font-mono text-lg font-bold text-accent">{numSimulations >= 1000 ? `${numSimulations / 1000}K` : numSimulations}</span>
            </div>
            <Slider
              value={[numSimulations]}
              onValueChange={([v]) => setNumSimulations(v)}
              min={1000}
              max={50000}
              step={1000}
            />
          </div>

          {/* Bankroll & Bets */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-mono text-muted-foreground">BANKROLL ($)</Label>
              <Input
                type="number"
                value={bankroll}
                onChange={(e) => setBankroll(Number(e.target.value))}
                className="mt-1.5 font-mono text-sm bg-background/50"
                min={100}
              />
            </div>
            <div>
              <Label className="text-xs font-mono text-muted-foreground">BETS / RUN</Label>
              <Input
                type="number"
                value={numBets}
                onChange={(e) => setNumBets(Number(e.target.value))}
                className="mt-1.5 font-mono text-sm bg-background/50"
                min={10}
                max={1000}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Run Button */}
      <Button
        onClick={handleRun}
        disabled={isRunning}
        className="w-full h-12 font-mono text-sm uppercase tracking-widest glow-green"
        size="lg"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Simulating...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Run Simulation
          </>
        )}
      </Button>
    </div>
  );
}
