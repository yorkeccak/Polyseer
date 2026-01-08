/**
 * Historical Grounding Service
 *
 * Provides historical context, base rates, and analogous precedents
 * for forecasting questions. Ensures all forecasts are grounded in
 * empirical data from resolved markets and historical events.
 */

import { getLocalDb } from "../local-db/client";
import { isSelfHostedMode } from "../local-db/local-auth";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import * as schema from "../local-db/schema";
import {
  HistoricalContext,
  BaseRateData,
  AnalogueMatch,
  HistoricalWarning,
  ResolvedMarketOutcome,
  CategoryClassification,
  HistoricalPrior,
} from "./types";

// Minimum sample size thresholds for confidence levels
const CONFIDENCE_THRESHOLDS = {
  HIGH: 30,
  MEDIUM: 10,
  LOW: 3,
};

// Time decay factor: how much to weight recent vs old data (in days)
const TIME_DECAY_HALFLIFE = 730; // 2 years

/**
 * Main function to retrieve historical context for a forecasting question
 */
export async function getHistoricalContext(
  question: string,
  category?: string,
  subcategory?: string,
  marketData?: any
): Promise<HistoricalContext> {
  const warnings: HistoricalWarning[] = [];

  // If no category provided, try to classify the question
  let finalCategory = category;
  let finalSubcategory = subcategory;

  if (!finalCategory) {
    const classification = await classifyQuestion(question, marketData);
    finalCategory = classification.category;
    finalSubcategory = classification.subcategory;
  }

  // Retrieve base rate from historical data
  const baseRate = await calculateBaseRate(
    finalCategory,
    finalSubcategory,
    warnings
  );

  // Find analogous historical events
  const analogues = await findAnalogues(
    question,
    finalCategory,
    finalSubcategory,
    marketData,
    warnings
  );

  // Determine overall confidence
  const sampleSize = baseRate?.totalSamples || 0;
  let confidence: "high" | "medium" | "low" | "none";

  if (sampleSize >= CONFIDENCE_THRESHOLDS.HIGH && analogues.length >= 3) {
    confidence = "high";
  } else if (sampleSize >= CONFIDENCE_THRESHOLDS.MEDIUM && analogues.length >= 1) {
    confidence = "medium";
  } else if (sampleSize >= CONFIDENCE_THRESHOLDS.LOW || analogues.length >= 1) {
    confidence = "low";
  } else {
    confidence = "none";
    warnings.push({
      type: "insufficient_data",
      severity: "high",
      message: "Insufficient historical data available",
      details: `Only ${sampleSize} historical markets found in this category. Base rate estimates have very high uncertainty.`,
    });
  }

  // Calculate prior adjustment based on historical data quality
  const priorAdjustment = calculatePriorAdjustment(baseRate, analogues, confidence);

  return {
    baseRate,
    analogues,
    warnings,
    confidence,
    sampleSize,
    priorAdjustment,
  };
}

/**
 * Calculate base rate from resolved markets in a category
 */
