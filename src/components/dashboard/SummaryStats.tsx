import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, Target, OctagonX } from "lucide-react";
import { motion } from "framer-motion";
import type { SimulationResult } from "@/types/simulation";

interface SummaryStatsProps {
  result: SimulationResult;
  bankroll: number;
  comparisonResult?: SimulationResult | null;
}

export function SummaryStats({ result, bankroll, comparisonResult }: SummaryStatsProps) {
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
      delta: comparisonResult ? result.expectedValue - comparisonResult.expectedValue : null,
    },
    {
      label: "Median Outcome",
      value: formatCurrency(result.medianOutcome),
      change: ((result.medianOutcome - bankroll) / bankroll * 100).toFixed(1) + "%",
      positive: result.medianOutcome > bankroll,
      icon: BarChart3,
      delta: comparisonResult ? result.medianOutcome - comparisonResult.medianOutcome : null,
    },
    {
      label: "Sharpe Ratio",
      value: result.sharpeRatio.toFixed(2),
      change: result.sharpeRatio > 0.5 ? "Good" : result.sharpeRatio > 0 ? "Fair" : "Poor",
      positive: result.sharpeRatio > 0,
      icon: TrendingUp,
      delta: comparisonResult ? result.sharpeRatio - comparisonResult.sharpeRatio : null,
    },
    {
      label: "Max Drawdown",
      value: (result.maxDrawdown * 100).toFixed(1) + "%",
      change: result.maxDrawdown > 0.5 ? "Severe" : result.maxDrawdown > 0.25 ? "High" : "Moderate",
      positive: result.maxDrawdown < 0.25,
      icon: TrendingDown,
      delta: comparisonResult ? result.maxDrawdown - comparisonResult.maxDrawdown : null,
    },
  ];

  // Add target/stop stats if present
  if (result.pctHitTarget !== undefined) {
    stats.push({
      label: "Hit Target",
      value: (result.pctHitTarget * 100).toFixed(1) + "%",
      change: result.pctHitTarget > 0.5 ? "Likely" : "Unlikely",
      positive: result.pctHitTarget > 0.5,
      icon: Target,
      delta: null,
    });
  }
  if (result.pctHitStop !== undefined) {
    stats.push({
      label: "Hit Stop",
      value: (result.pctHitStop * 100).toFixed(1) + "%",
      change: result.pctHitStop > 0.3 ? "Frequent" : "Rare",
      positive: result.pctHitStop < 0.3,
      icon: OctagonX,
      delta: null,
    });
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
        >
          <Card className={`border-border/50 bg-card/80 backdrop-blur overflow-hidden relative group hover:border-${stat.positive ? "profit" : "loss"}/30 transition-colors duration-300`}>
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${stat.positive ? "bg-profit/[0.02]" : "bg-loss/[0.02]"}`} />
            <CardContent className="p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </span>
                <div className={`p-1 rounded ${stat.positive ? "bg-profit/10" : "bg-loss/10"}`}>
                  <stat.icon className={`h-3 w-3 ${stat.positive ? "text-profit" : "text-loss"}`} />
                </div>
              </div>
              <div className="font-mono text-xl font-bold text-card-foreground">{stat.value}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`inline-flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded ${stat.positive ? "text-profit bg-profit/10" : "text-loss bg-loss/10"}`}>
                  {stat.change}
                </div>
                {stat.delta !== null && (
                  <span className={`text-[10px] font-mono ${stat.delta > 0 ? "text-profit" : "text-loss"}`}>
                    {stat.delta > 0 ? "▲" : "▼"} vs A
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
