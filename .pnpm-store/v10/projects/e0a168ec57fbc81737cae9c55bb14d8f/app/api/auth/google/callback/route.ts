import { NextResponse, type NextRequest } from 'next/server'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { setSession } from '@/lib/auth/session'
import { findOrCreateOAuthUser } from '../../_oauth-helpers'

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const stateCookie = req.cookies.get('__oauth_state_google')?.value

  // AC-6: Invalid or missing state cookie → 400 (no session set)
  if (!state || !stateCookie || state !== stateCookie) {
    return new NextResponse('Invalid state', { status: 400 })
  }

  // Provider returned an error (e.g. user denied consent) — redirect cleanly
  const providerError = searchParams.get('error')
  if (providerError || !code) {
    const res = NextResponse.redirect(new URL('/sign-in?error=oauth_failed', req.url))
    res.cookies.delete('__oauth_state_google')
    return res
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.BASE_URL}/api/auth/google/callback`,
      }),
    })

    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`)

    const tokens = await tokenRes.json()
    if (!tokens.id_token) throw new Error('No id_token in token response')

    // Verify ID token signature against Google's public keys
    const { payload } = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
      issuer: 'https://accounts.google.com',
      audience: process.env.GOOGLE_CLIENT_ID!,
    })
    const { sub, email, name } = payload as { sub: string; email: string; name?: string }
    if (!sub || !email) throw new Error('Missing required claims in id_token')

    const dealerUser = await findOrCreateOAuthUser({ email, name, provider: 'google', providerId: sub })
    await setSession(dealerUser)

    const redirectRes = NextResponse.redirect(new URL('/dealer/onboarding', req.url))
    redirectRes.cookies.delete('__oauth_state_google')
    return redirectRes
  } catch (err) {
    console.error('[auth/google/callback]', err)
    const errRes = NextResponse.redirect(new URL('/sign-in?error=oauth_failed', req.url))
    errRes.cookies.delete('__oauth_state_google')
    return errRes
  }
}
