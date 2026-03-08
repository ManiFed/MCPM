import { AppHeader } from "@/components/AppHeader";
import { BacktestInputPanel } from "@/components/backtest/BacktestInputPanel";

const Backtest = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-[1400px] mx-auto p-4 md:p-6">
        <div className="mb-4">
          <h2 className="font-mono text-sm text-foreground">Backtest Mode</h2>
          <p className="text-xs text-muted-foreground">
            Define a probability path and replay how a leveraged strategy would have performed.
          </p>
        </div>
        <BacktestInputPanel />
      </div>
    </div>
  );
};

export default Backtest;
