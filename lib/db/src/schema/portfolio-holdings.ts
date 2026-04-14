import { pgTable, serial, varchar, real, integer, timestamp, text, index } from "drizzle-orm/pg-core";

export const portfolioHoldingsTable = pgTable("portfolio_holdings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 50 }).notNull(),
  asset: varchar("asset", { length: 200 }).notNull(),
  ticker: varchar("ticker", { length: 50 }),
  pillar: varchar("pillar", { length: 20 }).notNull(),
  valueNgn: real("value_ngn").notNull(),
  shares: real("shares"),
  entryValueNgn: real("entry_value_ngn"),
  entryFxRate: real("entry_fx_rate"),
  annualRentNgn: real("annual_rent_ngn"),
  cumulativeRentNgn: real("cumulative_rent_ngn"),
  corridor: varchar("corridor", { length: 50 }),
  entryDate: timestamp("entry_date", { withTimezone: true }),
  lastUpdated: timestamp("last_updated", { withTimezone: true }),
}, (table) => [
  index("portfolio_holdings_user_id_idx").on(table.userId),
  index("portfolio_holdings_user_pillar_idx").on(table.userId, table.pillar),
  index("portfolio_holdings_ticker_idx").on(table.ticker),
]);

export const portfolioConfigTable = pgTable("portfolio_config", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 50 }).notNull().unique(),
  stabilityTarget: real("stability_target").notNull().default(0.10),
  inflationTarget: real("inflation_target").notNull().default(0.15),
  strategicTarget: real("strategic_target").notNull().default(0.75),
  tolerance: real("tolerance").notNull().default(0.05),
  baselineValue: real("baseline_value"),
  targetValue: real("target_value"),
  availableCash: real("available_cash"),
});

export type PortfolioHoldingRow = typeof portfolioHoldingsTable.$inferSelect;
export type PortfolioConfigRow = typeof portfolioConfigTable.$inferSelect;
