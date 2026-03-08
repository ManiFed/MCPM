import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { MarketCard, type TrendingMarket } from "@/components/markets/MarketCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, TrendingUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const PLATFORMS = ["All", "Polymarket", "Manifold", "Metaculus"] as const;

export default function Markets() {
  const [markets, setMarkets] = useState<TrendingMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string>("All");
  const [search, setSearch] = useState("");

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-trending-markets", {
        body: {},
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setMarkets(data.markets || []);
    } catch (e: any) {
      setError(e.message || "Failed to fetch markets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const filtered = markets.filter((m) => {
    if (activePlatform !== "All" && m.platform !== activePlatform) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h1 className="font-mono text-lg font-bold text-foreground">Live Markets</h1>
            <Badge variant="outline" className="text-[9px] font-mono bg-primary/10 text-primary border-primary/20">
              {markets.length} markets
            </Badge>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Trending prediction markets from Polymarket, Manifold & Metaculus. Click Simulate to run Monte Carlo.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1.5">
            {PLATFORMS.map((p) => (
              <Button
                key={p}
                variant={activePlatform === p ? "default" : "outline"}
                size="sm"
                onClick={() => setActivePlatform(p)}
                className="h-7 text-[10px] font-mono px-3"
              >
                {p}
              </Button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search markets..."
              className="h-8 pl-8 text-xs font-mono bg-card border-border/60"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMarkets}
            disabled={loading}
            className="h-7 text-[10px] font-mono gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Content */}
        {loading && markets.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 font-mono text-xs text-muted-foreground">Loading trending markets...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20 space-y-3">
            <p className="font-mono text-xs text-loss">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchMarkets} className="font-mono text-xs">
              Try Again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-mono text-xs text-muted-foreground">No markets found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((market, i) => (
              <motion.div
                key={market.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <MarketCard market={market} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
