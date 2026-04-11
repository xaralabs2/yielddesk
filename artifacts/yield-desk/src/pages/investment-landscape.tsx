import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  TrendingUp,
  Droplets,
  Zap,
  Building2,
  Landmark,
  BarChart3,
  Wallet,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  RefreshCw,
  Activity,
  Target,
  Gauge,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
type InvestmentOption = { id: string; name: string; category: string; description: string; riskLevel: "Very Low" | "Low" | "Medium" | "High"; liquidity: "Very High" | "High" | "Medium" | "Low"; volatility: "Very Low" | "Low" | "Medium" | "High"; inflationProtection: "Weak" | "Weak-Moderate" | "Moderate" | "Strong"; tenors?: { label: string; yieldRange: [number, number]; notes?: string }[]; nominalReturnRange: [number, number]; bestFor: string; realYieldRange?: [number, number]; };
type InvestmentLandscapeData = { investments: InvestmentOption[]; currentInflation: number; currentMpr: number; currentTbillRate: number | null; fxRate: number; };
type EtfAllocationData = { etfSignals: { symbol: string; name: string; signal: string; confidence: number; reasoning: string; regime: string; role: string }[]; etfPrices: { symbol: string; price: number; change1d: number }[]; regime: { name: string; color: string; confidence: number; summary: string }; factorSignals: { factorType: string; signal: string; confidence: number; reasoning: string; symbol: string }[]; lastUpdated: string | null; };

const categoryIcons: Record<string, typeof Landmark> = {
  "Fixed Income": Landmark,
  "Cash & Near-Cash": Wallet,
  "Equities": BarChart3,
  "Real Assets": Building2,
};

const riskColors: Record<string, string> = {
  "Very Low": "text-emerald-500",
  "Low": "text-teal-500",
  "Medium": "text-amber-500",
  "High": "text-rose-500",
};

const protectionColors: Record<string, string> = {
  "Weak": "text-rose-400",
  "Weak-Moderate": "text-amber-400",
  "Moderate": "text-teal-400",
  "Strong": "text-emerald-400",
};

const REGIME_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  GREEN: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", badge: "bg-emerald-500" },
  YELLOW: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", badge: "bg-amber-500" },
  ORANGE: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", badge: "bg-orange-500" },
  RED: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", badge: "bg-rose-500" },
  GREY: { bg: "bg-muted/50", border: "border-border", text: "text-muted-foreground", badge: "bg-muted-foreground" },
};

const SIGNAL_COLORS: Record<string, string> = {
  BUY: "text-emerald-400",
  HOLD: "text-amber-400",
  SELL: "text-rose-400",
  UNDERWEIGHT: "text-rose-400",
  OVERWEIGHT: "text-emerald-400",
  NEUTRAL: "text-muted-foreground",
};

const SIGNAL_BG: Record<string, string> = {
  BUY: "bg-emerald-500/10 border-emerald-500/20",
  HOLD: "bg-amber-500/10 border-amber-500/20",
  SELL: "bg-rose-500/10 border-rose-500/20",
};

function InvestmentSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-24" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[250px]" />
        ))}
      </div>
      <Skeleton className="h-[300px]" />
    </div>
  );
}

