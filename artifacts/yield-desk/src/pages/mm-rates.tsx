import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Plus, TrendingUp, Building2, ArrowUpRight, Sparkles, X } from "lucide-react";
import type { MmSummary, MmRatesData, GeCpData } from "./mm-rates/types";
import { formatDate, getAuthHeaders } from "./mm-rates/types";
import { RatesTabs } from "./mm-rates/RatesTabs";

function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
    .replace(/^#### (.+)$/gm, '<h4 class="text-sm font-semibold mt-3 mb-1">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

function RateCard({ label, rate, sublabel, icon: Icon, highlight }: {
  label: string;
  rate: number | null;
  sublabel: string;
  icon: typeof TrendingUp;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-l-4 border-l-success" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
          <Icon className="w-3.5 h-3.5" /> {label}
        </div>
        <div className="text-2xl font-bold font-mono">
          {rate != null ? `${rate.toFixed(2)}%` : "---"}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>
      </CardContent>
    </Card>
  );
}

export default function MmRatesPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery<MmSummary>({
    queryKey: ["/api/mm/summary"],
    queryFn: async () => {
      const res = await fetch("/api/mm/summary", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch MM summary");
      return res.json();
    },
  });
  const { data: allRates, isLoading: ratesLoading } = useQuery<MmRatesData>({
    queryKey: ["/api/mm/rates"],
    queryFn: async () => {
      const res = await fetch("/api/mm/rates", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch MM rates");
      return res.json();
    },
  });
  const { data: geCp } = useQuery<GeCpData>({
    queryKey: ["/api/mm/getequity-cp"],
    queryFn: async () => {
      const res = await fetch("/api/mm/getequity-cp", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch GetEquity CP");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [syncingFmdq, setSyncingFmdq] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [aiBriefLoading, setAiBriefLoading] = useState(false);
  const [aiBriefOpen, setAiBriefOpen] = useState(false);
  const [form, setForm] = useState({
    rateType: "NIBOR",
    tenor: "O/N",
    rate: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/mm/summary"] });
    queryClient.invalidateQueries({ queryKey: ["/api/mm/rates"] });
  };

  const handleAiBrief = async () => {
    setAiBriefLoading(true);
    setAiBriefOpen(true);
    try {
      const headers = getAuthHeaders();
      headers["Content-Type"] = "application/json";
      const res = await fetch("/api/ai/market-brief", { method: "POST", headers });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      if (data.brief) {
        setAiBrief(data.brief);
      } else {
        toast({ title: "Failed to generate brief", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to generate brief", variant: "destructive" });
    } finally {
      setAiBriefLoading(false);
    }
  };

  const handleFmdqSync = async () => {
    setSyncingFmdq(true);
    try {
      const headers = getAuthHeaders();
      headers["Content-Type"] = "application/json";
      const res = await fetch("/api/mm/sync-fmdq", { method: "POST", headers });
      const result = await res.json();
      if (result.success) {
        toast({
          title: "FMDQ rates synced",
          description: `${result.recordsInserted} new rate entries stored`,
        });
        invalidateAll();
      } else {
        toast({ title: "FMDQ sync failed", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "FMDQ sync failed", variant: "destructive" });
    } finally {
      setSyncingFmdq(false);
    }
  };

  const handleAddRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    headers["Content-Type"] = "application/json";
    const res = await fetch("/api/mm/rates", {
      method: "POST",
      headers,
      body: JSON.stringify({
        rateType: form.rateType,
        tenor: form.tenor,
        rate: parseFloat(form.rate),
        date: new Date(form.date).toISOString(),
        notes: form.notes || undefined,
      }),
    });
    if (res.ok) {
      toast({ title: "Rate added" });
      invalidateAll();
      setAddDialogOpen(false);
      setForm({ rateType: "NIBOR", tenor: "O/N", rate: "", date: new Date().toISOString().split("T")[0], notes: "" });
    } else {
      const err = await res.json();
      toast({ title: "Failed to add rate", description: err.error, variant: "destructive" });
    }
  };

  const handleDeleteRate = async (id: number) => {
    const headers = getAuthHeaders();
    const res = await fetch(`/api/mm/rates/${id}`, { method: "DELETE", headers });
    if (res.ok) {
      toast({ title: "Rate deleted" });
      invalidateAll();
    } else {
      toast({ title: "Failed to delete rate", variant: "destructive" });
    }
  };

  if (summaryLoading || ratesLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  const fmdqEntries = Object.entries(summary?.fmdq ?? {});

  return (
    <div className="p-6 space-y-6" data-testid="mm-rates-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">NIBOR, OBB, Repo &amp; NTB/OMO Rates</h1>
          <p className="text-sm text-muted-foreground">
            Interbank, open buy-back, repo rates and treasury bill proxies
            {summary?.lastFmdqSync && (
              <span className="ml-2 text-xs">
                Last FMDQ sync: {new Date(summary.lastFmdqSync).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleAiBrief}
            disabled={aiBriefLoading}
            data-testid="button-ai-brief"
          >
            <Sparkles className="w-4 h-4" /> {aiBriefLoading ? "Analyzing..." : "AI Market Brief"}
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" data-testid="button-add-mm-rate">
                <Plus className="w-4 h-4" /> Add Rate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Manual Rate</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddRate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rate Type</Label>
                    <Select value={form.rateType} onValueChange={(v) => setForm({ ...form, rateType: v })}>
                      <SelectTrigger data-testid="select-mm-rate-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NIBOR">NIBOR</SelectItem>
                        <SelectItem value="OBB">OBB</SelectItem>
                        <SelectItem value="REPO">Repo</SelectItem>
                        <SelectItem value="CALL">Call Rate</SelectItem>
                        <SelectItem value="CP">CP Rate</SelectItem>
                        <SelectItem value="MMF_YIELD">MMF Yield</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tenor</Label>
                    <Select value={form.tenor} onValueChange={(v) => setForm({ ...form, tenor: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="O/N">Overnight</SelectItem>
                        <SelectItem value="7DAY">7 Days</SelectItem>
                        <SelectItem value="30DAY">30 Days</SelectItem>
                        <SelectItem value="60DAY">60 Days</SelectItem>
                        <SelectItem value="90DAY">90 Days</SelectItem>
                        <SelectItem value="180DAY">180 Days</SelectItem>
                        <SelectItem value="365DAY">365 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 15.34"
                      value={form.rate}
                      onChange={(e) => setForm({ ...form, rate: e.target.value })}
                      required
                      data-testid="input-mm-rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                      data-testid="input-mm-date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    placeholder="e.g. Bloomberg terminal, dealer quote"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    data-testid="input-mm-notes"
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="button-submit-mm-rate">
                  Add Rate
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleFmdqSync}
            disabled={syncingFmdq}
            data-testid="button-sync-fmdq"
          >
            <RefreshCw className={`w-4 h-4 ${syncingFmdq ? "animate-spin" : ""}`} />
            {syncingFmdq ? "Syncing..." : "Sync FMDQ"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RateCard
          label="NTB 91-Day (Proxy)"
          rate={summary?.proxy?.ntb91?.rate ?? null}
          sublabel={summary?.proxy?.ntb91?.date ? `Auction: ${formatDate(summary.proxy.ntb91.date)}` : "No data"}
          icon={ArrowUpRight}
          highlight
        />
        <RateCard
          label="NTB 182-Day (Proxy)"
          rate={summary?.proxy?.ntb182?.rate ?? null}
          sublabel={summary?.proxy?.ntb182?.date ? `Auction: ${formatDate(summary.proxy.ntb182.date)}` : "No data"}
          icon={ArrowUpRight}
        />
        <RateCard
          label="NTB 364-Day (Proxy)"
          rate={summary?.proxy?.ntb364?.rate ?? null}
          sublabel={summary?.proxy?.ntb364?.date ? `Auction: ${formatDate(summary.proxy.ntb364.date)}` : "No data"}
          icon={ArrowUpRight}
        />
        {fmdqEntries.length > 0 ? (
          fmdqEntries.slice(0, 1).map(([key, entry]) => (
            <RateCard
              key={key}
              label={`FMDQ ${key.replace("_", " ")}`}
              rate={entry.rate}
              sublabel={`Date: ${formatDate(entry.date)}`}
              icon={Building2}
            />
          ))
        ) : (
          <RateCard
            label="FMDQ NIBOR"
            rate={null}
            sublabel="Click Sync FMDQ to fetch"
            icon={Building2}
          />
        )}
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">MM Benchmark — 91-Day NTB</div>
              <div className="text-3xl font-bold font-mono">
                {summary?.proxy?.ntb91?.rate != null ? `${summary.proxy.ntb91.rate.toFixed(2)}%` : "---"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Primary money market proxy rate</div>
            </div>
            <div className="w-px h-12 bg-border hidden md:block" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">FMDQ Rates</div>
              <div className="text-3xl font-bold font-mono">
                {fmdqEntries.length > 0 ? `${fmdqEntries.length} rates` : "Not synced"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">NIBOR, OBB, Repo from FMDQ</div>
            </div>
            <div className="w-px h-12 bg-border hidden md:block" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Manual Entries</div>
              <div className="text-3xl font-bold font-mono">
                {summary?.manual?.length ?? 0} rates
              </div>
              <div className="text-xs text-muted-foreground mt-1">Dealer quotes & Bloomberg data</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {aiBriefOpen && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-primary" /> AI Market Intelligence Brief
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setAiBriefOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {aiBriefLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/6" />
              </div>
            ) : aiBrief ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderMarkdown(aiBrief) }} />
            ) : null}
          </CardContent>
        </Card>
      )}

      <RatesTabs allRates={allRates} geCp={geCp} onDeleteRate={handleDeleteRate} />
    </div>
  );
}
