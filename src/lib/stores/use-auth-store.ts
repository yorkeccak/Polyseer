import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import {
  buildAuthorizationUrl,
  saveValyuTokens,
  loadValyuTokens,
  clearValyuTokens,
  isTokenExpired,
  getValidAccessToken,
  signOutValyu,
  type ValyuTokens,
} from '@/lib/valyu-oauth'

interface AuthUser extends User {
  valyu_sub?: string
  valyu_organisation_id?: string
  valyu_organisation_name?: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
  // Valyu OAuth tokens
  valyuAccessToken: string | null
  valyuRefreshToken: string | null
  valyuTokenExpiresAt: number | null
  // Valyu API status
  hasApiKey: boolean
  creditsAvailable: boolean
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  // Valyu OAuth methods
  signInWithValyu: () => Promise<{ data?: any; error?: any }>
  completeValyuAuth: (
    idToken: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ) => Promise<{ success: boolean; error?: string }>
  // Token management
  setValyuTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void
  getValyuAccessToken: () => string | null
  setApiKeyStatus: (hasApiKey: boolean, creditsAvailable: boolean) => void
  // Standard methods
  signOut: () => Promise<{ error?: any }>
  initialize: () => void
  refreshUser: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

// Storage key for Valyu tokens
const VALYU_TOKEN_KEY = 'valyu_oauth_tokens'

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      initialized: false,
      valyuAccessToken: null,
      valyuRefreshToken: null,
      valyuTokenExpiresAt: null,
      hasApiKey: false,
      creditsAvailable: false,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (initialized) => set({ initialized }),

      setValyuTokens: (accessToken: string, refreshToken: string, expiresIn: number) => {
        const expiresAt = Date.now() + expiresIn * 1000
        set({
          valyuAccessToken: accessToken,
          valyuRefreshToken: refreshToken,
          valyuTokenExpiresAt: expiresAt,
        })
        // Also save to localStorage for persistence across page reloads
        saveValyuTokens({
          accessToken,
          refreshToken,
          expiresAt,
        })
      },

      getValyuAccessToken: () => {
        const state = get()
        // Check if token in state is valid
        if (state.valyuAccessToken && state.valyuTokenExpiresAt) {
          if (Date.now() < state.valyuTokenExpiresAt - 5 * 60 * 1000) {
            return state.valyuAccessToken
          }
        }
        // Try to get from localStorage
        const tokens = loadValyuTokens()
        if (tokens && !isTokenExpired(tokens)) {
          // Update state with loaded tokens
          set({
            valyuAccessToken: tokens.accessToken,
            valyuRefreshToken: tokens.refreshToken,
            valyuTokenExpiresAt: tokens.expiresAt,
          })
          return tokens.accessToken
        }
        return null
      },

      setApiKeyStatus: (hasApiKey: boolean, creditsAvailable: boolean) => {
        set({ hasApiKey, creditsAvailable })
      },

