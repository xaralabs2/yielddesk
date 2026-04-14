import { pgTable, serial, real, timestamp, varchar, text, index } from "drizzle-orm/pg-core";

export const mmRatesTable = pgTable("mm_rates", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 30 }).notNull(),
  rateType: varchar("rate_type", { length: 30 }).notNull(),
  tenor: varchar("tenor", { length: 30 }).notNull(),
  rate: real("rate").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("mm_rates_source_idx").on(table.source),
  index("mm_rates_source_date_idx").on(table.source, table.date),
  index("mm_rates_date_idx").on(table.date),
]);

export type MmRate = typeof mmRatesTable.$inferSelect;
