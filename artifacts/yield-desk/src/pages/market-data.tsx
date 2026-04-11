import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  TrendingUp,
  TrendingDown,
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
  Banknote,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

type InvestmentOption = {
  id: string;
  name: string;
  category: string;
  description: string;
  riskLevel: string;
  liquidity: string;
  volatility: string;
  inflationProtection: string;
  tenors?: { label: string; yieldRange: [number, number]; notes?: string }[];
  nominalReturnRange: [number, number];
  bestFor: string;
  realYieldRange?: [number, number];
};

type InvestmentLandscapeData = {
  investments: InvestmentOption[];
  currentInflation: number;
  currentMpr: number;
  currentTbillRate: number | null;
  fxRate: number;
};

type EtfSignal = {
  symbol: string;
  name: string;
  signal: string;
  confidence: number;
  reasoning: string;
  role: string;
  regime: string;
};

type EtfPrice = {
  symbol: string;
  price: number;
  change1d: number;
};

type FactorSignal = {
  factorType: string;
  signal: string;
  confidence: number;
  reasoning: string;
  symbol: string;
};

type EtfAllocationData = {
  regime: {
    name: string;
    code: string;
    color: string;
    confidence: number;
    summary: string;
  };
  etfSignals: EtfSignal[];
  etfPrices: EtfPrice[];
  factorSignals: FactorSignal[];
  lastUpdated: string | null;
};

interface RateEntry {
  rate: number;
  date: string;
}

interface RatesSummary {
  ntb: Record<string, RateEntry>;
  bonds: Record<string, RateEntry>;
  omo: Record<string, RateEntry>;
  lastUpdated: string | null;
}

interface MarketRecord {
  id: number;
  source: string;
  securityType: string;
  tenor: string;
  auctionDate: string | null;
  maturityDate: string | null;
  marginalRate: number | null;
  trueYield: number | null;
  amountOffered: number | null;
  totalSubscription: number | null;
  totalSuccessful: number | null;
  fetchedAt: string;
}

interface MarketData {
  ntb: MarketRecord[];
  bonds: MarketRecord[];
  omo: MarketRecord[];
}

interface PolicyRate {
  id: number;
  period: string;
  year: number;
  month: number;
  mpr: number | null;
  interBankCallRate: number | null;
  treasuryBill: number | null;
  savingsDeposit: number | null;
  oneMonthDeposit: number | null;
  threeMonthsDeposit: number | null;
  sixMonthsDeposit: number | null;
  twelveMonthsDeposit: number | null;
  primeLending: number | null;
  maxLending: number | null;
}

interface ExchangeRateEntry {
  id: number;
  currency: string;
  rateDate: string;
  buyingRate: number | null;
  centralRate: number | null;
  sellingRate: number | null;
}

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

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
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

function RealYieldBadge({ range }: { range: [number, number] }) {
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

function InvestmentCard({ investment }: { investment: InvestmentOption }) {
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
            <RealYieldBadge range={investment.realYieldRange} />
          )}
        </div>

        <p className="text-[10px] text-muted-foreground/60 italic" data-testid={`text-bestfor-${investment.id}`}>
          {investment.bestFor}
        </p>
      </CardContent>
    </Card>
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

