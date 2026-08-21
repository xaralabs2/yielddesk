import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  diasporaProfilesTable,
  simulationAccountsTable,
  simulationHoldingsTable,
  simulationTransactionsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { resolveNgxTicker } from "../../../../shared-module/server/stock-prices";

const router: IRouter = Router();

function userId(req: any): number {
  return Number(req.user?.userId ?? 0);
}

router.get("/diaspora/profile", requireAuth, async (req, res) => {
  const [profile] = await db
    .select()
    .from(diasporaProfilesTable)
    .where(eq(diasporaProfilesTable.userId, userId(req)))
    .limit(1);
  return res.json(profile ?? null);
});

router.put("/diaspora/profile", requireAuth, async (req, res) => {
  const uid = userId(req);
  const {
    countryOfResidence,
    baseCurrency = "USD",
    investmentExperience = "BEGINNER",
    riskTolerance = "MODERATE",
    investmentHorizon = "LONG_TERM",
    goals = null,
    interests = null,
    estimatedCapitalRange = null,
    readinessStage = "LEARNING",
    consentPartnerUpdates = false,
  } = req.body ?? {};

  if (!countryOfResidence || typeof countryOfResidence !== "string") {
    return res.status(400).json({ message: "countryOfResidence is required" });
  }
  const currency = String(baseCurrency).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    return res.status(400).json({ message: "baseCurrency must be a 3-letter currency code" });
  }

  const [profile] = await db
    .insert(diasporaProfilesTable)
    .values({
      userId: uid,
      countryOfResidence: countryOfResidence.trim(),
      baseCurrency: currency,
      investmentExperience: String(investmentExperience).toUpperCase(),
      riskTolerance: String(riskTolerance).toUpperCase(),
      investmentHorizon: String(investmentHorizon).toUpperCase(),
      goals: goals ? String(goals) : null,
      interests: interests ? String(interests) : null,
      estimatedCapitalRange: estimatedCapitalRange ? String(estimatedCapitalRange) : null,
      readinessStage: String(readinessStage).toUpperCase(),
      consentPartnerUpdates: Boolean(consentPartnerUpdates),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: diasporaProfilesTable.userId,
      set: {
        countryOfResidence: countryOfResidence.trim(),
        baseCurrency: currency,
        investmentExperience: String(investmentExperience).toUpperCase(),
        riskTolerance: String(riskTolerance).toUpperCase(),
        investmentHorizon: String(investmentHorizon).toUpperCase(),
        goals: goals ? String(goals) : null,
        interests: interests ? String(interests) : null,
        estimatedCapitalRange: estimatedCapitalRange ? String(estimatedCapitalRange) : null,
        readinessStage: String(readinessStage).toUpperCase(),
        consentPartnerUpdates: Boolean(consentPartnerUpdates),
        updatedAt: new Date(),
      },
    })
    .returning();

  return res.json(profile);
});

router.get("/simulation/accounts", requireAuth, async (req, res) => {
  const accounts = await db
    .select()
    .from(simulationAccountsTable)
    .where(eq(simulationAccountsTable.userId, userId(req)))
    .orderBy(desc(simulationAccountsTable.createdAt));
  return res.json(accounts);
});

router.post("/simulation/accounts", requireAuth, async (req, res) => {
  const startingCashNgn = Number(req.body?.startingCashNgn ?? 10_000_000);
  if (!Number.isFinite(startingCashNgn) || startingCashNgn <= 0) {
    return res.status(400).json({ message: "startingCashNgn must be greater than zero" });
  }

  const [account] = await db
    .insert(simulationAccountsTable)
    .values({
      userId: userId(req),
      name: String(req.body?.name ?? "My Simulator").trim(),
      baseCurrency: "NGN",
      startingCashNgn,
      cashBalanceNgn: startingCashNgn,
    })
    .returning();

  return res.status(201).json(account);
});

router.get("/simulation/accounts/:id", requireAuth, async (req, res) => {
  const accountId = Number(req.params.id);
  const [account] = await db
    .select()
    .from(simulationAccountsTable)
    .where(and(eq(simulationAccountsTable.id, accountId), eq(simulationAccountsTable.userId, userId(req))))
    .limit(1);
  if (!account) return res.status(404).json({ message: "Simulation account not found" });

  const [holdings, transactions] = await Promise.all([
    db.select().from(simulationHoldingsTable).where(eq(simulationHoldingsTable.accountId, accountId)),
    db
      .select()
      .from(simulationTransactionsTable)
      .where(eq(simulationTransactionsTable.accountId, accountId))
      .orderBy(desc(simulationTransactionsTable.executedAt))
      .limit(100),
  ]);

  const enriched = await Promise.all(
    holdings.map(async (holding) => {
      const market = await resolveNgxTicker(holding.symbol);
      const currentPriceNgn = market?.price ?? holding.averageCostNgn;
      const marketValueNgn = holding.quantity * currentPriceNgn;
      const costBasisNgn = holding.quantity * holding.averageCostNgn;
      return {
        ...holding,
        currentPriceNgn,
        marketValueNgn,
        costBasisNgn,
        unrealizedPnlNgn: marketValueNgn - costBasisNgn,
        unrealizedReturnPct: costBasisNgn > 0 ? ((marketValueNgn - costBasisNgn) / costBasisNgn) * 100 : 0,
      };
    }),
  );

  const holdingsValueNgn = enriched.reduce((sum, h) => sum + h.marketValueNgn, 0);
  const totalValueNgn = account.cashBalanceNgn + holdingsValueNgn;

  return res.json({
    account,
    holdings: enriched,
    transactions,
    summary: {
      cashBalanceNgn: account.cashBalanceNgn,
      holdingsValueNgn,
      totalValueNgn,
      totalReturnNgn: totalValueNgn - account.startingCashNgn,
      totalReturnPct: account.startingCashNgn > 0 ? ((totalValueNgn - account.startingCashNgn) / account.startingCashNgn) * 100 : 0,
    },
    simulated: true,
  });
});

