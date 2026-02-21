import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, Zap, Shield, Flame, Play, Loader2 } from "lucide-react";
import type { SimulationParams, RiskTolerance, MarketInfo } from "@/types/simulation";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InputPanelProps {
  onRunSimulation: (params: SimulationParams) => void;
  isRunning: boolean;
}

const LEVERAGE_PRESETS = [2, 3, 5, 10];
const SIM_PRESETS = [1000, 10000, 50000];

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
    });
  };

  const riskOptions: { key: RiskTolerance; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: "conservative", label: "Conservative", icon: <Shield className="h-3.5 w-3.5" />, desc: "5% per bet" },
    { key: "moderate", label: "Moderate", icon: <Zap className="h-3.5 w-3.5" />, desc: "15% per bet" },
    { key: "aggressive", label: "Aggressive", icon: <Flame className="h-3.5 w-3.5" />, desc: "30% per bet" },
  ];

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
              placeholder="Paste Polymarket / Metaculus / Manifold URL..."
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
            <Label className="text-xs font-mono text-muted-foreground">RISK TOLERANCE</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {riskOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setRiskTolerance(opt.key)}
                  className={`flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors ${
                    riskTolerance === opt.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background/50 text-muted-foreground hover:border-muted-foreground/50"
                  }`}
                >
                  {opt.icon}
                  <span className="font-mono font-medium">{opt.label}</span>
                  <span className="text-[10px] opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Simulations */}
          <div>
            <Label className="text-xs font-mono text-muted-foreground">SIMULATIONS</Label>
            <div className="flex gap-1.5 mt-2">
              {SIM_PRESETS.map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={numSimulations === n ? "default" : "outline"}
                  className="flex-1 h-8 text-xs font-mono"
                  onClick={() => setNumSimulations(n)}
                >
                  {n >= 1000 ? `${n / 1000}K` : n}
                </Button>
              ))}
            </div>
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
