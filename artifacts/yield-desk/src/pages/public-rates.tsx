import { useQuery } from "@tanstack/react-query";
import { Landmark } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Rate = { rate: number | null; date?: string };
type Summary = { proxy: { ntb91: Rate | null; ntb182: Rate | null; ntb364: Rate | null }; fmdq: Record<string, { rate: number; date: string; tenor: string }>; lastFmdqSync: string | null };

function RateCard({ label, value }: { label: string; value: Rate | null }) {
  return <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold tabular-nums">{value?.rate != null ? value.rate.toFixed(2) + "%" : "—"}</p><p className="mt-2 text-xs text-muted-foreground">{value?.date ? new Date(value.date).toLocaleDateString() : "No current observation"}</p></CardContent></Card>;
}

export default function PublicRatesPage() {
  const { data, isLoading, isError } = useQuery<Summary>({ queryKey: ["/api/mm/summary"] });
  return (
    <PublicShell>
      <section className="border-b bg-muted/20"><div className="mx-auto max-w-7xl px-6 py-14"><Badge variant="outline"><Landmark className="mr-2 h-3.5 w-3.5" />Public rate board</Badge><h1 className="mt-5 text-4xl font-bold tracking-tight">Rates with dates and context.</h1><p className="mt-4 max-w-3xl text-muted-foreground">Observed Nigerian Treasury-bill proxies and FMDQ money-market indicators. Rates are informational snapshots, not offers or recommendations.</p></div></section>
      <section className="mx-auto max-w-7xl px-6 py-12">
        {isLoading ? <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div> : null}
        {isError ? <Card><CardContent className="p-6 text-sm text-muted-foreground">Rates are temporarily unavailable. Please try again shortly.</CardContent></Card> : null}
        {data ? <><div className="grid gap-4 md:grid-cols-3"><RateCard label="91-day NTB proxy" value={data.proxy.ntb91} /><RateCard label="182-day NTB proxy" value={data.proxy.ntb182} /><RateCard label="364-day NTB proxy" value={data.proxy.ntb364} /></div><Card className="mt-8"><CardHeader><CardTitle>FMDQ observations</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(data.fmdq).map(([key, value]) => <div key={key} className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">{key.replaceAll("_", " ")}</p><p className="mt-2 text-xl font-bold">{value.rate.toFixed(2)}%</p><p className="mt-1 text-xs text-muted-foreground">{value.tenor} · {new Date(value.date).toLocaleDateString()}</p></div>)}</div>{Object.keys(data.fmdq).length === 0 ? <p className="text-sm text-muted-foreground">No current FMDQ observations.</p> : null}</CardContent></Card></> : null}
        <p className="mt-8 text-xs leading-5 text-muted-foreground">Source categories: CBN auction data and FMDQ observations stored by YieldDesk. Always confirm current executable rates with a regulated provider.</p>
      </section>
    </PublicShell>
  );
}
