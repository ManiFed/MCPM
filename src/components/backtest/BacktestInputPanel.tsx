import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play } from "lucide-react";
import type { PathPattern } from "@/lib/backtestMath";
import { generateProbabilityPath, runBacktest } from "@/lib/backtestMath";
import type { BacktestResult } from "@/lib/backtestMath";
import { BacktestResults } from "./BacktestResults";
import { ProbabilityPathChart } from "./ProbabilityPathChart";

const PATTERNS: { value: PathPattern; label: string; description: string }[] = [
  { value: "linear", label: "Steady Climb", description: "Linear trend from start to end" },
  { value: "spike_crash", label: "Spike & Crash", description: "Rapid rise then pullback" },
  { value: "mean_reversion", label: "Mean Reversion", description: "Oscillates toward target" },
  { value: "volatile", label: "High Volatility", description: "Noisy path with trend" },
];

export function BacktestInputPanel() {
  const [startProb, setStartProb] = useState(30);
  const [endProb, setEndProb] = useState(70);
  const [steps, setSteps] = useState(50);
  const [volatility, setVolatility] = useState(5);
  const [pattern, setPattern] = useState<PathPattern>("linear");
  const [leverage, setLeverage] = useState(2);
  const [positionSize, setPositionSize] = useState(10);
  const [bankroll, setBankroll] = useState(10000);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));

  const probPath = useMemo(
    () => generateProbabilityPath(startProb / 100, endProb / 100, steps, volatility / 100, pattern, seed),
    [startProb, endProb, steps, volatility, pattern, seed]
  );

  const handleRun = () => {
    const res = runBacktest(
      { startProb: startProb / 100, endProb: endProb / 100, steps, volatility: volatility / 100, pattern, leverage, positionSize: positionSize / 100, bankroll },
      probPath
    );
    setResult(res);
  };

  const handleReseed = () => setSeed(Math.floor(Math.random() * 1e9));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4 md:gap-5 items-start">
        <Card className="p-3 md:p-4 bg-card/70 border-border/60">
          <div className="space-y-3">
            {/* Path Configuration */}
            <Card className="border-border/50 bg-card/80 backdrop-blur">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Probability Path
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-4">
                <div>
                  <Label className="text-[10px] font-mono text-muted-foreground">PATTERN</Label>
                  <Select value={pattern} onValueChange={(v) => setPattern(v as PathPattern)}>
                    <SelectTrigger className="mt-1 font-mono text-xs h-8 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PATTERNS.map(p => (
                        <SelectItem key={p.value} value={p.value} className="font-mono text-xs">
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-[10px] font-mono text-muted-foreground">START PROB</Label>
                    <span className="font-mono text-sm font-bold text-primary">{startProb}%</span>
                  </div>
                  <Slider value={[startProb]} onValueChange={([v]) => setStartProb(v)} min={1} max={99} step={1} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-[10px] font-mono text-muted-foreground">END PROB</Label>
                    <span className="font-mono text-sm font-bold text-primary">{endProb}%</span>
                  </div>
                  <Slider value={[endProb]} onValueChange={([v]) => setEndProb(v)} min={1} max={99} step={1} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-[10px] font-mono text-muted-foreground">STEPS</Label>
                      <span className="font-mono text-xs font-bold text-accent">{steps}</span>
                    </div>
                    <Slider value={[steps]} onValueChange={([v]) => setSteps(v)} min={10} max={200} step={5} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-[10px] font-mono text-muted-foreground">VOLATILITY</Label>
                      <span className="font-mono text-xs font-bold text-accent">{volatility}%</span>
                    </div>
                    <Slider value={[volatility]} onValueChange={([v]) => setVolatility(v)} min={0} max={30} step={1} />
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={handleReseed} className="w-full h-7 text-[10px] font-mono text-muted-foreground">
                  ↻ Regenerate Path
                </Button>
              </CardContent>
            </Card>

            {/* Strategy Params */}
            <Card className="border-border/50 bg-card/80 backdrop-blur">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-[10px] font-mono text-muted-foreground">LEVERAGE</Label>
                    <span className="font-mono text-sm font-bold text-accent">{leverage}x</span>
                  </div>
                  <Slider value={[leverage]} onValueChange={([v]) => setLeverage(v)} min={1} max={10} step={0.5} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-[10px] font-mono text-muted-foreground">POSITION SIZE</Label>
                    <span className="font-mono text-sm font-bold text-accent">{positionSize}%</span>
                  </div>
                  <Slider value={[positionSize]} onValueChange={([v]) => setPositionSize(v)} min={1} max={50} step={1} />
                </div>

                <div>
                  <Label className="text-[10px] font-mono text-muted-foreground">BANKROLL ($)</Label>
                  <Input
                    type="number" value={bankroll}
                    onChange={e => setBankroll(Number(e.target.value))}
                    className="mt-1 font-mono text-xs bg-background/50 h-8" min={100}
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleRun} className="w-full h-10 font-mono text-xs uppercase tracking-widest glow-green" size="lg">
              <Play className="h-3.5 w-3.5" />
              Run Backtest
            </Button>
          </div>
        </Card>

        <Card className="p-3 md:p-4 bg-card/70 border-border/60 min-h-[500px]">
          <div className="space-y-4">
            <ProbabilityPathChart path={probPath} />
            {result ? (
              <BacktestResults result={result} bankroll={bankroll} />
            ) : (
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="text-center space-y-3">
                  <div className="font-mono text-6xl text-muted-foreground/20">⟐</div>
                  <p className="font-mono text-sm text-muted-foreground">Configure path and run backtest</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
