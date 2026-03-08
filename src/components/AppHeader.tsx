import { Activity, BookOpen, FlaskConical, Heart, History, Layers, Menu, TrendingUp, Zap } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function AppHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: "/", icon: FlaskConical, label: "Simulator" },
    { to: "/markets", icon: TrendingUp, label: "Markets" },
    { to: "/backtest", icon: History, label: "Backtest" },
    { to: "/portfolio", icon: Layers, label: "Portfolio" },
    { to: "/methodology", icon: BookOpen, label: "Methodology" },
  ];

  return (
    <header className="border-b border-border/60 bg-card/90 backdrop-blur-xl sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
        {/* Mobile hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden h-8 w-8 p-0">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-card border-border">
            <SheetTitle className="font-mono text-sm font-bold text-foreground mb-4">MCPM</SheetTitle>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="inline-flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  activeClassName="bg-primary/10 text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-6 px-3">
              <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">⌘K for command palette</p>
            </div>
          </SheetContent>
        </Sheet>

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
          <p className="font-mono text-[10px] text-muted-foreground hidden sm:block">Monte Carlo · Prediction Markets</p>
        </div>

        <nav className="ml-6 hidden md:flex items-center gap-1">
          {navItems.map((item) => (
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

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden lg:inline text-[9px] font-mono text-muted-foreground/40">⌘K</span>
          <a
            href="https://donate.stripe.com/placeholder"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-loss/20 bg-loss/5 hover:bg-loss/10 transition-all duration-200 font-mono text-[10px] text-muted-foreground hover:text-loss group"
          >
            <Heart className="h-3 w-3 text-loss group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Sponsor</span>
          </a>
        </div>
      </div>
    </header>
  );
}