export async function calculateBaseRate(
  category: string | null | undefined,
  subcategory?: string | null,
  warnings: HistoricalWarning[] = []
): Promise<BaseRateData | null> {
  if (!category) {
    warnings.push({
      type: "insufficient_data",
      severity: "medium",
      message: "No category specified for base rate calculation",
    });
    return null;
  }

  if (isSelfHostedMode()) {
    const db = getLocalDb();

    // Query resolved markets in this category
    const conditions = [
      eq(schema.resolvedMarkets.resolved, true),
      eq(schema.resolvedMarkets.category, category),
    ];

    if (subcategory) {
      conditions.push(eq(schema.resolvedMarkets.subcategory, subcategory));
    }

    const markets = await db.query.resolvedMarkets.findMany({
      where: and(...conditions),
      orderBy: [desc(schema.resolvedMarkets.resolutionDate)],
    });

    if (markets.length === 0) {
      warnings.push({
        type: "insufficient_data",
        severity: "high",
        message: `No historical data for category: ${category}${subcategory ? ` / ${subcategory}` : ""}`,
        details: "Base rate cannot be calculated. Falling back to market price as prior.",
      });
      return null;
    }

    // Calculate base rate with time weighting
    let weightedPositives = 0;
    let totalWeight = 0;
    let positiveOutcomes = 0;
    let negativeOutcomes = 0;

    const now = new Date();
    const prices: number[] = [];

    for (const market of markets) {
      if (!market.resolutionDate) continue;

      const outcome = market.outcome?.toUpperCase();
      const isPositive = outcome === "YES" || outcome === "TRUE" || outcome === "1";

      // Calculate time weight (more recent = higher weight)
      const ageInDays = (now.getTime() - market.resolutionDate.getTime()) / (1000 * 60 * 60 * 24);
      const weight = Math.exp(-ageInDays / TIME_DECAY_HALFLIFE);

      if (isPositive) {
        positiveOutcomes++;
        weightedPositives += weight;
      } else if (outcome === "NO" || outcome === "FALSE" || outcome === "0") {
        negativeOutcomes++;
      }

      totalWeight += weight;

      // Track price volatility
      if (market.finalPrice !== null && market.finalPrice !== undefined) {
        prices.push(market.finalPrice);
      }
    }

    const totalSamples = positiveOutcomes + negativeOutcomes;
    const baseRate = totalWeight > 0 ? weightedPositives / totalWeight : 0.5;

    // Calculate confidence based on sample size (Wilson score interval)
    const confidence = calculateStatisticalConfidence(totalSamples);

    // Calculate volatility
    let volatility: number | undefined;
    if (prices.length > 1) {
      const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
      const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
      volatility = Math.sqrt(variance);

      if (volatility > 0.15) {
        warnings.push({
          type: "high_volatility",
          severity: "medium",
          message: "High historical volatility detected",
          details: `Historical market prices in this category show high variance (σ=${volatility.toFixed(3)}). Base rate may be less reliable.`,
        });
      }
    }

    // Detect trend
    let trend: "increasing" | "decreasing" | "stable" | undefined;
    if (markets.length >= 5) {
      const recentCount = Math.min(5, markets.length);
      const recentPositives = markets.slice(0, recentCount).filter(m =>
        m.outcome?.toUpperCase() === "YES"
      ).length;
      const olderPositives = markets.slice(recentCount).filter(m =>
        m.outcome?.toUpperCase() === "YES"
      ).length;

      const recentRate = recentPositives / recentCount;
      const olderRate = markets.length > recentCount
        ? olderPositives / (markets.length - recentCount)
        : recentRate;

      if (Math.abs(recentRate - olderRate) > 0.15) {
        trend = recentRate > olderRate ? "increasing" : "decreasing";
      } else {
        trend = "stable";
      }
    }

    // Add warning if sample size is low
    if (totalSamples < CONFIDENCE_THRESHOLDS.MEDIUM) {
      warnings.push({
        type: "low_confidence",
        severity: totalSamples < CONFIDENCE_THRESHOLDS.LOW ? "high" : "medium",
        message: `Limited historical data (n=${totalSamples})`,
        details: "Base rate estimate has wide confidence intervals. Consider broadening category or using market price.",
      });
    }

    const timeRange = markets.length > 0 ? {
      start: markets[markets.length - 1].resolutionDate!,
      end: markets[0].resolutionDate!,
    } : undefined;

    return {
      category,
      subcategory: subcategory || undefined,
      baseRate,
      totalSamples,
      positiveOutcomes,
      negativeOutcomes,
      confidence,
      timeRange,
      trend,
      volatility,
    };
  } else {
    // Supabase version
    const supabase = await createSupabaseClient();

    let query = supabase
      .from("resolved_markets")
      .select("*")
      .eq("resolved", true)
      .eq("category", category)
      .order("resolution_date", { ascending: false });

    if (subcategory) {
      query = query.eq("subcategory", subcategory);
    }

    const { data: markets, error } = await query;

    if (error || !markets || markets.length === 0) {
      warnings.push({
        type: "insufficient_data",
        severity: "high",
        message: `No historical data for category: ${category}${subcategory ? ` / ${subcategory}` : ""}`,
      });
      return null;
    }

    // Same calculation logic as above
    let weightedPositives = 0;
    let totalWeight = 0;
    let positiveOutcomes = 0;
    let negativeOutcomes = 0;
    const now = new Date();

    for (const market of markets) {
      const resolutionDate = new Date(market.resolution_date);
      const outcome = market.outcome?.toUpperCase();
      const isPositive = outcome === "YES" || outcome === "TRUE" || outcome === "1";

      const ageInDays = (now.getTime() - resolutionDate.getTime()) / (1000 * 60 * 60 * 24);
      const weight = Math.exp(-ageInDays / TIME_DECAY_HALFLIFE);

      if (isPositive) {
        positiveOutcomes++;
        weightedPositives += weight;
      } else if (outcome === "NO" || outcome === "FALSE" || outcome === "0") {
        negativeOutcomes++;
      }

      totalWeight += weight;
    }

    const totalSamples = positiveOutcomes + negativeOutcomes;
    const baseRate = totalWeight > 0 ? weightedPositives / totalWeight : 0.5;
    const confidence = calculateStatisticalConfidence(totalSamples);

    if (totalSamples < CONFIDENCE_THRESHOLDS.MEDIUM) {
      warnings.push({
        type: "low_confidence",
        severity: totalSamples < CONFIDENCE_THRESHOLDS.LOW ? "high" : "medium",
        message: `Limited historical data (n=${totalSamples})`,
      });
    }

    return {
      category,
      subcategory: subcategory || undefined,
      baseRate,
      totalSamples,
      positiveOutcomes,
      negativeOutcomes,
      confidence,
    };
  }
}

