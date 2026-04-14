export const PILLAR_COLORS: Record<string, string> = {
  Stability: "bg-teal-500",
  "Inflation Hedge": "bg-emerald-500",
  Strategic: "bg-amber-500",
};

export const PILLAR_TEXT_COLORS: Record<string, string> = {
  Stability: "text-teal-500",
  "Inflation Hedge": "text-emerald-500",
  Strategic: "text-amber-500",
};

export const PILLAR_KEYS: Record<string, string> = {
  STABILITY: "Stability",
  INFLATION: "Inflation Hedge",
  STRATEGIC: "Strategic",
};

export const REGIME_COLORS_MAP: Record<string, { text: string; bg: string }> = {
  GREEN: { text: "text-emerald-400", bg: "bg-emerald-500/10" },
  YELLOW: { text: "text-amber-400", bg: "bg-amber-500/10" },
  ORANGE: { text: "text-orange-400", bg: "bg-orange-500/10" },
  RED: { text: "text-rose-400", bg: "bg-rose-500/10" },
  GREY: { text: "text-muted-foreground", bg: "bg-muted/50" },
};

export const SIGNAL_COLORS_MAP: Record<string, string> = {
  BUY: "text-emerald-400",
  HOLD: "text-amber-400",
  SELL: "text-rose-400",
};

export const TICKER_ALIASES: Record<string, string> = {
  "ACCESSHOLDINGSPLC": "ACCESSCORP",
  "ACCESS HOLDINGS PLC": "ACCESSCORP",
  "ACCESS HOLDINGS": "ACCESSCORP",
  "ACCESSHOLDINGS": "ACCESSCORP",
  "ACCESS BANK": "ACCESSCORP",
  "ACCESS BANK PLC": "ACCESSCORP",
};
