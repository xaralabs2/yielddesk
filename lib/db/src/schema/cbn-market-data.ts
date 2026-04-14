import { pgTable, serial, real, timestamp, varchar, index } from "drizzle-orm/pg-core";

export const cbnMarketDataTable = pgTable("cbn_market_data", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 20 }).notNull(),
  securityType: varchar("security_type", { length: 20 }).notNull(),
  tenor: varchar("tenor", { length: 20 }).notNull(),
  auctionDate: timestamp("auction_date", { withTimezone: true }),
  maturityDate: timestamp("maturity_date", { withTimezone: true }),
  marginalRate: real("marginal_rate"),
  trueYield: real("true_yield"),
  amountOffered: real("amount_offered"),
  totalSubscription: real("total_subscription"),
  totalSuccessful: real("total_successful"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("cbn_market_data_security_type_idx").on(table.securityType),
  index("cbn_market_data_type_date_idx").on(table.securityType, table.auctionDate),
  index("cbn_market_data_auction_date_idx").on(table.auctionDate),
]);

export type CbnMarketData = typeof cbnMarketDataTable.$inferSelect;
