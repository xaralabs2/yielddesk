import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Gauge, TrendingUp, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIGNAL_COLORS } from "./constants";
import type { EtfAllocationData } from "./types";

export function FactorRotation({ factors }: { factors: EtfAllocationData["factorSignals"] }) {
  if (!factors || factors.length === 0) return null;

  const growthFactor = factors.find(f => f.factorType === "GROWTH");
  const valueFactor = factors.find(f => f.factorType === "VALUE");

  return (
    <Card data-testid="card-factor-rotation">
      <CardHeader className="flex flex-row items-center gap-2 pb-3 p-4">
        <Gauge className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">Factor Rotation</h3>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {growthFactor && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50" data-testid="factor-growth">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Growth</span>
                </div>
                <span className={cn("text-xs font-bold uppercase tracking-wider", SIGNAL_COLORS[growthFactor.signal])}>
                  {growthFactor.signal}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Confidence</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.round(growthFactor.confidence * 100)}%` }} />
                </div>
                <span className="text-xs font-mono tabular-nums">{Math.round(growthFactor.confidence * 100)}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic">{growthFactor.reasoning}</p>
              <span className="text-[10px] text-muted-foreground/60 font-mono">{growthFactor.symbol}</span>
            </div>
          )}
          {valueFactor && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50" data-testid="factor-value">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Value</span>
                </div>
                <span className={cn("text-xs font-bold uppercase tracking-wider", SIGNAL_COLORS[valueFactor.signal])}>
                  {valueFactor.signal}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Confidence</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.round(valueFactor.confidence * 100)}%` }} />
                </div>
                <span className="text-xs font-mono tabular-nums">{Math.round(valueFactor.confidence * 100)}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic">{valueFactor.reasoning}</p>
              <span className="text-[10px] text-muted-foreground/60 font-mono">{valueFactor.symbol}</span>
            </div>
          )}
        </div>
        {growthFactor && valueFactor && (
          <div className="flex items-center gap-3 pt-2 border-t border-border/50">
            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Factor rotation reflects the current macro regime. In tight liquidity, value tends to outperform growth.
              In expansion, growth dominates. Signals update every 6 hours with macro data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
