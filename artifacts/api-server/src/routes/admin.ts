import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, usersTable, holdingsTable, dealsTable, alertsTable, signalsTable } from "@workspace/db";
import { GetAdminStatsResponse } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/admin/stats", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const [users] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [holdings] = await db.select({ count: sql<number>`count(*)::int` }).from(holdingsTable);
  const [deals] = await db.select({ count: sql<number>`count(*)::int` }).from(dealsTable);
  const [alerts] = await db.select({ count: sql<number>`count(*)::int` }).from(alertsTable);
  const [signals] = await db.select({ count: sql<number>`count(*)::int` }).from(signalsTable);

  res.json(GetAdminStatsResponse.parse({
    totalUsers: users?.count ?? 0,
    totalHoldings: holdings?.count ?? 0,
    totalDeals: deals?.count ?? 0,
    totalAlerts: alerts?.count ?? 0,
    totalSignals: signals?.count ?? 0,
    activeUsers: users?.count ?? 0,
  }));
});

export default router;
