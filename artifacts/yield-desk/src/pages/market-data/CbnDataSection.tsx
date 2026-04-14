import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Landmark, BarChart3, Banknote, DollarSign, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "./constants";
import type { RateEntry, MarketRecord, PolicyRate, ExchangeRateEntry } from "./types";

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

type CbnDataSectionProps = {
  showCbnData: boolean;
  setShowCbnData: (v: boolean) => void;
  syncing: boolean;
  handleCbnSync: () => void;
  ratesLoading: boolean;
  dataLoading: boolean;
  rates: { ntb: Record<string, RateEntry>; bonds: Record<string, RateEntry>; omo: Record<string, RateEntry>; lastUpdated: string | null } | undefined;
  marketData: { ntb: MarketRecord[]; bonds: MarketRecord[]; omo: MarketRecord[] } | undefined;
  policyRates: PolicyRate[] | undefined;
  fxData: { rates: Record<string, ExchangeRateEntry[]>; latest: ExchangeRateEntry[] } | undefined;
};

export function CbnDataSection({ showCbnData, setShowCbnData, syncing, handleCbnSync, ratesLoading, dataLoading, rates, marketData, policyRates, fxData }: CbnDataSectionProps) {
  const ntbEntries = Object.entries(rates?.ntb ?? {}).sort((a, b) => {
    const tenorA = parseInt(a[0]) || 0;
    const tenorB = parseInt(b[0]) || 0;
    return tenorA - tenorB;
  });
  const bondEntries = Object.entries(rates?.bonds ?? {});
  const omoEntries = Object.entries(rates?.omo ?? {});

  return (
    <Card data-testid="card-cbn-raw-data">
      <CardHeader className="p-4">
        <button
          className="flex items-center justify-between w-full text-left"
          onClick={() => setShowCbnData(!showCbnData)}
        >
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">CBN Primary Market Data</h3>
            {rates?.lastUpdated && (
              <span className="text-[9px] text-muted-foreground/60 font-mono">
                Synced: {new Date(rates.lastUpdated).toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 h-7 text-xs"
              onClick={(e) => { e.stopPropagation(); handleCbnSync(); }}
              disabled={syncing}
              data-testid="button-sync-cbn"
            >
              <RefreshCw className={cn("w-3 h-3", syncing && "animate-spin")} />
              {syncing ? "Syncing..." : "Sync CBN"}
            </Button>
            {showCbnData ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>
      </CardHeader>
      {showCbnData && (
        <CardContent className="p-4 pt-0 space-y-6">
          {(ratesLoading || dataLoading) ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {ntbEntries.map(([tenor, entry]) => (
                  <RateCard key={tenor} label={`NTB ${tenor}`} rate={entry.rate} tenor={`Auction: ${formatDate(entry.date)}`} threshold={18} icon={TrendingUp} />
                ))}
                {bondEntries.slice(0, 2).map(([tenor, entry]) => (
                  <RateCard key={tenor} label={`FGN Bond ${tenor}`} rate={entry.rate} tenor={`Auction: ${formatDate(entry.date)}`} threshold={17} icon={Banknote} />
                ))}
                {omoEntries.slice(0, 2).map(([tenor, entry]) => (
                  <RateCard key={tenor} label={`OMO ${tenor}`} rate={entry.rate} tenor={`Auction: ${formatDate(entry.date)}`} icon={BarChart3} />
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
                      <p className="text-sm text-muted-foreground p-4">No policy rate data yet. Click Sync CBN to fetch.</p>
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
                      <p className="text-sm text-muted-foreground p-4">No exchange rate data yet. Click Sync CBN to fetch.</p>
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
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
