'use server'

import { createClient } from '@/utils/supabase/server'

export async function getUserData(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Server Action] Error fetching user data:', error)
      // In dev mode without Supabase, return null gracefully
      return null
    }

    return data
  } catch (error) {
    console.error('[Server Action] Exception fetching user data:', error)
    return null
  }
}