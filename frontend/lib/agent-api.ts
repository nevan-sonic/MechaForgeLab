import { AgentProjectConfig, AgentConfig, ToolConfig } from "@/types/agent-config"

const DEFAULT_CONFIG: AgentProjectConfig = {
  project_name: "customer_service_bot",
  description: "Customer service bot with memory and search capabilities",
  version: "1.0.0",
  main_agent: "service_coordinator",
  agents: {
    service_coordinator: {
      name: "service_coordinator",
      type: "llm_agent" as any,
      description: "Customer service coordinator with memory and search capabilities",
      model: "gemini-2.0-flash-lite-001",
      instruction: `You are a helpful customer service representative. 

You have access to:
- Memory to remember previous conversations and customer details
- Web search to find current information about products/services
- Web page loading to access detailed documentation

Always:
1. Check memory for previous customer interactions
2. Search for current information when needed
3. Provide helpful, accurate, and friendly responses
4. Remember important customer details for future interactions`,
      tools: ["memory_loader", "memory_preloader", "web_search", "page_loader"],
      sub_agents: [],
      config: {
        temperature: 0.2
      }
    }
  },
  tools: {
    memory_loader: {
      name: "memory_loader",
      type: "builtin",
      description: "Load relevant memories based on context",
      builtin_type: "load_memory" as any
    },
    memory_preloader: {
      name: "memory_preloader",
      type: "builtin",
      description: "Preload specific memories at conversation start",
      builtin_type: "preload_memory" as any
    },
    web_search: {
      name: "web_search",
      type: "builtin",
      description: "Search the web for current information",
      builtin_type: "google_search" as any
    },
    page_loader: {
      name: "page_loader",
      type: "builtin",
      description: "Load and analyze web page content",
      builtin_type: "url_context" as any
    }
  },
  requirements: ["google-genai", "pydantic"],
  environment_variables: {
    GOOGLE_SEARCH_API_KEY: "your_api_key_here",
    GOOGLE_SEARCH_ENGINE_ID: "your_engine_id_here"
  },
  environment_variables_example: {
    GOOGLE_SEARCH_API_KEY: "AIzaSy...",
    GOOGLE_SEARCH_ENGINE_ID: "cx..."
  }
}

const STORAGE_KEY = "mechaforge_agent_config"

// Migrate config
if (typeof window !== "undefined") {
  const oldConfig = localStorage.getItem("bleach_agent_config")
  if (oldConfig && !localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, oldConfig)
    localStorage.removeItem("bleach_agent_config")
  }
}

export async function fetchAgentConfig(): Promise<AgentProjectConfig> {
  if (typeof window === "undefined") return DEFAULT_CONFIG
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      let modified = false
      if (parsed.tools) {
        for (const [key, tool] of Object.entries(parsed.tools) as [string, any][]) {
          if (tool.type === "custom_function" && tool.function_code) {
            const code = tool.function_code
            if (code.includes("credentials.json") || code.includes("InstalledAppFlow") || code.includes("token.pickle")) {
              if (key.includes("calendar") || key.includes("meeting") || key.includes("schedule")) {
                tool.function_code = `def schedule_meeting(summary, start_time, end_time):
    import os
    import datetime
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    # Helper to resolve natural language dates like "tomorrow at 14:00" to ISO strings
    def parse_time(t_str):
        t_str = t_str.lower().strip()
        now = datetime.datetime.now()
        target_date = now
        
        if 'tomorrow' in t_str:
            target_date = now + datetime.timedelta(days=1)
            t_str = t_str.replace('tomorrow', '').replace('at', '').strip()
        
        # Parse time part
        try:
            if ':' in t_str:
                parts = t_str.split(':')
                hour = int(parts[0])
                minute = int(parts[1][:2])
            else:
                # regex or digit search
                digits = "".join([c for c in t_str if c.isdigit()])
                if digits:
                    hour = int(digits)
                else:
                    hour = 12
                minute = 0
            
            # Handle PM/AM
            if 'pm' in t_str and hour < 12:
                hour += 12
            elif 'am' in t_str and hour == 12:
                hour = 0
                
            dt = datetime.datetime(target_date.year, target_date.month, target_date.day, hour, minute)
            return dt.isoformat()
        except Exception:
            return t_str

    token = os.environ.get("GOOGLE_ACCESS_TOKEN")
    if not token:
        raise ValueError("GOOGLE_ACCESS_TOKEN environment variable is not set.")

    creds = Credentials(token=token)
    service = build('calendar', 'v3', credentials=creds)

    event = {
        'summary': summary,
        'start': {'dateTime': parse_time(start_time), 'timeZone': 'UTC'},
        'end': {'dateTime': parse_time(end_time), 'timeZone': 'UTC'},
    }

    event = service.events().insert(calendarId=os.environ.get("GOOGLE_CALENDAR_ID", "primary"), body=event).execute()
    return event.get('id')`
                modified = true
              } else if (key.includes("email") || key.includes("gmail") || key.includes("send")) {
                tool.function_code = `def send_email(to, subject, body):
    import os
    import base64
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    token = os.environ.get("GOOGLE_ACCESS_TOKEN")
    if not token:
        raise ValueError("GOOGLE_ACCESS_TOKEN environment variable is not set.")

    creds = Credentials(token=token)
    service = build('gmail', 'v1', credentials=creds)

    message = f"To: {to}\\nSubject: {subject}\\n\\n{body}"
    message = base64.urlsafe_b64encode(message.encode("utf-8")).decode("utf-8")

    service.users().messages().send(userId='me', body={'raw': message}).execute()
    return "Email sent successfully"`
                modified = true
              }
            }
          }
        }
      }
      if (modified) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      }
      return parsed
    } catch (e) {
      console.error(e)
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG))
  return DEFAULT_CONFIG
}

export async function updateAgent(id: string, agent: AgentConfig): Promise<void> {
  const config = await fetchAgentConfig()
  config.agents[id] = agent
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export async function updateTool(id: string, tool: ToolConfig): Promise<void> {
  const config = await fetchAgentConfig()
  config.tools[id] = tool
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
