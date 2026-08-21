import type { Request, Response } from "express";
import { syncCbnData, syncPolicyRates, syncExchangeRates } from "../../src/lib/cbn-scraper";

export default async function handler(req: Request, res: Response) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [market, policy, fx] = await Promise.all([
      syncCbnData(),
      syncPolicyRates(),
      syncExchangeRates(),
    ]);
    res.json({ ok: true, market, policy, fx, syncedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error("CBN cron sync failed", error);
    res.status(500).json({ error: "CBN sync failed" });
  }
}
