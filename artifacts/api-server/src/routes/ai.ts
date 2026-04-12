import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, mmRatesTable, cbnMarketDataTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { fetchGeCpTokens, fetchAllDeals, isGetEquityConfigured } from "../lib/getequity-client";

const AI_BASE_URL = process.env.YIELDDESK_AI_BASE_URL || "http://209.38.100.198:8000";
const AI_TENANT_ID = process.env.YIELDDESK_AI_TENANT_ID || "yielddesk";

function getAiHeaders(): Record<string, string> {
  const apiKey = process.env.YIELDDESK_AI_API_KEY || "";
  return {
    "Content-Type": "application/json",
    "X-Tenant": AI_TENANT_ID,
    "X-Tenant-ID": AI_TENANT_ID,
    "X-API-Key": apiKey,
    "Authorization": `Bearer ${apiKey}`,
  };
}

async function runAiPrompt(prompt: string, taskType: string = "fast"): Promise<string> {
  const res = await fetch(`${AI_BASE_URL}/v1/runs`, {
    method: "POST",
    headers: getAiHeaders(),
    body: JSON.stringify({ prompt, task_type: taskType }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI platform error (${res.status}): ${err}`);
  }
  const data = await res.json() as any;
  return data.text || data.result || data.output || JSON.stringify(data);
}

function isAiConfigured(): boolean {
  return !!(process.env.YIELDDESK_AI_API_KEY && process.env.YIELDDESK_AI_BASE_URL);
}

const router: IRouter = Router();

router.post("/ai/market-brief", requireAuth, async (_req, res): Promise<void> => {
  try {
    if (!isAiConfigured()) {
      res.status(503).json({ error: "AI integration not configured" });
      return;
    }

    const fmdqRates = await db
      .select()
      .from(mmRatesTable)
      .where(eq(mmRatesTable.source, "FMDQ"))
      .orderBy(desc(mmRatesTable.date))
      .limit(20);

    const manualRates = await db
      .select()
      .from(mmRatesTable)
      .where(eq(mmRatesTable.source, "MANUAL"))
      .orderBy(desc(mmRatesTable.date))
      .limit(10);

    const ntbProxy = await db
      .select()
      .from(cbnMarketDataTable)
      .where(eq(cbnMarketDataTable.securityType, "NTB"))
      .orderBy(desc(cbnMarketDataTable.auctionDate))
      .limit(6);

    const omoProxy = await db
      .select()
      .from(cbnMarketDataTable)
      .where(eq(cbnMarketDataTable.securityType, "OMO"))
      .orderBy(desc(cbnMarketDataTable.auctionDate))
      .limit(6);

    let geCpData: any[] = [];
    if (isGetEquityConfigured()) {
      try {
        geCpData = await fetchGeCpTokens();
      } catch {}
    }

    const ratesContext = JSON.stringify({
      ntbAuctions: ntbProxy.map(r => ({
        tenor: r.tenor,
        stopRate: r.stopRate,
        date: r.auctionDate,
      })),
      omoAuctions: omoProxy.map(r => ({
        tenor: r.tenor,
        stopRate: r.stopRate,
        date: r.auctionDate,
      })),
      fmdqRates: fmdqRates.map(r => ({
        type: r.rateType,
        tenor: r.tenor,
        rate: r.rate,
        date: r.date,
      })),
      manualEntries: manualRates.map(r => ({
        type: r.rateType,
        tenor: r.tenor,
        rate: r.rate,
        date: r.date,
        notes: r.notes,
      })),
      getEquityCp: geCpData.slice(0, 10).map((t: any) => ({
        name: t.name,
        interest: t.interest,
        tenor: t.tenor,
        risk: t.risk,
        type: t.investment_type,
      })),
    }, null, 0);

    const prompt = `You are a senior Nigerian fixed income market analyst at a top-tier investment bank. You provide concise, actionable market intelligence for institutional investors.

Your analysis should cover:
1. **Market Snapshot** — Current rate levels across NTB, OMO, FMDQ (NIBOR, OBB, Repo), and CP markets
2. **Trend Analysis** — Direction of rates (tightening/easing), notable movements, spread dynamics
3. **Anomalies & Signals** — Any unusual rate movements, dislocations, or arbitrage opportunities
4. **Strategic Implications** — What this means for portfolio positioning (favor short/long duration, CP vs bonds, etc.)
5. **Risk Factors** — Key risks to watch (CBN policy, liquidity, FX pressure, etc.)

Keep it professional, data-driven, and under 400 words. Use bullet points for clarity. Reference specific rates and dates where available. Currency is NGN.

Generate a market intelligence brief based on the following current market data:

${ratesContext}`;

    const brief = await runAiPrompt(prompt, "fast");
    res.json({ brief, generatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("AI market brief error:", err);
    res.status(500).json({ error: "Failed to generate market brief" });
  }
});

router.post("/ai/deal-screening", requireAuth, async (req, res): Promise<void> => {
  try {
    if (!isAiConfigured()) {
      res.status(503).json({ error: "AI integration not configured" });
      return;
    }
    if (!isGetEquityConfigured()) {
      res.status(400).json({ error: "GetEquity API not configured" });
      return;
    }

    const deals = await fetchAllDeals();

    const ntbRates = await db
      .select()
      .from(cbnMarketDataTable)
      .where(eq(cbnMarketDataTable.securityType, "NTB"))
      .orderBy(desc(cbnMarketDataTable.auctionDate))
      .limit(3);

    const benchmarkRate = ntbRates.length > 0
      ? Math.max(...ntbRates.map(r => parseFloat(String(r.stopRate ?? "0"))))
      : 18;

    const portfolioContext = req.body?.portfolio || null;

    const openDeals = deals.filter((d: any) => !d.completed_raise && !d.closed && !d.exited);
    const topDeals = openDeals.slice(0, 12);

    const dealLines = topDeals.map((d: any) => {
      const raisePct = d.raise_amount > 0 ? ((d.total_raised / d.raise_amount) * 100).toFixed(0) : "0";
      return `${d.name}(${d.symbol}): ${d.interest}% rate, ${d.tenor}d tenor, ${d.risk} risk, ${d.rating||'-'} rating, ${d.custodian||'-'} custodian, ₦${d.min_trade?.buy||0} min, ${raisePct}% raised, ${d.investment_category||d.investment_type}`;
    }).join("\n");

    const prompt = `You are a Nigerian fixed income deal screener. NTB benchmark: ${benchmarkRate}%. Screen these ${topDeals.length} open GetEquity deals (of ${deals.length} total). Rate each: Strong Buy/Buy/Hold/Avoid. Give Top 3 picks, Deals to Watch, and Avoid list. Use bullet points, under 400 words.

Deals:
${dealLines}`;

    const analysis = await runAiPrompt(prompt, "fast");
    res.json({ analysis, dealsAnalyzed: deals.length, benchmarkRate, generatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("AI deal screening error:", err);
    res.status(500).json({ error: "Failed to generate deal screening" });
  }
});

export default router;
