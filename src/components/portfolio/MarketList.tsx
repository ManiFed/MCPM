import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { MarketConfig } from "@/lib/portfolioMath";

interface MarketListProps {
  markets: MarketConfig[];
  onChange: (markets: MarketConfig[]) => void;
}

export function MarketList({ markets, onChange }: MarketListProps) {
  const addMarket = () => {
    if (markets.length >= 5) return;
    onChange([
      ...markets,
      {
        id: crypto.randomUUID(),
        name: `Market ${markets.length + 1}`,
        probability: 0.5,
        leverage: 2,
        positionSize: 0.1,
      },
    ]);
  };

  const removeMarket = (id: string) => {
    onChange(markets.filter(m => m.id !== id));
  };

  const updateMarket = (id: string, updates: Partial<MarketConfig>) => {
    onChange(markets.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  return (
    <div className="space-y-3">
      {markets.map((m, idx) => (
        <Card key={m.id} className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Market {idx + 1}
              </CardTitle>
              {markets.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeMarket(m.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-loss">
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div>
              <Label className="text-[10px] font-mono text-muted-foreground">NAME</Label>
              <Input
                value={m.name}
                onChange={e => updateMarket(m.id, { name: e.target.value })}
                className="mt-1 font-mono text-xs bg-background/50 h-8"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-[10px] font-mono text-muted-foreground">PROBABILITY</Label>
                <span className="font-mono text-sm font-bold text-primary">{Math.round(m.probability * 100)}%</span>
              </div>
              <Slider value={[m.probability * 100]} onValueChange={([v]) => updateMarket(m.id, { probability: v / 100 })} min={1} max={99} step={1} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-[10px] font-mono text-muted-foreground">LEVERAGE</Label>
                  <span className="font-mono text-xs font-bold text-accent">{m.leverage}x</span>
                </div>
                <Slider value={[m.leverage]} onValueChange={([v]) => updateMarket(m.id, { leverage: v })} min={1} max={10} step={0.5} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-[10px] font-mono text-muted-foreground">ALLOC</Label>
                  <span className="font-mono text-xs font-bold text-accent">{Math.round(m.positionSize * 100)}%</span>
                </div>
                <Slider value={[m.positionSize * 100]} onValueChange={([v]) => updateMarket(m.id, { positionSize: v / 100 })} min={1} max={50} step={1} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {markets.length < 5 && (
        <Button variant="outline" onClick={addMarket} className="w-full h-9 font-mono text-xs gap-1.5 border-dashed">
          <Plus className="h-3.5 w-3.5" />
          Add Market
        </Button>
      )}
    </div>
  );
}
