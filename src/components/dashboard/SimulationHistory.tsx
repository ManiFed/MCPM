import { Clock, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { SimulationParams } from "@/types/simulation";
import type { HistoryEntry } from "@/hooks/useSimulationHistory";

interface SimulationHistoryProps {
  history: HistoryEntry[];
  onRerun: (params: SimulationParams) => void;
  onClear: () => void;
}

export function SimulationHistory({ history, onRerun, onClear }: SimulationHistoryProps) {
  if (history.length === 0) return null;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatCurrency = (v: number) =>
    v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;

  return (
    <Collapsible>
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground cursor-pointer">
                  History ({history.length})
                </CardTitle>
              </button>
            </CollapsibleTrigger>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-loss"
              onClick={onClear}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3 space-y-1.5 max-h-[200px] overflow-y-auto">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded border border-border/30 bg-background/50 px-2.5 py-1.5 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatTime(entry.timestamp)}
                    </span>
                    <span className="font-mono text-[10px] text-primary truncate">
                      {entry.params.marketTitle || `${Math.round(entry.params.probability * 100)}% · ${entry.params.leverage}x`}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    <span className="font-mono text-[9px] text-muted-foreground">
                      EV {formatCurrency(entry.summary.expectedValue)}
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground">
                      Ruin {(entry.summary.probabilityOfRuin * 100).toFixed(1)}%
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground">
                      Sharpe {entry.summary.sharpeRatio.toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                  onClick={() => onRerun(entry.params)}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
