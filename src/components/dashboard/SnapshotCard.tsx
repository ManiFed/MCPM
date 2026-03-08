import { forwardRef } from "react";
import { Activity } from "lucide-react";
import type { SimulationParams, SimulationResult } from "@/types/simulation";

interface SnapshotCardProps {
  params: SimulationParams;
  result: SimulationResult;
}

export const SnapshotCard = forwardRef<HTMLDivElement, SnapshotCardProps>(
  ({ params, result }, ref) => {
    const formatCurrency = (v: number) =>
      v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;

    return (
      <div
        ref={ref}
        className="p-5 rounded-lg"
        style={{ background: "hsl(220, 20%, 5%)", color: "hsl(150, 20%, 85%)", fontFamily: "JetBrains Mono, monospace" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="inline-flex h-6 w-6 items-center justify-center rounded bg-primary/15 border border-primary/25">
            <Activity className="h-3 w-3" style={{ color: "hsl(142, 72%, 50%)" }} />
          </div>
          <span className="text-xs font-semibold tracking-wide" style={{ color: "hsl(150, 80%, 75%)" }}>MCPM</span>
        </div>

        {/* Market */}
        {params.marketTitle && (
          <div className="mb-3 text-xs" style={{ color: "hsl(220, 10%, 50%)" }}>
            <span className="text-[10px] uppercase tracking-widest">Market: </span>
            <span style={{ color: "hsl(150, 20%, 85%)" }}>{params.marketTitle}</span>
          </div>
        )}

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: "Probability", value: `${(params.probability * 100).toFixed(0)}%` },
            { label: "Leverage", value: `${params.leverage}x` },
            { label: "Position", value: `${(params.positionSize * 100).toFixed(0)}%` },
          ].map(s => (
            <div key={s.label}>
              <div className="text-[9px] uppercase tracking-widest" style={{ color: "hsl(220, 10%, 50%)" }}>{s.label}</div>
              <div className="text-sm font-bold" style={{ color: "hsl(142, 72%, 50%)" }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="border-t my-3" style={{ borderColor: "hsl(220, 15%, 16%)" }} />

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Expected Value", value: formatCurrency(result.expectedValue), positive: result.expectedValue > params.bankroll },
            { label: "Median", value: formatCurrency(result.medianOutcome), positive: result.medianOutcome > params.bankroll },
            { label: "Ruin Prob", value: `${(result.probabilityOfRuin * 100).toFixed(1)}%`, positive: result.probabilityOfRuin < 0.1 },
            { label: "Sharpe", value: result.sharpeRatio.toFixed(2), positive: result.sharpeRatio > 0 },
          ].map(s => (
            <div key={s.label}>
              <div className="text-[9px] uppercase tracking-widest" style={{ color: "hsl(220, 10%, 50%)" }}>{s.label}</div>
              <div className="text-sm font-bold" style={{ color: s.positive ? "hsl(142, 72%, 50%)" : "hsl(0, 85%, 55%)" }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-[9px] text-right" style={{ color: "hsl(220, 10%, 40%)" }}>
          mcpm · Monte Carlo · Prediction Markets
        </div>
      </div>
    );
  }
);

SnapshotCard.displayName = "SnapshotCard";
