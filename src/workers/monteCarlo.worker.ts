// Monte Carlo simulation web worker
import type { SimulationParams } from "@/types/simulation";
import { computeLeverageSweep, runMonteCarlo } from "@/lib/simulationMath";

function runSimulation(params: SimulationParams) {
  const summary = runMonteCarlo(params);
  const leverageSweep = computeLeverageSweep(params);

  self.postMessage({ type: "progress", progress: 1 });
  self.postMessage({
    type: "result",
    result: {
      ...summary,
      leverageSweep,
    },
  });
}

self.onmessage = (e: MessageEvent) => {
  if (e.data.type === "run") {
    runSimulation(e.data.params);
  }
};
