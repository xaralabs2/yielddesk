import { pgTable, serial, real, timestamp, varchar, integer, index } from "drizzle-orm/pg-core";

export const cbnPolicyRatesTable = pgTable("cbn_policy_rates", {
  id: serial("id").primaryKey(),
  period: varchar("period", { length: 30 }).notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  mpr: real("mpr"),
  interBankCallRate: real("inter_bank_call_rate"),
  treasuryBill: real("treasury_bill"),
  savingsDeposit: real("savings_deposit"),
  oneMonthDeposit: real("one_month_deposit"),
  threeMonthsDeposit: real("three_months_deposit"),
  sixMonthsDeposit: real("six_months_deposit"),
  twelveMonthsDeposit: real("twelve_months_deposit"),
  primeLending: real("prime_lending"),
  maxLending: real("max_lending"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("cbn_policy_rates_year_month_idx").on(table.year, table.month),
]);

export const cbnExchangeRatesTable = pgTable("cbn_exchange_rates", {
  id: serial("id").primaryKey(),
  currency: varchar("currency", { length: 50 }).notNull(),
  rateDate: timestamp("rate_date", { withTimezone: true }).notNull(),
  buyingRate: real("buying_rate"),
  centralRate: real("central_rate"),
  sellingRate: real("selling_rate"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("cbn_exchange_rates_currency_idx").on(table.currency),
  index("cbn_exchange_rates_date_idx").on(table.rateDate),
]);

export type CbnPolicyRate = typeof cbnPolicyRatesTable.$inferSelect;
export type CbnExchangeRate = typeof cbnExchangeRatesTable.$inferSelect;
