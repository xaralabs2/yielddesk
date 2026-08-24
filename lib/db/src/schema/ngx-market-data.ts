import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const marketDataSourcesTable = pgTable(
  "market_data_sources",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 64 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    sourceType: varchar("source_type", { length: 40 }).notNull(),
    baseUrl: text("base_url"),
    licenseStatus: varchar("license_status", { length: 40 }).notNull().default("PUBLIC_SOURCE"),
    redistributionAllowed: boolean("redistribution_allowed").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("market_data_sources_code_uidx").on(table.code)],
);

export const sourceDocumentsTable = pgTable(
  "source_documents",
  {
    id: serial("id").primaryKey(),
    sourceId: integer("source_id").references(() => marketDataSourcesTable.id),
    documentType: varchar("document_type", { length: 60 }).notNull(),
    externalId: varchar("external_id", { length: 255 }),
    title: text("title"),
    sourceUrl: text("source_url").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    periodEnd: date("period_end"),
    sha256: varchar("sha256", { length: 64 }),
    rawMetadata: jsonb("raw_metadata"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("source_documents_source_idx").on(table.sourceId),
    uniqueIndex("source_documents_url_uidx").on(table.sourceUrl),
  ],
);

export const ngxCompaniesTable = pgTable(
  "ngx_companies",
  {
    id: serial("id").primaryKey(),
    legalName: text("legal_name").notNull(),
    displayName: text("display_name").notNull(),
    sector: varchar("sector", { length: 120 }),
    industry: varchar("industry", { length: 160 }),
    country: varchar("country", { length: 80 }).notNull().default("Nigeria"),
    website: text("website"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("ngx_companies_name_idx").on(table.displayName)],
);

export const ngxSecuritiesTable = pgTable(
  "ngx_securities",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => ngxCompaniesTable.id),
    symbol: varchar("symbol", { length: 32 }).notNull(),
    isin: varchar("isin", { length: 32 }),
    exchange: varchar("exchange", { length: 24 }).notNull().default("NGX"),
    currency: varchar("currency", { length: 8 }).notNull().default("NGN"),
    securityType: varchar("security_type", { length: 40 }).notNull().default("EQUITY"),
    sharesOutstanding: numeric("shares_outstanding", { precision: 24, scale: 4 }),
    freeFloatPct: real("free_float_pct"),
    isListed: boolean("is_listed").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ngx_securities_symbol_uidx").on(table.symbol),
    index("ngx_securities_company_idx").on(table.companyId),
  ],
);

export const ngxDailyPricesTable = pgTable(
  "ngx_daily_prices",
  {
    id: serial("id").primaryKey(),
    securityId: integer("security_id")
      .notNull()
      .references(() => ngxSecuritiesTable.id),
    sourceId: integer("source_id")
      .notNull()
      .references(() => marketDataSourcesTable.id),
    tradeDate: date("trade_date").notNull(),
    open: numeric("open", { precision: 20, scale: 6 }),
    high: numeric("high", { precision: 20, scale: 6 }),
    low: numeric("low", { precision: 20, scale: 6 }),
    close: numeric("close", { precision: 20, scale: 6 }).notNull(),
    previousClose: numeric("previous_close", { precision: 20, scale: 6 }),
    priceChange: numeric("price_change", { precision: 20, scale: 6 }),
    percentChange: real("percent_change"),
    volume: numeric("volume", { precision: 24, scale: 0 }),
    trades: integer("trades"),
    valueTraded: numeric("value_traded", { precision: 24, scale: 2 }),
    rawPayload: jsonb("raw_payload"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ngx_daily_prices_security_date_source_uidx").on(
      table.securityId,
      table.tradeDate,
      table.sourceId,
    ),
    index("ngx_daily_prices_security_date_idx").on(table.securityId, table.tradeDate),
  ],
);

export const ngxFinancialPeriodsTable = pgTable(
  "ngx_financial_periods",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => ngxCompaniesTable.id),
    sourceDocumentId: integer("source_document_id").references(() => sourceDocumentsTable.id),
    periodType: varchar("period_type", { length: 20 }).notNull(),
    fiscalYear: integer("fiscal_year").notNull(),
    periodEnd: date("period_end").notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("NGN"),
    isAudited: boolean("is_audited").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ngx_financial_periods_company_period_uidx").on(
      table.companyId,
      table.periodType,
      table.periodEnd,
    ),
  ],
);

