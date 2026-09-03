import type { Request, Response } from "express";
import { syncFmdqRates } from "../../src/lib/fmdq-scraper";

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
    const result = await syncFmdqRates();
    res.json({
      ok: true,
      source: "FMDQ",
      result,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("FMDQ cron sync failed", error);
    res.status(500).json({ error: "FMDQ sync failed" });
  }
}
