import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { PortfolioDashboard } from "./types";

type ConfigProps = {
  currentConfig: PortfolioDashboard["config"] & {
    baselineValue: number;
    targetValue: number;
    availableCash: number;
    totalCommissions: number;
    totalFees: number;
    totalTaxes: number;
  };
  onClose: () => void;
};

export function ConfigDialog({ currentConfig, onClose }: ConfigProps) {
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
