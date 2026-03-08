import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";

interface EquityReplayProps {
  equityCurves: number[][];
  bankroll: number;
}

const SPEEDS = [1, 2, 5, 10];

export function EquityReplay({ equityCurves, bankroll }: EquityReplayProps) {
  const [curveIndex] = useState(() => Math.floor(Math.random() * equityCurves.length));
  const curve = equityCurves[curveIndex] ?? [];
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  const speed = SPEEDS[speedIdx];
  const interval = 60 / speed; // ms per step

  const animate = useCallback(
    (time: number) => {
      if (time - lastTimeRef.current >= interval) {
        lastTimeRef.current = time;
        setStep((s) => {
          if (s >= curve.length - 1) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        });
      }
      rafRef.current = requestAnimationFrame(animate);
    },
    [curve.length, interval]
  );

  useEffect(() => {
    if (playing) {
      lastTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, animate]);

  const data = curve.slice(0, step + 1).map((v, i) => ({ step: i, equity: v }));
  const currentEquity = curve[step] ?? bankroll;
  const pnl = currentEquity - bankroll;
  const pnlPct = (pnl / bankroll) * 100;

  const formatValue = (v: number) =>
    v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;

  if (curve.length === 0) return null;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-accent" />
            Equity Path Replay
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 font-mono text-[10px]"
              onClick={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)}
            >
              {speed}x
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => { setStep(0); setPlaying(false); }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 font-mono text-[10px] gap-1"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {playing ? "Pause" : "Play"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="font-mono text-xs text-muted-foreground">
            Bet <span className="text-foreground font-semibold">{step}</span>/{curve.length - 1}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            Equity: <span className="text-foreground font-semibold">{formatValue(currentEquity)}</span>
          </div>
          <div className={`font-mono text-xs font-semibold ${pnl >= 0 ? "text-profit" : "text-loss"}`}>
            {pnl >= 0 ? "+" : ""}{formatValue(pnl)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis
              dataKey="step"
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(220, 15%, 16%)" }}
              domain={[0, curve.length - 1]}
            />
            <YAxis
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 9, fontFamily: "JetBrains Mono" }}
              tickFormatter={(v: number) => formatValue(v)}
              tickLine={false}
              axisLine={false}
            />
            <ReferenceLine y={bankroll} stroke="hsl(45, 100%, 55%)" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="equity"
              stroke={pnl >= 0 ? "hsl(142, 72%, 50%)" : "hsl(0, 85%, 55%)"}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        {/* Progress bar */}
        <div className="w-full h-1 bg-muted rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-75"
            style={{ width: `${(step / Math.max(1, curve.length - 1)) * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
