import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { syncCbnData, syncPolicyRates, syncExchangeRates } from "../lib/cbn-scraper";
import { syncFmdqRates } from "../lib/fmdq-scraper";
import { syncNgxEquitySnapshot } from "../lib/ngx-market-data";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function requireCron(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.get("/cron/cbn-sync", requireCron, async (_req, res): Promise<void> => {
  try {
    const [market, policy, fx] = await Promise.all([
      syncCbnData(),
      syncPolicyRates(),
      syncExchangeRates(),
    ]);
    res.json({ ok: true, source: "CBN", market, policy, fx, syncedAt: new Date().toISOString() });
  } catch (error) {
    logger.error({ err: error }, "CBN cron sync failed");
    res.status(500).json({ error: "CBN sync failed" });
  }
});

router.get("/cron/fmdq-sync", requireCron, async (_req, res): Promise<void> => {
  try {
    const result = await syncFmdqRates();
    res.json({ ok: true, source: "FMDQ", result, syncedAt: new Date().toISOString() });
  } catch (error) {
    logger.error({ err: error }, "FMDQ cron sync failed");
    res.status(500).json({ error: "FMDQ sync failed" });
  }
});

router.get("/cron/ngx-sync", requireCron, async (_req, res): Promise<void> => {
  try {
    const result = await syncNgxEquitySnapshot();
    res.json({ ok: true, source: "NGX", result, syncedAt: new Date().toISOString() });
  } catch (error) {
    logger.error({ err: error }, "NGX cron sync failed");
    res.status(500).json({ error: "NGX sync failed" });
  }
});

export default router;
