import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("google_access_token")?.value
  if (!accessToken) {
    return NextResponse.json({ error: "Google Access Token is missing or has expired. Please log in again." }, { status: 401 })
  }

  try {
    const { to, subject, body } = await request.json()
    if (!to || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields (to, subject, body)" }, { status: 400 })
    }

    // Construct raw RFC 2822 email message formatting
    const emailParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset="utf-8"',
      'MIME-Version: 1.0',
      '',
      body
    ]
    const emailContent = emailParts.join('\r\n')

    // Encode standard Base64 url safe string without padding
    const encodedMessage = btoa(unescape(encodeURIComponent(emailContent)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Send email using Gmail API REST endpoint directly
    const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    })

    const data = await gmailResponse.json()
    if (!gmailResponse.ok) {
      return NextResponse.json({ error: "Gmail API Error", details: data }, { status: gmailResponse.status })
    }

    return NextResponse.json({ success: true, messageId: data.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
