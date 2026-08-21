import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const diasporaProfilesTable = pgTable("diaspora_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  countryOfResidence: varchar("country_of_residence", { length: 100 }).notNull(),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull().default("USD"),
  investmentExperience: varchar("investment_experience", { length: 30 }).notNull().default("BEGINNER"),
  riskTolerance: varchar("risk_tolerance", { length: 30 }).notNull().default("MODERATE"),
  investmentHorizon: varchar("investment_horizon", { length: 30 }).notNull().default("LONG_TERM"),
  goals: text("goals"),
  interests: text("interests"),
  estimatedCapitalRange: varchar("estimated_capital_range", { length: 50 }),
  readinessStage: varchar("readiness_stage", { length: 30 }).notNull().default("LEARNING"),
  consentPartnerUpdates: boolean("consent_partner_updates").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DiasporaProfile = typeof diasporaProfilesTable.$inferSelect;
export type NewDiasporaProfile = typeof diasporaProfilesTable.$inferInsert;
