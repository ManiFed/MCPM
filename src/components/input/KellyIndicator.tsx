import { useMemo } from "react";
import { computeKellyFraction, getKellyStatus } from "@/lib/kellyMath";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface KellyIndicatorProps {
  probability: number; // 0-1
  leverage: number;
  currentPositionSize: number; // 0-1
}

const STATUS_CONFIG = {
  optimal: { label: "Optimal", className: "text-profit border-profit/30 bg-profit/10" },
  under: { label: "Conservative", className: "text-primary border-primary/30 bg-primary/10" },
  over: { label: "Aggressive", className: "text-neutral border-neutral/30 bg-neutral/10" },
  danger: { label: "Dangerous", className: "text-loss border-loss/30 bg-loss/10" },
} as const;

export function KellyIndicator({ probability, leverage, currentPositionSize }: KellyIndicatorProps) {
  const kelly = useMemo(
    () => computeKellyFraction(probability, leverage),
    [probability, leverage]
  );
  const status = useMemo(
    () => getKellyStatus(currentPositionSize, kelly),
    [currentPositionSize, kelly]
  );

  const config = STATUS_CONFIG[status];
  const kellyPct = (kelly * 100).toFixed(1);

  return (
    <div className={`flex items-center justify-between rounded border px-2.5 py-1.5 ${config.className}`}>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">Kelly</span>
        <span className="font-mono text-xs font-bold">{kellyPct}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] font-medium">{config.label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 opacity-60 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px]">
            <p className="text-xs">
              Kelly Criterion suggests betting <strong>{kellyPct}%</strong> of bankroll.
              Betting above Kelly increases variance and risk of ruin dramatically.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
