import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OutcomeHistogramProps {
  finalValues: number[];
  bankroll: number;
}

export function OutcomeHistogram({ finalValues, bankroll }: OutcomeHistogramProps) {
  const data = useMemo(() => {
    const nonZero = finalValues.filter(v => v > 0);
    if (nonZero.length === 0) return [];

    const min = Math.min(...finalValues);
    const max = Math.max(...nonZero);
    const numBins = 40;
    const binWidth = (max - min) / numBins || 1;

    const bins = Array.from({ length: numBins }, (_, i) => ({
      range: min + i * binWidth,
      count: 0,
      label: "",
    }));

    for (const v of finalValues) {
      const idx = Math.min(Math.floor((v - min) / binWidth), numBins - 1);
      if (idx >= 0) bins[idx].count++;
    }

    return bins.map((b) => ({
      ...b,
      label: b.range >= 1000 ? `$${(b.range / 1000).toFixed(0)}K` : `$${b.range.toFixed(0)}`,
      fill: b.range >= bankroll ? "hsl(142, 72%, 50%)" : "hsl(0, 85%, 55%)",
    }));
  }, [finalValues, bankroll]);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Outcome Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barCategoryGap={0}>
            <XAxis
              dataKey="label"
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={{ stroke: "hsl(220, 15%, 16%)" }}
            />
            <YAxis
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
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
            />
            <ReferenceLine
              x={data.findIndex(d => d.range >= bankroll)}
              stroke="hsl(45, 100%, 55%)"
              strokeDasharray="3 3"
              label={{ value: "Start", fill: "hsl(45, 100%, 55%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
