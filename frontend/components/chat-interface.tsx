"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Zap, Key, Check } from "lucide-react"
import type { Message } from "@/types"
import { simulateAIResponse } from "@/lib/mock-api"
import { getApiKey, setApiKey, getProvider, setProvider, Provider } from "@/lib/api-key"

interface ChatInterfaceProps {
  initialMessage: string
  onFirstResponse: () => void
}

export function ChatInterface({ initialMessage, onFirstResponse }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "user",
      content: initialMessage,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [provider, setProviderVal] = useState<Provider>("oxlo")
  const [geminiKey, setGeminiKey] = useState("")
  const [groqKey, setGroqKey] = useState("")
  const [oxloKey, setOxloKey] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Simulate initial AI response
    const handleInitialResponse = async () => {
      const response = await simulateAIResponse(initialMessage)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        },
      ])
      setIsLoading(false)
      onFirstResponse()
    }

    handleInitialResponse()
  }, [initialMessage, onFirstResponse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Pass conversation history to preserve context
      const conversationHistory = messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }))
      
      const response = await simulateAIResponse(input, conversationHistory)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error("Error getting AI response:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">MechaForge Lab</h3>
            <p className="text-xs text-slate-400">AI Agent Builder</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="text-slate-400 hover:text-white"
        >
          <Key className="w-4 h-4" />
        </Button>
      </div>

      {showKeyInput && (
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-slate-200 border-b border-slate-700/50 pb-1">API Provider Settings</h4>
          
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 animate-slide-in ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-slate-800 text-slate-200 rounded-bl-sm"
              }`}
            >
              {message.content}
            </div>
            {message.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-slate-500 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">U</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 animate-slide-in">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-800 text-slate-200 p-3 rounded-lg rounded-bl-sm text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Continue building your agent..."
            className="flex-1 min-h-[40px] max-h-[120px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none text-sm"
            rows={1}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

