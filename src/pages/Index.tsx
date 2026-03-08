import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { InputPanel } from "@/components/InputPanel";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { useSimulation } from "@/hooks/useSimulation";
import type { SimulationParams } from "@/types/simulation";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { decodeParamsFromUrl } from "@/components/dashboard/ShareModal";

const Index = () => {
  const { result, isRunning, progress, runSimulation } = useSimulation();
  const [lastParams, setLastParams] = useState<SimulationParams | null>(null);
  const [searchParams] = useSearchParams();

  // Decode shared URL params on mount
  const sharedParams = searchParams.get("p") ? decodeParamsFromUrl(searchParams.toString()) : null;

  // Auto-run if shared params detected
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
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="max-w-[1400px] mx-auto p-4 md:p-6">
        <div className="mb-4">
          <h2 className="font-mono text-sm text-foreground">Simulation Workspace</h2>
          <p className="text-xs text-muted-foreground">
            Configure assumptions, run Monte Carlo, and inspect risk/return distributions.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4 md:gap-5 items-start">
          <Card className="p-3 md:p-4 bg-card/70 border-border/60">
            <InputPanel onRunSimulation={handleRun} isRunning={isRunning} initialParams={sharedParams} />
          </Card>

          <Card className="p-3 md:p-4 bg-card/70 border-border/60 min-h-[500px]">
            <ResultsDashboard
              result={result}
              isRunning={isRunning}
              progress={progress}
              params={lastParams}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
