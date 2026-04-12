import { useState } from "react";
import {
  useListDeals,
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
  useGetDeal,
  getListDealsQueryKey,
  getGetDealQueryKey,
} from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, LineChart, Target, Pencil, Trash2, Landmark } from "lucide-react";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

interface GeToken {
  _id: string;
  name: string;
  symbol: string;
  image: string;
  currency: string;
  country: string;
  type: string;
  investment_type: string;
  investment_category?: string;
  payout_frequency?: string;
  interest: number;
  tenor: number;
  maturity: string | null;
  raise_amount: number;
  total_raised: number;
  supply: number;
  price: { buy: number; sell: number; exchange: number };
  min_trade: { buy: number; sell: number };
  max_trade: { buy: number; sell: number };
  valuation: number;
  discount: number;
  dividend: number;
  risk: string;
  rating: string;
  custodian: string;
  carry: number;
  management_fee: number;
  milestone: number;
  completed_raise: boolean;
  closed: boolean;
  secondaries: boolean;
  exited: boolean;
  createdAt: string;
}

interface GeDealsData {
  configured: boolean;
  deals: GeToken[];
}

function useGeDeals() {
  return useQuery<GeDealsData>({
    queryKey: ["/api/mm/getequity-deals"],
    queryFn: async () => {
      const res = await fetch("/api/mm/getequity-deals", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch GetEquity deals");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "---";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

type DealForm = {
  issuer: string;
  rate: string;
  tenorDays: string;
  minAmount: string;
  riskLevel: string;
};

const emptyForm: DealForm = { issuer: "", rate: "", tenorDays: "", minAmount: "", riskLevel: "LOW" };

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

function DealFormFields({
  form,
  setForm,
  testIdPrefix,
}: {
  form: DealForm;
  setForm: (f: DealForm) => void;
  testIdPrefix: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Issuer</Label>
        <Input value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} required data-testid={`${testIdPrefix}-issuer`} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Rate (%)</Label>
          <Input type="number" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} required data-testid={`${testIdPrefix}-rate`} />
        </div>
        <div className="space-y-2">
          <Label>Tenor (days)</Label>
          <Input type="number" value={form.tenorDays} onChange={(e) => setForm({ ...form, tenorDays: e.target.value })} required data-testid={`${testIdPrefix}-tenor`} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Min Amount</Label>
          <Input type="number" step="0.01" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} required data-testid={`${testIdPrefix}-min`} />
        </div>
        <div className="space-y-2">
          <Label>Risk Level</Label>
          <Select value={form.riskLevel} onValueChange={(v) => setForm({ ...form, riskLevel: v })}>
            <SelectTrigger data-testid={`${testIdPrefix}-risk`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
}

function DealScoreCard({ dealId }: { dealId: number }) {
  const { data, isLoading } = useGetDeal(dealId, {
    query: { enabled: !!dealId, queryKey: getGetDealQueryKey(dealId) },
  });

  if (isLoading) return <Skeleton className="h-24" />;
  if (!data) return null;

  const { score } = data;
  const recColors: Record<string, string> = {
    INVEST: "bg-success/10 text-success border-success/30",
    HOLD: "bg-warning/10 text-warning border-warning/30",
    PASS: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-card" data-testid={`deal-score-${dealId}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Score: {score.score}/20</span>
        </div>
        <Badge variant="outline" className={recColors[score.recommendation] || ""}>{score.recommendation}</Badge>
      </div>
      <div className="space-y-2">
        {Object.entries(score.factors).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-32 capitalize">{key.replace("Score", "")}</span>
            <Progress value={(val as number / 5) * 100} className="h-1.5 flex-1" />
            <span className="text-xs font-mono w-8 text-right">{val as number}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GetEquityDealRoom() {
  const { data: geDeals, isLoading } = useGeDeals();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (geDeals && !geDeals.configured) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p className="text-sm font-medium">GetEquity API not configured</p>
          <p className="text-xs mt-1">Add your GETEQUITY_API_KEY to environment secrets to access the deal room.</p>
        </CardContent>
      </Card>
    );
  }

  if ((geDeals?.deals ?? []).length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">No deals available.</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {(geDeals?.deals ?? []).map((d) => {
        const raisePct = d.raise_amount > 0 ? Math.min(100, (d.total_raised / d.raise_amount) * 100) : 0;
        const isOpen = !d.completed_raise && !d.closed && !d.exited;
        const riskColor = d.risk === "Low" ? "text-emerald-500" : d.risk === "Medium" ? "text-yellow-500" : d.risk === "High" ? "text-red-500" : "text-muted-foreground";
        return (
          <Card key={d._id} className="flex flex-col border">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                {d.image && <img src={d.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm leading-tight line-clamp-2">{d.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{d.symbol}</span>
                    {isOpen ? (
                      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Open</Badge>
                    ) : d.exited ? (
                      <Badge variant="secondary" className="text-[10px]">Exited</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Closed</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="font-medium">{d.investment_category || d.investment_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Risk</span>
                  <p className={`font-medium ${riskColor}`}>{d.risk || "---"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Interest</span>
                  <p className="font-mono font-semibold text-emerald-500">{d.interest > 0 ? `${d.interest}%` : "---"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tenor</span>
                  <p className="font-mono">{d.tenor > 0 ? `${d.tenor} days` : "---"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Price</span>
                  <p className="font-mono">₦{d.price.buy > 0 ? d.price.buy.toLocaleString() : "---"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Maturity</span>
                  <p className="font-mono">{d.maturity ? formatDate(d.maturity) : "---"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Min. Investment</span>
                  <p className="font-mono">₦{d.min_trade?.buy > 0 ? d.min_trade.buy.toLocaleString() : "---"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payout</span>
                  <p>{d.payout_frequency || "---"}</p>
                </div>
                {d.rating && d.rating !== "-" && (
                  <div>
                    <span className="text-muted-foreground">Rating</span>
                    <p className="font-medium">{d.rating}</p>
                  </div>
                )}
                {d.custodian && d.custodian !== "-" && d.custodian !== "undefined" && (
                  <div>
                    <span className="text-muted-foreground">Custodian</span>
                    <p className="truncate">{d.custodian}</p>
                  </div>
                )}
                {d.dividend > 0 && (
                  <div>
                    <span className="text-muted-foreground">Dividend</span>
                    <p className="font-mono">{d.dividend}%</p>
                  </div>
                )}
                {d.management_fee > 0 && (
                  <div>
                    <span className="text-muted-foreground">Mgmt Fee</span>
                    <p className="font-mono">{d.management_fee}%</p>
                  </div>
                )}
              </div>
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Raise Progress</span>
                  <span className="font-mono">{raisePct.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(raisePct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>₦{d.total_raised.toLocaleString()}</span>
                  <span>₦{d.raise_amount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function DealsPage() {
  const { data: deals, isLoading } = useListDeals();
  const createMutation = useCreateDeal();
  const updateMutation = useUpdateDeal();
  const deleteMutation = useDeleteDeal();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expandedDeal, setExpandedDeal] = useState<number | null>(null);
  const [editingDealId, setEditingDealId] = useState<number | null>(null);
  const [deletingDealId, setDeletingDealId] = useState<number | null>(null);
  const [form, setForm] = useState<DealForm>(emptyForm);
  const [editForm, setEditForm] = useState<DealForm>(emptyForm);

  const invalidateDeals = () => {
    queryClient.invalidateQueries({ queryKey: getListDealsQueryKey() });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        data: {
          issuer: form.issuer,
          rate: parseFloat(form.rate),
          tenorDays: parseInt(form.tenorDays),
          minAmount: parseFloat(form.minAmount),
          riskLevel: form.riskLevel as "LOW" | "MEDIUM" | "HIGH",
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Deal created" });
          invalidateDeals();
          setDialogOpen(false);
          setForm(emptyForm);
        },
        onError: () => {
          toast({ title: "Failed to create deal", variant: "destructive" });
        },
      }
    );
  };

  const openEdit = (deal: { id: number; issuer: string; rate: number; tenorDays: number; minAmount: number; riskLevel: string }) => {
    setEditingDealId(deal.id);
    setEditForm({
      issuer: deal.issuer,
      rate: String(deal.rate),
      tenorDays: String(deal.tenorDays),
      minAmount: String(deal.minAmount),
      riskLevel: deal.riskLevel,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDealId) return;
    updateMutation.mutate(
      {
        id: editingDealId,
        data: {
          issuer: editForm.issuer,
          rate: parseFloat(editForm.rate),
          tenorDays: parseInt(editForm.tenorDays),
          minAmount: parseFloat(editForm.minAmount),
          riskLevel: editForm.riskLevel as "LOW" | "MEDIUM" | "HIGH",
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Deal updated" });
          invalidateDeals();
          if (editingDealId) {
            queryClient.invalidateQueries({ queryKey: getGetDealQueryKey(editingDealId) });
          }
          setEditDialogOpen(false);
          setEditingDealId(null);
        },
        onError: () => {
          toast({ title: "Failed to update deal", variant: "destructive" });
        },
      }
    );
  };

  const openDelete = (dealId: number) => {
    setDeletingDealId(dealId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deletingDealId) return;
    deleteMutation.mutate(
      { id: deletingDealId },
      {
        onSuccess: () => {
          toast({ title: "Deal deleted" });
          invalidateDeals();
          setDeleteDialogOpen(false);
          setDeletingDealId(null);
          if (expandedDeal === deletingDealId) setExpandedDeal(null);
        },
        onError: () => {
          toast({ title: "Failed to delete deal", variant: "destructive" });
        },
      }
    );
  };

  const riskColors: Record<string, string> = {
    LOW: "border-success/30 text-success",
    MEDIUM: "border-warning/30 text-warning",
    HIGH: "border-destructive/30 text-destructive",
  };

  const deletingDeal = deals?.find((d) => d.id === deletingDealId);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="deals-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="text-sm text-muted-foreground">Investment opportunities, scoring, and GetEquity deal discovery</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-deal"><Plus className="w-4 h-4" /> New Deal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Deal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <DealFormFields form={form} setForm={setForm} testIdPrefix="input-deal" />
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-deal">
                Create Deal
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <DealFormFields form={editForm} setForm={setEditForm} testIdPrefix="input-edit-deal" />
            <Button type="submit" className="w-full" disabled={updateMutation.isPending} data-testid="button-save-deal">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the deal from <span className="font-medium text-foreground">{deletingDeal?.issuer}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="your-deals" data-testid="tabs-deals">
        <TabsList>
          <TabsTrigger value="your-deals">Your Deals</TabsTrigger>
          <TabsTrigger value="deal-room">
            <Landmark className="w-3.5 h-3.5 mr-1.5" /> GetEquity Deal Room
          </TabsTrigger>
        </TabsList>

        <TabsContent value="your-deals">
          {(!deals || deals.length === 0) ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <LineChart className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No deals available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {deals.map((deal) => (
                <Card key={deal.id} className="hover:border-primary/30 transition-colors" data-testid={`card-deal-${deal.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{deal.issuer}</span>
                        <Badge variant="outline" className={`text-xs ${riskColors[deal.riskLevel] || ""}`}>{deal.riskLevel}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEdit(deal)}
                          data-testid={`button-edit-${deal.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => openDelete(deal.id)}
                          data-testid={`button-delete-${deal.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs ml-1"
                          onClick={() => setExpandedDeal(expandedDeal === deal.id ? null : deal.id)}
                          data-testid={`button-score-${deal.id}`}
                        >
                          <Target className="w-3 h-3" /> {expandedDeal === deal.id ? "Hide" : "Score"}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block">Rate</span>
                        <span className="font-mono font-medium">{deal.rate}%</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Tenor</span>
                        <span className="font-mono">{deal.tenorDays} days</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Min Amount</span>
                        <span className="font-mono">{formatCurrency(deal.minAmount)}</span>
                      </div>
                    </div>
                    {expandedDeal === deal.id && (
                      <div className="mt-4">
                        <DealScoreCard dealId={deal.id} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deal-room">
          <GetEquityDealRoom />
        </TabsContent>
      </Tabs>
    </div>
  );
}
