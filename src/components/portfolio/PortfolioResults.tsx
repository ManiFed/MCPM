import { useMemo } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, Shield } from "lucide-react";
import type { PortfolioResult, MarketConfig } from "@/lib/portfolioMath";

interface PortfolioResultsProps {
  result: PortfolioResult;
  markets: MarketConfig[];
  bankroll: number;
}

export function PortfolioResults({ result, markets, bankroll }: PortfolioResultsProps) {
  const formatCurrency = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;

  const equityData = useMemo(() => {
    if (result.equityCurves.length === 0) return [];
    const numSteps = result.equityCurves[0].length;
    const out = [];
    for (let step = 0; step < numSteps; step += Math.max(1, Math.floor(numSteps / 100))) {
      const values = result.equityCurves.map(c => c[step] ?? 0).sort((a, b) => a - b);
      const n = values.length;
      const pct = (p: number) => values[Math.floor(p * n / 100)] ?? 0;
      out.push({ step, p5: pct(5), p25: pct(25), p50: pct(50), p75: pct(75), p95: pct(95) });
    }
    return out;
  }, [result.equityCurves]);

  const diversificationData = useMemo(() => {
    return markets.map(m => ({
      name: m.name,
      soloRuin: (result.perMarketRuin[m.id] ?? 0) * 100,
      portfolioRuin: result.probabilityOfRuin * 100,
    }));
  }, [markets, result]);

  const stats = [
    { label: "Expected Value", value: formatCurrency(result.expectedValue), change: `${((result.expectedValue - bankroll) / bankroll * 100).toFixed(1)}%`, positive: result.expectedValue > bankroll, icon: TrendingUp },
    { label: "Median", value: formatCurrency(result.medianOutcome), change: `${((result.medianOutcome - bankroll) / bankroll * 100).toFixed(1)}%`, positive: result.medianOutcome > bankroll, icon: BarChart3 },
    { label: "Portfolio Ruin", value: `${(result.probabilityOfRuin * 100).toFixed(1)}%`, change: result.probabilityOfRuin < 0.05 ? "Low" : result.probabilityOfRuin < 0.2 ? "Medium" : "High", positive: result.probabilityOfRuin < 0.1, icon: Shield },
    { label: "Max Drawdown", value: `${(result.maxDrawdown * 100).toFixed(1)}%`, change: result.maxDrawdown > 0.5 ? "Severe" : "Moderate", positive: result.maxDrawdown < 0.25, icon: TrendingDown },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
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

      {/* Portfolio Equity Fan */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Portfolio Equity Fan
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="pfFan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 72%, 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(142, 72%, 50%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="step" tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={{ stroke: "hsl(220, 15%, 16%)" }} />
              <YAxis tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }} tickFormatter={formatCurrency} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(220, 20%, 7%)", border: "1px solid hsl(220, 15%, 16%)", borderRadius: "6px", fontFamily: "JetBrains Mono", fontSize: 11, color: "hsl(150, 20%, 85%)" }} formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="p95" stroke="none" fill="url(#pfFan)" fillOpacity={1} />
              <Area type="monotone" dataKey="p75" stroke="none" fill="hsl(45, 100%, 55%)" fillOpacity={0.1} />
              <Area type="monotone" dataKey="p50" stroke="hsl(142, 72%, 50%)" fill="none" strokeWidth={2} />
              <Area type="monotone" dataKey="p25" stroke="none" fill="hsl(220, 20%, 7%)" fillOpacity={0.5} />
              <Area type="monotone" dataKey="p5" stroke="none" fill="hsl(220, 20%, 7%)" fillOpacity={0.8} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Diversification Benefit */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Diversification: Solo vs Portfolio Ruin
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={diversificationData} layout="vertical" barGap={4}>
              <XAxis type="number" tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} tickLine={false} axisLine={{ stroke: "hsl(220, 15%, 16%)" }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} width={80} />
              <Tooltip contentStyle={{ background: "hsl(220, 20%, 7%)", border: "1px solid hsl(220, 15%, 16%)", borderRadius: "6px", fontFamily: "JetBrains Mono", fontSize: 11, color: "hsl(150, 20%, 85%)" }} formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Bar dataKey="soloRuin" fill="hsl(0, 85%, 55%)" radius={[0, 4, 4, 0]} name="Solo Ruin" barSize={12} />
              <Bar dataKey="portfolioRuin" fill="hsl(142, 72%, 50%)" radius={[0, 4, 4, 0]} name="Portfolio Ruin" barSize={12} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-loss" /><span className="text-[10px] font-mono text-muted-foreground">Solo Ruin</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-profit" /><span className="text-[10px] font-mono text-muted-foreground">Portfolio Ruin</span></div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
