import { useQuery } from "@tanstack/react-query";
import { Globe2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Company = { companyId: number; name: string; sector: string | null; industry: string | null; symbol: string; currency: string; isListed: boolean };
type CompaniesResponse = { companies: Company[]; count: number };

const coverage = [
  { market: "United States", code: "US", currency: "USD", scope: "Treasuries, selected ETFs, REITs and dividend securities", status: "Coverage expanding" },
  { market: "United Kingdom", code: "UK", currency: "GBP", scope: "Gilts, selected ETFs, REITs and regulated funds", status: "Coverage expanding" },
  { market: "Nigeria", code: "NG", currency: "NGN", scope: "NGX equities, Treasury bills, FGN bonds and money-market rates", status: "Live data" },
];

export default function PublicMarketsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useQuery<CompaniesResponse>({ queryKey: ["/api/ngx/companies"] });
  const companies = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.companies ?? []).filter((item) => !term || item.symbol.toLowerCase().includes(term) || item.name.toLowerCase().includes(term) || item.sector?.toLowerCase().includes(term)).slice(0, 100);
  }, [data, search]);

  return (
    <PublicShell>
      <section className="border-b bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <Badge variant="outline"><Globe2 className="mr-2 h-3.5 w-3.5" />Three-market intelligence</Badge>
          <h1 className="mt-5 text-4xl font-bold tracking-tight">Explore markets without opening an account.</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">Review native-market coverage, public instruments and source context. Live availability is labelled separately from expanding coverage.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl space-y-10 px-6 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {coverage.map((item) => (
            <Card key={item.code}><CardHeader><div className="flex items-center justify-between"><CardTitle>{item.code} · {item.market}</CardTitle><Badge variant={item.code === "NG" ? "default" : "secondary"}>{item.status}</Badge></div></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{item.scope}</p><p className="mt-4 text-xs font-semibold">{item.currency} native currency</p></CardContent></Card>
          ))}
        </div>
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-2xl font-bold">NGX company directory</h2><p className="mt-1 text-sm text-muted-foreground">{data?.count ?? 0} public securities currently indexed.</p></div>
            <label className="relative block sm:w-80"><span className="sr-only">Search companies</span><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search symbol, company or sector" /></label>
          </div>
          {isLoading ? <div className="mt-6 grid gap-3 md:grid-cols-2"><Skeleton className="h-20" /><Skeleton className="h-20" /></div> : null}
          {isError ? <Card className="mt-6"><CardContent className="p-6 text-sm text-muted-foreground">Market data is temporarily unavailable. Please try again shortly.</CardContent></Card> : null}
          {!isLoading && !isError ? <div className="mt-6 grid gap-3 md:grid-cols-2">{companies.map((company) => <Card key={company.companyId}><CardContent className="flex items-center justify-between p-5"><div><p className="font-semibold">{company.symbol}</p><p className="mt-1 text-sm text-muted-foreground">{company.name}</p></div><div className="text-right"><Badge variant="outline">{company.currency}</Badge><p className="mt-2 text-xs text-muted-foreground">{company.sector || "Sector unclassified"}</p></div></CardContent></Card>)}</div> : null}
        </div>
      </section>
    </PublicShell>
  );
}
