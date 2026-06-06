import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.json({ error }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ error: "No authorization code provided" }, { status: 400 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${request.nextUrl.origin}/auth/google/callback`

  try {
    // Exchange the authorization code for access and refresh tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: "Token exchange failed", details: tokens },
        { status: tokenResponse.status }
      )
    }

    // Redirect to the success panel page
    const successUrl = new URL("/auth/google/success", request.url)
    const response = NextResponse.redirect(successUrl)
    
    // Store access token in a cookie (valid for Google's expiry duration - usually 3600 seconds)
    response.cookies.set("google_access_token", tokens.access_token, {
      path: "/",
      maxAge: tokens.expires_in || 3600,
      httpOnly: false, // Accessible on client-side to dynamically read
      sameSite: "lax"
    })

    // Store refresh token in a cookie if provided (valid for 30 days)
    if (tokens.refresh_token) {
      response.cookies.set("google_refresh_token", tokens.refresh_token, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: false,
        sameSite: "lax"
      })
    }

    return response
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
