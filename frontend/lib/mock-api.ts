import { PromptSuggestion } from "@/types"
import { getApiKey, getProvider } from "./api-key"

export const mockPrompts: PromptSuggestion[] = [
  {
    id: "1",
    title: "Customer Support Agent",
    description: "An agent that classifies support emails and responds."
  },
  {
    id: "2",
    title: "Research Assistant",
    description: "An agent that searches the web and summarizes articles."
  },
  {
    id: "3",
    title: "Sequential Document Processor",
    description: "A pipeline that analyzes documents and checks facts."
  },
  {
    id: "4",
    title: "Calculator Agent",
    description: "An agent with custom tools to evaluate mathematical expressions."
  }
]

async function fetchWithRetry(url: string, options: RequestInit, retries = 4, initialDelay = 1000): Promise<Response> {
  let delay = initialDelay
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.status === 429) {
        if (i === retries - 1) {
          return response
        }
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 1.5 // exponential backoff
        continue
      }
      return response
    } catch (error) {
      if (i === retries - 1) {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay *= 1.5
    }
  }
  throw new Error("Request failed after maximum retries")
}

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = getApiKey("gemini")
  if (!apiKey) {
    throw new Error("Gemini API Key is not set. Please click the key icon in the header to enter your Gemini API Key.")
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
  
  const payload: any = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2
    }
  }

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    }
  }

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = errorData.error?.message || response.statusText
    throw new Error(`Gemini API Error: ${message}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error("Empty response from Gemini API")
  }

  return text
}

async function callGroq(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = getApiKey("groq")
  if (!apiKey) {
    throw new Error("Groq API Key is not set. Please click the key icon in the header to enter your Groq API Key.")
  }
  const url = "https://api.groq.com/openai/v1/chat/completions"
  
  const messages: any[] = []
  if (systemInstruction) {
    messages.push({
      role: "system",
      content: systemInstruction
    })
  }
  messages.push({
    role: "user",
    content: prompt
  })

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      temperature: 0.2
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = errorData.error?.message || response.statusText
    throw new Error(`Groq API Error: ${message}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) {
    throw new Error("Empty response from Groq API")
  }

  return text;
}

async function callOxlo(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = getApiKey("oxlo")
  if (!apiKey) {
    throw new Error("Oxlo API Key is not set. Please click the key icon in the header to enter your Oxlo API Key.")
  }
  const url = "https://api.oxlo.ai/v1/chat/completions"
  
  const messages: any[] = []
  if (systemInstruction) {
    messages.push({
      role: "system",
      content: systemInstruction
    })
  }
  messages.push({
    role: "user",
    content: prompt
  })

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      messages: messages,
      temperature: 0.2
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = errorData.error?.message || response.statusText
    throw new Error(`Oxlo API Error: ${message}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) {
    throw new Error("Empty response from Oxlo API")
  }

  return text;
}

async function callLLM(prompt: string, systemInstruction?: string): Promise<string> {
  const provider = getProvider()
  if (provider === "oxlo") {
    return callOxlo(prompt, systemInstruction)
  } else if (provider === "groq") {
    return callGroq(prompt, systemInstruction)
  } else {
    return callGemini(prompt, systemInstruction)
  }
}

function cleanAndParseJSON(jsonString: string): any {
  let cleaned = jsonString.trim()

  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, "")
  cleaned = cleaned.replace(/\s*```$/, "")
  cleaned = cleaned.trim()

  // 1. Escape literal newlines inside double-quoted string values
  cleaned = cleaned.replace(/"(?:\\"|[^"])*"/g, (m) => {
    return m.replace(/\n/g, "\\n").replace(/\r/g, "\\r")
  })

  // 2. Strip single-line and multi-line comments safely
  cleaned = cleaned.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m)

  // 3. Strip trailing commas before closing braces or brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1")

  return JSON.parse(cleaned)
}

