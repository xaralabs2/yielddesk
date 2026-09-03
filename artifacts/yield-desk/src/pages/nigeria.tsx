import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, CircleDollarSign, Database, Landmark, LineChart, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type RateObservation = { rate: number | null; date?: string };
type MoneyMarketSummary = {
  proxy: {
    ntb91: RateObservation | null;
    ntb182: RateObservation | null;
    ntb364: RateObservation | null;
  };
  fmdq: Record<string, { rate: number; date: string; tenor: string }>;
  lastFmdqSync: string | null;
};
type PolicyRate = {
  period: string;
  mpr: number | null;
  treasuryBill: number | null;
  interBankCallRate: number | null;
  fetchedAt: string;
};
type ExchangeRate = {
  currency: string;
  rateDate: string;
  buyingRate: number | null;
  centralRate: number | null;
  sellingRate: number | null;
  fetchedAt: string;
};
type ExchangeRatesResponse = { latest: ExchangeRate[] };
type CompaniesResponse = { count: number };
type FixedIncomeObservation = {
  securityType: string;
  tenor: string;
  auctionDate: string | null;
  maturityDate: string | null;
  marginalRate: number | null;
  trueYield: number | null;
  subscriptionCoverage: number | null;
  observedAt: string;
  freshness: { status: "current" | "aging" | "stale" | "unknown"; ageDays: number | null };
  source: string;
};
type FixedIncomeSnapshot = {
  generatedAt: string;
  provenance: { publisher: string; sourceUrl: string; methodology: string };
  groups: { ntb: FixedIncomeObservation[]; bonds: FixedIncomeObservation[]; omo: FixedIncomeObservation[] };
};

const nigeriaUniverse = [
  {
    title: "Treasury bills and OMO",
    icon: Landmark,
    evidence: "CBN auction observations",
    analysis: "Tenor, auction date, marginal rate, true yield and subscription context",
  },
  {
    title: "FGN bonds",
    icon: ShieldCheck,
    evidence: "CBN and permitted fixed-income sources",
    analysis: "Coupon/yield context, maturity, duration and inflation-adjusted scenarios",
  },
  {
    title: "Money-market instruments",
    icon: CircleDollarSign,
    evidence: "FMDQ observations and clearly identified manual entries",
    analysis: "Interbank benchmarks, tenor comparisons, dates and source freshness",
  },
  {
    title: "NGX public securities",
    icon: LineChart,
    evidence: "Permitted NGX market and issuer data",
    analysis: "Prices, fundamentals, dividends, valuation scenarios and evidence quality",
  },
  {
    title: "Regulated funds",
    icon: Building2,
    evidence: "Fund-manager disclosures and permitted provider data",
    analysis: "Published yield, liquidity, fees, holdings context and observation date",
  },
  {
    title: "Recorded portfolios",
    icon: Database,
    evidence: "User-entered holdings and broker contract notes",
    analysis: "Yield, maturity, concentration, FX, inflation and performance calculations",
  },
];

function number(value: number | null | undefined, suffix = "") {
  return value == null || !Number.isFinite(value) ? "—" : `${value.toFixed(2)}${suffix}`;
}

function date(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString() : "No current observation";
}

function SnapshotCard({
  label,
  value,
  observed,
}: {
  label: string;
  value: string;
  observed: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tabular-nums">{value}</p>
        <p className="mt-2 text-xs text-muted-foreground">{observed}</p>
      </CardContent>
    </Card>
  );
}

