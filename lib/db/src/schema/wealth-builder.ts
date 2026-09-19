import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export type WealthAllocation = {
  key: string;
  label: string;
  percentage: number;
  amountNgn: number;
  purpose: string;
};

export const wealthBuilderPlansTable = pgTable(
  "wealth_builder_plans",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id),
    goal: text("goal").notNull(),
    totalSpendNgn: numeric("total_spend_ngn", {
      precision: 18,
      scale: 2,
      mode: "number",
    }).notNull(),
    horizon: varchar("horizon", { length: 20 }).notNull(),
    strategy: varchar("strategy", { length: 20 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("CONFIRMED"),
    allocationsJson: jsonb("allocations_json").$type<WealthAllocation[]>().notNull(),
    methodologyVersion: varchar("methodology_version", { length: 40 })
      .notNull()
      .default("ng-v1"),
    limitationText: text("limitation_text").notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCreatedIdx: index("wealth_builder_plans_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  }),
);

export type WealthBuilderPlan = typeof wealthBuilderPlansTable.$inferSelect;
export type NewWealthBuilderPlan = typeof wealthBuilderPlansTable.$inferInsert;
