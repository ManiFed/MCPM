import { Activity, BookOpen, FlaskConical, Heart } from "lucide-react";
import { NavLink } from "@/components/NavLink";

export function AppHeader() {
  return (
    <header className="border-b border-border/60 bg-card/70 backdrop-blur sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 border border-primary/25">
          <Activity className="h-4 w-4 text-primary" />
        </div>

        <div>
          <h1 className="font-mono text-sm font-semibold tracking-wide text-foreground">MCPM</h1>
          <p className="font-mono text-[10px] text-muted-foreground">Monte Carlo · Prediction Markets</p>
        </div>

        <nav className="ml-6 flex items-center gap-2">
          <NavLink
            to="/"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-transparent text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-accent/20"
            activeClassName="bg-primary/15 text-primary border-primary/25"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Simulator
          </NavLink>
          <NavLink
            to="/methodology"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-transparent text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-accent/20"
            activeClassName="bg-primary/15 text-primary border-primary/25"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Methodology
          </NavLink>
        </nav>

        <a
          href="https://donate.stripe.com/placeholder"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border/50 bg-background/40 hover:bg-accent hover:text-accent-foreground transition-colors font-mono text-[10px] text-muted-foreground hover:text-foreground"
        >
          <Heart className="h-3 w-3 text-loss" />
          Sponsor
        </a>
      </div>
    </header>
  );
}