export default function NigeriaPage() {
  const moneyMarket = useQuery<MoneyMarketSummary>({ queryKey: ["/api/mm/summary"] });
  const policy = useQuery<PolicyRate[]>({ queryKey: ["/api/cbn/policy-rates"] });
  const fx = useQuery<ExchangeRatesResponse>({ queryKey: ["/api/cbn/exchange-rates"] });
  const companies = useQuery<CompaniesResponse>({ queryKey: ["/api/ngx/companies"] });
  const fixedIncome = useQuery<FixedIncomeSnapshot>({ queryKey: ["/api/cbn/fixed-income-snapshot"] });

  const latestPolicy = policy.data?.[0];
  const usd = fx.data?.latest.find((item) => {
    const currency = item.currency.toUpperCase();
    return currency.includes("USD") || currency.includes("US DOLLAR");
  });
  const isLoading = moneyMarket.isLoading || policy.isLoading || fx.isLoading || companies.isLoading;
  const hasError = moneyMarket.isError || policy.isError || fx.isError || companies.isError;
  const fixedIncomeRows = [
    ...(fixedIncome.data?.groups.ntb ?? []),
    ...(fixedIncome.data?.groups.bonds ?? []),
    ...(fixedIncome.data?.groups.omo ?? []),
  ];
  const latestNtb364 = fixedIncome.data?.groups.ntb.find((item) => item.tenor.includes("364"));

  return (
    <PublicShell>
      <section className="border-b bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <Badge variant="outline">Nigeria intelligence desk</Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
            Understand Nigerian investments in their real NGN, inflation and FX context.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
            YieldDesk brings together dated public-market observations, deterministic calculations and clearly labelled assumptions across Nigerian fixed income, money markets, regulated funds and selected NGX securities.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild><Link href="/rates">Explore Nigerian rates <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild variant="outline"><Link href="/simulator">Run a hypothetical scenario</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-12 px-6 py-12">
        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Nigeria market snapshot</h2>
              <p className="mt-1 text-sm text-muted-foreground">Stored observations are shown with their dates. A blank value is not replaced with an estimate.</p>
            </div>
            <Badge variant={hasError ? "destructive" : "secondary"}>{hasError ? "Some sources unavailable" : "Source-aware"}</Badge>
          </div>

          {isLoading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36" />)}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SnapshotCard
                label="364-day NTB proxy"
                value={number(moneyMarket.data?.proxy.ntb364?.rate ?? latestNtb364?.marginalRate, "%")}
                observed={date(moneyMarket.data?.proxy.ntb364?.date ?? latestNtb364?.auctionDate ?? latestNtb364?.observedAt)}
              />
              <SnapshotCard
                label="Monetary Policy Rate"
                value={number(latestPolicy?.mpr, "%")}
                observed={latestPolicy?.period || date(latestPolicy?.fetchedAt)}
              />
              <SnapshotCard
                label="USD/NGN central rate"
                value={number(usd?.centralRate)}
                observed={date(usd?.rateDate)}
              />
              <SnapshotCard
                label="NGX securities indexed"
                value={String(companies.data?.count ?? 0)}
                observed="Public company directory"
              />
            </div>
          )}

          {hasError ? (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground">
              One or more source categories could not be loaded. YieldDesk has left the affected observations blank rather than presenting fallback values as current data.
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Sovereign fixed-income observations</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                The latest stored CBN observation for each instrument and tenor. Coverage is calculated from subscription divided by amount offered; it is not a forecast.
              </p>
            </div>
            {fixedIncome.data ? (
              <a className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={fixedIncome.data.provenance.sourceUrl} target="_blank" rel="noreferrer">
                {fixedIncome.data.provenance.publisher}
              </a>
            ) : null}
          </div>
          <Card className="mt-6 overflow-hidden">
            <CardContent className="p-0">
              {fixedIncome.isLoading ? (
                <div className="p-6"><Skeleton className="h-40 w-full" /></div>
              ) : fixedIncome.isError ? (
                <p className="p-6 text-sm text-muted-foreground">Fixed-income observations are temporarily unavailable. No estimates have been substituted.</p>
              ) : fixedIncomeRows.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No stored CBN fixed-income observations are currently available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Instrument</th>
                        <th className="px-4 py-3">Tenor</th>
                        <th className="px-4 py-3">Marginal rate</th>
                        <th className="px-4 py-3">True yield</th>
                        <th className="px-4 py-3">Subscription</th>
                        <th className="px-4 py-3">Observed</th>
                        <th className="px-4 py-3">Freshness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fixedIncomeRows.slice(0, 18).map((item) => (
                        <tr className="border-b last:border-0" key={`${item.securityType}-${item.tenor}`}>
                          <td className="px-4 py-3 font-medium">{item.securityType}</td>
                          <td className="px-4 py-3">{item.tenor}</td>
                          <td className="px-4 py-3 tabular-nums">{number(item.marginalRate, "%")}</td>
                          <td className="px-4 py-3 tabular-nums">{number(item.trueYield, "%")}</td>
                          <td className="px-4 py-3 tabular-nums">{item.subscriptionCoverage == null ? "—" : `${item.subscriptionCoverage.toFixed(2)}x`}</td>
                          <td className="px-4 py-3">{date(item.auctionDate ?? item.observedAt)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={item.freshness.status === "stale" ? "destructive" : "secondary"}>
                              {item.freshness.status}{item.freshness.ageDays == null ? "" : ` · ${item.freshness.ageDays}d`}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          {fixedIncome.data ? <p className="mt-3 text-xs text-muted-foreground">{fixedIncome.data.provenance.methodology}</p> : null}
        </div>

        <div>
          <h2 className="text-2xl font-bold">Nigeria investment universe</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Each category separates source evidence from YieldDesk calculations. Coverage expands only when provenance and permitted use are established.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {nigeriaUniverse.map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <item.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="pt-2 text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6">
                  <div><p className="font-medium">Evidence</p><p className="text-muted-foreground">{item.evidence}</p></div>
                  <div><p className="font-medium">YieldDesk analysis</p><p className="text-muted-foreground">{item.analysis}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>How to read YieldDesk Nigeria</CardTitle></CardHeader>
          <CardContent className="grid gap-5 text-sm leading-6 md:grid-cols-3">
            <div><Badge variant="secondary">Observed</Badge><p className="mt-2 text-muted-foreground">A dated value captured from an identified source.</p></div>
            <div><Badge variant="secondary">Calculated</Badge><p className="mt-2 text-muted-foreground">A reproducible result from disclosed inputs and methods.</p></div>
            <div><Badge variant="secondary">Hypothetical</Badge><p className="mt-2 text-muted-foreground">A user-controlled scenario, not a forecast or recommendation.</p></div>
          </CardContent>
        </Card>

        <div className="rounded-xl border bg-muted/30 p-6 text-sm leading-6 text-muted-foreground">
          YieldDesk provides information, education, comparison and simulation. It does not recommend an investment or provider, determine suitability, transmit orders, execute trades, or hold customer assets. Confirm executable prices and rates with an appropriately regulated provider.
        </div>
      </section>
    </PublicShell>
  );
}
