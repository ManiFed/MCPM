import { useState, useCallback, useRef } from "react";
import type { SimulationParams, SimulationResult } from "@/types/simulation";

export function useSimulation() {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const workerRef = useRef<Worker | null>(null);

  const runSimulation = useCallback((params: SimulationParams) => {
    setIsRunning(true);
    setProgress(0);
    setResult(null);

    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker(
      new URL("../workers/monteCarlo.worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === "progress") {
        setProgress(e.data.progress);
      } else if (e.data.type === "result") {
        setResult(e.data.result);
        setIsRunning(false);
        setProgress(1);
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.onerror = () => {
      setIsRunning(false);
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({ type: "run", params });
  }, []);

  return { result, isRunning, progress, runSimulation };
}
