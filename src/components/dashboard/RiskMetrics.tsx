import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ShieldAlert, TrendingDown, Target, Award, Percent } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import type { SimulationResult } from "@/types/simulation";

interface RiskMetricsProps {
  result: SimulationResult;
  bankroll: number;
}

function computeAdvancedMetrics(finalValues: number[], equityCurves: number[][], bankroll: number) {
  const returns = finalValues.map(v => (v - bankroll) / bankroll);
  const sorted = [...returns].sort((a, b) => a - b);
  const n = sorted.length;

  const pct = (p: number) => sorted[Math.floor((p / 100) * (n - 1))] ?? 0;

  const var5 = pct(5);
  const var1 = pct(1);

  // CVaR (Expected Shortfall) at 5%
  const cutoff5 = Math.floor(0.05 * n);
  const tail5 = sorted.slice(0, cutoff5);
  const cvar5 = tail5.length > 0 ? tail5.reduce((s, v) => s + v, 0) / tail5.length : 0;

  const cutoff1 = Math.floor(0.01 * n);
  const tail1 = sorted.slice(0, Math.max(1, cutoff1));
  const cvar1 = tail1.reduce((s, v) => s + v, 0) / tail1.length;

  // Sortino Ratio
  const meanReturn = returns.reduce((s, v) => s + v, 0) / n;
  const downside = returns.filter(r => r < 0);
  const downsideVariance = downside.length > 0
    ? downside.reduce((s, v) => s + v ** 2, 0) / downside.length
    : 0;
  const downsideDev = Math.sqrt(downsideVariance);
  const sortino = downsideDev > 0 ? meanReturn / downsideDev : 0;

  // Max Drawdown from curves
  let maxDD = 0;
  for (const curve of equityCurves) {
    let peak = curve[0] ?? 0;
    for (const v of curve) {
      if (v > peak) peak = v;
      const dd = peak > 0 ? (peak - v) / peak : 0;
      if (dd > maxDD) maxDD = dd;
    }
  }

  // Calmar Ratio
  const calmar = maxDD > 0 ? meanReturn / maxDD : 0;

  // Win rate
  const wins = finalValues.filter(v => v > bankroll).length;
  const winRate = wins / n;

  // Profit factor
  const grossProfit = returns.filter(r => r > 0).reduce((s, v) => s + v, 0);
  const grossLoss = Math.abs(returns.filter(r => r < 0).reduce((s, v) => s + v, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : Infinity;

  return { var5, var1, cvar5, cvar1, sortino, calmar, winRate, profitFactor, meanReturn };
}

export function RiskMetrics({ result, bankroll }: RiskMetricsProps) {
  const [open, setOpen] = useState(true);

  const metrics = useMemo(
    () => computeAdvancedMetrics(result.finalValues, result.equityCurves, bankroll),
    [result.finalValues, result.equityCurves, bankroll]
  );

  const items = [
    { label: "VaR (5%)", value: `${(metrics.var5 * 100).toFixed(1)}%`, icon: ShieldAlert, desc: "Max loss at 5th percentile", bad: metrics.var5 < -0.2 },
    { label: "VaR (1%)", value: `${(metrics.var1 * 100).toFixed(1)}%`, icon: ShieldAlert, desc: "Max loss at 1st percentile", bad: metrics.var1 < -0.5 },
    { label: "CVaR (5%)", value: `${(metrics.cvar5 * 100).toFixed(1)}%`, icon: TrendingDown, desc: "Expected shortfall beyond VaR", bad: metrics.cvar5 < -0.3 },
    { label: "Sortino", value: metrics.sortino.toFixed(2), icon: Target, desc: "Return per unit downside risk", bad: metrics.sortino < 0.5 },
    { label: "Calmar", value: metrics.calmar.toFixed(2), icon: Award, desc: "Return / Max Drawdown", bad: metrics.calmar < 0.5 },
    { label: "Win Rate", value: `${(metrics.winRate * 100).toFixed(1)}%`, icon: Percent, desc: "Simulations ending in profit", bad: metrics.winRate < 0.5 },
    { label: "Profit Factor", value: metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2), icon: TrendingDown, desc: "Gross profit / Gross loss", bad: metrics.profitFactor < 1 },
  ];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                Advanced Risk Metrics
              </CardTitle>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group relative p-3 rounded-lg border border-border/40 bg-background/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon className={`h-3 w-3 ${item.bad ? "text-loss" : "text-profit"}`} />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{item.label}</span>
                  </div>
                  <div className={`font-mono text-lg font-bold ${item.bad ? "text-loss" : "text-profit"}`}>
                    {item.value}
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground/60 mt-0.5">{item.desc}</div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
