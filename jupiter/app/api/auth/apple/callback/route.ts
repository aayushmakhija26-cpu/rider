import { NextResponse, type NextRequest } from 'next/server'
import { SignJWT, importPKCS8, createRemoteJWKSet, jwtVerify } from 'jose'
import { setSession } from '@/lib/auth/session'
import { findOrCreateOAuthUser } from '../../_oauth-helpers'

const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'))

async function generateAppleClientSecret(): Promise<string> {
  const privateKey = await importPKCS8(
    process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    'ES256'
  )
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: process.env.APPLE_KEY_ID! })
    .setIssuer(process.env.APPLE_TEAM_ID!)
    .setIssuedAt()
    .setExpirationTime('5m')
    .setAudience('https://appleid.apple.com')
    .setSubject(process.env.APPLE_CLIENT_ID!)
    .sign(privateKey)
}

export async function POST(req: NextRequest) {
  // Apple sends application/x-www-form-urlencoded via form_post
  const body = await req.text()
  const params = new URLSearchParams(body)
  const code = params.get('code')
  const state = params.get('state')
  const formIdToken = params.get('id_token')
  // user field is ONLY sent on the very first authentication — extract immediately
  const userJson = params.get('user')
  const stateCookie = req.cookies.get('__oauth_state_apple')?.value

  // AC-6: Invalid or missing state cookie → 400 (no session set)
  if (!state || !stateCookie || state !== stateCookie) {
    return new NextResponse('Invalid state', { status: 400 })
  }

  // Provider returned an error (e.g. user cancelled) — redirect cleanly
  const providerError = params.get('error')
  if (providerError || !code) {
    const res = NextResponse.redirect(new URL('/sign-in?error=oauth_failed', req.url))
    res.cookies.delete('__oauth_state_apple')
    return res
  }

  try {
    const clientSecret = await generateAppleClientSecret()
    const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.APPLE_CLIENT_ID!,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.BASE_URL}/api/auth/apple/callback`,
      }),
    })

    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`)

    const tokens = await tokenRes.json()
    // Prefer token-endpoint id_token (obtained via authenticated server exchange);
    // fall back to form-body id_token only if absent from the token response
    const rawIdToken = tokens.id_token ?? formIdToken
    if (!rawIdToken) throw new Error('No id_token available')

    // Verify ID token signature against Apple's public keys
    const { payload } = await jwtVerify(rawIdToken, APPLE_JWKS, {
      issuer: 'https://appleid.apple.com',
      audience: process.env.APPLE_CLIENT_ID!,
    })
    const { sub, email } = payload as { sub: string; email?: string }
    if (!sub || !email) throw new Error('Missing required claims in id_token')

    // Extract name — only present on first sign-in
    let name: string | undefined
    if (userJson) {
      try {
        const userObj = JSON.parse(userJson)
        const firstName = userObj?.name?.firstName ?? ''
        const lastName = userObj?.name?.lastName ?? ''
        name = `${firstName} ${lastName}`.trim() || undefined
      } catch { /* ignore malformed user JSON */ }
    }

    const dealerUser = await findOrCreateOAuthUser({ email, name, provider: 'apple', providerId: sub })
    await setSession(dealerUser)

    const redirectRes = NextResponse.redirect(new URL('/dashboard', req.url))
    redirectRes.cookies.delete('__oauth_state_apple')
    return redirectRes
  } catch (err) {
    console.error('[auth/apple/callback]', err)
    const errRes = NextResponse.redirect(new URL('/sign-in?error=oauth_failed', req.url))
    errRes.cookies.delete('__oauth_state_apple')
    return errRes
  }
}
