import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { FlaskConical, History, Layers, BookOpen, Download, Trash2, Zap, Keyboard, TrendingUp } from "lucide-react";

interface CommandPaletteProps {
  onRunSimulation?: () => void;
  onExportCSV?: () => void;
  onClearResults?: () => void;
}

export function CommandPalette({ onRunSimulation, onExportCSV, onClearResults }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runAction = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." className="font-mono text-sm" />
      <CommandList>
        <CommandEmpty className="font-mono text-sm text-muted-foreground py-6 text-center">
          No results found.
        </CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runAction(() => navigate("/"))} className="font-mono text-sm">
            <FlaskConical className="mr-2 h-4 w-4" />
            Simulator
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/markets"))} className="font-mono text-sm">
            <TrendingUp className="mr-2 h-4 w-4" />
            Markets
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/backtest"))} className="font-mono text-sm">
            <History className="mr-2 h-4 w-4" />
            Backtest
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/portfolio"))} className="font-mono text-sm">
            <Layers className="mr-2 h-4 w-4" />
            Portfolio
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/methodology"))} className="font-mono text-sm">
            <BookOpen className="mr-2 h-4 w-4" />
            Methodology
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Actions">
          {onRunSimulation && (
            <CommandItem onSelect={() => runAction(onRunSimulation)} className="font-mono text-sm">
              <Zap className="mr-2 h-4 w-4" />
              Run Simulation
            </CommandItem>
          )}
          {onExportCSV && (
            <CommandItem onSelect={() => runAction(onExportCSV)} className="font-mono text-sm">
              <Download className="mr-2 h-4 w-4" />
              Export Results to CSV
            </CommandItem>
          )}
          {onClearResults && (
            <CommandItem onSelect={() => runAction(onClearResults)} className="font-mono text-sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Results
            </CommandItem>
          )}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Keyboard Shortcuts">
          <CommandItem className="font-mono text-xs text-muted-foreground pointer-events-none">
            <Keyboard className="mr-2 h-4 w-4" />
            <div className="flex flex-col gap-0.5">
              <span><kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">R</kbd> Run simulation</span>
              <span><kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">L</kbd> Lock & Compare</span>
              <span><kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">1-4</kbd> Apply preset</span>
              <span><kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Esc</kbd> Clear comparison</span>
              <span><kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">⌘K</kbd> Command palette</span>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