export const ngxFinancialMetricsTable = pgTable(
  "ngx_financial_metrics",
  {
    id: serial("id").primaryKey(),
    periodId: integer("period_id")
      .notNull()
      .references(() => ngxFinancialPeriodsTable.id),
    sourceDocumentId: integer("source_document_id").references(() => sourceDocumentsTable.id),
    statementType: varchar("statement_type", { length: 32 }).notNull(),
    metricCode: varchar("metric_code", { length: 80 }).notNull(),
    metricLabel: text("metric_label"),
    value: numeric("value", { precision: 30, scale: 6 }).notNull(),
    unit: varchar("unit", { length: 24 }).notNull().default("NGN"),
    rawLabel: text("raw_label"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ngx_financial_metrics_period_metric_uidx").on(table.periodId, table.metricCode),
    index("ngx_financial_metrics_metric_idx").on(table.metricCode),
  ],
);

export const ngxDividendsTable = pgTable(
  "ngx_dividends",
  {
    id: serial("id").primaryKey(),
    securityId: integer("security_id")
      .notNull()
      .references(() => ngxSecuritiesTable.id),
    sourceDocumentId: integer("source_document_id").references(() => sourceDocumentsTable.id),
    financialYear: integer("financial_year"),
    dividendType: varchar("dividend_type", { length: 24 }),
    amountPerShare: numeric("amount_per_share", { precision: 20, scale: 6 }).notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("NGN"),
    qualificationDate: date("qualification_date"),
    exDate: date("ex_date"),
    paymentDate: date("payment_date"),
    announcedAt: date("announced_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("ngx_dividends_security_idx").on(table.securityId)],
);

export const ngxCorporateActionsTable = pgTable(
  "ngx_corporate_actions",
  {
    id: serial("id").primaryKey(),
    securityId: integer("security_id")
      .notNull()
      .references(() => ngxSecuritiesTable.id),
    sourceDocumentId: integer("source_document_id").references(() => sourceDocumentsTable.id),
    actionType: varchar("action_type", { length: 48 }).notNull(),
    announcedAt: date("announced_at"),
    effectiveDate: date("effective_date"),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("ngx_corporate_actions_security_idx").on(table.securityId)],
);

export const ngxDerivedMetricsTable = pgTable(
  "ngx_derived_metrics",
  {
    id: serial("id").primaryKey(),
    securityId: integer("security_id")
      .notNull()
      .references(() => ngxSecuritiesTable.id),
    asOfDate: date("as_of_date").notNull(),
    metricCode: varchar("metric_code", { length: 80 }).notNull(),
    value: numeric("value", { precision: 30, scale: 8 }).notNull(),
    methodVersion: varchar("method_version", { length: 40 }).notNull(),
    inputs: jsonb("inputs"),
    calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ngx_derived_metrics_security_date_metric_version_uidx").on(
      table.securityId,
      table.asOfDate,
      table.metricCode,
      table.methodVersion,
    ),
  ],
);

export type MarketDataSource = typeof marketDataSourcesTable.$inferSelect;
export type SourceDocument = typeof sourceDocumentsTable.$inferSelect;
export type NgxCompany = typeof ngxCompaniesTable.$inferSelect;
export type NgxSecurity = typeof ngxSecuritiesTable.$inferSelect;
export type NgxDailyPrice = typeof ngxDailyPricesTable.$inferSelect;
export type NgxFinancialPeriod = typeof ngxFinancialPeriodsTable.$inferSelect;
export type NgxFinancialMetric = typeof ngxFinancialMetricsTable.$inferSelect;
export type NgxDividend = typeof ngxDividendsTable.$inferSelect;
export type NgxCorporateAction = typeof ngxCorporateActionsTable.$inferSelect;
export type NgxDerivedMetric = typeof ngxDerivedMetricsTable.$inferSelect;
