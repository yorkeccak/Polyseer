import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Callback Route
 *
 * This route receives the authorization code from Valyu Platform OAuth
 * and redirects to the client-side completion page with the code.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Build the redirect URL to the client-side completion page
  const completionUrl = new URL('/auth/valyu/complete', request.url);

  // Pass all params to the completion page for client-side handling
  if (code) completionUrl.searchParams.set('code', code);
  if (state) completionUrl.searchParams.set('state', state);
  if (error) completionUrl.searchParams.set('error', error);
  if (errorDescription) completionUrl.searchParams.set('error_description', errorDescription);

  return NextResponse.redirect(completionUrl);
}
