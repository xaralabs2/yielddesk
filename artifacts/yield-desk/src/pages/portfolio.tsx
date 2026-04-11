import { useGetPortfolioSummary, useGetPortfolioAnalytics } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  TrendingUp,
  Banknote,
  PieChart,
  Shield,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PillarSummary = {
  pillar: string;
  value: number;
  weight: number;
  target: number;
  drift: number;
  holdings: { asset: string; value: number }[];
};

type RebalanceAlert = {
  pillar: string;
  drift: number;
  direction: "over" | "under";
  action: string;
};

type PortfolioDashboard = {
  totalValue: number;
  baselineValue: number;
  targetValue: number;
  nominalReturn: number;
  realReturn: number;
  currentInflation: number;
  pillars: PillarSummary[];
  alerts: RebalanceAlert[];
  holdings: unknown[];
  config: { stabilityTarget: number; inflationTarget: number; strategicTarget: number; tolerance: number };
  availableCash: number;
  fxRate: number;
};

const PILLAR_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Stability: { bg: "bg-teal-500/10", text: "text-teal-500", bar: "bg-teal-500" },
  "Inflation Hedge": { bg: "bg-emerald-500/10", text: "text-emerald-500", bar: "bg-emerald-500" },
  Strategic: { bg: "bg-indigo-500/10", text: "text-indigo-500", bar: "bg-indigo-500" },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

function formatPercent(n: number) {
  return `${n.toFixed(2)}%`;
}

