import { NextRequest, NextResponse } from "next/server"
import { detectIntent } from "../../chat/route"

export async function POST(request: NextRequest) {
  try {
    const { message, provider = "oxlo", apiKey } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    console.log("[Intent Test] Testing intent detection")
    console.log("[Intent Test] Message:", message)
    console.log("[Intent Test] Provider:", provider)

    const intentResult = await detectIntent(message, provider, apiKey)

    console.log("[Intent Test] Result:", JSON.stringify(intentResult, null, 2))

    return NextResponse.json({
      success: true,
      message,
      intent: intentResult
    })

  } catch (error: any) {
    console.error("[Intent Test] Exception:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
