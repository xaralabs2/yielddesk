import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/api-helpers";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Plus,
  Target,
  Settings,
  Wallet,
  Upload,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { PortfolioDashboard, EtfAllocationData, EditableHolding } from "./portfolio/types";
import { PILLAR_COLORS } from "./portfolio/constants";
import { formatNgn, formatCompact } from "./portfolio/helpers";
import { MetricCard } from "./portfolio/MetricCard";
import { PillarGauge } from "./portfolio/PillarGauge";
import { AddHoldingDialog } from "./portfolio/AddHoldingDialog";
import { EditHoldingDialog } from "./portfolio/EditHoldingDialog";
import { ConfigDialog } from "./portfolio/ConfigDialog";
import { GuideSection } from "./portfolio/GuideSection";
import { PdfUploadDialog } from "./portfolio/PdfUploadDialog";
import { EtfModelComparison } from "./portfolio/EtfModelComparison";
import { HoldingsTable } from "./portfolio/HoldingsTable";

function PortfolioSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export default function PortfolioPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, dataUpdatedAt } = useQuery<PortfolioDashboard>({
    queryKey: ["/api/portfolio"],
    refetchInterval: 30 * 1000,
  });
  const { data: etfData } = useQuery<EtfAllocationData>({
    queryKey: ["/api/etf/allocation"],
    refetchInterval: 60 * 1000,
  });
  const [addOpen, setAddOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editHolding, setEditHolding] = useState<EditableHolding | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshLabel, setRefreshLabel] = useState("--");
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/portfolio/holdings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({ title: "Holding deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete holding", variant: "destructive" });
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/etf/allocation"] });
    setIsRefreshing(false);
  };

  if (dataUpdatedAt && dataUpdatedAt > 0) {
    const elapsed = Date.now() - dataUpdatedAt;
    const seconds = Math.floor(elapsed / 1000);
    const label = seconds < 5 ? "just now" : seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`;
    if (label !== refreshLabel) {
      setTimeout(() => setRefreshLabel(label), 0);
    }
  }

  if (isLoading) return <PortfolioSkeleton />;
  if (!data) return <div className="p-6 text-muted-foreground">Failed to load portfolio data.</div>;

  const hasBaseline = data.baselineValue > 0;
  const hasHoldings = data.holdings.length > 0;

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-xl font-bold tracking-tight" data-testid="text-portfolio-title">Wealth Portfolio</h2>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
            <span>Three-pillar allocation tracker with inflation-adjusted returns</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">Live</span>
          </div>
          <span className="text-[10px] text-muted-foreground/60 font-mono" data-testid="text-portfolio-refresh">refreshed {refreshLabel}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefresh} data-testid="button-refresh-portfolio">
            <RefreshCw className={cn("h-3 w-3 transition-transform", isRefreshing && "animate-spin")} />
          </Button>
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-open-config">
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Portfolio Configuration</DialogTitle></DialogHeader>
              <ConfigDialog
                currentConfig={{ ...data.config, baselineValue: data.baselineValue, targetValue: data.targetValue, availableCash: data.availableCash, totalCommissions: data.totalCommissions, totalFees: data.totalFees, totalTaxes: data.totalTaxes }}
                onClose={() => setConfigOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-open-upload-pdf">
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload PDF
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Import from Broker Contract Note</DialogTitle></DialogHeader>
              <PdfUploadDialog onClose={() => setUploadOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-open-add-holding">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Holding
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Portfolio Holding</DialogTitle></DialogHeader>
              <AddHoldingDialog onClose={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={!!editHolding} onOpenChange={(open) => { if (!open) setEditHolding(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Holding</DialogTitle></DialogHeader>
          {editHolding && (
            <EditHoldingDialog holding={editHolding} onClose={() => setEditHolding(null)} />
          )}
        </DialogContent>
      </Dialog>

      {hasBaseline && hasHoldings && (() => {
        const hasTarget = data.targetValue > 0;
        const progressPct = hasTarget ? (data.totalValue / data.targetValue) * 100 : 0;
        const growthMultiplier = hasTarget && data.totalValue > 0 ? data.targetValue / data.totalValue : 0;
        const totalCosts = data.totalCommissions + data.totalFees + data.totalTaxes;

        const pillarContributions = data.pillars.map((p) => ({
          name: p.pillar,
          value: p.value,
          pctOfTarget: hasTarget ? (p.value / data.targetValue) * 100 : 0,
          color: PILLAR_COLORS[p.pillar] || "bg-primary",
        }));

        return (
          <div className="space-y-4">
            {hasTarget && (
              <Card data-testid="card-wealth-target">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold" data-testid="text-wealth-target-label">Wealth Target</span>
                    </div>
                    <span className="text-sm font-mono tabular-nums font-bold text-primary" data-testid="text-wealth-target-value">
                      {formatCompact(data.targetValue)}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden flex" data-testid="progress-wealth-target">
                    {pillarContributions.map((pc) => {
                      const totalPct = pillarContributions.reduce((s, x) => s + x.pctOfTarget, 0);
                      const scaledWidth = totalPct > 100 ? (pc.pctOfTarget / totalPct) * 100 : pc.pctOfTarget;
                      return (
                        <div
                          key={pc.name}
                          className={cn("h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full", pc.color)}
                          style={{ width: `${scaledWidth}%` }}
                          title={`${pc.name}: ${pc.pctOfTarget.toFixed(2)}%`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {pillarContributions.map((pc) => (
                      <div key={pc.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <div className={cn("h-2 w-2 rounded-full", pc.color)} />
                        <span>{pc.name}</span>
                        <span className="font-mono tabular-nums font-semibold">{pc.pctOfTarget.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Current Value</p>
                      <p className="text-sm font-bold font-mono tabular-nums" data-testid="text-target-current">{formatCompact(data.totalValue)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Achieved</p>
                      <p className="text-sm font-bold font-mono tabular-nums text-primary" data-testid="text-target-pct">{progressPct.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Growth Needed</p>
                      <p className="text-sm font-bold font-mono tabular-nums" data-testid="text-target-multiplier">{growthMultiplier.toFixed(2)}x</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Gap</p>
                      <p className="text-sm font-bold font-mono tabular-nums text-muted-foreground" data-testid="text-target-gap">{formatCompact(Math.max(data.targetValue - data.totalValue, 0))}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Total Value"
                value={formatCompact(data.totalValue)}
                subtitle={hasTarget ? `${progressPct.toFixed(2)}% of ${formatCompact(data.targetValue)}` : undefined}
                testId="metric-total-value"
              />
              <MetricCard
                label="Nominal Return"
                value={`${data.nominalReturn > 0 ? "+" : ""}${data.nominalReturn.toFixed(2)}%`}
                subtitle={`Baseline: ${formatCompact(data.baselineValue)}`}
                color={data.nominalReturn >= 0 ? "text-emerald-500" : "text-rose-500"}
                testId="metric-nominal-return"
              />
              <MetricCard
                label="Real Return"
                value={`${data.realReturn > 0 ? "+" : ""}${data.realReturn.toFixed(2)}%`}
                subtitle={`CPI: ${data.currentInflation.toFixed(2)}%`}
                color={data.realReturn >= 0 ? "text-emerald-500" : "text-rose-500"}
                icon={data.realReturn >= 0 ? ArrowUpRight : ArrowDownRight}
                testId="metric-real-return"
              />
              <MetricCard
                label="Available Cash"
                value={formatNgn(data.availableCash)}
                subtitle="Brokerage cash balance"
                icon={Wallet}
                testId="metric-available-cash"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Capital Deployed"
                value={formatCompact(data.baselineValue)}
                subtitle="All pillars total cost"
                testId="metric-baseline"
              />
              <MetricCard
                label="Commissions"
                value={formatNgn(data.totalCommissions)}
                subtitle="NGX brokerage (1.35%)"
                color="text-amber-500"
                testId="metric-commissions"
              />
              <MetricCard
                label="Total Costs"
                value={formatNgn(totalCosts)}
                subtitle={`Fees ${formatNgn(data.totalFees)} + Duty ${formatNgn(data.totalTaxes)}`}
                color="text-amber-500"
                testId="metric-total-costs"
              />
              <MetricCard
                label="Cost Drag"
                value={data.baselineValue > 0 ? `${(totalCosts / data.baselineValue * 100).toFixed(2)}%` : "0%"}
                subtitle="All costs vs capital deployed"
                color="text-amber-500"
                testId="metric-cost-drag"
              />
            </div>
          </div>
        );
      })()}

      {!hasBaseline && hasHoldings && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 p-4">
            <Target className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Set your wealth target</p>
              <p className="text-xs text-muted-foreground">Click Configure to set your wealth target. Your cost basis is auto-calculated from your holdings. The target lets you track how far you are from your goal.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasHoldings && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Wallet className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">No holdings yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first asset to start tracking your wealth allocation across the three pillars.</p>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)} data-testid="button-empty-add">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add First Holding
            </Button>
          </CardContent>
        </Card>
      )}

      {hasHoldings && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="pillars-grid">
            {data.pillars.map((p) => (
              <PillarGauge key={p.pillar} pillar={p} totalValue={data.totalValue} tolerance={data.config.tolerance} targetValue={data.targetValue} />
            ))}
          </div>

          {data.alerts.length > 0 && (
            <Card data-testid="card-alerts">
              <CardHeader className="flex flex-row items-center gap-2 pb-3 p-4">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Rebalance Signals</h3>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                {data.alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs p-2 rounded-md bg-muted/50" data-testid={`alert-row-${i}`}>
                    <Badge
                      variant="secondary"
                      className={cn("text-[9px] uppercase tracking-wider shrink-0", alert.direction === "over" ? "text-amber-500" : "text-rose-500")}
                    >
                      {alert.pillar} {alert.direction === "over" ? "+" : ""}{(alert.drift * 100).toFixed(2)}%
                    </Badge>
                    <span className="text-muted-foreground">{alert.action}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <HoldingsTable
            data={data}
            onEdit={setEditHolding}
            onDelete={(id) => deleteMutation.mutate(id)}
            isDeleting={deleteMutation.isPending}
          />
        </>
      )}

      {hasBaseline && hasHoldings && data.realReturn < 0 && (
        <Card className="border-rose-500/30" data-testid="card-real-return-warning">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Inflation is eroding your wealth</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Your portfolio grew {data.nominalReturn.toFixed(2)}% but inflation is {data.currentInflation.toFixed(2)}%.
                Real purchasing power declined by {Math.abs(data.realReturn).toFixed(2)}%.
                Consider increasing exposure to inflation-linked assets.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {etfData && etfData.etfSignals && etfData.etfSignals.length > 0 && hasHoldings && (
        <EtfModelComparison etfData={etfData} holdings={data?.holdings || []} totalValue={data?.totalValue || 0} />
      )}

      <GuideSection />
    </div>
  );
}
