import { aggregateNeutral, blendMarket } from '../forecasting/aggregator';
import { Evidence } from '../forecasting/types';
import { evidenceLogLR, TYPE_CAPS } from '../forecasting/evidence';
import { clamp } from '../forecasting/math';
import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

// Model helpers
const getModel = () => openai('gpt-4o');
const getModelSmall = () => openai('gpt-4o-mini');

export interface MarketSnapshot { 
  probability: number; 
  asOf: string; 
  source?: string; 
}

export type MarketFn = (question: string) => Promise<MarketSnapshot>;

export async function analystAgent(
  question: string, 
  p0: number, 
  evidence: Evidence[], 
  rhoByCluster?: Record<string, number>, 
  marketFn?: MarketFn
) {
  const { pNeutral, influence, clusters } = aggregateNeutral(p0, evidence, rhoByCluster);
  let pAware: number | undefined;
  
  if (marketFn) {
    const m = await marketFn(question);   // firewall: used only here after neutral
    pAware = blendMarket(pNeutral, m.probability, 0.1);
  }
  
  return { pNeutral, pAware, influence, clusters };
}

const RelevanceSchema = z.object({
  relevantEvidence: z.array(z.object({
    id: z.string(),
    isRelevant: z.boolean(),
    reasoning: z.string().describe('Brief explanation of why this evidence is or isn\'t relevant to the question')
  }))
});

async function analyzeTopicRelevance(evidence: Evidence[], question: string): Promise<string[]> {
  if (evidence.length === 0) return [];
  
  try {
    const { object } = await generateObject({
      model: getModelSmall(),
      schema: RelevanceSchema,
      system: `You are a relevance analyzer. Determine if evidence items are directly relevant to the prediction question.

RELEVANCE CRITERIA:
- Evidence must be about the SAME subject/entity as the question
- Evidence must relate to the SAME context or domain as the question  
- Evidence must provide information that could reasonably influence the prediction

IRRELEVANT EXAMPLES:
- Medical studies when question is about politics
- Safety research when question is about financial markets
- General statistics unrelated to the specific subject
- Evidence about different people, companies, or contexts`,
      prompt: `Question: "${question}"

Analyze each piece of evidence for relevance:

${evidence.map(e => `
ID: ${e.id}
Claim: "${e.claim}"
URLs: ${e.urls.join(', ') || 'None'}
`).join('\n')}

For each evidence item, determine if it's directly relevant to answering the prediction question. Be strict - only mark as relevant if the evidence could reasonably influence the probability of the specific outcome being predicted.`
    });

    const relevantIds = object.relevantEvidence
      .filter(item => item.isRelevant)
      .map(item => item.id);

    // Log any filtered evidence for debugging
    const filteredItems = object.relevantEvidence.filter(item => !item.isRelevant);
    if (filteredItems.length > 0) {
      console.log('🔍 Topic relevance analysis:');
      filteredItems.forEach(item => {
        console.log(`  ❌ ${item.id}: ${item.reasoning}`);
      });
    }

    return relevantIds;
  } catch (error) {
    console.warn('⚠️  Topic relevance analysis failed, keeping all evidence:', error);
    return evidence.map(e => e.id); // Fallback: keep all evidence if analysis fails
  }
}

const NicheSchema = z.object({
  niche: z.array(z.object({
    id: z.string(),
    authority: z.number().min(0).max(1),
    rationale: z.string().describe('Why this source is considered niche-credible for this topic')
  }))
});

async function analyzeNicheAuthority(evidence: Evidence[], question: string): Promise<Record<string, number>> {
  if (evidence.length === 0) return {};
  const model = openai('gpt-5');
  try {
    const list = evidence.map(e => {
      const domain = e.urls && e.urls.length ? (() => { try { return new URL(e.urls[0]).hostname.replace(/^www\./,''); } catch { return 'unknown'; } })() : 'unknown';
      return `ID: ${e.id}\nType: ${e.type}\nDomain: ${domain}\nClaim: ${e.claim}`;
    }).join('\n\n');

    const { object } = await generateObject({
      model,
      schema: NicheSchema,
      system: `You are a domain-savvy assessor. For each evidence item, rate whether the SOURCE appears to be a credible niche/specialist outlet for the TOPIC, not just mainstream brand reputation. Return authority in [0,1].`,
      prompt: `Question: "${question}"

Assess niche credibility for each evidence source listed. Consider:
- Domain specificity to the topic/domain of the question (e.g., specialized industry sites, respected orgs, expert-run resources)
- Track record within the niche (as far as can be inferred)
- Avoid giving high scores just for mainstream outlets (Reuters/WSJ/AP/etc.) unless the topic is their specific specialty desk.
- If unclear, assign mid/low authority.

ITEMS:\n\n${list}

Return JSON only.`,
    });

    const map: Record<string, number> = {};
    for (const row of object.niche) map[row.id] = row.authority;
    return map;
  } catch (err) {
    console.warn('⚠️ Niche authority analysis failed, skipping:', err);
    return {};
  }
}

function pathwayBoost(path?: string): number {
  if (!path) return 0;
  const key = path.toLowerCase();
  if (key.includes('platform') || key.includes('policy') || key.includes('distribution')) return 0.30;
  if (key.includes('release') || key.includes('tour') || key.includes('product')) return 0.30;
  if (key.includes('viral')) return 0.20;
  if (key.includes('award') || key.includes('media')) return 0.15;
  if (key.includes('regulatory') || key.includes('legal')) return 0.25;
  if (key.includes('macro') || key.includes('geopolitical')) return 0.20;
  return 0.10; // mild default for unknown pathways
}

