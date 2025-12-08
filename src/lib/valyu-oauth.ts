/**
 * Valyu OAuth 2.1 PKCE Client
 *
 * Implements OAuth 2.1 with PKCE for "Sign in with Valyu" authentication.
 * Uses Valyu Platform as the Identity Provider.
 */

// OAuth Configuration
const VALYU_SUPABASE_URL = process.env.NEXT_PUBLIC_VALYU_SUPABASE_URL || '';
const VALYU_CLIENT_ID = process.env.NEXT_PUBLIC_VALYU_CLIENT_ID || '';

// Storage keys for PKCE flow
const PKCE_STATE_KEY = 'valyu_oauth_state';
const PKCE_VERIFIER_KEY = 'valyu_oauth_verifier';
const VALYU_TOKEN_KEY = 'valyu_oauth_tokens';

// Types
export interface ValyuTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
  idToken?: string;
}

export interface ValyuUserInfo {
  sub: string; // Valyu user ID
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  user_type?: 'buyer' | 'seller';
  organisation_id?: string;
  organisation_name?: string;
}

export interface PKCEChallenge {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
}

// PKCE Utilities
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((v) => charset[v % charset.length])
    .join('');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function generateCodeVerifier(): Promise<string> {
  return generateRandomString(64);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await sha256(verifier);
  return base64UrlEncode(hash);
}

export function generateState(): string {
  return generateRandomString(32);
}

// Storage helpers for PKCE state
export function storePKCEState(state: string, verifier: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PKCE_STATE_KEY, state);
  localStorage.setItem(PKCE_VERIFIER_KEY, verifier);
}

export function getPKCEState(): { state: string | null; verifier: string | null } {
  if (typeof window === 'undefined') return { state: null, verifier: null };
  return {
    state: localStorage.getItem(PKCE_STATE_KEY),
    verifier: localStorage.getItem(PKCE_VERIFIER_KEY),
  };
}

export function clearPKCEState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PKCE_STATE_KEY);
  localStorage.removeItem(PKCE_VERIFIER_KEY);
}

// Token storage helpers
export function saveValyuTokens(tokens: ValyuTokens): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VALYU_TOKEN_KEY, JSON.stringify(tokens));
}

export function loadValyuTokens(): ValyuTokens | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(VALYU_TOKEN_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ValyuTokens;
  } catch {
    return null;
  }
}

export function clearValyuTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(VALYU_TOKEN_KEY);
}

export function isTokenExpired(tokens: ValyuTokens | null): boolean {
  if (!tokens) return true;
  // Consider token expired 5 minutes before actual expiry
  return Date.now() >= tokens.expiresAt - 5 * 60 * 1000;
}

// OAuth Flow Functions

/**
 * Build the authorization URL for initiating OAuth flow
 */
export async function buildAuthorizationUrl(redirectUri: string): Promise<{
  url: string;
  state: string;
  codeVerifier: string;
}> {
  if (!VALYU_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_VALYU_SUPABASE_URL is not configured');
  }
  if (!VALYU_CLIENT_ID) {
    throw new Error('NEXT_PUBLIC_VALYU_CLIENT_ID is not configured');
  }

  const state = generateState();
  const codeVerifier = await generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store PKCE state for callback validation
  storePKCEState(state, codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: VALYU_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const url = `${VALYU_SUPABASE_URL}/auth/v1/oauth/authorize?${params.toString()}`;

  return { url, state, codeVerifier };
}

/**
 * Validate the callback parameters from OAuth redirect
 */
export function validateCallback(
  code: string | null,
  state: string | null,
  error: string | null
): { valid: boolean; error?: string; code?: string } {
  if (error) {
    return { valid: false, error: `OAuth error: ${error}` };
  }

  if (!code) {
    return { valid: false, error: 'No authorization code received' };
  }

  if (!state) {
    return { valid: false, error: 'No state parameter received' };
  }

  const stored = getPKCEState();
  if (!stored.state) {
    return { valid: false, error: 'No stored state found - session may have expired' };
  }

  if (state !== stored.state) {
    return { valid: false, error: 'State mismatch - possible CSRF attack' };
  }

  return { valid: true, code };
}

/**
 * Exchange authorization code for tokens (client-side call to our server endpoint)
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{
  success: boolean;
  tokens?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    id_token?: string;
  };
  error?: string;
}> {
  const stored = getPKCEState();
  if (!stored.verifier) {
    return { success: false, error: 'No code verifier found' };
  }

  try {
    // Call our server endpoint which has the client secret
    const response = await fetch('/api/auth/valyu/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        code_verifier: stored.verifier,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Token exchange failed' };
    }

    // Clear PKCE state after successful exchange
    clearPKCEState();

    return {
      success: true,
      tokens: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token exchange failed',
    };
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  success: boolean;
  tokens?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  error?: string;
}> {
  try {
    const response = await fetch('/api/auth/valyu/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Token refresh failed' };
    }

    return {
      success: true,
      tokens: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    };
  }
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = loadValyuTokens();

  if (!tokens) {
    return null;
  }

  // If token is not expired, return it
  if (!isTokenExpired(tokens)) {
    return tokens.accessToken;
  }

  // Try to refresh
  if (tokens.refreshToken) {
    const result = await refreshAccessToken(tokens.refreshToken);
    if (result.success && result.tokens) {
      const newTokens: ValyuTokens = {
        accessToken: result.tokens.access_token,
        refreshToken: result.tokens.refresh_token,
        expiresAt: Date.now() + result.tokens.expires_in * 1000,
      };
      saveValyuTokens(newTokens);
      return newTokens.accessToken;
    }
  }

  // Token expired and refresh failed
  clearValyuTokens();
  return null;
}

/**
 * Proxy Valyu API calls through OAuth proxy
 * This uses the user's OAuth token to make API calls that charge to their org credits
 */
export async function proxyValyuApi(
  path: string,
  method: string,
  body: any,
  accessToken: string
): Promise<any> {
  const VALYU_APP_URL = process.env.NEXT_PUBLIC_VALYU_APP_URL || 'https://platform.valyu.ai';
  const proxyUrl = `${VALYU_APP_URL}/api/oauth/proxy`;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path,
      method,
      body,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Proxy request failed' }));
    throw new Error(error.error || `Proxy request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Sign out - clear all Valyu tokens
 */
export function signOutValyu(): void {
  clearValyuTokens();
  clearPKCEState();
}
