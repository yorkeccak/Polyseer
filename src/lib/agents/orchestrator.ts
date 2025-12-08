import { planAgent } from './planner';
import { researchBothSides, conductFollowUpResearch, conductAdjacentResearch } from './researcher';
import { criticAgent } from './critic';
import { analystAgent, analystAgentWithCritique, MarketFn } from './analyst';
import { reporterAgent } from './reporter';
import { generateDrivers } from './driver-generator';
import { selectOptimalHistoryInterval, explainIntervalChoice } from './interval-optimizer';
import { Evidence, ForecastCard } from '../forecasting/types';
import { makeForecastCard } from '../forecasting/reportCard';
import { buildLLMPayloadFromSlug } from '../tools/polymarket';
import { fetchMarketDataFromUrl, MarketPayload } from '../tools/market-fetcher';


export interface PolymarketOrchestratorOpts {
  polymarketSlug: string;                       // Polymarket slug to analyze
  rhoByCluster?: Record<string, number>;
  drivers?: string[];
  historyInterval?: string;                     // e.g., '1d', '4h', '1h'
  withBooks?: boolean;                          // include order book data
  withTrades?: boolean;                         // include recent trades
  onProgress?: (step: string, details: any) => void;  // progress callback
  sessionId?: string;                           // Session ID for tracking
}

export interface UnifiedOrchestratorOpts {
  marketUrl: string;                            // Market URL (Polymarket or Kalshi)
  rhoByCluster?: Record<string, number>;
  drivers?: string[];
  historyInterval?: string;                     // e.g., '1d', '4h', '1h'
  withBooks?: boolean;                          // include order book data
  withTrades?: boolean;                         // include recent trades
  onProgress?: (step: string, details: any) => void;  // progress callback
  sessionId?: string;                           // Session ID for tracking
}



