export type RiskTolerance = "conservative" | "moderate" | "aggressive";

export interface SimulationParams {
  probability: number; // 0-1
  leverage: number; // 1-10
  riskTolerance: RiskTolerance;
  numSimulations: number;
  bankroll: number;
  numBets: number; // number of sequential bets per simulation
  marketTitle?: string;
  marketUrl?: string;
  marketPlatform?: string;
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
