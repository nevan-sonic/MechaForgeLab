import { NextRequest, NextResponse } from "next/server"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  provider?: "oxlo" | "groq" | "gemini"
  apiKey?: string
  googleAccessToken?: string
}

interface IntentDetectionResult {
  intent: "calendar_event" | "send_email" | "general_chat"
  tool?: "create_calendar_event" | "send_email"
  parameters?: any
  confidence: number
}

// Natural language date parsing utility
function parseNaturalDate(dateStr: string): { start: Date; end: Date } | null {
  console.log("[Date Parser] Input:", dateStr)
  
  const now = new Date()
  const lowerStr = dateStr.toLowerCase()
  
  // Handle "today"
  if (lowerStr.includes("today")) {
    const today = new Date(now)
    
    // Extract time if present
    const timeMatch = dateStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
    if (timeMatch) {
      let hours = parseInt(timeMatch[1])
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      const meridiem = timeMatch[3]?.toLowerCase()
      
      if (meridiem === "pm" && hours < 12) hours += 12
      if (meridiem === "am" && hours === 12) hours = 0
      
      today.setHours(hours, minutes, 0, 0)
    } else {
      today.setHours(9, 0, 0, 0) // Default 9 AM
    }
    
    const end = new Date(today)
    end.setHours(end.getHours() + 1) // Default 1 hour duration
    
    console.log("[Date Parser] Parsed 'today':", today.toISOString())
    return { start: today, end }
  }
  
  // Handle "tomorrow"
  if (lowerStr.includes("tomorrow")) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Extract time if present
    const timeMatch = dateStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
    if (timeMatch) {
      let hours = parseInt(timeMatch[1])
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      const meridiem = timeMatch[3]?.toLowerCase()
      
      if (meridiem === "pm" && hours < 12) hours += 12
      if (meridiem === "am" && hours === 12) hours = 0
      
      tomorrow.setHours(hours, minutes, 0, 0)
    } else {
      tomorrow.setHours(9, 0, 0, 0) // Default 9 AM
    }
    
    const end = new Date(tomorrow)
    end.setHours(end.getHours() + 1) // Default 1 hour duration
    
    console.log("[Date Parser] Parsed 'tomorrow':", tomorrow.toISOString())
    return { start: tomorrow, end }
  }
  
  // Handle "next [day]"
  const dayMatch = lowerStr.match(/next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i)
  if (dayMatch) {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const targetDay = days.indexOf(dayMatch[1].toLowerCase())
    const currentDay = now.getDay()
    
    const daysUntil = (targetDay - currentDay + 7) % 7 || 7
    const targetDate = new Date(now)
    targetDate.setDate(targetDate.getDate() + daysUntil)
    
    // Extract time if present
    const timeMatch = dateStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
    if (timeMatch) {
      let hours = parseInt(timeMatch[1])
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      const meridiem = timeMatch[3]?.toLowerCase()
      
      if (meridiem === "pm" && hours < 12) hours += 12
      if (meridiem === "am" && hours === 12) hours = 0
      
      targetDate.setHours(hours, minutes, 0, 0)
    } else {
      targetDate.setHours(9, 0, 0, 0)
    }
    
    const end = new Date(targetDate)
    end.setHours(end.getHours() + 1)
    
    console.log("[Date Parser] Parsed 'next day':", targetDate.toISOString())
    return { start: targetDate, end }
  }
  
  // Handle "in X hours"
  const hoursMatch = lowerStr.match(/in (\d+)\s*hours?/i)
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1])
    const start = new Date(now)
    start.setHours(start.getHours() + hours)
    const end = new Date(start)
    end.setHours(end.getHours() + 1)
    
    console.log("[Date Parser] Parsed 'in X hours':", start.toISOString())
    return { start, end }
  }
  
  // Handle "in X minutes"
  const minutesMatch = lowerStr.match(/in (\d+)\s*minutes?/i)
  if (minutesMatch) {
    const minutes = parseInt(minutesMatch[1])
    const start = new Date(now)
    start.setMinutes(start.getMinutes() + minutes)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + 30) // Default 30 min duration
    
    console.log("[Date Parser] Parsed 'in X minutes':", start.toISOString())
    return { start, end }
  }
  
  // Handle ISO date format (YYYY-MM-DD HH:MM or YYYY-MM-DDTHH:MM)
  const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2})(?::(\d{2}))?)?/)
  if (isoMatch) {
    const year = parseInt(isoMatch[1])
    const month = parseInt(isoMatch[2]) - 1 // JavaScript months are 0-indexed
    const day = parseInt(isoMatch[3])
    const hours = isoMatch[4] ? parseInt(isoMatch[4]) : 9
    const minutes = isoMatch[5] ? parseInt(isoMatch[5]) : 0
    
    const start = new Date(year, month, day, hours, minutes, 0, 0)
    const end = new Date(start)
    end.setHours(end.getHours() + 1)
    
    console.log("[Date Parser] Parsed ISO format:", start.toISOString())
    return { start, end }
  }
  
  // Handle "Month Day at time" (e.g., "June 10 at 5 PM")
  const monthDayMatch = dateStr.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/i)
  if (monthDayMatch) {
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
    const month = months.indexOf(monthDayMatch[1].toLowerCase())
    const day = parseInt(monthDayMatch[2])
    
    const targetDate = new Date(now.getFullYear(), month, day)
    
    // If the date has passed this year, use next year
    if (targetDate < now) {
      targetDate.setFullYear(targetDate.getFullYear() + 1)
    }
    
    // Extract time if present
    if (monthDayMatch[3]) {
      let hours = parseInt(monthDayMatch[3])
      const minutes = monthDayMatch[4] ? parseInt(monthDayMatch[4]) : 0
      const meridiem = monthDayMatch[5]?.toLowerCase()
      
      if (meridiem === "pm" && hours < 12) hours += 12
      if (meridiem === "am" && hours === 12) hours = 0
      
      targetDate.setHours(hours, minutes, 0, 0)
    } else {
      targetDate.setHours(9, 0, 0, 0)
    }
    
    const end = new Date(targetDate)
    end.setHours(end.getHours() + 1)
    
    console.log("[Date Parser] Parsed 'Month Day':", targetDate.toISOString())
    return { start: targetDate, end }
  }
  
  // Handle "[day] at [time]" (e.g., "Friday at 3 PM")
  const dayAtTimeMatch = lowerStr.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (dayAtTimeMatch) {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const targetDay = days.indexOf(dayAtTimeMatch[1].toLowerCase())
    const currentDay = now.getDay()
    
    const daysUntil = (targetDay - currentDay + 7) % 7
    const targetDate = new Date(now)
    targetDate.setDate(targetDate.getDate() + (daysUntil === 0 ? 7 : daysUntil))
    
    let hours = parseInt(dayAtTimeMatch[2])
    const minutes = dayAtTimeMatch[3] ? parseInt(dayAtTimeMatch[3]) : 0
    const meridiem = dayAtTimeMatch[4]?.toLowerCase()
    
    if (meridiem === "pm" && hours < 12) hours += 12
    if (meridiem === "am" && hours === 12) hours = 0
    
    targetDate.setHours(hours, minutes, 0, 0)
    
    const end = new Date(targetDate)
    end.setHours(end.getHours() + 1)
    
    console.log("[Date Parser] Parsed 'day at time':", targetDate.toISOString())
    return { start: targetDate, end }
  }
  
  console.log("[Date Parser] Failed to parse date/time")
  return null
}

