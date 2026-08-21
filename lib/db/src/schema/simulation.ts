import { integer, pgTable, real, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const simulationAccountsTable = pgTable("simulation_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name", { length: 100 }).notNull().default("My Simulator"),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull().default("NGN"),
  startingCashNgn: real("starting_cash_ngn").notNull(),
  cashBalanceNgn: real("cash_balance_ngn").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const simulationHoldingsTable = pgTable(
  "simulation_holdings",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id").notNull(),
    instrumentType: varchar("instrument_type", { length: 20 }).notNull().default("STOCK"),
    symbol: varchar("symbol", { length: 50 }).notNull(),
    assetName: varchar("asset_name", { length: 200 }).notNull(),
    quantity: real("quantity").notNull(),
    averageCostNgn: real("average_cost_ngn").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    accountSymbolUnique: uniqueIndex("simulation_holdings_account_symbol_uidx").on(table.accountId, table.symbol),
  }),
);

export const simulationTransactionsTable = pgTable("simulation_transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  instrumentType: varchar("instrument_type", { length: 20 }).notNull().default("STOCK"),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  assetName: varchar("asset_name", { length: 200 }).notNull(),
  side: varchar("side", { length: 10 }).notNull(),
  quantity: real("quantity").notNull(),
  unitPriceNgn: real("unit_price_ngn").notNull(),
  grossAmountNgn: real("gross_amount_ngn").notNull(),
  feesNgn: real("fees_ngn").notNull().default(0),
  fxRate: real("fx_rate"),
  executedAt: timestamp("executed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SimulationAccount = typeof simulationAccountsTable.$inferSelect;
export type SimulationHolding = typeof simulationHoldingsTable.$inferSelect;
export type SimulationTransaction = typeof simulationTransactionsTable.$inferSelect;
