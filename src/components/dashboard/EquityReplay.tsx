import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Zap, SkipForward, Volume2, VolumeX } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";

interface EquityReplayProps {
  equityCurves: number[][];
  bankroll: number;
}

const SPEEDS = [0.5, 1, 2, 4, 10];

export function EquityReplay({ equityCurves, bankroll }: EquityReplayProps) {
  const [curveIndex] = useState(() => Math.floor(Math.random() * equityCurves.length));
  const curve = equityCurves[curveIndex] ?? [];
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const prevEquityRef = useRef(bankroll);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const speed = SPEEDS[speedIdx];
  const interval = 60 / speed;

  // Track streaks for display
  const [currentStreak, setCurrentStreak] = useState({ type: "none" as "win" | "loss" | "none", count: 0 });

  const playTick = useCallback((won: boolean) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = won ? 880 : 220;
      osc.type = won ? "sine" : "triangle";
      gain.gain.value = 0.05;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }, [soundEnabled]);

  const animate = useCallback(
    (time: number) => {
      if (time - lastTimeRef.current >= interval) {
        lastTimeRef.current = time;
        setStep((s) => {
          if (s >= curve.length - 1) {
            setPlaying(false);
            return s;
          }
          const next = s + 1;
          const prevEq = curve[s] ?? bankroll;
          const nextEq = curve[next] ?? bankroll;
          const won = nextEq > prevEq;
          playTick(won);

          setCurrentStreak(prev => {
            const newType = won ? "win" : "loss";
            if (prev.type === newType) return { type: newType, count: prev.count + 1 };
            return { type: newType, count: 1 };
          });

          prevEquityRef.current = nextEq;
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(animate);
    },
    [curve.length, interval, playTick, bankroll, curve]
  );

  useEffect(() => {
    if (playing) {
      lastTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, animate]);

  const stepForward = useCallback(() => {
    setStep(s => {
      if (s >= curve.length - 1) return s;
      const next = s + 1;
      const won = (curve[next] ?? 0) > (curve[s] ?? 0);
      playTick(won);
      setCurrentStreak(prev => {
        const newType = won ? "win" : "loss";
        if (prev.type === newType) return { type: newType, count: prev.count + 1 };
        return { type: newType, count: 1 };
      });
      return next;
    });
  }, [curve, playTick]);

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
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-3 w-3 text-primary" /> : <VolumeX className="h-3 w-3 text-muted-foreground" />}
            </Button>
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
              onClick={stepForward}
              disabled={playing}
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => { setStep(0); setPlaying(false); setCurrentStreak({ type: "none", count: 0 }); }}
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
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <div className="font-mono text-xs text-muted-foreground">
            Bet <span className="text-foreground font-semibold">{step}</span>/{curve.length - 1}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            Equity: <span className="text-foreground font-semibold">{formatValue(currentEquity)}</span>
          </div>
          <div className={`font-mono text-xs font-semibold ${pnl >= 0 ? "text-profit" : "text-loss"}`}>
            {pnl >= 0 ? "+" : ""}{formatValue(pnl)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
          </div>
          {currentStreak.type !== "none" && currentStreak.count > 1 && (
            <div className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
              currentStreak.type === "win" ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
            }`}>
              {currentStreak.count}× {currentStreak.type === "win" ? "W" : "L"} streak
            </div>
          )}
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
