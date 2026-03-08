import type { LeveragePoint, MarketOutcome, SimulationParams, StreakStats } from "@/types/simulation";

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
  pctHitTarget?: number;
  pctHitStop?: number;
  streaks?: StreakStats;
}

const DEFAULT_LEVERAGE_LEVELS = [1, 2, 3, 5, 7, 10];

function resolveOutcome(outcomes: MarketOutcome[], roll: number): number {
  let cumulative = 0;
  for (const o of outcomes) {
    cumulative += o.probability;
    if (roll < cumulative) return o.payoutMultiplier;
  }
  return outcomes[outcomes.length - 1].payoutMultiplier;
}

interface PathResult {
  finalEquity: number;
  curve: number[];
  hitTarget: boolean;
  hitStop: boolean;
  maxWinStreak: number;
  maxLossStreak: number;
}

function runSinglePath(params: SimulationParams, random: () => number): PathResult {
  let equity = params.bankroll;
  const curve = [equity];
  const isMulti = params.multiOutcome && params.outcomes && params.outcomes.length >= 2;

  const targetEquity = params.profitTarget ? params.bankroll * params.profitTarget : Infinity;
  const stopEquity = params.stopLoss ? params.bankroll * params.stopLoss : 0;

  let hitTarget = false;
  let hitStop = false;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;

  for (let bet = 0; bet < params.numBets; bet++) {
    if (equity <= 0) {
      curve.push(0);
      continue;
    }

    // Check profit target / stop loss
    if (equity >= targetEquity) {
      hitTarget = true;
      // Fill remaining with final equity
      for (let r = bet; r < params.numBets; r++) curve.push(equity);
      break;
    }
    if (equity <= stopEquity && stopEquity > 0) {
      hitStop = true;
      for (let r = bet; r < params.numBets; r++) curve.push(equity);
      break;
    }

    const notionalFraction = params.positionSize * params.leverage;
    const riskAmount = equity * Math.min(1, notionalFraction);
    const roll = random();
    let won = false;

    if (isMulti) {
      const multiplier = resolveOutcome(params.outcomes!, roll);
      equity += riskAmount * multiplier;
      won = multiplier > 0;
    } else {
      if (roll < params.probability) {
        const payoutRatio = (1 - params.probability) / params.probability;
        equity += riskAmount * payoutRatio;
        won = true;
      } else {
        equity -= riskAmount;
        won = false;
      }
    }

    // Track streaks
    if (won) {
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
    }

    if (equity < 0) equity = 0;
    curve.push(equity);
  }

  return { finalEquity: equity, curve, hitTarget, hitStop, maxWinStreak, maxLossStreak };
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
  const maxWinStreaks: number[] = [];
  const maxLossStreaks: number[] = [];
  let targetHits = 0;
  let stopHits = 0;
  const storeEvery = shouldStoreCurves
    ? Math.max(1, Math.floor(params.numSimulations / Math.min(maxCurvesToStore, params.numSimulations)))
    : Number.POSITIVE_INFINITY;

  for (let sim = 0; sim < params.numSimulations; sim++) {
    const { finalEquity, curve, hitTarget, hitStop, maxWinStreak, maxLossStreak } = runSinglePath(params, random);
    finalValues.push(finalEquity);
    maxWinStreaks.push(maxWinStreak);
    maxLossStreaks.push(maxLossStreak);
    if (hitTarget) targetHits++;
    if (hitStop) stopHits++;

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
    pctHitTarget: params.profitTarget ? targetHits / n : undefined,
    pctHitStop: params.stopLoss ? stopHits / n : undefined,
    streaks: { maxWinStreaks, maxLossStreaks },
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
