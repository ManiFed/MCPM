
# MCPM Feature Expansion Plan

## Overview
Four new features to transform MCPM from a single-simulation tool into a comprehensive prediction market analytics platform.

---

## Feature 1: Kelly Criterion Overlay

**What it does:** Shows the mathematically optimal position size (Kelly fraction) directly on the input panel, so you can see how your chosen position size compares to the theoretical optimum.

**User experience:**
- A small info card appears below the Position Size slider showing the Kelly-optimal bet size
- Color-coded indicator: green if you're at or below Kelly, amber if slightly above, red if dangerously over-Kelly
- Tooltip explaining why betting above Kelly is risky long-term

**Implementation:**
- Add a `computeKellyFraction(probability, leverage)` utility to `simulationMath.ts`
- Kelly formula for binary bets: `f* = (p * (payoutRatio) - (1 - p)) / payoutRatio` adjusted for leverage
- Add a `KellyIndicator` component rendered inside `InputPanel` below the position size slider
- No backend changes needed -- pure client-side math

---

## Feature 2: Backtest Mode

**What it does:** A new `/backtest` page where you define a probability path (e.g., a market that moved from 30% to 80% over 50 steps) and see how a leveraged strategy would have performed bet-by-bet along that path.

**User experience:**
- New "Backtest" nav link in the header
- Input: draw or define a probability curve (start %, end %, volatility, number of steps) using sliders
- A preset library of common patterns (steady climb, spike & crash, mean-reversion)
- Configure the same leverage/position-size params as the simulator
- Results show: equity curve over the path, total return, max drawdown, per-step P&L bar chart

**Implementation:**
- New route `/backtest` in `App.tsx`
- New page `src/pages/Backtest.tsx` with its own input panel and results area
- New `src/lib/backtestMath.ts`:
  - `generateProbabilityPath(startProb, endProb, steps, volatility, pattern)` -- creates an array of probabilities
  - `runBacktest(path, leverage, positionSize, bankroll)` -- deterministic simulation along the path, returns equity curve and stats
- New components:
  - `src/components/backtest/BacktestInputPanel.tsx` -- path config + strategy params
  - `src/components/backtest/BacktestResults.tsx` -- equity curve chart, P&L bars, summary stats
  - `src/components/backtest/ProbabilityPathChart.tsx` -- visualize the input probability path
- Reuses existing chart patterns (Recharts) and card styling

---

## Feature 3: Shareable Snapshot Reports

**What it does:** Generates a shareable link or downloadable image of your simulation results, including key stats, chart thumbnails, and market info.

**User experience:**
- A "Share" button appears in the results dashboard after running a simulation
- Clicking it opens a modal with two options:
  1. **Copy Link** -- saves the simulation config as URL query params so anyone can re-run the same scenario
  2. **Download Image** -- renders a styled summary card as a PNG using `html2canvas`
- The snapshot includes: market name, probability, leverage, position size, EV, median, ruin %, and a mini equity fan chart

**Implementation:**
- Install `html2canvas` for PNG export
- New `src/components/dashboard/ShareModal.tsx`:
  - Encodes `SimulationParams` into URL search params for link sharing
  - Renders a styled "report card" div and captures it as an image
- Update `src/pages/Index.tsx` to read URL search params on load and auto-populate inputs + run simulation
- Update `ResultsDashboard.tsx` to include the Share button in the header
- New `src/components/dashboard/SnapshotCard.tsx` -- the styled card that gets rendered to PNG

---

## Feature 4: Multi-Market Portfolio Mode

**What it does:** Simulate 2-5 prediction markets simultaneously to see combined portfolio risk, diversification benefits, and aggregate ruin probability.

**User experience:**
- New "Portfolio" nav link in the header, route `/portfolio`
- Add multiple markets, each with its own probability, leverage, and position size
- Shared bankroll across all positions
- Run button triggers a combined Monte Carlo: each simulation step resolves all bets, and the portfolio equity reflects correlated outcomes
- Results show: portfolio equity fan chart, per-market contribution breakdown, portfolio-level ruin probability vs individual ruin probabilities, diversification benefit metric

**Implementation:**
- New route `/portfolio` in `App.tsx`
- New page `src/pages/Portfolio.tsx`
- New `src/lib/portfolioMath.ts`:
  - `runPortfolioMonteCarlo(markets[], bankroll, numSims, numBets)` -- runs combined simulation where each step resolves all market bets from the shared bankroll
  - Each market has independent probability but shares equity
- New worker or extend existing worker to handle portfolio simulation
- New components:
  - `src/components/portfolio/MarketList.tsx` -- add/remove/edit markets
  - `src/components/portfolio/MarketCard.tsx` -- compact card for each market's params
  - `src/components/portfolio/PortfolioResults.tsx` -- combined dashboard
  - `src/components/portfolio/DiversificationChart.tsx` -- compare individual vs portfolio ruin

---

## Implementation Order

```text
Phase 1: Kelly Criterion Overlay
  - Smallest scope, highest immediate value
  - Pure frontend, no new routes

Phase 2: Backtest Mode  
  - New page with deterministic math
  - No backend dependency

Phase 3: Shareable Snapshots
  - Adds html2canvas dependency
  - URL param encoding for link sharing

Phase 4: Multi-Market Portfolio
  - Most complex, builds on existing simulation engine
  - New worker logic for correlated portfolio simulation
```

---

## Technical Details

### New files to create:
- `src/lib/kellyMath.ts`
- `src/components/input/KellyIndicator.tsx`
- `src/pages/Backtest.tsx`
- `src/lib/backtestMath.ts`
- `src/components/backtest/BacktestInputPanel.tsx`
- `src/components/backtest/BacktestResults.tsx`
- `src/components/backtest/ProbabilityPathChart.tsx`
- `src/components/dashboard/ShareModal.tsx`
- `src/components/dashboard/SnapshotCard.tsx`
- `src/pages/Portfolio.tsx`
- `src/lib/portfolioMath.ts`
- `src/workers/portfolio.worker.ts`
- `src/components/portfolio/MarketList.tsx`
- `src/components/portfolio/MarketCard.tsx`
- `src/components/portfolio/PortfolioResults.tsx`
- `src/components/portfolio/DiversificationChart.tsx`
- `src/hooks/useBacktest.ts`
- `src/hooks/usePortfolioSimulation.ts`

### Files to modify:
- `src/App.tsx` -- add `/backtest` and `/portfolio` routes
- `src/components/AppHeader.tsx` -- add Backtest and Portfolio nav links
- `src/components/InputPanel.tsx` -- add Kelly indicator
- `src/components/ResultsDashboard.tsx` -- add Share button
- `src/pages/Index.tsx` -- read URL params for shared snapshots
- `src/types/simulation.ts` -- add backtest and portfolio types

### New dependency:
- `html2canvas` -- for PNG snapshot export

### No backend/database changes needed:
All four features are client-side computation and UI. No new tables, edge functions, or API routes required.
