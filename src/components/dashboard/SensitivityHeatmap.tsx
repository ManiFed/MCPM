import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid3X3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SimulationParams } from "@/types/simulation";
import { runMonteCarlo } from "@/lib/simulationMath";

interface SensitivityHeatmapProps {
  params: SimulationParams;
}

const PROB_STEPS = 8;
const SIZE_STEPS = 8;

function getColor(value: number): string {
  // value is mean return: negative = red, 0 = dark, positive = green
  if (value > 0.5) return "hsl(142, 72%, 40%)";
  if (value > 0.2) return "hsl(142, 72%, 32%)";
  if (value > 0.05) return "hsl(142, 50%, 22%)";
  if (value > -0.05) return "hsl(220, 15%, 14%)";
  if (value > -0.2) return "hsl(0, 50%, 22%)";
  if (value > -0.5) return "hsl(0, 70%, 30%)";
  return "hsl(0, 85%, 35%)";
}

export function SensitivityHeatmap({ params }: SensitivityHeatmapProps) {
  const grid = useMemo(() => {
    const probRange = Array.from({ length: PROB_STEPS }, (_, i) => 0.3 + (i / (PROB_STEPS - 1)) * 0.45);
    const sizeRange = Array.from({ length: SIZE_STEPS }, (_, i) => 0.02 + (i / (SIZE_STEPS - 1)) * 0.28);

    return probRange.map((prob) =>
      sizeRange.map((size) => {
        const res = runMonteCarlo(
          { ...params, probability: prob, positionSize: size, numSimulations: 300 },
          { storeCurves: false }
        );
        return { prob, size, meanReturn: res.meanReturn, ruin: res.probabilityOfRuin };
      })
    );
  }, [params]);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Grid3X3 className="h-3.5 w-3.5 text-primary" />
          Sensitivity Heatmap (Prob × Position Size → Return)
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="overflow-x-auto">
          <div className="inline-block">
            {/* Header row */}
            <div className="flex items-end mb-1">
              <div className="w-14 text-[8px] font-mono text-muted-foreground text-right pr-1">Prob ↓ / Size →</div>
              {grid[0]?.map((cell) => (
                <div key={cell.size} className="w-12 text-center text-[8px] font-mono text-muted-foreground">
                  {(cell.size * 100).toFixed(0)}%
                </div>
              ))}
            </div>
            {/* Grid */}
            {grid.map((row, ri) => (
              <div key={ri} className="flex items-center">
                <div className="w-14 text-[9px] font-mono text-muted-foreground text-right pr-1.5">
                  {(row[0].prob * 100).toFixed(0)}%
                </div>
                {row.map((cell, ci) => (
                  <Tooltip key={ci}>
                    <TooltipTrigger asChild>
                      <div
                        className="w-12 h-8 flex items-center justify-center text-[8px] font-mono font-bold cursor-default border border-background/30 transition-transform hover:scale-110 hover:z-10 rounded-sm"
                        style={{ backgroundColor: getColor(cell.meanReturn) }}
                      >
                        <span className="text-foreground/80">
                          {(cell.meanReturn * 100).toFixed(0)}%
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="font-mono text-xs">
                      <div>Prob: {(cell.prob * 100).toFixed(0)}% · Size: {(cell.size * 100).toFixed(0)}%</div>
                      <div>Return: {(cell.meanReturn * 100).toFixed(1)}% · Ruin: {(cell.ruin * 100).toFixed(1)}%</div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mt-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: "hsl(0, 85%, 35%)" }} />
            <span className="text-[9px] font-mono text-muted-foreground">Loss</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: "hsl(220, 15%, 14%)" }} />
            <span className="text-[9px] font-mono text-muted-foreground">Breakeven</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: "hsl(142, 72%, 40%)" }} />
            <span className="text-[9px] font-mono text-muted-foreground">Profit</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
