

# More Sick Features -- Plan

## 1. Strategy Comparison Mode (Lock & Compare)
Run simulation A, lock results, tweak params, run simulation B -- see both overlaid on every chart.

- Add `comparisonResult` + `comparisonParams` state in `Index.tsx`
- "Lock & Compare" button in `ResultsDashboard` header saves current result as baseline
- "Clear Comparison" button resets
- Update `SummaryStats` to show delta columns (A vs B)
- Update `EquityFanChart` to overlay two median lines (green vs purple)
- Update `OutcomeHistogram` to show dual distributions
- Update `RuinGauge` to show both probabilities

## 2. Scenario Presets
One-click preset buttons that auto-fill common strategies: "Conservative", "Kelly Optimal", "Aggressive Degen", "Coin Flip".

- Add preset buttons row above the Run button in `InputPanel.tsx`
- Each preset sets probability, leverage, position size, bankroll, and num bets
- Kelly preset auto-computes optimal position size from current probability

## 3. Profit Target & Stop Loss
Let users set a profit target (e.g. 2x bankroll) and stop loss (e.g. 0.5x bankroll) that terminate paths early.

- Add `profitTarget` and `stopLoss` optional fields to `SimulationParams`
- Add two new sliders in `InputPanel` under a collapsible "Risk Controls" section
- Modify `runSinglePath` in `simulationMath.ts` to break early when equity hits target or stop
- Show "% paths hit target" and "% paths hit stop" in `SummaryStats`

## 4. Win Streak / Loss Streak Analysis
Show the distribution of max consecutive wins and losses across simulations.

- Compute streak data in `simulationMath.ts` during `runSinglePath` (track consecutive win/loss counts)
- New `src/components/dashboard/StreakAnalysis.tsx` -- dual bar chart showing max win streak and max loss streak distributions
- Add to `ResultsDashboard` after RiskMetrics

## 5. Saved Simulations History
Auto-save each simulation run to local storage with timestamp. Users can recall and compare past runs.

- New `src/hooks/useSimulationHistory.ts` -- saves params + summary stats (not full curves) to localStorage
- New `src/components/dashboard/SimulationHistory.tsx` -- dropdown/drawer listing past runs with key stats
- Click to re-run with those params
- Max 20 entries, FIFO eviction

## 6. Edge Calculator
Show the mathematical edge of the current setup: expected value per bet, breakeven probability, and how far the user's probability estimate is from breakeven.

- New `src/components/input/EdgeCalculator.tsx` -- compact card below Kelly indicator
- Formulas: `edge = (prob * payout) - (1-prob)`, `breakeven = 1 / (1 + payoutRatio)`
- Color-coded: green if positive edge, red if negative

---

## Implementation Order

```text
Phase 1 (quick wins, high impact):
  - Scenario Presets
  - Edge Calculator  
  - Profit Target & Stop Loss

Phase 2 (visual/analytical):
  - Win/Loss Streak Analysis
  - Strategy Comparison Mode

Phase 3 (quality of life):
  - Saved Simulations History
```

## Files to Create
- `src/components/input/EdgeCalculator.tsx`
- `src/components/dashboard/StreakAnalysis.tsx`
- `src/hooks/useSimulationHistory.ts`
- `src/components/dashboard/SimulationHistory.tsx`

## Files to Modify
- `src/types/simulation.ts` -- add profitTarget, stopLoss, streak types
- `src/lib/simulationMath.ts` -- early exit logic, streak tracking, return new fields
- `src/components/InputPanel.tsx` -- presets row, risk controls section, edge calculator
- `src/components/ResultsDashboard.tsx` -- comparison overlay, streak chart, history access
- `src/components/dashboard/SummaryStats.tsx` -- comparison columns, target/stop hit rates
- `src/components/dashboard/EquityFanChart.tsx` -- dual overlay for comparison
- `src/components/dashboard/OutcomeHistogram.tsx` -- dual histogram
- `src/components/dashboard/RuinGauge.tsx` -- dual display
- `src/pages/Index.tsx` -- comparison state, history hook
- `src/workers/monteCarlo.worker.ts` -- pass through new params

