import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, alertsTable } from "@workspace/db";
import {
  ListAlertsQueryParams,
  ListAlertsResponse,
  GetAlertCountResponse,
  MarkAlertReadParams,
  MarkAlertReadResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/alerts", requireAuth, async (req, res): Promise<void> => {
  const params = ListAlertsQueryParams.safeParse(req.query);
  const unreadOnly = params.success ? params.data.unreadOnly : false;

  const conditions = [eq(alertsTable.userId, req.user!.userId)];
  if (unreadOnly) {
    conditions.push(eq(alertsTable.read, false));
  }

  const alerts = await db
    .select()
    .from(alertsTable)
    .where(and(...conditions))
    .orderBy(alertsTable.createdAt);

  res.json(ListAlertsResponse.parse(alerts));
});

router.get("/alerts/count", requireAuth, async (req, res): Promise<void> => {
  const [unreadResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(alertsTable)
    .where(and(eq(alertsTable.userId, req.user!.userId), eq(alertsTable.read, false)));

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(alertsTable)
    .where(eq(alertsTable.userId, req.user!.userId));

  res.json(GetAlertCountResponse.parse({
    unread: unreadResult?.count ?? 0,
    total: totalResult?.count ?? 0,
  }));
});

router.put("/alerts/:id/read", requireAuth, async (req, res): Promise<void> => {
  const params = MarkAlertReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [alert] = await db
    .update(alertsTable)
    .set({ read: true })
    .where(and(eq(alertsTable.id, params.data.id), eq(alertsTable.userId, req.user!.userId)))
    .returning();

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  res.json(MarkAlertReadResponse.parse(alert));
});

export default router;
