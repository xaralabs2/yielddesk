import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, mmRatesTable, cbnMarketDataTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { fetchGeCpTokens, fetchAllDeals, isGetEquityConfigured } from "../lib/getequity-client";
import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return _openai;
}

const router: IRouter = Router();

router.post("/ai/market-brief", requireAuth, async (_req, res): Promise<void> => {
  try {
    if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
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

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a senior Nigerian fixed income market analyst at a top-tier investment bank. You provide concise, actionable market intelligence for institutional investors.

Your analysis should cover:
1. **Market Snapshot** — Current rate levels across NTB, OMO, FMDQ (NIBOR, OBB, Repo), and CP markets
2. **Trend Analysis** — Direction of rates (tightening/easing), notable movements, spread dynamics
3. **Anomalies & Signals** — Any unusual rate movements, dislocations, or arbitrage opportunities
4. **Strategic Implications** — What this means for portfolio positioning (favor short/long duration, CP vs bonds, etc.)
5. **Risk Factors** — Key risks to watch (CBN policy, liquidity, FX pressure, etc.)

Keep it professional, data-driven, and under 400 words. Use bullet points for clarity. Reference specific rates and dates where available. Currency is NGN.`
        },
        {
          role: "user",
          content: `Generate a market intelligence brief based on the following current market data:\n\n${ratesContext}`
        }
      ],
    });

    const brief = completion.choices[0]?.message?.content || "Unable to generate market brief.";
    res.json({ brief, generatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("AI market brief error:", err);
    res.status(500).json({ error: "Failed to generate market brief" });
  }
});

router.post("/ai/deal-screening", requireAuth, async (req, res): Promise<void> => {
  try {
    if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
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

    const dealsContext = JSON.stringify({
      benchmark: {
        ntbRate: benchmarkRate,
        description: "Highest recent NTB auction stop rate",
      },
      portfolio: portfolioContext,
      deals: deals.slice(0, 30).map((d: any) => ({
        id: d._id,
        name: d.name,
        symbol: d.symbol,
        type: d.investment_type,
        category: d.investment_category,
        interest: d.interest,
        tenor: d.tenor,
        risk: d.risk,
        rating: d.rating,
        custodian: d.custodian,
        price: d.price?.buy,
        minInvestment: d.min_trade?.buy,
        raiseAmount: d.raise_amount,
        totalRaised: d.total_raised,
        raisePct: d.raise_amount > 0 ? ((d.total_raised / d.raise_amount) * 100).toFixed(1) : 0,
        isOpen: !d.completed_raise && !d.closed && !d.exited,
        maturity: d.maturity,
        payoutFrequency: d.payout_frequency,
        dividend: d.dividend,
        managementFee: d.management_fee,
      })),
    }, null, 0);

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a senior Nigerian fixed income analyst and deal screener at an institutional investment firm. You evaluate deals from the GetEquity platform for institutional investors.

For each noteworthy deal, provide:
- **Attractiveness Rating**: Strong Buy / Buy / Hold / Avoid
- **Spread vs Benchmark**: How the deal's rate compares to the NTB benchmark
- **Risk Assessment**: Based on risk rating, custodian presence, raise completion, and deal structure
- **Portfolio Fit**: How this could fit into a 3-pillar portfolio (Stability/Inflation Hedge/Strategic)

Your analysis should:
1. **Top Picks** — Rank the best 3-5 open deals with clear reasoning
2. **Deals to Watch** — Any deals that are interesting but have caveats
3. **Avoid List** — Any deals with red flags (high risk, no custodian, low raise completion, etc.)
4. **Market Context** — How these deals compare to current NTB/OMO rates

${portfolioContext ? "Consider the user's portfolio context when making recommendations — identify deals that fill gaps in their portfolio allocation." : ""}

Keep it concise, data-driven, under 500 words. Use bullet points. Reference specific deal names and rates. Currency is NGN.`
        },
        {
          role: "user",
          content: `Screen and rank these GetEquity deals for an institutional investor:\n\n${dealsContext}`
        }
      ],
    });

    const analysis = completion.choices[0]?.message?.content || "Unable to generate deal screening.";
    res.json({ analysis, dealsAnalyzed: deals.length, benchmarkRate, generatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("AI deal screening error:", err);
    res.status(500).json({ error: "Failed to generate deal screening" });
  }
});

export default router;