function RegimeBanner({ regime, lastUpdated }: { regime: EtfAllocationData["regime"]; lastUpdated: string | null }) {
  const colors = REGIME_COLORS[regime.color] || REGIME_COLORS.GREY;
  const confidencePct = Math.round(regime.confidence * 100);

  return (
    <Card className={cn("overflow-hidden", colors.border)} data-testid="card-regime-banner">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <Activity className={cn("h-5 w-5", colors.text)} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Macro Regime</span>
              <div className={cn("h-2.5 w-2.5 rounded-full animate-pulse", colors.badge)} />
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className={cn("text-2xl font-bold tracking-tight", colors.text)} data-testid="text-regime-name">
                {regime.name}
              </h2>
              <span className="text-xs font-mono tabular-nums text-muted-foreground" data-testid="text-regime-confidence">
                {confidencePct}% confidence
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl" data-testid="text-regime-summary">
              {regime.summary}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className={cn("rounded-full px-3 py-1", colors.bg)}>
              <span className={cn("text-xs font-bold uppercase tracking-wider", colors.text)}>
                {regime.name}
              </span>
            </div>
            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden mt-1">
              <div
                className={cn("h-full rounded-full transition-all duration-500", colors.badge)}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
            {lastUpdated && (
              <span className="text-[9px] text-muted-foreground/60 font-mono mt-1">
                {new Date(lastUpdated).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EtfStrategyTable({ signals, prices }: { signals: EtfAllocationData["etfSignals"]; prices: EtfAllocationData["etfPrices"] }) {
  const priceMap = new Map(prices.map(p => [p.symbol, p]));

  return (
    <Card data-testid="card-etf-strategy">
      <CardHeader className="flex flex-row items-center gap-2 pb-3 p-4">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">ETF Strategy Signals</h3>
        <span className="text-[10px] text-muted-foreground font-mono ml-auto">{signals.length} ETFs tracked</span>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-[10px] text-muted-foreground mb-3">Macro-regime-driven signals for NGX-listed ETFs. These are research indicators to inform your investment decisions — not portfolio positions.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" data-testid="table-etf-strategy">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-semibold text-muted-foreground uppercase tracking-wider">ETF</th>
                <th className="text-left py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-center py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Signal</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Confidence</th>
                <th className="text-left py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Reasoning</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Price (NGN)</th>
                <th className="text-right py-2 pl-3 font-semibold text-muted-foreground uppercase tracking-wider">1D Chg</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((sig) => {
                const price = priceMap.get(sig.symbol);
                const signalColor = SIGNAL_COLORS[sig.signal] || "text-muted-foreground";
                const signalBg = SIGNAL_BG[sig.signal] || "";
                const confidencePct = Math.round(sig.confidence * 100);
                const change1d = price?.change1d ?? 0;

                return (
                  <tr key={sig.symbol} className="border-b border-border/50 last:border-0" data-testid={`etf-row-${sig.symbol}`}>
                    <td className="py-2.5 pr-3">
                      <div>
                        <span className="font-medium text-foreground font-mono">{sig.symbol}</span>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{sig.name}</div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{sig.role}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", signalBg, signalColor)}>
                        {sig.signal}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={cn("font-mono tabular-nums", confidencePct >= 70 ? "text-emerald-400" : confidencePct >= 50 ? "text-amber-400" : "text-rose-400")}>
                        {confidencePct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left hidden lg:table-cell">
                      <span className="text-[10px] text-muted-foreground leading-tight">{sig.reasoning}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-foreground">
                      {price ? `₦${price.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono tabular-nums">
                      {price ? (
                        <span className={cn(change1d >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {change1d >= 0 ? "+" : ""}{change1d.toFixed(2)}%
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {signals.length > 0 && signals[0].reasoning && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground/60 italic">
              Regime: {signals[0].regime} — {signals[0].reasoning}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FactorRotation({ factors }: { factors: EtfAllocationData["factorSignals"] }) {
  if (!factors || factors.length === 0) return null;

  const growthFactor = factors.find(f => f.factorType === "GROWTH");
  const valueFactor = factors.find(f => f.factorType === "VALUE");

  return (
    <Card data-testid="card-factor-rotation">
      <CardHeader className="flex flex-row items-center gap-2 pb-3 p-4">
        <Gauge className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">Factor Rotation</h3>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {growthFactor && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50" data-testid="factor-growth">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Growth</span>
                </div>
                <span className={cn("text-xs font-bold uppercase tracking-wider", SIGNAL_COLORS[growthFactor.signal])}>
                  {growthFactor.signal}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Confidence</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.round(growthFactor.confidence * 100)}%` }} />
                </div>
                <span className="text-xs font-mono tabular-nums">{Math.round(growthFactor.confidence * 100)}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic">{growthFactor.reasoning}</p>
              <span className="text-[10px] text-muted-foreground/60 font-mono">{growthFactor.symbol}</span>
            </div>
          )}
          {valueFactor && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50" data-testid="factor-value">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Value</span>
                </div>
                <span className={cn("text-xs font-bold uppercase tracking-wider", SIGNAL_COLORS[valueFactor.signal])}>
                  {valueFactor.signal}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Confidence</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.round(valueFactor.confidence * 100)}%` }} />
                </div>
                <span className="text-xs font-mono tabular-nums">{Math.round(valueFactor.confidence * 100)}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic">{valueFactor.reasoning}</p>
              <span className="text-[10px] text-muted-foreground/60 font-mono">{valueFactor.symbol}</span>
            </div>
          )}
        </div>
        {growthFactor && valueFactor && (
          <div className="flex items-center gap-3 pt-2 border-t border-border/50">
            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Factor rotation reflects the current macro regime. In tight liquidity, value tends to outperform growth.
              In expansion, growth dominates. Signals update every 6 hours with macro data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RiskPanel({ regime }: { regime: EtfAllocationData["regime"] }) {
  const colors = REGIME_COLORS[regime.color] || REGIME_COLORS.GREY;
  const riskLevel = regime.color === "RED" ? "High" : regime.color === "ORANGE" ? "Elevated" : regime.color === "YELLOW" ? "Moderate" : "Low";
  const riskDesc = regime.color === "RED"
    ? "Crisis conditions — preserve capital, avoid new exposure"
    : regime.color === "ORANGE"
    ? "Elevated stress — reduce risk, favour defensive assets"
    : regime.color === "YELLOW"
    ? "Caution warranted — selective opportunities exist"
    : "Favourable conditions — environment supports deployment";
  const confidencePct = Math.round(regime.confidence * 100);
  const confidenceDesc = confidencePct >= 75
    ? "Strong signal — macro indicators clearly aligned"
    : confidencePct >= 50
    ? "Moderate signal — some indicators are mixed"
    : "Weak signal — environment is ambiguous, be cautious";

  return (
    <Card data-testid="card-risk-panel">
      <CardHeader className="flex flex-row items-center gap-2 pb-3 p-4">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">Risk Assessment</h3>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1 p-3 rounded-lg bg-muted/30 border border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Regime Risk</span>
            <p className={cn("text-lg font-bold", colors.text)} data-testid="text-risk-level">{riskLevel}</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{riskDesc}</p>
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/30 border border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Model Confidence</span>
            <p className="text-lg font-bold font-mono tabular-nums" data-testid="text-confidence-overall">{confidencePct}%</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{confidenceDesc}</p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">{regime.summary}</p>
      </CardContent>
    </Card>
  );
}

function RealYieldBadge({ range, inflation }: { range: [number, number]; inflation: number }) {
  const avg = (range[0] + range[1]) / 2;
  const isPositive = avg > 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-mono tabular-nums font-semibold",
        isPositive ? "text-emerald-500" : "text-rose-500"
      )}
      data-testid="badge-real-yield"
    >
      <Icon className="h-3 w-3" />
      {range[0] > 0 ? "+" : ""}{range[0].toFixed(2)}% to {range[1] > 0 ? "+" : ""}{range[1].toFixed(2)}% real
    </span>
  );
}

function InvestmentCard({ investment, inflation }: { investment: InvestmentOption; inflation: number }) {
  const CategoryIcon = categoryIcons[investment.category] || CircleDollarSign;

  return (
    <Card className="overflow-visible" data-testid={`investment-card-${investment.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3 p-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryIcon className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-sm font-bold tracking-tight" data-testid={`text-investment-name-${investment.id}`}>
              {investment.name}
            </h3>
          </div>
          <Badge variant="secondary" className="text-[9px] uppercase tracking-wider" data-testid={`badge-category-${investment.id}`}>
            {investment.category}
          </Badge>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-lg font-bold font-mono tabular-nums text-foreground" data-testid={`text-yield-${investment.id}`}>
            {investment.nominalReturnRange[0]}–{investment.nominalReturnRange[1]}%
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Nominal</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <p className="text-xs text-muted-foreground leading-relaxed" data-testid={`text-description-${investment.id}`}>
          {investment.description}
        </p>

        {investment.tenors && investment.tenors.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Tenor Breakdown</span>
            <div className="space-y-1">
              {investment.tenors.map((tenor: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs" data-testid={`tenor-row-${investment.id}-${i}`}>
                  <span className="text-muted-foreground">{tenor.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums font-medium text-foreground">
                      {tenor.yieldRange[0]}–{tenor.yieldRange[1]}%
                    </span>
                    {tenor.notes && (
                      <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">{tenor.notes}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px]">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Risk:</span>
              <span className={cn("font-semibold", riskColors[investment.riskLevel])} data-testid={`text-risk-${investment.id}`}>
                {investment.riskLevel}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px]">
              <Droplets className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Liquidity:</span>
              <span className="text-muted-foreground font-medium" data-testid={`text-liquidity-${investment.id}`}>
                {investment.liquidity}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px]">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Inflation Shield:</span>
              <span className={cn("font-medium", protectionColors[investment.inflationProtection])} data-testid={`text-protection-${investment.id}`}>
                {investment.inflationProtection}
              </span>
            </span>
          </div>
          {investment.realYieldRange && (
            <RealYieldBadge range={investment.realYieldRange} inflation={inflation} />
          )}
        </div>

        <p className="text-[10px] text-muted-foreground/60 italic" data-testid={`text-bestfor-${investment.id}`}>
          {investment.bestFor}
        </p>
      </CardContent>
    </Card>
  );
}

export default function InvestmentsPage() {
  const qc = useQueryClient();
  const { data, isLoading, dataUpdatedAt } = useQuery<InvestmentLandscapeData>({
    queryKey: ["/api/investments"],
    refetchInterval: 30 * 1000,
  });

  const { data: etfData, isLoading: etfLoading } = useQuery<EtfAllocationData>({
    queryKey: ["/api/etf/allocation"],
    refetchInterval: 60 * 1000,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshLabel, setRefreshLabel] = useState("--");

  useEffect(() => {
    if (!dataUpdatedAt) return;
    const update = () => {
      const seconds = Math.floor((Date.now() - dataUpdatedAt) / 1000);
      if (seconds < 5) setRefreshLabel("just now");
      else if (seconds < 60) setRefreshLabel(`${seconds}s ago`);
      else setRefreshLabel(`${Math.floor(seconds / 60)}m ago`);
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([
      qc.invalidateQueries({ queryKey: ["/api/investments"] }),
      qc.invalidateQueries({ queryKey: ["/api/etf/allocation"] }),
    ]).then(() => {
      setTimeout(() => setIsRefreshing(false), 600);
    });
  };

  if (isLoading) return <InvestmentSkeleton />;
  if (!data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
        <CircleDollarSign className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-semibold">No Investment Data</h3>
        <p className="text-sm text-muted-foreground mt-1">Investment landscape data is currently unavailable.</p>
      </div>
    </div>
  );

  const hasEtfData = etfData && etfData.etfSignals && etfData.etfSignals.length > 0;

  return (
    <div className="space-y-6 p-4 md:p-6" data-testid="investments-page">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight" data-testid="text-page-title">Investment Intelligence</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">Live</span>
            </div>
            <span className="text-[10px] text-muted-foreground/60 font-mono" data-testid="text-investments-refresh">refreshed {refreshLabel}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefresh} data-testid="button-refresh-investments">
              <RefreshCw className={cn("h-3 w-3 transition-transform", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Macro-driven ETF allocation signals and Nigeria's investment yield environment. Real yields calculated against {data.currentInflation.toFixed(2)}% inflation (CPI).
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <MacroPill label="CPI" value={`${data.currentInflation.toFixed(2)}%`} />
        <MacroPill label="MPR" value={`${data.currentMpr.toFixed(2)}%`} />
        {data.currentTbillRate != null && <MacroPill label="T-Bill" value={`${data.currentTbillRate.toFixed(2)}%`} />}
        <MacroPill label="FX" value={`${data.fxRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN`} />
      </div>

      {etfLoading && (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
        </div>
      )}

      {hasEtfData && (
        <>
          <RegimeBanner regime={etfData.regime} lastUpdated={etfData.lastUpdated} />
          <RiskPanel regime={etfData.regime} />
          <EtfStrategyTable signals={etfData.etfSignals} prices={etfData.etfPrices} />
          <FactorRotation factors={etfData.factorSignals} />
        </>
      )}

      {!etfLoading && !hasEtfData && (
        <Card className="border-dashed" data-testid="card-etf-pending">
          <CardContent className="flex items-center gap-3 p-4">
            <Activity className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">ETF Intelligence Loading</p>
              <p className="text-xs text-muted-foreground">ETF allocation signals will appear after the next engine refresh cycle (every 6 hours).</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="investments-grid">
        {data.investments.map((inv) => (
          <InvestmentCard key={inv.id} investment={inv} inflation={data.currentInflation} />
        ))}
      </div>

      <Card data-testid="card-comparison">
        <CardHeader className="flex flex-row items-center gap-2 pb-3 p-4">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Comparison Matrix</h3>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" data-testid="table-comparison">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground uppercase tracking-wider">Investment</th>
                  <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Nominal Return</th>
                  <th className="text-right py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Real Return</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Inflation Hedge</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Liquidity</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground uppercase tracking-wider">Volatility</th>
                  <th className="text-center py-2 pl-3 font-semibold text-muted-foreground uppercase tracking-wider">Risk</th>
                </tr>
              </thead>
              <tbody>
                {data.investments.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50 last:border-0" data-testid={`comparison-row-${inv.id}`}>
                    <td className="py-2.5 pr-3 font-medium text-foreground whitespace-nowrap">{inv.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-foreground whitespace-nowrap">
                      {inv.nominalReturnRange[0]}–{inv.nominalReturnRange[1]}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      {inv.realYieldRange && (
                        <span className={cn(
                          (inv.realYieldRange[0] + inv.realYieldRange[1]) / 2 > 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {inv.realYieldRange[0] > 0 ? "+" : ""}{inv.realYieldRange[0].toFixed(2)} to {inv.realYieldRange[1] > 0 ? "+" : ""}{inv.realYieldRange[1].toFixed(2)}%
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={cn("text-[10px] font-semibold uppercase", protectionColors[inv.inflationProtection])}>
                        {inv.inflationProtection}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground whitespace-nowrap">{inv.liquidity}</td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground whitespace-nowrap">{inv.volatility}</td>
                    <td className="py-2.5 pl-3 text-center whitespace-nowrap">
                      <span className={cn("text-[10px] font-semibold", riskColors[inv.riskLevel])}>
                        {inv.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-context">
        <CardHeader className="flex flex-row items-center gap-2 pb-3 p-4">
          <Info className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Market Context</h3>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nigeria is currently in a <span className="text-foreground font-medium">high-inflation / high-yield environment</span>, which creates a key paradox:
            fixed income gives high coupons but may not grow real wealth. Real returns tend to come from assets that reprice, not assets that pay fixed income.
          </p>
          <div className="space-y-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Typical Sophisticated Allocation</span>
            <div className="flex flex-col gap-1.5">
              <AllocationBar label="Short-term instruments (T-Bills, MMF)" range="30-50%" color="bg-teal-500" width="40%" />
              <AllocationBar label="Equities (inflation hedge)" range="30-40%" color="bg-emerald-500" width="35%" />
              <AllocationBar label="Tactical bonds or alternatives" range="10-20%" color="bg-amber-500" width="15%" />
              <AllocationBar label="Property or private deals" range="5-15%" color="bg-primary" width="10%" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60 italic mt-2">
            These are market ranges (what investors are currently seeing), not fixed quotes. Actual rates vary by auction, institution, and entry timing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function MacroPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono" data-testid={`macro-pill-${label.toLowerCase()}`}>
      <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </span>
  );
}

function AllocationBar({ label, range, color, width }: { label: string; range: string; color: string; width: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums text-foreground font-medium">{range}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width }} />
      </div>
    </div>
  );
}
