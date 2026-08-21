import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, holdingsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const TARGET_TOTAL = 60_000_000;

const targetPolicy = [
  { key: "gtco", name: "GTCO", bucket: "Equities", targetAmount: 5_000_000 },
  { key: "zenith", name: "Zenith Bank", bucket: "Equities", targetAmount: 4_000_000 },
  { key: "uba", name: "UBA", bucket: "Equities", targetAmount: 2_000_000 },
  { key: "mtn", name: "MTN Nigeria", bucket: "Equities", targetAmount: 6_000_000 },
  { key: "airtel", name: "Airtel Africa", bucket: "Equities", targetAmount: 2_000_000 },
  { key: "dangote", name: "Dangote Cement", bucket: "Equities", targetAmount: 4_000_000 },
  { key: "bua-foods", name: "BUA Foods", bucket: "Equities", targetAmount: 3_000_000 },
  { key: "nestle", name: "Nestlé Nigeria", bucket: "Equities", targetAmount: 2_000_000 },
  { key: "seplat", name: "Seplat Energy", bucket: "Equities", targetAmount: 3_000_000 },
  { key: "equity-reserve", name: "Equity Opportunity Reserve", bucket: "Equities", targetAmount: 4_000_000 },
  { key: "tbills", name: "Treasury Bills", bucket: "Fixed Income", targetAmount: 12_000_000 },
  { key: "mmf", name: "Money Market Fund", bucket: "Fixed Income", targetAmount: 5_000_000 },
  { key: "fgn-bonds", name: "FGN Bonds", bucket: "Fixed Income", targetAmount: 3_000_000 },
  { key: "startup", name: "Startup / Private", bucket: "Private", targetAmount: 5_000_000 },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchesPolicy(policyKey: string, policyName: string, holding: typeof holdingsTable.$inferSelect) {
  const haystack = normalize(`${holding.issuer} ${holding.type}`);
  const aliases: Record<string, string[]> = {
    gtco: ["gtco", "guarantytrust", "guarantytrustholding"],
    zenith: ["zenith", "zenithbank"],
    uba: ["uba", "unitedbankforafrica"],
    mtn: ["mtn", "mtnnigeria"],
    airtel: ["airtel", "airtelafrica"],
    dangote: ["dangote", "dangotecement"],
    "bua-foods": ["buafoods", "buafood"],
    nestle: ["nestle", "nestlenigeria"],
    seplat: ["seplat", "seplatenergy"],
    "equity-reserve": ["equityreserve", "opportunityreserve", "cashreserve"],
    tbills: ["treasurybill", "tbill", "ntb"],
    mmf: ["moneymarket", "mmmf", "mmf"],
    "fgn-bonds": ["fgnbond", "federalgovernmentbond"],
    startup: ["startup", "privateequity", "privateinvestment", "venture"],
  };

  return (aliases[policyKey] || [normalize(policyName)]).some((alias) => haystack.includes(normalize(alias)));
}

function actionFor(target: number, actual: number) {
  if (target === 0) return actual > 0 ? "TRIM" : "HOLD";
  const ratio = actual / target;
  if (ratio < 0.75) return "ADD";
  if (ratio > 1.25) return "TRIM";
  if (ratio < 0.9 || ratio > 1.1) return "WATCH";
  return "HOLD";
}

router.get("/investment-desk", requireAuth, async (req, res): Promise<void> => {
  const holdings = await db
    .select()
    .from(holdingsTable)
    .where(eq(holdingsTable.userId, req.user!.userId));

  const activeHoldings = holdings.filter((holding) => holding.status === "ACTIVE");

  const rows = targetPolicy.map((policy) => {
    const matched = activeHoldings.filter((holding) => matchesPolicy(policy.key, policy.name, holding));
    const actualAmount = matched.reduce((sum, holding) => sum + holding.amount, 0);
    const driftAmount = actualAmount - policy.targetAmount;
    const driftPct = policy.targetAmount > 0 ? (driftAmount / policy.targetAmount) * 100 : 0;

    return {
      ...policy,
      actualAmount,
      targetPct: (policy.targetAmount / TARGET_TOTAL) * 100,
      actualPct: (actualAmount / TARGET_TOTAL) * 100,
      driftAmount,
      driftPct,
      action: actionFor(policy.targetAmount, actualAmount),
    };
  });

  const actualTracked = rows.reduce((sum, row) => sum + row.actualAmount, 0);
  const byBucket = rows.reduce<Record<string, { targetAmount: number; actualAmount: number }>>((acc, row) => {
    acc[row.bucket] ||= { targetAmount: 0, actualAmount: 0 };
    acc[row.bucket].targetAmount += row.targetAmount;
    acc[row.bucket].actualAmount += row.actualAmount;
    return acc;
  }, {});

  res.json({
    generatedAt: new Date().toISOString(),
    targetTotal: TARGET_TOTAL,
    actualTracked,
    unallocatedToTarget: TARGET_TOTAL - actualTracked,
    policyStatus: actualTracked === 0 ? "NOT_STARTED" : actualTracked < TARGET_TOTAL ? "BUILDING" : "FUNDED",
    buckets: Object.entries(byBucket).map(([name, value]) => ({ name, ...value })),
    positions: rows,
  });
});

export default router;
