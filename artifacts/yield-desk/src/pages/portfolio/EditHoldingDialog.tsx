import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatNgn } from "./helpers";
import type { EditableHolding } from "./types";

export function EditHoldingDialog({ holding, onClose }: { holding: EditableHolding; onClose: () => void }) {
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
      if (pillar === "STRATEGIC") {
        payload.entryValueNgn = costPrice && !isNaN(parseFloat(costPrice)) && parseFloat(costPrice) > 0
          ? parseFloat(costPrice) : null;
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
