import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, Fragment } from "react";
import { apiRequest, getAuthToken } from "@/lib/api-helpers";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Plus,
  Trash2,
  Shield,
  Target,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Wallet,
  Upload,
  FileText,
  Check,
  Loader2,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type PortfolioDashboard = {
  totalValue: number;
  baselineValue: number;
  targetValue: number;
  nominalReturn: number;
  realReturn: number;
  currentInflation: number;
  pillars: PillarSummary[];
  alerts: RebalanceAlert[];
  holdings: any[];
  config: {
    stabilityTarget: number;
    inflationTarget: number;
    strategicTarget: number;
    tolerance: number;
  };
  availableCash: number;
  totalCommissions: number;
  totalFees: number;
  totalTaxes: number;
  fxRate: number;
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

type EtfAllocationData = {
  regime: {
    name: string;
    color: "GREEN" | "YELLOW" | "ORANGE" | "RED" | "GREY";
    confidence: number;
    summary: string;
  };
  etfSignals: { symbol: string; name: string; signal: "BUY" | "HOLD" | "SELL"; confidence: number; reasoning: string; role: string; regime: string }[];
  etfPrices: { symbol: string; price: number; change1d: number }[];
  factorSignals: { factorType: string; signal: string; confidence: number; reasoning: string; symbol: string }[];
  lastUpdated: string | null;
};

const PILLAR_COLORS: Record<string, string> = {
  Stability: "bg-teal-500",
  "Inflation Hedge": "bg-emerald-500",
  Strategic: "bg-amber-500",
};

const PILLAR_TEXT_COLORS: Record<string, string> = {
  Stability: "text-teal-500",
  "Inflation Hedge": "text-emerald-500",
  Strategic: "text-amber-500",
};

const PILLAR_KEYS: Record<string, string> = {
  STABILITY: "Stability",
  INFLATION: "Inflation Hedge",
  STRATEGIC: "Strategic",
};

function PortfolioSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

function formatNgn(value: number): string {
  return `\u20A6${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `\u20A6${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `\u20A6${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `\u20A6${(value / 1_000).toFixed(2)}K`;
  return formatNgn(value);
}

function PillarGauge({ pillar, totalValue, tolerance, targetValue }: { pillar: PillarSummary; totalValue: number; tolerance: number; targetValue: number }) {
  const targetPct = (pillar.target * 100).toFixed(0);
  const barColor = PILLAR_COLORS[pillar.pillar] || "bg-primary";
  const pillarGoal = targetValue > 0 ? targetValue * pillar.target : 0;
  const pillarProgress = pillarGoal > 0 ? (pillar.value / pillarGoal) * 100 : 0;
  const pillarGap = Math.max(pillarGoal - pillar.value, 0);
  const slug = pillar.pillar.toLowerCase().replace(/\s+/g, "-");

  const consolidated = pillar.holdings.reduce<Record<string, number>>((acc, h) => {
    acc[h.asset] = (acc[h.asset] || 0) + h.value;
    return acc;
  }, {});
  const sortedHoldings = Object.entries(consolidated).sort((a, b) => b[1] - a[1]);

  return (
    <Card data-testid={`pillar-card-${slug}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 p-4">
        <div className="flex items-center gap-2">
          <div className={cn("h-2.5 w-2.5 rounded-full", barColor)} />
          <h3 className="text-sm font-bold" data-testid={`text-pillar-name-${slug}`}>
            {pillar.pillar}
          </h3>
        </div>
        <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-mono" data-testid={`badge-target-${slug}`}>
          {targetPct}% of Goal
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xl font-bold font-mono tabular-nums" data-testid={`text-pillar-value-${slug}`}>
            {formatNgn(pillar.value)}
          </span>
          {pillarGoal > 0 && (
            <span className="text-xs font-mono tabular-nums text-muted-foreground" data-testid={`text-pillar-of-goal-${slug}`}>
              of {formatCompact(pillarGoal)}
            </span>
          )}
        </div>

        {pillarGoal > 0 && (
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${Math.min(pillarProgress, 100)}%` }}
            />
          </div>
        )}
        {!pillarGoal && (
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${Math.min(pillar.weight / Math.max(pillar.target * 2, 0.01) * 100, 100)}%` }}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-mono tabular-nums font-semibold text-right text-primary" data-testid={`text-pillar-progress-${slug}`}>
            {pillarGoal > 0 ? `${pillarProgress.toFixed(2)}%` : `${(pillar.weight * 100).toFixed(2)}%`}
          </span>
          <span className="text-muted-foreground">Gap to Goal</span>
          <span className="font-mono tabular-nums text-right text-muted-foreground" data-testid={`text-pillar-gap-${slug}`}>
            {pillarGoal > 0 ? formatCompact(pillarGap) : "-"}
          </span>
        </div>

        {sortedHoldings.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border/50">
            {sortedHoldings.map(([asset, value]) => (
              <div key={asset} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate mr-2">{asset}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono tabular-nums text-foreground">{formatNgn(value)}</span>
                  {pillarGoal > 0 && (
                    <span className="font-mono tabular-nums text-muted-foreground text-[10px] w-12 text-right">
                      {(value / pillarGoal * 100).toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddHoldingDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [asset, setAsset] = useState("");
  const [ticker, setTicker] = useState("");
  const [pillar, setPillar] = useState("");
  const [valueNgn, setValueNgn] = useState("");
  const [shares, setShares] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [annualRentNgn, setAnnualRentNgn] = useState("");
  const [corridor, setCorridor] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const { toast } = useToast();

  const isEquityPillar = pillar === "STABILITY" || pillar === "INFLATION";
  const isStrategic = pillar === "STRATEGIC";
  const hasSharesEntry = isEquityPillar && shares && costPrice && !isNaN(parseFloat(shares)) && !isNaN(parseFloat(costPrice));
  const hasCostBasis = isStrategic && costPrice && !isNaN(parseFloat(costPrice)) && parseFloat(costPrice) > 0;
  const computedValue = hasSharesEntry
    ? (parseFloat(shares) * parseFloat(costPrice)).toFixed(2)
    : "";

  const addMutation = useMutation({
    mutationFn: async () => {
      const finalValue = hasSharesEntry
        ? parseFloat(shares) * parseFloat(costPrice)
        : parseFloat(valueNgn);
      const payload: any = {
        asset,
        ticker: ticker || null,
        pillar,
        valueNgn: finalValue,
        annualRentNgn: pillar === "STRATEGIC" && annualRentNgn ? parseFloat(annualRentNgn) : null,
        corridor: pillar === "STRATEGIC" && corridor ? corridor : null,
        entryDate: pillar === "STRATEGIC" && entryDate ? entryDate : null,
      };
      if (hasSharesEntry) {
        payload.shares = parseFloat(shares);
        payload.entryValueNgn = finalValue;
      }
      if (hasCostBasis) {
        payload.entryValueNgn = parseFloat(costPrice);
      }
      return apiRequest("POST", "/api/portfolio/holdings", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({ title: "Holding added" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to add holding", variant: "destructive" });
    },
  });

  const isValid = asset.trim() && pillar && (
    hasSharesEntry
      ? (parseFloat(shares) > 0 && parseFloat(costPrice) > 0)
      : (valueNgn && !isNaN(parseFloat(valueNgn)) && parseFloat(valueNgn) > 0)
  );
  const effectiveValue = hasSharesEntry && computedValue ? computedValue : valueNgn;
  const rentalYield = effectiveValue && annualRentNgn && parseFloat(effectiveValue) > 0
    ? ((parseFloat(annualRentNgn) / parseFloat(effectiveValue)) * 100).toFixed(2)
    : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="asset-name">Asset Name</Label>
        <Input id="asset-name" placeholder="e.g. Money Market Fund" value={asset} onChange={(e) => setAsset(e.target.value)} data-testid="input-asset-name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="asset-ticker">Ticker {isEquityPillar ? "" : "(optional)"}</Label>
        <Input id="asset-ticker" placeholder="e.g. GTCO" value={ticker} onChange={(e) => setTicker(e.target.value)} data-testid="input-asset-ticker" />
      </div>
      <div className="space-y-2">
        <Label>Wealth Pillar</Label>
        <Select value={pillar} onValueChange={setPillar}>
          <SelectTrigger data-testid="select-pillar"><SelectValue placeholder="Select pillar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="STABILITY">Stability (Cash / MMF / Short duration)</SelectItem>
            <SelectItem value="INFLATION">Inflation Hedge (Banks / Cement / Equities)</SelectItem>
            <SelectItem value="STRATEGIC">Strategic (Property / SPVs / Private deals)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isEquityPillar && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="asset-shares">Number of Shares (optional)</Label>
              <Input id="asset-shares" type="number" placeholder="e.g. 5000" value={shares} onChange={(e) => setShares(e.target.value)} data-testid="input-asset-shares" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-cost-price">Cost Price / Share (optional)</Label>
              <Input id="asset-cost-price" type="number" step="0.01" placeholder="e.g. 28.50" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} data-testid="input-cost-price" />
            </div>
          </div>
          {computedValue && (
            <div className="rounded-md bg-muted/50 p-3 border border-border/50">
              <span className="text-xs text-muted-foreground">Total Cost Value</span>
              <p className="font-mono tabular-nums text-foreground font-semibold" data-testid="text-computed-value">{formatNgn(parseFloat(computedValue))}</p>
              <span className="text-[10px] text-muted-foreground">{parseFloat(shares).toLocaleString()} shares × {formatNgn(parseFloat(costPrice))}</span>
            </div>
          )}
        </>
      )}
      {!hasSharesEntry && (
        <div className="space-y-2">
          <Label htmlFor="asset-value">Value (NGN)</Label>
          <Input id="asset-value" type="number" placeholder="e.g. 3000000" value={valueNgn} onChange={(e) => setValueNgn(e.target.value)} data-testid="input-asset-value" />
          {isEquityPillar && <p className="text-[10px] text-muted-foreground">For cash/MMF instruments without share pricing, enter value directly.</p>}
        </div>
      )}
      {isStrategic && (
        <>
          <div className="space-y-2">
            <Label htmlFor="asset-cost-price-strategic">Cost Price / Acquisition Cost (NGN, optional)</Label>
            <Input id="asset-cost-price-strategic" type="number" step="0.01" placeholder="e.g. 25000000" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} data-testid="input-strategic-cost-price" />
            <p className="text-[10px] text-muted-foreground">Original purchase price — used for capital gain/loss tracking</p>
          </div>
          {hasCostBasis && valueNgn && parseFloat(valueNgn) > 0 && (
            <div className="rounded-md bg-muted/50 p-3 border border-border/50">
              <span className="text-xs text-muted-foreground">Unrealised Gain/Loss</span>
              <p className={`font-mono tabular-nums font-semibold ${parseFloat(valueNgn) - parseFloat(costPrice) >= 0 ? "text-green-500" : "text-red-500"}`} data-testid="text-strategic-gain-loss">
                {formatNgn(parseFloat(valueNgn) - parseFloat(costPrice))} ({((parseFloat(valueNgn) - parseFloat(costPrice)) / parseFloat(costPrice) * 100).toFixed(1)}%)
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="asset-corridor">Corridor (optional)</Label>
            <Select value={corridor} onValueChange={setCorridor}>
              <SelectTrigger data-testid="select-corridor"><SelectValue placeholder="Select corridor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Lekki Phase 1">Lekki Phase 1</SelectItem>
                <SelectItem value="Ibeju Lekki">Ibeju Lekki</SelectItem>
                <SelectItem value="Victoria Island">Victoria Island</SelectItem>
                <SelectItem value="Ikoyi">Ikoyi</SelectItem>
                <SelectItem value="Eko Atlantic">Eko Atlantic</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset-entry-date">Acquisition Date (optional)</Label>
            <Input id="asset-entry-date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} data-testid="input-entry-date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset-rent">Annual Rent (NGN, optional)</Label>
            <Input id="asset-rent" type="number" placeholder="e.g. 6000000" value={annualRentNgn} onChange={(e) => setAnnualRentNgn(e.target.value)} data-testid="input-annual-rent" />
            {rentalYield && (
              <p className="text-xs text-teal-400 font-mono" data-testid="text-rental-yield-preview">Implied yield: {rentalYield}%</p>
            )}
          </div>
        </>
      )}
      <Button className="w-full" onClick={() => addMutation.mutate()} disabled={!isValid || addMutation.isPending} data-testid="button-add-holding">
        {addMutation.isPending ? "Adding..." : "Add Holding"}
      </Button>
    </div>
  );
}

function EditHoldingDialog({ holding, onClose }: { holding: { id: number; asset: string; ticker: string | null; pillar: string; valueNgn: number; shares: number; entryValueNgn?: number | null; annualRentNgn?: number | null; corridor?: string | null; entryDate?: string | null; cumulativeRentNgn?: number | null }; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [asset, setAsset] = useState(holding.asset);
  const [ticker, setTicker] = useState(holding.ticker || "");
  const [pillar, setPillar] = useState(holding.pillar);
  const [valueNgn, setValueNgn] = useState(holding.valueNgn.toString());
  const [shares, setShares] = useState(holding.shares ? holding.shares.toString() : "");
  const [costPrice, setCostPrice] = useState(holding.entryValueNgn ? holding.entryValueNgn.toString() : "");
  const [annualRentNgn, setAnnualRentNgn] = useState(holding.annualRentNgn ? holding.annualRentNgn.toString() : "");
  const [corridor, setCorridor] = useState(holding.corridor || "");
  const [entryDate, setEntryDate] = useState(holding.entryDate ? holding.entryDate.split("T")[0] : "");
  const { toast } = useToast();

  const editMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        asset,
        ticker: ticker || null,
        pillar,
        valueNgn: parseFloat(valueNgn),
        shares: shares ? parseFloat(shares) : null,
        annualRentNgn: pillar === "STRATEGIC" && annualRentNgn ? parseFloat(annualRentNgn) : null,
        corridor: pillar === "STRATEGIC" && corridor ? corridor : null,
        entryDate: pillar === "STRATEGIC" && entryDate ? entryDate : null,
      };
      if (pillar === "STRATEGIC" && costPrice && !isNaN(parseFloat(costPrice)) && parseFloat(costPrice) > 0) {
        payload.entryValueNgn = parseFloat(costPrice);
      }
      return apiRequest("PATCH", `/api/portfolio/holdings/${holding.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({ title: "Holding updated" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update holding", variant: "destructive" });
    },
  });

  const isValid = asset.trim() && pillar && valueNgn && !isNaN(parseFloat(valueNgn)) && parseFloat(valueNgn) > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-asset-name">Asset Name</Label>
        <Input id="edit-asset-name" placeholder="e.g. Money Market Fund" value={asset} onChange={(e) => setAsset(e.target.value)} data-testid="input-edit-asset-name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-asset-ticker">Ticker (optional)</Label>
        <Input id="edit-asset-ticker" placeholder="e.g. GTCO" value={ticker} onChange={(e) => setTicker(e.target.value)} data-testid="input-edit-asset-ticker" />
      </div>
      <div className="space-y-2">
        <Label>Wealth Pillar</Label>
        <Select value={pillar} onValueChange={setPillar}>
          <SelectTrigger data-testid="select-edit-pillar"><SelectValue placeholder="Select pillar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="STABILITY">Stability (Cash / MMF / Short duration)</SelectItem>
            <SelectItem value="INFLATION">Inflation Hedge (Banks / Cement / Equities)</SelectItem>
            <SelectItem value="STRATEGIC">Strategic (Property / SPVs / Private deals)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="edit-asset-value">Value (NGN)</Label>
          <Input id="edit-asset-value" type="number" placeholder="e.g. 3000000" value={valueNgn} onChange={(e) => setValueNgn(e.target.value)} data-testid="input-edit-asset-value" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-asset-shares">Shares / Units (optional)</Label>
          <Input id="edit-asset-shares" type="number" placeholder="e.g. 500" value={shares} onChange={(e) => setShares(e.target.value)} data-testid="input-edit-asset-shares" />
        </div>
      </div>
      {pillar === "STRATEGIC" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="edit-asset-cost-price-strategic">Cost Price / Acquisition Cost (NGN, optional)</Label>
            <Input id="edit-asset-cost-price-strategic" type="number" step="0.01" placeholder="e.g. 25000000" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} data-testid="input-edit-strategic-cost-price" />
            <p className="text-[10px] text-muted-foreground">Original purchase price — used for capital gain/loss tracking</p>
          </div>
          {costPrice && parseFloat(costPrice) > 0 && valueNgn && parseFloat(valueNgn) > 0 && (
            <div className="rounded-md bg-muted/50 p-3 border border-border/50">
              <span className="text-xs text-muted-foreground">Unrealised Gain/Loss</span>
              <p className={`font-mono tabular-nums font-semibold ${parseFloat(valueNgn) - parseFloat(costPrice) >= 0 ? "text-green-500" : "text-red-500"}`} data-testid="text-edit-strategic-gain-loss">
                {formatNgn(parseFloat(valueNgn) - parseFloat(costPrice))} ({((parseFloat(valueNgn) - parseFloat(costPrice)) / parseFloat(costPrice) * 100).toFixed(1)}%)
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-asset-corridor">Corridor (optional)</Label>
            <Select value={corridor} onValueChange={setCorridor}>
              <SelectTrigger data-testid="select-edit-corridor"><SelectValue placeholder="Select corridor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Lekki Phase 1">Lekki Phase 1</SelectItem>
                <SelectItem value="Ibeju Lekki">Ibeju Lekki</SelectItem>
                <SelectItem value="Victoria Island">Victoria Island</SelectItem>
                <SelectItem value="Ikoyi">Ikoyi</SelectItem>
                <SelectItem value="Eko Atlantic">Eko Atlantic</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-asset-entry-date">Acquisition Date (optional)</Label>
            <Input id="edit-asset-entry-date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} data-testid="input-edit-entry-date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-asset-rent">Annual Rent (NGN, optional)</Label>
            <Input id="edit-asset-rent" type="number" placeholder="e.g. 6000000" value={annualRentNgn} onChange={(e) => setAnnualRentNgn(e.target.value)} data-testid="input-edit-annual-rent" />
            {valueNgn && annualRentNgn && parseFloat(valueNgn) > 0 && (
              <p className="text-xs text-teal-400 font-mono" data-testid="text-edit-rental-yield-preview">
                Implied yield: {((parseFloat(annualRentNgn) / parseFloat(valueNgn)) * 100).toFixed(2)}%
              </p>
            )}
          </div>
          {holding.cumulativeRentNgn != null && holding.cumulativeRentNgn > 0 && (
            <div className="rounded-md border border-teal-500/20 bg-teal-500/5 p-3">
              <p className="text-xs text-muted-foreground">Cumulative Rent Collected</p>
              <p className="text-sm font-mono text-teal-400 font-semibold" data-testid="text-cumulative-rent">
                ₦{holding.cumulativeRentNgn.toLocaleString()}
              </p>
            </div>
          )}
        </>
      )}
      <Button className="w-full" onClick={() => editMutation.mutate()} disabled={!isValid || editMutation.isPending} data-testid="button-save-edit-holding">
        {editMutation.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}

function ConfigDialog({ currentConfig, onClose }: { currentConfig: PortfolioDashboard["config"] & { baselineValue: number; targetValue: number; availableCash: number; totalCommissions: number; totalFees: number; totalTaxes: number }; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [baseline, setBaseline] = useState(currentConfig.baselineValue.toString());
  const [targetValue, setTargetValue] = useState(currentConfig.targetValue.toString());
  const [availableCash, setAvailableCash] = useState(currentConfig.availableCash.toString());
  const [stability, setStability] = useState((currentConfig.stabilityTarget * 100).toString());
  const [inflation, setInflation] = useState((currentConfig.inflationTarget * 100).toString());
  const [strategic, setStrategic] = useState((currentConfig.strategicTarget * 100).toString());
  const [tolerance, setTolerance] = useState((currentConfig.tolerance * 100).toString());
  const { toast } = useToast();

  const configMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/portfolio/config", {
        baselineValue: parseFloat(baseline),
        targetValue: parseFloat(targetValue) || 0,
        availableCash: parseFloat(availableCash) || 0,
        totalCommissions: 0,
        totalFees: 0,
        totalTaxes: 0,
        stabilityTarget: parseFloat(stability) / 100,
        inflationTarget: parseFloat(inflation) / 100,
        strategicTarget: parseFloat(strategic) / 100,
        tolerance: parseFloat(tolerance) / 100,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({ title: "Configuration saved" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to save config", variant: "destructive" });
    },
  });

  const s = parseFloat(stability) || 0;
  const inf = parseFloat(inflation) || 0;
  const str = parseFloat(strategic) || 0;
  const sum = s + inf + str;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="baseline-value">Total Invested / Cost Basis (NGN)</Label>
        <Input id="baseline-value" type="number" value={baseline} onChange={(e) => setBaseline(e.target.value)} data-testid="input-baseline" />
        <p className="text-[10px] text-muted-foreground">The total amount you've invested across all pillars. Used to calculate your nominal and real returns — i.e. how much your portfolio has grown (or shrunk) from what you put in.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="target-value">Wealth Target (NGN)</Label>
        <Input id="target-value" type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} data-testid="input-target-value" />
        <p className="text-[10px] text-muted-foreground">Long-term wealth goal for the progress tracker.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="available-cash">Available Cash (NGN)</Label>
        <Input id="available-cash" type="number" value={availableCash} onChange={(e) => setAvailableCash(e.target.value)} data-testid="input-available-cash" />
        <p className="text-[10px] text-muted-foreground">Liquid cash balance in brokerage accounts.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="stability-target">Stability %</Label>
          <Input id="stability-target" type="number" value={stability} onChange={(e) => setStability(e.target.value)} data-testid="input-stability-target" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inflation-target">Inflation %</Label>
          <Input id="inflation-target" type="number" value={inflation} onChange={(e) => setInflation(e.target.value)} data-testid="input-inflation-target" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="strategic-target">Strategic %</Label>
          <Input id="strategic-target" type="number" value={strategic} onChange={(e) => setStrategic(e.target.value)} data-testid="input-strategic-target" />
        </div>
      </div>
      <p className={cn("text-xs font-mono tabular-nums", Math.abs(sum - 100) < 0.01 ? "text-emerald-500" : "text-rose-500")}>
        Sum: {sum.toFixed(0)}% {Math.abs(sum - 100) < 0.01 ? "✓" : "(must equal 100%)"}
      </p>
      <div className="space-y-2">
        <Label htmlFor="tolerance">Tolerance %</Label>
        <Input id="tolerance" type="number" value={tolerance} onChange={(e) => setTolerance(e.target.value)} data-testid="input-tolerance" />
        <p className="text-[10px] text-muted-foreground">Drift threshold that triggers rebalance alerts.</p>
      </div>
      <Button
        className="w-full"
        onClick={() => configMutation.mutate()}
        disabled={configMutation.isPending || Math.abs(sum - 100) >= 0.01}
        data-testid="button-save-config"
      >
        {configMutation.isPending ? "Saving..." : "Save Configuration"}
      </Button>
    </div>
  );
}

function GuideSection() {
  return (
    <Card data-testid="card-guide">
      <CardHeader className="flex flex-row items-center gap-2 pb-3 p-4">
        <BookOpen className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">Operating Guide</h3>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">The Three Pillars</h4>
            <div className="space-y-2">
              <PillarGuideItem color="bg-teal-500" name="Stability (10%)" description="Bonds, ETFs, Money Market Funds, short-duration instruments. Provides liquidity and prevents forced selling. Risk: inflation may exceed returns." />
              <PillarGuideItem color="bg-emerald-500" name="Inflation Hedge (15%)" description="Bank stocks, cement, energy equities, productive assets that reprice with inflation. This is where real wealth grows in Nigeria." />
              <PillarGuideItem color="bg-amber-500" name="Strategic (75%)" description="Property, SPVs, private deals. The core wealth engine. Low liquidity but strong long-term store of value." />
            </div>
          </div>
          <div className="border-t border-border/50 pt-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Monthly Routine (10 minutes)</h4>
            <ol className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex gap-2"><span className="text-foreground font-mono font-semibold shrink-0">1.</span> Update your holding values in the tracker</li>
              <li className="flex gap-2"><span className="text-foreground font-mono font-semibold shrink-0">2.</span> Check pillar weights and drift signals</li>
              <li className="flex gap-2"><span className="text-foreground font-mono font-semibold shrink-0">3.</span> If no alerts appear, do nothing. Discipline is wealth.</li>
            </ol>
          </div>
          <div className="border-t border-border/50 pt-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">When Rebalance Alerts Trigger</h4>
            <div className="space-y-1.5">
              <RebalanceGuideRow signal="Stability too high" action="Deploy into productive assets" />
              <RebalanceGuideRow signal="Inflation pillar too large" action="Harvest gains, refill liquidity" />
              <RebalanceGuideRow signal="Strategic underweight" action="Allocate to property/SPVs" />
              <RebalanceGuideRow signal="Real return negative" action="Reassess allocation urgently" />
            </div>
          </div>
          <div className="border-t border-border/50 pt-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Real Return: The Key Metric</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nigeria wealth destruction happens silently through inflation. A portfolio growing 12% when inflation is 15%
              means <span className="text-foreground font-medium">you are losing purchasing power</span>. This tracker uses Fisher-adjusted
              real returns to show you the truth: whether your wealth is actually growing after inflation.
            </p>
          </div>
          <div className="border-t border-border/50 pt-3">
            <p className="text-[10px] text-muted-foreground/60 italic">
              This is an allocation-driven system, not a trading dashboard. Update values monthly or quarterly.
              The system recalculates automatically using live inflation data.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PillarGuideItem({ color, name, description }: { color: string; name: string; description: string }) {
  return (
    <div className="flex gap-2">
      <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", color)} />
      <div>
        <span className="text-xs font-semibold text-foreground">{name}</span>
        <p className="text-[10px] text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function RebalanceGuideRow({ signal, action }: { signal: string; action: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-muted-foreground shrink-0 w-[45%]">{signal}</span>
      <span className="text-foreground">{action}</span>
    </div>
  );
}

interface ParsedTransaction {
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
}

function PdfUploadDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [parsing, setParsing] = useState(false);
  const [pillar, setPillar] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Please select a PDF file", variant: "destructive" });
      return;
    }
    setFileName(file.name);
    setParsing(true);
    setParsed(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = getAuthToken();
      const apiBase = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiBase}/api/portfolio/parse-pdf`, {
        method: "POST",
        body: formData,
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Parse failed");
      }
      const data: ParsedTransaction = await res.json();
      setParsed(data);
    } catch (err: any) {
      toast({ title: err.message || "Failed to parse PDF", variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!parsed || !pillar) return;
      return apiRequest("POST", "/api/portfolio/holdings", {
        asset: parsed.security,
        ticker: parsed.ticker,
        pillar,
        valueNgn: parsed.totalAmount,
        shares: parsed.quantity,
        entryValueNgn: parsed.totalAmount,
      });
    },
    onSuccess: async (res) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      let msg = "Holding added from contract note";
      try {
        const data = await res?.json();
        if (data?.merged) {
          msg = `Merged: ${data.addedShares?.toLocaleString()} shares added to existing ${data.previousShares?.toLocaleString()} (total: ${data.shares?.toLocaleString()})`;
        }
      } catch {}
      toast({ title: msg });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to add holding", variant: "destructive" });
    },
  });

  const isValid = parsed && pillar;

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => fileRef.current?.click()}
        data-testid="dropzone-pdf-upload"
      >
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} data-testid="input-pdf-file" />
        {parsing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Parsing contract note...</p>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <p className="text-sm text-foreground font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground">Click to select a different file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-foreground font-medium">Upload Broker Contract Note</p>
            <p className="text-xs text-muted-foreground">Supports Meristem, Stanbic IBTC, CSL, and other NGX broker PDFs</p>
          </div>
        )}
      </div>

      {parsed && (
        <Card data-testid="card-parsed-preview">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold text-foreground">Parsed Successfully</span>
              <Badge variant="secondary" className="text-[9px] uppercase ml-auto">{parsed.type}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">Security</span>
                <p className="font-medium text-foreground" data-testid="text-parsed-security">{parsed.security}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Quantity</span>
                <p className="font-mono tabular-nums text-foreground" data-testid="text-parsed-quantity">{parsed.quantity.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cost Price / Share</span>
                <p className="font-mono tabular-nums text-foreground" data-testid="text-parsed-price">{formatNgn(parsed.price)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Contract Value</span>
                <p className="font-mono tabular-nums text-foreground font-semibold" data-testid="text-parsed-total">{formatNgn(parsed.totalAmount)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Trade Date</span>
                <p className="text-foreground" data-testid="text-parsed-date">{parsed.tradeDate}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Broker</span>
                <p className="text-foreground" data-testid="text-parsed-broker">{parsed.broker}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fees & Commission</span>
                <p className="font-mono tabular-nums text-foreground">{formatNgn(parsed.fees)}</p>
              </div>
            </div>
            <div className="border-t border-border/50 pt-3 space-y-2">
              <Label className="text-xs">Assign Wealth Pillar</Label>
              <Select value={pillar} onValueChange={setPillar}>
                <SelectTrigger data-testid="select-pdf-pillar"><SelectValue placeholder="Select pillar for this holding" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STABILITY">Stability (Cash / MMF / Short duration)</SelectItem>
                  <SelectItem value="INFLATION">Inflation Hedge (Banks / Cement / Equities)</SelectItem>
                  <SelectItem value="STRATEGIC">Strategic (Property / SPVs / Private deals)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => addMutation.mutate()} disabled={!isValid || addMutation.isPending} data-testid="button-confirm-pdf-holding">
              {addMutation.isPending ? "Adding..." : `Add ${parsed.security} to Portfolio`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ label, value, subtitle, color, icon: Icon, testId }: { label: string; value: string; subtitle?: string; color?: string; icon?: typeof ArrowUpRight; testId: string }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{label}</p>
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className={cn("h-4 w-4", color)} />}
          <span className={cn("text-lg font-bold font-mono tabular-nums", color || "text-foreground")}>{value}</span>
        </div>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

const REGIME_COLORS_MAP: Record<string, { text: string; bg: string }> = {
  GREEN: { text: "text-emerald-400", bg: "bg-emerald-500/10" },
  YELLOW: { text: "text-amber-400", bg: "bg-amber-500/10" },
  ORANGE: { text: "text-orange-400", bg: "bg-orange-500/10" },
  RED: { text: "text-rose-400", bg: "bg-rose-500/10" },
  GREY: { text: "text-muted-foreground", bg: "bg-muted/50" },
};

const SIGNAL_COLORS_MAP: Record<string, string> = {
  BUY: "text-emerald-400",
  HOLD: "text-amber-400",
  SELL: "text-rose-400",
};

function EtfModelComparison({ etfData, holdings, totalValue }: { etfData: EtfAllocationData; holdings: any[]; totalValue: number }) {
  const regimeColors = REGIME_COLORS_MAP[etfData.regime.color] || REGIME_COLORS_MAP.GREY;

  const holdingsByTicker = new Map<string, number>();
  holdings.forEach((h: any) => {
    if (h.ticker) {
      const key = h.ticker.toUpperCase();
      holdingsByTicker.set(key, (holdingsByTicker.get(key) || 0) + h.valueNgn);
    }
  });

  const etfRows = etfData.etfSignals.map(sig => {
    const actualValue = holdingsByTicker.get(sig.symbol.toUpperCase()) || 0;
    const actualPct = totalValue > 0 ? (actualValue / totalValue) * 100 : 0;
    const price = etfData.etfPrices.find(p => p.symbol === sig.symbol);
    return { ...sig, actualValue, actualPct, price };
  });

  return (
    <Card data-testid="card-etf-model">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3 p-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">ETF Signal Tracker</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", regimeColors.bg, regimeColors.text)}>
            {etfData.regime.name}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Current Regime</p>
            <p className="text-sm font-bold" data-testid="text-regime-name">{etfData.regime.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Regime Confidence</p>
            <p className="text-sm font-bold font-mono tabular-nums" data-testid="text-regime-conf">{Math.round(etfData.regime.confidence * 100)}%</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs" data-testid="table-etf-model">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-semibold text-muted-foreground uppercase tracking-wider">ETF</th>
                <th className="text-center py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Signal</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Confidence</th>
                <th className="text-left py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Reasoning</th>
              </tr>
            </thead>
            <tbody>
              {etfRows.map((row) => {
                const signalColor = SIGNAL_COLORS_MAP[row.signal] || "text-muted-foreground";
                const confidencePct = Math.round(row.confidence * 100);

                return (
                  <tr key={row.symbol} className="border-b border-border/50 last:border-0" data-testid={`model-row-${row.symbol}`}>
                    <td className="py-2.5 pr-3">
                      <span className="font-medium text-foreground font-mono">{row.symbol}</span>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{row.name}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={cn("text-[10px] font-bold uppercase", signalColor)}>{row.signal}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={cn("font-mono tabular-nums", confidencePct >= 70 ? "text-emerald-400" : confidencePct >= 50 ? "text-amber-400" : "text-rose-400")}>
                        {confidencePct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left hidden md:table-cell">
                      <span className="text-[10px] text-muted-foreground leading-tight">{row.reasoning}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-start gap-2 pt-2 border-t border-border/50">
          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Directional signals are derived from the current macro regime ({etfData.regime.name}) using live CBN, NBS, and market data. These are research indicators — not allocation recommendations or portfolio instructions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PortfolioPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, dataUpdatedAt } = useQuery<PortfolioDashboard>({
    queryKey: ["/api/portfolio"],
    refetchInterval: 30 * 1000,
  });
  const { data: etfData } = useQuery<EtfAllocationData>({
    queryKey: ["/api/etf/allocation"],
    refetchInterval: 60 * 1000,
  });
  const [addOpen, setAddOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editHolding, setEditHolding] = useState<{ id: number; asset: string; ticker: string | null; pillar: string; valueNgn: number; shares: number; annualRentNgn?: number | null; corridor?: string | null; entryDate?: string | null; cumulativeRentNgn?: number | null } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshLabel, setRefreshLabel] = useState("--");
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/portfolio/holdings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({ title: "Holding deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete holding", variant: "destructive" });
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/etf/allocation"] });
    setIsRefreshing(false);
  };

  if (dataUpdatedAt && dataUpdatedAt > 0) {
    const elapsed = Date.now() - dataUpdatedAt;
    const seconds = Math.floor(elapsed / 1000);
    const label = seconds < 5 ? "just now" : seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`;
    if (label !== refreshLabel) {
      setTimeout(() => setRefreshLabel(label), 0);
    }
  }

  if (isLoading) return <PortfolioSkeleton />;
  if (!data) return <div className="p-6 text-muted-foreground">Failed to load portfolio data.</div>;

  const hasBaseline = data.baselineValue > 0;
  const hasHoldings = data.holdings.length > 0;

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-xl font-bold tracking-tight" data-testid="text-portfolio-title">Wealth Portfolio</h2>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
            <span>Three-pillar allocation tracker with inflation-adjusted returns</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">Live</span>
          </div>
          <span className="text-[10px] text-muted-foreground/60 font-mono" data-testid="text-portfolio-refresh">refreshed {refreshLabel}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefresh} data-testid="button-refresh-portfolio">
            <RefreshCw className={cn("h-3 w-3 transition-transform", isRefreshing && "animate-spin")} />
          </Button>
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-open-config">
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Portfolio Configuration</DialogTitle></DialogHeader>
              <ConfigDialog
                currentConfig={{ ...data.config, baselineValue: data.baselineValue, targetValue: data.targetValue, availableCash: data.availableCash, totalCommissions: data.totalCommissions, totalFees: data.totalFees, totalTaxes: data.totalTaxes }}
                onClose={() => setConfigOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-open-upload-pdf">
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload PDF
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Import from Broker Contract Note</DialogTitle></DialogHeader>
              <PdfUploadDialog onClose={() => setUploadOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-open-add-holding">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Holding
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Portfolio Holding</DialogTitle></DialogHeader>
              <AddHoldingDialog onClose={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={!!editHolding} onOpenChange={(open) => { if (!open) setEditHolding(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Holding</DialogTitle></DialogHeader>
          {editHolding && (
            <EditHoldingDialog holding={editHolding} onClose={() => setEditHolding(null)} />
          )}
        </DialogContent>
      </Dialog>

      {hasBaseline && hasHoldings && (() => {
        const hasTarget = data.targetValue > 0;
        const progressPct = hasTarget ? (data.totalValue / data.targetValue) * 100 : 0;
        const growthMultiplier = hasTarget && data.totalValue > 0 ? data.targetValue / data.totalValue : 0;
        const totalCosts = data.totalCommissions + data.totalFees + data.totalTaxes;

        const pillarContributions = data.pillars.map((p) => ({
          name: p.pillar,
          value: p.value,
          pctOfTarget: hasTarget ? (p.value / data.targetValue) * 100 : 0,
          color: PILLAR_COLORS[p.pillar] || "bg-primary",
        }));

        return (
          <div className="space-y-4">
            {hasTarget && (
              <Card data-testid="card-wealth-target">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold" data-testid="text-wealth-target-label">Wealth Target</span>
                    </div>
                    <span className="text-sm font-mono tabular-nums font-bold text-primary" data-testid="text-wealth-target-value">
                      {formatCompact(data.targetValue)}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden flex" data-testid="progress-wealth-target">
                    {pillarContributions.map((pc) => {
                      const totalPct = pillarContributions.reduce((s, x) => s + x.pctOfTarget, 0);
                      const scaledWidth = totalPct > 100 ? (pc.pctOfTarget / totalPct) * 100 : pc.pctOfTarget;
                      return (
                        <div
                          key={pc.name}
                          className={cn("h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full", pc.color)}
                          style={{ width: `${scaledWidth}%` }}
                          title={`${pc.name}: ${pc.pctOfTarget.toFixed(2)}%`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {pillarContributions.map((pc) => (
                      <div key={pc.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <div className={cn("h-2 w-2 rounded-full", pc.color)} />
                        <span>{pc.name}</span>
                        <span className="font-mono tabular-nums font-semibold">{pc.pctOfTarget.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Current Value</p>
                      <p className="text-sm font-bold font-mono tabular-nums" data-testid="text-target-current">{formatCompact(data.totalValue)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Achieved</p>
                      <p className="text-sm font-bold font-mono tabular-nums text-primary" data-testid="text-target-pct">{progressPct.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Growth Needed</p>
                      <p className="text-sm font-bold font-mono tabular-nums" data-testid="text-target-multiplier">{growthMultiplier.toFixed(2)}x</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Gap</p>
                      <p className="text-sm font-bold font-mono tabular-nums text-muted-foreground" data-testid="text-target-gap">{formatCompact(Math.max(data.targetValue - data.totalValue, 0))}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Total Value"
                value={formatCompact(data.totalValue)}
                subtitle={hasTarget ? `${progressPct.toFixed(2)}% of ${formatCompact(data.targetValue)}` : undefined}
                testId="metric-total-value"
              />
              <MetricCard
                label="Nominal Return"
                value={`${data.nominalReturn > 0 ? "+" : ""}${data.nominalReturn.toFixed(2)}%`}
                subtitle={`Baseline: ${formatCompact(data.baselineValue)}`}
                color={data.nominalReturn >= 0 ? "text-emerald-500" : "text-rose-500"}
                testId="metric-nominal-return"
              />
              <MetricCard
                label="Real Return"
                value={`${data.realReturn > 0 ? "+" : ""}${data.realReturn.toFixed(2)}%`}
                subtitle={`CPI: ${data.currentInflation.toFixed(2)}%`}
                color={data.realReturn >= 0 ? "text-emerald-500" : "text-rose-500"}
                icon={data.realReturn >= 0 ? ArrowUpRight : ArrowDownRight}
                testId="metric-real-return"
              />
              <MetricCard
                label="Available Cash"
                value={formatNgn(data.availableCash)}
                subtitle="Brokerage cash balance"
                icon={Wallet}
                testId="metric-available-cash"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Capital Deployed"
                value={formatCompact(data.baselineValue)}
                subtitle="All pillars total cost"
                testId="metric-baseline"
              />
              <MetricCard
                label="Commissions"
                value={formatNgn(data.totalCommissions)}
                subtitle="NGX brokerage (1.35%)"
                color="text-amber-500"
                testId="metric-commissions"
              />
              <MetricCard
                label="Total Costs"
                value={formatNgn(totalCosts)}
                subtitle={`Fees ${formatNgn(data.totalFees)} + Duty ${formatNgn(data.totalTaxes)}`}
                color="text-amber-500"
                testId="metric-total-costs"
              />
              <MetricCard
                label="Cost Drag"
                value={data.baselineValue > 0 ? `${(totalCosts / data.baselineValue * 100).toFixed(2)}%` : "0%"}
                subtitle="All costs vs capital deployed"
                color="text-amber-500"
                testId="metric-cost-drag"
              />
            </div>
          </div>
        );
      })()}

      {!hasBaseline && hasHoldings && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 p-4">
            <Target className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Set your wealth target</p>
              <p className="text-xs text-muted-foreground">Click Configure to set your wealth target. Your cost basis is auto-calculated from your holdings. The target lets you track how far you are from your goal.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasHoldings && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Wallet className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">No holdings yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first asset to start tracking your wealth allocation across the three pillars.</p>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)} data-testid="button-empty-add">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add First Holding
            </Button>
          </CardContent>
        </Card>
      )}

      {hasHoldings && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="pillars-grid">
            {data.pillars.map((p) => (
              <PillarGauge key={p.pillar} pillar={p} totalValue={data.totalValue} tolerance={data.config.tolerance} targetValue={data.targetValue} />
            ))}
          </div>

          {data.alerts.length > 0 && (
            <Card data-testid="card-alerts">
              <CardHeader className="flex flex-row items-center gap-2 pb-3 p-4">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Rebalance Signals</h3>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                {data.alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs p-2 rounded-md bg-muted/50" data-testid={`alert-row-${i}`}>
                    <Badge
                      variant="secondary"
                      className={cn("text-[9px] uppercase tracking-wider shrink-0", alert.direction === "over" ? "text-amber-500" : "text-rose-500")}
                    >
                      {alert.pillar} {alert.direction === "over" ? "+" : ""}{(alert.drift * 100).toFixed(2)}%
                    </Badge>
                    <span className="text-muted-foreground">{alert.action}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card data-testid="card-holdings-table">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3 p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">All Holdings</h3>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{data.holdings.length} positions</span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs" data-testid="table-holdings">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-3 font-semibold text-muted-foreground uppercase tracking-wider">Asset</th>
                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Pillar</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Qty</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Cost Price</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Current Price</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Value (NGN)</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Yield / IRR</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Weight</th>
                      {data.targetValue > 0 && <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">vs Target</th>}
                      <th className="text-right py-2 pl-3 font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const TICKER_ALIASES: Record<string, string> = {
                        "ACCESSHOLDINGSPLC": "ACCESSCORP",
                        "ACCESS HOLDINGS PLC": "ACCESSCORP",
                        "ACCESS HOLDINGS": "ACCESSCORP",
                        "ACCESSHOLDINGS": "ACCESSCORP",
                        "ACCESS BANK": "ACCESSCORP",
                        "ACCESS BANK PLC": "ACCESSCORP",
                      };
                      const normalizeTicker = (raw: string): string => {
                        const upper = raw.toUpperCase().trim();
                        return TICKER_ALIASES[upper] || upper;
                      };
                      const grouped = new Map<string, { asset: string; ticker: string | null; pillar: string; totalValue: number; totalShares: number; totalEntryValue: number; ids: number[]; annualRentNgn: number | null; corridor: string | null; entryDate: string | null; cumulativeRentNgn: number | null; strategicIrr: number | null; gainLossPct: number | null; livePrice: number | null }>();
                      data.holdings.forEach((h: any) => {
                        const normalizedTicker = normalizeTicker(h.ticker || h.asset);
                        const key = normalizedTicker + "|" + h.pillar + "|" + (h.corridor || "");
                        const existing = grouped.get(key);
                        if (existing) {
                          existing.totalValue += h.valueNgn;
                          existing.totalShares += h.shares || 0;
                          existing.totalEntryValue += h.entryValueNgn || h.valueNgn;
                          existing.ids.push(h.id);
                          if (h.livePrice) existing.livePrice = h.livePrice;
                          if (h.annualRentNgn) existing.annualRentNgn = (existing.annualRentNgn || 0) + h.annualRentNgn;
                          if (h.cumulativeRentNgn) existing.cumulativeRentNgn = (existing.cumulativeRentNgn || 0) + h.cumulativeRentNgn;
                        } else {
                          grouped.set(key, {
                            asset: h.asset,
                            ticker: normalizedTicker !== (h.ticker || h.asset).toUpperCase().trim() ? normalizedTicker : h.ticker,
                            pillar: h.pillar,
                            totalValue: h.valueNgn,
                            totalShares: h.shares || 0,
                            totalEntryValue: h.entryValueNgn || h.valueNgn,
                            ids: [h.id],
                            annualRentNgn: h.annualRentNgn || null,
                            corridor: h.corridor || null,
                            entryDate: h.entryDate || null,
                            cumulativeRentNgn: h.cumulativeRentNgn || null,
                            strategicIrr: h.strategicIrr ?? null,
                            gainLossPct: h.gainLossPct ?? null,
                            livePrice: h.livePrice ?? null,
                          });
                        }
                      });
                      grouped.forEach((g) => {
                        if (g.pillar !== "STRATEGIC" && g.totalEntryValue > 0 && g.livePrice) {
                          g.gainLossPct = parseFloat(((g.totalValue - g.totalEntryValue) / g.totalEntryValue * 100).toFixed(2));
                        }
                      });
                      const pillarOrder = ["STABILITY", "INFLATION", "STRATEGIC"];
                      const entries = Array.from(grouped.entries());
                      const byPillar = pillarOrder.map((p) => ({
                        pillar: p,
                        label: PILLAR_KEYS[p] || p,
                        color: PILLAR_TEXT_COLORS[PILLAR_KEYS[p] || p] || "text-primary",
                        bgColor: PILLAR_COLORS[PILLAR_KEYS[p] || p] || "bg-primary",
                        items: entries.filter(([, g]) => g.pillar === p),
                        subtotal: entries.filter(([, g]) => g.pillar === p).reduce((s, [, g]) => s + g.totalValue, 0),
                      })).filter((g) => g.items.length > 0);
                      const colCount = data.targetValue > 0 ? 10 : 9;

                      return byPillar.map((group) => (
                        <Fragment key={`group-${group.pillar}`}>
                          <tr className="bg-muted/30" data-testid={`pillar-group-header-${group.pillar.toLowerCase()}`}>
                            <td colSpan={colCount} className="py-2 px-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={cn("h-2 w-2 rounded-full", group.bgColor)} />
                                  <span className={cn("text-xs font-bold uppercase tracking-wider", group.color)}>{group.label}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono">{group.items.length} position{group.items.length !== 1 ? "s" : ""}</span>
                                </div>
                                <span className="text-xs font-mono tabular-nums font-semibold text-foreground">{formatNgn(group.subtotal)}</span>
                              </div>
                            </td>
                          </tr>
                          {group.items.map(([key, g]) => {
                            const weight = data.totalValue > 0 ? (g.totalValue / data.totalValue * 100).toFixed(2) : "0.00";
                            const costPrice = g.totalShares > 0 ? g.totalEntryValue / g.totalShares : 0;
                            return (
                              <tr key={key} className="border-b border-border/50 last:border-0" data-testid={`holding-row-${g.ids[0]}`}>
                                <td className="py-2.5 pr-3 pl-5 font-medium text-foreground">
                                  <div>
                                    {g.asset}
                                    {g.ticker && g.ticker !== g.asset && <span className="text-muted-foreground ml-1.5 font-mono text-[10px]">{g.ticker}</span>}
                                    {g.corridor && <span className="text-teal-400/70 ml-1.5 text-[10px]">· {g.corridor}</span>}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
                                    {PILLAR_KEYS[g.pillar] || g.pillar}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-muted-foreground">{g.totalShares ? g.totalShares.toLocaleString() : "-"}</td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-muted-foreground">{g.totalShares ? formatNgn(costPrice) : "-"}</td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-foreground">
                                  {g.livePrice ? (
                                    <div>
                                      <span>{formatNgn(g.livePrice)}</span>
                                      <div className="text-[9px] text-teal-400">NGX LIVE</div>
                                    </div>
                                  ) : g.totalShares ? (
                                    <div>
                                      <span className="text-muted-foreground">—</span>
                                      <div className="text-[9px] text-yellow-500/70">NO FEED</div>
                                    </div>
                                  ) : "-"}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-foreground">
                                  {g.pillar !== "STRATEGIC" && g.totalShares > 0 && !g.livePrice ? (
                                    <div>
                                      <span className="text-muted-foreground">{formatNgn(g.totalEntryValue)}</span>
                                      <div className="text-[9px] text-yellow-500/70">AT COST</div>
                                    </div>
                                  ) : formatNgn(g.totalValue)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums" data-testid={`holding-yield-${g.ids[0]}`}>
                                  {g.pillar === "STRATEGIC" ? (
                                    g.annualRentNgn && g.totalValue > 0 ? (
                                      <div>
                                        <span className="text-teal-400">{((g.annualRentNgn / g.totalValue) * 100).toFixed(2)}%</span>
                                        {g.strategicIrr != null && (
                                          <div className="text-[9px] text-amber-400" data-testid={`holding-irr-${g.ids[0]}`}>
                                            IRR {g.strategicIrr > 0 ? "+" : ""}{g.strategicIrr}%
                                          </div>
                                        )}
                                        {g.cumulativeRentNgn != null && g.cumulativeRentNgn > 0 && (
                                          <div className="text-[9px] text-muted-foreground" data-testid={`holding-cumrent-${g.ids[0]}`}>
                                            ₦{g.cumulativeRentNgn.toLocaleString()} rent
                                          </div>
                                        )}
                                      </div>
                                    ) : g.strategicIrr != null ? (
                                      <div>
                                        <span className="text-amber-400">IRR {g.strategicIrr > 0 ? "+" : ""}{g.strategicIrr}%</span>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )
                                  ) : g.gainLossPct != null ? (
                                    <div data-testid={`holding-gainloss-${g.ids[0]}`}>
                                      <span className={g.gainLossPct >= 0 ? "text-emerald-400" : "text-red-400"}>
                                        {g.gainLossPct >= 0 ? "+" : ""}{g.gainLossPct.toFixed(2)}%
                                      </span>
                                      <div className="text-[9px] text-muted-foreground">
                                        {g.gainLossPct >= 0 ? "gain" : "loss"} · cost ₦{g.totalEntryValue.toLocaleString()}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-muted-foreground">{weight}%</td>
                                {data.targetValue > 0 && (
                                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-muted-foreground" data-testid={`holding-target-pct-${g.ids[0]}`}>
                                    {(g.totalValue / data.targetValue * 100).toFixed(4)}%
                                  </td>
                                )}
                                <td className="py-2.5 pl-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const original = data.holdings.find((h: any) => h.id === g.ids[0]);
                                        setEditHolding({
                                          id: g.ids[0],
                                          asset: original?.asset ?? g.asset,
                                          ticker: original?.ticker ?? g.ticker,
                                          pillar: original?.pillar ?? g.pillar,
                                          valueNgn: original?.valueNgn ?? g.totalValue,
                                          shares: original?.shares ?? 0,
                                          entryValueNgn: original?.entryValueNgn ?? null,
                                          annualRentNgn: original?.annualRentNgn ?? g.annualRentNgn,
                                          corridor: original?.corridor ?? g.corridor,
                                          entryDate: original?.entryDate ?? g.entryDate,
                                          cumulativeRentNgn: original?.cumulativeRentNgn ?? g.cumulativeRentNgn,
                                        });
                                      }}
                                      data-testid={`button-edit-holding-${g.ids[0]}`}
                                    >
                                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => g.ids.forEach((id) => deleteMutation.mutate(id))}
                                      disabled={deleteMutation.isPending}
                                      data-testid={`button-delete-holding-${g.ids[0]}`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {hasBaseline && hasHoldings && data.realReturn < 0 && (
        <Card className="border-rose-500/30" data-testid="card-real-return-warning">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Inflation is eroding your wealth</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Your portfolio grew {data.nominalReturn.toFixed(2)}% but inflation is {data.currentInflation.toFixed(2)}%.
                Real purchasing power declined by {Math.abs(data.realReturn).toFixed(2)}%.
                Consider increasing exposure to inflation-linked assets.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {etfData && etfData.etfSignals && etfData.etfSignals.length > 0 && hasHoldings && (
        <EtfModelComparison etfData={etfData} holdings={data?.holdings || []} totalValue={data?.totalValue || 0} />
      )}

      <GuideSection />
    </div>
  );
}
