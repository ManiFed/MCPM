import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { GitBranch } from "lucide-react";
import type { MarketConfig } from "@/lib/portfolioMath";

interface CorrelationMatrixProps {
  markets: MarketConfig[];
  correlations: Record<string, number>;
  onChange: (correlations: Record<string, number>) => void;
}

export function CorrelationMatrix({ markets, correlations, onChange }: CorrelationMatrixProps) {
  if (markets.length < 2) return null;

  const pairs: { i: number; j: number; key: string; nameA: string; nameB: string }[] = [];
  for (let i = 0; i < markets.length; i++) {
    for (let j = i + 1; j < markets.length; j++) {
      pairs.push({
        i,
        j,
        key: `${i}-${j}`,
        nameA: markets[i].name,
        nameB: markets[j].name,
      });
    }
  }

  const updateCorrelation = (key: string, value: number) => {
    onChange({ ...correlations, [key]: value });
  };

  // Heatmap visualization
  const n = markets.length;
  const getColor = (val: number) => {
    if (val > 0) return `hsl(142, 72%, ${50 + (1 - val) * 30}%)`;
    if (val < 0) return `hsl(0, 85%, ${55 + (1 + val) * 30}%)`;
    return "hsl(220, 15%, 16%)";
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <GitBranch className="h-3 w-3 text-accent" />
          Correlation Matrix
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Mini heatmap */}
        <div className="flex justify-center">
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `auto repeat(${n}, 1fr)` }}>
            <div />
            {markets.map((m, i) => (
              <div key={i} className="text-[8px] font-mono text-muted-foreground text-center truncate w-12">
                {m.name.slice(0, 6)}
              </div>
            ))}
            {markets.map((m, i) => (
              <>
                <div key={`label-${i}`} className="text-[8px] font-mono text-muted-foreground text-right pr-1 flex items-center justify-end w-12 truncate">
                  {m.name.slice(0, 6)}
                </div>
                {markets.map((_, j) => {
                  const val = i === j ? 1 : (correlations[`${Math.min(i, j)}-${Math.max(i, j)}`] ?? 0);
                  return (
                    <div
                      key={`${i}-${j}`}
                      className="w-12 h-8 rounded-sm flex items-center justify-center"
                      style={{ backgroundColor: getColor(val), opacity: 0.8 }}
                    >
                      <span className="text-[8px] font-mono text-foreground font-bold">
                        {val.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        {/* Sliders for each pair */}
        {pairs.map((pair) => (
          <div key={pair.key}>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-[9px] font-mono text-muted-foreground">
                {pair.nameA.slice(0, 8)} ↔ {pair.nameB.slice(0, 8)}
              </Label>
              <span className={`font-mono text-xs font-bold ${
                (correlations[pair.key] ?? 0) > 0 ? "text-profit" :
                (correlations[pair.key] ?? 0) < 0 ? "text-loss" : "text-muted-foreground"
              }`}>
                {(correlations[pair.key] ?? 0).toFixed(2)}
              </span>
            </div>
            <Slider
              value={[correlations[pair.key] ?? 0]}
              onValueChange={([v]) => updateCorrelation(pair.key, Math.round(v * 100) / 100)}
              min={-1}
              max={1}
              step={0.05}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
