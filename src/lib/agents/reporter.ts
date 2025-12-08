import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { InfluenceItem, ClusterMeta, Evidence } from '../forecasting/types';

// Model helper
const getModel = () => openai('gpt-4o-mini');

export async function reporterAgent(
  question: string,
  p0: number,
  pNeutral: number,
  pAware: number | undefined,
  influence: InfluenceItem[],
  clusters: ClusterMeta[],
  drivers: string[],
  evidence: Evidence[],
  topN = 12
) {
  const top = [...influence].sort((a, b) => b.deltaPP - a.deltaPP).slice(0, topN);

  // Lookup maps
  const evidenceMap = evidence.reduce((map, ev) => { map[ev.id] = ev; return map; }, {} as Record<string, Evidence>);
  const clusterMap = clusters.reduce((m, c) => { m[c.clusterId] = c; return m; }, {} as Record<string, ClusterMeta>);

  const topEvidenceWithClaims = top.map(t => {
    const ev = evidenceMap[t.evidenceId];
    return {
      id: t.evidenceId,
      claim: ev?.claim || 'Evidence not found',
      polarity: ev?.polarity || 0,
      deltaPP: t.deltaPP,
      type: ev?.type || 'Unknown',
      publishedAt: ev?.publishedAt || 'n/a',
      urls: ev?.urls || [],
      originId: ev?.originId || 'unknown',
      verifiability: ev?.verifiability ?? 0,
      corroborationsIndep: ev?.corroborationsIndep ?? 0,
      consistency: ev?.consistency ?? 0,
      cluster: ev?.originId ? clusterMap[ev.originId] : undefined,
      logLR: influence.find(i => i.evidenceId === t.evidenceId)?.logLR ?? 0,
    };
  });

  const predictionDirection = pNeutral > 0.5 ? 'YES' : 'NO';
  const confidence = Math.abs(pNeutral - 0.5) * 200;

  const catalogLines = topEvidenceWithClaims.map(e => {
    const domain = e.urls && e.urls.length ? (() => { try { return new URL(e.urls[0]).hostname.replace(/^www\./, ''); } catch { return 'unknown'; } })() : 'unknown';
    const clusterMeta = e.cluster ? `cluster=${e.cluster.clusterId}, rho=${e.cluster.rho.toFixed(2)}, mEff=${e.cluster.mEff.toFixed(2)}` : 'cluster=n/a';
    return `- ${e.id} | ${e.polarity > 0 ? '+' : '-'} | Type ${e.type} | Δpp=${(e.deltaPP * 100).toFixed(2)} | logLR=${e.logLR.toFixed(3)} | ver=${e.verifiability.toFixed(2)} | corrInd=${e.corroborationsIndep} | cons=${e.consistency.toFixed(2)} | date=${e.publishedAt} | src=${domain} | ${clusterMeta}\n  Claim: ${e.claim}`;
  }).join('\n');

  const adjacentLines = topEvidenceWithClaims
    .filter((e: any) => e.pathway || typeof e.connectionStrength === 'number')
    .map((e: any) => {
      const cs = typeof e.connectionStrength === 'number' ? e.connectionStrength.toFixed(2) : 'n/a';
      const pw = e.pathway || 'adjacent';
      return `- ${e.id} | pathway=${pw} | strength=${cs} | Δpp=${(e.deltaPP * 100).toFixed(2)} | Type ${e.type}\n  Claim: ${e.claim}`;
    }).join('\n');

  const prompt = `
You are the Reporter. Produce a detailed, skimmable Markdown **Forecast Card** that explains how each evidence item shaped the probability.

ANALYSIS RESULTS:
- Primary probability p_neutral = ${(pNeutral * 100).toFixed(1)}%
- Secondary market-aware p_aware ${pAware !== undefined ? `= ${(pAware * 100).toFixed(1)}%` : '(omitted)'}
- Base rate p0 = ${(p0 * 100).toFixed(1)}%
- Prediction: ${predictionDirection} (${confidence.toFixed(1)}% confidence)
- Key drivers: ${drivers.join('; ') || 'n/a'}

EVIDENCE CATALOG (Most Influential First):
${catalogLines}

Question: ${question}

FORMAT REQUIREMENTS:
Write a structured report with these sections:

## Prediction: ${predictionDirection} (${(pNeutral * 100).toFixed(1)}%)

## Why This Prediction
- Summarize the core thesis linking top positive and negative evidence to the posterior shift.
- Explicitly reference evidence IDs and their Δpp (percentage point contribution) and note any correlation (cluster rho) considerations.

## Evidence Deep Dive
- For EACH evidence above (in order), include a short paragraph with:
  - What the evidence says (quote/summary), its type (A–D), date, and source domain.
  - How it affected the estimate: sign, approximate Δpp, and whether cluster correlation (rho, mEff) reduced its marginal effect.
  - Quality signals: verifiability, corroborations, and consistency that justify its weight; mention recency where helpful.

## Adjacent Signals & Catalysts
- Summarize non-direct but relevant catalysts (e.g., platform-policy, regulatory/legal, award/media, viral, release/tour, macro, distribution). Use the list below and explain how each affects the posterior via its pathway and connection strength.
${adjacentLines}

## Key Drivers
- List the main forward-looking factors (3–5 bullets): ${drivers.slice(0, 5).join(', ')}

## What Would Change Our Mind
- 3–5 specific events, datasets, or outcomes that would materially move the estimate, with notes on direction and likely magnitude.

## Caveats & Limitations
- Note potential biases, sampling issues, correlation or over-reliance on clusters, stale data risks, or disagreement with market/Elo benchmarks if present.

STYLE:
- Be precise, evidence-driven, and skimmable. Use IDs (e.g., e12) when citing evidence; avoid raw URLs in the body.
- Keep paragraphs tight; no filler.
`;

  const { text } = await generateText({
    model: getModel(),
    system: `Write clean, skimmable Markdown only.`,
    prompt,
  });
  return text;
}
