import type { ParsedTransaction } from "../types";

export async function parseBrokerPdf(buffer: Buffer): Promise<ParsedTransaction> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const text = result.text;

  const type = extractTransactionType(text);
  const security = extractField(text, /Security\s*([A-Z][A-Z\s&]+?)(?:\n|$)/i)
    || extractField(text, /Security([A-Z][A-Z\s&]+?)(?:\n|Quantity)/i)
    || "Unknown";
  const quantity = extractNumber(text, /Quantity\s*([\d,]+)/i);
  const price = extractNumber(text, /Price\s*([\d,]+\.?\d*)/i);
  const grossAmount = extractAmount(text, /Gross\s*NGN\s*([\d,]+\.?\d*)/i) || (quantity * price);
  const totalAmount = extractAmount(text, /TOTAL\s*CONTRACT\s*AMOUNT\s*NGN\s*([\d,]+\.?\d*)/i) || grossAmount;
  const tradeDate = extractField(text, /Trade\s*Date:?\s*(\d{1,2}-\w{3}-\d{4})/i) || "";
  const settlementDate = extractField(text, /Settlement\s*Date\s*(\d{1,2}-\w{3}-\d{4})/i) || "";
  const broker = extractBroker(text);
  const fees = Math.round((totalAmount - grossAmount) * 100) / 100;

  return {
    security: security.trim(),
    ticker: security.trim().toUpperCase(),
    quantity,
    price,
    grossAmount,
    totalAmount,
    tradeDate,
    settlementDate,
    type,
    broker,
    fees,
  };
}

function extractTransactionType(text: string): "BUY" | "SELL" {
  if (/BUY\s+CONTRACT/i.test(text)) return "BUY";
  if (/SELL\s+CONTRACT/i.test(text)) return "SELL";
  if (/\bbuy\b/i.test(text)) return "BUY";
  return "SELL";
}

function extractField(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match ? match[1] || match[0] : null;
}

function extractNumber(text: string, pattern: RegExp): number {
  const match = text.match(pattern);
  if (!match) return 0;
  return parseFloat(match[1].replace(/,/g, ""));
}

function extractAmount(text: string, pattern: RegExp): number {
  const match = text.match(pattern);
  if (!match) return 0;
  return parseFloat(match[1].replace(/,/g, ""));
}

function extractBroker(text: string): string {
  if (/meristem/i.test(text)) return "Meristem Securities";
  if (/stanbic/i.test(text)) return "Stanbic IBTC Stockbrokers";
  if (/csl/i.test(text) || /cardinalstone/i.test(text)) return "CSL Stockbrokers";
  if (/chapel\s*hill/i.test(text)) return "Chapel Hill Denham";
  if (/rencap/i.test(text)) return "Renaissance Capital";
  if (/afrinvest/i.test(text)) return "Afrinvest Securities";
  if (/cordros/i.test(text)) return "Cordros Securities";
  return "Unknown Broker";
}
