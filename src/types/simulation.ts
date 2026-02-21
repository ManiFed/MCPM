export interface SimulationParams {
  probability: number; // 0-1
  leverage: number; // 1-10
  positionSize: number; // 0.01-0.50, fraction of bankroll per bet
  numSimulations: number;
  bankroll: number;
  numBets: number; // number of sequential bets per simulation
  marketTitle?: string;
  marketUrl?: string;
  marketPlatform?: string;
}

export interface LeveragePoint {
  leverage: number;
  expectedReturn: number;
  ruinProbability: number;
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
