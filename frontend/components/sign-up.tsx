"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Mail, Lock, User, Loader2, Sparkles, Key, CheckCircle } from "lucide-react"

interface SignUpProps {
  onSignUp: () => void
}

export function SignUp({ onSignUp }: SignUpProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState("")

  const demoEmail = "demo@mechaforge.com"
  const demoPassword = "password123"

  const handleAutofillDemo = () => {
    setName("Demo Engineer")
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Please enter your name.")
      return
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    triggerLoadingSequence()
  }

  const triggerLoadingSequence = () => {
    setIsLoading(true)
    setLoadingStep(1) // Initializing

    // Simulate different steps of creating/forging environment
    setTimeout(() => {
      setLoadingStep(2) // Allocating resources
    }, 800)

    setTimeout(() => {
      setLoadingStep(3) // Finalizing workspace
    }, 1600)

    setTimeout(() => {
      setIsLoading(false)
      onSignUp()
    }, 2400)
  }

  const handleQuickDemoSubmit = () => {
    handleAutofillDemo()
    setIsLoading(true)
    setLoadingStep(1)
    setTimeout(() => {
      setLoadingStep(2)
    }, 700)
    setTimeout(() => {
      setLoadingStep(3)
    }, 1400)
    setTimeout(() => {
      setIsLoading(false)
      onSignUp()
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-modern">
      {/* Decorative background grid and glowing circles */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70" />
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: "1s" }} />

      <div className="w-full max-w-md relative z-10 animate-slide-in">
        {/* Glow Border Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 backdrop-blur-xl shadow-2xl relative">
          <CardHeader className="space-y-2 text-center pb-2">
            <div className="flex justify-center items-center gap-2.5 mb-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                MechaForge Lab
              </span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Create your account</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Forge high-performance autonomous AI agents in minutes
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 pt-4">
            {/* Demo Credentials Alert Banner */}
            <div className="bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 transition-colors p-3.5 rounded-lg flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                <Key className="w-3.5 h-3.5" />
                <span>Demo Credentials Available</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded border border-slate-800/80">
                <div>
                  <span className="text-slate-500">Email:</span> {demoEmail}
                </div>
                <div>
                  <span className="text-slate-500">Pass:</span> {demoPassword}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleQuickDemoSubmit}
                disabled={isLoading}
                className="w-full bg-blue-600/10 border-blue-500/20 hover:bg-blue-600/20 text-blue-300 hover:text-white transition-all text-xs h-8 font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                One-Click Demo Access
              </Button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase tracking-widest">Or Sign Up</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium text-slate-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="pl-9 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 h-10 text-xs rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-slate-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-9 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 h-10 text-xs rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-slate-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-9 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 h-10 text-xs rounded-lg"
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 bg-red-950/40 border border-red-900/50 text-red-400 rounded-lg text-xs font-medium text-center animate-fade-in">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold transition-all shadow-md shadow-blue-500/10 h-10 rounded-lg text-xs mt-4"
              >
                Sign Up & Launch
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-800/50 mt-4 py-3">
            <span className="text-[11px] text-slate-500">
              Already have an account?{" "}
              <button 
                onClick={handleAutofillDemo} 
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline"
              >
                Sign in
              </button>
            </span>
          </CardFooter>
        </Card>
      </div>

      {/* Full screen loading animation overlay for a premium transition */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-950/95 flex flex-col items-center justify-center z-50 animate-fade-in font-modern">
          <div className="relative flex items-center justify-center w-24 h-24 mb-6">
            {/* Spinning gradient ring */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-purple-500 animate-spin" style={{ animationDuration: "1s" }} />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-indigo-500 border-l-pink-500 animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
            <Zap className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>

          <div className="text-center space-y-2 max-w-xs">
            <h3 className="text-lg font-bold text-white tracking-wider flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Forging Lab...</span>
            </h3>
            
            {/* Progress status indicators */}
            <p className="text-xs text-slate-400 h-4 font-medium transition-all duration-300">
              {loadingStep === 1 && "Connecting to MechaForge core engine..."}
              {loadingStep === 2 && "Instantiating model connectors..."}
              {loadingStep === 3 && "Configuring your developer dashboard..."}
            </p>

            {/* Micro visual progress line */}
            <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto mt-2">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-700" 
                style={{ width: `${(loadingStep / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
