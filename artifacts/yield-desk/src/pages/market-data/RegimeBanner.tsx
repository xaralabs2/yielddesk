import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { REGIME_COLORS } from "./constants";
import type { EtfAllocationData } from "./types";

export function RegimeBanner({ regime, lastUpdated }: { regime: EtfAllocationData["regime"]; lastUpdated: string | null }) {
  const colors = REGIME_COLORS[regime.color] || REGIME_COLORS.GREY;
  const confidencePct = Math.round(regime.confidence * 100);

  return (
    <Card className={cn("overflow-hidden", colors.border)} data-testid="card-regime-banner">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <Activity className={cn("h-5 w-5", colors.text)} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Macro Regime</span>
              <div className={cn("h-2.5 w-2.5 rounded-full animate-pulse", colors.badge)} />
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className={cn("text-2xl font-bold tracking-tight", colors.text)} data-testid="text-regime-name">
                {regime.name}
              </h2>
              <span className="text-xs font-mono tabular-nums text-muted-foreground" data-testid="text-regime-confidence">
                {confidencePct}% confidence
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl" data-testid="text-regime-summary">
              {regime.summary}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className={cn("rounded-full px-3 py-1", colors.bg)}>
              <span className={cn("text-xs font-bold uppercase tracking-wider", colors.text)}>
                {regime.name}
              </span>
            </div>
            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden mt-1">
              <div
                className={cn("h-full rounded-full transition-all duration-500", colors.badge)}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
            {lastUpdated && (
              <span className="text-[9px] text-muted-foreground/60 font-mono mt-1">
                {new Date(lastUpdated).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
