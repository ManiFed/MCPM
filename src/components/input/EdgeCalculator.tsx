import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface EdgeCalculatorProps {
  probability: number; // 0-1
  leverage: number;
  positionSize: number; // 0-1
}

export function EdgeCalculator({ probability, leverage, positionSize }: EdgeCalculatorProps) {
  const { edge, breakeven, edgePerBet } = useMemo(() => {
    const payoutRatio = (1 - probability) / probability;
    const edge = probability * payoutRatio - (1 - probability);
    const breakeven = 1 / (1 + payoutRatio);
    const notional = positionSize * leverage;
    const edgePerBet = edge * Math.min(1, notional);
    return { edge, breakeven, edgePerBet };
  }, [probability, leverage, positionSize]);

  const isPositive = edge > 0;

  return (
    <div className={`rounded border px-2.5 py-2 space-y-1.5 ${isPositive ? "border-profit/30 bg-profit/5" : "border-loss/30 bg-loss/5"}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Edge</span>
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-profit" />
          ) : (
            <TrendingDown className="h-3 w-3 text-loss" />
          )}
          <span className={`font-mono text-xs font-bold ${isPositive ? "text-profit" : "text-loss"}`}>
            {(edge * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground">Breakeven</span>
        <span className="font-mono text-[10px] text-muted-foreground">{(breakeven * 100).toFixed(1)}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground">EV / Bet</span>
        <span className={`font-mono text-[10px] font-medium ${isPositive ? "text-profit" : "text-loss"}`}>
          {isPositive ? "+" : ""}{(edgePerBet * 100).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
