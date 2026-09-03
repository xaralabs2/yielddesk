import { BookOpen, Calculator, FileCheck2, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const principles = [
  { icon: FileCheck2, title: "Start with evidence", body: "Filings and primary market sources establish facts, dates and business quality." },
  { icon: Calculator, title: "Normalize the numbers", body: "Separate recurring earning power from unusual gains, losses and temporary effects." },
  { icon: ShieldCheck, title: "Demand a margin of safety", body: "A strong business is not automatically attractive at every market price." },
];

export default function PublicResearchPage() {
  return (
    <PublicShell>
      <section className="border-b bg-muted/20"><div className="mx-auto max-w-7xl px-6 py-14"><Badge variant="outline"><BookOpen className="mr-2 h-3.5 w-3.5" />Research method</Badge><h1 className="mt-5 text-4xl font-bold tracking-tight">Separate business quality from stock valuation.</h1><p className="mt-4 max-w-3xl text-muted-foreground">YieldDesk research shows the evidence needed to form an independent view. It does not issue personal buy, hold or sell instructions.</p></div></section>
      <section className="mx-auto max-w-7xl space-y-10 px-6 py-12">
        <div className="grid gap-4 md:grid-cols-3">{principles.map((item) => <Card key={item.title}><CardHeader><item.icon className="h-5 w-5 text-primary" /><CardTitle className="pt-3">{item.title}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{item.body}</p></CardContent></Card>)}</div>
        <Card><CardHeader><CardTitle>What a complete public-equity assessment needs</CardTitle></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-lg border p-4"><p className="font-semibold">Business evidence</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Revenue, margins, cash generation, balance sheet, operating risks and management disclosures from dated primary sources.</p></div><div className="rounded-lg border p-4"><p className="font-semibold">Valuation evidence</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Current share price, normalized earnings, dividends, comparable multiples, scenario ranges and a stated required return.</p></div></div><p className="mt-5 rounded-lg bg-muted p-4 text-sm leading-6">A 10-Q can establish business quality. It cannot, by itself, establish that the stock offers a sufficient margin of safety at today’s price.</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Research status labels</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><div><Badge variant="secondary">Evidence gathered</Badge><p className="mt-2 text-xs text-muted-foreground">Primary sources captured and dated.</p></div><div><Badge variant="secondary">Valuation incomplete</Badge><p className="mt-2 text-xs text-muted-foreground">Current price or normalized inputs are missing.</p></div><div><Badge variant="secondary">Scenario ready</Badge><p className="mt-2 text-xs text-muted-foreground">Inputs can be tested without implying advice.</p></div></CardContent></Card>
      </section>
    </PublicShell>
  );
}
