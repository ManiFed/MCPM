export interface MarketOutcome {
  label: string;
  probability: number; // 0-1
  payoutMultiplier: number; // net: e.g. +2.0 means gain 2x risk, -1 means lose risk
}

export interface SimulationParams {
  probability: number; // 0-1 (used in binary mode)
  leverage: number; // 1-10
  positionSize: number; // 0.01-0.50, fraction of bankroll per bet
  numSimulations: number;
  bankroll: number;
  numBets: number; // number of sequential bets per simulation
  marketTitle?: string;
  marketUrl?: string;
  marketPlatform?: string;
  multiOutcome?: boolean;
  outcomes?: MarketOutcome[];
  profitTarget?: number; // multiplier of bankroll, e.g. 2.0 = 2x
  stopLoss?: number; // multiplier of bankroll, e.g. 0.5 = 50% remaining
}

export interface LeveragePoint {
  leverage: number;
  expectedReturn: number;
  ruinProbability: number;
}

export interface StreakStats {
  maxWinStreaks: number[]; // distribution of max win streaks per sim
  maxLossStreaks: number[]; // distribution of max loss streaks per sim
}

export interface SimulationResult {
  finalValues: number[];
  equityCurves: number[][]; // subset of curves for visualization
  percentiles: Record<string, number>;
  expectedValue: number;
  medianOutcome: number;
  probabilityOfRuin: number;
  maxDrawdown: number;
  sharpeRatio: number;
  meanReturn: number;
  leverageSweep: LeveragePoint[];
  pctHitTarget?: number; // fraction of paths that hit profit target
  pctHitStop?: number; // fraction of paths that hit stop loss
  streaks?: StreakStats;
}

export interface MarketInfo {
  title: string;
  probability: number;
  platform: string;
  url: string;
}

export interface AIAnalysis {
  bullCase: string;
  bearCase: string;
}

// Backtest types
export type { PathPattern, BacktestParams, BacktestResult } from "@/lib/backtestMath";

// Portfolio types
export type { MarketConfig, PortfolioResult } from "@/lib/portfolioMath";
