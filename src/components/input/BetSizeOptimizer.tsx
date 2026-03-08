import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Crosshair, Loader2, TrendingUp, Shield } from "lucide-react";
import { runMonteCarlo } from "@/lib/simulationMath";
import type { SimulationParams } from "@/types/simulation";

interface BetSizeOptimizerProps {
  probability: number; // 0-1
  leverage: number;
  bankroll: number;
  numBets: number;
  onApply: (positionSize: number) => void;
}

export function BetSizeOptimizer({ probability, leverage, bankroll, numBets, onApply }: BetSizeOptimizerProps) {
  const [targetRuin, setTargetRuin] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ positionSize: number; expectedReturn: number; actualRuin: number } | null>(null);

  const optimize = useCallback(() => {
    setIsRunning(true);
    setResult(null);

    // Run async to not block UI
    setTimeout(() => {
      const target = targetRuin / 100;
      const miniSims = 2000;
      let lo = 0.01, hi = 0.50;
      let bestSize = 0.01;
      let bestReturn = 0;
      let bestRuin = 1;

      // Binary search for largest position size with ruin <= target
      for (let iter = 0; iter < 12; iter++) {
        const mid = (lo + hi) / 2;
        const params: SimulationParams = {
          probability,
          leverage,
          positionSize: mid,
          numSimulations: miniSims,
          bankroll,
          numBets,
        };
        const res = runMonteCarlo(params, { storeCurves: false });

        if (res.probabilityOfRuin <= target) {
          bestSize = mid;
          bestReturn = res.meanReturn;
          bestRuin = res.probabilityOfRuin;
          lo = mid;
        } else {
          hi = mid;
        }
      }

      setResult({ positionSize: bestSize, expectedReturn: bestReturn, actualRuin: bestRuin });
      setIsRunning(false);
    }, 50);
  }, [probability, leverage, bankroll, numBets, targetRuin]);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Crosshair className="h-3 w-3 text-accent" />
          Bet Size Optimizer
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-[10px] font-mono text-muted-foreground">TARGET RUIN ≤</Label>
            <span className="font-mono text-sm font-bold text-accent">{targetRuin}%</span>
          </div>
          <Slider
            value={[targetRuin]}
            onValueChange={([v]) => setTargetRuin(v)}
            min={1}
            max={25}
            step={1}
          />
        </div>

        <Button
          onClick={optimize}
          disabled={isRunning}
          variant="outline"
          size="sm"
          className="w-full h-8 font-mono text-[10px] uppercase tracking-widest gap-1.5"
        >
          {isRunning ? (
            <><Loader2 className="h-3 w-3 animate-spin" /> Optimizing...</>
          ) : (
            <><Crosshair className="h-3 w-3" /> Find Optimal Size</>
          )}
        </Button>

        {result && (
          <div className="rounded border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-profit" />
                <span className="text-[10px] font-mono text-muted-foreground">Optimal Size</span>
              </div>
              <span className="font-mono text-sm font-bold text-primary">
                {(result.positionSize * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-accent" />
                <span className="text-[10px] font-mono text-muted-foreground">Actual Ruin</span>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {(result.actualRuin * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground">E[Return]</span>
              <span className={`font-mono text-xs ${result.expectedReturn >= 0 ? "text-profit" : "text-loss"}`}>
                {(result.expectedReturn * 100).toFixed(1)}%
              </span>
            </div>
            <Button
              onClick={() => onApply(result.positionSize)}
              size="sm"
              className="w-full h-7 font-mono text-[10px] mt-1"
            >
              Apply {(result.positionSize * 100).toFixed(1)}%
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
