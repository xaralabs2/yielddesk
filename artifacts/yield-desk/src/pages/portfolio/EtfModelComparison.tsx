import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Target, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { REGIME_COLORS_MAP, SIGNAL_COLORS_MAP } from "./constants";
import type { EtfAllocationData } from "./types";

export function EtfModelComparison({ etfData, holdings, totalValue }: { etfData: EtfAllocationData; holdings: any[]; totalValue: number }) {
  const regimeColors = REGIME_COLORS_MAP[etfData.regime.color] || REGIME_COLORS_MAP.GREY;

  const holdingsByTicker = new Map<string, number>();
  holdings.forEach((h: any) => {
    if (h.ticker) {
      const key = h.ticker.toUpperCase();
      holdingsByTicker.set(key, (holdingsByTicker.get(key) || 0) + h.valueNgn);
    }
  });

  const etfRows = etfData.etfSignals.map(sig => {
    const actualValue = holdingsByTicker.get(sig.symbol.toUpperCase()) || 0;
    const actualPct = totalValue > 0 ? (actualValue / totalValue) * 100 : 0;
    const price = etfData.etfPrices.find(p => p.symbol === sig.symbol);
    return { ...sig, actualValue, actualPct, price };
  });

  return (
    <Card data-testid="card-etf-model">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3 p-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">ETF Signal Tracker</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", regimeColors.bg, regimeColors.text)}>
            {etfData.regime.name}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Current Regime</p>
            <p className="text-sm font-bold" data-testid="text-regime-name">{etfData.regime.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Regime Confidence</p>
            <p className="text-sm font-bold font-mono tabular-nums" data-testid="text-regime-conf">{Math.round(etfData.regime.confidence * 100)}%</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs" data-testid="table-etf-model">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-semibold text-muted-foreground uppercase tracking-wider">ETF</th>
                <th className="text-center py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Signal</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Confidence</th>
                <th className="text-left py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Reasoning</th>
              </tr>
            </thead>
            <tbody>
              {etfRows.map((row) => {
                const signalColor = SIGNAL_COLORS_MAP[row.signal] || "text-muted-foreground";
                const confidencePct = Math.round(row.confidence * 100);

                return (
                  <tr key={row.symbol} className="border-b border-border/50 last:border-0" data-testid={`model-row-${row.symbol}`}>
                    <td className="py-2.5 pr-3">
                      <span className="font-medium text-foreground font-mono">{row.symbol}</span>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{row.name}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={cn("text-[10px] font-bold uppercase", signalColor)}>{row.signal}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={cn("font-mono tabular-nums", confidencePct >= 70 ? "text-emerald-400" : confidencePct >= 50 ? "text-amber-400" : "text-rose-400")}>
                        {confidencePct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left hidden md:table-cell">
                      <span className="text-[10px] text-muted-foreground leading-tight">{row.reasoning}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-start gap-2 pt-2 border-t border-border/50">
          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Directional signals are derived from the current macro regime ({etfData.regime.name}) using live CBN, NBS, and market data. These are research indicators — not allocation recommendations or portfolio instructions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