function formatDate(dateStr: string | null) {
  if (!dateStr) return "---";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function SecurityTable({ records, showSubscription }: { records: MarketRecord[]; showSubscription?: boolean }) {
  if (records.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No data available</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
            <th className="px-4 py-3">Auction Date</th>
            <th className="px-4 py-3">Tenor</th>
            <th className="px-4 py-3">Maturity</th>
            <th className="px-4 py-3">Rate</th>
            {showSubscription && <th className="px-4 py-3">Subscription (N mn)</th>}
            {showSubscription && <th className="px-4 py-3">Allotted (N mn)</th>}
            <th className="px-4 py-3">Offered (N mn)</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
              <td className="px-4 py-3 text-muted-foreground">{formatDate(r.auctionDate)}</td>
              <td className="px-4 py-3">
                <Badge variant="outline" className="text-xs font-mono">{r.tenor}</Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(r.maturityDate)}</td>
              <td className="px-4 py-3 font-mono font-medium">
                {r.marginalRate != null ? `${r.marginalRate.toFixed(2)}%` : "---"}
              </td>
              {showSubscription && (
                <td className="px-4 py-3 font-mono">
                  {r.totalSubscription != null ? r.totalSubscription.toLocaleString() : "---"}
                </td>
              )}
              {showSubscription && (
                <td className="px-4 py-3 font-mono">
                  {r.totalSuccessful != null ? r.totalSuccessful.toLocaleString() : "---"}
                </td>
              )}
              <td className="px-4 py-3 font-mono">
                {r.amountOffered != null ? r.amountOffered.toLocaleString() : "---"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RateCard({ label, rate, tenor, threshold, icon: Icon }: { label: string; rate: number; tenor: string; threshold?: number; icon: typeof TrendingUp }) {
  const aboveThreshold = threshold != null && rate >= threshold;
  return (
    <Card className={aboveThreshold ? "border-l-4 border-l-success" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-2">
          <Icon className="w-3.5 h-3.5" /> {label}
        </div>
        <div className="text-2xl font-bold font-mono">{rate.toFixed(2)}%</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{tenor}</span>
          {threshold != null && (
            <Badge variant={aboveThreshold ? "default" : "outline"} className="text-[10px]">
              {aboveThreshold ? "ABOVE" : "BELOW"} {threshold}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketDataPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, dataUpdatedAt } = useQuery<InvestmentLandscapeData>({
    queryKey: ["/api/investments"],
    refetchInterval: 30 * 1000,
  });

  const { data: etfData, isLoading: etfLoading } = useQuery<EtfAllocationData>({
    queryKey: ["/api/etf/allocation"],
    refetchInterval: 60 * 1000,
  });

  const { data: rates, isLoading: ratesLoading } = useQuery<RatesSummary>({
    queryKey: ["/api/cbn/rates-summary"],
    queryFn: async () => {
      const res = await fetch("/api/cbn/rates-summary", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch rates");
      return res.json();
    },
  });

  const { data: marketData, isLoading: dataLoading } = useQuery<MarketData>({
    queryKey: ["/api/cbn/market-data"],
    queryFn: async () => {
      const res = await fetch("/api/cbn/market-data", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch market data");
      return res.json();
    },
  });

  const { data: policyRates } = useQuery<PolicyRate[]>({
    queryKey: ["/api/cbn/policy-rates"],
    queryFn: async () => {
      const res = await fetch("/api/cbn/policy-rates", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch policy rates");
      return res.json();
    },
  });

  const { data: fxData } = useQuery<{ rates: Record<string, ExchangeRateEntry[]>; latest: ExchangeRateEntry[] }>({
    queryKey: ["/api/cbn/exchange-rates"],
    queryFn: async () => {
      const res = await fetch("/api/cbn/exchange-rates", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch exchange rates");
      return res.json();
    },
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshLabel, setRefreshLabel] = useState("--");
  const [syncing, setSyncing] = useState(false);
  const [showCbnData, setShowCbnData] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/etf/allocation"] }),
    ]).then(() => {
      setTimeout(() => setIsRefreshing(false), 600);
    });
  };

  const handleCbnSync = async () => {
    setSyncing(true);
    try {
      const headers = getAuthHeaders() as Record<string, string>;
      headers["Content-Type"] = "application/json";
      const res = await fetch("/api/cbn/sync-all", { method: "POST", headers });
      const result = await res.json();
      if (result.success) {
        toast({ title: "All data refreshed", description: "Market data, policy rates, and exchange rates updated" });
        queryClient.invalidateQueries({ queryKey: ["/api/cbn/rates-summary"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cbn/market-data"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cbn/policy-rates"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cbn/exchange-rates"] });
      } else {
        toast({ title: "Sync failed", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Sync failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) {
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

  if (!data) {
    return (
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
  }

  const hasEtfData = etfData && etfData.etfSignals && etfData.etfSignals.length > 0;

  const ntbEntries = Object.entries(rates?.ntb ?? {}).sort((a, b) => {
    const tenorA = parseInt(a[0]) || 0;
    const tenorB = parseInt(b[0]) || 0;
    return tenorA - tenorB;
  });
  const bondEntries = Object.entries(rates?.bonds ?? {});
  const omoEntries = Object.entries(rates?.omo ?? {});

  return (
    <div className="space-y-6 p-4 md:p-6" data-testid="market-data-page">
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
          <InvestmentCard key={inv.id} investment={inv} />
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

      <Card data-testid="card-cbn-raw-data">
        <CardHeader className="p-4">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowCbnData(!showCbnData)}
          >
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">CBN Primary Market Data</h3>
              {rates?.lastUpdated && (
                <span className="text-[9px] text-muted-foreground/60 font-mono">
                  Synced: {new Date(rates.lastUpdated).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 h-7 text-xs"
                onClick={(e) => { e.stopPropagation(); handleCbnSync(); }}
                disabled={syncing}
                data-testid="button-sync-cbn"
              >
                <RefreshCw className={cn("w-3 h-3", syncing && "animate-spin")} />
                {syncing ? "Syncing..." : "Sync CBN"}
              </Button>
              {showCbnData ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>
        </CardHeader>
        {showCbnData && (
          <CardContent className="p-4 pt-0 space-y-6">
            {(ratesLoading || dataLoading) ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {ntbEntries.map(([tenor, entry]) => (
                    <RateCard key={tenor} label={`NTB ${tenor}`} rate={entry.rate} tenor={`Auction: ${formatDate(entry.date)}`} threshold={18} icon={TrendingUp} />
                  ))}
                  {bondEntries.slice(0, 2).map(([tenor, entry]) => (
                    <RateCard key={tenor} label={`FGN Bond ${tenor}`} rate={entry.rate} tenor={`Auction: ${formatDate(entry.date)}`} threshold={17} icon={Banknote} />
                  ))}
                  {omoEntries.slice(0, 2).map(([tenor, entry]) => (
                    <RateCard key={tenor} label={`OMO ${tenor}`} rate={entry.rate} tenor={`Auction: ${formatDate(entry.date)}`} icon={BarChart3} />
                  ))}
                </div>

                <Card className="border-l-4 border-l-primary" data-testid="card-rates-summary">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Decision Engine Input — CP Rate</div>
                        <div className="text-3xl font-bold font-mono">
                          {ntbEntries.length > 0 ? `${ntbEntries[ntbEntries.length - 1][1].rate.toFixed(2)}%` : "---"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">364-day NTB marginal rate (proxy for CP)</div>
                      </div>
                      <div className="w-px h-12 bg-border hidden md:block" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Decision Engine Input — Bond Yield</div>
                        <div className="text-3xl font-bold font-mono">
                          {bondEntries.length > 0 ? `${bondEntries[0][1].rate.toFixed(2)}%` : "---"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Latest FGN Bond auction rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="ntb" data-testid="tabs-market-data">
                  <TabsList>
                    <TabsTrigger value="ntb">Treasury Bills (NTB)</TabsTrigger>
                    <TabsTrigger value="bonds">FGN Bonds</TabsTrigger>
                    <TabsTrigger value="omo">OMO Bills</TabsTrigger>
                  </TabsList>
                  <TabsContent value="ntb">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <TrendingUp className="w-4 h-4" /> Nigerian Treasury Bills — Primary Market Auctions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <SecurityTable records={marketData?.ntb ?? []} showSubscription />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="bonds">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Banknote className="w-4 h-4" /> FGN Bonds — Auction Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <SecurityTable records={marketData?.bonds ?? []} showSubscription />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="omo">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <BarChart3 className="w-4 h-4" /> Open Market Operations (OMO)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <SecurityTable records={marketData?.omo ?? []} showSubscription />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card data-testid="card-policy-rates">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Landmark className="w-4 h-4" /> CBN Policy & Money Market Indicators
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {policyRates && policyRates.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                                <th className="px-4 py-3">Period</th>
                                <th className="px-4 py-3">MPR</th>
                                <th className="px-4 py-3">Interbank</th>
                                <th className="px-4 py-3">T-Bill</th>
                                <th className="px-4 py-3">Prime</th>
                                <th className="px-4 py-3">Max Lend</th>
                              </tr>
                            </thead>
                            <tbody>
                              {policyRates.slice(0, 12).map((r) => (
                                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                                  <td className="px-4 py-3 font-medium">{r.period}</td>
                                  <td className="px-4 py-3 font-mono">{r.mpr != null ? `${r.mpr.toFixed(2)}%` : "---"}</td>
                                  <td className="px-4 py-3 font-mono">{r.interBankCallRate != null ? `${r.interBankCallRate.toFixed(2)}%` : "---"}</td>
                                  <td className="px-4 py-3 font-mono">{r.treasuryBill != null ? `${r.treasuryBill.toFixed(2)}%` : "---"}</td>
                                  <td className="px-4 py-3 font-mono">{r.primeLending != null ? `${r.primeLending.toFixed(2)}%` : "---"}</td>
                                  <td className="px-4 py-3 font-mono">{r.maxLending != null ? `${r.maxLending.toFixed(2)}%` : "---"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-4">No policy rate data yet. Click Sync CBN to fetch.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card data-testid="card-exchange-rates">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <DollarSign className="w-4 h-4" /> CBN Official Exchange Rates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {fxData?.latest && fxData.latest.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                                <th className="px-4 py-3">Currency</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Buying</th>
                                <th className="px-4 py-3">Central</th>
                                <th className="px-4 py-3">Selling</th>
                              </tr>
                            </thead>
                            <tbody>
                              {fxData.latest.map((r) => (
                                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                                  <td className="px-4 py-3 font-medium">{r.currency}</td>
                                  <td className="px-4 py-3 text-muted-foreground">{formatDate(r.rateDate)}</td>
                                  <td className="px-4 py-3 font-mono">{r.buyingRate != null ? `₦${r.buyingRate.toFixed(2)}` : "---"}</td>
                                  <td className="px-4 py-3 font-mono font-medium">{r.centralRate != null ? `₦${r.centralRate.toFixed(2)}` : "---"}</td>
                                  <td className="px-4 py-3 font-mono">{r.sellingRate != null ? `₦${r.sellingRate.toFixed(2)}` : "---"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-4">No exchange rate data yet. Click Sync CBN to fetch.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {policyRates && policyRates.length > 0 && (
                  <Card data-testid="card-deposit-rates">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingDown className="w-4 h-4" /> Deposit Rate Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                              <th className="px-4 py-3">Period</th>
                              <th className="px-4 py-3">Savings</th>
                              <th className="px-4 py-3">1-Month</th>
                              <th className="px-4 py-3">3-Month</th>
                              <th className="px-4 py-3">6-Month</th>
                              <th className="px-4 py-3">12-Month</th>
                            </tr>
                          </thead>
                          <tbody>
                            {policyRates.slice(0, 12).map((r) => (
                              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                                <td className="px-4 py-3 font-medium">{r.period}</td>
                                <td className="px-4 py-3 font-mono">{r.savingsDeposit != null ? `${r.savingsDeposit.toFixed(2)}%` : "---"}</td>
                                <td className="px-4 py-3 font-mono">{r.oneMonthDeposit != null ? `${r.oneMonthDeposit.toFixed(2)}%` : "---"}</td>
                                <td className="px-4 py-3 font-mono">{r.threeMonthsDeposit != null ? `${r.threeMonthsDeposit.toFixed(2)}%` : "---"}</td>
                                <td className="px-4 py-3 font-mono">{r.sixMonthsDeposit != null ? `${r.sixMonthsDeposit.toFixed(2)}%` : "---"}</td>
                                <td className="px-4 py-3 font-mono">{r.twelveMonthsDeposit != null ? `${r.twelveMonthsDeposit.toFixed(2)}%` : "---"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
