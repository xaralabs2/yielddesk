import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, cbnMarketDataTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { syncCbnData, fetchCbnData } from "../lib/cbn-scraper";

const router: IRouter = Router();

router.get("/cbn/market-data", requireAuth, async (_req, res): Promise<void> => {
  const ntb = await db
    .select()
    .from(cbnMarketDataTable)
    .where(eq(cbnMarketDataTable.securityType, "NTB"))
    .orderBy(desc(cbnMarketDataTable.auctionDate))
    .limit(12);

  const bonds = await db
    .select()
    .from(cbnMarketDataTable)
    .where(eq(cbnMarketDataTable.securityType, "BOND"))
    .orderBy(desc(cbnMarketDataTable.auctionDate))
    .limit(12);

  const omo = await db
    .select()
    .from(cbnMarketDataTable)
    .where(eq(cbnMarketDataTable.securityType, "OMO"))
    .orderBy(desc(cbnMarketDataTable.auctionDate))
    .limit(12);

  res.json({ ntb, bonds, omo });
});

router.get("/cbn/rates-summary", requireAuth, async (_req, res): Promise<void> => {
  const latestNtb91 = await db
    .select()
    .from(cbnMarketDataTable)
    .where(eq(cbnMarketDataTable.securityType, "NTB"))
    .orderBy(desc(cbnMarketDataTable.auctionDate))
    .limit(4);

  const latestBond = await db
    .select()
    .from(cbnMarketDataTable)
    .where(eq(cbnMarketDataTable.securityType, "BOND"))
    .orderBy(desc(cbnMarketDataTable.auctionDate))
    .limit(4);

  const latestOmo = await db
    .select()
    .from(cbnMarketDataTable)
    .where(eq(cbnMarketDataTable.securityType, "OMO"))
    .orderBy(desc(cbnMarketDataTable.auctionDate))
    .limit(4);

  const ntbByTenor: Record<string, { rate: number; date: string }> = {};
  for (const r of latestNtb91) {
    if (r.marginalRate && !ntbByTenor[r.tenor]) {
      ntbByTenor[r.tenor] = {
        rate: r.marginalRate,
        date: r.auctionDate?.toISOString() ?? "",
      };
    }
  }

  const bondByTenor: Record<string, { rate: number; date: string }> = {};
  for (const r of latestBond) {
    if (r.marginalRate && !bondByTenor[r.tenor]) {
      bondByTenor[r.tenor] = {
        rate: r.marginalRate,
        date: r.auctionDate?.toISOString() ?? "",
      };
    }
  }

  const omoByTenor: Record<string, { rate: number; date: string }> = {};
  for (const r of latestOmo) {
    if (r.marginalRate && !omoByTenor[r.tenor]) {
      omoByTenor[r.tenor] = {
        rate: r.marginalRate,
        date: r.auctionDate?.toISOString() ?? "",
      };
    }
  }

  res.json({
    ntb: ntbByTenor,
    bonds: bondByTenor,
    omo: omoByTenor,
    lastUpdated: latestNtb91[0]?.fetchedAt?.toISOString() ?? null,
  });
});

router.post("/cbn/sync", requireAuth, async (_req, res): Promise<void> => {
  try {
    const result = await syncCbnData();
    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
