import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Droplets, Zap, CircleDollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryIcons, riskColors, protectionColors } from "./constants";
import type { InvestmentOption } from "./types";

function RealYieldBadge({ range }: { range: [number, number] }) {
  const avg = (range[0] + range[1]) / 2;
  const isPositive = avg > 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-mono tabular-nums font-semibold",
        isPositive ? "text-emerald-500" : "text-rose-500"
      )}
      data-testid="badge-real-yield"
    >
      <Icon className="h-3 w-3" />
      {range[0] > 0 ? "+" : ""}{range[0].toFixed(2)}% to {range[1] > 0 ? "+" : ""}{range[1].toFixed(2)}% real
    </span>
  );
}

export function InvestmentCard({ investment }: { investment: InvestmentOption }) {
  const CategoryIcon = categoryIcons[investment.category] || CircleDollarSign;

  return (
    <Card className="overflow-visible" data-testid={`investment-card-${investment.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3 p-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryIcon className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-sm font-bold tracking-tight" data-testid={`text-investment-name-${investment.id}`}>
              {investment.name}
            </h3>
          </div>
          <Badge variant="secondary" className="text-[9px] uppercase tracking-wider" data-testid={`badge-category-${investment.id}`}>
            {investment.category}
          </Badge>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-lg font-bold font-mono tabular-nums text-foreground" data-testid={`text-yield-${investment.id}`}>
            {investment.nominalReturnRange[0]}–{investment.nominalReturnRange[1]}%
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Nominal</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <p className="text-xs text-muted-foreground leading-relaxed" data-testid={`text-description-${investment.id}`}>
          {investment.description}
        </p>

        {investment.tenors && investment.tenors.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Tenor Breakdown</span>
            <div className="space-y-1">
              {investment.tenors.map((tenor: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs" data-testid={`tenor-row-${investment.id}-${i}`}>
                  <span className="text-muted-foreground">{tenor.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums font-medium text-foreground">
                      {tenor.yieldRange[0]}–{tenor.yieldRange[1]}%
                    </span>
                    {tenor.notes && (
                      <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">{tenor.notes}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px]">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Risk:</span>
              <span className={cn("font-semibold", riskColors[investment.riskLevel])} data-testid={`text-risk-${investment.id}`}>
                {investment.riskLevel}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px]">
              <Droplets className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Liquidity:</span>
              <span className="text-muted-foreground font-medium" data-testid={`text-liquidity-${investment.id}`}>
                {investment.liquidity}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px]">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Inflation Shield:</span>
              <span className={cn("font-medium", protectionColors[investment.inflationProtection])} data-testid={`text-protection-${investment.id}`}>
                {investment.inflationProtection}
              </span>
            </span>
          </div>
          {investment.realYieldRange && (
            <RealYieldBadge range={investment.realYieldRange} />
          )}
        </div>

        <p className="text-[10px] text-muted-foreground/60 italic" data-testid={`text-bestfor-${investment.id}`}>
          {investment.bestFor}
        </p>
      </CardContent>
    </Card>
  );
}
