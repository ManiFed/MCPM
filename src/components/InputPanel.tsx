import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, Play, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import type { SimulationParams, MarketInfo, MarketOutcome } from "@/types/simulation";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";
import { KellyIndicator } from "@/components/input/KellyIndicator";
import { OutcomeEditor } from "@/components/input/OutcomeEditor";

interface InputPanelProps {
  onRunSimulation: (params: SimulationParams) => void;
  isRunning: boolean;
  initialParams?: Partial<SimulationParams> | null;
}

export function InputPanel({ onRunSimulation, isRunning, initialParams }: InputPanelProps) {
  const [marketUrl, setMarketUrl] = useState("");
  const [probability, setProbability] = useState(initialParams?.probability ? Math.round(initialParams.probability * 100) : 50);
  const [leverage, setLeverage] = useState(initialParams?.leverage ?? 2);
  const [positionSize, setPositionSize] = useState(initialParams?.positionSize ? Math.round(initialParams.positionSize * 100) : 15);
  const [numSimulations, setNumSimulations] = useState(initialParams?.numSimulations ?? 10000);
  const [bankroll, setBankroll] = useState(initialParams?.bankroll ?? 10000);
  const [numBets, setNumBets] = useState(initialParams?.numBets ?? 100);
  const [marketInfo, setMarketInfo] = useState<MarketInfo | null>(
    initialParams?.marketTitle ? { title: initialParams.marketTitle, probability: initialParams.probability ?? 0.5, platform: initialParams.marketPlatform ?? "", url: "" } : null
  );
  const [isScraping, setIsScraping] = useState(false);
  const [multiOutcome, setMultiOutcome] = useState(false);
  const [outcomes, setOutcomes] = useState<MarketOutcome[]>([
    { label: "Win", probability: 0.5, payoutMultiplier: 1 },
    { label: "Lose", probability: 0.5, payoutMultiplier: -1 },
  ]);

  const handleScrapeUrl = async () => {
    if (!marketUrl.trim()) return;
    setIsScraping(true);
    try {
      const response = await fetch(apiUrl("/api/firecrawl-scrape"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: marketUrl.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to scrape URL");
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
    if (multiOutcome) {
      const totalProb = outcomes.reduce((s, o) => s + o.probability, 0);
      if (Math.abs(totalProb - 1) > 0.02) {
        toast.error("Outcome probabilities must sum to ~100%");
        return;
      }
    }
    onRunSimulation({
      probability: probability / 100,
      leverage,
      positionSize: positionSize / 100,
      numSimulations,
      bankroll,
      numBets,
      marketTitle: marketInfo?.title,
      marketUrl: marketInfo?.url,
      marketPlatform: marketInfo?.platform,
      multiOutcome,
      outcomes: multiOutcome ? outcomes : undefined,
    });
  };

  return (
    <div className="space-y-3">
      {/* Market Input */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Market
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          <div className="flex gap-2">
            <Input
              placeholder="Paste prediction market URL..."
              value={marketUrl}
              onChange={(e) => setMarketUrl(e.target.value)}
              className="font-mono text-xs bg-background/50 h-8"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleScrapeUrl}
              disabled={isScraping || !marketUrl.trim()}
              className="shrink-0 h-8 w-8 p-0"
            >
              {isScraping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {marketInfo && (
            <div className="rounded border border-primary/20 bg-primary/5 p-2.5">
              <p className="text-[10px] font-mono text-primary">{marketInfo.platform}</p>
              <p className="text-xs mt-0.5 text-card-foreground">{marketInfo.title}</p>
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-mono text-muted-foreground">MODE</Label>
            <button
              type="button"
              onClick={() => setMultiOutcome(!multiOutcome)}
              className="flex items-center gap-1.5 font-mono text-[10px] text-primary hover:text-primary/80 transition-colors"
            >
              {multiOutcome ? (
                <><ToggleRight className="h-4 w-4" /> Multi-Outcome</>
              ) : (
                <><ToggleLeft className="h-4 w-4 text-muted-foreground" /> Binary</>
              )}
            </button>
          </div>

          {multiOutcome ? (
            <OutcomeEditor outcomes={outcomes} onChange={setOutcomes} />
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-[10px] font-mono text-muted-foreground">PROBABILITY</Label>
                <span className="font-mono text-sm font-bold text-primary">{probability}%</span>
              </div>
              <Slider
                value={[probability]}
                onValueChange={([v]) => setProbability(v)}
                min={1}
                max={99}
                step={1}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parameters */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          {/* Leverage */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[10px] font-mono text-muted-foreground">LEVERAGE</Label>
              <span className="font-mono text-sm font-bold text-accent">{leverage}x</span>
            </div>
            <Slider
              value={[leverage]}
              onValueChange={([v]) => setLeverage(v)}
              min={1}
              max={10}
              step={0.5}
            />
          </div>

          {/* Position Size */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[10px] font-mono text-muted-foreground">POSITION SIZE</Label>
              <span className="font-mono text-sm font-bold text-accent">{positionSize}%</span>
            </div>
            <Slider
              value={[positionSize]}
              onValueChange={([v]) => setPositionSize(v)}
              min={1}
              max={50}
              step={1}
            />
          </div>

          {/* Kelly Criterion Indicator */}
          <KellyIndicator
            probability={probability / 100}
            leverage={leverage}
            currentPositionSize={positionSize / 100}
          />

          {/* Simulations */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[10px] font-mono text-muted-foreground">SIMULATIONS</Label>
              <span className="font-mono text-sm font-bold text-accent">
                {numSimulations >= 1000 ? `${numSimulations / 1000}K` : numSimulations}
              </span>
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
              <Label className="text-[10px] font-mono text-muted-foreground">BANKROLL ($)</Label>
              <Input
                type="number"
                value={bankroll}
                onChange={(e) => setBankroll(Number(e.target.value))}
                className="mt-1 font-mono text-xs bg-background/50 h-8"
                min={100}
              />
            </div>
            <div>
              <Label className="text-[10px] font-mono text-muted-foreground">BETS / RUN</Label>
              <Input
                type="number"
                value={numBets}
                onChange={(e) => setNumBets(Number(e.target.value))}
                className="mt-1 font-mono text-xs bg-background/50 h-8"
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
        className="w-full h-10 font-mono text-xs uppercase tracking-widest glow-green"
        size="lg"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Simulating...
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" />
            Run Simulation
          </>
        )}
      </Button>
    </div>
  );
}