export async function runPolymarketForecastPipeline(opts: PolymarketOrchestratorOpts): Promise<ForecastCard> {
  const { onProgress } = opts;

  const t0 = Date.now();

  // Step 1: Fetch complete market data early (no minimal fetch)
  onProgress?.('fetch_complete_data', {
    message: 'Fetching complete market data...',
    slug: opts.polymarketSlug
  });

  const firstFetch = await buildLLMPayloadFromSlug(opts.polymarketSlug, {
    historyInterval: '1d',
    withBooks: opts.withBooks ?? true,
    withTrades: opts.withTrades ?? false,
  });

  onProgress?.('complete_data_ready', {
    message: 'Complete market data retrieved',
    reusedInitial: false,
    interval: '1d',
    withBooks: opts.withBooks ?? true,
    withTrades: opts.withTrades ?? false,
    question: firstFetch.market_facts.question,
    outcomes: Object.keys(firstFetch.market_facts.token_map ?? {}).length,
    historySeries: firstFetch.history?.length ?? 0,
    volume: firstFetch.market_facts.volume ?? null,
    liquidity: firstFetch.market_facts.liquidity ?? null,
    closeTime: firstFetch.market_facts.close_time ?? null,
    resolutionSource: firstFetch.market_facts.resolution_source ?? null,
    pricesNow: (firstFetch.market_state_now || []).map(x => ({
      outcome: x.outcome,
      bid: x.bid, ask: x.ask, mid: x.mid,
      top_bid_size: (x as any).top_bid_size ?? null,
      top_ask_size: (x as any).top_ask_size ?? null,
    })),
    eventSummary: (firstFetch as any).event_summary ? {
      isMultiCandidate: (firstFetch as any).event_summary.is_multi_candidate,
      totalMarkets: (firstFetch as any).event_summary.total_markets,
      activeMarkets: (firstFetch as any).event_summary.active_markets,
      topCandidates: (firstFetch as any).event_summary.top_candidates?.map((c:any)=>({
        name: c.name,
        implied_probability: c.implied_probability,
        volume: c.volume,
        liquidity: c.liquidity,
        active: c.active,
      }))
    } : null
  });

  // Step 2: Optimize parameters
  onProgress?.('optimize_parameters', {
    message: 'Optimizing analysis parameters...'
  });

  const optimalInterval = opts.historyInterval || selectOptimalHistoryInterval(firstFetch);
  const autoDrivers = opts.drivers && opts.drivers.length > 0 
    ? opts.drivers 
    : await generateDrivers(firstFetch);

  onProgress?.('parameters_optimized', {
    message: 'Parameters optimized',
    interval: optimalInterval,
    drivers: autoDrivers,
    intervalExplanation: explainIntervalChoice(optimalInterval, firstFetch)
  });

  // Step 3: If needed, refetch with optimal interval
  const marketData = optimalInterval === '1d'
    ? firstFetch
    : await (async () => {
        onProgress?.('fetch_complete_data', {
          message: `Refetching market data at interval ${optimalInterval}...`
        });
        const refreshed = await buildLLMPayloadFromSlug(opts.polymarketSlug, {
          historyInterval: optimalInterval,
          withBooks: opts.withBooks ?? true,
          withTrades: opts.withTrades ?? false,
        });
        onProgress?.('complete_data_ready', {
          message: 'Complete market data updated',
          reusedInitial: false,
          interval: optimalInterval,
          withBooks: opts.withBooks ?? true,
          withTrades: opts.withTrades ?? false,
          question: refreshed.market_facts.question,
          outcomes: Object.keys(refreshed.market_facts.token_map ?? {}).length,
          historySeries: refreshed.history?.length ?? 0,
          volume: refreshed.market_facts.volume ?? null,
          liquidity: refreshed.market_facts.liquidity ?? null,
          closeTime: refreshed.market_facts.close_time ?? null,
          resolutionSource: refreshed.market_facts.resolution_source ?? null,
          pricesNow: (refreshed.market_state_now || []).map(x => ({
            outcome: x.outcome,
            bid: x.bid, ask: x.ask, mid: x.mid,
            top_bid_size: (x as any).top_bid_size ?? null,
            top_ask_size: (x as any).top_ask_size ?? null,
          })),
          eventSummary: (refreshed as any).event_summary ? {
            isMultiCandidate: (refreshed as any).event_summary.is_multi_candidate,
            totalMarkets: (refreshed as any).event_summary.total_markets,
            activeMarkets: (refreshed as any).event_summary.active_markets,
            topCandidates: (refreshed as any).event_summary.top_candidates?.map((c:any)=>({
              name: c.name,
              implied_probability: c.implied_probability,
              volume: c.volume,
              liquidity: c.liquidity,
              active: c.active,
            }))
          } : null
        });
        return refreshed;
      })();

  console.log(
    `📥 Market data ready: interval=${optimalInterval}, withBooks=${opts.withBooks ?? true}, withTrades=${opts.withTrades ?? false}`
  );
  
  const question = marketData.market_facts.question;
  
  // Calculate prior from current market probability (if available)
  let p0 = 0.5; // default prior
  if (marketData.market_state_now && marketData.market_state_now.length > 0) {
    const firstOutcome = marketData.market_state_now[0];
    if (firstOutcome.mid !== null && firstOutcome.mid !== undefined) {
      p0 = Math.max(0.1, Math.min(0.9, firstOutcome.mid)); // clamp between 0.1 and 0.9
    }
  }
  console.log(`📈 Prior (p0) from market mid: ${p0.toFixed(3)}`);

  // Create market function that returns current Polymarket probability
  const polymarketFn: MarketFn = async () => {
    const currentPrice = marketData.market_state_now[0]?.mid || 0.5;
    return {
      probability: currentPrice,
      asOf: new Date().toISOString(),
      source: 'polymarket'
    };
  };

  // Step 4: Plan the research based on the market question
  onProgress?.('planning', {
    message: 'Planning research strategy...',
    question: question
  });
  
  const plan = await planAgent(question);
  console.log(
    `🗺️  Plan generated: subclaims=${plan.subclaims.length}, seeds=${plan.searchSeeds.length}, variables=${plan.keyVariables.length}, criteria=${plan.decisionCriteria.length}`
  );
  
  onProgress?.('plan_complete', {
    message: 'Research plan generated',
    subclaims: plan.subclaims.length,
    searchSeeds: plan.searchSeeds.length,
    variables: plan.keyVariables.length,
    criteria: plan.decisionCriteria.length,
    response: {
      subclaims: plan.subclaims,
      searchSeeds: plan.searchSeeds,
      keyVariables: plan.keyVariables,
      decisionCriteria: plan.decisionCriteria
    }
  });

  // Step 5: FIRST RESEARCH CYCLE - Initial evidence gathering
  onProgress?.('researching', {
    message: 'Starting initial evidence research...',
    searchSeeds: plan.searchSeeds.length
  });
  
  console.log(`🔍 === RESEARCH CYCLE 1: Initial Evidence Gathering ===`);
  const { pro: initialPro, con: initialCon } = await researchBothSides(question, plan as any, marketData, opts.sessionId);
  // Adjacent signals batch (smaller than main)
  const adjacent = await conductAdjacentResearch(question, plan as any, marketData, opts.sessionId);
  const adjacentPro = adjacent.filter(e => e.polarity > 0);
  const adjacentCon = adjacent.filter(e => e.polarity < 0);
  console.log(`🔎 Initial research complete: pro=${initialPro.length}, con=${initialCon.length}`);
  console.log(`🔎 Adjacent signals: pro=${adjacentPro.length}, con=${adjacentCon.length}`);
  
  onProgress?.('initial_research_complete', {
    message: 'Initial evidence research completed',
    proEvidence: initialPro.length + adjacentPro.length,
    conEvidence: initialCon.length + adjacentCon.length,
    urls: [...new Set([
      ...initialPro.flatMap(p => p.urls),
      ...initialCon.flatMap(c => c.urls),
      ...adjacent.flatMap(a => a.urls),
    ])].slice(0, 10),
    response: {
      proEvidence: [...initialPro, ...adjacentPro].map(e => ({ claim: e.claim, type: e.type, polarity: e.polarity, urls: e.urls, pathway: e.pathway, connectionStrength: e.connectionStrength })),
      conEvidence: [...initialCon, ...adjacentCon].map(e => ({ claim: e.claim, type: e.type, polarity: e.polarity, urls: e.urls, pathway: e.pathway, connectionStrength: e.connectionStrength }))
    }
  });

  // Step 6: CRITIC ANALYSIS - Identify gaps and provide feedback
  onProgress?.('criticism', {
    message: 'Running critical analysis to identify gaps...',
    evidenceCount: initialPro.length + initialCon.length
  });
  
  console.log(`🧪 === CRITIC ANALYSIS: Identifying Gaps ===`);
  const critique = await criticAgent(question, initialPro, initialCon);
  console.log(`🧪 Critic analysis complete:`);
  console.log(`   - Missing evidence areas: ${critique.missing.length}`);
  console.log(`   - Duplication flags: ${critique.duplicationFlags.length}`);
  console.log(`   - Data concerns: ${critique.dataConcerns.length}`);
  console.log(`   - Follow-up searches suggested: ${critique.followUpSearches.length}`);
  console.log(`   - Correlation adjustments: ${Object.keys(critique.correlationAdjustments).length}`);

  onProgress?.('criticism_complete', {
    message: 'Critical analysis completed',
    missingAreas: critique.missing.length,
    followUpSearches: critique.followUpSearches.length,
    duplicationFlags: critique.duplicationFlags.length,
    dataConcerns: critique.dataConcerns.length,
    response: {
      missing: critique.missing,
      followUpSearches: critique.followUpSearches,
      duplicationFlags: critique.duplicationFlags,
      dataConcerns: critique.dataConcerns,
      correlationAdjustments: critique.correlationAdjustments
    }
  });

  // Step 7: SECOND RESEARCH CYCLE - Targeted follow-up research
  let finalPro = [...initialPro, ...adjacentPro];
  let finalCon = [...initialCon, ...adjacentCon];
  let neutralEvidence: Evidence[] = [];
  
  if (critique.followUpSearches.length > 0) {
    onProgress?.('followup_research', {
      message: 'Conducting targeted follow-up research...',
      followUpSearches: critique.followUpSearches.length
    });
    
    console.log(`🔍 === RESEARCH CYCLE 2: Targeted Follow-up Research ===`);
    const followUpResults = await conductFollowUpResearch(question, critique.followUpSearches, marketData, opts.sessionId);
    
    // Merge follow-up evidence with initial evidence
    finalPro = [...initialPro, ...followUpResults.pro];
    finalCon = [...initialCon, ...followUpResults.con];
    neutralEvidence = followUpResults.neutral;
    
    console.log(`🔎 Follow-up research complete: +${followUpResults.pro.length} pro, +${followUpResults.con.length} con, +${followUpResults.neutral.length} neutral`);
    console.log(`🔎 Total evidence: pro=${finalPro.length}, con=${finalCon.length}, neutral=${neutralEvidence.length}`);
    
    onProgress?.('followup_research_complete', {
      message: 'Follow-up research completed',
      additionalPro: followUpResults.pro.length,
      additionalCon: followUpResults.con.length,
      neutralEvidence: followUpResults.neutral.length,
      totalPro: finalPro.length,
      totalCon: finalCon.length,
      response: {
        additionalProEvidence: followUpResults.pro.map(e => ({ claim: e.claim, type: e.type, polarity: e.polarity, urls: e.urls })),
        additionalConEvidence: followUpResults.con.map(e => ({ claim: e.claim, type: e.type, polarity: e.polarity, urls: e.urls })),
        neutralEvidence: followUpResults.neutral.map(e => ({ claim: e.claim, type: e.type, urls: e.urls })),
        totalProEvidence: finalPro.map(e => ({ claim: e.claim, type: e.type, polarity: e.polarity, urls: e.urls })),
        totalConEvidence: finalCon.map(e => ({ claim: e.claim, type: e.type, polarity: e.polarity, urls: e.urls }))
      }
    });
  } else {
    console.log(`🔍 === RESEARCH CYCLE 2: Skipped (no gaps identified) ===`);
    onProgress?.('followup_research_skipped', {
      message: 'Follow-up research skipped - no gaps identified'
    });
  }

  // Merge all evidence lists and dedupe by normalized URL to avoid source double-counting
  function normalizeUrl(raw: string): string | null {
    try {
      const u = new URL(raw);
      const host = (u.hostname || '').toLowerCase().replace(/^www\./, '');
      u.hostname = host;
      u.hash = '';
      const toDelete = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid','igsh','mc_cid','mc_eid','ref'];
      toDelete.forEach(k => u.searchParams.delete(k));
      const params = Array.from(u.searchParams.entries()).sort(([a],[b]) => a.localeCompare(b));
      u.search = params.length ? '?' + params.map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') : '';
      if (u.pathname !== '/' && u.pathname.endsWith('/')) u.pathname = u.pathname.replace(/\/+$/,'');
      if ((u.protocol === 'http:' && u.port === '80') || (u.protocol === 'https:' && u.port === '443')) u.port = '';
      return u.toString();
    } catch { return null; }
  }
  function dedupeByUrl(items: Evidence[]): Evidence[] {
    const seen = new Set<string>();
    const hostCounts: Record<string, number> = {};
    const DOMAIN_CAP = 5;
    const out: Evidence[] = [];
    for (const ev of items) {
      const normalized = (ev.urls || []).map(normalizeUrl).filter((x): x is string => Boolean(x));
      const unique = Array.from(new Set(normalized));
      const isDup = unique.some(u => seen.has(u));
      if (isDup) continue;
      // Enforce per-domain cap using first URL's host if present
      let originHost: string | null = null;
      if (unique.length) {
        try { originHost = new URL(unique[0]).hostname.toLowerCase().replace(/^www\./,''); } catch {}
      }
      if (originHost) {
        const count = hostCounts[originHost] || 0;
        if (count >= DOMAIN_CAP) {
          continue;
        }
        hostCounts[originHost] = count + 1;
      }
      unique.forEach(u => seen.add(u));
      out.push({ ...ev, urls: unique.length ? unique : ev.urls });
    }
    return out;
  }

  const allEvidence: Evidence[] = dedupeByUrl([...finalPro, ...finalCon, ...neutralEvidence]);

  // Step 8: ENHANCED ANALYSIS - Apply critic feedback to aggregation
  onProgress?.('aggregating', {
    message: 'Aggregating evidence with critic feedback...',
    totalEvidence: allEvidence.length
  });
  
  console.log(`🧮 === ENHANCED ANALYSIS: Applying Critic Feedback ===`);
  const { pNeutral, pAware, influence, clusters, filteredEvidence } = await analystAgentWithCritique(
    question, p0, allEvidence, critique, opts.rhoByCluster, polymarketFn
  );
  console.log(
    `🧮 Enhanced aggregation complete: pNeutral=${pNeutral.toFixed(3)}, pAware=${pAware !== undefined ? pAware.toFixed(3) : 'n/a'}, influenceItems=${influence.length}, clusters=${clusters.length}`
  );
  console.log(`🧮 Evidence used in final analysis: ${filteredEvidence?.length || allEvidence.length}/${allEvidence.length} (${allEvidence.length - (filteredEvidence?.length || allEvidence.length)} filtered out)`);

  onProgress?.('aggregation_complete', {
    message: 'Enhanced probability aggregation completed',
    pNeutral: pNeutral,
    pAware: pAware,
    influenceItems: influence.length,
    clusters: clusters.length,
    evidenceUsed: filteredEvidence?.length || allEvidence.length,
    evidenceFiltered: allEvidence.length - (filteredEvidence?.length || allEvidence.length),
    topInfluences: influence.slice(0, 5).map(i => ({ evidenceId: i.evidenceId, logLR: i.logLR, deltaPP: i.deltaPP })),
    response: {
      pNeutral: pNeutral,
      pAware: pAware,
      influence: influence,
      clusters: clusters.map(c => ({
        clusterId: c.clusterId,
        size: c.size,
        rho: c.rho,
        mEff: c.mEff,
        meanLLR: c.meanLLR
      })),
      evidenceFiltered: filteredEvidence ? allEvidence.filter(e => !filteredEvidence.some(fe => fe.id === e.id)) : []
    }
  });

  // Use filtered evidence for final card if available
  const finalEvidence = filteredEvidence || allEvidence;

  // Step 9: Build report text via model
  onProgress?.('reporting', {
    message: 'Generating final report...',
    drivers: autoDrivers
  });
  
  const markdown = await reporterAgent(question, p0, pNeutral, pAware, influence, clusters, autoDrivers, finalEvidence);
  console.log(`📝 Report generated. length=${markdown.length} chars`);
  console.log(`⏱️  Total pipeline time: ${((Date.now() - t0)/1000).toFixed(1)}s`);
  
  onProgress?.('report_complete', {
    message: 'Final report generated',
    reportLength: markdown.length,
    totalTime: ((Date.now() - t0)/1000).toFixed(1) + 's',
    response: {
      markdownReport: markdown,
      totalTimeSeconds: (Date.now() - t0)/1000,
      finalProbabilities: {
        pNeutral: pNeutral,
        pAware: pAware,
        p0: p0
      }
    }
  });

  return makeForecastCard({
    question,
    p0,
    pNeutral,
    pAware,
    alpha: 0.1,
    drivers: autoDrivers,
    influence,
    clusters,
    provenance: [
      ...finalEvidence.flatMap(e => e.urls),
      `https://polymarket.com/event/${opts.polymarketSlug}`
    ],
    markdownReport: markdown,
  });
}

