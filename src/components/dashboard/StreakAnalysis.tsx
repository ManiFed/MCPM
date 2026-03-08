import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StreakStats } from "@/types/simulation";

interface StreakAnalysisProps {
  streaks: StreakStats;
}

function buildHistogram(values: number[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  return counts;
}

export function StreakAnalysis({ streaks }: StreakAnalysisProps) {
  const data = useMemo(() => {
    const winHist = buildHistogram(streaks.maxWinStreaks);
    const lossHist = buildHistogram(streaks.maxLossStreaks);
    const allKeys = new Set([...Object.keys(winHist), ...Object.keys(lossHist)]);
    const sorted = [...allKeys].map(Number).sort((a, b) => a - b);

    return sorted.map((streak) => ({
      streak,
      wins: winHist[streak] || 0,
      losses: lossHist[streak] || 0,
    }));
  }, [streaks]);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Max Streak Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="streak"
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(220, 15%, 16%)" }}
              label={{ value: "Streak Length", fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono", position: "insideBottomRight", offset: -5 }}
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
            <Legend
              wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 10 }}
            />
            <Bar dataKey="wins" name="Win Streaks" fill="hsl(142, 72%, 50%)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="losses" name="Loss Streaks" fill="hsl(0, 85%, 55%)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
