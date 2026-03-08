import type { SimulationResult } from "@/types/simulation";

export function exportResultsToCSV(result: SimulationResult, bankroll: number) {
  const rows = result.finalValues.map((v, i) => ({
    simulation_id: i + 1,
    final_value: v.toFixed(2),
    return_pct: (((v - bankroll) / bankroll) * 100).toFixed(2),
    profit_loss: (v - bankroll).toFixed(2),
  }));

  const header = "simulation_id,final_value,return_pct,profit_loss\n";
  const csv = header + rows.map((r) => `${r.simulation_id},${r.final_value},${r.return_pct},${r.profit_loss}`).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mcpm_simulation_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
