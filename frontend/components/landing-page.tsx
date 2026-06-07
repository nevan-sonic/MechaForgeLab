"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Send, Zap, Key, Check, MessageSquare, Globe, Layers, Terminal, Settings, Sparkles 
} from "lucide-react"
import { mockPrompts } from "@/lib/mock-api"
import type { PromptSuggestion } from "@/types"
import { getApiKey, setApiKey, getProvider, setProvider, Provider } from "@/lib/api-key"

interface LandingPageProps {
  onSubmit: (message: string) => void
  onSignOut: () => void
}

const getPromptIcon = (title: string) => {
  const lower = title.toLowerCase()
  if (lower.includes("support")) return <MessageSquare className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
  if (lower.includes("research")) return <Globe className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
  if (lower.includes("sequential") || lower.includes("document")) return <Layers className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
  return <Terminal className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
}

export function LandingPage({ onSubmit, onSignOut }: LandingPageProps) {
  const [input, setInput] = useState("")
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [provider, setProviderVal] = useState<Provider>("oxlo")
  const [geminiKey, setGeminiKey] = useState("")
  const [groqKey, setGroqKey] = useState("")
  const [oxloKey, setOxloKey] = useState("")

  useEffect(() => {
    setProviderVal(getProvider())
    setGeminiKey(getApiKey("gemini"))
    setGroqKey(getApiKey("groq"))
    setOxloKey(getApiKey("oxlo"))
  }, [showKeyInput])

  const handleSaveAllKeys = () => {
    setProvider(provider)
    setApiKey("gemini", geminiKey)
    setApiKey("groq", groqKey)
    setApiKey("oxlo", oxloKey)
    setShowKeyInput(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSubmit(input.trim())
    }
  }

  const handlePromptClick = (prompt: PromptSuggestion) => {
    setInput(prompt.title)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-modern">
      {/* Decorative background grid and glowing circles */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50 pointer-events-none" />
      
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: "1.5s" }} />

      {/* Sleek Top Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 z-40 bg-transparent py-4 px-6 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-base bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            MechaForge Lab
          </span>
        </div>

        <div className="flex items-center gap-2 relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="bg-slate-900/50 border-slate-800 hover:bg-slate-850 text-slate-300 hover:text-white text-xs h-9 rounded-lg flex items-center gap-2 backdrop-blur-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </Button>

          {showKeyInput && (
            <div className="absolute right-0 top-10 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col gap-3.5 w-80 z-50 backdrop-blur-xl">
              <h4 className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                <span>API Settings</span>
              </h4>
              
              <div className="space-y-3">
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wide">ACTIVE LLM PROVIDER:</span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setProviderVal("oxlo")}
                      className={`px-2 py-1 text-[10px] font-semibold rounded transition-all duration-200 ${
                        provider === "oxlo" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Oxlo
                    </button>
                    <button
                      type="button"
                      onClick={() => setProviderVal("groq")}
                      className={`px-2 py-1 text-[10px] font-semibold rounded transition-all duration-200 ${
                        provider === "groq" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Groq
                    </button>
                    <button
                      type="button"
                      onClick={() => setProviderVal("gemini")}
                      className={`px-2 py-1 text-[10px] font-semibold rounded transition-all duration-200 ${
                        provider === "gemini" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Gemini
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wide">OXLO KEY:</span>
                  <input
                    type="password"
                    value={oxloKey}
                    onChange={(e) => setOxloKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wide">GROQ KEY:</span>
                  <input
                    type="password"
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wide">GEMINI KEY:</span>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy... (Google API Key)"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-2.5 flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 font-semibold tracking-wide text-left">GOOGLE INTEGRATION:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.href = "/auth/google"}
                  className="bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-200 hover:text-white text-[11px] font-semibold h-8 w-full"
                >
                  🔐 Connect Google Account
                </Button>
              </div>

              <Button
                size="sm"
                onClick={handleSaveAllKeys}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full text-xs font-semibold h-8 mt-1"
              >
                Save Keys
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={onSignOut}
                className="bg-red-950/20 border-red-900/30 hover:bg-red-900/20 text-red-400 hover:text-red-300 w-full text-xs font-semibold h-8 mt-1"
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-3xl mx-auto relative z-10 space-y-12 animate-fade-in">
        
        {/* Central Hero text */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/25 rounded-full text-blue-400 text-xs font-semibold select-none">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Developer Workspace Dashboard</span>
          </div>

          <h2 className="inline-block pb-3 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(15,23,42,0.45)]">
            Build AI Agents with Ease
          </h2>
          <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Describe the agent's personality, memory constraints, and tools you need. We'll automatically package them into an execution graph.
          </p>
        </div>

        {/* Input prompt area */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
          <div className="relative rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 focus-within:border-blue-500/80 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300 shadow-2xl p-2.5 backdrop-blur-md">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the AI agent you want to build..."
              className="min-h-[110px] bg-transparent border-0 text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-xs w-full pr-14 leading-relaxed"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim()}
              className="absolute bottom-3 right-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-md shadow-blue-500/10 transition-all duration-200 rounded-xl w-10 h-10 flex items-center justify-center p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Dynamic Interactive Suggestions */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3">
            {mockPrompts.map((prompt, index) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                className="group px-4 py-2.5 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl text-xs text-slate-300 hover:text-white transition-all duration-200 shadow-lg flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {getPromptIcon(prompt.title)}
                <span className="font-medium">{prompt.title}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
