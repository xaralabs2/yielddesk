import { useGetDashboardSummary, useListMaturingHoldings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, PieChart, Activity, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

function formatPercent(n: number) {
  return `${n.toFixed(2)}%`;
}

export default function DashboardPage() {
  const { data, isLoading } = useGetDashboardSummary();
  const { data: maturingHoldings } = useListMaturingHoldings();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="dashboard-loading">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6" data-testid="dashboard-error">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="w-12 h-12 text-destructive/50 mb-4" />
            <p className="text-muted-foreground mb-4">Failed to load dashboard data</p>
            <button onClick={() => window.location.reload()} className="text-primary text-sm hover:underline">Retry</button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { decision, latestSignal, portfolioSnapshot, analytics, unreadAlerts, maturingSoonCount, recentDeals } = data;

  const actionColors: Record<string, string> = {
    INVEST_CP: "bg-success text-success-foreground",
    LOCK_BONDS: "bg-primary text-primary-foreground",
    HOLD_MMMF: "bg-warning text-warning-foreground",
  };

  const confidenceColors: Record<string, string> = {
    HIGH: "bg-success/10 text-success border-success/30",
    MEDIUM: "bg-warning/10 text-warning border-warning/30",
    LOW: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <div className="p-6 space-y-6" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Capital allocation overview</p>
        </div>
        {unreadAlerts > 0 && (
          <Link href="/alerts">
            <Badge variant="destructive" className="cursor-pointer gap-1" data-testid="badge-unread-alerts">
              <AlertTriangle className="w-3 h-3" />
              {unreadAlerts} unread alert{unreadAlerts > 1 ? "s" : ""}
            </Badge>
          </Link>
        )}
      </div>

      <Card className="border-l-4 border-l-primary" data-testid="card-decision">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Decision Engine</div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded text-sm font-bold ${actionColors[decision.action] || ""}`}>
                  {decision.action.replace("_", " ")}
                </span>
                <Badge variant="outline" className={confidenceColors[decision.confidence] || ""} data-testid="badge-confidence">
                  {decision.confidence} confidence
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{decision.reason}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Suggested Amount</div>
              <div className="text-2xl font-bold font-mono" data-testid="text-suggested-amount">{formatCurrency(decision.amount)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-capital">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <DollarSign className="w-3.5 h-3.5" /> Total Capital
            </div>
            <div className="text-2xl font-bold font-mono">{formatCurrency(portfolioSnapshot.totalCapital)}</div>
            <div className="text-xs text-muted-foreground mt-1">{portfolioSnapshot.activeHoldings} active holdings</div>
          </CardContent>
        </Card>
        <Card data-testid="card-effective-yield">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5" /> Effective Yield
            </div>
            <div className="text-2xl font-bold font-mono">{formatPercent(analytics.effectiveYield)}</div>
            <div className="text-xs text-muted-foreground mt-1">{formatPercent(analytics.capitalDeploymentRate)} deployed</div>
          </CardContent>
        </Card>
        <Card data-testid="card-cp-rate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <Activity className="w-3.5 h-3.5" /> CP Rate
            </div>
            <div className="text-2xl font-bold font-mono">{formatPercent(latestSignal.cpRate)}</div>
            <div className="text-xs text-muted-foreground mt-1">Threshold: 18%</div>
          </CardContent>
        </Card>
        <Card data-testid="card-bond-yield">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <TrendingDown className="w-3.5 h-3.5" /> Bond Yield
            </div>
            <div className="text-2xl font-bold font-mono">{formatPercent(latestSignal.bondYield)}</div>
            <div className="text-xs text-muted-foreground mt-1">Threshold: 17%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-allocation">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="w-4 h-4" /> Allocation by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioSnapshot.allocationByType.length === 0 ? (
              <p className="text-sm text-muted-foreground">No holdings yet</p>
            ) : (
              <div className="space-y-3">
                {portfolioSnapshot.allocationByType.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs font-mono">{item.name}</Badge>
                      <span className="text-sm text-muted-foreground">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${item.percentage}%` }} />
                      </div>
                      <span className="text-sm font-mono w-12 text-right">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-maturing">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4" /> Maturing Soon
              {maturingSoonCount > 0 && <Badge variant="destructive" className="text-xs">{maturingSoonCount}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!maturingHoldings || maturingHoldings.length === 0) ? (
              <p className="text-sm text-muted-foreground">No holdings maturing in the next 7 days</p>
            ) : (
              <div className="space-y-3">
                {maturingHoldings.map((h) => (
                  <div key={h.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <div className="text-sm font-medium">{h.issuer}</div>
                      <div className="text-xs text-muted-foreground">{h.type} - {formatCurrency(h.amount)}</div>
                    </div>
                    <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                      {h.daysRemaining} day{h.daysRemaining !== 1 ? "s" : ""} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {recentDeals.length > 0 && (
        <Card data-testid="card-recent-deals">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Deals</CardTitle>
            <Link href="/deals" className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="link-view-deals">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="pb-2 pr-4">Issuer</th>
                    <th className="pb-2 pr-4">Rate</th>
                    <th className="pb-2 pr-4">Tenor</th>
                    <th className="pb-2 pr-4">Min Amount</th>
                    <th className="pb-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeals.map((deal) => (
                    <tr key={deal.id} className="border-b last:border-0" data-testid={`row-deal-${deal.id}`}>
                      <td className="py-2 pr-4 font-medium">{deal.issuer}</td>
                      <td className="py-2 pr-4 font-mono">{formatPercent(deal.rate)}</td>
                      <td className="py-2 pr-4">{deal.tenorDays}d</td>
                      <td className="py-2 pr-4 font-mono">{formatCurrency(deal.minAmount)}</td>
                      <td className="py-2">
                        <Badge variant="outline" className={`text-xs ${deal.riskLevel === "LOW" ? "border-success/30 text-success" : deal.riskLevel === "MEDIUM" ? "border-warning/30 text-warning" : "border-destructive/30 text-destructive"}`}>
                          {deal.riskLevel}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