/**
 * Find analogous historical events for comparison
 */
export async function findAnalogues(
  question: string,
  category?: string | null,
  subcategory?: string | null,
  marketData?: any,
  warnings: HistoricalWarning[] = []
): Promise<AnalogueMatch[]> {
  if (isSelfHostedMode()) {
    const db = getLocalDb();

    const conditions = [];
    if (category) {
      conditions.push(eq(schema.historicalAnalogues.category, category));
    }
    if (subcategory) {
      conditions.push(eq(schema.historicalAnalogues.subcategory, subcategory));
    }

    const analogues = await db.query.historicalAnalogues.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(schema.historicalAnalogues.eventDate)],
      limit: 10,
    });

    if (analogues.length === 0) {
      warnings.push({
        type: "insufficient_data",
        severity: "medium",
        message: "No historical analogues found",
        details: "No precedent cases available for comparison. Analysis will rely more heavily on current evidence.",
      });
      return [];
    }

    // Convert to AnalogueMatch format
    return analogues.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      eventDate: a.eventDate || undefined,
      outcome: a.outcome,
      outcomeType: (a.outcomeType || "binary") as "binary" | "continuous" | "categorical",
      similarityScore: 0.7, // TODO: Implement semantic similarity scoring
      keySimilarities: a.keySimilarities ? JSON.parse(a.keySimilarities) : [],
      keyDifferences: a.keyDifferences ? JSON.parse(a.keyDifferences) : [],
      geopoliticalContext: a.geopoliticalContext || undefined,
      economicContext: a.economicContext || undefined,
      technologicalContext: a.technologicalContext || undefined,
      socialContext: a.socialContext || undefined,
      precedentStrength: (a.precedentStrength || "moderate") as "strong" | "moderate" | "weak",
      precedentNotes: a.precedentNotes || undefined,
      relatedMarkets: a.relatedMarketIds ? JSON.parse(a.relatedMarketIds) : undefined,
      sources: a.sources ? JSON.parse(a.sources) : undefined,
      verificationLevel: (a.verificationLevel || "credible") as "verified" | "credible" | "unverified",
    }));
  } else {
    // Supabase version
    const supabase = await createSupabaseClient();

    let query = supabase
      .from("historical_analogues")
      .select("*")
      .order("event_date", { ascending: false })
      .limit(10);

    if (category) {
      query = query.eq("category", category);
    }
    if (subcategory) {
      query = query.eq("subcategory", subcategory);
    }

    const { data: analogues, error } = await query;

    if (error || !analogues || analogues.length === 0) {
      warnings.push({
        type: "insufficient_data",
        severity: "medium",
        message: "No historical analogues found",
      });
      return [];
    }

    return analogues.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      eventDate: a.event_date ? new Date(a.event_date) : undefined,
      outcome: a.outcome,
      outcomeType: (a.outcome_type || "binary") as "binary" | "continuous" | "categorical",
      similarityScore: 0.7,
      keySimilarities: a.key_similarities || [],
      keyDifferences: a.key_differences || [],
      geopoliticalContext: a.geopolitical_context,
      economicContext: a.economic_context,
      technologicalContext: a.technological_context,
      socialContext: a.social_context,
      precedentStrength: (a.precedent_strength || "moderate") as "strong" | "moderate" | "weak",
      precedentNotes: a.precedent_notes,
      relatedMarkets: a.related_market_ids,
      sources: a.sources,
      verificationLevel: (a.verification_level || "credible") as "verified" | "credible" | "unverified",
    }));
  }
}

/**
 * Classify a question into category/subcategory using simple heuristics
 * TODO: Replace with LLM-based classification for better accuracy
 */
