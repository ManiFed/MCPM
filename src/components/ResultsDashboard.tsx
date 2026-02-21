import { motion } from "framer-motion";
import type { SimulationParams, SimulationResult } from "@/types/simulation";
import { SummaryStats } from "./dashboard/SummaryStats";
import { RuinGauge } from "./dashboard/RuinGauge";
import { OutcomeHistogram } from "./dashboard/OutcomeHistogram";
import { EquityFanChart } from "./dashboard/EquityFanChart";
import { ConfidenceTable } from "./dashboard/ConfidenceTable";
import { RiskRewardScatter } from "./dashboard/RiskRewardScatter";
import { AIAnalysisPanel } from "./dashboard/AIAnalysisPanel";
import { Progress } from "@/components/ui/progress";

interface ResultsDashboardProps {
  result: SimulationResult | null;
  isRunning: boolean;
  progress: number;
  params: SimulationParams | null;
}

export function ResultsDashboard({ result, isRunning, progress, params }: ResultsDashboardProps) {
  if (isRunning) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6">
        <div className="text-center">
          <p className="font-mono text-sm text-primary animate-pulse">SIMULATING...</p>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            {Math.round(progress * 100)}% complete
          </p>
        </div>
        <div className="w-64">
          <Progress value={progress * 100} className="h-1.5" />
        </div>
      </div>
    );
  }

  if (!result || !params) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="font-mono text-6xl text-muted-foreground/20">⟐</div>
          <p className="font-mono text-sm text-muted-foreground">
            Configure parameters and run a simulation
          </p>
          <p className="font-mono text-xs text-muted-foreground/50">
            Results will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <SummaryStats result={result} bankroll={params.bankroll} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RuinGauge probability={result.probabilityOfRuin} />
        <div className="lg:col-span-2">
          <OutcomeHistogram finalValues={result.finalValues} bankroll={params.bankroll} />
        </div>
      </div>

      <EquityFanChart equityCurves={result.equityCurves} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ConfidenceTable result={result} bankroll={params.bankroll} />
        <RiskRewardScatter data={result.leverageSweep} currentLeverage={params.leverage} />
      </div>

      <AIAnalysisPanel params={params} result={result} />
    </motion.div>
  );
}