export async function simulateAIResponse(input: string): Promise<string> {
  const systemInstruction = `You are the MechaForge Meta-Agent Orchestrator, an AI-powered agent generation platform built on Google's Agent Development Kit (ADK).
Your task is to analyze the user's request for building an AI agent (or a multi-agent system) and generate a complete, valid configuration JSON object matching the AgentProjectConfig schema, along with a natural language explanation of the design.

To completely prevent JSON quote-escaping and string formatting issues, you MUST split your output into separate blocks:
1. Natural language design response under ---RESPONSE---.
2. JSON configuration under ---CONFIG---. OMIT the 'function_code' property from any custom_function tools inside this JSON.
3. The raw Python code of each custom tool under a separate ---TOOL [tool_name]--- block.

The AgentProjectConfig JSON schema is as follows:
interface ToolConfig {
  name: string;
  type: "builtin" | "custom_function";
  description: string;
  builtin_type?: "google_search" | "url_context" | "load_memory" | "preload_memory" | "load_artifacts" | "transfer_to_agent" | "get_user_choice" | "exit_loop";
  imports?: string[]; // list of python import statements if custom_function
  dependencies?: string[]; // list of pip packages if custom_function
  // DO NOT include 'function_code' inside this JSON. It will be parsed from the ---TOOL [tool_name]--- block instead.
}

interface AgentConfig {
  name: string;
  type: "llm_agent" | "sequential_agent" | "parallel_agent" | "loop_agent";
  description: string;
  model?: string; // default to "gemini-2.0-flash" or "llama-3.3-70b-versatile"
  instruction?: string; // Detailed system instruction/prompt for the LLM agent.
  tools: string[]; // List of tool names this agent has access to.
  sub_agents: string[]; // List of agent names this agent can call or route to.
  config: Record<string, any>;
}

interface AgentProjectConfig {
  project_name: string;
  description: string;
  version: string;
  main_agent: string; // The entry-point agent name
  agents: Record<string, AgentConfig>;
  tools: Record<string, ToolConfig>;
  requirements: string[]; // additional requirements.txt lines
  environment_variables: Record<string, string>; // keys for env vars, e.g. {"OPENAI_API_KEY": ""}
  environment_variables_example: Record<string, string>; // example values, e.g. {"OPENAI_API_KEY": "sk-..."}
}

Important instructions:
1. Design a multi-agent architecture if needed (e.g. classifier agent delegating to sequential or loop sub-agents), or a single LLM agent if simple.
2. For custom tools, write fully functional, robust Python code under the ---TOOL [tool_name]--- block. Do not use quotes or escapes inside the block name.
3. Any custom tool for Google APIs (Gmail, Calendar, etc.) MUST NOT use 'credentials.json', 'token.pickle', 'InstalledAppFlow', or local server flows. You MUST authenticate the API services using the pre-configured access token from the environment variable: 'from google.oauth2.credentials import Credentials' and 'creds = Credentials(token=os.environ.get("GOOGLE_ACCESS_TOKEN"))'.
4. Any custom tool for sending emails via the Gmail API must format the email headers (To, Subject) and encode the string using 'base64.urlsafe_b64encode(message.encode("utf-8")).decode("utf-8")', then pass it as '{"raw": base64_string}'. Ensure 'base64' is imported in the imports/dependencies list or in the custom function code.
5. Ensure the output formats perfectly. Do not output anything outside the formatting tags.

Format your response EXACTLY as follows:
---RESPONSE---
[Write a short, professional, and friendly explanation of the multi-agent design, listing the agents, their roles, and tools designed]

---CONFIG---
[Output ONLY the raw JSON object representing the AgentProjectConfig. OMIT the 'function_code' property from the custom tools in this JSON. Do not wrap in markdown blocks.]

---TOOL [tool_name]---
[Output ONLY the raw Python code of the custom tool. Do not wrap it in markdown code blocks like \`\`\`python.]`

  try {
    const rawResult = await callLLM(input, systemInstruction)
    
    // 1. Extract natural language response
    let responseText = ""
    const responseMatch = rawResult.match(/---RESPONSE---([\s\S]*?)(?:---CONFIG---|---TOOL|$)/)
    if (responseMatch) {
      responseText = responseMatch[1].trim()
    } else {
      responseText = rawResult.split("---CONFIG---")[0].replace("---RESPONSE---", "").trim()
    }

    // 2. Extract JSON config
    let configJSON = ""
    const configMatch = rawResult.match(/---CONFIG---([\s\S]*?)(?:---TOOL|$)/)
    if (configMatch) {
      configJSON = configMatch[1].trim()
    }

    // 3. Parse JSON config
    let parsedConfig: any = null
    if (configJSON) {
      try {
        parsedConfig = cleanAndParseJSON(configJSON)
      } catch (e) {
        console.error("Failed to parse agent config JSON from LLM:", e)
        // Fallback to finding '{' and '}'
        const start = configJSON.indexOf("{")
        const end = configJSON.lastIndexOf("}")
        if (start !== -1 && end !== -1 && end > start) {
          try {
            parsedConfig = cleanAndParseJSON(configJSON.substring(start, end + 1))
          } catch (e2) {
            console.error("Fallback JSON parsing failed:", e2)
          }
        }
      }
    }

    // 4. Extract and associate custom tool code blocks
    if (parsedConfig) {
      const toolBlocks = rawResult.split(/---TOOL\s+/)
      for (let i = 1; i < toolBlocks.length; i++) {
        const block = toolBlocks[i]
        const match = block.match(/^([a-zA-Z0-9_-]+)---([\s\S]*?)(?:---TOOL|$)/)
        if (match) {
          const toolName = match[1].trim()
          let toolCode = match[2].trim()
          
          // Clean markdown wrappers if any
          toolCode = toolCode.replace(/^```python\s*/, "")
          toolCode = toolCode.replace(/^```\s*/, "")
          toolCode = toolCode.replace(/\s*```$/, "")
          toolCode = toolCode.trim()

          if (parsedConfig.tools && parsedConfig.tools[toolName]) {
            parsedConfig.tools[toolName].function_code = toolCode
          }
        }
      }

      // Save to localStorage
      localStorage.setItem("mechaforge_agent_config", JSON.stringify(parsedConfig))
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("mechaforge_config_updated"))
      }
    }
    
    return responseText
  } catch (error: any) {
    const provider = getProvider()
    console.error(`LLM API Error in simulateAIResponse (${provider}):`, error)
    return `Error connecting to ${provider.toUpperCase()} API: ${error.message}. Please click the key icon in the top header to inspect or update your API keys.`
  }
}

export async function simulateAgentResponse(input: string): Promise<string> {
  let instruction = "You are a helpful AI assistant."
  
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("mechaforge_agent_config")
    if (stored) {
      try {
        const config = JSON.parse(stored)
        const mainAgentName = config.main_agent
        const mainAgent = config.agents[mainAgentName]
        if (mainAgent && mainAgent.instruction) {
          instruction = mainAgent.instruction
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  try {
    return await callLLM(input, instruction)
  } catch (error: any) {
    console.error("LLM API Error in simulateAgentResponse:", error)
    return `Error from agent: ${error.message}. Please click the key icon in the top header to check your API keys.`
  }
}

export function simulateAgentBuilding(onProgress: (progress: number) => void): void {
  let progress = 0
  const interval = setInterval(() => {
    progress += 10
    onProgress(progress)
    if (progress >= 100) {
      clearInterval(interval)
    }
  }, 100)
}
