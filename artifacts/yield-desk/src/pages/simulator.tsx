import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-helpers";

type SimulationAccount = { id: number; name: string; startingCashNgn: number; cashBalanceNgn: number; createdAt: string };
type SimulationDetail = {
  account: SimulationAccount;
  holdings: Array<{ id: number; symbol: string; assetName: string; quantity: number; averageCostNgn: number; currentPriceNgn: number; marketValueNgn: number; unrealizedPnlNgn: number; unrealizedReturnPct: number }>;
  transactions: Array<{ id: number; side: string; symbol: string; assetName: string; quantity: number; unitPriceNgn: number; grossAmountNgn: number; executedAt: string }>;
  summary: { cashBalanceNgn: number; holdingsValueNgn: number; totalValueNgn: number; totalReturnNgn: number; totalReturnPct: number };
  simulated: true;
};

const ngn = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

export default function SimulatorPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [startingCash, setStartingCash] = useState("10000000");
  const [symbol, setSymbol] = useState("GTCO");
  const [quantity, setQuantity] = useState("100");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");

  const accountsQuery = useQuery<SimulationAccount[]>({ queryKey: ["/api/simulation/accounts"] });
  const accounts = accountsQuery.data ?? [];
  const activeId = selectedId ?? accounts[0]?.id ?? null;
  const detailUrl = activeId ? `/api/simulation/accounts/${activeId}` : "/api/simulation/accounts/none";
  const detailQuery = useQuery<SimulationDetail>({ queryKey: [detailUrl], enabled: !!activeId });

  const createAccount = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/simulation/accounts", { startingCashNgn: Number(startingCash), name: "My Simulator" })).json() as Promise<SimulationAccount>,
    onSuccess: async (account) => {
      setSelectedId(account.id);
      await queryClient.invalidateQueries({ queryKey: ["/api/simulation/accounts"] });
    },
  });

  const trade = useMutation({
    mutationFn: async () => {
      if (!activeId) throw new Error("Create a simulation account first");
      return (await apiRequest("POST", `/api/simulation/accounts/${activeId}/trades`, { side, symbol, quantity: Number(quantity) })).json();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/simulation/accounts"] }),
        queryClient.invalidateQueries({ queryKey: [detailUrl] }),
      ]);
    },
  });

  const errorMessage = useMemo(() => {
    if (!trade.error) return "";
    try {
      const parsed = JSON.parse(trade.error.message);
      return parsed.message ?? trade.error.message;
    } catch {
      return trade.error.message;
    }
  }, [trade.error]);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Simulator</h1>
            <span className="text-xs font-bold rounded-full bg-amber-500/10 text-amber-600 px-2.5 py-1">SIMULATED</span>
          </div>
          <p className="text-muted-foreground mt-2">Practice Nigerian investing with virtual capital and live NGX reference prices. Real portfolio holdings are not changed.</p>
        </div>
        <div className="rounded-lg border px-4 py-3 text-sm max-w-sm">
          <strong>Simulation only.</strong> No real security is purchased or sold and no order is sent to a broker.
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 max-w-xl">
          <h2 className="text-xl font-semibold">Create your virtual portfolio</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Choose the amount of virtual NGN capital you want to practice with.</p>
          <label className="text-sm font-medium block mb-2">Starting virtual cash (NGN)</label>
          <input className="w-full rounded-md border bg-background px-3 py-2" inputMode="decimal" value={startingCash} onChange={(e) => setStartingCash(e.target.value)} />
          <button onClick={() => createAccount.mutate()} disabled={createAccount.isPending} className="mt-4 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50">{createAccount.isPending ? "Creating…" : "Create simulator"}</button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto">
            {accounts.map((account) => (
              <button key={account.id} onClick={() => setSelectedId(account.id)} className={`rounded-md border px-3 py-2 text-sm ${activeId === account.id ? "bg-primary text-primary-foreground" : "bg-card"}`}>{account.name}</button>
            ))}
          </div>

          {detailQuery.data && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Virtual portfolio" value={ngn.format(detailQuery.data.summary.totalValueNgn)} />
                <Metric label="Virtual cash" value={ngn.format(detailQuery.data.summary.cashBalanceNgn)} />
                <Metric label="Invested" value={ngn.format(detailQuery.data.summary.holdingsValueNgn)} />
                <Metric label="Simulated return" value={`${detailQuery.data.summary.totalReturnPct.toFixed(2)}%`} sub={ngn.format(detailQuery.data.summary.totalReturnNgn)} />
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
                <div className="rounded-xl border bg-card p-5 space-y-4">
                  <div><h2 className="text-xl font-semibold">Simulated trade</h2><p className="text-sm text-muted-foreground">Equities use the current NGX reference price resolved by YieldDesk.</p></div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setSide("BUY")} className={`rounded-md border px-3 py-2 text-sm font-semibold ${side === "BUY" ? "bg-primary text-primary-foreground" : ""}`}>Buy</button>
                    <button onClick={() => setSide("SELL")} className={`rounded-md border px-3 py-2 text-sm font-semibold ${side === "SELL" ? "bg-primary text-primary-foreground" : ""}`}>Sell</button>
                  </div>
                  <label className="block text-sm font-medium">NGX symbol<input className="mt-1.5 w-full rounded-md border bg-background px-3 py-2" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} /></label>
                  <label className="block text-sm font-medium">Quantity<input className="mt-1.5 w-full rounded-md border bg-background px-3 py-2" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label>
                  <button onClick={() => trade.mutate()} disabled={trade.isPending} className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50">{trade.isPending ? "Simulating…" : `Simulate ${side.toLowerCase()}`}</button>
                  {trade.isSuccess && <p className="text-sm text-primary">Simulation recorded. No real order was placed.</p>}
                  {trade.isError && <p className="text-sm text-destructive">{errorMessage}</p>}
                </div>

                <div className="rounded-xl border bg-card overflow-hidden">
                  <div className="p-5 border-b"><h2 className="text-xl font-semibold">Simulated holdings</h2><p className="text-sm text-muted-foreground">Completely separate from My Investments / real portfolio.</p></div>
                  {detailQuery.data.holdings.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No simulated holdings yet.</p> : (
                    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/50 text-left"><tr><th className="p-3">Asset</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Avg cost</th><th className="p-3 text-right">Market value</th><th className="p-3 text-right">P/L</th></tr></thead><tbody>{detailQuery.data.holdings.map((h) => <tr key={h.id} className="border-t"><td className="p-3"><div className="font-semibold">{h.symbol}</div><div className="text-xs text-muted-foreground">{h.assetName}</div></td><td className="p-3 text-right">{h.quantity.toLocaleString()}</td><td className="p-3 text-right">{ngn.format(h.averageCostNgn)}</td><td className="p-3 text-right">{ngn.format(h.marketValueNgn)}</td><td className="p-3 text-right"><div>{ngn.format(h.unrealizedPnlNgn)}</div><div className="text-xs text-muted-foreground">{h.unrealizedReturnPct.toFixed(2)}%</div></td></tr>)}</tbody></table></div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="p-5 border-b"><h2 className="text-xl font-semibold">Simulation history</h2></div>
                {detailQuery.data.transactions.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No simulated trades yet.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/50 text-left"><tr><th className="p-3">Date</th><th className="p-3">Action</th><th className="p-3">Symbol</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Reference price</th><th className="p-3 text-right">Virtual value</th></tr></thead><tbody>{detailQuery.data.transactions.map((t) => <tr key={t.id} className="border-t"><td className="p-3">{new Date(t.executedAt).toLocaleString()}</td><td className="p-3 font-semibold">{t.side}</td><td className="p-3">{t.symbol}</td><td className="p-3 text-right">{t.quantity.toLocaleString()}</td><td className="p-3 text-right">{ngn.format(t.unitPriceNgn)}</td><td className="p-3 text-right">{ngn.format(t.grossAmountNgn)}</td></tr>)}</tbody></table></div>}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-xl border bg-card p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="text-2xl font-bold mt-1">{value}</div>{sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}</div>;
}
