import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============================================
// Users Table
// ============================================
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),

  // Valyu OAuth metadata
  valyuSub: text("valyu_sub"),
  valyuUserType: text("valyu_user_type"),
  valyuOrganisationId: text("valyu_organisation_id"),
  valyuOrganisationName: text("valyu_organisation_name"),

  // Subscription info
  subscriptionTier: text("subscription_tier").default("valyu"),
  subscriptionStatus: text("subscription_status").default("active"),
});

// ============================================
// Analysis Sessions Table
// ============================================
export const analysisSessions = sqliteTable("analysis_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Market identification
  marketUrl: text("market_url").notNull(),
  platform: text("platform").default("polymarket"),
  marketIdentifier: text("market_identifier").notNull(),
  marketQuestion: text("market_question"),

  // Legacy column
  polymarketSlug: text("polymarket_slug"),

  // Status tracking
  status: text("status").default("pending"),
  startedAt: integer("started_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  currentStep: text("current_step"),
  progressEvents: text("progress_events"), // JSON string

  // Analysis results
  forecastResult: text("forecast_result"), // JSON string
  forecastCard: text("forecast_card"), // JSON string
  analysisSteps: text("analysis_steps"), // JSON string
  fullResponse: text("full_response"),
  markdownReport: text("markdown_report"),

  // Metadata
  p0: real("p0"),
  pNeutral: real("p_neutral"),
  pAware: real("p_aware"),
  drivers: text("drivers"), // JSON string
  durationSeconds: integer("duration_seconds"),
  valyuCost: real("valyu_cost").default(0),
  errorMessage: text("error_message"),

  // Historical grounding metadata
  historicalBaseRate: real("historical_base_rate"), // Base rate from historical data
  historicalSampleSize: integer("historical_sample_size"), // Number of historical markets used
  historicalConfidence: text("historical_confidence"), // "high", "medium", "low", "none"
  analoguesUsed: text("analogues_used"), // JSON array of analogue IDs referenced
  historicalAdjustment: real("historical_adjustment"), // How much historical data adjusted the prior
  historicalWarnings: text("historical_warnings"), // JSON array of warnings about data quality

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================
// Featured Markets Table
// ============================================
export const featuredMarkets = sqliteTable("featured_markets", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Market identification
  slug: text("slug").notNull(),
  question: text("question").notNull(),
  category: text("category"),

  // Platform-specific URLs
  polymarketUrl: text("polymarket_url").notNull(),
  marketUrl: text("market_url"),
  platform: text("platform").default("polymarket"),

  // Market metadata
  volume: integer("volume").notNull().default(0),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  currentOdds: text("current_odds"), // JSON string

  // Display configuration
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================
// Resolved Markets Table
// ============================================
export const resolvedMarkets = sqliteTable("resolved_markets", {
  id: text("id").primaryKey(),

  // Market identification
  marketUrl: text("market_url").notNull(),
  platform: text("platform").notNull(),
  marketIdentifier: text("market_identifier").notNull(),
  question: text("question").notNull(),

  // Categorization for base rate calculation
  category: text("category"), // e.g., "elections", "geopolitics", "economics", "tech", "sports"
  subcategory: text("subcategory"), // e.g., "us_elections", "crypto_regulation", "ai_timeline"
  tags: text("tags"), // JSON array of tags for flexible categorization

  // Market metadata
  createdDate: integer("created_date", { mode: "timestamp" }),
  closeDate: integer("close_date", { mode: "timestamp" }).notNull(),
  resolutionDate: integer("resolution_date", { mode: "timestamp" }).notNull(),
  volume: real("volume"),
  liquidity: real("liquidity"),

  // Outcome data
  resolved: integer("resolved", { mode: "boolean" }).notNull().default(false),
  outcome: text("outcome"), // "YES", "NO", "UNKNOWN", or specific option for multi-choice
  outcomeDetails: text("outcome_details"), // JSON with additional resolution info

  // Historical price data
  initialPrice: real("initial_price"), // Market price when created
  preForecastPrice: real("pre_forecast_price"), // Price before any analysis/forecast
  finalPrice: real("final_price"), // Price just before resolution
  priceHistory: text("price_history"), // JSON array of {timestamp, price} points

  // Forecast performance tracking
  forecastSessionId: text("forecast_session_id").references(() => analysisSessions.id),
  forecastPrediction: real("forecast_prediction"), // Our system's prediction (if any)
  forecastCorrect: integer("forecast_correct", { mode: "boolean" }), // Whether forecast was accurate
  brierScore: real("brier_score"), // Brier score for calibration (if forecast made)

  // Event context for precedent analysis
  eventType: text("event_type"), // e.g., "election", "regulatory_decision", "product_launch"
  eventContext: text("event_context"), // JSON with relevant historical context
  similarEvents: text("similar_events"), // JSON array of references to similar historical events

  // Data source and quality
  dataSource: text("data_source"), // Where this data came from
  verifiedResolution: integer("verified_resolution", { mode: "boolean" }).default(false),
  notes: text("notes"),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================
// Historical Analogues Table
// ============================================
export const historicalAnalogues = sqliteTable("historical_analogues", {
  id: text("id").primaryKey(),

  // Analogue identification
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventDate: integer("event_date", { mode: "timestamp" }),

  // Categorization
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  tags: text("tags"), // JSON array

  // Historical outcome
  outcome: text("outcome").notNull(), // What actually happened
  outcomeType: text("outcome_type"), // "binary", "continuous", "categorical"
  outcomeValue: text("outcome_value"), // JSON for structured outcome data

  // Contextual factors
  geopoliticalContext: text("geopolitical_context"),
  economicContext: text("economic_context"),
  technologicalContext: text("technological_context"),
  socialContext: text("social_context"),

  // Precedent value
  precedentStrength: text("precedent_strength"), // "strong", "moderate", "weak"
  precedentNotes: text("precedent_notes"),
  keyDifferences: text("key_differences"), // JSON array of how current situation differs
  keySimilarities: text("key_similarities"), // JSON array of similarities

  // Links to resolved markets
  relatedMarketIds: text("related_market_ids"), // JSON array of resolved_markets.id

  // Data source
  sources: text("sources"), // JSON array of source URLs/references
  verificationLevel: text("verification_level"), // "verified", "credible", "unverified"

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================
// Base Rate Categories Table
// ============================================
export const baseRateCategories = sqliteTable("base_rate_categories", {
  id: text("id").primaryKey(),

  // Category identification
  name: text("name").notNull().unique(),
  description: text("description"),
  parentCategory: text("parent_category"),

  // Base rate statistics (calculated from resolved markets)
  totalMarkets: integer("total_markets").default(0),
  positiveOutcomes: integer("positive_outcomes").default(0),
  negativeOutcomes: integer("negative_outcomes").default(0),
  baseRate: real("base_rate"), // positiveOutcomes / totalMarkets
  confidence: real("confidence"), // Confidence in base rate (based on sample size)

  // Temporal trends
  baseRateTrend: text("base_rate_trend"), // JSON array of {period, baseRate}
  volatility: real("volatility"), // How much base rate varies over time

  // Filters for calculating base rate
  filters: text("filters"), // JSON object with filter criteria
  lastCalculated: integer("last_calculated", { mode: "timestamp" }),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================
// Type Exports
// ============================================
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type AnalysisSession = typeof analysisSessions.$inferSelect;
export type InsertAnalysisSession = typeof analysisSessions.$inferInsert;
export type FeaturedMarket = typeof featuredMarkets.$inferSelect;
export type InsertFeaturedMarket = typeof featuredMarkets.$inferInsert;
export type ResolvedMarket = typeof resolvedMarkets.$inferSelect;
export type InsertResolvedMarket = typeof resolvedMarkets.$inferInsert;
export type HistoricalAnalogue = typeof historicalAnalogues.$inferSelect;
export type InsertHistoricalAnalogue = typeof historicalAnalogues.$inferInsert;
export type BaseRateCategory = typeof baseRateCategories.$inferSelect;
export type InsertBaseRateCategory = typeof baseRateCategories.$inferInsert;
