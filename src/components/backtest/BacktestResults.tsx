import { useMemo } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, Target } from "lucide-react";
import type { BacktestResult } from "@/lib/backtestMath";

interface BacktestResultsProps {
  result: BacktestResult;
  bankroll: number;
}

export function BacktestResults({ result, bankroll }: BacktestResultsProps) {
  const formatCurrency = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;

  const equityData = useMemo(
    () => result.equityCurve.map((v, i) => ({ step: i, equity: v })),
    [result.equityCurve]
  );

  const pnlData = useMemo(
    () => result.pnlPerStep.map((v, i) => ({ step: i, pnl: v, fill: v >= 0 ? "hsl(142, 72%, 50%)" : "hsl(0, 85%, 55%)" })),
    [result.pnlPerStep]
  );

  const stats = [
    {
      label: "Final Equity", value: formatCurrency(result.finalEquity),
      change: `${(result.totalReturn * 100).toFixed(1)}%`, positive: result.totalReturn > 0, icon: TrendingUp,
    },
    {
      label: "Max Drawdown", value: `${(result.maxDrawdown * 100).toFixed(1)}%`,
      change: result.maxDrawdown > 0.5 ? "Severe" : result.maxDrawdown > 0.25 ? "High" : "Moderate",
      positive: result.maxDrawdown < 0.25, icon: TrendingDown,
    },
    {
      label: "Win Rate", value: `${(result.winRate * 100).toFixed(1)}%`,
      change: result.winRate > 0.5 ? "Positive" : "Negative", positive: result.winRate > 0.5, icon: Target,
    },
    {
      label: "Total Return", value: `${(result.totalReturn * 100).toFixed(1)}%`,
      change: formatCurrency(result.finalEquity - bankroll), positive: result.totalReturn > 0, icon: BarChart3,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(stat => (
          <Card key={stat.label} className="border-border/50 bg-card/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-3.5 w-3.5 ${stat.positive ? "text-profit" : "text-loss"}`} />
              </div>
              <div className="font-mono text-xl font-bold text-card-foreground">{stat.value}</div>
              <div className={`text-xs font-mono mt-1 ${stat.positive ? "text-profit" : "text-loss"}`}>{stat.change}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Equity Curve */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Equity Curve
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="btEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 72%, 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(142, 72%, 50%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="step" tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={{ stroke: "hsl(220, 15%, 16%)" }} />
              <YAxis tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }} tickFormatter={(v: number) => formatCurrency(v)} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(220, 20%, 7%)", border: "1px solid hsl(220, 15%, 16%)", borderRadius: "6px", fontFamily: "JetBrains Mono", fontSize: 11, color: "hsl(150, 20%, 85%)" }} formatter={(v: number) => formatCurrency(v)} />
              <ReferenceLine y={bankroll} stroke="hsl(45, 100%, 55%)" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="equity" stroke="hsl(142, 72%, 50%)" fill="url(#btEquity)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* P&L per step */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Per-Step P&L
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pnlData} barCategoryGap={0}>
              <XAxis dataKey="step" tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }} interval="preserveStartEnd" tickLine={false} axisLine={{ stroke: "hsl(220, 15%, 16%)" }} />
              <YAxis tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }} tickFormatter={(v: number) => formatCurrency(v)} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(220, 20%, 7%)", border: "1px solid hsl(220, 15%, 16%)", borderRadius: "6px", fontFamily: "JetBrains Mono", fontSize: 11, color: "hsl(150, 20%, 85%)" }} formatter={(v: number) => formatCurrency(v)} />
              <ReferenceLine y={0} stroke="hsl(220, 15%, 20%)" />
              <Bar dataKey="pnl" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
