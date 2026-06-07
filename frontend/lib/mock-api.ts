import { PromptSuggestion } from "@/types"
import { getApiKey, getProvider } from "./api-key"
import { DEFAULT_CONFIG } from "./agent-api"

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
      temperature: 0.2,
      max_tokens: 4096
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
  return callOxlo(prompt, systemInstruction)
}

function extractBalancedJSON(str: string): string {
  const start = str.indexOf("{")
  if (start === -1) return str
  
  let depth = 0
  let inString = false
  let escape = false
  
  for (let i = start; i < str.length; i++) {
    const char = str[i]
    
    if (escape) {
      escape = false
      continue
    }
    
    if (char === "\\") {
      escape = true
      continue
    }
    
    if (char === '"') {
      inString = !inString
      continue
    }
    
    if (!inString) {
      if (char === "{") {
        depth++
      } else if (char === "}") {
        depth--
        if (depth === 0) {
          return str.substring(start, i + 1)
        }
      }
    }
  }
  return str
}

function cleanAndParseJSON(jsonString: string): any {
  const balanced = extractBalancedJSON(jsonString)
  let cleaned = balanced.trim()

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
  model?: string; // default to "deepseek-v4-flash"
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
1. Pre-configured Certified Tools: You MUST use these exact tool names and signatures in your configuration design if the user requests these capabilities. DO NOT rename them or invent different signatures:
   - \`web_search(query: str) -> str\`: Searches the web for current information (uses automatic DuckDuckGo fallback, NO Tavily or SerpAPI keys needed).
   - \`scrape_web_page(url: str) -> str\`: Fetches and extracts text content from a web page URL.
   - \`read_google_sheet(spreadsheet_id: str, range_name: str) -> list\`: Reads values from a Google Sheet.
   - \`append_to_google_sheet(spreadsheet_id: str, range_name: str, values: list) -> str\`: Appends a list of rows to a Google Sheet.
   - \`list_drive_files(query: str = None) -> list\`: Lists or searches files in Google Drive.
   - \`upload_to_drive(filename: str, content: str, mime_type: str = "text/plain") -> str\`: Uploads a text/markdown file to Google Drive.
2. Design a single flat LLM agent (type: 'llm_agent') containing all necessary tools (e.g. web_search, scrape_web_page, append_to_google_sheet, upload_to_drive, etc.) as the default choice. This is much more robust and less error-prone. ONLY use multi-agent architectures (sequential_agent, parallel_agent, loop_agent) if the user explicitly requests a multi-agent flow, or if the logic absolutely requires delegating distinct tasks.
3. If you decide to create a multi-agent architecture (using sequential_agent, parallel_agent, or loop_agent):
   - Every sequential_agent, parallel_agent, or loop_agent MUST NOT have any tools assigned directly to its 'tools' array.
   - Every sequential_agent, parallel_agent, or loop_agent MUST have a non-empty 'sub_agents' array containing valid agent names, and all those sub-agents must be defined as 'llm_agent' instances in the 'agents' configuration.
   - Put all the tools on the 'llm_agent' sub-agents. Only 'llm_agent' instances can execute tools.
4. Every custom or builtin tool defined under 'tools' in the JSON MUST be assigned to the 'tools' array of at least one 'llm_agent' so it is reachable and executable.
5. Do NOT generate any tools or agents for calendar event scheduling or email sending unless the user's prompt explicitly mentions scheduling, calendar, meetings, or emails. If the user asks for web research, sheets, or drive tools, ONLY generate those tools and a researcher agent. Do not bleed instructions or templates from other agent designs.
6. For custom tools, write fully functional, robust Python code under the ---TOOL [tool_name]--- block. Do not use quotes or escapes inside the block name.
7. Any custom tool for Google APIs (Gmail, Calendar, etc.) MUST NOT use 'credentials.json', 'token.pickle', 'InstalledAppFlow', or local server flows. You MUST authenticate the API services using the pre-configured access token from the environment variable: 'from google.oauth2.credentials import Credentials' and 'creds = Credentials(token=os.environ.get("GOOGLE_ACCESS_TOKEN"))'.
8. Any custom tool for sending emails via the Gmail API must format the email headers (To, Subject) and encode the string using 'base64.urlsafe_b64encode(message.encode("utf-8")).decode("utf-8")', then pass it as '{"raw": base64_string}'. Ensure 'base64' is imported in the imports/dependencies list or in the custom function code.
9. Ensure the output formats perfectly. Do not output anything outside the formatting tags.

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

      // Normalize common tool names generated by the LLM
      if (parsedConfig.agents && parsedConfig.tools) {
        const normalizationMap: Record<string, string> = {
          "save_to_sheet": "append_to_google_sheet",
          "write_to_sheet": "append_to_google_sheet",
          "google_search": "web_search",
          "tavily_search": "web_search",
          "tavily_web_search": "web_search",
          "scrape_page": "scrape_web_page",
          "read_sheet": "read_google_sheet",
          "upload_file_to_drive": "upload_to_drive",
          "upload_to_google_drive": "upload_to_drive"
        }

        for (const [oldName, newName] of Object.entries(normalizationMap)) {
          if (parsedConfig.tools[oldName]) {
            parsedConfig.tools[newName] = parsedConfig.tools[oldName]
            delete parsedConfig.tools[oldName]
          }
          for (const agent of Object.values(parsedConfig.agents) as any[]) {
            if (agent.tools && Array.isArray(agent.tools)) {
              agent.tools = agent.tools.map((t: string) => t === oldName ? newName : t)
            }
          }
        }
      }

      // Override or lock the six core tools to their hardened, working versions
      const coreToolNames = [
        "web_search",
        "scrape_web_page",
        "read_google_sheet",
        "append_to_google_sheet",
        "list_drive_files",
        "upload_to_drive"
      ]

      if (parsedConfig.tools) {
        for (const toolName of coreToolNames) {
          const defaultTool = DEFAULT_CONFIG.tools[toolName]
          if (defaultTool && (parsedConfig.tools[toolName] || Object.values(parsedConfig.agents || {}).some((a: any) => a.tools?.includes(toolName)))) {
            parsedConfig.tools[toolName] = { ...defaultTool }
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
