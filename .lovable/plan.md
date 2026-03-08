

# Sick Features Expansion Plan

## 1. Sensitivity Heatmap
A 2D heatmap on the results dashboard showing expected return (or ruin probability) across a grid of probability vs. position size combinations. Lets you instantly see the "safe zone" and "danger zone" for your strategy.

- New `src/components/dashboard/SensitivityHeatmap.tsx` -- renders a color-coded grid (green to red) using Recharts or a custom canvas
- Computes a 10x10 grid of mini-simulations (reduced sim count ~500 each) in the existing web worker
- Extend `monteCarlo.worker.ts` to accept a `type: "sensitivity"` message
- Add to `ResultsDashboard.tsx` between the confidence table and AI panel

## 2. Drawdown Timeline Chart
Shows max drawdown depth over time across all simulated paths -- not just the final number but *when* drawdowns happen and how deep they go.

- New `src/components/dashboard/DrawdownChart.tsx` -- area chart showing percentile bands of drawdown depth at each bet step
- Compute drawdown series in `simulationMath.ts` alongside equity curves (return drawdown curves from `runMonteCarlo`)
- Add to results dashboard below equity fan chart

## 3. Strategy Comparison Mode
Side-by-side comparison of two parameter sets on the same charts. Run sim A, lock it, tweak params, run sim B, see both overlaid.

- Add `comparisonResult` state to `Index.tsx` alongside existing `result`
- New "Lock & Compare" button in results header that saves current result as comparison baseline
- Update `EquityFanChart`, `OutcomeHistogram`, and `SummaryStats` to accept an optional second dataset and render overlaid/side-by-side
- Color-code: primary green for current, blue/purple for comparison
- "Clear Comparison" button to reset

## 4. Animated Equity Path Replay
A "Play" button on the equity fan chart that animates a single random path stepping through bets in real-time, showing the bet-by-bet drama.

- New `src/components/dashboard/EquityReplay.tsx` -- picks one equity curve and animates it step-by-step using `requestAnimationFrame`
- Play/pause/speed controls (1x, 2x, 5x)
- Shows current equity, current bet number, running P&L as the line draws
- Integrates as a toggle mode within the existing `EquityFanChart` card

## 5. Risk Metrics Deep Dive Panel
Expandable panel showing advanced risk metrics: Value at Risk (VaR), Conditional VaR (CVaR/Expected Shortfall), Sortino Ratio, Calmar Ratio, and win rate.

- New `src/components/dashboard/RiskMetrics.tsx` -- collapsible card with computed metrics
- Add `computeAdvancedMetrics(finalValues, equityCurves, bankroll)` to `simulationMath.ts`
- VaR at 5% and 1%, CVaR, Sortino (downside deviation only), Calmar (return / max drawdown), win rate
- Add below SummaryStats in the dashboard

## 6. Keyboard Shortcuts & Command Palette
`Cmd+K` opens a command palette (using existing `cmdk` dependency) for quick actions: run simulation, navigate pages, toggle comparison, export snapshot.

- New `src/components/CommandPalette.tsx` using the `cmdk` package already installed
- Register global keydown listener for `Cmd+K` / `Ctrl+K`
- Actions: Run Simulation, Go to Backtest, Go to Portfolio, Go to Methodology, Export Snapshot, Clear Results
- Mount in `App.tsx`

## 7. Mobile-Responsive Overhaul
Current layout breaks on mobile. Full responsive pass:

- `AppHeader.tsx`: hamburger menu on mobile with slide-out nav drawer (use Sheet component)
- `Index.tsx`: stack input panel above results on mobile (already `grid-cols-1` but needs spacing/sizing tweaks)
- All chart components: reduce height on mobile, hide less-important axis labels
- Touch-friendly sliders and larger tap targets

## 8. Export to CSV
Download simulation results as CSV for external analysis.

- New export button in results dashboard header next to Share
- Generates CSV with columns: simulation_id, final_value, return_pct
- Uses `Blob` + `URL.createObjectURL` for download
- Add to `ResultsDashboard.tsx` header area

---

## Implementation Order

```text
Phase 1 (quick wins):
  - Risk Metrics Deep Dive
  - Export to CSV
  - Command Palette

Phase 2 (visual impact):
  - Drawdown Timeline Chart
  - Sensitivity Heatmap
  - Animated Equity Replay

Phase 3 (power features):
  - Strategy Comparison Mode
  - Mobile-Responsive Overhaul
```

## Files to Create
- `src/components/dashboard/SensitivityHeatmap.tsx`
- `src/components/dashboard/DrawdownChart.tsx`
- `src/components/dashboard/RiskMetrics.tsx`
- `src/components/dashboard/EquityReplay.tsx`
- `src/components/CommandPalette.tsx`

## Files to Modify
- `src/lib/simulationMath.ts` -- advanced metrics, drawdown series, sensitivity grid
- `src/workers/monteCarlo.worker.ts` -- sensitivity sweep message type
- `src/components/ResultsDashboard.tsx` -- add new panels, CSV export, comparison support
- `src/components/dashboard/EquityFanChart.tsx` -- replay toggle, comparison overlay
- `src/components/dashboard/OutcomeHistogram.tsx` -- comparison overlay
- `src/components/dashboard/SummaryStats.tsx` -- comparison column
- `src/components/AppHeader.tsx` -- mobile hamburger menu
- `src/pages/Index.tsx` -- comparison state management
- `src/App.tsx` -- mount CommandPalette

