import { describe, expect, it } from "vitest";
import { computeLeverageSweep, runMonteCarlo } from "@/lib/simulationMath";
import type { SimulationParams } from "@/types/simulation";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe("simulationMath", () => {
  it("keeps expected return near zero for a fair one-step bet", () => {
    const params: SimulationParams = {
      probability: 0.5,
      leverage: 1,
      positionSize: 0.2,
      numSimulations: 100000,
      bankroll: 1000,
      numBets: 1,
    };

    const result = runMonteCarlo(params, { random: makeRng(7), storeCurves: false });

    expect(Math.abs(result.meanReturn)).toBeLessThan(0.02);
  });

  it("does not create artificial positive EV with oversized notional", () => {
    const params: SimulationParams = {
      probability: 0.5,
      leverage: 10,
      positionSize: 0.5,
      numSimulations: 30000,
      bankroll: 1000,
      numBets: 30,
    };

    const result = runMonteCarlo(params, { random: makeRng(42), storeCurves: false });

    expect(result.meanReturn).toBeLessThan(0.05);
  });

  it("computes leverage sweep points", () => {
    const params: SimulationParams = {
      probability: 0.55,
      leverage: 2,
      positionSize: 0.1,
      numSimulations: 4000,
      bankroll: 1000,
      numBets: 50,
    };

    const points = computeLeverageSweep(params, [1, 2, 3], makeRng(99));

    expect(points).toHaveLength(3);
    expect(points.map((p) => p.leverage)).toEqual([1, 2, 3]);
    points.forEach((p) => {
      expect(p.ruinProbability).toBeGreaterThanOrEqual(0);
      expect(p.ruinProbability).toBeLessThanOrEqual(1);
    });
  });
});
