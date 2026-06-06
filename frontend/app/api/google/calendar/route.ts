import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("google_access_token")?.value
  if (!accessToken) {
    return NextResponse.json({ error: "Google Access Token is missing or has expired. Please log in again." }, { status: 401 })
  }

  try {
    const { summary, description, startDateTime, endDateTime } = await request.json()
    if (!summary || !startDateTime || !endDateTime) {
      return NextResponse.json({ error: "Missing required fields (summary, startDateTime, endDateTime)" }, { status: 400 })
    }

    // Call Google Calendar API REST endpoint to insert calendar event
    const calendarResponse = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        summary,
        description,
        start: {
          dateTime: startDateTime,
          timeZone: "UTC"
        },
        end: {
          dateTime: endDateTime,
          timeZone: "UTC"
        }
      })
    })

    const data = await calendarResponse.json()
    if (!calendarResponse.ok) {
      return NextResponse.json({ error: "Calendar API Error", details: data }, { status: calendarResponse.status })
    }

    return NextResponse.json({ success: true, eventLink: data.htmlLink })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
