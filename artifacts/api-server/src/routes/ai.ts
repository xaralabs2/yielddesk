import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, mmRatesTable, cbnMarketDataTable, holdingsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { fetchGeCpTokens, fetchAllDeals, isGetEquityConfigured } from "../lib/getequity-client";
import { runPolicyCheckedAi, YIELDDESK_AI_BOUNDARY } from "../lib/ai-policy";

interface FetchResponseLike {
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

const AI_BASE_URL = process.env.YIELDDESK_AI_BASE_URL || "http://209.38.100.198:8000";
const AI_TENANT_ID = process.env.YIELDDESK_AI_TENANT_ID || "yielddesk";

function getAiHeaders(): Record<string, string> {
  const apiKey = process.env.YIELDDESK_AI_API_KEY || "";
  return {
    "Content-Type": "application/json",
    "X-Tenant": AI_TENANT_ID,
    "X-Tenant-ID": AI_TENANT_ID,
    "X-API-Key": apiKey,
    Authorization: `Bearer ${apiKey}`,
  };
}

async function runAiPrompt(prompt: string, taskType = "fast"): Promise<string> {
  const res = (await fetch(`${AI_BASE_URL}/v1/runs`, {
    method: "POST",
    headers: getAiHeaders(),
    body: JSON.stringify({ prompt: `${YIELDDESK_AI_BOUNDARY}\n\n${prompt}`, task_type: taskType }),
  })) as unknown as FetchResponseLike;
  if (!res.ok) throw new Error(`AI platform error (${res.status}): ${await res.text()}`);
  const data = await res.json() as any;
  return data.text || data.result || data.output || JSON.stringify(data);
}

async function policyCheckedPrompt(prompt: string, taskType = "fast") {
  return runPolicyCheckedAi(() => runAiPrompt(prompt, taskType));
}

function isAiConfigured() {
  return !!process.env.YIELDDESK_AI_API_KEY;
}

function handleAiError(label: string, err: unknown, res: any) {
  console.error(label, err);
  if (err instanceof Error && err.message.startsWith("AI_POLICY_BLOCKED")) {
    res.status(422).json({
      error: "The generated explanation crossed YieldDesk's information-only boundary and was not shown.",
      policyBlocked: true,
    });
    return;
  }
  res.status(500).json({ error: "Failed to generate explanation" });
}

const router: IRouter = Router();

router.post("/ai/market-brief", requireAuth, async (_req, res): Promise<void> => {
  try {
    if (!isAiConfigured()) { res.status(503).json({ error: "AI integration not configured" }); return; }
    const fmdqRates = await db.select().from(mmRatesTable).where(eq(mmRatesTable.source, "FMDQ")).orderBy(desc(mmRatesTable.date)).limit(20);
    const manualRates = await db.select().from(mmRatesTable).where(eq(mmRatesTable.source, "MANUAL")).orderBy(desc(mmRatesTable.date)).limit(10);
    const ntbProxy = await db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "NTB")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(6);
    const omoProxy = await db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "OMO")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(6);
    let geCpData: any[] = [];
    if (isGetEquityConfigured()) {
      try { geCpData = await fetchGeCpTokens(); } catch {}
    }
    const ratesContext = JSON.stringify({
      ntbAuctions: ntbProxy.map((row) => ({ tenor: row.tenor, stopRate: row.marginalRate, date: row.auctionDate })),
      omoAuctions: omoProxy.map((row) => ({ tenor: row.tenor, stopRate: row.marginalRate, date: row.auctionDate })),
      fmdqRates: fmdqRates.map((row) => ({ type: row.rateType, tenor: row.tenor, rate: row.rate, date: row.date })),
      manualEntries: manualRates.map((row) => ({ type: row.rateType, tenor: row.tenor, rate: row.rate, date: row.date, notes: row.notes })),
      getEquityCp: geCpData.slice(0, 10).map((row: any) => ({ name: row.name, interest: row.interest, tenor: row.tenor, risk: row.risk, type: row.investment_type })),
    });
    const prompt = `Create a concise general Nigerian fixed-income information brief. Describe observable rate differences, dates, missing or stale information, and general risks. Do not give portfolio implications or actions. Stay under 400 words. Current data: ${ratesContext}`;
    res.json({ brief: await policyCheckedPrompt(prompt), generatedAt: new Date().toISOString(), informationOnly: true });
  } catch (err) {
    handleAiError("AI market brief error", err, res);
  }
});

