import { Landmark, Wallet, BarChart3, Building2 } from "lucide-react";

export const categoryIcons: Record<string, typeof Landmark> = {
  "Fixed Income": Landmark,
  "Cash & Near-Cash": Wallet,
  "Equities": BarChart3,
  "Real Assets": Building2,
};

export const riskColors: Record<string, string> = {
  "Very Low": "text-emerald-500",
  "Low": "text-teal-500",
  "Medium": "text-amber-500",
  "High": "text-rose-500",
};

export const protectionColors: Record<string, string> = {
  "Weak": "text-rose-400",
  "Weak-Moderate": "text-amber-400",
  "Moderate": "text-teal-400",
  "Strong": "text-emerald-400",
};

export const REGIME_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  GREEN: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", badge: "bg-emerald-500" },
  YELLOW: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", badge: "bg-amber-500" },
  ORANGE: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", badge: "bg-orange-500" },
  RED: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", badge: "bg-rose-500" },
  GREY: { bg: "bg-muted/50", border: "border-border", text: "text-muted-foreground", badge: "bg-muted-foreground" },
};

export const SIGNAL_COLORS: Record<string, string> = {
  BUY: "text-emerald-400",
  HOLD: "text-amber-400",
  SELL: "text-rose-400",
  UNDERWEIGHT: "text-rose-400",
  OVERWEIGHT: "text-emerald-400",
  NEUTRAL: "text-muted-foreground",
};

export const SIGNAL_BG: Record<string, string> = {
  BUY: "bg-emerald-500/10 border-emerald-500/20",
  HOLD: "bg-amber-500/10 border-amber-500/20",
  SELL: "bg-rose-500/10 border-rose-500/20",
};

export function formatDate(dateStr: string | null) {
  if (!dateStr) return "---";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}
