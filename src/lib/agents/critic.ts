import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { Evidence } from '../forecasting/types';

// Model helper
const getModel = () => openai('gpt-4o');

export const CritiqueSchema = z.object({
  missing: z.array(z.string()).describe('missed disconfirming evidence or failure modes'),
  duplicationFlags: z.array(z.string()).describe('evidence ids suspected duplicate wiring'),
  dataConcerns: z.array(z.string()).describe('measurement or selection bias risks'),
  followUpSearches: z.array(z.object({
    query: z.string().describe('specific search query to fill gaps'),
    rationale: z.string().describe('why this search is needed'),
    side: z.enum(['FOR', 'AGAINST', 'NEUTRAL', 'BOTH']).describe('which side this search targets')
  })).max(10).describe('targeted searches to fill identified gaps'),
  correlationAdjustments: z.record(z.string(), z.number().min(0).max(1)).describe('suggested correlation adjustments for evidence clusters'),
  confidenceIssues: z.array(z.string()).describe('factors that should reduce confidence in the forecast')
});
export type Critique = z.infer<typeof CritiqueSchema>;

export async function criticAgent(question: string, pro: Evidence[], con: Evidence[]): Promise<Critique> {
  const { object } = await generateObject({
    model: getModel(),
    schema: CritiqueSchema,
    system: `You are the Skeptic. Your job is to identify gaps, biases, and quality issues in the evidence, then provide actionable feedback to improve the analysis.`,
    prompt: `Question: ${question}

EVIDENCE ANALYSIS:
Supporting Evidence (${pro.length} items):
${pro.map(e => `- ${e.id}: ${e.claim} (Type ${e.type}, Verifiability: ${e.verifiability})`).join('\n')}

Contradicting Evidence (${con.length} items):
${con.map(e => `- ${e.id}: ${e.claim} (Type ${e.type}, Verifiability: ${e.verifiability})`).join('\n')}

CRITICAL ANALYSIS TASKS:
1. **TOPIC RELEVANCE**: Flag any evidence that is off-topic or unrelated to "${question}"
   - Medical studies, safety research, general statistics unrelated to the specific question
   - Evidence about different people, companies, or contexts than what's being asked
2. Identify missing evidence types or perspectives that would strengthen the analysis
3. **RECENCY ENFORCEMENT**: Flag evidence older than 2024-01-01 (or without a clear publication date) for removal and propose replacements from 2024–2025.
3. Flag potential duplicates by examining originId patterns and claim similarity
4. Note data quality concerns, selection biases, or methodological issues
5. Suggest specific follow-up searches to fill critical gaps (max 10)
6. Recommend correlation adjustments for evidence clusters that seem related (use originId as key, correlation value 0-1 as value)
7. Identify factors that should reduce confidence in the final forecast

FOLLOW-UP SEARCH GUIDELINES:
- Target specific gaps in evidence coverage
- Add temporal constraints: include "2025" or "recent" for current events
- DO NOT prefix queries with outlet names (e.g., "Reuters ", "Bloomberg ", "WSJ ")
- Avoid restrictive site: searches for government domains (whitehouse.gov, congress.gov) - they rarely yield results
- Use broad natural-language keywords tied to the entities and mechanisms in question
- Balance FOR/AGAINST perspectives
- Prioritize searches likely to find Type A/B evidence over Type C/D
 - Prefer sources with explicit publication dates; avoid undated/archival items

CORRELATION ADJUSTMENTS FORMAT:
- Use originId as key (e.g., "reuters-001", "bloomberg-002")
- Use correlation value 0-1 as value (e.g., 0.8 for highly correlated sources)
- Example: {"reuters-001": 0.8, "bloomberg-002": 0.6}

Return comprehensive JSON analysis matching the exact schema.`,
  });
  return object;
}
