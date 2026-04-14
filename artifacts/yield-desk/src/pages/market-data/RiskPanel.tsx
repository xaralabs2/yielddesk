import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { REGIME_COLORS } from "./constants";
import type { EtfAllocationData } from "./types";

export function RiskPanel({ regime }: { regime: EtfAllocationData["regime"] }) {
  const colors = REGIME_COLORS[regime.color] || REGIME_COLORS.GREY;
  const riskLevel = regime.color === "RED" ? "High" : regime.color === "ORANGE" ? "Elevated" : regime.color === "YELLOW" ? "Moderate" : "Low";
  const riskDesc = regime.color === "RED"
    ? "Crisis conditions — preserve capital, avoid new exposure"
    : regime.color === "ORANGE"
    ? "Elevated stress — reduce risk, favour defensive assets"
    : regime.color === "YELLOW"
    ? "Caution warranted — selective opportunities exist"
    : "Favourable conditions — environment supports deployment";
  const confidencePct = Math.round(regime.confidence * 100);
  const confidenceDesc = confidencePct >= 75
    ? "Strong signal — macro indicators clearly aligned"
    : confidencePct >= 50
    ? "Moderate signal — some indicators are mixed"
    : "Weak signal — environment is ambiguous, be cautious";

  return (
    <Card data-testid="card-risk-panel">
      <CardHeader className="flex flex-row items-center gap-2 pb-3 p-4">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">Risk Assessment</h3>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1 p-3 rounded-lg bg-muted/30 border border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Regime Risk</span>
            <p className={cn("text-lg font-bold", colors.text)} data-testid="text-risk-level">{riskLevel}</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{riskDesc}</p>
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/30 border border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Model Confidence</span>
            <p className="text-lg font-bold font-mono tabular-nums" data-testid="text-confidence-overall">{confidencePct}%</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{confidenceDesc}</p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">{regime.summary}</p>
      </CardContent>
    </Card>
  );
}
