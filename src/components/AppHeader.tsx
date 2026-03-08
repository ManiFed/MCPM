import { Activity, BookOpen, FlaskConical, Heart, History, Layers, Zap } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { motion } from "framer-motion";

export function AppHeader() {
  return (
    <header className="border-b border-border/60 bg-card/90 backdrop-blur-xl sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
        <motion.div
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 border border-primary/30"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <Activity className="h-4.5 w-4.5 text-primary" />
          <div className="absolute inset-0 rounded-lg bg-primary/10 animate-ping opacity-30" />
        </motion.div>

        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-mono text-sm font-bold tracking-wide text-foreground">MCPM</h1>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[8px] font-mono text-primary font-semibold uppercase tracking-wider">
              <Zap className="h-2 w-2" />
              Live
            </span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">Monte Carlo · Prediction Markets</p>
        </div>

        <nav className="ml-6 flex items-center gap-1">
          {[
            { to: "/", icon: FlaskConical, label: "Simulator" },
            { to: "/backtest", icon: History, label: "Backtest" },
            { to: "/portfolio", icon: Layers, label: "Portfolio" },
            { to: "/methodology", icon: BookOpen, label: "Methodology" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-transparent text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              activeClassName="bg-primary/10 text-primary border-primary/20 shadow-[0_0_12px_hsl(142_72%_50%/0.1)]"
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <a
          href="https://donate.stripe.com/placeholder"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-loss/20 bg-loss/5 hover:bg-loss/10 transition-all duration-200 font-mono text-[10px] text-muted-foreground hover:text-loss group"
        >
          <Heart className="h-3 w-3 text-loss group-hover:scale-110 transition-transform" />
          Sponsor
        </a>
      </div>
    </header>
  );
}
