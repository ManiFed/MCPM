import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const sections = [
  {
    title: "1) Core model",
    points: [
      "Each path starts with bankroll B0 and updates across sequential bets.",
      "Inputs: probability p, position-size fraction f, and leverage L.",
      "Effective notional fraction is n = fL.",
      "Per-bet risk capital is capped: Rt = Bt × min(1, n).",
      "That cap prevents a single loss from exceeding current equity.",
    ],
  },
  {
    title: "2) Win/loss updates and fairness",
    points: [
      "Fair binary payout multiplier on the risk amount is (1-p)/p.",
      "Win: Bt+1 = Bt + Rt × (1-p)/p.",
      "Loss: Bt+1 = Bt - Rt.",
      "Expected per-step change is zero at fair odds: E[ΔBt] = 0 (before fees/slippage).",
    ],
  },
  {
    title: "3) Reported metrics",
    points: [
      "Expected value: average terminal bankroll over N paths.",
      "Mean return: average of (Fi - B0)/B0.",
      "Median and tail percentiles from sorted final bankrolls.",
      "Probability of ruin: share of runs with terminal bankroll ≤ 0.",
      "Max drawdown is measured along stored equity curves using running peak.",
      "Sharpe-like ratio uses cross-sectional terminal returns (risk-free = 0).",
    ],
  },
  {
    title: "4) Leverage chart methodology",
    points: [
      "The risk/reward scatter uses real simulation sweeps for leverage [1,2,3,5,7,10].",
      "For each leverage level, all other user inputs are held fixed.",
      "Each point reports expected return and ruin probability from that mini-simulation.",
    ],
  },
  {
    title: "5) Practical limitations",
    points: [
      "No fees, spread, funding costs, or exchange-specific liquidation model.",
      "IID Bernoulli outcomes with fixed p; no time-varying regimes.",
      "Useful for scenario framing, not venue-accurate backtesting.",
    ],
  },
];

export default function Methodology() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Card className="bg-card/80 border-border/60">
          <CardHeader>
            <CardTitle className="font-mono text-sm tracking-wide">Methodology</CardTitle>
            <p className="text-sm text-muted-foreground">
              The simulator is a Monte Carlo engine for repeated binary bets with compounding bankroll dynamics.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {sections.map((section, idx) => (
              <div key={section.title} className="space-y-2">
                <h2 className="font-mono text-xs uppercase tracking-wider text-primary">{section.title}</h2>
                <ul className="space-y-1.5">
                  {section.points.map((point) => (
                    <li key={point} className="text-sm text-card-foreground leading-relaxed list-disc ml-5">
                      {point}
                    </li>
                  ))}
                </ul>
                {idx < sections.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
