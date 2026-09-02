import { useMemo, useState } from "react";
import { Calculator, Database, Globe2, Info, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Currency = "USD" | "GBP" | "NGN";

type Instrument = {
  id: string;
  market: "United States" | "United Kingdom" | "Nigeria";
  name: string;
  type: string;
  currency: Currency;
  annualRate: number;
  liquidity: string;
  source: string;
  observedAt: string;
};

const instruments: Instrument[] = [
  { id: "us-treasury-demo", market: "United States", name: "US Treasury illustration", type: "Government security", currency: "USD", annualRate: 4.25, liquidity: "Marketable", source: "Demonstration dataset", observedAt: "Illustrative only" },
  { id: "uk-gilt-demo", market: "United Kingdom", name: "UK gilt illustration", type: "Government security", currency: "GBP", annualRate: 4.5, liquidity: "Marketable", source: "Demonstration dataset", observedAt: "Illustrative only" },
  { id: "ng-tbill-demo", market: "Nigeria", name: "Nigeria T-Bill illustration", type: "Government security", currency: "NGN", annualRate: 18, liquidity: "Term-dependent", source: "Demonstration dataset", observedAt: "Illustrative only" },
];

const currencySymbols: Record<Currency, string> = { USD: "$", GBP: "£", NGN: "₦" };

function formatMoney(value: number, currency: Currency) {
  return new Intl.NumberFormat(currency === "NGN" ? "en-NG" : currency === "GBP" ? "en-GB" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "NGN" ? 0 : 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export default function ComparePage() {
  const [amount, setAmount] = useState("10000");
  const [baseCurrency, setBaseCurrency] = useState<Currency>("USD");
  const [years, setYears] = useState("1");
  const [inflation, setInflation] = useState("3");
  const [fees, setFees] = useState("0");
  const [fx, setFx] = useState<Record<Currency, string>>({ USD: "1", GBP: "1.31", NGN: "0.00065" });

  const rows = useMemo(() => {
    const principal = Math.max(0, Number(amount) || 0);
    const horizon = Math.max(0, Number(years) || 0);
    const inflationRate = (Number(inflation) || 0) / 100;
    const feeRate = (Number(fees) || 0) / 100;
    const baseFx = Number(fx[baseCurrency]) || 1;

    return instruments.map((instrument) => {
      const instrumentFx = Number(fx[instrument.currency]) || 0;
      const nativePrincipal = instrumentFx > 0 ? (principal * baseFx) / instrumentFx : 0;
      const grossNative = nativePrincipal * Math.pow(1 + instrument.annualRate / 100, horizon);
      const afterFeesNative = grossNative * Math.pow(1 - feeRate, horizon);
      const endingBase = baseFx > 0 ? (afterFeesNative * instrumentFx) / baseFx : 0;
      const realEndingBase = endingBase / Math.pow(1 + inflationRate, horizon);
      const incomeBase = endingBase - principal;
      return { instrument, nativePrincipal, endingBase, realEndingBase, incomeBase };
    });
  }, [amount, baseCurrency, years, inflation, fees, fx]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-3 gap-2"><Globe2 className="h-3.5 w-3.5" /> US · UK · Nigeria</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Compare across markets</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Apply the same user-selected amount, horizon, inflation, fee, and currency assumptions to instruments in their native markets.
          </p>
        </div>
        <div className="max-w-sm rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          <strong className="text-foreground">Information and simulation only.</strong> YieldDesk presents differences and hypothetical outcomes. It does not recommend an investment or provider.
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Calculator className="h-5 w-5" /> Your scenario assumptions</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2"><Label htmlFor="amount">Amount</Label><Input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="space-y-2"><Label>Base currency</Label><Select value={baseCurrency} onValueChange={(v) => setBaseCurrency(v as Currency)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USD">USD — US dollar</SelectItem><SelectItem value="GBP">GBP — pound sterling</SelectItem><SelectItem value="NGN">NGN — naira</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="years">Horizon (years)</Label><Input id="years" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="inflation">Base-currency inflation (%)</Label><Input id="inflation" inputMode="decimal" value={inflation} onChange={(e) => setInflation(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="fees">Annual fees (%)</Label><Input id="fees" inputMode="decimal" value={fees} onChange={(e) => setFees(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><RefreshCw className="h-5 w-5" /> Currency assumptions</CardTitle>
          <p className="text-sm text-muted-foreground">Enter the base-currency value of one unit of each currency. These values are controlled by you and are not live FX quotes.</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {(["USD", "GBP", "NGN"] as Currency[]).map((currency) => (
            <div key={currency} className="space-y-2">
              <Label htmlFor={`fx-${currency}`}>1 {currency} value</Label>
              <div className="relative"><span className="absolute left-3 top-2.5 text-sm text-muted-foreground">{currencySymbols[currency]}</span><Input id={`fx-${currency}`} className="pl-8" inputMode="decimal" value={fx[currency]} onChange={(e) => setFx((current) => ({ ...current, [currency]: e.target.value }))} /></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {rows.map(({ instrument, nativePrincipal, endingBase, realEndingBase, incomeBase }) => (
          <Card key={instrument.id} className="overflow-hidden">
            <div className="border-b bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{instrument.market}</div>
            <CardContent className="space-y-5 p-5">
              <div><h2 className="font-semibold">{instrument.name}</h2><p className="text-sm text-muted-foreground">{instrument.type} · {instrument.currency}</p></div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-muted-foreground">Illustrative annual rate</dt><dd className="mt-1 text-xl font-bold">{instrument.annualRate.toFixed(2)}%</dd></div>
                <div><dt className="text-muted-foreground">Native principal</dt><dd className="mt-1 font-semibold">{formatMoney(nativePrincipal, instrument.currency)}</dd></div>
                <div><dt className="text-muted-foreground">Hypothetical ending value</dt><dd className="mt-1 font-semibold">{formatMoney(endingBase, baseCurrency)}</dd></div>
                <div><dt className="text-muted-foreground">Hypothetical income</dt><dd className="mt-1 font-semibold">{formatMoney(incomeBase, baseCurrency)}</dd></div>
                <div><dt className="text-muted-foreground">Inflation-adjusted value</dt><dd className="mt-1 font-semibold">{formatMoney(realEndingBase, baseCurrency)}</dd></div>
                <div><dt className="text-muted-foreground">Liquidity</dt><dd className="mt-1 font-semibold">{instrument.liquidity}</dd></div>
              </dl>
              <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground"><div className="flex items-center gap-2 font-medium text-foreground"><Database className="h-3.5 w-3.5" /> {instrument.source}</div><p className="mt-1">{instrument.observedAt}. Replace with licensed or official timestamped observations before production use.</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p><strong>Hypothetical illustration.</strong> Results use the assumptions visible above, annual compounding, constant rates, and constant FX values. Taxes, spreads, price changes, reinvestment differences, and other costs are excluded unless entered. This demonstration dataset is not current market data.</p>
      </div>
    </div>
  );
}
