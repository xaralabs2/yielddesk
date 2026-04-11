import { useState, useCallback } from "react";
import { useGetPortfolioSummary, useGetPortfolioAnalytics } from "@workspace/api-client-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase,
  TrendingUp,
  Banknote,
  PieChart,
  Shield,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Settings,
  Building2,
  DollarSign,
  BarChart3,
  Receipt,
  Wallet,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PortfolioHolding = {
  id: number;
  userId: string;
  asset: string;
  ticker: string | null;
  pillar: string;
  valueNgn: number;
  shares: number | null;
  entryValueNgn: number | null;
  entryFxRate: number | null;
  annualRentNgn: number | null;
  cumulativeRentNgn: number | null;
  corridor: string | null;
  entryDate: string | null;
  lastUpdated: string | null;
  gainLossPct?: number | null;
  livePrice?: number | null;
  strategicIrr?: number | null;
};

type PillarSummary = {
  pillar: string;
  value: number;
  weight: number;
  target: number;
  drift: number;
  holdings: { asset: string; value: number }[];
};

type RebalanceAlert = {
  pillar: string;
  drift: number;
  direction: "over" | "under";
  action: string;
};

type PortfolioDashboard = {
  totalValue: number;
  baselineValue: number;
  targetValue: number;
  nominalReturn: number;
  realReturn: number;
  currentInflation: number;
  pillars: PillarSummary[];
  alerts: RebalanceAlert[];
  holdings: PortfolioHolding[];
  config: { stabilityTarget: number; inflationTarget: number; strategicTarget: number; tolerance: number };
  availableCash: number;
  totalCommissions: number;
  totalFees: number;
  totalTaxes: number;
  fxRate: number;
};

type ParsedTransaction = {
  security: string;
  ticker: string;
  quantity: number;
  price: number;
  grossAmount: number;
  totalAmount: number;
  tradeDate: string;
  settlementDate: string;
  type: "BUY" | "SELL";
  broker: string;
  fees: number;
};

const PILLAR_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Stability: { bg: "bg-teal-500/10", text: "text-teal-500", bar: "bg-teal-500" },
  "Inflation Hedge": { bg: "bg-emerald-500/10", text: "text-emerald-500", bar: "bg-emerald-500" },
  Strategic: { bg: "bg-indigo-500/10", text: "text-indigo-500", bar: "bg-indigo-500" },
};

const PILLAR_KEY_MAP: Record<string, string> = {
  STABILITY: "Stability",
  INFLATION: "Inflation Hedge",
  STRATEGIC: "Strategic",
};

const CORRIDORS = ["Lekki Phase 1", "Ibeju Lekki", "Victoria Island", "Ikoyi", "Eko Atlantic", "Other"];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

