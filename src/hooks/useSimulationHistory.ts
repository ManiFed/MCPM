import { useState, useCallback, useEffect } from "react";
import type { SimulationParams, SimulationResult } from "@/types/simulation";

const STORAGE_KEY = "sim-history";
const MAX_ENTRIES = 20;

export interface HistoryEntry {
  id: string;
  timestamp: number;
  params: SimulationParams;
  notes: string;
  summary: {
    expectedValue: number;
    medianOutcome: number;
    probabilityOfRuin: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useSimulationHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addEntry = useCallback((params: SimulationParams, result: SimulationResult) => {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      params,
      notes: "",
      summary: {
        expectedValue: result.expectedValue,
        medianOutcome: result.medianOutcome,
        probabilityOfRuin: result.probabilityOfRuin,
        sharpeRatio: result.sharpeRatio,
        maxDrawdown: result.maxDrawdown,
      },
    };
    setHistory((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setHistory((prev) =>
      prev.map((e) => (e.id === id ? { ...e, notes } : e))
    );
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, addEntry, updateNotes, clearHistory };
}