// Intent detection using LLM
export async function detectIntent(message: string, provider: string, apiKey: string): Promise<IntentDetectionResult> {
  const systemPrompt = `You are an intent detection system. Analyze the user's message and determine if they want to:
1. Create a calendar event (keywords: schedule, meeting, calendar, event, book, remind, appointment)
2. Send an email (keywords: email, send, mail, message, contact)
3. General chat (anything else)

Return a JSON object with this exact format:
{
  "intent": "calendar_event" | "send_email" | "general_chat",
  "tool": "create_calendar_event" | "send_email" | null,
  "parameters": { ... } | null,
  "confidence": 0.0-1.0
}

For calendar events, extract:
- title (event name)
- date/time (natural language like "tomorrow at 2 PM", "next Monday", "Friday at 3 PM")
- description (optional)

For emails, extract:
- to (recipient email)
- subject (if not provided, generate a relevant one)
- body (email content)

Return ONLY the JSON, no other text.`

  try {
    let result: { content: string }
    
    switch (provider) {
      case "oxlo":
        result = await callOxloAPI([{ role: "system", content: systemPrompt }, { role: "user", content: message }], apiKey, false)
        break
      case "groq":
        result = await callGroqAPI([{ role: "system", content: systemPrompt }, { role: "user", content: message }], apiKey, false)
        break
      case "gemini":
        result = await callGeminiAPI([{ role: "system", content: systemPrompt }, { role: "user", content: message }], apiKey, false)
        break
      default:
        return { intent: "general_chat", confidence: 0.5 }
    }
    
    // Parse JSON response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      console.log("[Intent Detection] Detected intent:", parsed)
      return parsed
    }
    
    return { intent: "general_chat", confidence: 0.5 }
  } catch (error) {
    console.error("[Intent Detection] Error:", error)
    return { intent: "general_chat", confidence: 0.5 }
  }
}

