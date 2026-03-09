import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SimulationParams, SimulationResult } from "@/types/simulation";
import { SummaryStats } from "./dashboard/SummaryStats";
import { RuinGauge } from "./dashboard/RuinGauge";
import { OutcomeHistogram } from "./dashboard/OutcomeHistogram";
import { EquityFanChart } from "./dashboard/EquityFanChart";
import { ConfidenceTable } from "./dashboard/ConfidenceTable";
import { RiskRewardScatter } from "./dashboard/RiskRewardScatter";
import { AIAnalysisPanel } from "./dashboard/AIAnalysisPanel";
import { ShareModal } from "./dashboard/ShareModal";
import { RiskMetrics } from "./dashboard/RiskMetrics";
import { DrawdownChart } from "./dashboard/DrawdownChart";
import { SensitivityHeatmap } from "./dashboard/SensitivityHeatmap";
import { EquityReplay } from "./dashboard/EquityReplay";
import { StreakAnalysis } from "./dashboard/StreakAnalysis";
import { Confetti } from "./Confetti";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Activity, Download, FileText, Lock, X } from "lucide-react";
import { exportResultsToCSV } from "@/lib/csvExport";
import { exportDashboardToPDF } from "@/lib/pdfExport";
import { toast } from "sonner";

const LOADING_QUOTES = [
  "Rolling the dice 10,000 times...",
  "Calculating alternate timelines...",
  "Simulating your financial multiverse...",
  "Stress-testing your strategy...",
  "Running probability gauntlet...",
  "Crunching numbers at light speed...",
  "Exploring the space of outcomes...",
  "Channeling the ghost of Kelly...",
  "Bootstrapping reality...",
  "Computing your edge...",
];

interface ResultsDashboardProps {
  result: SimulationResult | null;
  isRunning: boolean;
  progress: number;
  params: SimulationParams | null;
  comparisonResult?: SimulationResult | null;
  onLockComparison?: () => void;
  onClearComparison?: () => void;
}

export function ResultsDashboard({ result, isRunning, progress, params, comparisonResult, onLockComparison, onClearComparison }: ResultsDashboardProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    setQuoteIndex(Math.floor(Math.random() * LOADING_QUOTES.length));
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % LOADING_QUOTES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (result && params && result.expectedValue > params.bankroll && result.probabilityOfRuin < 0.2) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 100);
      return () => clearTimeout(timer);
    }
  }, [result, params]);

  const resultVerdict = useMemo(() => {
    if (!result || !params) return null;
    const roi = (result.expectedValue - params.bankroll) / params.bankroll;
    if (roi > 0.5 && result.probabilityOfRuin < 0.1) return { emoji: "🚀", text: "Incredible edge!", color: "text-profit" };
    if (roi > 0.2 && result.probabilityOfRuin < 0.2) return { emoji: "🔥", text: "Strong strategy!", color: "text-profit" };
    if (roi > 0) return { emoji: "✅", text: "Positive expectation", color: "text-profit" };
    if (roi > -0.1) return { emoji: "⚠️", text: "Marginal edge", color: "text-accent" };
    return { emoji: "💀", text: "Negative expectation", color: "text-loss" };
  }, [result, params]);

  const handleExportPDF = async () => {
    try {
      await exportDashboardToPDF("results-dashboard", params?.marketTitle ? `MCPM — ${params.marketTitle}` : "MCPM Simulation Report");
      toast.success("PDF report opened in new tab");
    } catch {
      toast.error("Failed to generate PDF — allow popups and retry");
    }
  };

  if (isRunning) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" }, scale: { duration: 1, repeat: Infinity } }}
        >
          <Activity className="h-8 w-8 text-primary" />
        </motion.div>
        <div className="text-center">
          <p className="font-mono text-sm text-primary">SIMULATING...</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="font-mono text-xs text-muted-foreground mt-1"
            >
              {LOADING_QUOTES[quoteIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="w-72 space-y-2">
          <Progress value={progress * 100} className="h-2" />
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>{Math.round(progress * 100)}%</span>
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>
              ████░░░░
            </motion.span>
          </div>
        </div>
      </div>
    );
  }

  if (!result || !params) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="font-mono text-7xl text-muted-foreground/20"
          >
            ⟐
          </motion.div>
          <div>
            <p className="font-mono text-sm text-muted-foreground">Configure parameters and run a simulation</p>
            <p className="font-mono text-xs text-muted-foreground/50 mt-1">Results will appear here with charts & AI analysis</p>
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1 w-1 rounded-full bg-primary/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Confetti trigger={showConfetti} />
      <motion.div
        id="results-dashboard"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Results {comparisonResult ? "(B vs A)" : ""}
            </span>
            {resultVerdict && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
                className={`font-mono text-xs ${resultVerdict.color} flex items-center gap-1`}
              >
                <span className="text-base">{resultVerdict.emoji}</span>
                {resultVerdict.text}
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {comparisonResult ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 font-mono text-[10px] gap-1.5 border-loss/30 text-loss hover:bg-loss/10"
                onClick={onClearComparison}
              >
                <X className="h-3 w-3" />
                Clear A
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 font-mono text-[10px] gap-1.5 border-primary/30"
                onClick={onLockComparison}
              >
                <Lock className="h-3 w-3" />
                Lock & Compare
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 font-mono text-[10px] gap-1.5"
              onClick={() => exportResultsToCSV(result, params.bankroll)}
            >
              <Download className="h-3 w-3" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 font-mono text-[10px] gap-1.5"
              onClick={handleExportPDF}
            >
              <FileText className="h-3 w-3" />
              PDF
            </Button>
            <ShareModal params={params} result={result} />
          </div>
        </div>

        <SummaryStats result={result} bankroll={params.bankroll} comparisonResult={comparisonResult} />
        <RiskMetrics result={result} bankroll={params.bankroll} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RuinGauge probability={result.probabilityOfRuin} comparisonProbability={comparisonResult?.probabilityOfRuin} />
          <div className="lg:col-span-2">
            <OutcomeHistogram finalValues={result.finalValues} bankroll={params.bankroll} comparisonValues={comparisonResult?.finalValues} />
          </div>
        </div>

        <EquityFanChart equityCurves={result.equityCurves} comparisonCurves={comparisonResult?.equityCurves} />
        <DrawdownChart equityCurves={result.equityCurves} />
        <EquityReplay equityCurves={result.equityCurves} bankroll={params.bankroll} />

        {result.streaks && <StreakAnalysis streaks={result.streaks} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ConfidenceTable result={result} bankroll={params.bankroll} />
          <RiskRewardScatter data={result.leverageSweep} currentLeverage={params.leverage} />
        </div>

        <SensitivityHeatmap params={params} />
        <AIAnalysisPanel params={params} result={result} />
      </motion.div>
    </>
  );
}
