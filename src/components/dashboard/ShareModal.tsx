import { useState, useRef } from "react";
import { Share2, Link2, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { SimulationParams, SimulationResult } from "@/types/simulation";
import { SnapshotCard } from "./SnapshotCard";


interface ShareModalProps {
  params: SimulationParams;
  result: SimulationResult;
}

function encodeParams(params: SimulationParams): string {
  const sp = new URLSearchParams();
  sp.set("p", String(Math.round(params.probability * 100)));
  sp.set("l", String(params.leverage));
  sp.set("ps", String(Math.round(params.positionSize * 100)));
  sp.set("n", String(params.numSimulations));
  sp.set("b", String(params.bankroll));
  sp.set("bets", String(params.numBets));
  if (params.marketTitle) sp.set("title", params.marketTitle);
  if (params.marketPlatform) sp.set("plat", params.marketPlatform);
  return sp.toString();
}

export function decodeParamsFromUrl(search: string): SimulationParams | null {
  const sp = new URLSearchParams(search);
  const p = sp.get("p");
  if (!p) return null;
  return {
    probability: Number(p) / 100,
    leverage: Number(sp.get("l") || 2),
    positionSize: Number(sp.get("ps") || 10) / 100,
    numSimulations: Number(sp.get("n") || 10000),
    bankroll: Number(sp.get("b") || 10000),
    numBets: Number(sp.get("bets") || 100),
    marketTitle: sp.get("title") || undefined,
    marketPlatform: sp.get("plat") || undefined,
  };
}

function buildOgImageUrl(params: SimulationParams, result: SimulationResult): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "seebckcpdergeiejxnvf";
  const base = `https://${projectId}.supabase.co/functions/v1/og-image`;
  const sp = new URLSearchParams();
  sp.set("p", String(Math.round(params.probability * 100)));
  sp.set("l", String(params.leverage));
  sp.set("ps", String(Math.round(params.positionSize * 100)));
  sp.set("sharpe", result.sharpeRatio.toFixed(2));
  sp.set("ruin", (result.probabilityOfRuin * 100).toFixed(1));
  const formatCurrency = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;
  sp.set("median", formatCurrency(result.medianOutcome));
  sp.set("title", params.marketTitle || "Monte Carlo Simulation");
  return `${base}?${sp.toString()}`;
}

export function ShareModal({ params, result }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${window.location.origin}/?${encodeParams(params)}`;
  const ogImageUrl = buildOgImageUrl(params, result);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const { default: h2c } = await import("html2canvas");
      const canvas = await h2c(cardRef.current, {
        backgroundColor: "#0a0d11",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `mcpm-snapshot-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image downloaded");
    } catch {
      toast.error("Failed to generate image — try Copy Link instead");
    }
  };

  return (
    <>
      {/* Inject OG meta tags */}
      {typeof document !== "undefined" && (() => {
        const existing = document.querySelector('meta[property="og:image"]');
        if (existing) existing.setAttribute("content", ogImageUrl);
        return null;
      })()}

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs font-mono gap-1.5">
            <Share2 className="h-3 w-3" />
            Share
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">Share Results</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleCopyLink} variant="outline" className="flex-1 h-9 font-mono text-xs gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5 text-profit" /> : <Link2 className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button onClick={handleDownloadImage} variant="outline" className="flex-1 h-9 font-mono text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Download PNG
              </Button>
            </div>

            {/* OG preview */}
            <div className="rounded border border-border/60 overflow-hidden">
              <img
                src={ogImageUrl}
                alt="Strategy Card Preview"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>

            <div className="rounded-lg border border-border/60 p-1 overflow-hidden">
              <SnapshotCard ref={cardRef} params={params} result={result} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
