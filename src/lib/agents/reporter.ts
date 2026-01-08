import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { InfluenceItem, ClusterMeta, Evidence } from '../forecasting/types';
import { HistoricalContext } from '../historical/types';

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
  historicalContext?: HistoricalContext,
  marketPrice?: number,
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

  // Format historical context for the report
  let historicalSection = '';
  if (historicalContext) {
    historicalSection = '\nHISTORICAL CONTEXT:\n';

    if (historicalContext.baseRate) {
      const br = historicalContext.baseRate;
      historicalSection += `- Base rate: ${(br.baseRate * 100).toFixed(1)}% from ${br.totalSamples} historical markets in category "${br.category}"${br.subcategory ? ` / ${br.subcategory}` : ''}\n`;
      historicalSection += `- Historical confidence: ${historicalContext.confidence} (sample size: ${historicalContext.sampleSize})\n`;
      if (br.trend) {
        historicalSection += `- Trend: ${br.trend}\n`;
      }
      if (br.volatility !== undefined) {
        historicalSection += `- Volatility: ${br.volatility.toFixed(3)} (price variance in historical markets)\n`;
      }
    }

    if (historicalContext.analogues.length > 0) {
      historicalSection += `\nHISTORICAL ANALOGUES (${historicalContext.analogues.length} precedents found):\n`;
      historicalContext.analogues.slice(0, 5).forEach(analogue => {
        historicalSection += `- "${analogue.title}" (${analogue.precedentStrength} precedent, similarity: ${(analogue.similarityScore * 100).toFixed(0)}%)\n`;
        historicalSection += `  Outcome: ${analogue.outcome}\n`;
        if (analogue.keySimilarities.length > 0) {
          historicalSection += `  Similarities: ${analogue.keySimilarities.join(', ')}\n`;
        }
        if (analogue.keyDifferences.length > 0) {
          historicalSection += `  Differences: ${analogue.keyDifferences.join(', ')}\n`;
        }
      });
    }

    if (historicalContext.warnings.length > 0) {
      historicalSection += `\nHISTORICAL DATA WARNINGS:\n`;
      historicalContext.warnings.forEach(warning => {
        historicalSection += `- [${warning.severity.toUpperCase()}] ${warning.message}\n`;
        if (warning.details) {
          historicalSection += `  Details: ${warning.details}\n`;
        }
      });
    }

    if (marketPrice !== undefined && Math.abs(p0 - marketPrice) > 0.05) {
      historicalSection += `\nPRIOR ADJUSTMENT:\n`;
      historicalSection += `- Market price: ${(marketPrice * 100).toFixed(1)}%\n`;
      historicalSection += `- Historical prior (p0): ${(p0 * 100).toFixed(1)}%\n`;
      historicalSection += `- Adjustment: ${((p0 - marketPrice) * 100).toFixed(1)} percentage points based on historical data\n`;
    }
  }

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
You are the Reporter. Produce a detailed, skimmable Markdown **Forecast Card** that explains how each evidence item shaped the probability, GROUNDED IN HISTORICAL PRECEDENT.

ANALYSIS RESULTS:
- Primary probability p_neutral = ${(pNeutral * 100).toFixed(1)}%
- Secondary market-aware p_aware ${pAware !== undefined ? `= ${(pAware * 100).toFixed(1)}%` : '(omitted)'}
- Base rate p0 = ${(p0 * 100).toFixed(1)}%
- Prediction: ${predictionDirection} (${confidence.toFixed(1)}% confidence)
- Key drivers: ${drivers.join('; ') || 'n/a'}
${historicalSection}

EVIDENCE CATALOG (Most Influential First):
${catalogLines}

Question: ${question}

FORMAT REQUIREMENTS:
Write a structured report with these sections:

## Prediction: ${predictionDirection} (${(pNeutral * 100).toFixed(1)}%)

## Historical Grounding
${historicalContext ? `
- **REQUIRED**: Explain how historical base rates and analogous precedents informed the prior probability.
- If base rates are available: Compare the ${(historicalContext.baseRate?.baseRate ?? 0) * 100}% historical base rate to current market expectations. Explain any divergence.
- If analogues are available: Briefly describe the ${historicalContext.analogues.length} historical precedent(s), highlighting key similarities and differences from the current situation.
- If historical data is limited: Explicitly state this limitation and explain how it increases uncertainty (wider confidence bounds).
- **CRITICAL**: Make it clear that this forecast is grounded in empirical historical data, not abstract intuition.
` : `
- Note: No historical base rate data available for this category. Forecast relies on market price and current evidence.
- **IMPORTANT**: Explicitly state that the lack of historical data increases uncertainty in this forecast.
`}

## Why This Prediction
- Summarize the core thesis linking top positive and negative evidence to the posterior shift FROM THE HISTORICAL PRIOR.
- Explicitly reference evidence IDs and their Δpp (percentage point contribution) and note any correlation (cluster rho) considerations.
- Compare the final probability to both the historical base rate AND current market price.

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
- Include historical context: what happened in analogous past situations when similar events occurred?

## Caveats & Limitations
${historicalContext && historicalContext.warnings.length > 0 ? `
- **Historical Data Warnings**: ${historicalContext.warnings.map(w => w.message).join('; ')}
` : ''}
- Note potential biases, sampling issues, correlation or over-reliance on clusters, stale data risks, or disagreement with market/Elo benchmarks if present.
- If historical data was limited, explicitly state how this affects confidence in the forecast.

CRITICAL REQUIREMENTS:
- This forecast MUST be grounded in historical precedent wherever possible
- Prefer empirical base rates over abstract reasoning when available
- Explicitly acknowledge when historical data is missing or weak
- Compare current situation to past analogues and explain similarities/differences
- Use historical outcomes to calibrate confidence and uncertainty
`;

  const { text } = await generateText({
    model: getModel(),
    system: `Write clean, skimmable Markdown only.`,
    prompt,
  });
  return text;
}
