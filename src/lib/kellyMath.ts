/**
 * Kelly Criterion for binary prediction market bets.
 *
 * For a bet that pays  payoutRatio : 1  with probability p,
 * the Kelly fraction is:
 *   f* = (p * payoutRatio - (1 - p)) / payoutRatio
 *
 * When leverage is applied, the effective Kelly fraction
 * of bankroll to allocate is f* / leverage, because
 * notional = positionSize * leverage.
 */

export function computeKellyFraction(probability: number, leverage: number): number {
  if (probability <= 0 || probability >= 1 || leverage <= 0) return 0;
  const payoutRatio = (1 - probability) / probability;
  const kellyNotional = (probability * payoutRatio - (1 - probability)) / payoutRatio;
  // kellyNotional is the optimal fraction of bankroll to risk (notional).
  // Since notional = positionSize * leverage, optimal positionSize = kellyNotional / leverage
  const kellyPosition = kellyNotional / leverage;
  return Math.max(0, kellyPosition);
}

export type KellyStatus = "optimal" | "under" | "over" | "danger";

export function getKellyStatus(currentPosition: number, kellyPosition: number): KellyStatus {
  if (kellyPosition <= 0) return "danger";
  const ratio = currentPosition / kellyPosition;
  if (ratio <= 1.05) return ratio >= 0.8 ? "optimal" : "under";
  if (ratio <= 1.5) return "over";
  return "danger";
}
