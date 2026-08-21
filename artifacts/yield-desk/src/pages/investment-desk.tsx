import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BrainCircuit, CheckCircle2 } from "lucide-react";

interface PositionRow {
  key: string;
  name: string;
  bucket: string;
  targetAmount: number;
  actualAmount: number;
  targetPct: number;
  actualPct: number;
  driftAmount: number;
  driftPct: number;
  action: "ADD" | "HOLD" | "TRIM" | "WATCH";
}

interface InvestmentDeskResponse {
  generatedAt: string;
  targetTotal: number;
  actualTracked: number;
  unallocatedToTarget: number;
  policyStatus: "NOT_STARTED" | "BUILDING" | "FUNDED";
  buckets: Array<{ name: string; targetAmount: number; actualAmount: number }>;
  positions: PositionRow[];
}

const money = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function actionStyle(action: PositionRow["action"]) {
  switch (action) {
    case "ADD":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "TRIM":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    case "WATCH":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    default:
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  }
}

export default function InvestmentDeskPage() {
  const { data, isLoading, error } = useQuery<InvestmentDeskResponse>({
    queryKey: ["/api/investment-desk"],
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading investment desk…</div>;
  }

  if (error || !data) {
    return <div className="p-8 text-sm text-destructive">Unable to load the investment desk.</div>;
  }

  const fundedPct = Math.min(100, (data.actualTracked / data.targetTotal) * 100);
  const attentionCount = data.positions.filter((position) => position.action !== "HOLD").length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
            <BrainCircuit className="w-4 h-4" />
            Personal Investment Policy
          </div>
          <h1 className="text-3xl font-bold tracking-tight">₦60m Investment Desk</h1>
          <p className="text-muted-foreground mt-1">
            Deterministic target allocation, actual holdings, drift and review actions.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Updated {new Date(data.generatedAt).toLocaleString()}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Policy capital" value={money.format(data.targetTotal)} />
        <Metric label="Tracked holdings" value={money.format(data.actualTracked)} />
        <Metric label="Still to deploy" value={money.format(Math.max(0, data.unallocatedToTarget))} />
        <Metric label="Needs review" value={`${attentionCount} positions`} />
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold">Funding progress</h2>
            <p className="text-sm text-muted-foreground">Status: {data.policyStatus.replace("_", " ")}</p>
          </div>
          <div className="font-semibold">{fundedPct.toFixed(1)}%</div>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${fundedPct}%` }} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {data.buckets.map((bucket) => {
          const pct = bucket.targetAmount > 0 ? (bucket.actualAmount / bucket.targetAmount) * 100 : 0;
          return (
            <div key={bucket.name} className="rounded-xl border bg-card p-5">
              <div className="text-sm text-muted-foreground">{bucket.name}</div>
              <div className="mt-1 text-xl font-semibold">{money.format(bucket.actualAmount)}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                Target {money.format(bucket.targetAmount)} · {pct.toFixed(0)}% funded
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="font-semibold">Target vs actual</h2>
          <p className="text-sm text-muted-foreground mt-1">
            ADD/TRIM/WATCH are allocation-drift signals only; they are not price-based trading recommendations.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-3">Asset</th>
                <th className="text-left font-medium px-5 py-3">Bucket</th>
                <th className="text-right font-medium px-5 py-3">Target</th>
                <th className="text-right font-medium px-5 py-3">Actual</th>
                <th className="text-right font-medium px-5 py-3">Drift</th>
                <th className="text-right font-medium px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.positions.map((position) => (
                <tr key={position.key} className="hover:bg-muted/20">
                  <td className="px-5 py-4 font-medium">{position.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{position.bucket}</td>
                  <td className="px-5 py-4 text-right">{money.format(position.targetAmount)}</td>
                  <td className="px-5 py-4 text-right">{money.format(position.actualAmount)}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={position.driftAmount > 0 ? "text-emerald-600" : position.driftAmount < 0 ? "text-amber-600" : "text-muted-foreground"}>
                      {position.driftAmount > 0 ? "+" : ""}{money.format(position.driftAmount)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${actionStyle(position.action)}`}>
                      {position.action === "ADD" && <ArrowUpRight className="w-3 h-3" />}
                      {position.action === "TRIM" && <ArrowDownRight className="w-3 h-3" />}
                      {position.action === "WATCH" && <AlertTriangle className="w-3 h-3" />}
                      {position.action === "HOLD" && <CheckCircle2 className="w-3 h-3" />}
                      {position.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
