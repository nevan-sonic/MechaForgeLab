"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Bot, Play, ShieldAlert, Terminal } from "lucide-react"
import type { Message } from "@/types"
import { simulateAgentResponse } from "@/lib/mock-api"
import type { AgentProjectConfig } from "@/types/agent-config"
import { codeGenerator } from "@/lib/code-generator"
import { getApiKey, getProvider } from "@/lib/api-key"
import { fetchAgentConfig } from "@/lib/agent-api"

interface ChatMessage extends Message {
  logs?: {
    stdout: string
    stderr: string
  }
  isError?: boolean
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return ""
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || ""
  return ""
}

export function AgentChat() {
  const [agentName, setAgentName] = useState("AI Agent")
  const [agentDesc, setAgentDesc] = useState("Test your AI agent")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatMode, setChatMode] = useState<"simulated" | "live">("simulated")
  const [runStatus, setRunStatus] = useState("Thinking...")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadAgent = async () => {
      try {
        const parsed = await fetchAgentConfig()
        if (parsed) {
          const mainAgentName = parsed.main_agent
          const mainAgent = parsed.agents[mainAgentName]
          if (mainAgent) {
            const cleanName = mainAgent.name
              .split("_")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")
            setAgentName(cleanName)
            setAgentDesc(mainAgent.description || "Test your AI agent")
            
            const welcome = `Hello! I'm your newly created ${cleanName}. ${mainAgent.description || "How can I assist you today?"}`
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content: welcome,
                timestamp: new Date(),
              }
            ])
            return
          }
        }
      } catch (e) {
        console.error(e)
      }

      // Fallback welcome message
      const fallbackWelcome = "Hello! I'm your newly created AI agent. How can I assist you today?"
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: fallbackWelcome,
          timestamp: new Date(),
        }
      ])
    }

    loadAgent()
    
    // React to dynamic config creations and updates
    window.addEventListener("mechaforge_config_updated", loadAgent)
    return () => {
      window.removeEventListener("mechaforge_config_updated", loadAgent)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    if (chatMode === "live") {
      setRunStatus("Initializing local environment...")
      try {
        const config = await fetchAgentConfig()
        if (!config || !config.main_agent) {
          throw new Error("No agent configuration found. Please build an agent first.")
        }

        // Exposing credentials
        const activeProvider = getProvider()
        const geminiApiKey = getApiKey("gemini")
        const groqApiKey = getApiKey("groq")
        const oxloApiKey = getApiKey("oxlo")
        const googleAccessToken = getCookie("google_access_token")

        // Auto-select/respect execution provider
        let executionProvider = activeProvider
        let activeKey = getApiKey(executionProvider)

        if (!activeKey) {
          if (oxloApiKey) {
            executionProvider = "oxlo"
            activeKey = oxloApiKey
          } else if (groqApiKey) {
            executionProvider = "groq"
            activeKey = groqApiKey
          } else if (geminiApiKey) {
            executionProvider = "gemini"
            activeKey = geminiApiKey
          }
        }

        if (!activeKey) {
          throw new Error("No API key available. Click the key icon in the top header and save your Oxlo, Groq, or Gemini API Key to enable local agent reasoning.")
        }

        setRunStatus(`Launching agent in Python runtime using ${executionProvider.toUpperCase()}...`)
        
        const res = await fetch("/api/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userMessage.content,
            history: messages,
            files: {
              "agent.py": codeGenerator.generateAgentFile(config),
              "requirements.txt": codeGenerator.generateRequirementsFile(config)
            },
            env: {
              LLM_PROVIDER: executionProvider,
              API_KEY: activeKey,
              GEMINI_API_KEY: geminiApiKey,
              GROQ_API_KEY: groqApiKey,
              OXLO_API_KEY: oxloApiKey,
              GOOGLE_ACCESS_TOKEN: googleAccessToken
            }
          })
        })

        const data = await res.json()

        if (res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: data.output || "Agent completed run without returning any text output.",
              logs: data.logs,
              timestamp: new Date(),
            }
          ])
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: `Execution Error: ${data.error || "An error occurred during local Python execution."}`,
              isError: true,
              logs: data.details ? { stdout: "", stderr: data.details } : undefined,
              timestamp: new Date(),
            }
          ])
        }
      } catch (error: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Error: ${error.message}`,
            isError: true,
            timestamp: new Date(),
          }
        ])
      } finally {
        setIsLoading(false)
      }
    } else {
      setRunStatus("Thinking...")
      try {
        const response = await simulateAgentResponse(userMessage.content)
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: response,
            timestamp: new Date(),
          },
        ])
      } catch (error: any) {
        console.error("Error getting agent response:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header with Mode Toggle */}
      <div className="p-4 border-b border-slate-200 bg-white flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{agentName}</h3>
            <p className="text-xs text-slate-500 max-w-[200px] truncate">{agentDesc}</p>
          </div>
        </div>

        {/* Live Execution Mode Switcher */}
        <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
          <button
            onClick={() => setChatMode("simulated")}
            className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all duration-200 ${
              chatMode === "simulated"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Simulated Chat
          </button>
          <button
            onClick={() => setChatMode("live")}
            className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all duration-200 flex items-center gap-1 ${
              chatMode === "live"
                ? "bg-green-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
            title="Execute agent locally on your machine with active APIs"
          >
            <Play className="w-2.5 h-2.5" />
            Live (Python)
          </button>
        </div>
      </div>

      {/* Mode Warning Header */}
      {chatMode === "live" && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-[11px] text-amber-800">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>
            Executing Python code locally. Actions (Gmail, Calendar) will be executed on your real account.
          </span>
        </div>
      )}

      {/* Messages - scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 animate-slide-in ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : message.isError
                  ? "bg-red-50 text-red-800 rounded-bl-sm border border-red-200"
                  : "bg-white text-slate-800 rounded-bl-sm border border-slate-200"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>

              {/* Execution Logs Drawer */}
              {message.logs && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
                  <details className="group cursor-pointer">
                    <summary className="text-blue-600 hover:text-blue-800 font-semibold select-none flex items-center gap-1">
                      <Terminal className="w-3 h-3" />
                      <span>View Live Execution Logs</span>
                    </summary>
                    <div className="mt-2 bg-slate-900 text-slate-200 font-mono p-2.5 rounded text-[10px] whitespace-pre-wrap max-h-48 overflow-y-auto leading-normal">
                      {message.logs.stdout && (
                        <div>
                          <span className="text-emerald-400 font-bold">[stdout]</span>
                          <br />
                          {message.logs.stdout}
                        </div>
                      )}
                      {message.logs.stderr && (
                        <div className="mt-2 border-t border-slate-800 pt-2">
                          <span className="text-rose-400 font-bold">[stderr]</span>
                          <br />
                          {message.logs.stderr}
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </div>
            {message.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-slate-400 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">U</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 animate-slide-in">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white text-slate-800 p-3 rounded-lg rounded-bl-sm text-sm border border-slate-200 max-w-[85%]">
              <div className="flex items-center gap-1 mb-1.5">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 italic leading-snug">{runStatus}</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - fixed at bottom */}
      <div className="p-4 border-t border-slate-200 bg-white flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chatMode === "live" ? "Live Execute your agent..." : "Test your agent..."}
            className="flex-1 min-h-[40px] max-h-[120px] bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 resize-none text-sm"
            rows={1}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isLoading}
            className="bg-green-600 hover:bg-green-700 text-white self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
