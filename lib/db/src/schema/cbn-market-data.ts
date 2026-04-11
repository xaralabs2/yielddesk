import { pgTable, serial, real, timestamp, varchar } from "drizzle-orm/pg-core";

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
});

export type CbnMarketData = typeof cbnMarketDataTable.$inferSelect;
