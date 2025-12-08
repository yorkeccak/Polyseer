'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/use-auth-store';
import {
  validateCallback,
  exchangeCodeForTokens,
  clearPKCEState,
} from '@/lib/valyu-oauth';

function ValyuOAuthCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const completeValyuAuth = useAuthStore((state) => state.completeValyuAuth);

  useEffect(() => {
    async function completeOAuth() {
      try {
        // Get params from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Validate callback
        const validation = validateCallback(code, state, error);

        if (!validation.valid) {
          setStatus('error');
          setErrorMessage(validation.error || errorDescription || 'OAuth validation failed');
          return;
        }

        // Get the redirect URI (must match what was used in authorization)
        const redirectUri = `${window.location.origin}/auth/valyu/callback`;

        // Exchange code for tokens
        const tokenResult = await exchangeCodeForTokens(validation.code!, redirectUri);
        console.log('[OAuth Complete] Token exchange result:', tokenResult.success, tokenResult.error);

        if (!tokenResult.success || !tokenResult.tokens) {
          setStatus('error');
          setErrorMessage(tokenResult.error || 'Failed to exchange code for tokens');
          return;
        }

        console.log('[OAuth Complete] Got tokens, expires_in:', tokenResult.tokens.expires_in);

        // Complete authentication in auth store
        // This creates the local Supabase session
        const authResult = await completeValyuAuth(
          tokenResult.tokens.id_token || '',
          tokenResult.tokens.access_token,
          tokenResult.tokens.refresh_token,
          tokenResult.tokens.expires_in
        );

        if (!authResult.success) {
          setStatus('error');
          setErrorMessage(authResult.error || 'Failed to complete authentication');
          return;
        }

        // Success - redirect to home
        setStatus('success');

        // Track successful auth
        if (typeof window !== 'undefined') {
          import('@vercel/analytics').then(({ track }) => {
            track('Sign In Success', { method: 'valyu' });
          });
        }

        // Small delay to show success state, then redirect
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } catch (error) {
        console.error('OAuth completion error:', error);
        setStatus('error');
        const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
        setErrorMessage(errMsg);

        // Track auth error
        if (typeof window !== 'undefined') {
          import('@vercel/analytics').then(({ track }) => {
            track('Sign In Error', { method: 'valyu', error: errMsg });
          });
        }

        // Clean up PKCE state on error
        clearPKCEState();
      }
    }

    completeOAuth();
  }, [searchParams, router, completeValyuAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 max-w-md mx-4">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">Signing you in...</h2>
            <p className="text-white/60">Completing authentication with Valyu</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Success!</h2>
            <p className="text-white/60">Redirecting you to the app...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Authentication Failed</h2>
            <p className="text-white/60 mb-4">{errorMessage}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Return to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ValyuOAuthCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 max-w-md mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <ValyuOAuthCompleteContent />
    </Suspense>
  );
}
