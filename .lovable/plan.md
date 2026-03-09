

# More Features Plan

## What's Already Built
Simulator with Monte Carlo engine, equity fan charts, ruin gauge, histograms, AI bull/bear analysis, streak analysis, sensitivity heatmap, edge calculator, bet size optimizer, Kelly indicator, scenario presets, profit target/stop loss, Lock & Compare mode, simulation history, backtest mode, portfolio mode with correlations, live markets dashboard, equity replay with sound, shareable strategy cards, confetti, animated counters.

## New Features to Add

### 1. Keyboard Shortcuts & Power User Mode
- Add keyboard shortcuts beyond ⌘K: `R` to run simulation, `L` to lock comparison, `1-4` for presets, `Esc` to clear
- Show a shortcuts cheat sheet in the command palette
- Add to `Index.tsx` with a `useEffect` keydown listener

### 2. Dark/Light Theme Toggle
- Add a theme toggle button in `AppHeader.tsx` using `next-themes` (already installed)
- Wrap app in `ThemeProvider` in `App.tsx`
- Update `index.html` with class-based theme switching
- All existing Tailwind classes already support dark mode via CSS variables

### 3. Mobile-Optimized Bottom Navigation
- Replace the hidden mobile nav with a fixed bottom tab bar on small screens
- Sticky bottom bar with icons for Simulator, Markets, Backtest, Portfolio
- Add to `AppHeader.tsx` with responsive classes

### 4. PDF Report Export
- "Export PDF" button in ResultsDashboard that captures all charts and stats into a downloadable report
- Use `html2canvas` (already installed) to screenshot chart sections, then compose into a printable layout
- New `src/lib/pdfExport.ts` utility

### 5. Scenario Journaling / Notes
- Let users attach text notes to simulation runs in the history
- Add a `notes` field to `useSimulationHistory` entries
- Small textarea in `SimulationHistory.tsx` that saves per-entry

### 6. Real-Time Probability Tracker
- On the main simulator, show a small live-updating badge next to the probability slider when a market URL is loaded
- Poll the scrape endpoint every 60s to check if probability has drifted
- Show delta indicator: "↑2% since loaded" in green/red
- Add to `InputPanel.tsx` with a `useEffect` interval

### 7. Quick Stat Tooltips with Explanations
- Wrap every metric in `SummaryStats`, `RiskMetrics`, `ConfidenceTable` with info tooltips explaining what each number means in plain English
- Educational glossary for non-quant users
- Use existing `Tooltip` component from shadcn

---

## Implementation Priority

```text
Phase 1 (quick wins):
  - Keyboard Shortcuts
  - Quick Stat Tooltips
  - Dark/Light Theme Toggle

Phase 2 (UX polish):
  - Mobile Bottom Navigation
  - Scenario Journaling
  - Real-Time Probability Tracker

Phase 3 (export):
  - PDF Report Export
```

## Files to Create
- `src/lib/pdfExport.ts`

## Files to Modify
- `src/App.tsx` — ThemeProvider wrapper
- `src/components/AppHeader.tsx` — theme toggle, bottom nav bar
- `src/pages/Index.tsx` — keyboard shortcut listeners
- `src/components/CommandPalette.tsx` — shortcuts cheat sheet
- `src/components/InputPanel.tsx` — live probability tracker
- `src/components/dashboard/SummaryStats.tsx` — info tooltips
- `src/components/dashboard/RiskMetrics.tsx` — info tooltips
- `src/components/dashboard/ConfidenceTable.tsx` — info tooltips
- `src/components/ResultsDashboard.tsx` — PDF export button
- `src/hooks/useSimulationHistory.ts` — notes field
- `src/components/dashboard/SimulationHistory.tsx` — notes UI
- `index.html` — theme class support

