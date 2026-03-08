export type PathPattern = "linear" | "spike_crash" | "mean_reversion" | "volatile";

export interface BacktestParams {
  startProb: number;
  endProb: number;
  steps: number;
  volatility: number;
  pattern: PathPattern;
  leverage: number;
  positionSize: number;
  bankroll: number;
}

export interface BacktestResult {
  equityCurve: number[];
  probPath: number[];
  pnlPerStep: number[];
  totalReturn: number;
  maxDrawdown: number;
  finalEquity: number;
  winRate: number;
}

/**
 * Generate a probability path from startProb to endProb over `steps` steps
 * with given volatility and pattern type.
 */
export function generateProbabilityPath(
  startProb: number,
  endProb: number,
  steps: number,
  volatility: number,
  pattern: PathPattern,
  seed?: number
): number[] {
  const path: number[] = [startProb];
  let current = startProb;
  const trend = (endProb - startProb) / steps;

  // Simple seeded PRNG for reproducibility
  let s = seed ?? Math.floor(Math.random() * 1e9);
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };

  for (let i = 1; i <= steps; i++) {
    const noise = (rand() - 0.5) * 2 * volatility;

    switch (pattern) {
      case "linear":
        current += trend + noise * 0.3;
        break;
      case "spike_crash": {
        const midpoint = steps * 0.4;
        if (i < midpoint) {
          current += (endProb - startProb) / midpoint * 1.5 + noise;
        } else {
          current -= (endProb - startProb) / (steps - midpoint) * 0.5 + noise * 0.5;
        }
        break;
      }
      case "mean_reversion": {
        const target = startProb + (endProb - startProb) * (i / steps);
        current += (target - current) * 0.15 + noise;
        break;
      }
      case "volatile":
        current += trend + noise;
        break;
    }

    current = Math.max(0.01, Math.min(0.99, current));
    path.push(current);
  }

  return path;
}

/**
 * Run a deterministic backtest along a probability path.
 * At each step, a bet resolves at the current market probability.
 */
export function runBacktest(params: BacktestParams, probPath: number[]): BacktestResult {
  let equity = params.bankroll;
  const equityCurve: number[] = [equity];
  const pnlPerStep: number[] = [];
  let wins = 0;

  // Simple deterministic: at each step we compute the expected P&L
  // based on whether the market probability moved favorably.
  // We simulate: you buy at prob[i], resolve at prob[i+1] direction
  let s = 42; // deterministic seed for bet resolution
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };

  for (let i = 0; i < probPath.length - 1; i++) {
    if (equity <= 0) {
      pnlPerStep.push(0);
      equityCurve.push(0);
      continue;
    }

    const prob = probPath[i];
    const notional = equity * Math.min(1, params.positionSize * params.leverage);
    const payoutRatio = (1 - prob) / prob;

    // Resolve bet using seeded random with current step probability
    const roll = rand();
    let pnl: number;
    if (roll < prob) {
      pnl = notional * payoutRatio;
      wins++;
    } else {
      pnl = -notional;
    }

    equity = Math.max(0, equity + pnl);
    pnlPerStep.push(pnl);
    equityCurve.push(equity);
  }

  // Max drawdown
  let peak = equityCurve[0];
  let maxDD = 0;
  for (const v of equityCurve) {
    if (v > peak) peak = v;
    const dd = peak > 0 ? (peak - v) / peak : 0;
    if (dd > maxDD) maxDD = dd;
  }

  return {
    equityCurve,
    probPath,
    pnlPerStep,
    totalReturn: (equity - params.bankroll) / params.bankroll,
    maxDrawdown: maxDD,
    finalEquity: equity,
    winRate: probPath.length > 1 ? wins / (probPath.length - 1) : 0,
  };
}
