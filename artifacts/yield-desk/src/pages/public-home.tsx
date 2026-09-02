import { Link } from "wouter";
import { ArrowRight, BarChart3, BookOpen, Eye, FlaskConical, Globe2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const markets = [
  { code: "US", currency: "USD", title: "United States", coverage: "Treasuries, selected ETFs, REITs and dividend-oriented public securities" },
  { code: "UK", currency: "GBP", title: "United Kingdom", coverage: "Gilts, selected ETFs, REITs and regulated funds" },
  { code: "NG", currency: "NGN", title: "Nigeria", coverage: "Treasury bills, FGN bonds, regulated funds and selected public-market instruments" },
];

const journey = [
  { icon: Eye, title: "Discover", body: "Explore structured investment information across three markets." },
  { icon: BookOpen, title: "Understand", body: "See how instruments work, where data came from and when it was observed." },
  { icon: BarChart3, title: "Compare", body: "Place yield, currency, inflation, fees and liquidity on a common footing." },
  { icon: FlaskConical, title: "Simulate", body: "Change your own assumptions and view clearly labelled hypothetical outcomes." },
  { icon: RefreshCw, title: "Watch & monitor", body: "Save what matters to you and follow factual changes and data freshness." },
];

export default function PublicHomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary">YieldDesk</Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link href="/login">Sign in</Link></Button>
            <Button asChild><Link href="/signup">Create free account</Link></Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--primary)/0.14),transparent_38%)]" />
          <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
            <div>
              <Badge variant="outline" className="mb-6 gap-2"><Globe2 className="h-3.5 w-3.5" /> Nigeria · United States · United Kingdom</Badge>
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Understand investments across markets—before you decide.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                YieldDesk helps you discover, understand, compare, simulate and monitor investment information across NGN, USD and GBP markets. You control the assumptions. You make the decisions.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg"><Link href="/signup">Start comparing <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <Button asChild size="lg" variant="outline"><a href="#how-it-works">See how it works</a></Button>
              </div>
              <p className="mt-5 max-w-2xl text-xs leading-5 text-muted-foreground">
                YieldDesk provides information, education, comparison and simulation. It does not recommend investments or providers, provide personal investment advice, execute trades or hold customer assets.
              </p>
            </div>

            <Card className="border-primary/20 bg-card/90 shadow-xl shadow-primary/5">
              <CardContent className="p-7">
                <p className="text-sm font-semibold text-primary">One amount. Three markets. Your assumptions.</p>
                <p className="mt-2 text-2xl font-bold">See what headline yield leaves out.</p>
                <div className="mt-6 space-y-3">
                  {["Native and base currency", "Inflation-adjusted scenarios", "Fees and income projections", "Liquidity and source freshness", "Historical vs hypothetical values"].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-lg border bg-background/80 p-3 text-sm"><span className="h-2 w-2 rounded-full bg-primary" />{item}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl"><p className="text-sm font-semibold text-primary">The YieldDesk journey</p><h2 className="mt-2 text-3xl font-bold">Clarity without instruction.</h2><p className="mt-3 text-muted-foreground">YieldDesk presents comparable information and transparent scenarios without telling you what to choose.</p></div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {journey.map((step, index) => (
              <Card key={step.title}><CardContent className="p-5"><div className="mb-4 flex items-center justify-between"><div className="rounded-lg bg-primary/10 p-2 text-primary"><step.icon className="h-5 w-5" /></div><span className="text-xs font-semibold text-muted-foreground">0{index + 1}</span></div><h3 className="font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p></CardContent></Card>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="max-w-2xl"><p className="text-sm font-semibold text-primary">Three native markets</p><h2 className="mt-2 text-3xl font-bold">Compare without erasing local context.</h2><p className="mt-3 text-muted-foreground">Each instrument remains in its native currency. Conversions and scenarios are timestamped derived values, never replacements for the underlying facts.</p></div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {markets.map((market) => (
                <Card key={market.code}><CardContent className="p-6"><div className="flex items-center justify-between"><span className="text-2xl font-bold">{market.code}</span><Badge variant="secondary">{market.currency}</Badge></div><h3 className="mt-6 font-semibold">{market.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{market.coverage}</p></CardContent></Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold">Build your own view across markets.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Create a free account to save comparisons, assumptions, watchlists, virtual portfolios and monitoring preferences.</p>
          <Button asChild size="lg" className="mt-7"><Link href="/signup">Create free account <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </section>
      </main>

      <footer className="border-t"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>© 2026 YieldDesk</p><p>Information · Education · Comparison · Simulation</p></div></footer>
    </div>
  );
}
