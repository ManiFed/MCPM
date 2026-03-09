import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { InputPanel } from "@/components/InputPanel";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { SimulationHistory } from "@/components/dashboard/SimulationHistory";
import { useSimulation } from "@/hooks/useSimulation";
import { useSimulationHistory } from "@/hooks/useSimulationHistory";
import type { SimulationParams, SimulationResult } from "@/types/simulation";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { decodeParamsFromUrl } from "@/components/dashboard/ShareModal";

const Index = () => {
  const { result, isRunning, progress, runSimulation } = useSimulation();
  const [lastParams, setLastParams] = useState<SimulationParams | null>(null);
  const [comparisonResult, setComparisonResult] = useState<SimulationResult | null>(null);
  const [searchParams] = useSearchParams();
  const { history, addEntry, updateNotes, clearHistory } = useSimulationHistory();
  const inputPanelRef = useRef<{ applyPreset: (index: number) => void; run: () => void } | null>(null);

  const sharedParams = searchParams.get("p") ? decodeParamsFromUrl(searchParams.toString()) : null;

  const marketPreFill = searchParams.get("prob") ? {
    probability: parseFloat(searchParams.get("prob")!),
    marketTitle: searchParams.get("title") || undefined,
    marketPlatform: searchParams.get("platform") || undefined,
    marketUrl: searchParams.get("url") || undefined
  } as Partial<SimulationParams> : null;

  const effectiveInitialParams = sharedParams || marketPreFill;

  useEffect(() => {
    if (result && lastParams) {
      addEntry(lastParams, result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  useEffect(() => {
    if (sharedParams && !result && !isRunning) {
      setLastParams(sharedParams);
      runSimulation(sharedParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case "r":
          e.preventDefault();
          inputPanelRef.current?.run();
          break;
        case "l":
          e.preventDefault();
          if (result) setComparisonResult(result);
          break;
        case "1":
        case "2":
        case "3":
        case "4":
          e.preventDefault();
          inputPanelRef.current?.applyPreset(parseInt(e.key) - 1);
          break;
        case "escape":
          setComparisonResult(null);
          break;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [result]);

  const handleRun = useCallback(
    (params: SimulationParams) => {
      setLastParams(params);
      runSimulation(params);
    },
    [runSimulation]
  );

  const handleLockComparison = useCallback(() => {
    if (result) setComparisonResult(result);
  }, [result]);

  const handleClearComparison = useCallback(() => {
    setComparisonResult(null);
  }, []);

  return (
    <div className="min-h-screen pb-16 md:pb-0 bg-background terminal-grid">
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
            className="space-y-3"
          >
            <Card className="p-3 md:p-4 bg-card/70 border-border/60 backdrop-blur">
              <InputPanel ref={inputPanelRef} onRunSimulation={handleRun} isRunning={isRunning} initialParams={effectiveInitialParams} />
            </Card>
            <SimulationHistory history={history} onRerun={handleRun} onClear={clearHistory} onUpdateNotes={updateNotes} />
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
                comparisonResult={comparisonResult}
                onLockComparison={handleLockComparison}
                onClearComparison={handleClearComparison}
              />
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;
