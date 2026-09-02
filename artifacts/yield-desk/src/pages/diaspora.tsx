import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-helpers";

type CrossMarketPreferences = {
  countryOfResidence: string;
  baseCurrency: string;
  investmentExperience: string;
  riskTolerance: string;
  investmentHorizon: string;
  goals: string | null;
  interests: string | null;
  estimatedCapitalRange: string | null;
  readinessStage: string;
  consentPartnerUpdates: boolean;
};

const defaults: CrossMarketPreferences = {
  countryOfResidence: "",
  baseCurrency: "USD",
  investmentExperience: "BEGINNER",
  riskTolerance: "MODERATE",
  investmentHorizon: "LONG_TERM",
  goals: "",
  interests: "TREASURIES,GILTS,T-BILLS,FUNDS",
  estimatedCapitalRange: "",
  readinessStage: "LEARNING",
  consentPartnerUpdates: false,
};

export default function DiasporaPage() {
  const queryClient = useQueryClient();
  const { data: existing } = useQuery<CrossMarketPreferences | null>({ queryKey: ["/api/diaspora/profile"] });
  const [form, setForm] = useState<CrossMarketPreferences>(defaults);

  useEffect(() => {
    if (existing) setForm({ ...defaults, ...existing, consentPartnerUpdates: false, readinessStage: "LEARNING" });
  }, [existing]);

  const save = useMutation({
    mutationFn: async () => (await apiRequest("PUT", "/api/diaspora/profile", {
      ...form,
      riskTolerance: "MODERATE",
      estimatedCapitalRange: "",
      readinessStage: "LEARNING",
      consentPartnerUpdates: false,
    })).json(),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["/api/diaspora/profile"] }),
  });

  const update = (key: keyof CrossMarketPreferences, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <div>
        <p className="text-sm font-semibold text-primary">Cross-border context</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Set your market-view preferences</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Choose how YieldDesk displays currencies, explanations and time horizons. These preferences organize information; they are not used to determine suitability or recommend an investment.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard number="01" title="Native market facts" body="See each instrument in its native currency and local market context." />
        <InfoCard number="02" title="Comparable scenarios" body="Apply your own currency, inflation, fee and time assumptions." />
        <InfoCard number="03" title="Independent decisions" body="YieldDesk presents differences and hypothetical results. You choose what to do." />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <form className="space-y-5 rounded-xl border bg-card p-6" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
          <div><h2 className="text-xl font-semibold">Display and learning preferences</h2><p className="mt-1 text-sm text-muted-foreground">We collect only what is needed to organize your experience.</p></div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Country of residence"><input className="input" value={form.countryOfResidence} onChange={(e) => update("countryOfResidence", e.target.value)} placeholder="United States" required /></Field>
            <Field label="Base display currency"><select className="input" value={form.baseCurrency} onChange={(e) => update("baseCurrency", e.target.value)}><option>USD</option><option>GBP</option><option>CAD</option><option>EUR</option><option>NGN</option></select></Field>
            <Field label="Explanation level"><select className="input" value={form.investmentExperience} onChange={(e) => update("investmentExperience", e.target.value)}><option value="BEGINNER">Foundational</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select></Field>
            <Field label="Comparison horizon"><select className="input" value={form.investmentHorizon} onChange={(e) => update("investmentHorizon", e.target.value)}><option value="SHORT_TERM">Under 2 years</option><option value="MEDIUM_TERM">2–5 years</option><option value="LONG_TERM">5+ years</option></select></Field>
            <Field label="Topics to follow"><input className="input" value={form.interests ?? ""} onChange={(e) => update("interests", e.target.value)} placeholder="TREASURIES,GILTS,T-BILLS,FUNDS" /></Field>
          </div>

          <Field label="What would you like to understand?"><textarea className="input min-h-24" value={form.goals ?? ""} onChange={(e) => update("goals", e.target.value)} placeholder="For example: compare income and currency scenarios across my home and resident markets." /></Field>

          <button type="submit" disabled={save.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{save.isPending ? "Saving…" : "Save preferences"}</button>
          {save.isSuccess && <span className="ml-3 text-sm text-primary">Saved</span>}
          {save.isError && <p className="text-sm text-destructive">Could not save preferences.</p>}
        </form>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5"><h2 className="font-semibold">What YieldDesk does</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Information, education, objective comparisons, user-controlled simulations, watchlists and factual monitoring.</p></div>
          <div className="rounded-xl border bg-card p-5"><h2 className="font-semibold">What YieldDesk does not do</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">YieldDesk does not recommend investments or providers, determine suitability, give personal investment advice, execute transactions or hold customer assets.</p></div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ number, title, body }: { number: string; title: string; body: string }) {
  return <div className="rounded-xl border bg-card p-5"><p className="text-xs font-semibold text-primary">{number}</p><h2 className="mt-3 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1.5 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}
