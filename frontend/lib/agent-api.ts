import { AgentProjectConfig, AgentConfig, ToolConfig } from "@/types/agent-config"

export const DEFAULT_CONFIG: AgentProjectConfig = {
  project_name: "customer_service_bot",
  description: "Customer service bot with memory and search capabilities",
  version: "1.0.0",
  main_agent: "service_coordinator",
  agents: {
    service_coordinator: {
      name: "service_coordinator",
      type: "llm_agent" as any,
      description: "Customer service coordinator with memory and search capabilities",
      model: "deepseek-v4-flash",
      instruction: `You are a helpful customer service representative. 

You have access to:
- Memory to remember previous conversations and customer details
- Web search to find current information about products/services
- Web page scraping to access detailed web documentation

Always:
1. Check memory for previous customer interactions
2. Search for current information when needed
3. Provide helpful, accurate, and friendly responses
4. Remember important customer details for future interactions`,
      tools: ["memory_loader", "memory_preloader", "web_search", "scrape_web_page"],
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
      type: "custom_function",
      description: "Search the web for current information, dynamically prioritizing DuckDuckGo or Wikipedia based on the query.",
      imports: [
        "import requests",
        "from bs4 import BeautifulSoup"
      ],
      dependencies: ["requests", "beautifulsoup4"],
      function_code: `def web_search(query: str) -> str:
    """Search the web for current information, dynamically prioritizing DuckDuckGo or Wikipedia based on the query type.
    
    Args:
        query: The search query string.
    """
    import requests

    def run_ddg(q):
        try:
            from bs4 import BeautifulSoup
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            res = requests.post("https://html.duckduckgo.com/html/", data={"q": q}, headers=headers, timeout=10)
            if res.ok and "anomaly-modal" not in res.text:
                soup = BeautifulSoup(res.text, "html.parser")
                results = []
                for a in soup.select('.result__body')[:5]:
                    title_elem = a.select_one('.result__title')
                    snippet_elem = a.select_one('.result__snippet')
                    url_elem = a.select_one('.result__url')
                    
                    title = title_elem.get_text().strip() if title_elem else "Result"
                    snippet = snippet_elem.get_text().strip() if snippet_elem else ""
                    link = url_elem.get_text().strip() if url_elem else ""
                    
                    results.append(f"- {title}: {snippet} ({link})")
                if results:
                    return "\\n".join(results)
        except Exception:
            pass
        return None

    def run_wiki(q):
        try:
            url = "https://en.wikipedia.org/w/api.php"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            
            # Try 1: Original query
            res = requests.get(url, headers=headers, params={
                "action": "query",
                "list": "search",
                "srsearch": q,
                "utf8": 1,
                "format": "json"
            }, timeout=10)
            
            search_results = []
            if res.ok:
                search_results = res.json().get("query", {}).get("search", [])
                
            # Try 2: Cleaned query (no quotes) if no results
            if not search_results:
                clean_query = q.replace('"', '').replace("'", "").strip()
                if clean_query != q:
                    res = requests.get(url, headers=headers, params={
                        "action": "query",
                        "list": "search",
                        "srsearch": clean_query,
                        "utf8": 1,
                        "format": "json"
                    }, timeout=10)
                    if res.ok:
                        search_results = res.json().get("query", {}).get("search", [])
                        
            # Try 3: Broad fallback (first 5 words) if still no results
            if not search_results:
                words = [w for w in q.replace('"', '').replace("'", "").split() if w.lower() not in ('site:', 'and', 'or', 'vs')]
                if len(words) > 5:
                    broad_query = " ".join(words[:5])
                    res = requests.get(url, headers=headers, params={
                        "action": "query",
                        "list": "search",
                        "srsearch": broad_query,
                        "utf8": 1,
                        "format": "json"
                    }, timeout=10)
                    if res.ok:
                        search_results = res.json().get("query", {}).get("search", [])
                        
            if search_results:
                results = []
                for item in search_results[:5]:
                    title = item.get("title")
                    snippet = item.get("snippet").replace('<span class="searchmatch">', '').replace('</span>', '').replace('&quot;', '"')
                    link = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
                    results.append(f"- {title}: {snippet} ({link})")
                if results:
                    return "\\n".join(results)
        except Exception:
            pass
        return None

    # Route dynamically based on query type
    query_lower = query.lower()
    wiki_keywords = ["what is", "who is", "history", "definition", "biography", "origin", "explain", "concept", "describe", "wikipedia"]
    wiki_first = any(k in query_lower for k in wiki_keywords)

    if wiki_first:
        # Try Wikipedia first, fall back to DuckDuckGo
        res = run_wiki(query)
        if res:
            return res
        res = run_ddg(query)
        if res:
            return res
    else:
        # Try DuckDuckGo first, fall back to Wikipedia
        res = run_ddg(query)
        if res:
            return res
        res = run_wiki(query)
        if res:
            return res

    return f"No search results found for query: '{query}'. Please try a broader or different query."`
    },
    scrape_web_page: {
      name: "scrape_web_page",
      type: "custom_function",
      description: "Fetch and read text content from a web page URL.",
      imports: [
        "import requests",
        "from bs4 import BeautifulSoup",
        "import re"
      ],
      dependencies: ["requests", "beautifulsoup4"],
      function_code: `def scrape_web_page(url: str) -> str:
    """Fetch and clean text content from a web page.
    
    Args:
        url: The web page URL.
    """
    import requests
    from bs4 import BeautifulSoup
    import re

    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        res = requests.get(url, headers=headers, timeout=15)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "html.parser")
        for s in soup(["script", "style"]):
            s.decompose()
        text = soup.get_text()
        text = re.sub(r'\\s+', ' ', text).strip()
        return text[:4000]
    except Exception as e:
        return f"Scraping error: {str(e)}"`
    },
    read_google_sheet: {
      name: "read_google_sheet",
      type: "custom_function",
      description: "Read data from a Google Sheet spreadsheet.",
      imports: [
        "import os",
        "from google.oauth2.credentials import Credentials",
        "from googleapiclient.discovery import build"
      ],
      dependencies: ["google-api-python-client", "google-auth"],
      function_code: `def read_google_sheet(spreadsheet_id: str, range_name: str) -> list:
    """Read values from a Google Sheet range.
    
    Args:
        spreadsheet_id: The ID of the spreadsheet.
        range_name: The sheet name and range (e.g., 'Sheet1!A1:D10').
    """
    import os
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    token = os.environ.get("GOOGLE_ACCESS_TOKEN")
    if not token:
        raise ValueError("GOOGLE_ACCESS_TOKEN environment variable is not set.")

    creds = Credentials(token=token)
    service = build('sheets', 'v4', credentials=creds)
    result = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id, range=range_name
    ).execute()
    return result.get('values', [])`
    },
    append_to_google_sheet: {
      name: "append_to_google_sheet",
      type: "custom_function",
      description: "Append rows of values to a Google Sheet spreadsheet.",
      imports: [
        "import os",
        "from google.oauth2.credentials import Credentials",
        "from googleapiclient.discovery import build"
      ],
      dependencies: ["google-api-python-client", "google-auth"],
      function_code: `def append_to_google_sheet(spreadsheet_id: str, range_name: str, values: list) -> str:
    """Append rows of values to a Google Sheet.
    
    Args:
        spreadsheet_id: The ID of the spreadsheet.
        range_name: The target range or sheet name (e.g., 'Sheet1!A1').
        values: A list of lists representing rows (e.g., [['John', 'Doe', 'johndoe@email.com']]).
    """
    import os
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    token = os.environ.get("GOOGLE_ACCESS_TOKEN")
    if not token:
        raise ValueError("GOOGLE_ACCESS_TOKEN environment variable is not set.")

    creds = Credentials(token=token)
    service = build('sheets', 'v4', credentials=creds)
    body = {'values': values}
    result = service.spreadsheets().values().append(
        spreadsheetId=spreadsheet_id, range=range_name,
        valueInputOption='USER_ENTERED', body=body
    ).execute()
    return f"Appended successfully. {result.get('updates').get('updatedCells')} cells updated."`
    },
    list_drive_files: {
      name: "list_drive_files",
      type: "custom_function",
      description: "List or search files in Google Drive.",
      imports: [
        "import os",
        "from google.oauth2.credentials import Credentials",
        "from googleapiclient.discovery import build"
      ],
      dependencies: ["google-api-python-client", "google-auth"],
      function_code: `def list_drive_files(query: str = None) -> list:
    """List or search files in Google Drive.
    
    Args:
        query: Optional search query (e.g., "name contains 'report'").
    """
    import os
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    token = os.environ.get("GOOGLE_ACCESS_TOKEN")
    if not token:
        raise ValueError("GOOGLE_ACCESS_TOKEN environment variable is not set.")

    creds = Credentials(token=token)
    service = build('drive', 'v3', credentials=creds)
    q = query if query else ""
    results = service.files().list(q=q, pageSize=10, fields="files(id, name, mimeType)").execute()
    return results.get('files', [])`
    },
    upload_to_drive: {
      name: "upload_to_drive",
      type: "custom_function",
      description: "Upload a text or markdown file to Google Drive.",
      imports: [
        "import os",
        "import io",
        "from google.oauth2.credentials import Credentials",
        "from googleapiclient.discovery import build",
        "from googleapiclient.http import MediaIoBaseUpload"
      ],
      dependencies: ["google-api-python-client", "google-auth"],
      function_code: `def upload_to_drive(filename: str, content: str, mime_type: str = "text/plain") -> str:
    """Upload a file to Google Drive.
    
    Args:
        filename: Name of the file in Google Drive.
        content: The text content of the file.
        mime_type: The MIME type of the file (e.g., 'text/plain', 'text/markdown').
    """
    import os
    import io
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseUpload

    token = os.environ.get("GOOGLE_ACCESS_TOKEN")
    if not token:
        raise ValueError("GOOGLE_ACCESS_TOKEN environment variable is not set.")

    creds = Credentials(token=token)
    service = build('drive', 'v3', credentials=creds)
    file_metadata = {'name': filename, 'mimeType': mime_type}
    fh = io.BytesIO(content.encode('utf-8'))
    media = MediaIoBaseUpload(fh, mimetype=mime_type, resumable=True)
    file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
    return f"File uploaded successfully. ID: {file.get('id')}"`
    }
  },
  requirements: ["google-genai", "pydantic", "beautifulsoup4"],
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
      
      if (!parsed.tools) {
        parsed.tools = {}
        modified = true
      }
      
      const newTools: Record<string, ToolConfig> = {
        read_google_sheet: DEFAULT_CONFIG.tools.read_google_sheet,
        append_to_google_sheet: DEFAULT_CONFIG.tools.append_to_google_sheet,
        list_drive_files: DEFAULT_CONFIG.tools.list_drive_files,
        upload_to_drive: DEFAULT_CONFIG.tools.upload_to_drive,
        web_search: DEFAULT_CONFIG.tools.web_search,
        scrape_web_page: DEFAULT_CONFIG.tools.scrape_web_page
      }
      
      for (const [tName, tDef] of Object.entries(newTools)) {
        const currentTool = parsed.tools[tName]
        if (
          !currentTool ||
          currentTool.type !== tDef.type ||
          currentTool.function_code !== tDef.function_code ||
          JSON.stringify(currentTool.imports) !== JSON.stringify(tDef.imports) ||
          JSON.stringify(currentTool.dependencies) !== JSON.stringify(tDef.dependencies)
        ) {
          parsed.tools[tName] = tDef
          modified = true
        }
      }


      // Check for calendar/email tools credentials.json references and patch them as before
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
