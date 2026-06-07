"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Zap, Bot, Cpu, Wrench, Play, ArrowRight, ChevronDown, 
  Layers, Lock, Sparkles, MessageSquare, Terminal, BarChart2, CheckCircle2 
} from "lucide-react"

interface DemoPageProps {
  onGetStarted: () => void
  onSignOut: () => void
}

// 3D Cube Component using pure CSS transforms
interface Cube3DProps {
  rotationX: number
  rotationY: number
  translationZ: number
  scale?: number
  className?: string
  color?: string
  size?: string
}

function Cube3D({ 
  rotationX, 
  rotationY, 
  translationZ, 
  scale = 1, 
  className = "", 
  color = "from-blue-500 to-purple-600", 
  size = "w-20 h-20" 
}: Cube3DProps) {
  // Convert sizes to offsets for translateZ
  const offset = size.includes("w-20") ? "translateZ(40px)" : 
                 size.includes("w-24") ? "translateZ(48px)" : 
                 size.includes("w-16") ? "translateZ(32px)" : "translateZ(20px)"
  
  const offsetNeg = offset.replace("(", "(-")

  return (
    <div 
      className={`relative transform-style-3d transition-all duration-300 ease-out ${size} ${className}`}
      style={{
        transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg) translateZ(${translationZ}px) scale(${scale})`,
      }}
    >
      {/* Front */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-80 border border-white/20 rounded-lg flex items-center justify-center`} style={{ transform: offset }} />
      {/* Back */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-70 border border-white/20 rounded-lg`} style={{ transform: `rotateY(180deg) ${offset}` }} />
      {/* Left */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-75 border border-white/20 rounded-lg`} style={{ transform: `rotateY(-90deg) ${offset}` }} />
      {/* Right */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-75 border border-white/20 rounded-lg`} style={{ transform: `rotateY(90deg) ${offset}` }} />
      {/* Top */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-85 border border-white/20 rounded-lg`} style={{ transform: `rotateX(90deg) ${offset}` }} />
      {/* Bottom */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-65 border border-white/20 rounded-lg`} style={{ transform: `rotateX(-90deg) ${offset}` }} />
    </div>
  )
}

export function DemoPage({ onGetStarted, onSignOut }: DemoPageProps) {
  const [scrollY, setScrollY] = useState(0)
  const [windowHeight, setWindowHeight] = useState(800)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [activeFeature, setActiveFeature] = useState(0)
  
  // Interactive simulator states
  const [promptInput, setPromptInput] = useState("")
  const [simStep, setSimStep] = useState(0) // 0: Idle, 1: Analyzing, 2: Integrating, 3: Completed
  const [simAgentType, setSimAgentType] = useState("")

  const featuresSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      
      // Calculate active feature section based on scroll position
      if (featuresSectionRef.current) {
        const rect = featuresSectionRef.current.getBoundingClientRect()
        const relativeY = -rect.top
        const sectionHeight = rect.height / 4
        if (relativeY >= 0 && relativeY < rect.height) {
          const currentFeature = Math.min(3, Math.floor(relativeY / sectionHeight))
          setActiveFeature(currentFeature)
        }
      }
    }

    const handleResize = () => {
      setWindowHeight(window.innerHeight)
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Get normal coords (-0.5 to 0.5)
      setMousePos({
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleResize, { passive: true })
    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    
    handleScroll()
    handleResize()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  // Trigger test-drive simulator animation
  const handleRunSimulator = (e: React.FormEvent) => {
    e.preventDefault()
    if (!promptInput.trim()) return

    setSimStep(1)
    let agentName = "Standard Agent"
    if (promptInput.toLowerCase().includes("support") || promptInput.toLowerCase().includes("customer")) {
      agentName = "Support Concierge"
    } else if (promptInput.toLowerCase().includes("research") || promptInput.toLowerCase().includes("search")) {
      agentName = "Market Analyst"
    } else if (promptInput.toLowerCase().includes("code") || promptInput.toLowerCase().includes("dev")) {
      agentName = "DevOps Automator"
    }
    setSimAgentType(agentName)

    setTimeout(() => {
      setSimStep(2)
    }, 1200)

    setTimeout(() => {
      setSimStep(3)
    }, 2400)
  }

  const handleResetSimulator = () => {
    setPromptInput("")
    setSimStep(0)
    setSimAgentType("")
  }

  // Calculate scroll ratios for parallax/3D
  const heroScrollRatio = Math.min(1, scrollY / (windowHeight || 800))
  const generalScrollRatio = scrollY / 1000

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden font-modern selection:bg-blue-600/30 selection:text-white">
      {/* 3D Scene Viewport: Fixed background container with perspective */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
      >
        {/* Glow grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-40" />
        
        {/* Ambient colored lighting spheres */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: "2s" }} />

        {/* 3D Ambient Cubes (floating and rotating depending on mouse move and scroll) */}
        
        {/* Top-Right Cube (Blue-Purple) */}
        <div className="absolute right-[15%] top-[15%] hidden md:block">
          <Cube3D
            rotationX={35 + scrollY * 0.08 + mousePos.y * 30}
            rotationY={45 - scrollY * 0.05 + mousePos.x * 30}
            translationZ={-100 - heroScrollRatio * 300}
            scale={1 - heroScrollRatio * 0.4}
            color="from-blue-600/80 to-purple-600/80"
            size="w-24 h-24"
          />
        </div>

        {/* Top-Left Smaller Cube (Pink-Indigo) */}
        <div className="absolute left-[10%] top-[25%] hidden md:block">
          <Cube3D
            rotationX={15 - scrollY * 0.12 - mousePos.y * 20}
            rotationY={60 + scrollY * 0.09 - mousePos.x * 20}
            translationZ={-200 - heroScrollRatio * 150}
            scale={0.8 - heroScrollRatio * 0.3}
            color="from-pink-600/60 to-indigo-600/60"
            size="w-16 h-16"
          />
        </div>

        {/* Mid-Right Floating Hexagon/Cylinder card */}
        <div 
          className="absolute right-[8%] top-[50%] w-48 h-48 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm hidden lg:flex flex-col items-center justify-center p-4 transition-transform duration-300 ease-out"
          style={{
            transform: `rotateY(${-25 - scrollY * 0.06 + mousePos.x * 15}deg) rotateX(${15 + scrollY * 0.04 - mousePos.y * 15}deg) translateZ(${-50 + scrollY * 0.1}px)`,
            transformStyle: "preserve-3d"
          }}
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-md shadow-blue-500/5 mb-3">
            <Cpu className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">Active Connectors</span>
          <span className="text-sm font-semibold text-white mt-1">Gemini / Groq / Oxlo</span>
          <div className="absolute bottom-2 flex gap-1 justify-center w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>

        {/* Floating 3D Core in the center (visible only when scrolling mid section) */}
        <div 
          className="absolute left-[55%] top-[40%] hidden lg:block transition-all duration-300"
          style={{
            opacity: scrollY > 400 && scrollY < 2500 ? 1 : 0,
            transform: `translateY(${scrollY > 400 ? 0 : 50}px)`,
          }}
        >
          {/* Central Brain Assembly */}
          <div 
            className="w-80 h-80 relative flex items-center justify-center"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Inner Glowing Core */}
            <div className="absolute w-24 h-24 rounded-full bg-blue-500/20 blur-[30px] animate-pulse" />
            
            {/* Main core cube */}
            <Cube3D
              rotationX={scrollY * 0.15 + mousePos.y * 15}
              rotationY={-scrollY * 0.15 + mousePos.x * 15}
              translationZ={0}
              scale={1.3}
              color="from-blue-600 via-indigo-600 to-purple-600"
              size="w-20 h-20"
            />

            {/* Orbiting Satellite Rings/Planes */}
            <div 
              className="absolute inset-0 border-2 border-dashed border-slate-800 rounded-full animate-spin"
              style={{ 
                transform: "rotateX(75deg) rotateY(15deg)", 
                animationDuration: "10s",
                transformStyle: "preserve-3d"
              }}
            />
            <div 
              className="absolute inset-4 border border-dashed border-slate-700/50 rounded-full animate-spin"
              style={{ 
                transform: "rotateX(-60deg) rotateY(-30deg)", 
                animationDuration: "14s",
                animationDirection: "reverse",
                transformStyle: "preserve-3d" 
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 py-3.5 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-base bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            MechaForge Lab
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onSignOut}
            className="text-slate-400 hover:text-white hover:bg-slate-900 text-xs"
          >
            Sign Out
          </Button>
          <Button 
            size="sm" 
            onClick={onGetStarted}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4"
          >
            Launch Builder
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center text-center px-4 pt-12 pb-20">
        <div className="max-w-3xl space-y-6">
          {/* Animated badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/25 rounded-full text-blue-400 text-xs font-semibold hover:bg-blue-500/15 transition duration-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Introducing Autonomous Workspaces</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-none bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
            Build AI agents <br className="hidden md:inline" />
            with simple conversation
          </h1>
          
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            MechaForge Lab compiles your plain-text requirements into functional AI agent architectures complete with memory, tools, and execution paths.
          </p>

          {/* Call to Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 transition duration-300 flex items-center gap-2 group text-xs"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                featuresSectionRef.current?.scrollIntoView({ behavior: "smooth" })
              }}
              className="w-full sm:w-auto bg-slate-900/40 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 px-8 py-6 rounded-xl text-xs"
            >
              Explore Features
            </Button>
          </div>
        </div>

        {/* Scroll prompt icon */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce flex flex-col items-center gap-1.5 opacity-60">
          <span className="text-[10px] tracking-widest uppercase text-slate-500 font-mono">Scroll Down</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </section>

      {/* Feature Scroll-Driven Demo Section */}
      <section 
        ref={featuresSectionRef} 
        className="relative z-10 bg-slate-950/40 border-t border-slate-900 py-1"
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Scrolling content descriptions */}
          <div className="space-y-[45vh] py-[25vh]">
            
            {/* Feature 1 */}
            <div className={`space-y-4 transition-all duration-500 ${activeFeature === 0 ? "opacity-100 translate-x-0" : "opacity-45 -translate-x-2"}`}>
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-sm">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">1. Converse to Configure</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-md">
                Simply type what you want your AI agent to do. Our parser breaks down the task into personality variables, behavior trees, and context memory limits automatically.
              </p>
              <div className="bg-slate-900/50 border border-slate-800/80 p-3 rounded-lg max-w-sm">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">USER PROMPT</span>
                <span className="text-xs text-slate-300 italic">"Build an agent that reads a spreadsheet, formats JSON, and emails it."</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className={`space-y-4 transition-all duration-500 ${activeFeature === 1 ? "opacity-100 translate-x-0" : "opacity-45 -translate-x-2"}`}>
              <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center border border-purple-500/20 shadow-sm">
                <Cpu className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">2. Multi-Model Power</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-md">
                Choose the best brain for each node. Use Google Gemini for complex actions, Groq for sub-second responses, or Oxlo for unified access keys. Run hybrid steps seamlessly.
              </p>
              <div className="flex gap-2 text-[10px] font-semibold">
                <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-blue-400">Gemini 1.5 Pro</span>
                <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-purple-400">Groq Llama-3</span>
                <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-emerald-400">Oxlo API</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className={`space-y-4 transition-all duration-500 ${activeFeature === 2 ? "opacity-100 translate-x-0" : "opacity-45 -translate-x-2"}`}>
              <div className="w-10 h-10 rounded-xl bg-pink-600/10 flex items-center justify-center border border-pink-500/20 shadow-sm">
                <Wrench className="w-5 h-5 text-pink-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">3. Advanced Toolkits</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-md">
                Equip your agents with direct system integrations. Provide secure bash environments, web search tools, database hooks, and webhook outputs to bridge LLM text with code execution.
              </p>
              <div className="bg-slate-900/40 p-3.5 border border-slate-800/80 rounded-lg max-w-sm space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Execute Bash</span>
                  <span className="text-[10px] text-emerald-400 px-1 bg-emerald-500/10 border border-emerald-500/20 rounded font-semibold">Granted</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> File System API</span>
                  <span className="text-[10px] text-emerald-400 px-1 bg-emerald-500/10 border border-emerald-500/20 rounded font-semibold">Granted</span>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className={`space-y-4 transition-all duration-500 ${activeFeature === 3 ? "opacity-100 translate-x-0" : "opacity-45 -translate-x-2"}`}>
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 shadow-sm">
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">4. Live Graph Workspace</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-md">
                Watch execution flows live. Debug reasoning steps, inspect variable outputs, and export fully packaged project bundles directly from a side-by-side terminal UI.
              </p>
              <div className="flex items-center gap-2 text-xs text-indigo-400">
                <Play className="w-3.5 h-3.5 animate-pulse" />
                <span className="font-semibold">Interactive Sandbox Active</span>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky 3D animated monitor element matching active features */}
          <div className="hidden lg:block sticky top-0 h-screen flex items-center justify-center z-10 pointer-events-none">
            <div 
              className="w-full max-w-md h-[400px] border border-slate-800 bg-slate-900/60 rounded-2xl p-6 shadow-2xl flex flex-col justify-between backdrop-blur-md relative overflow-hidden transition-all duration-500"
              style={{
                transform: `rotateY(${-15 + activeFeature * 5}deg) rotateX(${10 - activeFeature * 3}deg) translateZ(50px)`,
                transformStyle: "preserve-3d",
                boxShadow: `0 25px 50px -12px rgba(${activeFeature === 0 ? "59, 130, 246" : activeFeature === 1 ? "147, 51, 234" : activeFeature === 2 ? "219, 39, 119" : "99, 102, 241"}, 0.15)`
              }}
            >
              {/* Card topbar */}
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                  Live Viewport // State {activeFeature + 1}
                </span>
              </div>

              {/* Card content based on active scroll section */}
              <div className="flex-grow flex items-center justify-center p-4 relative min-h-[220px]">
                {/* 3D Wireframe Plane */}
                <div 
                  className="absolute inset-0 border border-slate-800/30 rounded-lg origin-center flex items-center justify-center opacity-30" 
                  style={{ transform: "rotateX(70deg) translateZ(-50px)" }}
                >
                  <div className="w-full h-full bg-[radial-gradient(#334155_1px,transparent_1px)] bg-[size:16px_16px]" />
                </div>

                {activeFeature === 0 && (
                  <div className="space-y-3 w-full text-left animate-slide-in">
                    <div className="bg-blue-600/10 border border-blue-500/30 p-2.5 rounded-lg text-xs max-w-[85%]">
                      <span className="font-semibold text-blue-400">MechaForge:</span> "Analyzing natural language prompt. Spawning layout..."
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg text-xs max-w-[85%] ml-auto text-right">
                      "Compile Agent configuration settings."
                    </div>
                    <div className="h-1.5 w-16 bg-blue-500/30 rounded-full animate-pulse mx-auto mt-2" />
                  </div>
                )}

                {activeFeature === 1 && (
                  <div className="relative w-40 h-40 flex items-center justify-center animate-slide-in">
                    {/* Ring orbit representation */}
                    <div className="absolute w-24 h-24 border border-dashed border-purple-500/40 rounded-full animate-spin" style={{ animationDuration: "6s" }} />
                    <Cube3D rotationX={45} rotationY={45} translationZ={0} color="from-purple-500 to-indigo-600" size="w-16 h-16" />
                    
                    <div className="absolute top-1 right-1 bg-slate-950 px-2 py-0.5 border border-purple-500/30 rounded text-[9px] font-mono">Gemini</div>
                    <div className="absolute bottom-1 left-1 bg-slate-950 px-2 py-0.5 border border-purple-500/30 rounded text-[9px] font-mono">Groq</div>
                  </div>
                )}

                {activeFeature === 2 && (
                  <div className="w-full text-center space-y-4 animate-slide-in">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 bg-slate-950 border border-pink-500/20 rounded-lg flex flex-col items-center">
                        <Terminal className="w-4 h-4 text-pink-400 mb-1" />
                        <span className="text-[9px] text-slate-400">Shell</span>
                      </div>
                      <div className="p-2 bg-slate-950 border border-pink-500/20 rounded-lg flex flex-col items-center">
                        <Wrench className="w-4 h-4 text-pink-400 mb-1" />
                        <span className="text-[9px] text-slate-400">FS Node</span>
                      </div>
                      <div className="p-2 bg-slate-950 border border-pink-500/20 rounded-lg flex flex-col items-center">
                        <Cpu className="w-4 h-4 text-pink-400 mb-1" />
                        <span className="text-[9px] text-slate-400">LLM Call</span>
                      </div>
                    </div>
                    <div className="p-2 bg-slate-950/80 border border-slate-800 rounded text-left font-mono text-[9px] text-slate-400">
                      &gt; pip install dependencies... <br />
                      &gt; mounting virtual directory... [OK]
                    </div>
                  </div>
                )}

                {activeFeature === 3 && (
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-left font-mono text-[10px] space-y-2 animate-slide-in">
                    <div className="flex justify-between items-center text-slate-500 border-b border-slate-900 pb-1.5">
                      <span>Preview: agent_worker.py</span>
                      <span className="text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active</span>
                    </div>
                    <p className="text-blue-400">class AgentSupport(BaseAgent):</p>
                    <p className="text-slate-300 pl-4">def __init__(self):</p>
                    <p className="text-purple-400 pl-8">self.model = "gemini-1.5-pro"</p>
                    <p className="text-purple-400 pl-8">self.tools = ["read_file", "search"]</p>
                    <p className="text-emerald-400 pl-4"># Build success in 1.4s</p>
                  </div>
                )}
              </div>

              {/* Card footer status */}
              <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${activeFeature === 3 ? "bg-emerald-500 animate-pulse" : "bg-blue-500"}`} />
                  System: Online
                </span>
                <span>Buffer: Stable</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Simulator Test-Drive Section */}
      <section className="relative z-10 py-24 px-6 border-t border-slate-900 bg-slate-950">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-white">Test-Drive MechaForge</h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto">
              Type an agent description below to simulate how the forge compiler registers nodes, loads packages, and links actions.
            </p>
          </div>

          <Card className="bg-slate-900/40 border-slate-800 text-slate-100 max-w-2xl mx-auto backdrop-blur-md">
            <CardHeader className="text-left pb-4 border-b border-slate-800/50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-400" />
                <span>Simulation Sandbox Playground</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-left">
              {simStep === 0 && (
                <form onSubmit={handleRunSimulator} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Describe your Agent:</label>
                    <input 
                      type="text" 
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      placeholder="e.g. Build a customer support agent with access to product FAQs and order records"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-3 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={!promptInput.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9"
                  >
                    Forge Blueprint
                  </Button>
                </form>
              )}

              {simStep > 0 && (
                <div className="space-y-6">
                  {/* Status Steps */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Agent Name: {simAgentType}</span>
                      <span className="text-slate-500 font-mono text-[10px]">Sim ID: #4802</span>
                    </div>

                    <div className="space-y-2.5">
                      {/* Step 1: Parsing */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
                        <div className="flex items-center gap-2.5 text-xs">
                          {simStep >= 1 ? (
                            simStep > 1 ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                            )
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-slate-800" />
                          )}
                          <span className={simStep >= 1 ? "text-slate-200" : "text-slate-600"}>Parsing prompt logic constraints...</span>
                        </div>
                        {simStep >= 2 && <span className="text-[9px] font-mono text-slate-500">Done</span>}
                      </div>

                      {/* Step 2: Selecting Model */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
                        <div className="flex items-center gap-2.5 text-xs">
                          {simStep >= 2 ? (
                            simStep > 2 ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                            )
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-slate-800" />
                          )}
                          <span className={simStep >= 2 ? "text-slate-200" : "text-slate-600"}>Connecting Gemini model endpoint context...</span>
                        </div>
                        {simStep >= 3 && <span className="text-[9px] font-mono text-slate-500">Done</span>}
                      </div>

                      {/* Step 3: Compiling */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
                        <div className="flex items-center gap-2.5 text-xs">
                          {simStep >= 3 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-slate-800" />
                          )}
                          <span className={simStep >= 3 ? "text-slate-200" : "text-slate-600"}>Deploying visual debug graph...</span>
                        </div>
                        {simStep >= 3 && <span className="text-[9px] font-mono text-slate-500">Done</span>}
                      </div>
                    </div>
                  </div>

                  {simStep === 3 && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs animate-slide-in">
                      <span className="text-emerald-400 font-medium">✨ Blueprint Simulated Successfully! Ready to build.</span>
                      <Button 
                        size="sm" 
                        onClick={onGetStarted}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] h-7"
                      >
                        Start Real Builder
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/60">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleResetSimulator}
                      className="text-slate-400 hover:text-white text-xs h-8"
                    >
                      Reset Sim
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="relative z-10 py-24 px-6 border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-xs md:text-sm">Everything you need to know about setting up MechaForge Lab workspace.</p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="item-1" className="border border-slate-800 bg-slate-900/20 px-4 rounded-xl">
              <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline text-xs md:text-sm py-4">
                What LLM providers are supported?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 text-xs leading-relaxed pb-4">
                Currently, MechaForge Lab features native configurations for Google Gemini (Adk & Actions), Groq (blazing-fast endpoints), and Oxlo (unified orchestration keys). You can add custom endpoints directly inside your settings panel.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-slate-800 bg-slate-900/20 px-4 rounded-xl">
              <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline text-xs md:text-sm py-4">
                Do I need to write Python or JavaScript to build agents?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 text-xs leading-relaxed pb-4">
                No! The builder translates conversational requirements into structured JSON and imports them directly. Advanced users can write custom code nodes using the in-app code editor.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-slate-800 bg-slate-900/20 px-4 rounded-xl">
              <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline text-xs md:text-sm py-4">
                Where are keys and data stored?
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 text-xs leading-relaxed pb-4">
                All keys, credentials, and conversation states are stored purely in your browser's local storage or transient memory. No user configurations are sent to third-party tracking databases.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Bottom Call to Action (CTA) Section */}
      <section className="relative z-10 py-24 px-6 border-t border-slate-900 bg-slate-950">
        <div className="max-w-4xl mx-auto rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950 p-10 md:p-16 text-center space-y-6 relative overflow-hidden">
          {/* Radial gradient glow in CTA card */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent_70%)] pointer-events-none" />
          
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Ready to forge your first autonomous agent?
          </h2>
          
          <p className="text-slate-400 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
            Spawn intelligent workspace agents, connect custom databases, and run visual diagnostic reports in under 5 minutes.
          </p>

          <div className="pt-4">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold px-10 py-6 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all text-xs"
            >
              Launch Platform Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-[11px] text-slate-600 border-t border-slate-900 bg-slate-950">
        <p>&copy; {new Date().getFullYear()} MechaForge Lab. All Rights Reserved. Built for high-performance agentic workflows.</p>
      </footer>
    </div>
  )
}
