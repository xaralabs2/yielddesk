import { useState } from "react";
import {
  useListSignals,
  useCreateSignal,
  useGetLatestSignal,
  getListSignalsQueryKey,
  getGetLatestSignalQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Activity, TrendingUp, TrendingDown } from "lucide-react";

function formatPercent(n: number) {
  return `${n.toFixed(2)}%`;
}

export default function SignalsPage() {
  const { data: signals, isLoading } = useListSignals({ limit: 50 });
  const { data: latest } = useGetLatestSignal();
  const createMutation = useCreateSignal();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ cpRate: "", bondYield: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { data: { cpRate: parseFloat(form.cpRate), bondYield: parseFloat(form.bondYield) } },
      {
        onSuccess: () => {
          toast({ title: "Signal submitted" });
          queryClient.invalidateQueries({ queryKey: getListSignalsQueryKey({ limit: 50 }) });
          queryClient.invalidateQueries({ queryKey: getGetLatestSignalQueryKey() });
          setDialogOpen(false);
          setForm({ cpRate: "", bondYield: "" });
        },
        onError: () => {
          toast({ title: "Failed to submit signal", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="signals-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Market Signals</h1>
          <p className="text-sm text-muted-foreground">CP rates and bond yield history</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-signal"><Plus className="w-4 h-4" /> New Signal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Market Signal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>CP Rate (%)</Label>
                <Input type="number" step="0.01" value={form.cpRate} onChange={(e) => setForm({ ...form, cpRate: e.target.value })} required data-testid="input-cp-rate" />
              </div>
              <div className="space-y-2">
                <Label>Bond Yield (%)</Label>
                <Input type="number" step="0.01" value={form.bondYield} onChange={(e) => setForm({ ...form, bondYield: e.target.value })} required data-testid="input-bond-yield" />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-signal">
                Submit Signal
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {latest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-primary" data-testid="card-latest-cp">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
                <TrendingUp className="w-3.5 h-3.5" /> Latest CP Rate
              </div>
              <div className="text-3xl font-bold font-mono">{formatPercent(latest.cpRate)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                <Badge variant={latest.cpRate >= 18 ? "default" : "secondary"} className="text-[10px]">
                  {latest.cpRate >= 18 ? "ABOVE THRESHOLD" : "BELOW THRESHOLD"}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-chart-2" data-testid="card-latest-bond">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
                <TrendingDown className="w-3.5 h-3.5" /> Latest Bond Yield
              </div>
              <div className="text-3xl font-bold font-mono">{formatPercent(latest.bondYield)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                <Badge variant={latest.bondYield >= 17 ? "default" : "secondary"} className="text-[10px]">
                  {latest.bondYield >= 17 ? "ABOVE THRESHOLD" : "BELOW THRESHOLD"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card data-testid="card-signal-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4" /> Signal History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!signals || signals.length === 0) ? (
            <p className="text-sm text-muted-foreground">No signals recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">CP Rate</th>
                    <th className="px-4 py-3">Bond Yield</th>
                    <th className="px-4 py-3">CP Status</th>
                    <th className="px-4 py-3">Bond Status</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50" data-testid={`row-signal-${s.id}`}>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono font-medium">{formatPercent(s.cpRate)}</td>
                      <td className="px-4 py-3 font-mono font-medium">{formatPercent(s.bondYield)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.cpRate >= 18 ? "default" : "outline"} className="text-[10px]">
                          {s.cpRate >= 18 ? "INVEST" : "HOLD"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.bondYield >= 17 ? "default" : "outline"} className="text-[10px]">
                          {s.bondYield >= 17 ? "LOCK" : "HOLD"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
