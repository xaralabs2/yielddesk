import { useMemo, useState } from "react";
import { FlaskConical } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type FieldProps = { label: string; value: number; onChange: (value: number) => void; suffix?: string };
function Field({ label, value, onChange, suffix }: FieldProps) {
  return <label className="space-y-2 text-sm"><span className="font-medium">{label}</span><div className="relative"><Input type="number" min="0" step="0.1" value={value} onChange={(event) => onChange(Number(event.target.value))} /><span className="absolute right-3 top-2.5 text-xs text-muted-foreground">{suffix}</span></div></label>;
}
function money(value: number, currency: string) { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0); }

export default function GuestSimulatorPage() {
  const [principal, setPrincipal] = useState(10000);
  const [annualYield, setAnnualYield] = useState(8);
  const [years, setYears] = useState(5);
  const [annualFees, setAnnualFees] = useState(0.5);
  const [inflation, setInflation] = useState(3);
  const [fxChange, setFxChange] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const result = useMemo(() => {
    const netRate = (annualYield - annualFees) / 100;
    const nominal = principal * Math.pow(1 + netRate, years);
    const real = nominal / Math.pow(1 + inflation / 100, years);
    const baseCurrency = nominal * Math.pow(1 + fxChange / 100, years);
    return { nominal, real, baseCurrency, income: nominal - principal };
  }, [principal, annualYield, years, annualFees, inflation, fxChange]);

  return (
    <PublicShell>
      <section className="border-b bg-muted/20"><div className="mx-auto max-w-7xl px-6 py-14"><Badge variant="outline"><FlaskConical className="mr-2 h-3.5 w-3.5" />Guest simulation</Badge><h1 className="mt-5 text-4xl font-bold tracking-tight">Test your assumptions—no account required.</h1><p className="mt-4 max-w-3xl text-muted-foreground">Change yield, fees, inflation, time and currency assumptions. Results are hypothetical and remain only in this browser session.</p></div></section>
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <Card><CardHeader><CardTitle>Assumptions</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm"><span className="font-medium">Currency</span><select className="input" value={currency} onChange={(event) => setCurrency(event.target.value)}><option>USD</option><option>GBP</option><option>NGN</option></select></label>
          <Field label="Starting amount" value={principal} onChange={setPrincipal} />
          <Field label="Headline annual yield" value={annualYield} onChange={setAnnualYield} suffix="%" />
          <Field label="Years" value={years} onChange={setYears} />
          <Field label="Annual fees" value={annualFees} onChange={setAnnualFees} suffix="%" />
          <Field label="Annual inflation" value={inflation} onChange={setInflation} suffix="%" />
          <Field label="Annual currency change vs base" value={fxChange} onChange={setFxChange} suffix="%" />
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Hypothetical outcome</CardTitle></CardHeader><CardContent>
          <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border p-5"><p className="text-xs text-muted-foreground">Ending nominal value</p><p className="mt-2 text-3xl font-bold">{money(result.nominal, currency)}</p></div><div className="rounded-xl border p-5"><p className="text-xs text-muted-foreground">Inflation-adjusted value</p><p className="mt-2 text-3xl font-bold">{money(result.real, currency)}</p></div><div className="rounded-xl border p-5"><p className="text-xs text-muted-foreground">Nominal gain after fees</p><p className="mt-2 text-2xl font-bold">{money(result.income, currency)}</p></div><div className="rounded-xl border p-5"><p className="text-xs text-muted-foreground">Value after currency scenario</p><p className="mt-2 text-2xl font-bold">{money(result.baseCurrency, currency)}</p></div></div>
          <p className="mt-6 text-xs leading-5 text-muted-foreground">This simplified compound-return model excludes taxes, transaction costs, bid/ask spreads, defaults, liquidity limits and changing rates. It is educational, not a forecast or investment recommendation.</p>
        </CardContent></Card>
      </section>
    </PublicShell>
  );
}
