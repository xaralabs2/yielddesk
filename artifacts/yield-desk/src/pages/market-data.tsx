import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Banknote,
  BarChart3,
  Landmark,
  DollarSign,
  Shield,
  Droplets,
  Zap,
  Wallet,
  Building2,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RateEntry {
  rate: number;
  date: string;
}

interface RatesSummary {
  ntb: Record<string, RateEntry>;
  bonds: Record<string, RateEntry>;
  omo: Record<string, RateEntry>;
  lastUpdated: string | null;
}

interface MarketRecord {
  id: number;
  source: string;
  securityType: string;
  tenor: string;
  auctionDate: string | null;
  maturityDate: string | null;
  marginalRate: number | null;
  trueYield: number | null;
  amountOffered: number | null;
  totalSubscription: number | null;
  totalSuccessful: number | null;
  fetchedAt: string;
}

interface MarketData {
  ntb: MarketRecord[];
  bonds: MarketRecord[];
  omo: MarketRecord[];
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function useRatesSummary() {
  return useQuery<RatesSummary>({
    queryKey: ["/api/cbn/rates-summary"],
    queryFn: async () => {
      const res = await fetch("/api/cbn/rates-summary", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch rates");
      return res.json();
    },
  });
}

function useMarketData() {
  return useQuery<MarketData>({
    queryKey: ["/api/cbn/market-data"],
    queryFn: async () => {
      const res = await fetch("/api/cbn/market-data", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch market data");
      return res.json();
    },
  });
}

interface PolicyRate {
  id: number;
  period: string;
  year: number;
  month: number;
  mpr: number | null;
  interBankCallRate: number | null;
  treasuryBill: number | null;
  savingsDeposit: number | null;
  oneMonthDeposit: number | null;
  threeMonthsDeposit: number | null;
  sixMonthsDeposit: number | null;
  twelveMonthsDeposit: number | null;
  primeLending: number | null;
  maxLending: number | null;
}

interface ExchangeRateEntry {
  id: number;
  currency: string;
  rateDate: string;
  buyingRate: number | null;
  centralRate: number | null;
  sellingRate: number | null;
}

function usePolicyRates() {
  return useQuery<PolicyRate[]>({
    queryKey: ["/api/cbn/policy-rates"],
    queryFn: async () => {
      const res = await fetch("/api/cbn/policy-rates", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch policy rates");
      return res.json();
    },
  });
}

function useExchangeRates() {
  return useQuery<{ rates: Record<string, ExchangeRateEntry[]>; latest: ExchangeRateEntry[] }>({
    queryKey: ["/api/cbn/exchange-rates"],
    queryFn: async () => {
      const res = await fetch("/api/cbn/exchange-rates", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch exchange rates");
      return res.json();
    },
  });
}

type InvestmentOption = {
  id: string;
  name: string;
  category: string;
  description: string;
  riskLevel: string;
  liquidity: string;
  volatility: string;
  inflationProtection: string;
  tenors?: { label: string; yieldRange: [number, number]; notes?: string }[];
  nominalReturnRange: [number, number];
  bestFor: string;
  realYieldRange?: [number, number];
};

type InvestmentLandscapeData = {
  investments: InvestmentOption[];
  currentInflation: number;
  currentMpr: number;
  currentTbillRate: number | null;
  fxRate: number;
};

const RISK_COLORS: Record<string, string> = {
  "Very Low": "text-emerald-500",
  "Low": "text-teal-500",
  "Medium": "text-amber-500",
  "High": "text-rose-500",
};

const PROTECTION_COLORS: Record<string, string> = {
  "Weak": "text-rose-400",
  "Weak-Moderate": "text-amber-400",
  "Moderate": "text-teal-400",
  "Strong": "text-emerald-400",
};

const CATEGORY_ICONS: Record<string, typeof Landmark> = {
  "Fixed Income": Landmark,
  "Cash & Near-Cash": Wallet,
  "Equities": BarChart3,
  "Real Assets": Building2,
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "---";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function RateCard({ label, rate, tenor, threshold, icon: Icon }: { label: string; rate: number; tenor: string; threshold?: number; icon: typeof TrendingUp }) {
  const aboveThreshold = threshold != null && rate >= threshold;
  return (
    <Card className={aboveThreshold ? "border-l-4 border-l-success" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
          <Icon className="w-3.5 h-3.5" /> {label}
        </div>
        <div className="text-2xl font-bold font-mono">{rate.toFixed(2)}%</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{tenor}</span>
          {threshold != null && (
            <Badge variant={aboveThreshold ? "default" : "outline"} className="text-[10px]">
              {aboveThreshold ? "ABOVE" : "BELOW"} {threshold}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityTable({ records, showSubscription }: { records: MarketRecord[]; showSubscription?: boolean }) {
  if (records.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No data available</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
            <th className="px-4 py-3">Auction Date</th>
            <th className="px-4 py-3">Tenor</th>
            <th className="px-4 py-3">Maturity</th>
            <th className="px-4 py-3">Rate</th>
            {showSubscription && <th className="px-4 py-3">Subscription (N mn)</th>}
            {showSubscription && <th className="px-4 py-3">Allotted (N mn)</th>}
            <th className="px-4 py-3">Offered (N mn)</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
              <td className="px-4 py-3 text-muted-foreground">{formatDate(r.auctionDate)}</td>
              <td className="px-4 py-3">
                <Badge variant="outline" className="text-xs font-mono">{r.tenor}</Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(r.maturityDate)}</td>
              <td className="px-4 py-3 font-mono font-medium">
                {r.marginalRate != null ? `${r.marginalRate.toFixed(2)}%` : "---"}
              </td>
              {showSubscription && (
                <td className="px-4 py-3 font-mono">
                  {r.totalSubscription != null ? r.totalSubscription.toLocaleString() : "---"}
                </td>
              )}
              {showSubscription && (
                <td className="px-4 py-3 font-mono">
                  {r.totalSuccessful != null ? r.totalSuccessful.toLocaleString() : "---"}
                </td>
              )}
              <td className="px-4 py-3 font-mono">
                {r.amountOffered != null ? r.amountOffered.toLocaleString() : "---"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MarketDataPage() {
  const { data: rates, isLoading: ratesLoading } = useRatesSummary();
  const { data: marketData, isLoading: dataLoading } = useMarketData();
  const { data: policyRates } = usePolicyRates();
  const { data: fxData } = useExchangeRates();
  const { data: landscape } = useQuery<InvestmentLandscapeData>({
    queryKey: ["/api/investments"],
    refetchInterval: 60 * 1000,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const headers = getAuthHeaders() as Record<string, string>;
      headers["Content-Type"] = "application/json";
      const res = await fetch("/api/cbn/sync-all", {
        method: "POST",
        headers,
      });
      const result = await res.json();
      if (result.success) {
        toast({
          title: "All data refreshed",
          description: "Market data, policy rates, and exchange rates updated",
        });
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

  if (ratesLoading || dataLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!rates && !marketData) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="py-8 text-center">
            <BarChart3 className="w-8 h-8 mx-auto text-destructive mb-3" />
            <h3 className="text-sm font-semibold mb-1">Failed to load market data</h3>
            <p className="text-xs text-muted-foreground">Please try refreshing the page or click Sync to fetch the latest data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ntbEntries = Object.entries(rates?.ntb ?? {}).sort((a, b) => {
    const tenorA = parseInt(a[0]) || 0;
    const tenorB = parseInt(b[0]) || 0;
    return tenorA - tenorB;
  });
  const bondEntries = Object.entries(rates?.bonds ?? {});
  const omoEntries = Object.entries(rates?.omo ?? {});

  return (
    <div className="p-6 space-y-6" data-testid="market-data-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Market Data</h1>
          <p className="text-sm text-muted-foreground">
            Live rates from Central Bank of Nigeria (CBN)
            {rates?.lastUpdated && (
              <span className="ml-2 text-xs">
                Last synced: {new Date(rates.lastUpdated).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleSync}
          disabled={syncing}
          data-testid="button-sync-cbn"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ntbEntries.map(([tenor, entry]) => (
          <RateCard
            key={tenor}
            label={`NTB ${tenor}`}
            rate={entry.rate}
            tenor={`Auction: ${formatDate(entry.date)}`}
            threshold={18}
            icon={TrendingUp}
          />
        ))}
        {bondEntries.slice(0, 2).map(([tenor, entry]) => (
          <RateCard
            key={tenor}
            label={`FGN Bond ${tenor}`}
            rate={entry.rate}
            tenor={`Auction: ${formatDate(entry.date)}`}
            threshold={17}
            icon={Banknote}
          />
        ))}
        {omoEntries.slice(0, 2).map(([tenor, entry]) => (
          <RateCard
            key={tenor}
            label={`OMO ${tenor}`}
            rate={entry.rate}
            tenor={`Auction: ${formatDate(entry.date)}`}
            icon={BarChart3}
          />
        ))}
      </div>

      <Card className="border-l-4 border-l-primary" data-testid="card-rates-summary">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Decision Engine Input — CP Rate</div>
              <div className="text-3xl font-bold font-mono">
                {ntbEntries.length > 0 ? `${ntbEntries[ntbEntries.length - 1][1].rate.toFixed(2)}%` : "---"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">364-day NTB marginal rate (proxy for CP)</div>
            </div>
            <div className="w-px h-12 bg-border hidden md:block" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Decision Engine Input — Bond Yield</div>
              <div className="text-3xl font-bold font-mono">
                {bondEntries.length > 0 ? `${bondEntries[0][1].rate.toFixed(2)}%` : "---"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Latest FGN Bond auction rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ntb" data-testid="tabs-market-data">
        <TabsList>
          <TabsTrigger value="ntb">Treasury Bills (NTB)</TabsTrigger>
          <TabsTrigger value="bonds">FGN Bonds</TabsTrigger>
          <TabsTrigger value="omo">OMO Bills</TabsTrigger>
        </TabsList>
        <TabsContent value="ntb">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4" /> Nigerian Treasury Bills — Primary Market Auctions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <SecurityTable records={marketData?.ntb ?? []} showSubscription />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bonds">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="w-4 h-4" /> FGN Bonds — Auction Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <SecurityTable records={marketData?.bonds ?? []} showSubscription />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="omo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4" /> Open Market Operations (OMO)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <SecurityTable records={marketData?.omo ?? []} showSubscription />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-policy-rates">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="w-4 h-4" /> CBN Policy & Money Market Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {policyRates && policyRates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">MPR</th>
                      <th className="px-4 py-3">Interbank</th>
                      <th className="px-4 py-3">T-Bill</th>
                      <th className="px-4 py-3">Prime</th>
                      <th className="px-4 py-3">Max Lend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policyRates.slice(0, 12).map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{r.period}</td>
                        <td className="px-4 py-3 font-mono">{r.mpr != null ? `${r.mpr.toFixed(2)}%` : "---"}</td>
                        <td className="px-4 py-3 font-mono">{r.interBankCallRate != null ? `${r.interBankCallRate.toFixed(2)}%` : "---"}</td>
                        <td className="px-4 py-3 font-mono">{r.treasuryBill != null ? `${r.treasuryBill.toFixed(2)}%` : "---"}</td>
                        <td className="px-4 py-3 font-mono">{r.primeLending != null ? `${r.primeLending.toFixed(2)}%` : "---"}</td>
                        <td className="px-4 py-3 font-mono">{r.maxLending != null ? `${r.maxLending.toFixed(2)}%` : "---"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-4">No policy rate data yet. Click Refresh to sync.</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-exchange-rates">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="w-4 h-4" /> CBN Official Exchange Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {fxData?.latest && fxData.latest.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-3">Currency</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Buying</th>
                      <th className="px-4 py-3">Central</th>
                      <th className="px-4 py-3">Selling</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fxData.latest.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{r.currency}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(r.rateDate)}</td>
                        <td className="px-4 py-3 font-mono">{r.buyingRate != null ? `₦${r.buyingRate.toFixed(2)}` : "---"}</td>
                        <td className="px-4 py-3 font-mono font-medium">{r.centralRate != null ? `₦${r.centralRate.toFixed(2)}` : "---"}</td>
                        <td className="px-4 py-3 font-mono">{r.sellingRate != null ? `₦${r.sellingRate.toFixed(2)}` : "---"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-4">No exchange rate data yet. Click Refresh to sync.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {policyRates && policyRates.length > 0 && (
        <Card data-testid="card-deposit-rates">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="w-4 h-4" /> Deposit Rate Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Savings</th>
                    <th className="px-4 py-3">1-Month</th>
                    <th className="px-4 py-3">3-Month</th>
                    <th className="px-4 py-3">6-Month</th>
                    <th className="px-4 py-3">12-Month</th>
                  </tr>
                </thead>
                <tbody>
                  {policyRates.slice(0, 12).map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{r.period}</td>
                      <td className="px-4 py-3 font-mono">{r.savingsDeposit != null ? `${r.savingsDeposit.toFixed(2)}%` : "---"}</td>
                      <td className="px-4 py-3 font-mono">{r.oneMonthDeposit != null ? `${r.oneMonthDeposit.toFixed(2)}%` : "---"}</td>
                      <td className="px-4 py-3 font-mono">{r.threeMonthsDeposit != null ? `${r.threeMonthsDeposit.toFixed(2)}%` : "---"}</td>
                      <td className="px-4 py-3 font-mono">{r.sixMonthsDeposit != null ? `${r.sixMonthsDeposit.toFixed(2)}%` : "---"}</td>
                      <td className="px-4 py-3 font-mono">{r.twelveMonthsDeposit != null ? `${r.twelveMonthsDeposit.toFixed(2)}%` : "---"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {landscape && landscape.investments.length > 0 && (
        <div className="space-y-4" data-testid="section-investment-landscape">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-primary" />
                Investment Landscape
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Real yields calculated against {landscape.currentInflation.toFixed(1)}% CPI inflation
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="text-[10px] font-mono">CPI {landscape.currentInflation.toFixed(1)}%</Badge>
              <Badge variant="outline" className="text-[10px] font-mono">MPR {landscape.currentMpr.toFixed(1)}%</Badge>
              {landscape.currentTbillRate != null && (
                <Badge variant="outline" className="text-[10px] font-mono">T-Bill {landscape.currentTbillRate.toFixed(1)}%</Badge>
              )}
              <Badge variant="outline" className="text-[10px] font-mono">FX ₦{landscape.fxRate.toLocaleString(undefined, { minimumFractionDigits: 0 })}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {landscape.investments.map((inv) => {
              const CategoryIcon = CATEGORY_ICONS[inv.category] || CircleDollarSign;
              return (
                <Card key={inv.id} data-testid={`investment-card-${inv.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3 p-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryIcon className="h-4 w-4 text-primary shrink-0" />
                        <h3 className="text-sm font-bold tracking-tight">{inv.name}</h3>
                      </div>
                      <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">{inv.category}</Badge>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-lg font-bold font-mono tabular-nums text-foreground">
                        {inv.nominalReturnRange[0]}–{inv.nominalReturnRange[1]}%
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Nominal</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4 pt-0">
                    <p className="text-xs text-muted-foreground leading-relaxed">{inv.description}</p>

                    {inv.tenors && inv.tenors.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Tenor Breakdown</span>
                        <div className="space-y-1">
                          {inv.tenors.map((tenor, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
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
                          <span className={cn("font-semibold", RISK_COLORS[inv.riskLevel] || "text-muted-foreground")}>{inv.riskLevel}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px]">
                          <Droplets className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Liquidity:</span>
                          <span className="text-muted-foreground font-medium">{inv.liquidity}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px]">
                          <Zap className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Inflation:</span>
                          <span className={cn("font-medium", PROTECTION_COLORS[inv.inflationProtection] || "text-muted-foreground")}>{inv.inflationProtection}</span>
                        </span>
                      </div>
                      {inv.realYieldRange && (
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-mono tabular-nums font-semibold",
                          ((inv.realYieldRange[0] + inv.realYieldRange[1]) / 2) > 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {((inv.realYieldRange[0] + inv.realYieldRange[1]) / 2) > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {inv.realYieldRange[0] > 0 ? "+" : ""}{inv.realYieldRange[0].toFixed(1)}% to {inv.realYieldRange[1] > 0 ? "+" : ""}{inv.realYieldRange[1].toFixed(1)}%
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-muted-foreground/60 italic">{inv.bestFor}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
