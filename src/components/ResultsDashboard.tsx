import { motion } from "framer-motion";
import type { SimulationParams, SimulationResult } from "@/types/simulation";
import { SummaryStats } from "./dashboard/SummaryStats";
import { RuinGauge } from "./dashboard/RuinGauge";
import { OutcomeHistogram } from "./dashboard/OutcomeHistogram";
import { EquityFanChart } from "./dashboard/EquityFanChart";
import { ConfidenceTable } from "./dashboard/ConfidenceTable";
import { RiskRewardScatter } from "./dashboard/RiskRewardScatter";
import { AIAnalysisPanel } from "./dashboard/AIAnalysisPanel";
import { ShareModal } from "./dashboard/ShareModal";
import { Progress } from "@/components/ui/progress";
import { Activity } from "lucide-react";

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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Activity className="h-8 w-8 text-primary" />
        </motion.div>
        <div className="text-center">
          <p className="font-mono text-sm text-primary">SIMULATING...</p>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            {Math.round(progress * 100)}% · Running Monte Carlo paths
          </p>
        </div>
        <div className="w-72">
          <Progress value={progress * 100} className="h-2" />
        </div>
      </div>
    );
  }

  if (!result || !params) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="font-mono text-7xl text-muted-foreground/20"
          >
            ⟐
          </motion.div>
          <div>
            <p className="font-mono text-sm text-muted-foreground">
              Configure parameters and run a simulation
            </p>
            <p className="font-mono text-xs text-muted-foreground/50 mt-1">
              Results will appear here with charts & AI analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Results</span>
        </div>
        <ShareModal params={params} result={result} />
      </div>

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
