export interface MarketConfig {
  id: string;
  name: string;
  probability: number;
  leverage: number;
  positionSize: number; // fraction of bankroll allocated to this market
}

export interface PortfolioResult {
  finalValues: number[];
  equityCurves: number[][];
  expectedValue: number;
  medianOutcome: number;
  probabilityOfRuin: number;
  maxDrawdown: number;
  sharpeRatio: number;
  meanReturn: number;
  perMarketRuin: Record<string, number>; // individual ruin if only that market
}

export function runPortfolioMonteCarlo(
  markets: MarketConfig[],
  bankroll: number,
  numSimulations: number,
  numBets: number
): PortfolioResult {
  const finalValues: number[] = [];
  const equityCurves: number[][] = [];
  const maxCurves = 200;
  const storeEvery = Math.max(1, Math.floor(numSimulations / maxCurves));

  for (let sim = 0; sim < numSimulations; sim++) {
    let equity = bankroll;
    const curve = [equity];

    for (let bet = 0; bet < numBets; bet++) {
      if (equity <= 0) { curve.push(0); continue; }

      let totalPnl = 0;
      for (const m of markets) {
        const notional = equity * Math.min(m.positionSize, 1) * m.leverage;
        const riskAmount = Math.min(notional, equity);
        const payoutRatio = (1 - m.probability) / m.probability;

        if (Math.random() < m.probability) {
          totalPnl += riskAmount * payoutRatio;
        } else {
          totalPnl -= riskAmount;
        }
      }

      equity = Math.max(0, equity + totalPnl);
      curve.push(equity);
    }

    finalValues.push(equity);
    if (sim % storeEvery === 0) equityCurves.push(curve);
  }

  const sorted = [...finalValues].sort((a, b) => a - b);
  const n = sorted.length;
  const expectedValue = finalValues.reduce((s, v) => s + v, 0) / n;
  const medianOutcome = sorted[Math.floor(n / 2)];
  const probabilityOfRuin = finalValues.filter(v => v <= 0).length / n;

  let maxDrawdown = 0;
  for (const curve of equityCurves) {
    let peak = curve[0];
    for (const v of curve) {
      if (v > peak) peak = v;
      const dd = peak > 0 ? (peak - v) / peak : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }
  }

  const returns = finalValues.map(v => (v - bankroll) / bankroll);
  const meanReturn = returns.reduce((s, v) => s + v, 0) / n;
  const variance = returns.reduce((s, v) => s + (v - meanReturn) ** 2, 0) / n;
  const sharpeRatio = variance > 0 ? meanReturn / Math.sqrt(variance) : 0;

  // Per-market solo ruin (quick estimate with fewer sims)
  const soloSims = Math.min(2000, numSimulations);
  const perMarketRuin: Record<string, number> = {};
  for (const m of markets) {
    let ruinCount = 0;
    for (let sim = 0; sim < soloSims; sim++) {
      let eq = bankroll;
      for (let bet = 0; bet < numBets; bet++) {
        if (eq <= 0) break;
        const notional = eq * Math.min(m.positionSize, 1) * m.leverage;
        const payoutRatio = (1 - m.probability) / m.probability;
        eq += Math.random() < m.probability ? notional * payoutRatio : -notional;
        if (eq < 0) eq = 0;
      }
      if (eq <= 0) ruinCount++;
    }
    perMarketRuin[m.id] = ruinCount / soloSims;
  }

  return {
    finalValues, equityCurves, expectedValue, medianOutcome,
    probabilityOfRuin, maxDrawdown, sharpeRatio, meanReturn, perMarketRuin,
  };
}
