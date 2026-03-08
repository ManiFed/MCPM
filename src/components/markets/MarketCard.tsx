import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Play, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface TrendingMarket {
  id: string;
  title: string;
  probability: number;
  volume: number | null;
  platform: string;
  url: string;
  category?: string;
  endDate?: string;
}

function formatVolume(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function getProbColor(p: number): string {
  if (p >= 0.7) return "text-profit";
  if (p <= 0.3) return "text-loss";
  return "text-accent";
}

function getPlatformColor(platform: string): string {
  switch (platform) {
    case "Polymarket": return "bg-chart-4/15 text-chart-4 border-chart-4/30";
    case "Manifold": return "bg-chart-5/15 text-chart-5 border-chart-5/30";
    case "Metaculus": return "bg-accent/15 text-accent border-accent/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

export function MarketCard({ market }: { market: TrendingMarket }) {
  const navigate = useNavigate();
  const probPct = (market.probability * 100).toFixed(0);

  const handleSimulate = () => {
    const params = new URLSearchParams({
      prob: market.probability.toString(),
      title: market.title,
      platform: market.platform,
      url: market.url,
    });
    navigate(`/?${params.toString()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group relative overflow-hidden border-border/60 bg-card/80 hover:border-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.08)] transition-all duration-300">
        <div className="p-4 space-y-3">
          {/* Header: platform + category */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-[9px] font-mono uppercase tracking-wider ${getPlatformColor(market.platform)}`}>
              {market.platform}
            </Badge>
            {market.category && (
              <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                {market.category}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-mono text-xs font-medium text-card-foreground leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {market.title}
          </h3>

          {/* Probability display */}
          <div className="flex items-center gap-3">
            <div className={`font-mono text-2xl font-bold ${getProbColor(market.probability)}`}>
              {probPct}%
            </div>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary/80"
                initial={{ width: 0 }}
                animate={{ width: `${market.probability * 100}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
            {market.volume != null && (
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {market.platform === "Metaculus" ? `${market.volume} forecasters` : formatVolume(market.volume)}
              </span>
            )}
            {market.endDate && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(market.endDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleSimulate}
              className="flex-1 h-8 text-[10px] font-mono gap-1.5"
            >
              <Play className="h-3 w-3" />
              Simulate
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <a href={market.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
