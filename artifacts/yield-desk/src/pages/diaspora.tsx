import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-helpers";

type DiasporaProfile = {
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

const emptyProfile: DiasporaProfile = {
  countryOfResidence: "",
  baseCurrency: "USD",
  investmentExperience: "BEGINNER",
  riskTolerance: "MODERATE",
  investmentHorizon: "LONG_TERM",
  goals: "",
  interests: "EQUITIES,BONDS,T-BILLS,MMF",
  estimatedCapitalRange: "",
  readinessStage: "LEARNING",
  consentPartnerUpdates: false,
};

export default function DiasporaPage() {
  const queryClient = useQueryClient();
  const { data: existing } = useQuery<DiasporaProfile | null>({ queryKey: ["/api/diaspora/profile"] });
  const [form, setForm] = useState<DiasporaProfile>(emptyProfile);

  useEffect(() => {
    if (existing) setForm({ ...emptyProfile, ...existing });
  }, [existing]);

  const save = useMutation({
    mutationFn: async () => (await apiRequest("PUT", "/api/diaspora/profile", form)).json(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/diaspora/profile"] });
    },
  });

  const update = (key: keyof DiasporaProfile, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Diaspora Investor</h1>
          <span className="text-xs font-semibold rounded-full bg-primary/10 text-primary px-2.5 py-1">GLOBAL NIGERIANS</span>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Learn the Nigerian market, practice in the Simulator, build an investment profile, and prepare to invest through an external provider when you are ready.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div><div className="text-xs text-muted-foreground">1. Learn</div><div className="font-semibold">Understand Nigeria</div><p className="text-sm text-muted-foreground mt-1">Equities, bonds, T-Bills, MMFs, FX, CSCS/CHN and market access.</p></div>
          <div><div className="text-xs text-muted-foreground">2. Practice</div><div className="font-semibold">Simulate</div><p className="text-sm text-muted-foreground mt-1">Use virtual capital and live market reference prices without placing real orders.</p></div>
          <div><div className="text-xs text-muted-foreground">3. Prepare</div><div className="font-semibold">Ready to Invest</div><p className="text-sm text-muted-foreground mt-1">Tell YieldDesk what you are interested in. Investment execution remains external.</p></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <form
          className="rounded-xl border bg-card p-5 space-y-5"
          onSubmit={(event) => { event.preventDefault(); save.mutate(); }}
        >
          <div>
            <h2 className="text-xl font-semibold">Your investor profile</h2>
            <p className="text-sm text-muted-foreground">Used to personalize education, simulations, FX views and portfolio guidance.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Country of residence"><input className="input" value={form.countryOfResidence} onChange={(e) => update("countryOfResidence", e.target.value)} placeholder="United States" required /></Field>
            <Field label="Home currency"><select className="input" value={form.baseCurrency} onChange={(e) => update("baseCurrency", e.target.value)}><option>USD</option><option>GBP</option><option>CAD</option><option>EUR</option><option>NGN</option></select></Field>
            <Field label="Investment experience"><select className="input" value={form.investmentExperience} onChange={(e) => update("investmentExperience", e.target.value)}><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select></Field>
            <Field label="Risk tolerance"><select className="input" value={form.riskTolerance} onChange={(e) => update("riskTolerance", e.target.value)}><option value="CONSERVATIVE">Conservative</option><option value="MODERATE">Moderate</option><option value="AGGRESSIVE">Aggressive</option></select></Field>
            <Field label="Investment horizon"><select className="input" value={form.investmentHorizon} onChange={(e) => update("investmentHorizon", e.target.value)}><option value="SHORT_TERM">Under 2 years</option><option value="MEDIUM_TERM">2–5 years</option><option value="LONG_TERM">5+ years</option></select></Field>
            <Field label="Estimated capital range"><input className="input" value={form.estimatedCapitalRange ?? ""} onChange={(e) => update("estimatedCapitalRange", e.target.value)} placeholder="$10k–$25k / ₦ equivalent" /></Field>
            <Field label="Readiness"><select className="input" value={form.readinessStage} onChange={(e) => update("readinessStage", e.target.value)}><option value="LEARNING">Learning</option><option value="SIMULATING">Simulating</option><option value="PREPARING">Preparing</option><option value="READY_TO_INVEST">Ready to invest externally</option></select></Field>
            <Field label="Interests"><input className="input" value={form.interests ?? ""} onChange={(e) => update("interests", e.target.value)} placeholder="EQUITIES,BONDS,T-BILLS,MMF" /></Field>
          </div>

          <Field label="Goals"><textarea className="input min-h-24" value={form.goals ?? ""} onChange={(e) => update("goals", e.target.value)} placeholder="Long-term wealth, income, capital preservation…" /></Field>

          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={form.consentPartnerUpdates} onChange={(e) => update("consentPartnerUpdates", e.target.checked)} className="mt-1" />
            <span>Keep me informed when YieldDesk introduces supported third-party investment access options. This does not open a brokerage account or authorize a trade.</span>
          </label>

          <button type="submit" disabled={save.isPending} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {save.isPending ? "Saving…" : "Save profile"}
          </button>
          {save.isSuccess && <span className="ml-3 text-sm text-primary">Saved</span>}
          {save.isError && <p className="text-sm text-destructive">Could not save profile.</p>}
        </form>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold">Ready to Invest</h2>
            <p className="text-sm text-muted-foreground mt-2">When you reach this stage, YieldDesk records your interest and helps you understand the access path. You still invest through a provider outside YieldDesk.</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold">YieldDesk boundary</h2>
            <p className="text-sm text-muted-foreground mt-2">YieldDesk provides education, simulation, market intelligence and portfolio review. It does not custody funds or execute securities transactions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1.5 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}