/**
 * Unified Forecast Pipeline - Works with any supported prediction market platform
 * Detects platform from URL and runs the appropriate analysis
 */
export async function runUnifiedForecastPipeline(opts: UnifiedOrchestratorOpts): Promise<ForecastCard> {
  const { onProgress, marketUrl } = opts;

  const t0 = Date.now();

  // Step 1: Fetch market data (auto-detects platform from URL)
  onProgress?.('fetch_complete_data', {
    message: 'Detecting platform and fetching market data...',
    url: marketUrl
  });

  const firstFetch: MarketPayload = await fetchMarketDataFromUrl(marketUrl, {
    historyInterval: '1d',
    withBooks: opts.withBooks ?? true,
    withTrades: opts.withTrades ?? false,
  });

  const platform = firstFetch.platform;

  onProgress?.('complete_data_ready', {
    message: `Market data retrieved from ${platform}`,
    platform: platform,
    reusedInitial: false,
    interval: '1d',
    withBooks: opts.withBooks ?? true,
    withTrades: opts.withTrades ?? false,
    question: firstFetch.market_facts.question,
    outcomes: Object.keys(firstFetch.market_facts.token_map ?? {}).length,
    historySeries: firstFetch.history?.length ?? 0,
    volume: firstFetch.market_facts.volume ?? null,
    liquidity: firstFetch.market_facts.liquidity ?? null,
    closeTime: firstFetch.market_facts.close_time ?? null,
    resolutionSource: firstFetch.market_facts.resolution_source ?? null,
    pricesNow: (firstFetch.market_state_now || []).map(x => ({
      outcome: x.outcome,
      bid: x.bid, ask: x.ask, mid: x.mid,
      top_bid_size: (x as any).top_bid_size ?? null,
      top_ask_size: (x as any).top_ask_size ?? null,
    })),
    eventSummary: firstFetch.event_summary ? {
      isMultiCandidate: firstFetch.event_summary.is_multi_candidate,
      totalMarkets: firstFetch.event_summary.total_markets,
      activeMarkets: firstFetch.event_summary.active_markets,
      topCandidates: firstFetch.event_summary.top_candidates?.map((c:any)=>({
        name: c.name,
        implied_probability: c.implied_probability,
        volume: c.volume,
        liquidity: c.liquidity,
        active: c.active,
      }))
    } : null
  });

  // Step 2: Optimize parameters
  onProgress?.('optimize_parameters', {
    message: 'Optimizing analysis parameters...'
  });

  const optimalInterval = opts.historyInterval || selectOptimalHistoryInterval(firstFetch);
  const autoDrivers = opts.drivers && opts.drivers.length > 0
    ? opts.drivers
    : await generateDrivers(firstFetch);

  onProgress?.('parameters_optimized', {
    message: 'Parameters optimized',
    interval: optimalInterval,
    drivers: autoDrivers,
    intervalExplanation: explainIntervalChoice(optimalInterval, firstFetch)
  });

  // Step 3: Refetch with optimal interval if needed
  const marketData = optimalInterval === '1d'
    ? firstFetch
    : await (async () => {
        onProgress?.('fetch_complete_data', {
          message: `Refetching market data at interval ${optimalInterval}...`
        });
        const refreshed = await fetchMarketDataFromUrl(marketUrl, {
          historyInterval: optimalInterval,
          withBooks: opts.withBooks ?? true,
          withTrades: opts.withTrades ?? false,
        });
        onProgress?.('complete_data_ready', {
          message: 'Market data updated',
          platform: platform,
          reusedInitial: false,
          interval: optimalInterval,
          withBooks: opts.withBooks ?? true,
          withTrades: opts.withTrades ?? false,
          question: refreshed.market_facts.question,
          outcomes: Object.keys(refreshed.market_facts.token_map ?? {}).length,
          historySeries: refreshed.history?.length ?? 0,
          volume: refreshed.market_facts.volume ?? null,
          liquidity: refreshed.market_facts.liquidity ?? null,
          closeTime: refreshed.market_facts.close_time ?? null,
          resolutionSource: refreshed.market_facts.resolution_source ?? null,
          pricesNow: (refreshed.market_state_now || []).map(x => ({
            outcome: x.outcome,
            bid: x.bid, ask: x.ask, mid: x.mid,
            top_bid_size: (x as any).top_bid_size ?? null,
            top_ask_size: (x as any).top_ask_size ?? null,
          })),
          eventSummary: refreshed.event_summary ? {
            isMultiCandidate: refreshed.event_summary.is_multi_candidate,
            totalMarkets: refreshed.event_summary.total_markets,
            activeMarkets: refreshed.event_summary.active_markets,
            topCandidates: refreshed.event_summary.top_candidates?.map((c:any)=>({
              name: c.name,
              implied_probability: c.implied_probability,
              volume: c.volume,
              liquidity: c.liquidity,
              active: c.active,
            }))
          } : null
        });
        return refreshed;
      })();

  console.log(
    `📥 Market data ready: platform=${platform}, interval=${optimalInterval}, withBooks=${opts.withBooks ?? true}, withTrades=${opts.withTrades ?? false}`
  );

  const question = marketData.market_facts.question;

  // Calculate prior from current market probability (if available)
  let p0 = 0.5; // default prior
  if (marketData.market_state_now && marketData.market_state_now.length > 0) {
    const firstOutcome = marketData.market_state_now[0];
    if (firstOutcome.mid !== null && firstOutcome.mid !== undefined) {
      p0 = Math.max(0.1, Math.min(0.9, firstOutcome.mid)); // clamp between 0.1 and 0.9
    }
  }
  console.log(`📈 Prior (p0) from market mid: ${p0.toFixed(3)}`);

  // Create market function that returns current market probability
  const marketFn: MarketFn = async () => {
    const currentPrice = marketData.market_state_now[0]?.mid || 0.5;
    return {
      probability: currentPrice,
      asOf: new Date().toISOString(),
      source: platform
    };
  };

  // Step 4: Plan the research based on the market question
  onProgress?.('planning', {
    message: 'Planning research strategy...',
    question: question
  });

  const plan = await planAgent(question);
  console.log(
    `🗺️  Plan generated: subclaims=${plan.subclaims.length}, seeds=${plan.searchSeeds.length}, variables=${plan.keyVariables.length}, criteria=${plan.decisionCriteria.length}`
  );

  onProgress?.('plan_complete', {
    message: 'Research plan generated',
    subclaims: plan.subclaims.length,
    searchSeeds: plan.searchSeeds.length,
    variables: plan.keyVariables.length,
    criteria: plan.decisionCriteria.length,
    response: {
      subclaims: plan.subclaims,
      searchSeeds: plan.searchSeeds,
      keyVariables: plan.keyVariables,
      decisionCriteria: plan.decisionCriteria
    }
  });

  // Step 5: FIRST RESEARCH CYCLE - Initial evidence gathering
  onProgress?.('researching', {
    message: 'Starting initial evidence research...',
    searchSeeds: plan.searchSeeds.length
  });

  console.log(`🔍 === RESEARCH CYCLE 1: Initial Evidence Gathering ===`);
  const { pro: initialPro, con: initialCon } = await researchBothSides(question, plan as any, marketData, opts.sessionId);
  const adjacent = await conductAdjacentResearch(question, plan as any, marketData, opts.sessionId);
  const adjacentPro = adjacent.filter(e => e.polarity > 0);
  const adjacentCon = adjacent.filter(e => e.polarity < 0);
  console.log(`🔎 Initial research complete: pro=${initialPro.length}, con=${initialCon.length}`);
  console.log(`🔎 Adjacent signals: pro=${adjacentPro.length}, con=${adjacentCon.length}`);

  onProgress?.('initial_research_complete', {
    message: 'Initial evidence research completed',
    proEvidence: initialPro.length + adjacentPro.length,
    conEvidence: initialCon.length + adjacentCon.length,
    urls: [...new Set([
      ...initialPro.flatMap(p => p.urls),
      ...initialCon.flatMap(c => c.urls),
      ...adjacent.flatMap(a => a.urls),
    ])].slice(0, 10),
    response: {
      proEvidence: [...initialPro, ...adjacentPro].map(e => ({ claim: e.claim, type: e.type, polarity: e.polarity, urls: e.urls, pathway: e.pathway, connectionStrength: e.connectionStrength })),
      conEvidence: [...initialCon, ...adjacentCon].map(e => ({ claim: e.claim, type: e.type, polarity: e.polarity, urls: e.urls, pathway: e.pathway, connectionStrength: e.connectionStrength }))
    }
  });

  // Step 6: CRITIC ANALYSIS
  onProgress?.('criticism', {
    message: 'Running critical analysis to identify gaps...',
    evidenceCount: initialPro.length + initialCon.length
  });

  console.log(`🧪 === CRITIC ANALYSIS: Identifying Gaps ===`);
  const critique = await criticAgent(question, initialPro, initialCon);
  console.log(`🧪 Critic analysis complete:`);
  console.log(`   - Missing evidence areas: ${critique.missing.length}`);
  console.log(`   - Duplication flags: ${critique.duplicationFlags.length}`);
  console.log(`   - Data concerns: ${critique.dataConcerns.length}`);
  console.log(`   - Follow-up searches suggested: ${critique.followUpSearches.length}`);
  console.log(`   - Correlation adjustments: ${Object.keys(critique.correlationAdjustments).length}`);

  onProgress?.('criticism_complete', {
    message: 'Critical analysis completed',
    missingAreas: critique.missing.length,
    followUpSearches: critique.followUpSearches.length,
    duplicationFlags: critique.duplicationFlags.length,
    dataConcerns: critique.dataConcerns.length,
    response: {
      missing: critique.missing,
      followUpSearches: critique.followUpSearches,
      duplicationFlags: critique.duplicationFlags,
      dataConcerns: critique.dataConcerns,
      correlationAdjustments: critique.correlationAdjustments
    }
  });

  // Step 7: SECOND RESEARCH CYCLE - Targeted follow-up
  let finalPro = [...initialPro, ...adjacentPro];
  let finalCon = [...initialCon, ...adjacentCon];
  let neutralEvidence: Evidence[] = [];

  if (critique.followUpSearches.length > 0) {
    onProgress?.('followup_research', {
      message: 'Conducting targeted follow-up research...',
      followUpSearches: critique.followUpSearches.length
    });

    console.log(`🔍 === RESEARCH CYCLE 2: Targeted Follow-up Research ===`);
    const followUpResults = await conductFollowUpResearch(question, critique.followUpSearches, marketData, opts.sessionId);

    finalPro = [...initialPro, ...followUpResults.pro];
    finalCon = [...initialCon, ...followUpResults.con];
    neutralEvidence = followUpResults.neutral;

    console.log(`🔎 Follow-up research complete: +${followUpResults.pro.length} pro, +${followUpResults.con.length} con, +${followUpResults.neutral.length} neutral`);
    console.log(`🔎 Total evidence: pro=${finalPro.length}, con=${finalCon.length}, neutral=${neutralEvidence.length}`);

    onProgress?.('followup_research_complete', {
      message: 'Follow-up research completed',
      additionalPro: followUpResults.pro.length,
      additionalCon: followUpResults.con.length,
      neutralEvidence: followUpResults.neutral.length,
      totalPro: finalPro.length,
      totalCon: finalCon.length,
      response: {
        additionalProEvidence: followUpResults.pro.map(e => ({ claim: e.claim, type: e.type, polarity: e.polarity, urls: e.urls })),
        additionalConEvidence: followUpResults.con.map(e => ({ claim: e.claim, type: e.type, polarity: e.polarity, urls: e.urls })),
        neutralEvidence: followUpResults.neutral.map(e => ({ claim: e.claim, type: e.type, urls: e.urls })),
        totalProEvidence: finalPro.map(e => ({ claim: e.claim, type: e.type, polarity: e.polarity, urls: e.urls })),
        totalConEvidence: finalCon.map(e => ({ claim: e.claim, type: e.type, polarity: e.polarity, urls: e.urls }))
      }
    });
  } else {
    console.log(`🔍 === RESEARCH CYCLE 2: Skipped (no gaps identified) ===`);
    onProgress?.('followup_research_skipped', {
      message: 'Follow-up research skipped - no gaps identified'
    });
  }

  // Merge and dedupe evidence
  function normalizeUrl(raw: string): string | null {
    try {
      const u = new URL(raw);
      const host = (u.hostname || '').toLowerCase().replace(/^www\./, '');
      u.hostname = host;
      u.hash = '';
      const toDelete = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid','igsh','mc_cid','mc_eid','ref'];
      toDelete.forEach(k => u.searchParams.delete(k));
      const params = Array.from(u.searchParams.entries()).sort(([a],[b]) => a.localeCompare(b));
      u.search = params.length ? '?' + params.map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') : '';
      if (u.pathname !== '/' && u.pathname.endsWith('/')) u.pathname = u.pathname.replace(/\/+$/,'');
      if ((u.protocol === 'http:' && u.port === '80') || (u.protocol === 'https:' && u.port === '443')) u.port = '';
      return u.toString();
    } catch { return null; }
  }

  function dedupeByUrl(items: Evidence[]): Evidence[] {
    const seen = new Set<string>();
    const hostCounts: Record<string, number> = {};
    const DOMAIN_CAP = 5;
    const out: Evidence[] = [];
    for (const ev of items) {
      const normalized = (ev.urls || []).map(normalizeUrl).filter((x): x is string => Boolean(x));
      const unique = Array.from(new Set(normalized));
      const isDup = unique.some(u => seen.has(u));
      if (isDup) continue;
      let originHost: string | null = null;
      if (unique.length) {
        try { originHost = new URL(unique[0]).hostname.toLowerCase().replace(/^www\./,''); } catch {}
      }
      if (originHost) {
        const count = hostCounts[originHost] || 0;
        if (count >= DOMAIN_CAP) {
          continue;
        }
        hostCounts[originHost] = count + 1;
      }
      unique.forEach(u => seen.add(u));
      out.push({ ...ev, urls: unique.length ? unique : ev.urls });
    }
    return out;
  }

  const allEvidence: Evidence[] = dedupeByUrl([...finalPro, ...finalCon, ...neutralEvidence]);

  // Step 8: ENHANCED ANALYSIS
  onProgress?.('aggregating', {
    message: 'Aggregating evidence with critic feedback...',
    totalEvidence: allEvidence.length
  });

  console.log(`🧮 === ENHANCED ANALYSIS: Applying Critic Feedback ===`);
  const { pNeutral, pAware, influence, clusters, filteredEvidence } = await analystAgentWithCritique(
    question, p0, allEvidence, critique, opts.rhoByCluster, marketFn
  );
  console.log(
    `🧮 Enhanced aggregation complete: pNeutral=${pNeutral.toFixed(3)}, pAware=${pAware !== undefined ? pAware.toFixed(3) : 'n/a'}, influenceItems=${influence.length}, clusters=${clusters.length}`
  );
  console.log(`🧮 Evidence used in final analysis: ${filteredEvidence?.length || allEvidence.length}/${allEvidence.length} (${allEvidence.length - (filteredEvidence?.length || allEvidence.length)} filtered out)`);

  onProgress?.('aggregation_complete', {
    message: 'Enhanced probability aggregation completed',
    pNeutral: pNeutral,
    pAware: pAware,
    influenceItems: influence.length,
    clusters: clusters.length,
    evidenceUsed: filteredEvidence?.length || allEvidence.length,
    evidenceFiltered: allEvidence.length - (filteredEvidence?.length || allEvidence.length),
    topInfluences: influence.slice(0, 5).map(i => ({ evidenceId: i.evidenceId, logLR: i.logLR, deltaPP: i.deltaPP })),
    response: {
      pNeutral: pNeutral,
      pAware: pAware,
      influence: influence,
      clusters: clusters.map(c => ({
        clusterId: c.clusterId,
        size: c.size,
        rho: c.rho,
        mEff: c.mEff,
        meanLLR: c.meanLLR
      })),
      evidenceFiltered: filteredEvidence ? allEvidence.filter(e => !filteredEvidence.some(fe => fe.id === e.id)) : []
    }
  });

  const finalEvidence = filteredEvidence || allEvidence;

  // Step 9: Build report
  onProgress?.('reporting', {
    message: 'Generating final report...',
    drivers: autoDrivers
  });

  const markdown = await reporterAgent(question, p0, pNeutral, pAware, influence, clusters, autoDrivers, finalEvidence);
  console.log(`📝 Report generated. length=${markdown.length} chars`);
  console.log(`⏱️  Total pipeline time: ${((Date.now() - t0)/1000).toFixed(1)}s`);

  onProgress?.('report_complete', {
    message: 'Final report generated',
    reportLength: markdown.length,
    totalTime: ((Date.now() - t0)/1000).toFixed(1) + 's',
    response: {
      markdownReport: markdown,
      totalTimeSeconds: (Date.now() - t0)/1000,
      finalProbabilities: {
        pNeutral: pNeutral,
        pAware: pAware,
        p0: p0
      }
    }
  });

  return makeForecastCard({
    question,
    p0,
    pNeutral,
    pAware,
    alpha: 0.1,
    drivers: autoDrivers,
    influence,
    clusters,
    provenance: [
      ...finalEvidence.flatMap(e => e.urls),
      marketUrl // Include original market URL
    ],
    markdownReport: markdown,
  });
}