router.post("/simulation/accounts/:id/trades", requireAuth, async (req, res) => {
  const accountId = Number(req.params.id);
  const side = String(req.body?.side ?? "").toUpperCase();
  const inputSymbol = String(req.body?.symbol ?? "").trim();
  const quantity = Number(req.body?.quantity);

  if (!["BUY", "SELL"].includes(side)) {
    return res.status(400).json({ message: "side must be BUY or SELL" });
  }
  if (!inputSymbol || !Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({ message: "symbol and a positive quantity are required" });
  }

  const [account] = await db
    .select()
    .from(simulationAccountsTable)
    .where(and(eq(simulationAccountsTable.id, accountId), eq(simulationAccountsTable.userId, userId(req))))
    .limit(1);
  if (!account) return res.status(404).json({ message: "Simulation account not found" });

  const market = await resolveNgxTicker(inputSymbol);
  if (!market || !market.price || market.price <= 0) {
    return res.status(400).json({ message: "Unable to resolve a live NGX reference price for this symbol" });
  }

  const symbol = market.symbol;
  const assetName = market.name;
  const unitPriceNgn = market.price;
  const grossAmountNgn = unitPriceNgn * quantity;

  const result = await db.transaction(async (tx) => {
    const [holding] = await tx
      .select()
      .from(simulationHoldingsTable)
      .where(and(eq(simulationHoldingsTable.accountId, accountId), eq(simulationHoldingsTable.symbol, symbol)))
      .limit(1);

    if (side === "BUY") {
      if (account.cashBalanceNgn < grossAmountNgn) throw new Error("INSUFFICIENT_SIMULATION_CASH");
      const newCash = account.cashBalanceNgn - grossAmountNgn;
      await tx
        .update(simulationAccountsTable)
        .set({ cashBalanceNgn: newCash, updatedAt: new Date() })
        .where(eq(simulationAccountsTable.id, accountId));

      if (holding) {
        const newQuantity = holding.quantity + quantity;
        const newAverageCost = ((holding.quantity * holding.averageCostNgn) + grossAmountNgn) / newQuantity;
        await tx
          .update(simulationHoldingsTable)
          .set({ quantity: newQuantity, averageCostNgn: newAverageCost, updatedAt: new Date() })
          .where(eq(simulationHoldingsTable.id, holding.id));
      } else {
        await tx.insert(simulationHoldingsTable).values({
          accountId,
          instrumentType: "STOCK",
          symbol,
          assetName,
          quantity,
          averageCostNgn: unitPriceNgn,
        });
      }
    } else {
      if (!holding || holding.quantity < quantity) throw new Error("INSUFFICIENT_SIMULATION_HOLDING");
      const remaining = holding.quantity - quantity;
      await tx
        .update(simulationAccountsTable)
        .set({ cashBalanceNgn: account.cashBalanceNgn + grossAmountNgn, updatedAt: new Date() })
        .where(eq(simulationAccountsTable.id, accountId));
      if (remaining === 0) {
        await tx.delete(simulationHoldingsTable).where(eq(simulationHoldingsTable.id, holding.id));
      } else {
        await tx
          .update(simulationHoldingsTable)
          .set({ quantity: remaining, updatedAt: new Date() })
          .where(eq(simulationHoldingsTable.id, holding.id));
      }
    }

    const [transaction] = await tx
      .insert(simulationTransactionsTable)
      .values({
        accountId,
        instrumentType: "STOCK",
        symbol,
        assetName,
        side,
        quantity,
        unitPriceNgn,
        grossAmountNgn,
        feesNgn: 0,
      })
      .returning();
    return transaction;
  });

  return res.status(201).json({
    transaction: result,
    simulated: true,
    notice: "Simulation only. No real security was purchased or sold.",
    marketReference: { source: "NGX", symbol, unitPriceNgn },
  });
});

router.use((err: any, _req: any, res: any, next: any) => {
  if (err?.message === "INSUFFICIENT_SIMULATION_CASH") {
    return res.status(400).json({ message: "Insufficient virtual cash for this simulated trade" });
  }
  if (err?.message === "INSUFFICIENT_SIMULATION_HOLDING") {
    return res.status(400).json({ message: "Insufficient simulated holdings for this sale" });
  }
  return next(err);
});

export default router;
