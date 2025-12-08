import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

// Model helper
const getModel = () => openai('gpt-4o');

export const PlanSchema = z.object({
  subclaims: z.array(z.string().min(5)).min(2).max(10).describe('Causal factors and pathways that could lead to the outcome'),
  keyVariables: z.array(z.string()).min(2).max(15).describe('Observable indicators and metrics to monitor'),
  searchSeeds: z.array(z.string()).min(20).max(20).describe('Specific search queries to find relevant information (exactly 20).'),
  decisionCriteria: z.array(z.string()).min(3).max(8).describe('Clear criteria for how to resolve the question'),
  recency: z.object({
    needed: z.boolean().describe('Whether strict recency (2024–2025) is critical to answer this question'),
    startDate: z.string().optional().describe('ISO date (YYYY-MM-DD) to use as start date when filtering results if needed')
  }).describe('Recency guidance for search queries and filtering'),
  adjacentEventTypes: z.array(z.string()).min(4).max(10).describe('General adjacent signal types to monitor (e.g., platform-policy changes, regulatory, awards/media, viral trends, distribution changes)'),
  adjacentSeeds: z.array(z.string()).min(6).max(12).describe('Smaller adjacent batch of queries targeting catalysts/competitors/platform changes (6-12)')
});

export type Plan = z.infer<typeof PlanSchema>;

export async function planAgent(question: string): Promise<Plan> {
  const { object } = await generateObject({
    model: getModel(),
    schema: PlanSchema,
    system: `You are the Planner. Break the forecasting question into causal pathways and research directions. Focus on WHAT COULD CAUSE the outcome, not what the final state looks like.`,
    prompt: `Question: ${question}

CRITICAL: This is a PREDICTION question, not a fact-checking question. Focus on causal factors and pathways to the outcome.

Break this down into:

- subclaims: 2-10 CAUSAL PATHWAYS that could lead to this outcome
  * NOT final states like "Xi holds office on Dec 31"  
  * Instead: "Health crisis forces Xi to step down", "Elite power struggle removes Xi", "Economic crisis undermines Xi's authority"
  * Focus on MECHANISMS and CAUSES that could produce the outcome

- keyVariables: 2-15 LEADING INDICATORS to monitor for early signals
  * Health indicators, political signals, economic metrics, institutional changes
  * Things that would change BEFORE the outcome occurs

- searchSeeds: Provide EXACTLY 20 specific search queries targeting causal factors
  * e.g., "Xi Jinping health concerns 2025", "CCP leadership changes", "China economic crisis 2025"
  * Prefer diversified phrasing, include time qualifiers (e.g., 2025, recent)
  * Focus on searching for drivers, not end states

- decisionCriteria: 3-8 clear criteria for what would constitute evidence of the pathways

- recency: Decide if strict recency is required (e.g., fast-moving markets/current year outcomes). If yes, set needed=true and propose a startDate (ISO, e.g., 2024-06-01). If not, set needed=false and omit startDate.

- adjacentEventTypes: 4-10 general catalyst categories (e.g., platform-policy changes, regulatory/legal, major media/awards/PR, viral social trends, product/platform launches, outages, pricing, macro shocks) that could affect the outcome indirectly.
- adjacentSeeds: 6-12 specific queries combining adjacentEventTypes with entities in this domain (competitors, platforms, regulators, markets) and include 2025 when appropriate.

Return JSON matching the schema.`,
  });
  return object;
}
