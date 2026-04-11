import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Plus, Trash2, TrendingUp, Building2, PenLine, ArrowUpRight } from "lucide-react";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

interface MmRate {
  id: number;
  source: string;
  rateType: string;
  tenor: string;
  rate: number;
  date: string;
  notes: string | null;
  createdAt: string;
}

interface ProxyRate {
  id: number;
  source: string;
  rateType: string;
  tenor: string;
  rate: number | null;
  date: string;
  notes: string;
  createdAt: string;
}

interface MmSummary {
  proxy: {
    ntb91: { rate: number; date: string } | null;
    ntb182: { rate: number; date: string } | null;
    ntb364: { rate: number; date: string } | null;
  };
  fmdq: Record<string, { rate: number; date: string; tenor: string }>;
  manual: MmRate[];
  lastFmdqSync: string | null;
}

interface MmRatesData {
  fmdq: MmRate[];
  manual: MmRate[];
  proxy: ProxyRate[];
}

function useMmSummary() {
  return useQuery<MmSummary>({
    queryKey: ["/api/mm/summary"],
    queryFn: async () => {
      const res = await fetch("/api/mm/summary", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch MM summary");
      return res.json();
    },
  });
}

function useMmRates() {
  return useQuery<MmRatesData>({
    queryKey: ["/api/mm/rates"],
    queryFn: async () => {
      const res = await fetch("/api/mm/rates", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch MM rates");
      return res.json();
    },
  });
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "---";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
  const { data: summary, isLoading: summaryLoading } = useMmSummary();
  const { data: allRates, isLoading: ratesLoading } = useMmRates();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [syncingFmdq, setSyncingFmdq] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
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

      <Tabs defaultValue="proxy" data-testid="tabs-mm-rates">
        <TabsList>
          <TabsTrigger value="proxy">NTB/OMO Proxies</TabsTrigger>
          <TabsTrigger value="fmdq">FMDQ Rates</TabsTrigger>
          <TabsTrigger value="manual">Manual Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="proxy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowUpRight className="w-4 h-4" /> NTB &amp; OMO Rates (MM Proxy)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Tenor</th>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(allRates?.proxy ?? []).map((r) => (
                      <tr key={`proxy-${r.id}`} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{r.rateType}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{r.tenor}</td>
                        <td className="px-4 py-3 font-mono font-medium">
                          {r.rate != null ? `${r.rate.toFixed(2)}%` : "---"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(r.date)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{r.notes}</td>
                      </tr>
                    ))}
                    {(allRates?.proxy ?? []).length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No proxy data available. Sync CBN data first.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fmdq">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="w-4 h-4" /> FMDQ Market Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-3">Rate Type</th>
                      <th className="px-4 py-3">Tenor</th>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(allRates?.fmdq ?? []).map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{r.rateType}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{r.tenor}</td>
                        <td className="px-4 py-3 font-mono font-medium">{r.rate.toFixed(2)}%</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(r.date)}</td>
                      </tr>
                    ))}
                    {(allRates?.fmdq ?? []).length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No FMDQ data. Click "Sync FMDQ" to fetch rates.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PenLine className="w-4 h-4" /> Manual Rate Entries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-3">Rate Type</th>
                      <th className="px-4 py-3">Tenor</th>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Notes</th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(allRates?.manual ?? []).map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{r.rateType}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{r.tenor}</td>
                        <td className="px-4 py-3 font-mono font-medium">{r.rate.toFixed(2)}%</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(r.date)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{r.notes || "---"}</td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteRate(r.id)}
                            data-testid={`button-delete-mm-${r.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {(allRates?.manual ?? []).length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No manual entries. Click "Add Rate" to enter dealer quotes.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