      signInWithValyu: async () => {
        try {
          // Track sign-in attempt
          if (typeof window !== 'undefined') {
            import('@vercel/analytics').then(({ track }) => {
              track('Sign In With Valyu Clicked', {
                source: window.location.pathname,
              })
            })
          }

          const redirectUri = `${window.location.origin}/auth/valyu/callback`
          const { url } = await buildAuthorizationUrl(redirectUri)

          // Redirect to Valyu OAuth
          window.location.href = url

          return { data: { redirecting: true } }
        } catch (error) {
          console.error('[Auth Store] signInWithValyu error:', error)
          // Track sign-in error
          if (typeof window !== 'undefined') {
            import('@vercel/analytics').then(({ track }) => {
              track('Sign In With Valyu Error', {
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            })
          }
          return {
            error: {
              message: error instanceof Error ? error.message : 'Failed to start Valyu sign-in',
            },
          }
        }
      },

      completeValyuAuth: async (
        idToken: string,
        accessToken: string,
        refreshToken: string,
        expiresIn: number
      ) => {
        try {
          set({ loading: true })

          // Store Valyu tokens
          const expiresAt = Date.now() + expiresIn * 1000
          console.log('[Auth Store] Saving Valyu tokens, expiresIn:', expiresIn, 'expiresAt:', new Date(expiresAt).toISOString())
          set({
            valyuAccessToken: accessToken,
            valyuRefreshToken: refreshToken,
            valyuTokenExpiresAt: expiresAt,
          })
          saveValyuTokens({ accessToken, refreshToken, expiresAt })
          console.log('[Auth Store] Tokens saved to localStorage')

          // Create local session via our API
          const sessionResponse = await fetch('/api/auth/valyu/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: accessToken }),
          })

          const sessionData = await sessionResponse.json()

          if (!sessionResponse.ok) {
            throw new Error(sessionData.error || 'Failed to create session')
          }

          // Complete session with magic link token
          if (sessionData.token_hash) {
            const supabase = createClient()

            // Verify the OTP token to establish local session
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: sessionData.token_hash,
              type: 'magiclink',
            })

            if (error) {
              console.error('[Auth Store] verifyOtp error:', error)
              // Session creation might still work, continue with user data
            }

            if (data?.user) {
              set({
                user: {
                  ...data.user,
                  valyu_sub: sessionData.user?.valyu_sub,
                  valyu_organisation_id: sessionData.user?.valyu_organisation_id,
                  valyu_organisation_name: sessionData.user?.valyu_organisation_name,
                } as AuthUser,
                loading: false,
                hasApiKey: true,
                creditsAvailable: true,
              })

              return { success: true }
            }
          }

          // Fallback - use data from session endpoint
          // Note: This is a simplified user object when OTP verification fails
          if (sessionData.user) {
            const fallbackUser = {
              id: sessionData.user.id,
              email: sessionData.user.email,
              app_metadata: {},
              user_metadata: {
                full_name: sessionData.user.name,
                avatar_url: sessionData.user.avatar_url,
              },
              aud: 'authenticated',
              created_at: new Date().toISOString(),
              valyu_sub: sessionData.user.valyu_sub,
              valyu_organisation_id: sessionData.user.valyu_organisation_id,
              valyu_organisation_name: sessionData.user.valyu_organisation_name,
            }
            set({
              user: fallbackUser as AuthUser,
              loading: false,
              hasApiKey: true,
              creditsAvailable: true,
            })
            return { success: true }
          }

          throw new Error('No user data received')
        } catch (error) {
          console.error('[Auth Store] completeValyuAuth error:', error)
          set({ loading: false })
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Authentication failed',
          }
        }
      },

      signOut: async () => {
        console.log('[Auth Store] signOut called')

        // Track sign out
        if (typeof window !== 'undefined') {
          import('@vercel/analytics').then(({ track }) => {
            track('Sign Out Clicked')
          })
        }

        const supabase = createClient()

        try {
          console.log('[Auth Store] Calling supabase.auth.signOut()')

          // Clear Valyu tokens
          signOutValyu()
          set({
            valyuAccessToken: null,
            valyuRefreshToken: null,
            valyuTokenExpiresAt: null,
            hasApiKey: false,
            creditsAvailable: false,
          })

          // Add timeout to prevent hanging
          const timeoutPromise = new Promise<{ error: Error }>((_, reject) => {
            setTimeout(() => reject(new Error('Sign out timeout')), 5000)
          })

          const signOutPromise = supabase.auth.signOut()

          const result = await Promise.race([signOutPromise, timeoutPromise])
          console.log('[Auth Store] signOut result:', result)

          // Clear user state
          set({ user: null })

          return result
        } catch (error) {
          console.error('[Auth Store] signOut error:', error)

          // If signOut fails or times out, manually clear the state
          console.log('[Auth Store] Manually clearing auth state due to error')
          set({ user: null })

          // Also manually clear session storage
          if (typeof window !== 'undefined') {
            try {
              window.sessionStorage.removeItem('auth-storage')
              console.log('[Auth Store] Cleared session storage')
            } catch (storageError) {
              console.error('[Auth Store] Failed to clear session storage:', storageError)
            }
          }

          return { error }
        }
      },

      refreshUser: async () => {
        const supabase = createClient()

        // Get fresh session first
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          console.log('[RefreshUser] No session')
          return
        }

        console.log('[RefreshUser] Refreshing user for:', session.user.id)

        // Valyu info is stored in user_metadata from the auth session
        const updatedUser = {
          ...session.user,
          valyu_sub: session.user.user_metadata?.valyu_sub,
          valyu_organisation_id: session.user.user_metadata?.valyu_organisation_id,
          valyu_organisation_name: session.user.user_metadata?.valyu_organisation_name,
        } as AuthUser

        console.log('[RefreshUser] Setting user with Valyu info from metadata')

        set({ user: updatedUser })
      },

      initialize: () => {
        if (get().initialized) return

        // Mark as initialized
        set({ initialized: true })

        console.log('[Initialize] Starting auth initialization')

        const supabase = createClient()

        // Load Valyu tokens from storage
        const valyuTokens = loadValyuTokens()
        if (valyuTokens && !isTokenExpired(valyuTokens)) {
          set({
            valyuAccessToken: valyuTokens.accessToken,
            valyuRefreshToken: valyuTokens.refreshToken,
            valyuTokenExpiresAt: valyuTokens.expiresAt,
            hasApiKey: true,
            creditsAvailable: true,
          })
        }

        // Set loading false after a delay if auth state doesn't update
        const timeoutId = setTimeout(() => {
          const currentState = get()
          if (currentState.loading) {
            console.log('[Initialize] Auth initialization timeout - stopping loader')
            set({ loading: false })
          }
        }, 3000)

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('[Auth State Change]', event, session?.user?.email)

          // Clear timeout since we got an auth update
          if (timeoutId) clearTimeout(timeoutId)

          // Always set the user state based on session
          set({
            user: session?.user ? ({ ...session.user } as AuthUser) : null,
            loading: false,
          })

          // Handle sign out event
          if (event === 'SIGNED_OUT') {
            console.log('[Auth Store] User signed out, clearing all data')
            // Clear Valyu tokens
            signOutValyu()
            set({
              valyuAccessToken: null,
              valyuRefreshToken: null,
              valyuTokenExpiresAt: null,
              hasApiKey: false,
              creditsAvailable: false,
            })
            // Dispatch custom event to notify other parts of the app
            if (typeof window !== 'undefined') {
              setTimeout(() => {
                const signOutEvent = new CustomEvent('auth:signout')
                window.dispatchEvent(signOutEvent)
              }, 100)
            }
            return // Exit early, no need to process further
          }

          // For signed in users, refresh their data in the background
          if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            console.log('[Auth State Change] Refreshing user data in background...')
            // Don't await this - let it happen in background
            get()
              .refreshUser()
              .catch((err) => {
                console.error('[Auth State Change] Background refresh failed:', err)
              })
          }
        })

        // Trigger initial check
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            console.log('[Initialize] Found existing session, triggering auth state change')
            // The onAuthStateChange handler will handle this
          } else {
            console.log('[Initialize] No existing session')
            set({ loading: false })
          }
        })

        // Cleanup subscription on unmount
        if (typeof window !== 'undefined') {
          window.addEventListener('beforeunload', () => {
            subscription.unsubscribe()
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
      }),
      skipHydration: true,
    }
  )
)
