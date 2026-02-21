import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RuinGaugeProps {
  probability: number; // 0-1
}

export function RuinGauge({ probability }: RuinGaugeProps) {
  const pct = probability * 100;
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (probability * 0.75 * circumference);
  const color = pct > 50 ? "hsl(0, 85%, 55%)" : pct > 20 ? "hsl(45, 100%, 55%)" : "hsl(142, 72%, 50%)";

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Probability of Ruin
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center pb-4">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-135" viewBox="0 0 140 140">
            <circle
              cx="70" cy="70" r="60"
              fill="none"
              stroke="hsl(220, 15%, 12%)"
              strokeWidth="10"
              strokeDasharray={circumference * 0.75}
              strokeLinecap="round"
            />
            <motion.circle
              cx="70" cy="70" r="60"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeDasharray={circumference * 0.75}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference * 0.75 }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 8px ${color})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="font-mono text-3xl font-bold"
              style={{ color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {pct.toFixed(1)}%
            </motion.span>
            <span className="text-[10px] font-mono text-muted-foreground mt-1">RUIN</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
