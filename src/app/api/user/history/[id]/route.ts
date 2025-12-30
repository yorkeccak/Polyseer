import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAnalysisById } from '@/lib/analysis-session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const isDevelopment = process.env.NEXT_PUBLIC_APP_MODE === 'development'
      if (isDevelopment) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analysis = await getAnalysisById(id, user.id)

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Failed to fetch analysis:', error)
    const isDevelopment = process.env.NEXT_PUBLIC_APP_MODE === 'development'
    if (isDevelopment) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const isDevelopment = process.env.NEXT_PUBLIC_APP_MODE === 'development'
      if (isDevelopment) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('analysis_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to delete analysis:', error)
      return NextResponse.json(
        { error: 'Failed to delete analysis' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete analysis:', error)
    const isDevelopment = process.env.NEXT_PUBLIC_APP_MODE === 'development'
    if (isDevelopment) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to delete analysis' },
      { status: 500 }
    )
  }
}