// Stronger, explicit recency weighting to favor very fresh evidence
function recencyMultiplier(publishedAt?: string, now = Date.now()): number {
  if (!publishedAt) return 0.85; // downweight undated items
  const ts = Date.parse(publishedAt);
  if (Number.isNaN(ts)) return 0.85;
  const days = Math.max(0, (now - ts) / (1000 * 60 * 60 * 24));
  // Buckets:
  // 0-30 days: strong upweight
  // 31-180 days: moderate upweight
  // 181-365 days: slight downweight compared to neutral
  // >365 days: heavier downweight (should rarely appear due to earlier filters)
  if (days <= 30) return 1.35;
  if (days <= 180) return 1.20;
  if (days <= 365) return 0.95;
  return 0.85;
}

export async function analystAgentWithCritique(
  question: string, 
  p0: number, 
  evidence: Evidence[], 
  critique: { duplicationFlags: string[]; correlationAdjustments: Record<string, number>; dataConcerns: string[] },
  rhoByCluster?: Record<string, number>, 
  marketFn?: MarketFn
) {
  // Step 1: Filter out flagged evidence based on critic feedback
  let filteredEvidence = evidence.filter(e => {
    // Remove evidence flagged as duplicates or with severe data concerns
    const isDuplicate = critique.duplicationFlags.some(flag => 
      e.id.includes(flag) || e.originId.includes(flag)
    );
    const hasDataConcerns = critique.dataConcerns.some(concern => 
      e.claim.toLowerCase().includes(concern.toLowerCase()) ||
      e.originId.toLowerCase().includes(concern.toLowerCase())
    );
    
    return !isDuplicate && !hasDataConcerns;
  });

  // Step 2: Use LLM to analyze topic relevance
  console.log(`🔍 Analyzing topic relevance for ${filteredEvidence.length} evidence items...`);
  const relevantIds = await analyzeTopicRelevance(filteredEvidence, question);
  
  // Filter to only include relevant evidence
  const topicFilteredEvidence = filteredEvidence.filter(e => relevantIds.includes(e.id));
  const offTopicCount = filteredEvidence.length - topicFilteredEvidence.length;
  
  if (offTopicCount > 0) {
    console.warn(`🚨 Filtered out ${offTopicCount} off-topic evidence items via LLM analysis`);
    filteredEvidence = topicFilteredEvidence;
  }

  // Step 3: Optionally boost niche B/C/D sources
  const nicheMap = await analyzeNicheAuthority(filteredEvidence, question);
  const boostedEvidence = filteredEvidence.map(e => {
    const authority = nicheMap[e.id] ?? 0;
    if (authority <= 0) return e;
    if (e.type === 'A') return e; // keep A unchanged
    const base = evidenceLogLR(e);
    // Heavier boost for lower-tier types when niche-credible
    const mult = e.type === 'B' ? 0.20 : e.type === 'C' ? 0.35 : 0.50; // B/C/D
    const cap = TYPE_CAPS[e.type];
    const hinted = clamp(base * (1 + mult * authority), -cap, cap);
    return { ...e, logLRHint: hinted };
  });

  // Step 4: Apply pathway/connection strength scaling
  const pathwayScaled = boostedEvidence.map(e => {
    const strength = typeof e.connectionStrength === 'number' ? Math.max(0, Math.min(1, e.connectionStrength)) : 0;
    const pBoost = pathwayBoost(e.pathway);
    if (strength <= 0 && pBoost <= 0) return e;
    const base = typeof e.logLRHint === 'number' ? e.logLRHint : evidenceLogLR(e);
    const cap = TYPE_CAPS[e.type];
    const scale = 1 + pBoost * strength; // up to +30% for strong pathway
    const hinted = clamp(base * scale, -cap, cap);
    return { ...e, logLRHint: hinted };
  });

  // Step 4b: Apply explicit recency multiplier to strongly favor fresh evidence
  const recencyScaled = pathwayScaled.map(e => {
    const mult = recencyMultiplier(e.publishedAt);
    const base = typeof e.logLRHint === 'number' ? e.logLRHint : evidenceLogLR(e);
    const cap = TYPE_CAPS[e.type];
    const hinted = clamp(base * mult, -cap, cap);
    return { ...e, logLRHint: hinted };
  });

  // Step 5: Apply correlation adjustments from critic
  const adjustedRho = { ...rhoByCluster };
  for (const [clusterId, adjustment] of Object.entries(critique.correlationAdjustments)) {
    adjustedRho[clusterId] = adjustment;
  }

  console.log(`📊 Analyst applying critic feedback: filtered ${evidence.length - filteredEvidence.length} evidence items total, niche-boosted ${Object.keys(nicheMap).length} items, pathway-scaled ${pathwayScaled.length} items, adjusted ${Object.keys(critique.correlationAdjustments).length} correlations`);

  const { pNeutral, influence, clusters } = aggregateNeutral(p0, recencyScaled, adjustedRho);
  let pAware: number | undefined;
  
  if (marketFn) {
    const m = await marketFn(question);   // firewall: used only here after neutral
    pAware = blendMarket(pNeutral, m.probability, 0.1);
  }
  
  return { pNeutral, pAware, influence, clusters, filteredEvidence: recencyScaled };
}
