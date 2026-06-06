"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, Zap, Key, Check } from "lucide-react"
import { mockPrompts } from "@/lib/mock-api"
import type { PromptSuggestion } from "@/types"
import { getApiKey, setApiKey, getProvider, setProvider, Provider } from "@/lib/api-key"

interface LandingPageProps {
  onSubmit: (message: string) => void
}

export function LandingPage({ onSubmit }: LandingPageProps) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 relative">
      {/* Settings Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white"
        >
          <Key className="w-4 h-4 mr-2" />
          Settings
        </Button>

        {showKeyInput && (
          <div className="absolute right-0 mt-2 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-xl flex flex-col gap-3 w-80 z-50">
            <h4 className="text-xs font-semibold text-slate-200 border-b border-slate-700 pb-1">API Provider Settings</h4>
            
            <div className="space-y-3">
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] text-slate-400 font-semibold tracking-wide">ACTIVE LLM PROVIDER:</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-0.5 rounded border border-slate-700">
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
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] text-slate-400 font-semibold tracking-wide">GROQ KEY:</span>
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] text-slate-400 font-semibold tracking-wide">GEMINI KEY (Google ADK / Actions):</span>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy... (Required for local actions)"
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="border-t border-slate-700/50 pt-2 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide text-left">GOOGLE INTEGRATION:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = "/auth/google"}
                className="bg-slate-950 border-slate-700 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-semibold h-8 w-full"
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
          </div>
        )}
      </div>

      <div className="w-full max-w-4xl mx-auto animate-fade-in">
        {/* Brand Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">MechaForge Lab</h1>
              <Badge
                variant="secondary"
                className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-2 py-0.5 text-xs"
              >
                Beta
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Build AI agents with ease</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Create intelligent AI agents for your business needs. Define their personality, knowledge, and capabilities
            through simple conversation.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the AI agent you want to build..."
              className="min-h-[120px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 resize-none pr-12 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim()}
              className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Prompt Suggestions */}
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3">
            {mockPrompts.map((prompt, index) => (
              <button
                key={prompt.id}
                onClick={() => handlePromptClick(prompt)}
                className="group px-4 py-2 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 rounded-full text-sm text-slate-300 hover:text-white transition-all duration-200 animate-slide-in whitespace-nowrap"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {prompt.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
