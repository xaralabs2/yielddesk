import {
  pgTable,
  serial,
  varchar,
  numeric,
  timestamp,
  text,
  integer,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const marketInstrumentsTable = pgTable(
  "market_instruments",
  {
    id: serial("id").primaryKey(),
    externalId: varchar("external_id", { length: 100 }).notNull(),
    market: varchar("market", { length: 2 }).notNull(),
    nativeCurrency: varchar("native_currency", { length: 3 }).notNull(),
    assetClass: varchar("asset_class", { length: 40 }).notNull(),
    symbol: varchar("symbol", { length: 50 }).notNull(),
    name: varchar("name", { length: 250 }).notNull(),
    venue: varchar("venue", { length: 100 }).notNull(),
    executionMode: varchar("execution_mode", { length: 30 })
      .notNull()
      .default("SIMULATION_ONLY"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("market_instrument_market_venue_symbol_uq").on(
      table.market,
      table.venue,
      table.symbol,
    ),
  ],
);

export const marketObservationsTable = pgTable("market_observations", {
  id: serial("id").primaryKey(),
  instrumentId: integer("instrument_id")
    .notNull()
    .references(() => marketInstrumentsTable.id),
  metric: varchar("metric", { length: 80 }).notNull(),
  value: numeric("value", { precision: 24, scale: 8 }).notNull(),
  currency: varchar("currency", { length: 3 }),
  unit: varchar("unit", { length: 30 }).notNull(),
  sourceName: varchar("source_name", { length: 200 }).notNull(),
  sourceUrl: text("source_url"),
  sourceAsOf: timestamp("source_as_of", { withTimezone: true }).notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  freshness: varchar("freshness", { length: 20 }).notNull(),
  confidence: integer("confidence").notNull(),
});

export type MarketInstrumentRow = typeof marketInstrumentsTable.$inferSelect;
export type MarketObservationRow = typeof marketObservationsTable.$inferSelect;
