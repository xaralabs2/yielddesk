import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatNgn } from "./helpers";

export function AddHoldingDialog({ onClose }: { onClose: () => void }) {
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
