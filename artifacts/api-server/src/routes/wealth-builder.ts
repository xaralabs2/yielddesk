import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, wealthBuilderPlansTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  buildWealthPlan,
  WEALTH_BUILDER_LIMITATION,
  type WealthHorizon,
  type WealthStrategy,
} from "../lib/wealth-builder-engine";

const router: IRouter = Router();
const STRATEGIES = new Set<WealthStrategy>(["PRESERVE", "BALANCED", "GROWTH", "INCOME"]);
const HORIZONS = new Set<WealthHorizon>(["SHORT", "MEDIUM", "LONG"]);

function userId(req: any): number {
  return Number(req.user?.userId ?? 0);
}

function parseInput(body: any) {
  const goal = String(body?.goal ?? "").trim();
  const totalSpendNgn = Number(body?.totalSpendNgn);
  const horizon = String(body?.horizon ?? "").toUpperCase() as WealthHorizon;
  const strategy = String(body?.strategy ?? "").toUpperCase() as WealthStrategy;

  if (goal.length < 3 || goal.length > 500) {
    return { error: "goal must be between 3 and 500 characters" } as const;
  }
  if (!Number.isFinite(totalSpendNgn) || totalSpendNgn < 10_000 || totalSpendNgn > 1_000_000_000_000_000) {
    return { error: "totalSpendNgn must be between ₦10,000 and ₦1 quadrillion" } as const;
  }
  if (!HORIZONS.has(horizon)) {
    return { error: "horizon must be SHORT, MEDIUM or LONG" } as const;
  }
  if (!STRATEGIES.has(strategy)) {
    return { error: "strategy must be PRESERVE, BALANCED, GROWTH or INCOME" } as const;
  }

  return { value: { goal, totalSpendNgn, horizon, strategy } } as const;
}

router.post("/wealth-builder/preview", requireAuth, async (req, res) => {
  const parsed = parseInput(req.body);
  if ("error" in parsed) return res.status(400).json({ message: parsed.error });

  return res.json(buildWealthPlan(parsed.value));
});

router.get("/wealth-builder/plans/latest", requireAuth, async (req, res) => {
  const [plan] = await db
    .select()
    .from(wealthBuilderPlansTable)
    .where(eq(wealthBuilderPlansTable.userId, userId(req)))
    .orderBy(desc(wealthBuilderPlansTable.createdAt))
    .limit(1);

  return res.json(plan ?? null);
});

router.post("/wealth-builder/plans", requireAuth, async (req, res) => {
  if (req.body?.confirmed !== true) {
    return res.status(400).json({
      message: "Explicit confirmation is required before a simulated wealth plan is saved",
    });
  }

  const parsed = parseInput(req.body);
  if ("error" in parsed) return res.status(400).json({ message: parsed.error });
  const plan = buildWealthPlan(parsed.value);

  const [saved] = await db
    .insert(wealthBuilderPlansTable)
    .values({
      userId: userId(req),
      goal: plan.goal,
      totalSpendNgn: plan.totalSpendNgn,
      horizon: plan.horizon,
      strategy: plan.strategy,
      status: "CONFIRMED",
      allocationsJson: plan.allocations,
      methodologyVersion: plan.methodologyVersion,
      limitationText: WEALTH_BUILDER_LIMITATION,
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return res.status(201).json({
    ...saved,
    simulated: true,
    notice: "Saved as a hypothetical YieldDesk plan. No real holdings or broker orders were changed.",
  });
});

export default router;
