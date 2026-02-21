import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, AlertTriangle } from "lucide-react";
import type { SimulationResult } from "@/types/simulation";

interface SummaryStatsProps {
  result: SimulationResult;
  bankroll: number;
}

export function SummaryStats({ result, bankroll }: SummaryStatsProps) {
  const formatCurrency = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(1)}M`
      : v >= 1000
      ? `$${(v / 1000).toFixed(1)}K`
      : `$${v.toFixed(0)}`;

  const stats = [
    {
      label: "Expected Value",
      value: formatCurrency(result.expectedValue),
      change: ((result.expectedValue - bankroll) / bankroll * 100).toFixed(1) + "%",
      positive: result.expectedValue > bankroll,
      icon: TrendingUp,
    },
    {
      label: "Median Outcome",
      value: formatCurrency(result.medianOutcome),
      change: ((result.medianOutcome - bankroll) / bankroll * 100).toFixed(1) + "%",
      positive: result.medianOutcome > bankroll,
      icon: BarChart3,
    },
    {
      label: "Sharpe Ratio",
      value: result.sharpeRatio.toFixed(2),
      change: result.sharpeRatio > 0.5 ? "Good" : result.sharpeRatio > 0 ? "Fair" : "Poor",
      positive: result.sharpeRatio > 0,
      icon: TrendingUp,
    },
    {
      label: "Max Drawdown",
      value: (result.maxDrawdown * 100).toFixed(1) + "%",
      change: result.maxDrawdown > 0.5 ? "Severe" : result.maxDrawdown > 0.25 ? "High" : "Moderate",
      positive: result.maxDrawdown < 0.25,
      icon: TrendingDown,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50 bg-card/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
              <stat.icon className={`h-3.5 w-3.5 ${stat.positive ? "text-profit" : "text-loss"}`} />
            </div>
            <div className="font-mono text-xl font-bold text-card-foreground">{stat.value}</div>
            <div className={`text-xs font-mono mt-1 ${stat.positive ? "text-profit" : "text-loss"}`}>
              {stat.change}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
