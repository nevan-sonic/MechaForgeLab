"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Zap, Calendar, Mail, Check, AlertCircle, ArrowLeft, Key } from "lucide-react"
import Link from "next/link"

function getCookie(name: string): string {
  if (typeof document === "undefined") return ""
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || ""
  return ""
}

export default function AuthSuccessPage() {
  const [accessToken, setAccessToken] = useState("")
  const [refreshToken, setRefreshToken] = useState("")
  
  // Gmail Test Form States
  const [emailTo, setEmailTo] = useState("")
  const [emailSubject, setEmailSubject] = useState("Hello from MechaForge Lab!")
  const [emailBody, setEmailBody] = useState("This is an OAuth Gmail API test email. Integration completed successfully.")
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [emailMessage, setEmailMessage] = useState("")

  // Calendar Test Form States
  const [eventSummary, setEventSummary] = useState("OAuth Project Sync")
  const [eventDesc, setEventDesc] = useState("Reviewing Google Calendar API live event scheduling.")
  const [eventStart, setEventStart] = useState("")
  const [eventEnd, setEventEnd] = useState("")
  const [calendarStatus, setCalendarStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [calendarMessage, setCalendarMessage] = useState("")

  useEffect(() => {
    setAccessToken(getCookie("google_access_token"))
    setRefreshToken(getCookie("google_refresh_token"))
    
    // Set default event times (today + 1 hour to today + 2 hours)
    const now = new Date()
    const startStr = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16)
    const endStr = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)
    setEventStart(startStr)
    setEventEnd(endStr)
  }, [])

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailTo) return
    setEmailStatus("sending")
    setEmailMessage("")

    try {
      const res = await fetch("/api/google/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailTo, subject: emailSubject, body: emailBody }),
      })
      const data = await res.json()
      if (res.ok) {
        setEmailStatus("success")
        setEmailMessage(`Email sent successfully! Message ID: ${data.messageId}`)
      } else {
        setEmailStatus("error")
        setEmailMessage(data.error || "Failed to send email")
      }
    } catch (err: any) {
      setEmailStatus("error")
      setEmailMessage(err.message)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventSummary || !eventStart || !eventEnd) return
    setCalendarStatus("sending")
    setCalendarMessage("")

    try {
      const res = await fetch("/api/google/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: eventSummary,
          description: eventDesc,
          startDateTime: new Date(eventStart).toISOString(),
          endDateTime: new Date(eventEnd).toISOString(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setCalendarStatus("success")
        setCalendarMessage(data.eventLink)
      } else {
        setCalendarStatus("error")
        setCalendarMessage(data.error || "Failed to create event")
      }
    } catch (err: any) {
      setCalendarStatus("error")
      setCalendarMessage(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex items-center justify-center">
      <div className="max-w-5xl w-full space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Google OAuth Integration Panel</h1>
              <p className="text-xs text-slate-400">OAuth verification & live testing dashboard</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Builder
            </Button>
          </Link>
        </div>

        {/* Tokens Overview Card */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" />
              Active OAuth Tokens
            </CardTitle>
            <CardDescription className="text-slate-400">
              Successfully exchanged from authorization code. These tokens authorize Gmail and Google Calendar access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">ACCESS TOKEN (Expires in 1hr)</label>
              <div className="bg-slate-950 px-3 py-2 rounded border border-slate-800 font-mono text-xs break-all text-blue-400 select-all">
                {accessToken || "Not Loaded (Expired or missing)"}
              </div>
            </div>
            {refreshToken && (
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">REFRESH TOKEN (Persistent offline access)</label>
                <div className="bg-slate-950 px-3 py-2 rounded border border-slate-800 font-mono text-xs break-all text-purple-400 select-all">
                  {refreshToken}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Integration Testers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gmail Send Tester */}
          <Card className="bg-slate-900 border-slate-800 flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-red-400" />
                  Test Gmail sending API
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Sends an email in realtime utilizing Google's Gmail API endpoint.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendEmail} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">To (Recipient Email)</label>
                    <Input
                      type="email"
                      required
                      placeholder="target@example.com"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-sm focus-visible:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Subject</label>
                    <Input
                      required
                      placeholder="Subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-sm focus-visible:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Body</label>
                    <Textarea
                      required
                      rows={3}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-sm focus-visible:ring-blue-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={emailStatus === "sending" || !accessToken}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium text-sm py-2 rounded"
                  >
                    {emailStatus === "sending" ? "Sending email..." : "Send Test Email"}
                  </Button>
                </form>
              </CardContent>
            </div>
            
            {/* Status alerts */}
            {emailStatus !== "idle" && (
              <div className="p-4 border-t border-slate-800 bg-slate-950/50 rounded-b-lg">
                {emailStatus === "success" && (
                  <div className="flex gap-2 text-green-400 text-sm">
                    <Check className="w-5 h-5 flex-shrink-0" />
                    <span>{emailMessage}</span>
                  </div>
                )}
                {emailStatus === "error" && (
                  <div className="flex gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{emailMessage}</span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Calendar Event Creator Tester */}
          <Card className="bg-slate-900 border-slate-800 flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-400" />
                  Test Google Calendar API
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Creates an event in your primary Google Calendar in realtime.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateEvent} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Event Title</label>
                    <Input
                      required
                      placeholder="Sync Session"
                      value={eventSummary}
                      onChange={(e) => setEventSummary(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-sm focus-visible:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Description</label>
                    <Input
                      placeholder="Details"
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-sm focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Start Time</label>
                      <Input
                        type="datetime-local"
                        required
                        value={eventStart}
                        onChange={(e) => setEventStart(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-sm focus-visible:ring-blue-500 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">End Time</label>
                      <Input
                        type="datetime-local"
                        required
                        value={eventEnd}
                        onChange={(e) => setEventEnd(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-sm focus-visible:ring-blue-500 text-slate-200"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={calendarStatus === "sending" || !accessToken}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium text-sm py-2 rounded"
                  >
                    {calendarStatus === "sending" ? "Creating event..." : "Create Calendar Event"}
                  </Button>
                </form>
              </CardContent>
            </div>

            {/* Status alerts */}
            {calendarStatus !== "idle" && (
              <div className="p-4 border-t border-slate-800 bg-slate-950/50 rounded-b-lg">
                {calendarStatus === "success" && (
                  <div className="flex gap-2 text-green-400 text-sm items-center">
                    <Check className="w-5 h-5 flex-shrink-0" />
                    <div>
                      Event created!{" "}
                      <a
                        href={calendarMessage}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-blue-400 font-semibold"
                      >
                        View Calendar Event
                      </a>
                    </div>
                  </div>
                )}
                {calendarStatus === "error" && (
                  <div className="flex gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{calendarMessage}</span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
