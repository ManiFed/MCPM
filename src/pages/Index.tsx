import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { InputPanel } from "@/components/InputPanel";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { useSimulation } from "@/hooks/useSimulation";
import type { SimulationParams } from "@/types/simulation";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { decodeParamsFromUrl } from "@/components/dashboard/ShareModal";
import { Activity, Zap, Shield, BarChart3 } from "lucide-react";

const Index = () => {
  const { result, isRunning, progress, runSimulation } = useSimulation();
  const [lastParams, setLastParams] = useState<SimulationParams | null>(null);
  const [searchParams] = useSearchParams();

  const sharedParams = searchParams.get("p") ? decodeParamsFromUrl(searchParams.toString()) : null;

  useEffect(() => {
    if (sharedParams && !result && !isRunning) {
      setLastParams(sharedParams);
      runSimulation(sharedParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRun = useCallback(
    (params: SimulationParams) => {
      setLastParams(params);
      runSimulation(params);
    },
    [runSimulation]
  );

  return (
    <div className="min-h-screen bg-background terminal-grid">
      <AppHeader />

      <div className="max-w-[1400px] mx-auto p-4 md:p-6">
        <AnimatePresence mode="wait">
          {!result && !isRunning && !lastParams ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="mb-6"
            >
              <div className="text-center py-6 md:py-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-4"
                >
                  <Zap className="h-3 w-3 text-primary" />
                  <span className="font-mono text-[10px] text-primary uppercase tracking-widest">Monte Carlo Engine</span>
                </motion.div>
                
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="font-mono text-2xl md:text-3xl font-bold text-foreground mb-2"
                >
                  Simulate. Analyze. <span className="text-primary">Profit.</span>
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.5 }}
                  className="text-sm text-muted-foreground max-w-md mx-auto"
                >
                  Run thousands of Monte Carlo simulations on prediction markets to quantify your edge and manage risk.
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex items-center justify-center gap-6 mt-6"
                >
                  {[
                    { icon: Activity, label: "50K+ Sims", sub: "per run" },
                    { icon: Shield, label: "Ruin Analysis", sub: "built-in" },
                    { icon: BarChart3, label: "AI Insights", sub: "powered" },
                  ].map((feat, i) => (
                    <div key={feat.label} className="flex items-center gap-2 text-left">
                      <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
                        <feat.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-mono text-xs font-semibold text-foreground">{feat.label}</div>
                        <div className="font-mono text-[9px] text-muted-foreground">{feat.sub}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="workspace-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4"
            >
              <h2 className="font-mono text-sm text-foreground">Simulation Workspace</h2>
              <p className="text-xs text-muted-foreground">
                Configure assumptions, run Monte Carlo, and inspect risk/return distributions.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4 md:gap-5 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="p-3 md:p-4 bg-card/70 border-border/60 backdrop-blur">
              <InputPanel onRunSimulation={handleRun} isRunning={isRunning} initialParams={sharedParams} />
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="p-3 md:p-4 bg-card/70 border-border/60 backdrop-blur min-h-[500px]">
              <ResultsDashboard
                result={result}
                isRunning={isRunning}
                progress={progress}
                params={lastParams}
              />
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;