function formatPercent(n: number) {
  return `${n.toFixed(2)}%`;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function apiPost(url: string, body: Record<string, unknown>) {
  const headers = getAuthHeaders();
  headers["Content-Type"] = "application/json";
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

async function apiPatch(url: string, body: Record<string, unknown>) {
  const headers = getAuthHeaders();
  headers["Content-Type"] = "application/json";
  const res = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

async function apiDelete(url: string) {
  const headers = getAuthHeaders();
  const res = await fetch(url, { method: "DELETE", headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

function PillarGauge({ pillar, totalValue, tolerance }: { pillar: PillarSummary; totalValue: number; tolerance: number }) {
  const colors = PILLAR_COLORS[pillar.pillar] || PILLAR_COLORS.Stability;
  const actualPct = totalValue > 0 ? (pillar.weight * 100) : 0;
  const targetPct = pillar.target * 100;
  const driftPct = pillar.drift * 100;
  const isOutOfBand = Math.abs(pillar.drift) > tolerance;

  return (
    <div className={cn("rounded-lg border p-4 space-y-3", isOutOfBand ? "border-amber-500/50" : "border-border")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-2.5 h-2.5 rounded-full", colors.bar)} />
          <span className="text-sm font-semibold">{pillar.pillar}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-mono tabular-nums">{actualPct.toFixed(1)}%</span>
          <span className="text-xs text-muted-foreground">/ {targetPct.toFixed(0)}%</span>
        </div>
      </div>

      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", colors.bar)} style={{ width: `${Math.min(actualPct, 100)}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-foreground/40" style={{ left: `${Math.min(targetPct, 100)}%` }} />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{formatCurrency(pillar.value)}</span>
        <span className={cn("font-mono font-medium", driftPct > 0 ? "text-emerald-500" : driftPct < 0 ? "text-rose-500" : "text-muted-foreground")}>
          {driftPct > 0 ? "+" : ""}{driftPct.toFixed(1)}% drift
        </span>
      </div>

      {pillar.holdings.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border/50">
          {pillar.holdings.slice(0, 3).map((h) => (
            <div key={h.asset} className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate max-w-[140px]">{h.asset}</span>
              <span className="font-mono">{formatCurrency(h.value)}</span>
            </div>
          ))}
          {pillar.holdings.length > 3 && (
            <span className="text-[10px] text-muted-foreground/60">+{pillar.holdings.length - 3} more</span>
          )}
        </div>
      )}
    </div>
  );
}

function AddHoldingDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [pillar, setPillar] = useState("INFLATION");
  const [asset, setAsset] = useState("");
  const [ticker, setTicker] = useState("");
  const [valueNgn, setValueNgn] = useState("");
  const [shares, setShares] = useState("");
  const [annualRent, setAnnualRent] = useState("");
  const [corridor, setCorridor] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setAsset("");
    setTicker("");
    setValueNgn("");
    setShares("");
    setAnnualRent("");
    setCorridor("");
    setEntryDate("");
    setPillar("INFLATION");
  }, []);

  const handleSubmit = async () => {
    if (!asset || !valueNgn) {
      toast({ title: "Asset name and value are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { asset, pillar, valueNgn: Number(valueNgn) };
      if (ticker) body.ticker = ticker;
      if (shares) body.shares = Number(shares);
      if (pillar === "STRATEGIC") {
        if (annualRent) body.annualRentNgn = Number(annualRent);
        if (corridor) body.corridor = corridor;
        if (entryDate) body.entryDate = entryDate;
      }
      if (shares) body.entryValueNgn = Number(valueNgn);
      const result = await apiPost("/api/portfolio/holdings", body);
      const merged = (result as any).merged;
      toast({
        title: merged ? "Holding merged" : "Holding added",
        description: merged
          ? `${asset} shares merged (${(result as any).previousShares} + ${(result as any).addedShares})`
          : `${asset} added to ${PILLAR_KEY_MAP[pillar] || pillar}`,
      });
      resetForm();
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      toast({ title: "Failed to add holding", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Holding
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Portfolio Holding</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Pillar</Label>
            <Select value={pillar} onValueChange={setPillar}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="STABILITY">Stability (T-Bills, MMF, Cash)</SelectItem>
                <SelectItem value="INFLATION">Inflation Hedge (Equities, Bonds)</SelectItem>
                <SelectItem value="STRATEGIC">Strategic (Real Estate, SPVs)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Asset Name</Label>
              <Input placeholder={pillar === "STRATEGIC" ? "e.g. Lekki Plot" : "e.g. DANGCEM"} value={asset} onChange={(e) => setAsset(e.target.value)} />
            </div>
            {pillar !== "STRATEGIC" && (
              <div className="space-y-2">
                <Label>Ticker (optional)</Label>
                <Input placeholder="e.g. DANGCEM" value={ticker} onChange={(e) => setTicker(e.target.value)} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Value (NGN)</Label>
              <Input type="number" placeholder="0" value={valueNgn} onChange={(e) => setValueNgn(e.target.value)} />
            </div>
            {pillar !== "STRATEGIC" && (
              <div className="space-y-2">
                <Label>Shares (optional)</Label>
                <Input type="number" placeholder="0" value={shares} onChange={(e) => setShares(e.target.value)} />
              </div>
            )}
          </div>
          {pillar === "STRATEGIC" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Annual Rent (NGN)</Label>
                  <Input type="number" placeholder="0" value={annualRent} onChange={(e) => setAnnualRent(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Corridor</Label>
                  <Select value={corridor} onValueChange={setCorridor}>
                    <SelectTrigger><SelectValue placeholder="Select corridor" /></SelectTrigger>
                    <SelectContent>
                      {CORRIDORS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Entry Date</Label>
                <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
              </div>
            </>
          )}
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Adding..." : "Add Holding"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfigDialog({ currentConfig, dashboard, onSuccess }: {
  currentConfig: PortfolioDashboard["config"];
  dashboard: PortfolioDashboard;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [baseline, setBaseline] = useState(String(dashboard.baselineValue || ""));
  const [target, setTarget] = useState(String(dashboard.targetValue || ""));
  const [stability, setStability] = useState(String((currentConfig.stabilityTarget * 100).toFixed(0)));
  const [inflation, setInflation] = useState(String((currentConfig.inflationTarget * 100).toFixed(0)));
  const [strategic, setStrategic] = useState(String((currentConfig.strategicTarget * 100).toFixed(0)));
  const [tolerance, setTolerance] = useState(String((currentConfig.tolerance * 100).toFixed(0)));
  const [cash, setCash] = useState(String(dashboard.availableCash || ""));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!baseline) {
      toast({ title: "Baseline value is required", variant: "destructive" });
      return;
    }
    const s = Number(stability) / 100;
    const i = Number(inflation) / 100;
    const st = Number(strategic) / 100;
    const sum = s + i + st;
    if (Math.abs(sum - 1) > 0.01) {
      toast({ title: "Pillar targets must sum to 100%", description: `Current total: ${(sum * 100).toFixed(0)}%`, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/portfolio/config", {
        baselineValue: Number(baseline),
        targetValue: Number(target) || 0,
        stabilityTarget: s,
        inflationTarget: i,
        strategicTarget: st,
        tolerance: Number(tolerance) / 100,
        availableCash: Number(cash) || 0,
      });
      toast({ title: "Portfolio config updated" });
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      toast({ title: "Failed to update config", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings className="w-3.5 h-3.5" /> Configure
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Portfolio Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Baseline Value (NGN)</Label>
              <Input type="number" value={baseline} onChange={(e) => setBaseline(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Target Value (NGN)</Label>
              <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Stability %</Label>
              <Input type="number" min="0" max="100" value={stability} onChange={(e) => setStability(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Inflation %</Label>
              <Input type="number" min="0" max="100" value={inflation} onChange={(e) => setInflation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Strategic %</Label>
              <Input type="number" min="0" max="100" value={strategic} onChange={(e) => setStrategic(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tolerance %</Label>
              <Input type="number" min="1" max="20" value={tolerance} onChange={(e) => setTolerance(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Available Cash (NGN)</Label>
              <Input type="number" value={cash} onChange={(e) => setCash(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PdfUploadDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [parsed, setParsed] = useState<ParsedTransaction[] | null>(null);
  const [importing, setImporting] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Please upload a PDF file", variant: "destructive" });
      return;
    }
    setUploading(true);
    setParsed(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const headers = getAuthHeaders();
      const res = await fetch("/api/portfolio/parse-pdf", { method: "POST", headers, body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message);
      }
      const data = await res.json();
      const transactions = (data as any).transactions || data;
      setParsed(Array.isArray(transactions) ? transactions : []);
      if (Array.isArray(transactions) && transactions.length === 0) {
        toast({ title: "No transactions found in PDF", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Failed to parse PDF", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleImportAll = async () => {
    if (!parsed || parsed.length === 0) return;
    setImporting(true);
    let succeeded = 0;
    for (const tx of parsed) {
      if (tx.type !== "BUY") continue;
      try {
        await apiPost("/api/portfolio/holdings", {
          asset: tx.security,
          ticker: tx.ticker,
          pillar: "INFLATION",
          valueNgn: tx.totalAmount,
          shares: tx.quantity,
          entryValueNgn: tx.totalAmount,
        });
        succeeded++;
      } catch {
      }
    }
    setImporting(false);
    toast({ title: `Imported ${succeeded} holdings` });
    setParsed(null);
    setOpen(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setParsed(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="w-3.5 h-3.5" /> Import PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Broker Contract Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">Upload a PDF broker contract note to auto-import trades as portfolio holdings.</p>
          <Input type="file" accept=".pdf" onChange={handleUpload} disabled={uploading} />
          {uploading && <p className="text-xs text-muted-foreground">Parsing PDF...</p>}
          {parsed && parsed.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {parsed.length} transaction{parsed.length > 1 ? "s" : ""} found
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {parsed.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border text-xs">
                    <div className="space-y-0.5">
                      <div className="font-medium">{tx.security}</div>
                      <div className="text-muted-foreground">{tx.ticker} | {tx.quantity} shares @ ₦{tx.price.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant={tx.type === "BUY" ? "default" : "secondary"} className="text-[9px]">{tx.type}</Badge>
                      <div className="font-mono mt-0.5">{formatCurrency(tx.totalAmount)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleImportAll} disabled={importing} className="w-full">
                {importing ? "Importing..." : `Import ${parsed.filter(t => t.type === "BUY").length} BUY trades as Holdings`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HoldingsTable({ holdings, onRefresh }: { holdings: PortfolioHolding[]; onRefresh: () => void }) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editShares, setEditShares] = useState("");
  const [editRent, setEditRent] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await apiDelete(`/api/portfolio/holdings/${id}`);
      toast({ title: "Holding removed" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = async (holding: PortfolioHolding) => {
    try {
      const updates: Record<string, unknown> = {};
      if (editValue) updates.valueNgn = Number(editValue);
      if (editShares) updates.shares = Number(editShares);
      if (editRent && holding.pillar === "STRATEGIC") updates.annualRentNgn = Number(editRent);
      await apiPatch(`/api/portfolio/holdings/${holding.id}`, updates);
      toast({ title: "Holding updated" });
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    }
  };

  if (holdings.length === 0) {
    return (
      <div className="py-8 text-center">
        <Wallet className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No holdings in the 3-pillar portfolio yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Use "Add Holding" or "Import PDF" to get started.</p>
      </div>
    );
  }

  const grouped: Record<string, PortfolioHolding[]> = {};
  for (const h of holdings) {
    const label = PILLAR_KEY_MAP[h.pillar] || h.pillar;
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(h);
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([pillarLabel, items]) => {
        const colors = PILLAR_COLORS[pillarLabel] || PILLAR_COLORS.Stability;
        return (
          <div key={pillarLabel} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", colors.bar)} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{pillarLabel}</span>
              <span className="text-xs text-muted-foreground font-mono">({items.length})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[10px] text-muted-foreground uppercase tracking-wider">
                    <th className="px-3 py-2">Asset</th>
                    <th className="px-3 py-2">Value</th>
                    {pillarLabel !== "Strategic" && <th className="px-3 py-2">Shares</th>}
                    {pillarLabel !== "Strategic" && <th className="px-3 py-2">Live Price</th>}
                    {pillarLabel !== "Strategic" && <th className="px-3 py-2">Gain/Loss</th>}
                    {pillarLabel === "Strategic" && <th className="px-3 py-2">Corridor</th>}
                    {pillarLabel === "Strategic" && <th className="px-3 py-2">Rent/yr</th>}
                    {pillarLabel === "Strategic" && <th className="px-3 py-2">IRR</th>}
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((h) => {
                    const isEditing = editingId === h.id;
                    return (
                      <tr key={h.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {pillarLabel === "Strategic" ? <Home className="w-3 h-3 text-muted-foreground" /> : <BarChart3 className="w-3 h-3 text-muted-foreground" />}
                            <span className="font-medium text-xs">{h.asset}</span>
                            {h.ticker && h.ticker !== h.asset && (
                              <Badge variant="outline" className="text-[9px] font-mono">{h.ticker}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          {isEditing ? (
                            <Input className="h-7 w-28 text-xs" type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                          ) : (
                            <span className="font-mono text-xs">{formatCurrency(h.valueNgn)}</span>
                          )}
                        </td>
                        {pillarLabel !== "Strategic" && (
                          <td className="px-3 py-2.5">
                            {isEditing ? (
                              <Input className="h-7 w-20 text-xs" type="number" value={editShares} onChange={(e) => setEditShares(e.target.value)} />
                            ) : (
                              <span className="font-mono text-xs">{h.shares != null ? h.shares.toLocaleString() : "—"}</span>
                            )}
                          </td>
                        )}
                        {pillarLabel !== "Strategic" && (
                          <td className="px-3 py-2.5">
                            <span className="font-mono text-xs">
                              {h.livePrice != null ? `₦${h.livePrice.toFixed(2)}` : "—"}
                            </span>
                          </td>
                        )}
                        {pillarLabel !== "Strategic" && (
                          <td className="px-3 py-2.5">
                            {h.gainLossPct != null ? (
                              <span className={cn("font-mono text-xs font-medium", h.gainLossPct >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                {h.gainLossPct >= 0 ? "+" : ""}{h.gainLossPct.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        )}
                        {pillarLabel === "Strategic" && (
                          <td className="px-3 py-2.5">
                            {h.corridor ? (
                              <Badge variant="outline" className="text-[9px]">{h.corridor}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        )}
                        {pillarLabel === "Strategic" && (
                          <td className="px-3 py-2.5">
                            {isEditing ? (
                              <Input className="h-7 w-24 text-xs" type="number" value={editRent} onChange={(e) => setEditRent(e.target.value)} />
                            ) : (
                              <span className="font-mono text-xs">
                                {h.annualRentNgn != null && h.annualRentNgn > 0 ? formatCurrency(h.annualRentNgn) : "—"}
                              </span>
                            )}
                          </td>
                        )}
                        {pillarLabel === "Strategic" && (
                          <td className="px-3 py-2.5">
                            {h.strategicIrr != null ? (
                              <span className={cn("font-mono text-xs font-medium", h.strategicIrr >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                {h.strategicIrr >= 0 ? "+" : ""}{h.strategicIrr.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        )}
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            {isEditing ? (
                              <>
                                <Button size="sm" variant="default" className="h-6 text-[10px] px-2" onClick={() => handleSaveEdit(h)}>Save</Button>
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setEditingId(null)}>Cancel</Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
                                  setEditingId(h.id);
                                  setEditValue(String(h.valueNgn));
                                  setEditShares(String(h.shares ?? ""));
                                  setEditRent(String(h.annualRentNgn ?? ""));
                                }}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  disabled={deletingId === h.id}
                                  onClick={() => handleDelete(h.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PortfolioPage() {
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useGetPortfolioSummary();
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError } = useGetPortfolioAnalytics();
  const queryClient = useQueryClient();

  const { data: pillarData, isError: pillarError } = useQuery<PortfolioDashboard>({
    queryKey: ["/api/portfolio"],
    refetchInterval: 60 * 1000,
  });

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    queryClient.invalidateQueries({ queryKey: ["/api/portfolio-summary"] });
    queryClient.invalidateQueries({ queryKey: ["/api/portfolio-analytics"] });
  }, [queryClient]);

  if (summaryLoading || analyticsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (summaryError || analyticsError) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto text-destructive mb-3" />
            <h3 className="text-sm font-semibold mb-1">Failed to load portfolio data</h3>
            <p className="text-xs text-muted-foreground">Please try refreshing the page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasPillarData = pillarData && pillarData.pillars && pillarData.pillars.length > 0;
  const hasPillarHoldings = hasPillarData && pillarData.holdings && pillarData.holdings.length > 0;
  const totalCosts = (pillarData?.totalCommissions ?? 0) + (pillarData?.totalFees ?? 0) + (pillarData?.totalTaxes ?? 0);

  return (
    <div className="p-6 space-y-6" data-testid="portfolio-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-sm text-muted-foreground">Allocation breakdown, 3-pillar framework, and holdings management</p>
        </div>
        <div className="flex items-center gap-2">
          <PdfUploadDialog onSuccess={refreshAll} />
          <AddHoldingDialog onSuccess={refreshAll} />
          {pillarData && <ConfigDialog currentConfig={pillarData.config} dashboard={pillarData} onSuccess={refreshAll} />}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card data-testid="card-portfolio-total">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <Briefcase className="w-3.5 h-3.5" /> Total Capital
            </div>
            <div className="text-xl font-bold font-mono">{formatCurrency(summary?.totalCapital ?? 0)}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-effective-yield">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5" /> Effective Yield
            </div>
            <div className="text-xl font-bold font-mono">{formatPercent(analytics?.effectiveYield ?? 0)}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-deployed">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <Banknote className="w-3.5 h-3.5" /> Deployed
            </div>
            <div className="text-xl font-bold font-mono">{formatCurrency(analytics?.totalDeployed ?? 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">{formatPercent(analytics?.capitalDeploymentRate ?? 0)}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-idle">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <Banknote className="w-3.5 h-3.5" /> Idle Cash
            </div>
            <div className="text-xl font-bold font-mono">{formatCurrency(analytics?.totalIdle ?? 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">{formatPercent(analytics?.idleCashPercentage ?? 0)}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-holdings-count">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <PieChart className="w-3.5 h-3.5" /> Holdings
            </div>
            <div className="text-xl font-bold font-mono">{summary?.activeHoldings ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">of {summary?.holdingsCount ?? 0} total</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-l-4 border-l-primary" data-testid="card-deployment-bar">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Capital Deployment</span>
            <span className="text-sm font-mono">{formatPercent(analytics?.capitalDeploymentRate ?? 0)}</span>
          </div>
          <Progress value={analytics?.capitalDeploymentRate ?? 0} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Deployed: {formatCurrency(analytics?.totalDeployed ?? 0)}</span>
            <span>Idle: {formatCurrency(analytics?.totalIdle ?? 0)}</span>
          </div>
        </CardContent>
      </Card>

      {hasPillarData && (
        <>
          <div className="space-y-4" data-testid="section-3-pillar">
            <div className="flex items-center gap-2 flex-wrap">
              <Target className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-semibold">3-Pillar Framework</h2>
              {pillarData.realReturn !== undefined && (
                <div className="ml-auto flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">Nominal:</span>
                    <span className={cn("font-mono font-semibold", pillarData.nominalReturn >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {pillarData.nominalReturn >= 0 ? "+" : ""}{pillarData.nominalReturn.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">Real:</span>
                    <span className={cn("font-mono font-semibold", pillarData.realReturn >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {pillarData.realReturn >= 0 ? "+" : ""}{pillarData.realReturn.toFixed(1)}%
                    </span>
                    {pillarData.realReturn >= 0 ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownRight className="w-3 h-3 text-rose-500" />}
                  </div>
                  <Badge variant="outline" className="text-[10px]">CPI {pillarData.currentInflation?.toFixed(1)}%</Badge>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pillarData.pillars.map((p) => (
                <PillarGauge
                  key={p.pillar}
                  pillar={p}
                  totalValue={pillarData.totalValue}
                  tolerance={pillarData.config.tolerance}
                />
              ))}
            </div>
          </div>

          {pillarData.alerts && pillarData.alerts.length > 0 && (
            <Card className="border-l-4 border-l-amber-500" data-testid="card-rebalance-alerts">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Rebalance Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pillarData.alerts.map((alert, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <div className={cn("mt-0.5 w-2 h-2 rounded-full shrink-0", alert.direction === "over" ? "bg-emerald-500" : "bg-rose-500")} />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{alert.pillar}</span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {alert.direction === "over" ? "+" : ""}{(alert.drift * 100).toFixed(1)}% {alert.direction}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{alert.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Portfolio Value</div>
              <div className="text-sm font-bold font-mono">{formatCurrency(pillarData.totalValue)}</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Baseline</div>
              <div className="text-sm font-bold font-mono">{formatCurrency(pillarData.baselineValue)}</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Target</div>
              <div className="text-sm font-bold font-mono">{formatCurrency(pillarData.targetValue)}</div>
            </div>
            {pillarData.availableCash > 0 && (
              <div className="rounded-lg border p-3 text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Available Cash</div>
                <div className="text-sm font-bold font-mono">{formatCurrency(pillarData.availableCash)}</div>
              </div>
            )}
            {pillarData.fxRate > 0 && (
              <div className="rounded-lg border p-3 text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">USD/NGN</div>
                <div className="text-sm font-bold font-mono">₦{pillarData.fxRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            )}
          </div>

          {totalCosts > 0 && (
            <Card data-testid="card-transaction-costs">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="w-4 h-4" /> Transaction Costs (NGX)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Brokerage</div>
                    <div className="text-sm font-bold font-mono">{formatCurrency(pillarData.totalCommissions)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Fees (SEC+NSE+CSCS)</div>
                    <div className="text-sm font-bold font-mono">{formatCurrency(pillarData.totalFees)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Stamp Duty</div>
                    <div className="text-sm font-bold font-mono">{formatCurrency(pillarData.totalTaxes)}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Costs</span>
                  <span className="text-sm font-bold font-mono">{formatCurrency(totalCosts)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card data-testid="card-pillar-holdings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4" /> 3-Pillar Holdings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 px-4 pb-4">
          <HoldingsTable
            holdings={(pillarData?.holdings ?? []) as PortfolioHolding[]}
            onRefresh={refreshAll}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-by-type">
          <CardHeader>
            <CardTitle className="text-base">Allocation by Asset Type</CardTitle>
          </CardHeader>
          <CardContent>
            {(!summary?.allocationByType || summary.allocationByType.length === 0) ? (
              <p className="text-sm text-muted-foreground">No holdings</p>
            ) : (
              <div className="space-y-4">
                {summary.allocationByType.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono">{item.name}</Badge>
                        <span className="text-sm text-muted-foreground">{formatCurrency(item.value)}</span>
                      </div>
                      <span className="text-sm font-mono">{item.percentage}%</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card data-testid="card-by-issuer">
          <CardHeader>
            <CardTitle className="text-base">Allocation by Issuer</CardTitle>
          </CardHeader>
          <CardContent>
            {(!summary?.allocationByIssuer || summary.allocationByIssuer.length === 0) ? (
              <p className="text-sm text-muted-foreground">No holdings</p>
            ) : (
              <div className="space-y-4">
                {summary.allocationByIssuer.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{formatCurrency(item.value)}</span>
                        <span className="text-sm font-mono">{item.percentage}%</span>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!hasPillarData && (
        <Card className="border-dashed" data-testid="card-pillar-empty">
          <CardContent className="py-8 text-center">
            <Shield className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold mb-1">3-Pillar Framework</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              The 3-pillar framework (Stability, Inflation Hedge, Strategic) provides macro-aware allocation targets and rebalance signals. Add portfolio holdings and configure pillar targets to activate.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
