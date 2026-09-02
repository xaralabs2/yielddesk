import { Link } from "wouter";
import {
  ArrowRight,
  BarChart3,
  Globe2,
  Landmark,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const markets = [
  {
    code: "US",
    currency: "USD",
    title: "United States",
    coverage: "Equities, REITs, Treasuries and regulated funds",
  },
  {
    code: "UK",
    currency: "GBP",
    title: "United Kingdom",
    coverage: "Equities, REITs, gilts and regulated funds",
  },
  {
    code: "NG",
    currency: "NGN",
    title: "Nigeria",
    coverage: "NGX equities, T-Bills, FGN bonds, funds and selected SPVs",
  },
];

const capabilities = [
  {
    icon: BarChart3,
    title: "Investment intelligence",
    body: "Compare normalized earnings, sustainable yield, valuation ranges and margin of safety.",
  },
  {
    icon: WalletCards,
    title: "Portfolio simulation",
    body: "Explore allocation choices across USD, GBP and NGN before committing capital.",
  },
  {
    icon: ShieldCheck,
    title: "Evidence-aware decisions",
    body: "See provenance, freshness, confidence and unresolved diligence behind each assessment.",
  },
];

export default function PublicHomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary">
            YieldDesk
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Create account</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div>
            <Badge variant="outline" className="mb-5 gap-2">
              <Globe2 className="h-3.5 w-3.5" />
              US · UK · Nigeria
            </Badge>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Investment intelligence across three markets.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Research opportunities, compare valuation and yield, and simulate
              capital allocation across USD, GBP and NGN markets. Explore freely;
              an account is only needed to save personal work.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#markets">
                  Explore the platform <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Sign in to your workspace</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              YieldDesk provides intelligence and simulation. It does not execute
              trades, hold funds or custody securities.
            </p>
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Three-market view</p>
                  <p className="text-sm text-muted-foreground">Native-currency analysis</p>
                </div>
              </div>
              <div className="space-y-3">
                {markets.map((market) => (
                  <div
                    key={market.code}
                    className="rounded-lg border bg-background p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{market.title}</p>
                      <Badge variant="secondary">{market.currency}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {market.coverage}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="markets" className="border-y bg-muted/30">
          <div className="mx-auto grid max-w-7xl gap-5 px-6 py-14 md:grid-cols-3">
            {capabilities.map((capability) => (
              <Card key={capability.title}>
                <CardContent className="p-6">
                  <capability.icon className="mb-4 h-6 w-6 text-primary" />
                  <h2 className="font-semibold">{capability.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {capability.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
