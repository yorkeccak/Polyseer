import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAnalysisHistory } from '@/lib/analysis-session'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // In development mode without Supabase, return empty history
      const isDevelopment = process.env.NEXT_PUBLIC_APP_MODE === 'development'
      if (isDevelopment) {
        console.log('[History API] No user in dev mode, returning empty history')
        return NextResponse.json([])
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const history = await getAnalysisHistory(user.id)

    return NextResponse.json(history)
  } catch (error) {
    console.error('Failed to fetch history:', error)

    // In development mode, return empty array instead of error
    const isDevelopment = process.env.NEXT_PUBLIC_APP_MODE === 'development'
    if (isDevelopment) {
      console.log('[History API] Error in dev mode, returning empty history')
      return NextResponse.json([])
    }

    return NextResponse.json(
      { error: 'Failed to fetch analysis history' },
      { status: 500 }
    )
  }
}