import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    console.log("[Oxlo Test] Testing Oxlo API connection")
    console.log("[Oxlo Test] API Key length:", apiKey.length)
    console.log("[Oxlo Test] API Key prefix:", apiKey.substring(0, 8) + "...")
    console.log("[Oxlo Test] API Key suffix:", "..." + apiKey.substring(apiKey.length - 4))

    const requestBody = {
      model: "deepseek-v3.2",
      messages: [
        {
          role: "user",
          content: "Hello, this is a test message. Please respond with 'Test successful'."
        }
      ],
      temperature: 0.7,
      max_tokens: 50
    }

    console.log("[Oxlo Test] Endpoint: https://api.oxlo.ai/v1/chat/completions")
    console.log("[Oxlo Test] Request body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch("https://api.oxlo.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log("[Oxlo Test] Response status:", response.status)
    console.log("[Oxlo Test] Response headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("[Oxlo Test] Response body:", responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { raw: responseText }
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: response.status,
        statusText: response.statusText,
        error: responseData
      }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      data: responseData
    })

  } catch (error: any) {
    console.error("[Oxlo Test] Exception:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