router.post("/ai/deal-screening", requireAuth, async (_req, res): Promise<void> => {
  try {
    if (!isAiConfigured()) { res.status(503).json({ error: "AI integration not configured" }); return; }
    if (!isGetEquityConfigured()) { res.status(400).json({ error: "GetEquity API not configured" }); return; }
    const deals = await fetchAllDeals();
    const ntbRates = await db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "NTB")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(3);
    const benchmarkRate = ntbRates.length > 0 ? Math.max(...ntbRates.map((row) => parseFloat(String(row.marginalRate ?? "0")))) : null;
    const comparisonRows = deals
      .filter((deal: any) => !deal.completed_raise && !deal.closed && !deal.exited)
      .slice(0, 12)
      .map((deal: any) => ({ name: deal.name, symbol: deal.symbol, statedRate: deal.interest, tenorDays: deal.tenor, providerRiskLabel: deal.risk, providerRating: deal.rating || null }));

    const prompt = `Produce an objective information summary of the supplied instruments. Compare only stated rate, tenor, provider-supplied labels, and missing information. Do not rank, score, select, shortlist, or issue a decision. Explicitly attribute provider labels. Under 400 words. Benchmark observation: ${benchmarkRate ?? "unavailable"}. Instruments: ${JSON.stringify(comparisonRows)}`;
    res.json({
      analysis: await policyCheckedPrompt(prompt),
      dealsAnalyzed: deals.length,
      benchmarkRate,
      generatedAt: new Date().toISOString(),
      informationOnly: true,
      legacyEndpoint: true,
    });
  } catch (err) {
    handleAiError("AI instrument comparison error", err, res);
  }
});

router.post("/ai/portfolio-cio-brief", requireAuth, async (req, res): Promise<void> => {
  try {
    if (!isAiConfigured()) { res.status(503).json({ error: "AI integration not configured" }); return; }
    const holdings = await db.select().from(holdingsTable).where(eq(holdingsTable.userId, req.user!.userId));
    const ntb = await db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "NTB")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(3);
    const fmdq = await db.select().from(mmRatesTable).where(eq(mmRatesTable.source, "FMDQ")).orderBy(desc(mmRatesTable.date)).limit(5);
    const context = JSON.stringify({
      userRecordedHoldings: holdings.filter((holding) => holding.status === "ACTIVE").map((holding) => ({ issuer: holding.issuer, type: holding.type, amount: holding.amount, rate: holding.rate, maturityDate: holding.maturityDate })),
      userSuppliedReview: req.body?.review || null,
      ntbObservations: ntb.map((row) => ({ tenor: row.tenor, stopRate: row.marginalRate, date: row.auctionDate })),
      moneyMarketObservations: fmdq.map((row) => ({ type: row.rateType, tenor: row.tenor, rate: row.rate, date: row.date })),
    });
    const prompt = `Summarize the supplied user-recorded holdings and market observations factually. State concentration, maturity dates, arithmetic allocation differences, source limitations, and missing information. Do not prescribe changes, allocations, next actions, or investment decisions. Under 450 words. Context: ${context}`;
    res.json({
      brief: await policyCheckedPrompt(prompt),
      generatedAt: new Date().toISOString(),
      informationOnly: true,
      legacyEndpoint: true,
      dataGuardrail: "No invented market data; missing data must be disclosed.",
    });
  } catch (err) {
    handleAiError("AI holdings explanation error", err, res);
  }
});

export default router;
