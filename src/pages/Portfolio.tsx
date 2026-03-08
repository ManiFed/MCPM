import { useState, useCallback } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Play, Loader2 } from "lucide-react";
import { MarketList } from "@/components/portfolio/MarketList";
import { CorrelationMatrix } from "@/components/portfolio/CorrelationMatrix";
import { PortfolioResults } from "@/components/portfolio/PortfolioResults";
import type { MarketConfig, PortfolioResult } from "@/lib/portfolioMath";
import { runPortfolioMonteCarlo } from "@/lib/portfolioMath";

const Portfolio = () => {
  const [markets, setMarkets] = useState<MarketConfig[]>([
    { id: crypto.randomUUID(), name: "Market 1", probability: 0.6, leverage: 2, positionSize: 0.1 },
    { id: crypto.randomUUID(), name: "Market 2", probability: 0.45, leverage: 1.5, positionSize: 0.08 },
  ]);
  const [correlations, setCorrelations] = useState<Record<string, number>>({});
  const [bankroll, setBankroll] = useState(10000);
  const [numSims, setNumSims] = useState(10000);
  const [numBets, setNumBets] = useState(100);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setResult(null);
    setTimeout(() => {
      const res = runPortfolioMonteCarlo(markets, bankroll, numSims, numBets, correlations);
      setResult(res);
      setIsRunning(false);
    }, 50);
  }, [markets, bankroll, numSims, numBets, correlations]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-[1400px] mx-auto p-4 md:p-6">
        <div className="mb-4">
          <h2 className="font-mono text-sm text-foreground">Portfolio Mode</h2>
          <p className="text-xs text-muted-foreground">
            Simulate multiple prediction markets with optional correlations to model diversification and combined risk.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4 md:gap-5 items-start">
          <Card className="p-3 md:p-4 bg-card/70 border-border/60">
            <div className="space-y-3">
              <MarketList markets={markets} onChange={setMarkets} />

              <CorrelationMatrix
                markets={markets}
                correlations={correlations}
                onChange={setCorrelations}
              />

              <Card className="border-border/50 bg-card/80 backdrop-blur p-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-[10px] font-mono text-muted-foreground">SIMULATIONS</Label>
                      <span className="font-mono text-sm font-bold text-accent">
                        {numSims >= 1000 ? `${numSims / 1000}K` : numSims}
                      </span>
                    </div>
                    <Slider value={[numSims]} onValueChange={([v]) => setNumSims(v)} min={1000} max={50000} step={1000} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] font-mono text-muted-foreground">BANKROLL ($)</Label>
                      <Input type="number" value={bankroll} onChange={e => setBankroll(Number(e.target.value))} className="mt-1 font-mono text-xs bg-background/50 h-8" min={100} />
                    </div>
                    <div>
                      <Label className="text-[10px] font-mono text-muted-foreground">BETS / RUN</Label>
                      <Input type="number" value={numBets} onChange={e => setNumBets(Number(e.target.value))} className="mt-1 font-mono text-xs bg-background/50 h-8" min={10} max={1000} />
                    </div>
                  </div>
                </div>
              </Card>

              <Button onClick={handleRun} disabled={isRunning || markets.length === 0} className="w-full h-10 font-mono text-xs uppercase tracking-widest glow-green" size="lg">
                {isRunning ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Simulating...</>
                ) : (
                  <><Play className="h-3.5 w-3.5" />Run Portfolio Sim</>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-3 md:p-4 bg-card/70 border-border/60 min-h-[500px]">
            {isRunning ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
                <p className="font-mono text-sm text-primary animate-pulse">SIMULATING PORTFOLIO...</p>
              </div>
            ) : result ? (
              <PortfolioResults result={result} markets={markets} bankroll={bankroll} />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center space-y-3">
                  <div className="font-mono text-6xl text-muted-foreground/20">⟐</div>
                  <p className="font-mono text-sm text-muted-foreground">Add markets and run portfolio simulation</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
