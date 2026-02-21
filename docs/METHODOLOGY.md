# MCPM Methodology (Math + Simulation Model)

This document explains the math used by MCPM and the assumptions implemented in code.

## 1) Core model

Each simulation path starts with bankroll \(B_0\). For each bet step \(t\):

- User probability input: \(p \in (0,1)\)
- Position size fraction: \(f \in (0,1]\)
- Leverage: \(L \ge 1\)
- Effective notional fraction: \(n = fL\)
- **Risk capital per bet**: \(R_t = B_t \cdot \min(1, n)\)

The `min(1, n)` cap is critical: a single loss cannot exceed current equity.

### Win/Loss update

MCPM assumes fair binary odds implied by \(p\):

- Profit multiplier on stake if win: \(\frac{1-p}{p}\)
- Loss if lose: full risk amount \(R_t\)

So:

- If win: \(B_{t+1} = B_t + R_t\frac{1-p}{p}\)
- If lose: \(B_{t+1} = B_t - R_t\)

## 2) Why this is fair odds

Expected PnL per step at fair odds:

\[
\mathbb{E}[\Delta B_t] = p\cdot R_t\frac{1-p}{p} - (1-p)\cdot R_t = 0.
\]

So the process is zero-edge before fees/slippage.

## 3) Monte Carlo outputs

For \(N\) independent paths with final bankrolls \(F_i\):

- **Expected value**: \(\frac{1}{N}\sum_i F_i\)
- **Mean return**: \(\frac{1}{N}\sum_i \frac{F_i - B_0}{B_0}\)
- **Median outcome**: 50th percentile of \(\{F_i\}\)
- **Probability of ruin**: \(\frac{1}{N}\sum_i \mathbf{1}[F_i \le 0]\)

### Percentiles

Percentile index is `floor((p/100) * (N - 1))` on sorted outcomes.

### Max drawdown

For each stored equity curve, if running peak is \(P_t\):

\[
DD_t = \frac{P_t - B_t}{P_t}, \quad \text{MaxDD} = \max_t DD_t.
\]

MCPM reports the worst drawdown observed across stored curves.

### Sharpe-like ratio

Using final-path returns \(r_i = \frac{F_i - B_0}{B_0}\):

\[
\bar r = \frac{1}{N}\sum_i r_i, \quad
\sigma_r = \sqrt{\frac{1}{N}\sum_i (r_i-\bar r)^2}, \quad
\text{Sharpe-like} = \frac{\bar r}{\sigma_r}.
\]

(Zero risk-free rate; cross-sectional, not time-series Sharpe.)

## 4) Leverage risk/reward chart

The dashboard now computes actual mini-simulations for leverage levels `[1, 2, 3, 5, 7, 10]` while keeping all other parameters fixed.

For each leverage level, it reports:

- expected return
- probability of ruin

This replaced the previous visual extrapolation so the scatter chart is simulation-backed.

## 5) Practical limitations

- No fees, spread, funding, or liquidation engine.
- IID Bernoulli outcomes with fixed \(p\) (no regime changes).
- Fair payout formula, not live orderbook pricing.
- Drawdown uses stored curve subset for UI performance.

These assumptions are useful for scenario analysis, but not a substitute for venue-accurate backtesting.
