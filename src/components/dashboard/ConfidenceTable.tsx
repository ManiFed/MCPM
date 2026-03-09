import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { SimulationResult } from "@/types/simulation";

interface ConfidenceTableProps {
  result: SimulationResult;
  bankroll: number;
}

export function ConfidenceTable({ result, bankroll }: ConfidenceTableProps) {
  const formatCurrency = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(2)}M`
      : v >= 1000
      ? `$${(v / 1000).toFixed(1)}K`
      : `$${v.toFixed(0)}`;

  const rows = Object.entries(result.percentiles).map(([key, value]) => {
    const returnPct = ((value - bankroll) / bankroll) * 100;
    return { percentile: key, value, returnPct };
  });

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          Confidence Intervals
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground/40 hover:text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] font-mono text-[10px]">
              Shows the range of outcomes at different confidence levels. The 5th percentile is your downside scenario; the 95th is your upside.
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">Percentile</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Value</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Return</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.percentile} className="border-b border-border/30">
                  <td className="py-2 text-card-foreground">{row.percentile}</td>
                  <td className="py-2 text-right text-card-foreground">{formatCurrency(row.value)}</td>
                  <td
                    className={`py-2 text-right font-medium ${
                      row.returnPct >= 0 ? "text-profit" : "text-loss"
                    }`}
                  >
                    {row.returnPct >= 0 ? "+" : ""}
                    {row.returnPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
