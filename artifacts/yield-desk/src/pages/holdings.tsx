import { useState } from "react";
import {
  useListHoldings,
  useCreateHolding,
  useUpdateHolding,
  useDeleteHolding,
  getListHoldingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, WalletCards } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

interface HoldingFormData {
  type: string;
  amount: string;
  rate: string;
  issuer: string;
  startDate: string;
  maturityDate: string;
  status: string;
}

const emptyForm: HoldingFormData = {
  type: "CP",
  amount: "",
  rate: "",
  issuer: "",
  startDate: new Date().toISOString().split("T")[0],
  maturityDate: "",
  status: "ACTIVE",
};

export default function HoldingsPage() {
  const { data: holdings, isLoading } = useListHoldings();
  const createMutation = useCreateHolding();
  const updateMutation = useUpdateHolding();
  const deleteMutation = useDeleteHolding();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<HoldingFormData>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListHoldingsQueryKey() });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      type: form.type as "CP" | "BOND" | "MMMF" | "STOCK",
      amount: parseFloat(form.amount),
      rate: parseFloat(form.rate),
      issuer: form.issuer,
      startDate: new Date(form.startDate).toISOString(),
      maturityDate: form.maturityDate ? new Date(form.maturityDate).toISOString() : null,
      status: form.status as "ACTIVE" | "MATURED" | "SOLD",
    };

    if (editingId !== null) {
      updateMutation.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Holding updated" });
            invalidate();
            setDialogOpen(false);
            setEditingId(null);
            setForm(emptyForm);
          },
          onError: () => {
            toast({ title: "Failed to update holding", variant: "destructive" });
          },
        }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: "Holding created" });
            invalidate();
            setDialogOpen(false);
            setForm(emptyForm);
          },
          onError: () => {
            toast({ title: "Failed to create holding", variant: "destructive" });
          },
        }
      );
    }
  };

  const handleEdit = (holding: any) => {
    setForm({
      type: holding.type,
      amount: String(holding.amount),
      rate: String(holding.rate),
      issuer: holding.issuer,
      startDate: new Date(holding.startDate).toISOString().split("T")[0],
      maturityDate: holding.maturityDate ? new Date(holding.maturityDate).toISOString().split("T")[0] : "",
      status: holding.status,
    });
    setEditingId(holding.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Holding deleted" });
          invalidate();
        },
        onError: () => {
          toast({ title: "Failed to delete holding", variant: "destructive" });
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
    <div className="p-6 space-y-6" data-testid="holdings-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Holdings</h1>
          <p className="text-sm text-muted-foreground">Manage your portfolio positions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-holding">
              <Plus className="w-4 h-4" /> Add Holding
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Holding" : "New Holding"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger data-testid="select-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CP">Commercial Paper</SelectItem>
                      <SelectItem value="BOND">Bond</SelectItem>
                      <SelectItem value="MMMF">Money Market</SelectItem>
                      <SelectItem value="STOCK">Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="MATURED">Matured</SelectItem>
                      <SelectItem value="SOLD">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Issuer</Label>
                <Input value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} required data-testid="input-issuer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required data-testid="input-amount" />
                </div>
                <div className="space-y-2">
                  <Label>Rate (%)</Label>
                  <Input type="number" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} required data-testid="input-rate" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required data-testid="input-start-date" />
                </div>
                <div className="space-y-2">
                  <Label>Maturity Date</Label>
                  <Input type="date" value={form.maturityDate} onChange={(e) => setForm({ ...form, maturityDate: e.target.value })} data-testid="input-maturity-date" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-holding">
                {editingId ? "Update" : "Create"} Holding
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {(!holdings || holdings.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <WalletCards className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No holdings yet. Add your first position.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Issuer</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Rate</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Days Left</th>
                    <th className="px-4 py-3">Maturity Value</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr key={h.id} className="border-b last:border-0 hover:bg-muted/50" data-testid={`row-holding-${h.id}`}>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-xs font-mono">{h.type}</Badge></td>
                      <td className="px-4 py-3 font-medium">{h.issuer}</td>
                      <td className="px-4 py-3 font-mono">{formatCurrency(h.amount)}</td>
                      <td className="px-4 py-3 font-mono">{h.rate}%</td>
                      <td className="px-4 py-3">
                        <Badge variant={h.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">{h.status}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {h.daysRemaining != null ? (
                          <span className={h.daysRemaining <= 7 ? "text-destructive font-medium" : ""}>{h.daysRemaining}d</span>
                        ) : "---"}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {h.expectedMaturityValue != null ? formatCurrency(h.expectedMaturityValue) : "---"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(h)} data-testid={`button-edit-${h.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(h.id)} data-testid={`button-delete-${h.id}`}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