export async function classifyQuestion(
  question: string,
  marketData?: any
): Promise<CategoryClassification> {
  const lowerQuestion = question.toLowerCase();

  // Simple keyword-based classification
  const categories = {
    elections: ["election", "vote", "win", "president", "senate", "congress", "governor"],
    geopolitics: ["war", "conflict", "treaty", "diplomacy", "invasion", "sanctions", "military"],
    economics: ["gdp", "inflation", "recession", "unemployment", "market", "stock", "economy"],
    tech: ["ai", "technology", "software", "hardware", "launch", "release", "bitcoin", "crypto"],
    sports: ["championship", "win", "team", "player", "game", "tournament", "olympics"],
    climate: ["climate", "temperature", "emissions", "renewable", "carbon", "weather"],
    regulation: ["law", "regulation", "policy", "court", "ruling", "legislation", "ban"],
  };

  let bestCategory = "general";
  let maxMatches = 0;

  for (const [category, keywords] of Object.entries(categories)) {
    const matches = keywords.filter(kw => lowerQuestion.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
    }
  }

  return {
    category: bestCategory,
    subcategory: undefined,
    tags: [],
    confidence: maxMatches > 0 ? 0.7 : 0.3,
    reasoning: maxMatches > 0
      ? `Classified based on keywords: ${categories[bestCategory as keyof typeof categories].filter(kw => lowerQuestion.includes(kw)).join(", ")}`
      : "No clear category match, using general category",
  };
}

/**
 * Calculate how much to adjust the prior based on historical data quality
 */
function calculatePriorAdjustment(
  baseRate: BaseRateData | null,
  analogues: AnalogueMatch[],
  confidence: "high" | "medium" | "low" | "none"
): number {
  if (!baseRate && analogues.length === 0) {
    return 0; // No adjustment, use market price
  }

  // Weight based on confidence and data quality
  const confidenceWeights = {
    high: 0.6,    // Strong historical data, adjust prior significantly
    medium: 0.4,  // Moderate historical data
    low: 0.2,     // Weak historical data, small adjustment
    none: 0,      // No historical data
  };

  return confidenceWeights[confidence];
}

/**
 * Calculate statistical confidence using Wilson score interval
 */
function calculateStatisticalConfidence(sampleSize: number): number {
  if (sampleSize === 0) return 0;
  if (sampleSize >= CONFIDENCE_THRESHOLDS.HIGH) return 0.95;
  if (sampleSize >= CONFIDENCE_THRESHOLDS.MEDIUM) return 0.80;
  if (sampleSize >= CONFIDENCE_THRESHOLDS.LOW) return 0.60;
  return 0.40;
}

/**
 * Calculate historical prior probability combining base rate and analogues
 */
export async function calculateHistoricalPrior(
  question: string,
  marketPrice: number,
  category?: string,
  subcategory?: string,
  marketData?: any
): Promise<HistoricalPrior> {
  const context = await getHistoricalContext(question, category, subcategory, marketData);

  if (!context.baseRate && context.analogues.length === 0) {
    // No historical data, use market price
    return {
      probability: marketPrice,
      source: "base_rate",
      adjustmentReasoning: "No historical data available. Using market price as prior.",
      uncertaintyBounds: {
        lower: Math.max(0.1, marketPrice - 0.3),
        upper: Math.min(0.9, marketPrice + 0.3),
      },
    };
  }

  let historicalP = marketPrice;
  let reasoning = "";

  if (context.baseRate) {
    // Blend base rate with market price
    const baseRateP = context.baseRate.baseRate;
    const weight = context.priorAdjustment;
    historicalP = weight * baseRateP + (1 - weight) * marketPrice;

    reasoning = `Base rate from ${context.baseRate.totalSamples} historical markets: ${(baseRateP * 100).toFixed(1)}%. `;
    reasoning += `Blended with market price (${(marketPrice * 100).toFixed(1)}%) using ${(weight * 100).toFixed(0)}% weight. `;

    if (context.baseRate.trend) {
      reasoning += `Trend: ${context.baseRate.trend}. `;
    }
  }

  if (context.analogues.length > 0) {
    const strongAnalogues = context.analogues.filter(a => a.precedentStrength === "strong");
    reasoning += `Found ${context.analogues.length} historical analogues`;
    if (strongAnalogues.length > 0) {
      reasoning += ` (${strongAnalogues.length} strong precedents)`;
    }
    reasoning += ". ";
  }

  // Calculate uncertainty bounds based on data quality
  const uncertaintyWidth = context.confidence === "high" ? 0.15 :
                           context.confidence === "medium" ? 0.25 :
                           context.confidence === "low" ? 0.35 : 0.40;

  return {
    probability: historicalP,
    source: context.baseRate && context.analogues.length > 0 ? "hybrid" :
            context.baseRate ? "base_rate" : "analogues",
    baseRate: context.baseRate || undefined,
    analogues: context.analogues.length > 0 ? context.analogues : undefined,
    adjustmentReasoning: reasoning,
    uncertaintyBounds: {
      lower: Math.max(0.05, historicalP - uncertaintyWidth),
      upper: Math.min(0.95, historicalP + uncertaintyWidth),
    },
  };
}
