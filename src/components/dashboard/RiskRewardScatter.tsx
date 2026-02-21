import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RiskRewardScatterProps {
  // Pre-computed data points at different leverage levels
  data: { leverage: number; expectedReturn: number; ruinProbability: number }[];
  currentLeverage: number;
}

export function RiskRewardScatter({ data, currentLeverage }: RiskRewardScatterProps) {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Risk / Reward by Leverage
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart>
            <XAxis
              dataKey="ruinProbability"
              name="Ruin %"
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              tickLine={false}
              axisLine={{ stroke: "hsl(220, 15%, 16%)" }}
              label={{ value: "P(Ruin)", fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono", position: "insideBottomRight", offset: -5 }}
            />
            <YAxis
              dataKey="expectedReturn"
              name="E[Return]"
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              tickLine={false}
              axisLine={false}
              label={{ value: "E[Return]", fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono", angle: -90, position: "insideLeft" }}
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
              formatter={(v: number, name: string) =>
                name === "Ruin %" ? `${(v * 100).toFixed(1)}%` : `${(v * 100).toFixed(1)}%`
              }
              labelFormatter={() => ""}
            />
            <Scatter data={data}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.leverage === currentLeverage
                      ? "hsl(142, 72%, 50%)"
                      : "hsl(220, 10%, 40%)"
                  }
                  r={entry.leverage === currentLeverage ? 8 : 5}
                  stroke={entry.leverage === currentLeverage ? "hsl(142, 72%, 70%)" : "none"}
                  strokeWidth={2}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {data.map((d) => (
            <span
              key={d.leverage}
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                d.leverage === currentLeverage
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {d.leverage}x
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
