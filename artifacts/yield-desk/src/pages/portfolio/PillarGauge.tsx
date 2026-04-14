import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PILLAR_COLORS } from "./constants";
import { formatNgn, formatCompact } from "./helpers";
import type { PillarSummary } from "./types";

export function PillarGauge({ pillar, totalValue, tolerance, targetValue }: { pillar: PillarSummary; totalValue: number; tolerance: number; targetValue: number }) {
  const targetPct = (pillar.target * 100).toFixed(0);
  const barColor = PILLAR_COLORS[pillar.pillar] || "bg-primary";
  const pillarGoal = targetValue > 0 ? targetValue * pillar.target : 0;
  const pillarProgress = pillarGoal > 0 ? (pillar.value / pillarGoal) * 100 : 0;
  const pillarGap = Math.max(pillarGoal - pillar.value, 0);
  const slug = pillar.pillar.toLowerCase().replace(/\s+/g, "-");

  const consolidated = pillar.holdings.reduce<Record<string, number>>((acc, h) => {
    acc[h.asset] = (acc[h.asset] || 0) + h.value;
    return acc;
  }, {});
  const sortedHoldings = Object.entries(consolidated).sort((a, b) => b[1] - a[1]);

  return (
    <Card data-testid={`pillar-card-${slug}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 p-4">
        <div className="flex items-center gap-2">
          <div className={cn("h-2.5 w-2.5 rounded-full", barColor)} />
          <h3 className="text-sm font-bold" data-testid={`text-pillar-name-${slug}`}>
            {pillar.pillar}
          </h3>
        </div>
        <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-mono" data-testid={`badge-target-${slug}`}>
          {targetPct}% of Goal
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xl font-bold font-mono tabular-nums" data-testid={`text-pillar-value-${slug}`}>
            {formatNgn(pillar.value)}
          </span>
          {pillarGoal > 0 && (
            <span className="text-xs font-mono tabular-nums text-muted-foreground" data-testid={`text-pillar-of-goal-${slug}`}>
              of {formatCompact(pillarGoal)}
            </span>
          )}
        </div>

        {pillarGoal > 0 && (
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${Math.min(pillarProgress, 100)}%` }}
            />
          </div>
        )}
        {!pillarGoal && (
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${Math.min(pillar.weight / Math.max(pillar.target * 2, 0.01) * 100, 100)}%` }}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-mono tabular-nums font-semibold text-right text-primary" data-testid={`text-pillar-progress-${slug}`}>
            {pillarGoal > 0 ? `${pillarProgress.toFixed(2)}%` : `${(pillar.weight * 100).toFixed(2)}%`}
          </span>
          <span className="text-muted-foreground">Gap to Goal</span>
          <span className="font-mono tabular-nums text-right text-muted-foreground" data-testid={`text-pillar-gap-${slug}`}>
            {pillarGoal > 0 ? formatCompact(pillarGap) : "-"}
          </span>
        </div>

        {sortedHoldings.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border/50">
            {sortedHoldings.map(([asset, value]) => (
              <div key={asset} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate mr-2">{asset}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono tabular-nums text-foreground">{formatNgn(value)}</span>
                  {pillarGoal > 0 && (
                    <span className="font-mono tabular-nums text-muted-foreground text-[10px] w-12 text-right">
                      {(value / pillarGoal * 100).toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
