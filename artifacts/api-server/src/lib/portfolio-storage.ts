import { db, portfolioHoldingsTable, portfolioConfigTable, cbnPolicyRatesTable, cbnExchangeRatesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import type { IPortfolioStorage, PortfolioHolding, PortfolioConfig, MacroData } from "../../../../shared-module/types";

export const portfolioStorage: IPortfolioStorage = {
  async getPortfolioHoldings(userId: string): Promise<PortfolioHolding[]> {
    const rows = await db
      .select()
      .from(portfolioHoldingsTable)
      .where(eq(portfolioHoldingsTable.userId, userId));

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      asset: r.asset,
      ticker: r.ticker,
      pillar: r.pillar,
      valueNgn: r.valueNgn,
      shares: r.shares,
      entryValueNgn: r.entryValueNgn,
      entryFxRate: r.entryFxRate,
      annualRentNgn: r.annualRentNgn,
      cumulativeRentNgn: r.cumulativeRentNgn,
      corridor: r.corridor,
      entryDate: r.entryDate,
      lastUpdated: r.lastUpdated,
    }));
  },

  async addPortfolioHolding(data: Omit<PortfolioHolding, "id">): Promise<PortfolioHolding> {
    const [row] = await db
      .insert(portfolioHoldingsTable)
      .values({
        userId: data.userId,
        asset: data.asset,
        ticker: data.ticker,
        pillar: data.pillar,
        valueNgn: data.valueNgn,
        shares: data.shares,
        entryValueNgn: data.entryValueNgn,
        entryFxRate: data.entryFxRate,
        annualRentNgn: data.annualRentNgn,
        cumulativeRentNgn: data.cumulativeRentNgn,
        corridor: data.corridor,
        entryDate: data.entryDate,
        lastUpdated: data.lastUpdated,
      })
      .returning();

    return {
      id: row.id,
      userId: row.userId,
      asset: row.asset,
      ticker: row.ticker,
      pillar: row.pillar,
      valueNgn: row.valueNgn,
      shares: row.shares,
      entryValueNgn: row.entryValueNgn,
      entryFxRate: row.entryFxRate,
      annualRentNgn: row.annualRentNgn,
      cumulativeRentNgn: row.cumulativeRentNgn,
      corridor: row.corridor,
      entryDate: row.entryDate,
      lastUpdated: row.lastUpdated,
    };
  },

  async updatePortfolioHolding(id: number, userId: string, data: Partial<PortfolioHolding>): Promise<PortfolioHolding> {
    const updates: Record<string, unknown> = {};
    if (data.asset !== undefined) updates.asset = data.asset;
    if (data.ticker !== undefined) updates.ticker = data.ticker;
    if (data.pillar !== undefined) updates.pillar = data.pillar;
    if (data.valueNgn !== undefined) updates.valueNgn = data.valueNgn;
    if (data.shares !== undefined) updates.shares = data.shares;
    if (data.entryValueNgn !== undefined) updates.entryValueNgn = data.entryValueNgn;
    if (data.entryFxRate !== undefined) updates.entryFxRate = data.entryFxRate;
    if (data.annualRentNgn !== undefined) updates.annualRentNgn = data.annualRentNgn;
    if (data.cumulativeRentNgn !== undefined) updates.cumulativeRentNgn = data.cumulativeRentNgn;
    if (data.corridor !== undefined) updates.corridor = data.corridor;
    if (data.entryDate !== undefined) updates.entryDate = data.entryDate;
    if (data.lastUpdated !== undefined) updates.lastUpdated = data.lastUpdated;

    const rows = await db
      .update(portfolioHoldingsTable)
      .set(updates)
      .where(and(eq(portfolioHoldingsTable.id, id), eq(portfolioHoldingsTable.userId, userId)))
      .returning();

    if (rows.length === 0) {
      return undefined as unknown as PortfolioHolding;
    }

    const row = rows[0];
    return {
      id: row.id,
      userId: row.userId,
      asset: row.asset,
      ticker: row.ticker,
      pillar: row.pillar,
      valueNgn: row.valueNgn,
      shares: row.shares,
      entryValueNgn: row.entryValueNgn,
      entryFxRate: row.entryFxRate,
      annualRentNgn: row.annualRentNgn,
      cumulativeRentNgn: row.cumulativeRentNgn,
      corridor: row.corridor,
      entryDate: row.entryDate,
      lastUpdated: row.lastUpdated,
    };
  },

  async deletePortfolioHolding(id: number, userId: string): Promise<void> {
    await db
      .delete(portfolioHoldingsTable)
      .where(and(eq(portfolioHoldingsTable.id, id), eq(portfolioHoldingsTable.userId, userId)));
  },

  async getPortfolioConfig(userId: string): Promise<PortfolioConfig | undefined> {
    const [row] = await db
      .select()
      .from(portfolioConfigTable)
      .where(eq(portfolioConfigTable.userId, userId))
      .limit(1);

    if (!row) return undefined;

    return {
      id: row.id,
      userId: row.userId,
      stabilityTarget: row.stabilityTarget,
      inflationTarget: row.inflationTarget,
      strategicTarget: row.strategicTarget,
      tolerance: row.tolerance,
      baselineValue: row.baselineValue,
      targetValue: row.targetValue,
      availableCash: row.availableCash,
    };
  },

  async upsertPortfolioConfig(data: Omit<PortfolioConfig, "id">): Promise<PortfolioConfig> {
    const existing = await db
      .select()
      .from(portfolioConfigTable)
      .where(eq(portfolioConfigTable.userId, data.userId))
      .limit(1);

    if (existing.length > 0) {
      const [row] = await db
        .update(portfolioConfigTable)
        .set({
          stabilityTarget: data.stabilityTarget,
          inflationTarget: data.inflationTarget,
          strategicTarget: data.strategicTarget,
          tolerance: data.tolerance,
          baselineValue: data.baselineValue,
          targetValue: data.targetValue,
          availableCash: data.availableCash,
        })
        .where(eq(portfolioConfigTable.userId, data.userId))
        .returning();

      return {
        id: row.id,
        userId: row.userId,
        stabilityTarget: row.stabilityTarget,
        inflationTarget: row.inflationTarget,
        strategicTarget: row.strategicTarget,
        tolerance: row.tolerance,
        baselineValue: row.baselineValue,
        targetValue: row.targetValue,
        availableCash: row.availableCash,
      };
    }

    const [row] = await db
      .insert(portfolioConfigTable)
      .values({
        userId: data.userId,
        stabilityTarget: data.stabilityTarget,
        inflationTarget: data.inflationTarget,
        strategicTarget: data.strategicTarget,
        tolerance: data.tolerance,
        baselineValue: data.baselineValue,
        targetValue: data.targetValue,
        availableCash: data.availableCash,
      })
      .returning();

    return {
      id: row.id,
      userId: row.userId,
      stabilityTarget: row.stabilityTarget,
      inflationTarget: row.inflationTarget,
      strategicTarget: row.strategicTarget,
      tolerance: row.tolerance,
      baselineValue: row.baselineValue,
      targetValue: row.targetValue,
      availableCash: row.availableCash,
    };
  },

  async getLatestMacroData(): Promise<MacroData | undefined> {
    const [policyRate] = await db
      .select()
      .from(cbnPolicyRatesTable)
      .orderBy(desc(cbnPolicyRatesTable.year), desc(cbnPolicyRatesTable.month))
      .limit(1);

    const [fxRate] = await db
      .select()
      .from(cbnExchangeRatesTable)
      .where(eq(cbnExchangeRatesTable.currency, "US DOLLAR"))
      .orderBy(desc(cbnExchangeRatesTable.rateDate))
      .limit(1);

    if (!policyRate) return undefined;

    return {
      inflation: 33.2,
      mpr: policyRate.mpr ?? 26.5,
      tbillRate: policyRate.treasuryBill ?? null,
      fxRate: fxRate?.centralRate ?? 1550,
    };
  },
};
