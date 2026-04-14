import { Fragment } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PILLAR_COLORS, PILLAR_TEXT_COLORS, PILLAR_KEYS } from "./constants";
import { formatNgn, normalizeTicker } from "./helpers";
import type { PortfolioDashboard, EditableHolding } from "./types";

type HoldingsTableProps = {
  data: PortfolioDashboard;
  onEdit: (holding: EditableHolding) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
};

export function HoldingsTable({ data, onEdit, onDelete, isDeleting }: HoldingsTableProps) {
  const grouped = new Map<string, { asset: string; ticker: string | null; pillar: string; totalValue: number; totalShares: number; totalEntryValue: number; ids: number[]; annualRentNgn: number | null; corridor: string | null; entryDate: string | null; cumulativeRentNgn: number | null; strategicIrr: number | null; gainLossPct: number | null; livePrice: number | null }>();
  data.holdings.forEach((h: any) => {
    const normalizedTicker = normalizeTicker(h.ticker || h.asset);
    const key = normalizedTicker + "|" + h.pillar + "|" + (h.corridor || "");
    const existing = grouped.get(key);
    if (existing) {
      existing.totalValue += h.valueNgn;
      existing.totalShares += h.shares || 0;
      existing.totalEntryValue += h.entryValueNgn || h.valueNgn;
      existing.ids.push(h.id);
      if (h.livePrice) existing.livePrice = h.livePrice;
      if (h.annualRentNgn) existing.annualRentNgn = (existing.annualRentNgn || 0) + h.annualRentNgn;
      if (h.cumulativeRentNgn) existing.cumulativeRentNgn = (existing.cumulativeRentNgn || 0) + h.cumulativeRentNgn;
    } else {
      grouped.set(key, {
        asset: h.asset,
        ticker: normalizedTicker !== (h.ticker || h.asset).toUpperCase().trim() ? normalizedTicker : h.ticker,
        pillar: h.pillar,
        totalValue: h.valueNgn,
        totalShares: h.shares || 0,
        totalEntryValue: h.entryValueNgn || h.valueNgn,
        ids: [h.id],
        annualRentNgn: h.annualRentNgn || null,
        corridor: h.corridor || null,
        entryDate: h.entryDate || null,
        cumulativeRentNgn: h.cumulativeRentNgn || null,
        strategicIrr: h.strategicIrr ?? null,
        gainLossPct: h.gainLossPct ?? null,
        livePrice: h.livePrice ?? null,
      });
    }
  });
  grouped.forEach((g) => {
    if (g.pillar !== "STRATEGIC" && g.totalEntryValue > 0 && g.livePrice) {
      g.gainLossPct = parseFloat(((g.totalValue - g.totalEntryValue) / g.totalEntryValue * 100).toFixed(2));
    }
    if (g.pillar === "STRATEGIC" && g.totalEntryValue > 0 && g.totalEntryValue !== g.totalValue) {
      g.gainLossPct = parseFloat(((g.totalValue - g.totalEntryValue) / g.totalEntryValue * 100).toFixed(2));
    }
  });
  const pillarOrder = ["STABILITY", "INFLATION", "STRATEGIC"];
  const entries = Array.from(grouped.entries());
  const byPillar = pillarOrder.map((p) => ({
    pillar: p,
    label: PILLAR_KEYS[p] || p,
    color: PILLAR_TEXT_COLORS[PILLAR_KEYS[p] || p] || "text-primary",
    bgColor: PILLAR_COLORS[PILLAR_KEYS[p] || p] || "bg-primary",
    items: entries.filter(([, g]) => g.pillar === p),
    subtotal: entries.filter(([, g]) => g.pillar === p).reduce((s, [, g]) => s + g.totalValue, 0),
  })).filter((g) => g.items.length > 0);
  const colCount = data.targetValue > 0 ? 10 : 9;

  return (
    <Card data-testid="card-holdings-table">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3 p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">All Holdings</h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{data.holdings.length} positions</span>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs" data-testid="table-holdings">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-semibold text-muted-foreground uppercase tracking-wider">Asset</th>
                <th className="text-center py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Pillar</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Qty</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Cost Price</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Current Price</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Value (NGN)</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Yield / IRR</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Weight</th>
                {data.targetValue > 0 && <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">vs Target</th>}
                <th className="text-right py-2 pl-3 font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {byPillar.map((group) => (
                <Fragment key={`group-${group.pillar}`}>
                  <tr className="bg-muted/30" data-testid={`pillar-group-header-${group.pillar.toLowerCase()}`}>
                    <td colSpan={colCount} className="py-2 px-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", group.bgColor)} />
                          <span className={cn("text-xs font-bold uppercase tracking-wider", group.color)}>{group.label}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{group.items.length} position{group.items.length !== 1 ? "s" : ""}</span>
                        </div>
                        <span className="text-xs font-mono tabular-nums font-semibold text-foreground">{formatNgn(group.subtotal)}</span>
                      </div>
                    </td>
                  </tr>
                  {group.items.map(([key, g]) => {
                    const weight = data.totalValue > 0 ? (g.totalValue / data.totalValue * 100).toFixed(2) : "0.00";
                    const costPrice = g.totalShares > 0 ? g.totalEntryValue / g.totalShares : 0;
                    return (
                      <tr key={key} className="border-b border-border/50 last:border-0" data-testid={`holding-row-${g.ids[0]}`}>
                        <td className="py-2.5 pr-3 pl-5 font-medium text-foreground">
                          <div>
                            {g.asset}
                            {g.ticker && g.ticker !== g.asset && <span className="text-muted-foreground ml-1.5 font-mono text-[10px]">{g.ticker}</span>}
                            {g.corridor && <span className="text-teal-400/70 ml-1.5 text-[10px]">· {g.corridor}</span>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
                            {PILLAR_KEYS[g.pillar] || g.pillar}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-muted-foreground">{g.totalShares ? g.totalShares.toLocaleString() : "-"}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-muted-foreground">
                          {g.totalShares > 0 ? formatNgn(costPrice) : g.pillar === "STRATEGIC" && g.totalEntryValue > 0 && g.totalEntryValue !== g.totalValue ? formatNgn(g.totalEntryValue) : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-foreground">
                          {g.livePrice ? (
                            <div>
                              <span>{formatNgn(g.livePrice)}</span>
                              <div className="text-[9px] text-teal-400">NGX LIVE</div>
                            </div>
                          ) : g.totalShares ? (
                            <div>
                              <span className="text-muted-foreground">—</span>
                              <div className="text-[9px] text-yellow-500/70">NO FEED</div>
                            </div>
                          ) : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-foreground">
                          {g.pillar !== "STRATEGIC" && g.totalShares > 0 && !g.livePrice ? (
                            <div>
                              <span className="text-muted-foreground">{formatNgn(g.totalEntryValue)}</span>
                              <div className="text-[9px] text-yellow-500/70">AT COST</div>
                            </div>
                          ) : formatNgn(g.totalValue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums" data-testid={`holding-yield-${g.ids[0]}`}>
                          {g.pillar === "STRATEGIC" ? (
                            <div>
                              {g.annualRentNgn && g.totalValue > 0 && (
                                <span className="text-teal-400">{((g.annualRentNgn / g.totalValue) * 100).toFixed(2)}% yield</span>
                              )}
                              {g.gainLossPct != null && (
                                <div className="text-[9px]" data-testid={`holding-strategic-gainloss-${g.ids[0]}`}>
                                  <span className={g.gainLossPct >= 0 ? "text-emerald-400" : "text-red-400"}>
                                    {g.gainLossPct >= 0 ? "+" : ""}{g.gainLossPct.toFixed(2)}% {g.gainLossPct >= 0 ? "gain" : "loss"}
                                  </span>
                                </div>
                              )}
                              {g.strategicIrr != null && (
                                <div className="text-[9px] text-amber-400" data-testid={`holding-irr-${g.ids[0]}`}>
                                  IRR {g.strategicIrr > 0 ? "+" : ""}{g.strategicIrr}%
                                </div>
                              )}
                              {g.cumulativeRentNgn != null && g.cumulativeRentNgn > 0 && (
                                <div className="text-[9px] text-muted-foreground" data-testid={`holding-cumrent-${g.ids[0]}`}>
                                  ₦{g.cumulativeRentNgn.toLocaleString()} rent
                                </div>
                              )}
                              {!g.annualRentNgn && g.gainLossPct == null && g.strategicIrr == null && (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          ) : g.gainLossPct != null ? (
                            <div data-testid={`holding-gainloss-${g.ids[0]}`}>
                              <span className={g.gainLossPct >= 0 ? "text-emerald-400" : "text-red-400"}>
                                {g.gainLossPct >= 0 ? "+" : ""}{g.gainLossPct.toFixed(2)}%
                              </span>
                              <div className="text-[9px] text-muted-foreground">
                                {g.gainLossPct >= 0 ? "gain" : "loss"} · cost ₦{g.totalEntryValue.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-muted-foreground">{weight}%</td>
                        {data.targetValue > 0 && (
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-muted-foreground" data-testid={`holding-target-pct-${g.ids[0]}`}>
                            {(g.totalValue / data.targetValue * 100).toFixed(4)}%
                          </td>
                        )}
                        <td className="py-2.5 pl-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const original = data.holdings.find((h: any) => h.id === g.ids[0]);
                                onEdit({
                                  id: g.ids[0],
                                  asset: original?.asset ?? g.asset,
                                  ticker: original?.ticker ?? g.ticker,
                                  pillar: original?.pillar ?? g.pillar,
                                  valueNgn: original?.valueNgn ?? g.totalValue,
                                  shares: original?.shares ?? 0,
                                  entryValueNgn: original?.entryValueNgn ?? null,
                                  annualRentNgn: original?.annualRentNgn ?? g.annualRentNgn,
                                  corridor: original?.corridor ?? g.corridor,
                                  entryDate: original?.entryDate ?? g.entryDate,
                                  cumulativeRentNgn: original?.cumulativeRentNgn ?? g.cumulativeRentNgn,
                                });
                              }}
                              data-testid={`button-edit-holding-${g.ids[0]}`}
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => g.ids.forEach((id) => onDelete(id))}
                              disabled={isDeleting}
                              data-testid={`button-delete-holding-${g.ids[0]}`}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
