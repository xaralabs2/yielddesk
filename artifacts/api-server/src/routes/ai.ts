import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, mmRatesTable, cbnMarketDataTable, holdingsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { fetchGeCpTokens, fetchAllDeals, isGetEquityConfigured } from "../lib/getequity-client";

const AI_BASE_URL = process.env.YIELDDESK_AI_BASE_URL || "http://209.38.100.198:8000";
const AI_TENANT_ID = process.env.YIELDDESK_AI_TENANT_ID || "yielddesk";
function getAiHeaders(): Record<string, string> { const apiKey = process.env.YIELDDESK_AI_API_KEY || ""; return { "Content-Type": "application/json", "X-Tenant": AI_TENANT_ID, "X-Tenant-ID": AI_TENANT_ID, "X-API-Key": apiKey, "Authorization": `Bearer ${apiKey}` }; }
async function runAiPrompt(prompt: string, taskType: string = "fast"): Promise<string> { const res = await fetch(`${AI_BASE_URL}/v1/runs`, { method: "POST", headers: getAiHeaders(), body: JSON.stringify({ prompt, task_type: taskType }) }); if (!res.ok) throw new Error(`AI platform error (${res.status}): ${await res.text()}`); const data = await res.json() as any; return data.text || data.result || data.output || JSON.stringify(data); }
function isAiConfigured(): boolean { return !!process.env.YIELDDESK_AI_API_KEY; }
const router: IRouter = Router();

router.post("/ai/market-brief", requireAuth, async (_req, res): Promise<void> => {
  try {
    if (!isAiConfigured()) { res.status(503).json({ error: "AI integration not configured" }); return; }
    const fmdqRates = await db.select().from(mmRatesTable).where(eq(mmRatesTable.source, "FMDQ")).orderBy(desc(mmRatesTable.date)).limit(20);
    const manualRates = await db.select().from(mmRatesTable).where(eq(mmRatesTable.source, "MANUAL")).orderBy(desc(mmRatesTable.date)).limit(10);
    const ntbProxy = await db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "NTB")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(6);
    const omoProxy = await db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "OMO")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(6);
    let geCpData: any[] = []; if (isGetEquityConfigured()) { try { geCpData = await fetchGeCpTokens(); } catch {} }
    const ratesContext = JSON.stringify({ ntbAuctions: ntbProxy.map(r => ({ tenor: r.tenor, stopRate: r.marginalRate, trueYield: r.trueYield, date: r.auctionDate })), omoAuctions: omoProxy.map(r => ({ tenor: r.tenor, stopRate: r.marginalRate, trueYield: r.trueYield, date: r.auctionDate })), fmdqRates: fmdqRates.map(r => ({ type: r.rateType, tenor: r.tenor, rate: r.rate, date: r.date })), manualEntries: manualRates.map(r => ({ type: r.rateType, tenor: r.tenor, rate: r.rate, date: r.date, notes: r.notes })), getEquityCp: geCpData.slice(0, 10).map((t: any) => ({ name: t.name, interest: t.interest, tenor: t.tenor, risk: t.risk, type: t.investment_type })) });
    const prompt = `You are a senior Nigerian fixed income market analyst. Give a concise market snapshot, trends, anomalies, portfolio implications and risks. Stay under 400 words. Current data: ${ratesContext}`;
    res.json({ brief: await runAiPrompt(prompt, "fast"), generatedAt: new Date().toISOString() });
  } catch (err: any) { console.error("AI market brief error:", err); res.status(500).json({ error: "Failed to generate market brief" }); }
});

router.post("/ai/deal-screening", requireAuth, async (req, res): Promise<void> => {
  try {
    if (!isAiConfigured()) { res.status(503).json({ error: "AI integration not configured" }); return; }
    if (!isGetEquityConfigured()) { res.status(400).json({ error: "GetEquity API not configured" }); return; }
    const deals = await fetchAllDeals();
    const ntbRates = await db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "NTB")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(3);
    const benchmarkRate = ntbRates.length > 0 ? Math.max(...ntbRates.map(r => Number(r.marginalRate ?? 0))) : 18;
    const topDeals = deals.filter((d: any) => !d.completed_raise && !d.closed && !d.exited).slice(0, 12);
    const dealLines = topDeals.map((d: any) => `${d.name}(${d.symbol}): ${d.interest}% rate, ${d.tenor}d, ${d.risk} risk, ${d.rating||'-'} rating`).join("\n");
    const prompt = `You are a Nigerian fixed income deal screener. NTB benchmark: ${benchmarkRate}%. Rate each Strong Buy/Buy/Hold/Avoid and give top picks, watch and avoid lists. Under 400 words.\n${dealLines}`;
    res.json({ analysis: await runAiPrompt(prompt, "fast"), dealsAnalyzed: deals.length, benchmarkRate, generatedAt: new Date().toISOString() });
  } catch (err: any) { console.error("AI deal screening error:", err); res.status(500).json({ error: "Failed to generate deal screening" }); }
});

router.post("/ai/portfolio-cio-brief", requireAuth, async (req, res): Promise<void> => {
  try {
    if (!isAiConfigured()) { res.status(503).json({ error: "AI integration not configured" }); return; }
    const holdings = await db.select().from(holdingsTable).where(eq(holdingsTable.userId, req.user!.userId));
    const ntb = await db.select().from(cbnMarketDataTable).where(eq(cbnMarketDataTable.securityType, "NTB")).orderBy(desc(cbnMarketDataTable.auctionDate)).limit(3);
    const fmdq = await db.select().from(mmRatesTable).where(eq(mmRatesTable.source, "FMDQ")).orderBy(desc(mmRatesTable.date)).limit(5);
    const review = req.body?.review || null;
    const context = JSON.stringify({ holdings: holdings.filter(h => h.status === "ACTIVE").map(h => ({ issuer: h.issuer, type: h.type, amount: h.amount, rate: h.rate, maturityDate: h.maturityDate })), allocationReview: review, ntb: ntb.map(r => ({ tenor: r.tenor, stopRate: r.marginalRate, trueYield: r.trueYield, date: r.auctionDate })), moneyMarket: fmdq.map(r => ({ type: r.rateType, tenor: r.tenor, rate: r.rate, date: r.date })) });
    const prompt = `Act as CIO for a Nigerian investor with a ₦60m policy portfolio spanning NGX equities, Treasury Bills, money-market funds, FGN bonds and a small private/startup allocation. Use ONLY the supplied facts. Do not invent equity prices, P/E ratios, dividend yields or earnings. If live equity valuation data is absent, explicitly say so. Produce: 1) What changed/needs attention, 2) allocation actions, 3) fixed-income context, 4) risks, 5) next checks. Under 450 words. Context: ${context}`;
    res.json({ brief: await runAiPrompt(prompt, "fast"), generatedAt: new Date().toISOString(), dataGuardrail: "No invented equity market data; missing live data must be disclosed." });
  } catch (err: any) { console.error("AI portfolio CIO brief error:", err); res.status(500).json({ error: "Failed to generate CIO brief" }); }
});

export default router;
