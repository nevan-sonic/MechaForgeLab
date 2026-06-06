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

  // Retrieve client credentials from environment variables
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  
  // The redirect URI must match EXACTLY with the redirect URI registered in Google Cloud Console
  const redirectUri = `${request.nextUrl.origin}/api/auth/callback/google`

  try {
    // Exchange the authorization code for tokens
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
        { error: "Failed to exchange authorization code for tokens", details: tokens },
        { status: tokenResponse.status }
      )
    }

    // Render a premium success UI displaying the retrieved tokens for confirmation
    const successHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google OAuth Success</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #0f172a;
              color: #f1f5f9;
              padding: 2rem;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            .card {
              background-color: #1e293b;
              border: 1px solid #334155;
              border-radius: 12px;
              padding: 2.5rem;
              max-width: 650px;
              width: 100%;
              box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3);
            }
            .brand-header {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              margin-bottom: 1.5rem;
            }
            .icon-wrapper {
              width: 2.5rem;
              height: 2.5rem;
              background: linear-gradient(135deg, #3b82f6, #8b5cf6);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .icon-wrapper svg {
              width: 1.5rem;
              height: 1.5rem;
              color: white;
            }
            h1 {
              color: #ffffff;
              font-size: 1.5rem;
              font-weight: 700;
              margin: 0;
            }
            p {
              color: #94a3b8;
              font-size: 0.95rem;
              line-height: 1.5;
            }
            pre {
              background-color: #090d16;
              padding: 1.25rem;
              border-radius: 8px;
              overflow-x: auto;
              font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
              font-size: 0.85rem;
              border: 1px solid #334155;
              color: #38bdf8;
              margin: 1.5rem 0;
            }
            .btn {
              display: inline-block;
              background-color: #2563eb;
              color: white;
              padding: 0.625rem 1.25rem;
              border-radius: 6px;
              text-decoration: none;
              font-size: 0.9rem;
              font-weight: 600;
              transition: background-color 0.2s;
            }
            .btn:hover {
              background-color: #1d4ed8;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand-header">
              <div class="icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h1>Google OAuth Success</h1>
            </div>
            <p>You have successfully authenticated with Google OAuth. Your Gmail and Google Calendar access tokens have been generated successfully.</p>
            <p>Save these tokens to configure the credentials in your local agent <code>.env</code> file:</p>
            <pre><code>${JSON.stringify(tokens, null, 2)}</code></pre>
            <a href="/" class="btn">Return to Application</a>
          </div>
        </body>
      </html>
    `

    return new NextResponse(successHtml, {
      headers: { "Content-Type": "text/html" },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
