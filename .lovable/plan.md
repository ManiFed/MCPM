
# Cool New Features Plan

Here's a set of high-impact features that would take this tool to the next level:

## 1. Real-Time Leaderboard & Public Profiles
Save simulation results to the database. Users can optionally publish their best strategies to a public leaderboard showing Sharpe ratio, ruin probability, and expected return. Gamifies the tool and drives engagement.

- New database tables: `profiles`, `published_strategies`
- New page: `/leaderboard`
- Auth required to publish (email signup/login)

## 2. Correlation-Aware Portfolio Sim
The current portfolio mode treats markets as independent. Add a correlation matrix so users can model how correlated market outcomes affect combined risk -- essential for real portfolio management.

- Add correlation coefficient inputs between each market pair in Portfolio mode
- Update `portfolioMath.ts` to use correlated random draws (Cholesky decomposition)
- Visualize the correlation matrix as a heatmap

## 3. Bet Sizing Optimizer
Given a target ruin probability (e.g. < 5%), automatically find the optimal position size. Essentially a "reverse Kelly" that respects the user's risk tolerance.

- New component: `BetSizeOptimizer.tsx`
- Binary search over position sizes, running mini Monte Carlo at each step
- Output: recommended position size + expected return at that risk level

## 4. Live Market Dashboard
Auto-fetch trending markets from Polymarket/Manifold and display them in a browsable grid. One click populates the simulator with that market's probability.

- New page: `/markets`
- Edge function to periodically scrape top markets
- Card grid UI with probability badges, volume, and "Simulate" buttons

## 5. Animated Equity Replay with Sound
Turn the equity replay into a more immersive experience -- add playback speed controls (0.5x/1x/2x/4x), a visible bet counter, and optional tick sounds for wins/losses.

- Enhance `EquityReplay.tsx` with speed controls and a bet-by-bet step mode
- Add subtle audio feedback (optional toggle)
- Show running P&L and current streak during replay

## 6. Shareable Strategy Cards (OG Image)
When sharing a simulation via URL, generate a rich preview image (Open Graph) showing key stats. Makes sharing on Twitter/Discord look professional.

- Edge function that renders an SVG/PNG strategy card with stats
- Update `ShareModal.tsx` to copy a link with OG meta tags
- Include: Sharpe, ruin %, median return, position size, probability

---

## Implementation Priority

```text
Phase 1 (high impact, moderate effort):
  - Bet Sizing Optimizer
  - Correlation-Aware Portfolio
  - Equity Replay Enhancements

Phase 2 (engagement & growth):
  - Live Market Dashboard
  - Shareable Strategy Cards

Phase 3 (community):
  - Leaderboard & Public Profiles (requires auth)
```

## Summary of New Files
- `src/components/input/BetSizeOptimizer.tsx`
- `src/pages/Markets.tsx`
- `src/components/markets/MarketCard.tsx`
- `supabase/functions/fetch-trending-markets/index.ts`

## Files to Modify
- `src/lib/portfolioMath.ts` -- correlated draws via Cholesky
- `src/components/portfolio/MarketList.tsx` -- correlation matrix UI
- `src/components/dashboard/EquityReplay.tsx` -- speed controls, step mode
- `src/components/InputPanel.tsx` -- optimizer integration
- `src/components/dashboard/ShareModal.tsx` -- OG card link
- `src/App.tsx` -- new routes
