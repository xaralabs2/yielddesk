import { Router, type IRouter } from "express";
import { eq, and, lte } from "drizzle-orm";
import { db, holdingsTable } from "@workspace/db";
import {
  CreateHoldingBody,
  UpdateHoldingBody,
  GetHoldingParams,
  GetHoldingResponse,
  UpdateHoldingParams,
  UpdateHoldingResponse,
  DeleteHoldingParams,
  ListHoldingsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function enrichHolding(h: typeof holdingsTable.$inferSelect) {
  let daysRemaining: number | null = null;
  let expectedMaturityValue: number | null = null;

  if (h.maturityDate) {
    const now = new Date();
    const diff = h.maturityDate.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

    if (h.startDate) {
      const totalDays = (h.maturityDate.getTime() - h.startDate.getTime()) / (1000 * 60 * 60 * 24);
      expectedMaturityValue = h.amount * (1 + (h.rate / 100) * (totalDays / 365));
    }
  }

  return {
    id: h.id,
    userId: h.userId,
    type: h.type,
    amount: h.amount,
    rate: h.rate,
    issuer: h.issuer,
    startDate: h.startDate,
    maturityDate: h.maturityDate,
    status: h.status,
    daysRemaining,
    expectedMaturityValue,
    createdAt: h.createdAt,
  };
}

router.get("/holdings", requireAuth, async (req, res): Promise<void> => {
  const holdings = await db
    .select()
    .from(holdingsTable)
    .where(eq(holdingsTable.userId, req.user!.userId))
    .orderBy(holdingsTable.createdAt);

  res.json(ListHoldingsResponse.parse(holdings.map(enrichHolding)));
});

router.post("/holdings", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateHoldingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [holding] = await db.insert(holdingsTable).values({
    ...parsed.data,
    userId: req.user!.userId,
    startDate: new Date(parsed.data.startDate),
    maturityDate: parsed.data.maturityDate ? new Date(parsed.data.maturityDate) : null,
  }).returning();

  res.status(201).json(GetHoldingResponse.parse(enrichHolding(holding)));
});

router.get("/holdings/maturing-soon", requireAuth, async (req, res): Promise<void> => {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const holdings = await db
    .select()
    .from(holdingsTable)
    .where(
      and(
        eq(holdingsTable.userId, req.user!.userId),
        eq(holdingsTable.status, "ACTIVE"),
        lte(holdingsTable.maturityDate, sevenDaysFromNow)
      )
    );

  res.json(ListHoldingsResponse.parse(holdings.map(enrichHolding)));
});

router.get("/holdings/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetHoldingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [holding] = await db
    .select()
    .from(holdingsTable)
    .where(and(eq(holdingsTable.id, params.data.id), eq(holdingsTable.userId, req.user!.userId)));

  if (!holding) {
    res.status(404).json({ error: "Holding not found" });
    return;
  }

  res.json(GetHoldingResponse.parse(enrichHolding(holding)));
});

router.put("/holdings/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateHoldingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateHoldingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.startDate) updateData.startDate = new Date(parsed.data.startDate);
  if (parsed.data.maturityDate !== undefined) {
    updateData.maturityDate = parsed.data.maturityDate ? new Date(parsed.data.maturityDate) : null;
  }

  const [holding] = await db
    .update(holdingsTable)
    .set(updateData)
    .where(and(eq(holdingsTable.id, params.data.id), eq(holdingsTable.userId, req.user!.userId)))
    .returning();

  if (!holding) {
    res.status(404).json({ error: "Holding not found" });
    return;
  }

  res.json(UpdateHoldingResponse.parse(enrichHolding(holding)));
});

router.delete("/holdings/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteHoldingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [holding] = await db
    .delete(holdingsTable)
    .where(and(eq(holdingsTable.id, params.data.id), eq(holdingsTable.userId, req.user!.userId)))
    .returning();

  if (!holding) {
    res.status(404).json({ error: "Holding not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
