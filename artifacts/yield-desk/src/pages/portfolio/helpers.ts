export function formatNgn(value: number): string {
  return `\u20A6${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `\u20A6${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `\u20A6${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `\u20A6${(value / 1_000).toFixed(2)}K`;
  return formatNgn(value);
}

export function normalizeTicker(raw: string): string {
  const TICKER_ALIASES: Record<string, string> = {
    "ACCESSHOLDINGSPLC": "ACCESSCORP",
    "ACCESS HOLDINGS PLC": "ACCESSCORP",
    "ACCESS HOLDINGS": "ACCESSCORP",
    "ACCESSHOLDINGS": "ACCESSCORP",
    "ACCESS BANK": "ACCESSCORP",
    "ACCESS BANK PLC": "ACCESSCORP",
  };
  const upper = raw.toUpperCase().trim();
  return TICKER_ALIASES[upper] || upper;
}
