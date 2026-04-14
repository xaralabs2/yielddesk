import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  CircleDollarSign,
  Info,
  RefreshCw,
  Activity,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import type { InvestmentLandscapeData, EtfAllocationData, RatesSummary, MarketData, PolicyRate, ExchangeRateEntry } from "./market-data/types";
import { getAuthHeaders, protectionColors, riskColors } from "./market-data/constants";
import { RegimeBanner } from "./market-data/RegimeBanner";
import { RiskPanel } from "./market-data/RiskPanel";
import { EtfStrategyTable } from "./market-data/EtfStrategyTable";
import { FactorRotation } from "./market-data/FactorRotation";
import { InvestmentCard } from "./market-data/InvestmentCard";
import { CbnDataSection } from "./market-data/CbnDataSection";

function MacroPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono" data-testid={`macro-pill-${label.toLowerCase()}`}>
      <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </span>
  );
}

function AllocationBar({ label, range, color, width }: { label: string; range: string; color: string; width: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums text-foreground font-medium">{range}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width }} />
      </div>
    </div>
  );
}

export default function MarketDataPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, dataUpdatedAt } = useQuery<InvestmentLandscapeData>({
    queryKey: ["/api/investments"],
    refetchInterval: 30 * 1000,
  });

  const { data: etfData, isLoading: etfLoading } = useQuery<EtfAllocationData>({
    queryKey: ["/api/etf/allocation"],
    refetchInterval: 60 * 1000,
  });

  const { data: rates, isLoading: ratesLoading } = useQuery<RatesSummary>({
    queryKey: ["/api/cbn/rates-summary"],
    queryFn: async () => {
      const res = await fetch("/api/cbn/rates-summary", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch rates");
      return res.json();
    },
  });

  const { data: marketData, isLoading: dataLoading } = useQuery<MarketData>({
    queryKey: ["/api/cbn/market-data"],
    queryFn: async () => {
      const res = await fetch("/api/cbn/market-data", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch market data");
      return res.json();
    },
  });

  const { data: policyRates } = useQuery<PolicyRate[]>({
    queryKey: ["/api/cbn/policy-rates"],
    queryFn: async () => {
      const res = await fetch("/api/cbn/policy-rates", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch policy rates");
      return res.json();
    },
  });

  const { data: fxData } = useQuery<{ rates: Record<string, ExchangeRateEntry[]>; latest: ExchangeRateEntry[] }>({
    queryKey: ["/api/cbn/exchange-rates"],
    queryFn: async () => {
      const res = await fetch("/api/cbn/exchange-rates", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch exchange rates");
      return res.json();
    },
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshLabel, setRefreshLabel] = useState("--");
  const [syncing, setSyncing] = useState(false);
  const [showCbnData, setShowCbnData] = useState(false);

  useEffect(() => {
    if (!dataUpdatedAt) return;
    const update = () => {
      const seconds = Math.floor((Date.now() - dataUpdatedAt) / 1000);
      if (seconds < 5) setRefreshLabel("just now");
      else if (seconds < 60) setRefreshLabel(`${seconds}s ago`);
      else setRefreshLabel(`${Math.floor(seconds / 60)}m ago`);
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/etf/allocation"] }),
    ]).then(() => {
      setTimeout(() => setIsRefreshing(false), 600);
    });
  };

  const handleCbnSync = async () => {
    setSyncing(true);
    try {
      const headers = getAuthHeaders() as Record<string, string>;
      headers["Content-Type"] = "application/json";
      const res = await fetch("/api/cbn/sync-all", { method: "POST", headers });
      const result = await res.json();
      if (result.success) {
        toast({ title: "All data refreshed", description: "Market data, policy rates, and exchange rates updated" });
        queryClient.invalidateQueries({ queryKey: ["/api/cbn/rates-summary"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cbn/market-data"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cbn/policy-rates"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cbn/exchange-rates"] });
      } else {
        toast({ title: "Sync failed", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Sync failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[250px]" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <CircleDollarSign className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">No Investment Data</h3>
          <p className="text-sm text-muted-foreground mt-1">Investment landscape data is currently unavailable.</p>
        </div>
      </div>
    );
  }

  const hasEtfData = etfData && etfData.etfSignals && etfData.etfSignals.length > 0;

  return (
    <div className="space-y-6 p-4 md:p-6" data-testid="market-data-page">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight" data-testid="text-page-title">Investment Intelligence</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">Live</span>
            </div>
            <span className="text-[10px] text-muted-foreground/60 font-mono" data-testid="text-investments-refresh">refreshed {refreshLabel}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefresh} data-testid="button-refresh-investments">
              <RefreshCw className={cn("h-3 w-3 transition-transform", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Macro-driven ETF allocation signals and Nigeria's investment yield environment. Real yields calculated against {data.currentInflation.toFixed(2)}% inflation (CPI).
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <MacroPill label="CPI" value={`${data.currentInflation.toFixed(2)}%`} />
        <MacroPill label="MPR" value={`${data.currentMpr.toFixed(2)}%`} />
        {data.currentTbillRate != null && <MacroPill label="T-Bill" value={`${data.currentTbillRate.toFixed(2)}%`} />}
        <MacroPill label="FX" value={`${data.fxRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN`} />
      </div>

      {etfLoading && (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
        </div>
      )}

      {hasEtfData && (
        <>
          <RegimeBanner regime={etfData.regime} lastUpdated={etfData.lastUpdated} />
          <RiskPanel regime={etfData.regime} />
          <EtfStrategyTable signals={etfData.etfSignals} prices={etfData.etfPrices} />
          <FactorRotation factors={etfData.factorSignals} />
        </>
      )}

      {!etfLoading && !hasEtfData && (
        <Card className="border-dashed" data-testid="card-etf-pending">
          <CardContent className="flex items-center gap-3 p-4">
            <Activity className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">ETF Intelligence Loading</p>
              <p className="text-xs text-muted-foreground">ETF allocation signals will appear after the next engine refresh cycle (every 6 hours).</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="investments-grid">
        {data.investments.map((inv) => (
          <InvestmentCard key={inv.id} investment={inv} />
        ))}
      </div>

      <Card data-testid="card-comparison">
        <CardHeader className="flex flex-row items-center gap-2 pb-3 p-4">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Comparison Matrix</h3>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" data-testid="table-comparison">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground uppercase tracking-wider">Investment</th>
                  <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Nominal Return</th>
                  <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Real Return</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Inflation Hedge</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Liquidity</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Volatility</th>
                  <th className="text-center py-2 pl-3 font-semibold text-muted-foreground uppercase tracking-wider">Risk</th>
                </tr>
              </thead>
              <tbody>
                {data.investments.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50 last:border-0" data-testid={`comparison-row-${inv.id}`}>
                    <td className="py-2.5 pr-3 font-medium text-foreground whitespace-nowrap">{inv.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-foreground whitespace-nowrap">
                      {inv.nominalReturnRange[0]}–{inv.nominalReturnRange[1]}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      {inv.realYieldRange && (
                        <span className={cn(
                          (inv.realYieldRange[0] + inv.realYieldRange[1]) / 2 > 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {inv.realYieldRange[0] > 0 ? "+" : ""}{inv.realYieldRange[0].toFixed(2)} to {inv.realYieldRange[1] > 0 ? "+" : ""}{inv.realYieldRange[1].toFixed(2)}%
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={cn("text-[10px] font-semibold uppercase", protectionColors[inv.inflationProtection])}>
                        {inv.inflationProtection}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground whitespace-nowrap">{inv.liquidity}</td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground whitespace-nowrap">{inv.volatility}</td>
                    <td className="py-2.5 pl-3 text-center whitespace-nowrap">
                      <span className={cn("text-[10px] font-semibold", riskColors[inv.riskLevel])}>
                        {inv.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-context">
        <CardHeader className="flex flex-row items-center gap-2 pb-3 p-4">
          <Info className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Market Context</h3>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nigeria is currently in a <span className="text-foreground font-medium">high-inflation / high-yield environment</span>, which creates a key paradox:
            fixed income gives high coupons but may not grow real wealth. Real returns tend to come from assets that reprice, not assets that pay fixed income.
          </p>
          <div className="space-y-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Typical Sophisticated Allocation</span>
            <div className="flex flex-col gap-1.5">
              <AllocationBar label="Short-term instruments (T-Bills, MMF)" range="30-50%" color="bg-teal-500" width="40%" />
              <AllocationBar label="Equities (inflation hedge)" range="30-40%" color="bg-emerald-500" width="35%" />
              <AllocationBar label="Tactical bonds or alternatives" range="10-20%" color="bg-amber-500" width="15%" />
              <AllocationBar label="Property or private deals" range="5-15%" color="bg-primary" width="10%" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60 italic mt-2">
            These are market ranges (what investors are currently seeing), not fixed quotes. Actual rates vary by auction, institution, and entry timing.
          </p>
        </CardContent>
      </Card>

      <CbnDataSection
        showCbnData={showCbnData}
        setShowCbnData={setShowCbnData}
        syncing={syncing}
        handleCbnSync={handleCbnSync}
        ratesLoading={ratesLoading}
        dataLoading={dataLoading}
        rates={rates}
        marketData={marketData}
        policyRates={policyRates}
        fxData={fxData}
      />
    </div>
  );
}
