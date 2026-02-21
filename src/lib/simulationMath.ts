import type { LeveragePoint, SimulationParams } from "@/types/simulation";

interface RunOptions {
  random?: () => number;
  storeCurves?: boolean;
  maxCurvesToStore?: number;
}


export interface MonteCarloResult {
  finalValues: number[];
  equityCurves: number[][];
  percentiles: Record<string, number>;
  expectedValue: number;
  medianOutcome: number;
  probabilityOfRuin: number;
  maxDrawdown: number;
  sharpeRatio: number;
  meanReturn: number;
  leverageSweep: LeveragePoint[];
}

const DEFAULT_LEVERAGE_LEVELS = [1, 2, 3, 5, 7, 10];

function runSinglePath(params: SimulationParams, random: () => number): { finalEquity: number; curve: number[] } {
  let equity = params.bankroll;
  const curve = [equity];

  for (let bet = 0; bet < params.numBets; bet++) {
    if (equity <= 0) {
      curve.push(0);
      continue;
    }

    const notionalFraction = params.positionSize * params.leverage;
    const riskAmount = equity * Math.min(1, notionalFraction);

    if (random() < params.probability) {
      const payoutRatio = (1 - params.probability) / params.probability;
      equity += riskAmount * payoutRatio;
    } else {
      equity -= riskAmount;
    }

    if (equity < 0) equity = 0;
    curve.push(equity);
  }

  return { finalEquity: equity, curve };
}

export function runMonteCarlo(
  params: SimulationParams,
  options: RunOptions = {}
): Omit<MonteCarloResult, "leverageSweep"> {
  const random = options.random ?? Math.random;
  const shouldStoreCurves = options.storeCurves ?? true;
  const maxCurvesToStore = options.maxCurvesToStore ?? 200;

  const finalValues: number[] = [];
  const equityCurves: number[][] = [];
  const storeEvery = shouldStoreCurves
    ? Math.max(1, Math.floor(params.numSimulations / Math.min(maxCurvesToStore, params.numSimulations)))
    : Number.POSITIVE_INFINITY;

  for (let sim = 0; sim < params.numSimulations; sim++) {
    const { finalEquity, curve } = runSinglePath(params, random);
    finalValues.push(finalEquity);

    if (shouldStoreCurves && sim % storeEvery === 0) {
      equityCurves.push(curve);
    }
  }

  const sorted = [...finalValues].sort((a, b) => a - b);
  const n = sorted.length;
  const percentile = (p: number) => sorted[Math.floor((p / 100) * (n - 1))] ?? 0;

  const expectedValue = finalValues.reduce((sum, v) => sum + v, 0) / n;
  const medianOutcome = percentile(50);
  const ruinCount = finalValues.filter((v) => v <= 0).length;
  const probabilityOfRuin = ruinCount / n;

  let maxDrawdown = 0;
  for (const curve of equityCurves) {
    let peak = curve[0] ?? 0;
    for (const value of curve) {
      if (value > peak) peak = value;
      const drawdown = peak > 0 ? (peak - value) / peak : 0;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
  }

  const returns = finalValues.map((v) => (v - params.bankroll) / params.bankroll);
  const meanReturn = returns.reduce((sum, v) => sum + v, 0) / n;
  const variance = returns.reduce((sum, v) => sum + (v - meanReturn) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? meanReturn / stdDev : 0;

  return {
    finalValues,
    equityCurves,
    percentiles: {
      "1%": percentile(1),
      "5%": percentile(5),
      "25%": percentile(25),
      "50%": percentile(50),
      "75%": percentile(75),
      "95%": percentile(95),
      "99%": percentile(99),
    },
    expectedValue,
    medianOutcome,
    probabilityOfRuin,
    maxDrawdown,
    sharpeRatio,
    meanReturn,
  };
}

export function computeLeverageSweep(
  params: SimulationParams,
  leverageLevels: number[] = DEFAULT_LEVERAGE_LEVELS,
  random?: () => number
): LeveragePoint[] {
  const sweepSimulations = Math.min(4000, Math.max(1000, Math.floor(params.numSimulations / 2)));

  return leverageLevels.map((leverage) => {
    const summary = runMonteCarlo(
      { ...params, leverage, numSimulations: sweepSimulations },
      { random, storeCurves: false }
    );

    return {
      leverage,
      expectedReturn: summary.meanReturn,
      ruinProbability: summary.probabilityOfRuin,
    };
  });
}
