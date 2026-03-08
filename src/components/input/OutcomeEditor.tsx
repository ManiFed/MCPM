import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import type { MarketOutcome } from "@/types/simulation";

interface OutcomeEditorProps {
  outcomes: MarketOutcome[];
  onChange: (outcomes: MarketOutcome[]) => void;
}

const OUTCOME_COLORS = [
  "border-profit/40 bg-profit/5",
  "border-loss/40 bg-loss/5",
  "border-primary/40 bg-primary/5",
  "border-accent/40 bg-accent/5",
  "border-neutral/40 bg-neutral/5",
  "border-muted-foreground/40 bg-muted/5",
];

export function OutcomeEditor({ outcomes, onChange }: OutcomeEditorProps) {
  const totalProb = outcomes.reduce((s, o) => s + o.probability, 0);
  const isValid = Math.abs(totalProb - 1) < 0.005;

  const addOutcome = () => {
    if (outcomes.length >= 6) return;
    const remaining = Math.max(0, 1 - totalProb);
    onChange([
      ...outcomes,
      {
        label: `Outcome ${outcomes.length + 1}`,
        probability: Math.round(remaining * 100) / 100 || 0.1,
        payoutMultiplier: 1,
      },
    ]);
  };

  const removeOutcome = (idx: number) => {
    if (outcomes.length <= 2) return;
    onChange(outcomes.filter((_, i) => i !== idx));
  };

  const update = (idx: number, patch: Partial<MarketOutcome>) => {
    onChange(outcomes.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  };

  const normalize = () => {
    if (totalProb <= 0) return;
    onChange(
      outcomes.map((o) => ({
        ...o,
        probability: Math.round((o.probability / totalProb) * 1000) / 1000,
      }))
    );
  };

  return (
    <div className="space-y-2.5">
      {outcomes.map((o, idx) => (
        <div
          key={idx}
          className={`rounded-lg border p-2.5 space-y-2 ${OUTCOME_COLORS[idx % OUTCOME_COLORS.length]}`}
        >
          <div className="flex items-center gap-2">
            <Input
              value={o.label}
              onChange={(e) => update(idx, { label: e.target.value })}
              className="font-mono text-xs bg-background/50 h-7 flex-1"
              placeholder="Outcome name"
            />
            {outcomes.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeOutcome(idx)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-loss shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-[9px] font-mono text-muted-foreground">PROB</Label>
                <span className="font-mono text-[11px] font-bold text-foreground">
                  {Math.round(o.probability * 100)}%
                </span>
              </div>
              <Slider
                value={[o.probability * 100]}
                onValueChange={([v]) => update(idx, { probability: v / 100 })}
                min={1}
                max={99}
                step={1}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-[9px] font-mono text-muted-foreground">PAYOUT</Label>
                <span className={`font-mono text-[11px] font-bold ${o.payoutMultiplier >= 0 ? "text-profit" : "text-loss"}`}>
                  {o.payoutMultiplier >= 0 ? "+" : ""}
                  {o.payoutMultiplier.toFixed(1)}x
                </span>
              </div>
              <Slider
                value={[o.payoutMultiplier]}
                onValueChange={([v]) => update(idx, { payoutMultiplier: Math.round(v * 10) / 10 })}
                min={-1}
                max={10}
                step={0.1}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between gap-2">
        {outcomes.length < 6 && (
          <Button
            variant="outline"
            size="sm"
            onClick={addOutcome}
            className="h-7 text-[10px] font-mono gap-1 border-dashed flex-1"
          >
            <Plus className="h-3 w-3" />
            Add Outcome
          </Button>
        )}

        {!isValid && (
          <Button
            variant="outline"
            size="sm"
            onClick={normalize}
            className="h-7 text-[10px] font-mono gap-1 flex-1"
          >
            Normalize to 100%
          </Button>
        )}
      </div>

      <div
        className={`flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-mono ${
          isValid
            ? "border-profit/30 bg-profit/5 text-profit"
            : "border-loss/30 bg-loss/5 text-loss"
        }`}
      >
        {isValid ? (
          <CheckCircle className="h-3 w-3" />
        ) : (
          <AlertTriangle className="h-3 w-3" />
        )}
        <span>
          Total: {Math.round(totalProb * 100)}%{" "}
          {isValid ? "✓" : `(${totalProb > 1 ? "over" : "under"} — normalize or adjust)`}
        </span>
      </div>
    </div>
  );
}
