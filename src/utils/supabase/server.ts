import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // In development mode, Supabase is optional
  if (!supabaseUrl || !supabaseAnonKey) {
    const isDevelopment = process.env.NEXT_PUBLIC_APP_MODE === 'development'
    if (isDevelopment) {
      console.log('[Supabase] Running without database (development mode)')
      // Return a mock client that returns null for auth
      return {
        auth: {
          getUser: async () => ({ data: { user: null }, error: null }),
        },
        from: () => {
          throw new Error('Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to save analysis history.')
        },
      } as any
    } else {
      throw new Error('Supabase configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    const isDevelopment = process.env.NEXT_PUBLIC_APP_MODE === 'development'
    if (isDevelopment) {
      console.log('[Supabase] Service client not available (no credentials)')
      // Return a mock client
      return {
        from: () => {
          throw new Error('Supabase service role not configured. This is only needed for production.')
        },
        auth: {
          admin: {
            createUser: async () => ({ data: null, error: new Error('Not configured') }),
          },
        },
      } as any
    } else {
      throw new Error('Supabase service role key missing')
    }
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey)
}