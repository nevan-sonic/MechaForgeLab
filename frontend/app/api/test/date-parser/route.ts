import { NextRequest, NextResponse } from "next/server"

// Import the parseNaturalDate function
const parseNaturalDate = (dateStr: string): { start: Date; end: Date } | null => {
  console.log("[Date Parser] Input:", dateStr)
  
  const now = new Date()
  const lowerStr = dateStr.toLowerCase()
  
  // Handle "today"
  if (lowerStr.includes("today")) {
    const today = new Date(now)
    
    const timeMatch = dateStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
    if (timeMatch) {
      let hours = parseInt(timeMatch[1])
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      const meridiem = timeMatch[3]?.toLowerCase()
      
      if (meridiem === "pm" && hours < 12) hours += 12
      if (meridiem === "am" && hours === 12) hours = 0
      
      today.setHours(hours, minutes, 0, 0)
    } else {
      today.setHours(9, 0, 0, 0)
    }
    
    const end = new Date(today)
    end.setHours(end.getHours() + 1)
    
    console.log("[Date Parser] Parsed 'today':", today.toISOString())
    return { start: today, end }
  }
  
  // Handle "tomorrow"
  if (lowerStr.includes("tomorrow")) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const timeMatch = dateStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
    if (timeMatch) {
      let hours = parseInt(timeMatch[1])
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      const meridiem = timeMatch[3]?.toLowerCase()
      
      if (meridiem === "pm" && hours < 12) hours += 12
      if (meridiem === "am" && hours === 12) hours = 0
      
      tomorrow.setHours(hours, minutes, 0, 0)
    } else {
      tomorrow.setHours(9, 0, 0, 0)
    }
    
    const end = new Date(tomorrow)
    end.setHours(end.getHours() + 1)
    
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
    end.setMinutes(end.getMinutes() + 30)
    
    console.log("[Date Parser] Parsed 'in X minutes':", start.toISOString())
    return { start, end }
  }
  
  // Handle ISO date format
  const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2})(?::(\d{2}))?)?/)
  if (isoMatch) {
    const year = parseInt(isoMatch[1])
    const month = parseInt(isoMatch[2]) - 1
    const day = parseInt(isoMatch[3])
    const hours = isoMatch[4] ? parseInt(isoMatch[4]) : 9
    const minutes = isoMatch[5] ? parseInt(isoMatch[5]) : 0
    
    const start = new Date(year, month, day, hours, minutes, 0, 0)
    const end = new Date(start)
    end.setHours(end.getHours() + 1)
    
    console.log("[Date Parser] Parsed ISO format:", start.toISOString())
    return { start, end }
  }
  
  // Handle "Month Day at time"
  const monthDayMatch = dateStr.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/i)
  if (monthDayMatch) {
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
    const month = months.indexOf(monthDayMatch[1].toLowerCase())
    const day = parseInt(monthDayMatch[2])
    
    const targetDate = new Date(now.getFullYear(), month, day)
    
    if (targetDate < now) {
      targetDate.setFullYear(targetDate.getFullYear() + 1)
    }
    
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
  
  // Handle "[day] at [time]"
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

export async function POST(request: NextRequest) {
  try {
    const { testCases } = await request.json()

    if (!testCases || !Array.isArray(testCases)) {
      return NextResponse.json({ error: "testCases array is required" }, { status: 400 })
    }

    const results = testCases.map((testCase: string) => {
      const result = parseNaturalDate(testCase)
      return {
        input: testCase,
        success: result !== null,
        result: result ? {
          start: result.start.toISOString(),
          end: result.end.toISOString()
        } : null
      }
    })

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    console.error("[Date Parser Test] Exception:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const defaultTestCases = [
    "today at 9 AM",
    "today at 5 PM",
    "tomorrow at 10 AM",
    "next Monday at 2 PM",
    "Friday at 3 PM",
    "in 2 hours",
    "in 30 minutes",
    "2026-06-07 14:00",
    "June 10 at 5 PM"
  ]

  const results = defaultTestCases.map((testCase) => {
    const result = parseNaturalDate(testCase)
    return {
      input: testCase,
      success: result !== null,
      result: result ? {
        start: result.start.toISOString(),
        end: result.end.toISOString()
      } : null
    }
  })

  return NextResponse.json({
    success: true,
    results
  })
}
