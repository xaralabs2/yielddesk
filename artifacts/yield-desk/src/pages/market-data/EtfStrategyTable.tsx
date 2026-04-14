import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIGNAL_COLORS, SIGNAL_BG } from "./constants";
import type { EtfAllocationData } from "./types";

export function EtfStrategyTable({ signals, prices }: { signals: EtfAllocationData["etfSignals"]; prices: EtfAllocationData["etfPrices"] }) {
  const priceMap = new Map(prices.map(p => [p.symbol, p]));

  return (
    <Card data-testid="card-etf-strategy">
      <CardHeader className="flex flex-row items-center gap-2 pb-3 p-4">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">ETF Strategy Signals</h3>
        <span className="text-[10px] text-muted-foreground font-mono ml-auto">{signals.length} ETFs tracked</span>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-[10px] text-muted-foreground mb-3">Macro-regime-driven signals for NGX-listed ETFs. These are research indicators to inform your investment decisions — not portfolio positions.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" data-testid="table-etf-strategy">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-semibold text-muted-foreground uppercase tracking-wider">ETF</th>
                <th className="text-left py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-center py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Signal</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Confidence</th>
                <th className="text-left py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Reasoning</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Price (NGN)</th>
                <th className="text-right py-2 pl-3 font-semibold text-muted-foreground uppercase tracking-wider">1D Chg</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((sig) => {
                const price = priceMap.get(sig.symbol);
                const signalColor = SIGNAL_COLORS[sig.signal] || "text-muted-foreground";
                const signalBg = SIGNAL_BG[sig.signal] || "";
                const confidencePct = Math.round(sig.confidence * 100);
                const change1d = price?.change1d ?? 0;

                return (
                  <tr key={sig.symbol} className="border-b border-border/50 last:border-0" data-testid={`etf-row-${sig.symbol}`}>
                    <td className="py-2.5 pr-3">
                      <div>
                        <span className="font-medium text-foreground font-mono">{sig.symbol}</span>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{sig.name}</div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{sig.role}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", signalBg, signalColor)}>
                        {sig.signal}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={cn("font-mono tabular-nums", confidencePct >= 70 ? "text-emerald-400" : confidencePct >= 50 ? "text-amber-400" : "text-rose-400")}>
                        {confidencePct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left hidden lg:table-cell">
                      <span className="text-[10px] text-muted-foreground leading-tight">{sig.reasoning}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-foreground">
                      {price ? `₦${price.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono tabular-nums">
                      {price ? (
                        <span className={cn(change1d >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {change1d >= 0 ? "+" : ""}{change1d.toFixed(2)}%
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {signals.length > 0 && signals[0].reasoning && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground/60 italic">
              Regime: {signals[0].regime} — {signals[0].reasoning}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
