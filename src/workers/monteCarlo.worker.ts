// Monte Carlo simulation web worker

interface WorkerParams {
  probability: number;
  leverage: number;
  riskTolerance: string;
  numSimulations: number;
  bankroll: number;
  numBets: number;
}

function getPositionSize(riskTolerance: string): number {
  switch (riskTolerance) {
    case "conservative": return 0.05;
    case "moderate": return 0.15;
    case "aggressive": return 0.30;
    default: return 0.15;
  }
}

function runSimulation(params: WorkerParams) {
  const { probability, leverage, numSimulations, bankroll, numBets } = params;
  const positionSize = getPositionSize(params.riskTolerance);
  
  const finalValues: number[] = [];
  const equityCurves: number[][] = [];
  const maxCurvesToStore = Math.min(200, numSimulations);
  const curveInterval = Math.max(1, Math.floor(numSimulations / maxCurvesToStore));

  for (let sim = 0; sim < numSimulations; sim++) {
    let equity = bankroll;
    const curve: number[] = sim % curveInterval === 0 ? [equity] : [];

    for (let bet = 0; bet < numBets; bet++) {
      if (equity <= 0) {
        equity = 0;
        if (curve.length > 0) {
          for (let remaining = bet; remaining < numBets; remaining++) {
            curve.push(0);
          }
        }
        break;
      }

      const betSize = equity * positionSize * leverage;
      const rand = Math.random();

      if (rand < probability) {
        // Win: gain proportional to odds
        const payout = betSize * ((1 - probability) / probability);
        equity += payout;
      } else {
        // Lose: lose the bet
        equity -= betSize;
        if (equity < 0) equity = 0;
      }

      if (curve.length > 0) {
        curve.push(equity);
      }
    }

    finalValues.push(equity);
    if (curve.length > 0) {
      equityCurves.push(curve);
    }

    // Report progress every 10%
    if (sim % Math.max(1, Math.floor(numSimulations / 10)) === 0) {
      self.postMessage({ type: "progress", progress: sim / numSimulations });
    }
  }

  // Calculate stats
  const sorted = [...finalValues].sort((a, b) => a - b);
  const n = sorted.length;
  const getPercentile = (p: number) => sorted[Math.floor(p * n / 100)] ?? 0;

  const mean = finalValues.reduce((a, b) => a + b, 0) / n;
  const median = getPercentile(50);
  const ruinCount = finalValues.filter(v => v <= 0).length;
  const probabilityOfRuin = ruinCount / n;

  // Max drawdown from equity curves
  let maxDrawdown = 0;
  for (const curve of equityCurves) {
    let peak = curve[0];
    for (const val of curve) {
      if (val > peak) peak = val;
      const dd = peak > 0 ? (peak - val) / peak : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }
  }

  // Sharpe-like ratio
  const returns = finalValues.map(v => (v - bankroll) / bankroll);
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - meanReturn) ** 2, 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? meanReturn / stdDev : 0;

  const percentiles: Record<string, number> = {
    "1%": getPercentile(1),
    "5%": getPercentile(5),
    "25%": getPercentile(25),
    "50%": median,
    "75%": getPercentile(75),
    "95%": getPercentile(95),
    "99%": getPercentile(99),
  };

  self.postMessage({
    type: "result",
    result: {
      finalValues,
      equityCurves,
      percentiles,
      expectedValue: mean,
      medianOutcome: median,
      probabilityOfRuin,
      maxDrawdown,
      sharpeRatio,
      meanReturn,
    },
  });
}

self.onmessage = (e: MessageEvent) => {
  if (e.data.type === "run") {
    runSimulation(e.data.params);
  }
};
