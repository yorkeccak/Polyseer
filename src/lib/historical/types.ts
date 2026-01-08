/**
 * Types for historical grounding and event-based reasoning
 */

export interface HistoricalContext {
  baseRate: BaseRateData | null;
  analogues: AnalogueMatch[];
  warnings: HistoricalWarning[];
  confidence: "high" | "medium" | "low" | "none";
  sampleSize: number;
  priorAdjustment: number; // How much to adjust prior based on historical data
}

export interface BaseRateData {
  category: string;
  subcategory?: string;
  baseRate: number; // Probability (0-1) based on historical outcomes
  totalSamples: number;
  positiveOutcomes: number;
  negativeOutcomes: number;
  confidence: number; // Statistical confidence based on sample size
  timeRange?: {
    start: Date;
    end: Date;
  };
  trend?: "increasing" | "decreasing" | "stable";
  volatility?: number;
}

export interface AnalogueMatch {
  id: string;
  title: string;
  description: string;
  eventDate?: Date;
  outcome: string;
  outcomeType: "binary" | "continuous" | "categorical";

  // Similarity scoring
  similarityScore: number; // 0-1, how similar to current situation
  keySimilarities: string[];
  keyDifferences: string[];

  // Context
  geopoliticalContext?: string;
  economicContext?: string;
  technologicalContext?: string;
  socialContext?: string;

  // Precedent strength
  precedentStrength: "strong" | "moderate" | "weak";
  precedentNotes?: string;

  // Links to data
  relatedMarkets?: string[];
  sources?: string[];
  verificationLevel: "verified" | "credible" | "unverified";
}

export interface HistoricalWarning {
  type: "insufficient_data" | "low_confidence" | "outdated_precedent" | "context_mismatch" | "high_volatility";
  severity: "high" | "medium" | "low";
  message: string;
  details?: string;
}

export interface ResolvedMarketOutcome {
  id: string;
  question: string;
  platform: string;
  category?: string;
  subcategory?: string;

  // Dates
  createdDate?: Date;
  closeDate: Date;
  resolutionDate: Date;

  // Outcome
  outcome: "YES" | "NO" | "UNKNOWN" | string;
  outcomeDetails?: any;

  // Market data
  volume?: number;
  liquidity?: number;
  initialPrice?: number;
  finalPrice?: number;

  // Our forecast performance (if we made one)
  forecastPrediction?: number;
  forecastCorrect?: boolean;
  brierScore?: number;

  // Event context
  eventType?: string;
  eventContext?: any;
}

export interface CategoryClassification {
  category: string;
  subcategory?: string;
  tags: string[];
  confidence: number;
  reasoning: string;
}

export interface HistoricalPrior {
  probability: number;
  source: "base_rate" | "analogues" | "hybrid";
  baseRate?: BaseRateData;
  analogues?: AnalogueMatch[];
  adjustmentReasoning: string;
  uncertaintyBounds: {
    lower: number;
    upper: number;
  };
}
