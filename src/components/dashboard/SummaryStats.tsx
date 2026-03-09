import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, Target, OctagonX, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SimulationResult } from "@/types/simulation";
import { useCountUp } from "@/hooks/useCountUp";

const STAT_TOOLTIPS: Record<string, string> = {
  "Expected Value": "The average outcome across all simulations. If this exceeds your bankroll, you have a positive expected return.",
  "Median Outcome": "The middle outcome — 50% of simulations end above this, 50% below. More reliable than the mean for skewed distributions.",
  "Sharpe Ratio": "Return per unit of risk. Above 0.5 is decent, above 1.0 is strong, above 2.0 is exceptional.",
  "Max Drawdown": "The largest peak-to-trough decline observed. Lower is better — above 50% is severe.",
  "Hit Target": "Percentage of simulations that reached your profit target before the run ended.",
  "Hit Stop": "Percentage of simulations that hit your stop loss before the run ended.",
};

interface StatCardProps {
  label: string;
  rawValue: number;
  formattedPrefix?: string;
  formattedSuffix?: string;
  decimals?: number;
  change: string;
  positive: boolean;
  icon: any;
  delta: number | null;
  index: number;
}

function AnimatedStatCard({ label, rawValue, formattedPrefix = "", formattedSuffix = "", decimals = 0, change, positive, icon: Icon, delta, index }: StatCardProps) {
  const animatedValue = useCountUp(rawValue, 1200, decimals);

  const formatAnimated = () => {
    if (formattedSuffix === "%") return `${animatedValue.toFixed(decimals)}%`;
    if (formattedPrefix === "$") {
      const v = animatedValue;
      if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
      if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}K`;
      return `$${v.toFixed(0)}`;
    }
    return animatedValue.toFixed(decimals);
  };

  const tooltip = STAT_TOOLTIPS[label];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ scale: 1.03, y: -2 }}
    >
      <Card className={`border-border/50 bg-card/80 backdrop-blur overflow-hidden relative group cursor-default hover:border-${positive ? "profit" : "loss"}/30 transition-all duration-300`}>
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${positive ? "bg-profit/[0.03]" : "bg-loss/[0.03]"}`} />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.04] to-transparent -skew-x-12"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 2, delay: index * 0.15 + 0.5, ease: "easeInOut" }}
        />
        <CardContent className="p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              {tooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground/40 hover:text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] font-mono text-[10px]">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <motion.div
              className={`p-1 rounded ${positive ? "bg-profit/10" : "bg-loss/10"}`}
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
              transition={{ duration: 0.4 }}
            >
              <Icon className={`h-3 w-3 ${positive ? "text-profit" : "text-loss"}`} />
            </motion.div>
          </div>
          <motion.div className="font-mono text-xl font-bold text-card-foreground" key={rawValue}>
            {formatAnimated()}
          </motion.div>
          <div className="flex items-center gap-2 mt-1.5">
            <motion.div
              className={`inline-flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded ${positive ? "text-profit bg-profit/10" : "text-loss bg-loss/10"}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.08 + 0.6, type: "spring" }}
            >
              {change}
            </motion.div>
            {delta !== null && (
              <motion.span
                className={`text-[10px] font-mono ${delta > 0 ? "text-profit" : "text-loss"}`}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                {delta > 0 ? "▲" : "▼"} vs A
              </motion.span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface SummaryStatsProps {
  result: SimulationResult;
  bankroll: number;
  comparisonResult?: SimulationResult | null;
}

export function SummaryStats({ result, bankroll, comparisonResult }: SummaryStatsProps) {
  const stats = [
    {
      label: "Expected Value",
      rawValue: result.expectedValue,
      formattedPrefix: "$",
      decimals: 0,
      change: ((result.expectedValue - bankroll) / bankroll * 100).toFixed(1) + "%",
      positive: result.expectedValue > bankroll,
      icon: TrendingUp,
      delta: comparisonResult ? result.expectedValue - comparisonResult.expectedValue : null,
    },
    {
      label: "Median Outcome",
      rawValue: result.medianOutcome,
      formattedPrefix: "$",
      decimals: 0,
      change: ((result.medianOutcome - bankroll) / bankroll * 100).toFixed(1) + "%",
      positive: result.medianOutcome > bankroll,
      icon: BarChart3,
      delta: comparisonResult ? result.medianOutcome - comparisonResult.medianOutcome : null,
    },
    {
      label: "Sharpe Ratio",
      rawValue: result.sharpeRatio,
      decimals: 2,
      change: result.sharpeRatio > 0.5 ? "Good" : result.sharpeRatio > 0 ? "Fair" : "Poor",
      positive: result.sharpeRatio > 0,
      icon: TrendingUp,
      delta: comparisonResult ? result.sharpeRatio - comparisonResult.sharpeRatio : null,
    },
    {
      label: "Max Drawdown",
      rawValue: result.maxDrawdown * 100,
      formattedSuffix: "%",
      decimals: 1,
      change: result.maxDrawdown > 0.5 ? "Severe" : result.maxDrawdown > 0.25 ? "High" : "Moderate",
      positive: result.maxDrawdown < 0.25,
      icon: TrendingDown,
      delta: comparisonResult ? result.maxDrawdown - comparisonResult.maxDrawdown : null,
    },
  ];

  if (result.pctHitTarget !== undefined) {
    stats.push({
      label: "Hit Target",
      rawValue: result.pctHitTarget * 100,
      formattedSuffix: "%",
      decimals: 1,
      change: result.pctHitTarget > 0.5 ? "Likely" : "Unlikely",
      positive: result.pctHitTarget > 0.5,
      icon: Target,
      delta: null,
    });
  }
  if (result.pctHitStop !== undefined) {
    stats.push({
      label: "Hit Stop",
      rawValue: result.pctHitStop * 100,
      formattedSuffix: "%",
      decimals: 1,
      change: result.pctHitStop > 0.3 ? "Frequent" : "Rare",
      positive: result.pctHitStop < 0.3,
      icon: OctagonX,
      delta: null,
    });
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <AnimatedStatCard key={stat.label} {...stat} index={i} />
      ))}
    </div>
  );
}
