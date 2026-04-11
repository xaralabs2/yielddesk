import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, dealsTable } from "@workspace/db";
import {
  CreateDealBody,
  GetDealParams,
  GetDealResponse,
  ListDealsResponse,
  ScoreDealParams,
  ScoreDealResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function scoreDeal(deal: typeof dealsTable.$inferSelect) {
  let yieldScore = Math.min(deal.rate / 20 * 5, 5);
  let issuerScore = deal.riskLevel === "LOW" ? 5 : deal.riskLevel === "MEDIUM" ? 3 : 1;
  let tenorScore = deal.tenorDays <= 90 ? 5 : deal.tenorDays <= 180 ? 4 : deal.tenorDays <= 365 ? 3 : 2;
  let diversificationScore = 3;

  const totalScore = (yieldScore + issuerScore + tenorScore + diversificationScore) / 4 * 5;
  const recommendation = totalScore >= 15 ? "INVEST" as const : totalScore >= 10 ? "HOLD" as const : "PASS" as const;

  return {
    score: Math.round(totalScore * 10) / 10,
    recommendation,
    factors: {
      yieldScore: Math.round(yieldScore * 10) / 10,
      issuerScore,
      tenorScore,
      diversificationScore,
    },
  };
}

router.get("/deals", requireAuth, async (_req, res): Promise<void> => {
  const deals = await db.select().from(dealsTable).orderBy(dealsTable.createdAt);
  res.json(ListDealsResponse.parse(deals));
});

router.post("/deals", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateDealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [deal] = await db.insert(dealsTable).values(parsed.data).returning();
  res.status(201).json(ListDealsResponse.element.parse(deal));
});

router.get("/deals/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetDealParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, params.data.id));
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }

  const score = scoreDeal(deal);
  res.json(GetDealResponse.parse({ deal, score }));
});

router.get("/deals/:id/score", requireAuth, async (req, res): Promise<void> => {
  const params = ScoreDealParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, params.data.id));
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }

  res.json(ScoreDealResponse.parse(scoreDeal(deal)));
});

export default router;
