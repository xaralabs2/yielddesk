import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  WalletCards,
} from "lucide-react";
import { apiRequest } from "@/lib/api-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type Horizon = "SHORT" | "MEDIUM" | "LONG";
type Strategy = "PRESERVE" | "BALANCED" | "GROWTH" | "INCOME";
type Allocation = {
  key: string;
  label: string;
  percentage: number;
  amountNgn: number;
  purpose: string;
};
type Preview = {
  goal: string;
  totalSpendNgn: number;
  horizon: Horizon;
  strategy: Strategy;
  modelName: string;
  modelSummary: string;
  methodologyVersion: string;
  allocations: Allocation[];
  assumptions: string[];
  limitation: string;
  simulated: true;
};

const ngn = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const horizons: Array<{ value: Horizon; label: string; detail: string }> = [
  { value: "SHORT", label: "Under 3 years", detail: "Short horizon" },
  { value: "MEDIUM", label: "3–7 years", detail: "Medium horizon" },
  { value: "LONG", label: "More than 7 years", detail: "Long horizon" },
];

const strategies: Array<{ value: Strategy; label: string; detail: string }> = [
  { value: "PRESERVE", label: "Preserve capital", detail: "More liquidity and fixed income" },
  { value: "BALANCED", label: "Balance growth and income", detail: "A broad mixture across asset categories" },
  { value: "GROWTH", label: "Prioritize growth", detail: "More long-term growth exposure" },
  { value: "INCOME", label: "Prioritize income", detail: "More sovereign and dividend-oriented income" },
];

function parseError(error: Error | null) {
  if (!error) return "";
  try {
    const parsed = JSON.parse(error.message);
    return parsed.message ?? error.message;
  } catch {
    return error.message;
  }
}

export default function WealthBuilderPage() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [totalSpend, setTotalSpend] = useState("");
  const [horizon, setHorizon] = useState<Horizon | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const requestBody = useMemo(
    () =>
      horizon && strategy
        ? { goal: goal.trim(), totalSpendNgn: Number(totalSpend), horizon, strategy }
        : null,
    [goal, totalSpend, horizon, strategy],
  );

  const previewPlan = useMutation({
    mutationFn: async () => {
      if (!requestBody) throw new Error("Choose a time horizon and model to continue.");
      return (await apiRequest("POST", "/api/wealth-builder/preview", requestBody)).json() as Promise<Preview>;
    },
    onSuccess: (result) => {
      setPreview(result);
      setStep(3);
    },
  });

  const savePlan = useMutation({
    mutationFn: async () => {
      if (!requestBody) throw new Error("Choose a time horizon and model to continue.");
      return (await apiRequest("POST", "/api/wealth-builder/plans", {
        ...requestBody,
        confirmed: true,
      })).json();
    },
    onSuccess: () => setStep(4),
  });

  const canContinue = goal.trim().length >= 3 && Number(totalSpend) >= 10_000;

  const reset = () => {
    setStep(1);
    setGoal("");
    setTotalSpend("");
    setHorizon(null);
    setStrategy(null);
    setPreview(null);
    previewPlan.reset();
    savePlan.reset();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8" data-testid="wealth-builder-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Guided simulator
            </Badge>
            <Badge variant="secondary">Nigeria first</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Build my wealth portfolio</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tell YieldDesk what the money is for and how much you want to model. You choose the
            strategy; the calculation engine creates a transparent hypothetical allocation.
          </p>
        </div>
        <div className="max-w-sm rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <strong>Simulation only.</strong> No trade is placed, no broker receives an order and
          your recorded holdings are not changed.
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2" aria-label="Wealth builder progress">
        {["Goal & budget", "Time & strategy", "Review", "Saved"].map((label, index) => (
          <div key={label}>
            <div className={`h-1.5 rounded-full ${step >= index + 1 ? "bg-primary" : "bg-muted"}`} />
            <div className="mt-1 hidden text-xs text-muted-foreground sm:block">{label}</div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              What are you building toward?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="wealth-goal">Your goal</Label>
              <Textarea
                id="wealth-goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="For example: Build long-term wealth, generate retirement income, or protect capital for a home purchase."
                className="min-h-28"
                maxLength={500}
                data-testid="wealth-goal"
              />
              <p className="text-xs text-muted-foreground">
                Use your own words. YieldDesk stores this as the purpose of the simulation.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wealth-budget">How much do you want to model in total?</Label>
              <div className="relative max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                <Input
                  id="wealth-budget"
                  className="pl-8 text-lg"
                  inputMode="numeric"
                  value={totalSpend}
                  onChange={(event) => setTotalSpend(event.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="5000000"
                  data-testid="wealth-budget"
                />
              </div>
              {Number(totalSpend) > 0 && (
                <p className="text-sm font-medium">{ngn.format(Number(totalSpend))}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canContinue} data-testid="wealth-next">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-primary" />
              Choose the assumptions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-7">
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">When might you need most of this money?</legend>
              <div className="grid gap-3 md:grid-cols-3">
                {horizons.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={horizon === option.value}
                    onClick={() => setHorizon(option.value)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      horizon === option.value ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{option.detail}</div>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Which model do you want to simulate?</legend>
              <p className="text-sm text-muted-foreground">
                YieldDesk does not select a model for you. Compare the descriptions and choose one.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {strategies.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={strategy === option.value}
                    onClick={() => setStrategy(option.value)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      strategy === option.value ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{option.detail}</div>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap justify-between gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => previewPlan.mutate()}
                disabled={previewPlan.isPending || !horizon || !strategy}
              >
                {previewPlan.isPending ? "Building model…" : "Build hypothetical portfolio"}
                {!previewPlan.isPending && <Sparkles className="ml-2 h-4 w-4" />}
              </Button>
            </div>
            {previewPlan.isError && (
              <p role="alert" className="text-sm text-destructive">{parseError(previewPlan.error)}</p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 3 && preview && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>{preview.modelName}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{preview.modelSummary}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Model budget</div>
                  <div className="text-2xl font-bold">{ngn.format(preview.totalSpendNgn)}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-lg border bg-muted/30 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Goal</div>
                <p className="mt-1">{preview.goal}</p>
              </div>
              <div className="space-y-4">
                {preview.allocations.map((allocation) => (
                  <div key={allocation.key} className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">{allocation.label}</div>
                        <div className="text-xs text-muted-foreground">{allocation.purpose}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{ngn.format(allocation.amountNgn)}</div>
                        <div className="text-xs text-muted-foreground">{allocation.percentage}%</div>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${allocation.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Visible assumptions</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {preview.assumptions.map((assumption) => (
                    <li key={assumption} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{assumption}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" />Before you save</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>{preview.limitation}</p>
                <p>
                  Saving records your chosen hypothetical model. It does not fund a portfolio,
                  change your real holdings or create simulated trades.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Change assumptions
            </Button>
            <Button onClick={() => savePlan.mutate()} disabled={savePlan.isPending}>
              {savePlan.isPending ? "Saving…" : "Confirm and save simulation"}
              {!savePlan.isPending && <ShieldCheck className="ml-2 h-4 w-4" />}
            </Button>
          </div>
          {savePlan.isError && (
            <p role="alert" className="text-sm text-destructive">{parseError(savePlan.error)}</p>
          )}
        </div>
      )}

      {step === 4 && (
        <Card className="border-primary/40">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Hypothetical plan saved</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Your selected model is now part of your YieldDesk planning history. No real or
              simulated trade was placed.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Build another model
              </Button>
              <Button asChild>
                <Link href="/simulator">
                  Open simulator
                  <WalletCards className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
