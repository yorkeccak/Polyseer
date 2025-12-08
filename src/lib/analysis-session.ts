import { createClient } from '@/utils/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export type Platform = 'polymarket' | 'kalshi' | 'unknown'

export interface AnalysisSession {
  id: string
  userId: string
  marketUrl: string
  platform: Platform
  marketIdentifier: string
  marketQuestion?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  analysisSteps?: any
  markdownReport?: string
  forecastCard?: any
  currentStep?: string
  progressEvents?: any[]
  durationSeconds?: number
  p0?: number
  pNeutral?: number
  pAware?: number
  drivers?: any
  valyuCost?: number
  errorMessage?: string
}

// Helper to detect platform from URL
function detectPlatform(url: string): Platform {
  if (!url) return 'unknown'
  if (url.includes('polymarket.com')) return 'polymarket'
  if (url.includes('kalshi.com')) return 'kalshi'
  return 'unknown'
}

// Helper to extract identifier from URL
function extractIdentifier(url: string, platform: Platform): string {
  if (!url) return ''

  try {
    const urlObj = new URL(url)

    if (platform === 'polymarket') {
      // https://polymarket.com/event/slug or https://polymarket.com/event/slug/submarket
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      if (pathParts[0] === 'event' && pathParts[1]) {
        return pathParts[1]
      }
    }

    if (platform === 'kalshi') {
      // https://kalshi.com/markets/series/category/ticker
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      if (pathParts[0] === 'markets' && pathParts.length >= 2) {
        return pathParts.slice(1).join('/')
      }
    }

    return url
  } catch {
    return url
  }
}

export async function createAnalysisSession(
  userId: string,
  marketUrl: string
): Promise<AnalysisSession> {
  const supabase = await createClient()
  const sessionId = uuidv4()

  const platform = detectPlatform(marketUrl)
  const marketIdentifier = extractIdentifier(marketUrl, platform)

  const session: AnalysisSession = {
    id: sessionId,
    userId,
    marketUrl,
    platform,
    marketIdentifier,
    status: 'pending',
    startedAt: new Date(),
  }

  const { error } = await supabase
    .from('analysis_sessions')
    .insert({
      id: sessionId,
      user_id: userId,
      market_url: marketUrl,
      platform,
      market_identifier: marketIdentifier,
      polymarket_slug: platform === 'polymarket' ? marketIdentifier : null, // Legacy support
      status: 'pending',
      started_at: session.startedAt.toISOString(),
    })

  if (error) {
    console.error('Failed to create analysis session:', error)
    throw new Error('Failed to create analysis session')
  }

  return session
}

export async function updateAnalysisSession(
  sessionId: string,
  updates: Partial<AnalysisSession>
) {
  const supabase = await createClient()

  const dbUpdates: any = {}

  if (updates.status !== undefined) {
    dbUpdates.status = updates.status
  }

  if (updates.completedAt !== undefined) {
    dbUpdates.completed_at = updates.completedAt.toISOString()
  }

  if (updates.analysisSteps !== undefined) {
    dbUpdates.analysis_steps = updates.analysisSteps
  }

  if (updates.markdownReport !== undefined) {
    dbUpdates.markdown_report = updates.markdownReport
  }

  if (updates.forecastCard !== undefined) {
    dbUpdates.forecast_card = updates.forecastCard
  }

  if (updates.currentStep !== undefined) {
    dbUpdates.current_step = updates.currentStep
  }

  if (updates.progressEvents !== undefined) {
    dbUpdates.progress_events = updates.progressEvents
  }

  if (updates.durationSeconds !== undefined) {
    dbUpdates.duration_seconds = updates.durationSeconds
  }

  if (updates.p0 !== undefined) {
    dbUpdates.p0 = updates.p0
  }

  if (updates.pNeutral !== undefined) {
    dbUpdates.p_neutral = updates.pNeutral
  }

  if (updates.pAware !== undefined) {
    dbUpdates.p_aware = updates.pAware
  }

  if (updates.drivers !== undefined) {
    dbUpdates.drivers = updates.drivers
  }

  if (updates.marketQuestion !== undefined) {
    dbUpdates.market_question = updates.marketQuestion
  }

  if (updates.valyuCost !== undefined) {
    dbUpdates.valyu_cost = updates.valyuCost
  }

  if (updates.errorMessage !== undefined) {
    dbUpdates.error_message = updates.errorMessage
  }

  const { error } = await supabase
    .from('analysis_sessions')
    .update(dbUpdates)
    .eq('id', sessionId)

  if (error) {
    console.error('Failed to update analysis session:', error)
    throw new Error('Failed to update analysis session')
  }
}

export async function completeAnalysisSession(
  sessionId: string,
  markdownReport: string,
  analysisSteps: any,
  forecastCard?: any,
  additionalData?: {
    marketQuestion?: string
    p0?: number
    pNeutral?: number
    pAware?: number
    drivers?: any
    valyuCost?: number
    durationSeconds?: number
  }
) {
  const updates: Partial<AnalysisSession> = {
    status: 'completed',
    completedAt: new Date(),
    markdownReport,
    analysisSteps,
    forecastCard,
  }

  if (additionalData) {
    if (additionalData.marketQuestion) updates.marketQuestion = additionalData.marketQuestion
    if (additionalData.p0 !== undefined) updates.p0 = additionalData.p0
    if (additionalData.pNeutral !== undefined) updates.pNeutral = additionalData.pNeutral
    if (additionalData.pAware !== undefined) updates.pAware = additionalData.pAware
    if (additionalData.drivers) updates.drivers = additionalData.drivers
    if (additionalData.valyuCost !== undefined) updates.valyuCost = additionalData.valyuCost
    if (additionalData.durationSeconds !== undefined) updates.durationSeconds = additionalData.durationSeconds
  }

  await updateAnalysisSession(sessionId, updates)
}

export async function failAnalysisSession(
  sessionId: string,
  error: string
) {
  const supabase = await createClient()

  await supabase
    .from('analysis_sessions')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: error,
    })
    .eq('id', sessionId)
}

export async function getAnalysisHistory(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('analysis_sessions')
    .select(`
      id,
      market_url,
      market_question,
      platform,
      market_identifier,
      status,
      p0,
      p_neutral,
      p_aware,
      valyu_cost,
      started_at,
      completed_at,
      duration_seconds,
      forecast_card
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Failed to fetch analysis history:', error)
    throw new Error('Failed to fetch analysis history')
  }

  return data
}

export async function getAnalysisById(analysisId: string, userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('analysis_sessions')
    .select('*')
    .eq('id', analysisId)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Failed to fetch analysis:', error)
    throw new Error('Failed to fetch analysis')
  }

  return data
}
