import { useGetPortfolioSummary, useGetPortfolioAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Briefcase, TrendingUp, Banknote, PieChart } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

function formatPercent(n: number) {
  return `${n.toFixed(2)}%`;
}

export default function PortfolioPage() {
  const { data: summary, isLoading: summaryLoading } = useGetPortfolioSummary();
  const { data: analytics, isLoading: analyticsLoading } = useGetPortfolioAnalytics();

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
    </div>
  );
}
