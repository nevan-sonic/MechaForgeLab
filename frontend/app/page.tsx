"use client"

import { useState, useEffect } from "react"
import { LandingPage } from "@/components/landing-page"
import { ChatInterface } from "@/components/chat-interface"
import { AppPreview } from "@/components/app-preview"
import { SignUp } from "@/components/sign-up"
import { DemoPage } from "@/components/demo-page"

export default function Home() {
  const [currentView, setCurrentView] = useState<"auth" | "demo" | "landing" | "chat">("auth")
  const [initialMessage, setInitialMessage] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Clean up any stale keys from previous versions
    localStorage.removeItem("mechaforge_user_auth")
    localStorage.removeItem("mechaforge_seen_demo")
    localStorage.removeItem("mechaforge_user_auth_v2")
    localStorage.removeItem("mechaforge_seen_demo_v2")

    const isAuth = localStorage.getItem("mechaforge_auth_v3") === "true"
    const hasSeenDemo = localStorage.getItem("mechaforge_demo_v3") === "true"

    if (isAuth) {
      if (hasSeenDemo) {
        setCurrentView("landing")
      } else {
        setCurrentView("demo")
      }
    } else {
      setCurrentView("auth")
    }
  }, [])

  const handleSignUpComplete = () => {
    localStorage.setItem("mechaforge_auth_v3", "true")
    setCurrentView("demo")
  }

  const handleDemoComplete = () => {
    localStorage.setItem("mechaforge_demo_v3", "true")
    setCurrentView("landing")
  }

  const handleSignOut = () => {
    localStorage.removeItem("mechaforge_auth_v3")
    localStorage.removeItem("mechaforge_demo_v3")
    setCurrentView("auth")
  }

  const handleLandingSubmit = (message: string) => {
    setInitialMessage(message)
    setCurrentView("chat")
  }

  const handleFirstResponse = () => {
    setShowPreview(true)
  }

  // Prevent server-client rendering mismatches (hydration errors)
  if (!isMounted) {
    return <div className="min-h-screen bg-slate-950" />
  }

  if (currentView === "auth") {
    return <SignUp onSignUp={handleSignUpComplete} />
  }

  if (currentView === "demo") {
    return <DemoPage onGetStarted={handleDemoComplete} onSignOut={handleSignOut} />
  }

  if (currentView === "landing") {
    return <LandingPage onSubmit={handleLandingSubmit} onSignOut={handleSignOut} />
  }

  return (
    <div className="h-screen flex bg-slate-900">
      {/* Chat Panel - 2/5 width */}
      <div className="w-2/6 border-r border-slate-800 animate-slide-in">
        <ChatInterface initialMessage={initialMessage} onFirstResponse={handleFirstResponse} />
      </div>

      {/* Preview Panel - 3/5 width */}
      <div className="w-4/5 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <AppPreview isVisible={showPreview} />
      </div>
    </div>
  )
}

