import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, signalsTable } from "@workspace/db";
import {
  CreateSignalBody,
  ListSignalsQueryParams,
  ListSignalsResponse,
  GetLatestSignalResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/signals", requireAuth, async (req, res): Promise<void> => {
  const params = ListSignalsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 20) : 20;

  const signals = await db
    .select()
    .from(signalsTable)
    .orderBy(desc(signalsTable.createdAt))
    .limit(limit);

  res.json(ListSignalsResponse.parse(signals));
});

router.post("/signals", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSignalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [signal] = await db.insert(signalsTable).values(parsed.data).returning();
  res.status(201).json(ListSignalsResponse.element.parse(signal));
});

router.get("/signals/latest", requireAuth, async (_req, res): Promise<void> => {
  const [signal] = await db
    .select()
    .from(signalsTable)
    .orderBy(desc(signalsTable.createdAt))
    .limit(1);

  if (!signal) {
    res.status(404).json({ error: "No signals found" });
    return;
  }

  res.json(GetLatestSignalResponse.parse(signal));
});

export default router;
