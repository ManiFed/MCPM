import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

interface DrawdownChartProps {
  equityCurves: number[][];
}

export function DrawdownChart({ equityCurves }: DrawdownChartProps) {
  const data = useMemo(() => {
    if (equityCurves.length === 0) return [];

    // Compute drawdown series for each curve
    const ddCurves = equityCurves.map((curve) => {
      let peak = curve[0] ?? 0;
      return curve.map((v) => {
        if (v > peak) peak = v;
        return peak > 0 ? -((peak - v) / peak) : 0;
      });
    });

    const numSteps = ddCurves[0]?.length ?? 0;
    const result = [];

    for (let step = 0; step < numSteps; step += Math.max(1, Math.floor(numSteps / 100))) {
      const values = ddCurves.map((c) => c[step] ?? 0).sort((a, b) => a - b);
      const n = values.length;
      const pct = (p: number) => values[Math.floor((p * n) / 100)] ?? 0;

      result.push({
        step,
        p5: pct(5) * 100,
        p25: pct(25) * 100,
        p50: pct(50) * 100,
        p75: pct(75) * 100,
        p95: pct(95) * 100,
      });
    }

    return result;
  }, [equityCurves]);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <TrendingDown className="h-3.5 w-3.5 text-loss" />
          Drawdown Timeline (Percentile Bands)
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="ddRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 85%, 55%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(0, 85%, 55%)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="ddAmber" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              tickLine={false}
              axisLine={false}
              domain={["dataMin", 0]}
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
              formatter={(v: number) => `${v.toFixed(1)}%`}
            />
            <Area type="monotone" dataKey="p5" stroke="none" fill="url(#ddRed)" fillOpacity={1} />
            <Area type="monotone" dataKey="p25" stroke="none" fill="url(#ddAmber)" fillOpacity={1} />
            <Area type="monotone" dataKey="p50" stroke="hsl(0, 85%, 55%)" fill="none" strokeWidth={2} />
            <Area type="monotone" dataKey="p75" stroke="none" fill="hsl(220, 20%, 7%)" fillOpacity={0.5} />
            <Area type="monotone" dataKey="p95" stroke="none" fill="hsl(220, 20%, 7%)" fillOpacity={0.8} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          {[
            { label: "5th–95th", color: "bg-loss/20" },
            { label: "25th–75th", color: "bg-neutral/20" },
            { label: "Median DD", color: "bg-loss" },
          ].map((l) => (
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