function PillarGauge({ pillar, totalValue, tolerance }: { pillar: PillarSummary; totalValue: number; tolerance: number }) {
  const colors = PILLAR_COLORS[pillar.pillar] || PILLAR_COLORS.Stability;
  const actualPct = totalValue > 0 ? (pillar.weight * 100) : 0;
  const targetPct = pillar.target * 100;
  const driftPct = pillar.drift * 100;
  const isOutOfBand = Math.abs(pillar.drift) > tolerance;

  return (
    <div className={cn("rounded-lg border p-4 space-y-3", isOutOfBand ? "border-amber-500/50" : "border-border")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-2.5 h-2.5 rounded-full", colors.bar)} />
          <span className="text-sm font-semibold">{pillar.pillar}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-mono tabular-nums">{actualPct.toFixed(1)}%</span>
          <span className="text-xs text-muted-foreground">/ {targetPct.toFixed(0)}%</span>
        </div>
      </div>

      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", colors.bar)} style={{ width: `${Math.min(actualPct, 100)}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-foreground/40" style={{ left: `${Math.min(targetPct, 100)}%` }} />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{formatCurrency(pillar.value)}</span>
        <span className={cn("font-mono font-medium", driftPct > 0 ? "text-emerald-500" : driftPct < 0 ? "text-rose-500" : "text-muted-foreground")}>
          {driftPct > 0 ? "+" : ""}{driftPct.toFixed(1)}% drift
        </span>
      </div>

      {pillar.holdings.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border/50">
          {pillar.holdings.slice(0, 3).map((h) => (
            <div key={h.asset} className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate max-w-[140px]">{h.asset}</span>
              <span className="font-mono">{formatCurrency(h.value)}</span>
            </div>
          ))}
          {pillar.holdings.length > 3 && (
            <span className="text-[10px] text-muted-foreground/60">+{pillar.holdings.length - 3} more</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function PortfolioPage() {
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useGetPortfolioSummary();
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError } = useGetPortfolioAnalytics();

  const { data: pillarData, isError: pillarError } = useQuery<PortfolioDashboard>({
    queryKey: ["/api/portfolio"],
    refetchInterval: 60 * 1000,
  });

  if (summaryLoading || analyticsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (summaryError || analyticsError) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto text-destructive mb-3" />
            <h3 className="text-sm font-semibold mb-1">Failed to load portfolio data</h3>
            <p className="text-xs text-muted-foreground">Please try refreshing the page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasPillarData = pillarData && pillarData.pillars && pillarData.pillars.length > 0;

  return (
    <div className="p-6 space-y-6" data-testid="portfolio-page">
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Allocation breakdown and analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card data-testid="card-portfolio-total">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <Briefcase className="w-3.5 h-3.5" /> Total Capital
            </div>
            <div className="text-xl font-bold font-mono">{formatCurrency(summary?.totalCapital ?? 0)}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-effective-yield">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5" /> Effective Yield
            </div>
            <div className="text-xl font-bold font-mono">{formatPercent(analytics?.effectiveYield ?? 0)}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-deployed">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <Banknote className="w-3.5 h-3.5" /> Deployed
            </div>
            <div className="text-xl font-bold font-mono">{formatCurrency(analytics?.totalDeployed ?? 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">{formatPercent(analytics?.capitalDeploymentRate ?? 0)}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-idle">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <Banknote className="w-3.5 h-3.5" /> Idle Cash
            </div>
            <div className="text-xl font-bold font-mono">{formatCurrency(analytics?.totalIdle ?? 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">{formatPercent(analytics?.idleCashPercentage ?? 0)}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-holdings-count">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <PieChart className="w-3.5 h-3.5" /> Holdings
            </div>
            <div className="text-xl font-bold font-mono">{summary?.activeHoldings ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">of {summary?.holdingsCount ?? 0} total</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-l-4 border-l-primary" data-testid="card-deployment-bar">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Capital Deployment</span>
            <span className="text-sm font-mono">{formatPercent(analytics?.capitalDeploymentRate ?? 0)}</span>
          </div>
          <Progress value={analytics?.capitalDeploymentRate ?? 0} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Deployed: {formatCurrency(analytics?.totalDeployed ?? 0)}</span>
            <span>Idle: {formatCurrency(analytics?.totalIdle ?? 0)}</span>
          </div>
        </CardContent>
      </Card>

      {hasPillarData && (
        <>
          <div className="space-y-4" data-testid="section-3-pillar">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-semibold">3-Pillar Framework</h2>
              {pillarData.realReturn !== undefined && (
                <div className="ml-auto flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">Nominal:</span>
                    <span className={cn("font-mono font-semibold", pillarData.nominalReturn >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {pillarData.nominalReturn >= 0 ? "+" : ""}{pillarData.nominalReturn.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">Real:</span>
                    <span className={cn("font-mono font-semibold", pillarData.realReturn >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {pillarData.realReturn >= 0 ? "+" : ""}{pillarData.realReturn.toFixed(1)}%
                    </span>
                    {pillarData.realReturn >= 0 ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownRight className="w-3 h-3 text-rose-500" />}
                  </div>
                  <Badge variant="outline" className="text-[10px]">CPI {pillarData.currentInflation?.toFixed(1)}%</Badge>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pillarData.pillars.map((p) => (
                <PillarGauge
                  key={p.pillar}
                  pillar={p}
                  totalValue={pillarData.totalValue}
                  tolerance={pillarData.config.tolerance}
                />
              ))}
            </div>
          </div>

          {pillarData.alerts && pillarData.alerts.length > 0 && (
            <Card className="border-l-4 border-l-amber-500" data-testid="card-rebalance-alerts">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Rebalance Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pillarData.alerts.map((alert, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <div className={cn("mt-0.5 w-2 h-2 rounded-full shrink-0", alert.direction === "over" ? "bg-emerald-500" : "bg-rose-500")} />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{alert.pillar}</span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {alert.direction === "over" ? "+" : ""}{(alert.drift * 100).toFixed(1)}% {alert.direction}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{alert.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pillarData.fxRate > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Portfolio Value</div>
                <div className="text-sm font-bold font-mono">{formatCurrency(pillarData.totalValue)}</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Baseline</div>
                <div className="text-sm font-bold font-mono">{formatCurrency(pillarData.baselineValue)}</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Target</div>
                <div className="text-sm font-bold font-mono">{formatCurrency(pillarData.targetValue)}</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">USD/NGN</div>
                <div className="text-sm font-bold font-mono">₦{pillarData.fxRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-by-type">
          <CardHeader>
            <CardTitle className="text-base">Allocation by Asset Type</CardTitle>
          </CardHeader>
          <CardContent>
            {(!summary?.allocationByType || summary.allocationByType.length === 0) ? (
              <p className="text-sm text-muted-foreground">No holdings</p>
            ) : (
              <div className="space-y-4">
                {summary.allocationByType.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono">{item.name}</Badge>
                        <span className="text-sm text-muted-foreground">{formatCurrency(item.value)}</span>
                      </div>
                      <span className="text-sm font-mono">{item.percentage}%</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card data-testid="card-by-issuer">
          <CardHeader>
            <CardTitle className="text-base">Allocation by Issuer</CardTitle>
          </CardHeader>
          <CardContent>
            {(!summary?.allocationByIssuer || summary.allocationByIssuer.length === 0) ? (
              <p className="text-sm text-muted-foreground">No holdings</p>
            ) : (
              <div className="space-y-4">
                {summary.allocationByIssuer.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{formatCurrency(item.value)}</span>
                        <span className="text-sm font-mono">{item.percentage}%</span>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!hasPillarData && (
        <Card className="border-dashed" data-testid="card-pillar-empty">
          <CardContent className="py-8 text-center">
            <Shield className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold mb-1">3-Pillar Framework</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              The 3-pillar framework (Stability, Inflation Hedge, Strategic) provides macro-aware allocation targets and rebalance signals. Add portfolio holdings and configure pillar targets to activate.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
