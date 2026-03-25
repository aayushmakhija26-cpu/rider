import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function GET() {
  const state = randomUUID()
  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!,
    redirect_uri: `${process.env.BASE_URL}/api/auth/apple/callback`,
    response_type: 'code id_token',
    response_mode: 'form_post',
    scope: 'name email',
    state,
  })
  const redirectRes = NextResponse.redirect(
    `https://appleid.apple.com/auth/authorize?${params.toString()}`
  )
  // Apple callback is a cross-origin POST (form_post from appleid.apple.com).
  // sameSite: 'none' + secure: true is required — lax blocks cross-site POSTs.
  // Apple already requires HTTPS for the redirect_uri, so secure: true is always valid here.
  redirectRes.cookies.set('__oauth_state_apple', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 600,
    path: '/',
  })
  return redirectRes
}
