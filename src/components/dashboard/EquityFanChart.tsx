import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EquityFanChartProps {
  equityCurves: number[][];
}

export function EquityFanChart({ equityCurves }: EquityFanChartProps) {
  const data = useMemo(() => {
    if (equityCurves.length === 0) return [];
    const numSteps = equityCurves[0].length;
    const result = [];

    for (let step = 0; step < numSteps; step += Math.max(1, Math.floor(numSteps / 100))) {
      const values = equityCurves.map(c => c[step] ?? 0).sort((a, b) => a - b);
      const n = values.length;
      const pct = (p: number) => values[Math.floor(p * n / 100)] ?? 0;

      result.push({
        step,
        p5: pct(5),
        p25: pct(25),
        p50: pct(50),
        p75: pct(75),
        p95: pct(95),
      });
    }

    return result;
  }, [equityCurves]);

  const formatValue = (v: number) =>
    v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toFixed(0)}`;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Equity Curve Fan (Percentile Bands)
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fanGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 72%, 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(142, 72%, 50%)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fanAmber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(45, 100%, 55%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(45, 100%, 55%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="step"
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(220, 15%, 16%)" }}
              label={{ value: "Bet #", fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono", position: "insideBottomRight", offset: -5 }}
            />
            <YAxis
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
              tickFormatter={formatValue}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(220, 20%, 7%)",
                border: "1px solid hsl(220, 15%, 16%)",
                borderRadius: "6px",
                fontFamily: "JetBrains Mono",
                fontSize: 11,
                color: "hsl(150, 20%, 85%)",
              }}
              formatter={(v: number) => formatValue(v)}
            />
            <Area type="monotone" dataKey="p95" stroke="none" fill="url(#fanGreen)" fillOpacity={1} />
            <Area type="monotone" dataKey="p75" stroke="none" fill="url(#fanAmber)" fillOpacity={1} />
            <Area type="monotone" dataKey="p50" stroke="hsl(142, 72%, 50%)" fill="none" strokeWidth={2} />
            <Area type="monotone" dataKey="p25" stroke="none" fill="hsl(220, 20%, 7%)" fillOpacity={0.5} />
            <Area type="monotone" dataKey="p5" stroke="none" fill="hsl(220, 20%, 7%)" fillOpacity={0.8} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          {[
            { label: "5th–95th", color: "bg-profit/20" },
            { label: "25th–75th", color: "bg-neutral/20" },
            { label: "Median", color: "bg-profit" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-1.5 rounded-full ${l.color}`} />
              <span className="text-[10px] font-mono text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