// Tool definitions for Gmail and Google Calendar
const tools = [
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Send an email using Gmail",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "Recipient email address"
          },
          subject: {
            type: "string",
            description: "Email subject"
          },
          body: {
            type: "string",
            description: "Email body content"
          }
        },
        required: ["to", "subject", "body"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Create a calendar event using Google Calendar",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Event title"
          },
          description: {
            type: "string",
            description: "Event description"
          },
          startDateTime: {
            type: "string",
            description: "Event start time in ISO format (e.g., 2024-01-15T14:00:00)"
          },
          endDateTime: {
            type: "string",
            description: "Event end time in ISO format (e.g., 2024-01-15T15:00:00)"
          }
        },
        required: ["summary", "startDateTime", "endDateTime"]
      }
    }
  }
]

// Execute tool calls
async function executeToolCall(toolName: string, toolArgs: any, googleAccessToken: string): Promise<string> {
  console.log("[Tool Execution] Executing tool:", toolName)
  console.log("[Tool Execution] Arguments:", JSON.stringify(toolArgs))

  if (!googleAccessToken) {
    console.error("[Tool Execution] No Google access token available")
    return "Error: Google access token is required for this operation. Please connect your Google account."
  }

  try {
    if (toolName === "send_email") {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/google/gmail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `google_access_token=${googleAccessToken}`
        },
        body: JSON.stringify({
          to: toolArgs.to,
          subject: toolArgs.subject,
          body: toolArgs.body
        })
      })

      const data = await response.json()
      if (!response.ok) {
        console.error("[Tool Execution] Gmail API error:", data)
        return `Error sending email: ${data.error || "Unknown error"}`
      }

      console.log("[Tool Execution] Email sent successfully")
      return `Email sent successfully to ${toolArgs.to}`
    }

    if (toolName === "create_calendar_event") {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/google/calendar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `google_access_token=${googleAccessToken}`
        },
        body: JSON.stringify({
          summary: toolArgs.summary,
          description: toolArgs.description || "",
          startDateTime: toolArgs.startDateTime,
          endDateTime: toolArgs.endDateTime
        })
      })

      const data = await response.json()
      if (!response.ok) {
        console.error("[Tool Execution] Calendar API error:", data)
        return `Error creating calendar event: ${data.error || "Unknown error"}`
      }

      console.log("[Tool Execution] Calendar event created successfully")
      return `Calendar event "${toolArgs.summary}" created successfully`
    }

    console.error("[Tool Execution] Unknown tool:", toolName)
    return `Error: Unknown tool ${toolName}`
  } catch (error: any) {
    console.error("[Tool Execution] Exception:", error)
    return `Error executing tool: ${error.message}`
  }
}

