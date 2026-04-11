import { Router, type IRouter } from "express";
import { eq, and, desc, sql, lte } from "drizzle-orm";
import { db, holdingsTable, signalsTable, alertsTable, dealsTable } from "@workspace/db";
import {
  GetDecisionResponse,
  GetPortfolioSummaryResponse,
  GetPortfolioAnalyticsResponse,
  GetDashboardSummaryResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { evaluateDecision } from "../lib/decision-engine";

const router: IRouter = Router();

async function getPortfolioData(userId: number) {
  const holdings = await db
    .select()
    .from(holdingsTable)
    .where(eq(holdingsTable.userId, userId));

  const totalCapital = holdings.reduce((sum, h) => sum + h.amount, 0);
  const activeHoldings = holdings.filter(h => h.status === "ACTIVE");

  const byType: Record<string, number> = {};
  const byIssuer: Record<string, number> = {};
  for (const h of activeHoldings) {
    byType[h.type] = (byType[h.type] || 0) + h.amount;
    byIssuer[h.issuer] = (byIssuer[h.issuer] || 0) + h.amount;
  }

  const activeTotalCapital = activeHoldings.reduce((sum, h) => sum + h.amount, 0);

  const allocationByType = Object.entries(byType).map(([name, value]) => ({
    name,
    value,
    percentage: activeTotalCapital > 0 ? Math.round((value / activeTotalCapital) * 10000) / 100 : 0,
  }));

  const allocationByIssuer = Object.entries(byIssuer).map(([name, value]) => ({
    name,
    value,
    percentage: activeTotalCapital > 0 ? Math.round((value / activeTotalCapital) * 10000) / 100 : 0,
  }));

  return {
    totalCapital,
    allocationByType,
    allocationByIssuer,
    holdingsCount: holdings.length,
    activeHoldings: activeHoldings.length,
    holdings: activeHoldings,
  };
}

function getAnalytics(holdings: typeof holdingsTable.$inferSelect[], totalCapital: number) {
  const deployed = holdings
    .filter(h => h.status === "ACTIVE" && h.type !== "MMMF")
    .reduce((sum, h) => sum + h.amount, 0);

  const idle = totalCapital - deployed;

  const weightedYield = holdings
    .filter(h => h.status === "ACTIVE")
    .reduce((sum, h) => sum + h.rate * h.amount, 0);

  const effectiveYield = totalCapital > 0
    ? Math.round((weightedYield / totalCapital) * 100) / 100
    : 0;

  return {
    effectiveYield,
    capitalDeploymentRate: totalCapital > 0 ? Math.round((deployed / totalCapital) * 10000) / 100 : 0,
    idleCashPercentage: totalCapital > 0 ? Math.round((idle / totalCapital) * 10000) / 100 : 0,
    totalDeployed: deployed,
    totalIdle: idle,
  };
}

router.get("/decision", requireAuth, async (req, res): Promise<void> => {
  const [latestSignal] = await db
    .select()
    .from(signalsTable)
    .orderBy(desc(signalsTable.createdAt))
    .limit(1);

  const portfolioData = await getPortfolioData(req.user!.userId);

  const availableDeals = await db
    .select()
    .from(dealsTable)
    .orderBy(desc(dealsTable.createdAt))
    .limit(20);

  const cpRate = latestSignal?.cpRate ?? 15;
  const bondYield = latestSignal?.bondYield ?? 14;

  const decision = evaluateDecision({
    cpRate,
    bondYield,
    totalCapital: portfolioData.totalCapital || 10000000,
    availableDeals: availableDeals.map((d) => ({
      issuer: d.issuer,
      rate: d.rate,
      tenorDays: d.tenorDays,
      riskLevel: d.riskLevel,
    })),
  });

  res.json(GetDecisionResponse.parse(decision));
});

router.get("/portfolio/summary", requireAuth, async (req, res): Promise<void> => {
  const data = await getPortfolioData(req.user!.userId);
  res.json(GetPortfolioSummaryResponse.parse({
    totalCapital: data.totalCapital,
    allocationByType: data.allocationByType,
    allocationByIssuer: data.allocationByIssuer,
    holdingsCount: data.holdingsCount,
    activeHoldings: data.activeHoldings,
  }));
});

router.get("/portfolio/analytics", requireAuth, async (req, res): Promise<void> => {
  const data = await getPortfolioData(req.user!.userId);
  const analytics = getAnalytics(data.holdings, data.totalCapital);
  res.json(GetPortfolioAnalyticsResponse.parse(analytics));
});

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const [latestSignal] = await db
    .select()
    .from(signalsTable)
    .orderBy(desc(signalsTable.createdAt))
    .limit(1);

  const portfolioData = await getPortfolioData(req.user!.userId);
  const analytics = getAnalytics(portfolioData.holdings, portfolioData.totalCapital);

  const cpRate = latestSignal?.cpRate ?? 15;
  const bondYield = latestSignal?.bondYield ?? 14;

  const recentDeals = await db
    .select()
    .from(dealsTable)
    .orderBy(desc(dealsTable.createdAt))
    .limit(20);

  const decision = evaluateDecision({
    cpRate,
    bondYield,
    totalCapital: portfolioData.totalCapital || 10000000,
    availableDeals: recentDeals.map((d) => ({
      issuer: d.issuer,
      rate: d.rate,
      tenorDays: d.tenorDays,
      riskLevel: d.riskLevel,
    })),
  });

  const [unreadResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(alertsTable)
    .where(and(eq(alertsTable.userId, req.user!.userId), eq(alertsTable.read, false)));

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const [maturingResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(holdingsTable)
    .where(
      and(
        eq(holdingsTable.userId, req.user!.userId),
        eq(holdingsTable.status, "ACTIVE"),
        lte(holdingsTable.maturityDate, sevenDaysFromNow)
      )
    );

  const signal = latestSignal || { id: 0, cpRate: 15, bondYield: 14, createdAt: new Date() };

  res.json(GetDashboardSummaryResponse.parse({
    decision,
    latestSignal: signal,
    portfolioSnapshot: {
      totalCapital: portfolioData.totalCapital,
      allocationByType: portfolioData.allocationByType,
      allocationByIssuer: portfolioData.allocationByIssuer,
      holdingsCount: portfolioData.holdingsCount,
      activeHoldings: portfolioData.activeHoldings,
    },
    analytics,
    unreadAlerts: unreadResult?.count ?? 0,
    maturingSoonCount: maturingResult?.count ?? 0,
    recentDeals: recentDeals.slice(0, 5),
  }));
});

export default router;
