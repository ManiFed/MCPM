import { useState, useCallback } from "react";
import { InputPanel } from "@/components/InputPanel";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { useSimulation } from "@/hooks/useSimulation";
import type { SimulationParams } from "@/types/simulation";
import { Activity } from "lucide-react";

const Index = () => {
  const { result, isRunning, progress, runSimulation } = useSimulation();
  const [lastParams, setLastParams] = useState<SimulationParams | null>(null);

  const handleRun = useCallback(
    (params: SimulationParams) => {
      setLastParams(params);
      runSimulation(params);
    },
    [runSimulation]
  );

  return (
    <div className="min-h-screen bg-background terminal-grid scanline">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="font-mono text-sm font-bold tracking-wider text-foreground">
            LEVERAGE SIM
          </h1>
          <span className="font-mono text-[10px] text-muted-foreground ml-1">
            Monte Carlo Prediction Market Simulator
          </span>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Input Panel */}
          <aside className="w-full lg:w-80 xl:w-96 shrink-0">
            <InputPanel onRunSimulation={handleRun} isRunning={isRunning} />
          </aside>

          {/* Results Dashboard */}
          <main className="flex-1 min-w-0">
            <ResultsDashboard
              result={result}
              isRunning={isRunning}
              progress={progress}
              params={lastParams}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