// Helper function to call Oxlo API
async function callOxloAPI(messages: ChatMessage[], apiKey: string, enableTools: boolean = false): Promise<{ content: string; toolCalls?: any[] }> {
  console.log("[LLM API] Using provider: Oxlo")
  console.log("[LLM API] API Key length:", apiKey?.length)
  console.log("[LLM API] API Key prefix:", apiKey?.substring(0, 8) + "...")
  console.log("[LLM API] API Key suffix:", "..." + apiKey?.substring(apiKey.length - 4))
  console.log("[LLM API] Tools enabled:", enableTools)
  console.log("[LLM API] Endpoint: https://api.oxlo.ai/v1/chat/completions")
  console.log("[LLM API] Model: deepseek-v3.2")

  const requestBody: any = {
    model: "deepseek-v3.2",
    messages: messages,
    temperature: 0.7,
    max_tokens: 4096
  }

  if (enableTools) {
    requestBody.tools = tools
    requestBody.tool_choice = "auto"
  }

  console.log("[LLM API] Request body:", JSON.stringify(requestBody, null, 2))

  const response = await fetch("https://api.oxlo.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  })

  console.log("[LLM API] Response status:", response.status)
  console.log("[LLM API] Response headers:", Object.fromEntries(response.headers.entries()))

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[LLM API] Oxlo API error:", errorText)
    console.error("[LLM API] Full error response:", errorText)
    throw new Error(`Oxlo API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log("[LLM API] Oxlo API call successful")
  console.log("[LLM API] Response data:", JSON.stringify(data, null, 2))
  
  const message = data.choices[0].message
  return {
    content: message.content,
    toolCalls: message.tool_calls
  }
}

// Helper function to call Groq API
async function callGroqAPI(messages: ChatMessage[], apiKey: string, enableTools: boolean = false): Promise<{ content: string; toolCalls?: any[] }> {
  console.log("[LLM API] Using provider: Groq")
  console.log("[LLM API] API Key loaded:", !!apiKey)
  console.log("[LLM API] Tools enabled:", enableTools)

  const requestBody: any = {
    model: "llama3-70b-8192",
    messages: messages,
    temperature: 0.7,
    max_tokens: 2048
  }

  if (enableTools) {
    requestBody.tools = tools
    requestBody.tool_choice = "auto"
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[LLM API] Groq API error:", error)
    throw new Error(`Groq API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log("[LLM API] Groq API call successful")
  
  const message = data.choices[0].message
  return {
    content: message.content,
    toolCalls: message.tool_calls
  }
}

// Helper function to call Gemini API
async function callGeminiAPI(messages: ChatMessage[], apiKey: string, enableTools: boolean = false): Promise<{ content: string; toolCalls?: any[] }> {
  console.log("[LLM API] Using provider: Gemini")
  console.log("[LLM API] API Key loaded:", !!apiKey)
  console.log("[LLM API] Tools enabled:", enableTools)

  // Convert OpenAI-style messages to Gemini format
  const geminiMessages = messages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }))

  const requestBody: any = {
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  }

  // Gemini uses a different format for tools (function calling)
  if (enableTools) {
    requestBody.tools = [{
      functionDeclarations: tools.map(tool => tool.function)
    }]
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[LLM API] Gemini API error:", error)
    throw new Error(`Gemini API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log("[LLM API] Gemini API call successful")
  
  const content = data.candidates[0].content.parts[0].text
  const toolCalls = data.candidates[0].content.parts.filter((part: any) => part.functionCall)
  
  return {
    content,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { messages, provider = "oxlo", apiKey, googleAccessToken } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    if (!apiKey) {
      console.error("[LLM API] No API key provided")
      return NextResponse.json({ 
        error: "No API key provided. Please configure your API key in the settings.",
        details: "Click the key icon in the top-right header to add your API key."
      }, { status: 400 })
    }

    console.log("[LLM API] Processing chat request")
    console.log("[LLM API] Message count:", messages.length)
    console.log("[LLM API] Provider:", provider)
    console.log("[LLM API] Google access token available:", !!googleAccessToken)

    // Get the latest user message
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== "user") {
      return NextResponse.json({ error: "Last message must be from user" }, { status: 400 })
    }

    // Detect intent using LLM
    console.log("[Intent Detection] Analyzing user intent...")
    const intentResult = await detectIntent(lastMessage.content, provider, apiKey)
    console.log("[Intent Detection] Result:", JSON.stringify(intentResult))

    // Handle tool-based intents
    if (intentResult.intent === "calendar_event" && intentResult.tool === "create_calendar_event") {
      if (!googleAccessToken) {
        return NextResponse.json({
          success: false,
          error: "Google access token required for calendar operations. Please connect your Google account.",
          intent: intentResult
        }, { status: 400 })
      }

      console.log("[Tool Agent] Processing calendar event intent")
      
      // Parse natural language date
      const dateResult = parseNaturalDate(lastMessage.content)
      if (!dateResult) {
        return NextResponse.json({
          success: false,
          error: "Could not parse date/time. Please specify a clear date and time (e.g., 'tomorrow at 2 PM', 'next Monday at 10 AM').",
          intent: intentResult
        }, { status: 400 })
      }

      const calendarParams = {
        summary: intentResult.parameters?.title || "Meeting",
        description: intentResult.parameters?.description || "",
        startDateTime: dateResult.start.toISOString(),
        endDateTime: dateResult.end.toISOString()
      }

      console.log("[Tool Agent] Calendar parameters:", JSON.stringify(calendarParams))
      console.log("[Tool Agent] Executing create_calendar_event tool")

      const toolResult = await executeToolCall("create_calendar_event", calendarParams, googleAccessToken)
      console.log("[Tool Agent] Tool execution result:", toolResult)

      return NextResponse.json({
        success: true,
        response: toolResult,
        intent: intentResult,
        toolExecuted: true,
        toolResult: toolResult
      })
    }

    if (intentResult.intent === "send_email" && intentResult.tool === "send_email") {
      if (!googleAccessToken) {
        return NextResponse.json({
          success: false,
          error: "Google access token required for email operations. Please connect your Google account.",
          intent: intentResult
        }, { status: 400 })
      }

      console.log("[Tool Agent] Processing send email intent")

      const emailParams = {
        to: intentResult.parameters?.to,
        subject: intentResult.parameters?.subject || "No Subject",
        body: intentResult.parameters?.body || ""
      }

      if (!emailParams.to) {
        return NextResponse.json({
          success: false,
          error: "Recipient email address is required.",
          intent: intentResult
        }, { status: 400 })
      }

      console.log("[Tool Agent] Email parameters:", JSON.stringify({ ...emailParams, body: emailParams.body.substring(0, 50) + "..." }))
      console.log("[Tool Agent] Executing send_email tool")

      const toolResult = await executeToolCall("send_email", emailParams, googleAccessToken)
      console.log("[Tool Agent] Tool execution result:", toolResult)

      return NextResponse.json({
        success: true,
        response: toolResult,
        intent: intentResult,
        toolExecuted: true,
        toolResult: toolResult
      })
    }

    // Handle general chat - use existing LLM flow with tool calling enabled
    console.log("[LLM API] Processing as general chat")
    
    // Enable tools if Google access token is available
    const enableTools = !!googleAccessToken
    console.log("[LLM API] Tool calling enabled:", enableTools)

    let result: { content: string; toolCalls?: any[] } = { content: "" }
    let currentMessages = [...messages]

    // Handle tool calling loop
    let maxIterations = 5
    let iteration = 0

    while (iteration < maxIterations) {
      iteration++
      console.log("[LLM API] LLM call iteration:", iteration)

      switch (provider) {
        case "oxlo":
          result = await callOxloAPI(currentMessages, apiKey, enableTools)
          break
        case "groq":
          result = await callGroqAPI(currentMessages, apiKey, enableTools)
          break
        case "gemini":
          result = await callGeminiAPI(currentMessages, apiKey, enableTools)
          break
        default:
          return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 })
      }

      // If no tool calls, return the response
      if (!result.toolCalls || result.toolCalls.length === 0) {
        console.log("[LLM API] No tool calls, returning response")
        break
      }

      console.log("[LLM API] Tool calls detected:", result.toolCalls.length)

      // Add assistant message with tool calls
      currentMessages.push({
        role: "assistant",
        content: result.content
      })

      // Execute each tool call
      for (const toolCall of result.toolCalls) {
        let toolName: string
        let toolArgs: any

        // Handle different provider formats
        if (provider === "gemini") {
          toolName = toolCall.functionCall.name
          toolArgs = toolCall.functionCall.args
        } else {
          toolName = toolCall.function.name
          toolArgs = JSON.parse(toolCall.function.arguments)
        }

        console.log("[LLM API] Executing tool:", toolName)
        const toolResult = await executeToolCall(toolName, toolArgs, googleAccessToken || "")

        // Add tool result message
        currentMessages.push({
          role: "assistant",
          content: result.content
        })

        currentMessages.push({
          role: "user",
          content: `Tool result: ${toolResult}`
        })
      }
    }

    console.log("[LLM API] Response generated successfully")

    return NextResponse.json({
      success: true,
      response: result.content,
      provider: provider,
      intent: intentResult,
      toolCallsExecuted: iteration > 1
    })

  } catch (error: any) {
    console.error("[LLM API] Error processing request:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to process chat request",
      details: error.toString()
    }, { status: 500 })
  }
}
