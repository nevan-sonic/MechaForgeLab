import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { spawn } from "child_process"

// Run path: process.cwd() is frontend directory
const RUN_DIR = path.join(process.cwd(), ".agent_run")
const VENV_DIR = path.join(RUN_DIR, ".venv")
// On Windows, the python executable is under Scripts/python.exe
const PYTHON_EXE = path.join(VENV_DIR, "Scripts", "python.exe")
const PIP_EXE = path.join(VENV_DIR, "Scripts", "pip.exe")

function executeCommand(command: string, args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const process = spawn(command, args, { cwd, shell: true })
    let stdout = ""
    let stderr = ""

    process.stdout.on("data", (data) => {
      stdout += data.toString()
    })

    process.stderr.on("data", (data) => {
      stderr += data.toString()
    })

    process.on("close", (code) => {
      resolve({ stdout, stderr, code: code ?? 0 })
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, files, env, history } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }

    if (!files || !files["agent.py"]) {
      return NextResponse.json({ error: "Missing agent code files" }, { status: 400 })
    }

    // 1. Ensure run directory exists
    if (!fs.existsSync(RUN_DIR)) {
      fs.mkdirSync(RUN_DIR, { recursive: true })
    }

    // 2. Write agent files
    let agentCode = files["agent.py"] || ""

    // 1. Schedule meeting patching
    if (agentCode.includes("def schedule_meeting(") && (agentCode.includes("credentials.json") || agentCode.includes("InstalledAppFlow"))) {
      const startIdx = agentCode.indexOf("def schedule_meeting(")
      let endIdx = agentCode.indexOf("def ", startIdx + 20)
      if (endIdx === -1) endIdx = agentCode.indexOf("# --- Agent Definitions ---", startIdx)
      if (endIdx === -1) endIdx = agentCode.length

      const oldFunc = agentCode.substring(startIdx, endIdx)
      const newFunc = `def schedule_meeting(summary, start_time, end_time):
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
    return event.get('id')

`
      agentCode = agentCode.replace(oldFunc, newFunc)
    }

    // 2. Send email patching
    if (agentCode.includes("def send_email(") && (agentCode.includes("credentials.json") || agentCode.includes("InstalledAppFlow"))) {
      const startIdx = agentCode.indexOf("def send_email(")
      let endIdx = agentCode.indexOf("def ", startIdx + 15)
      if (endIdx === -1) endIdx = agentCode.indexOf("# --- Agent Definitions ---", startIdx)
      if (endIdx === -1) endIdx = agentCode.length

      const oldFunc = agentCode.substring(startIdx, endIdx)
      const newFunc = `def send_email(to, subject, body):
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
    return "Email sent successfully"

`
      agentCode = agentCode.replace(oldFunc, newFunc)
    }

    fs.writeFileSync(path.join(RUN_DIR, "agent.py"), agentCode)
    if (files["requirements.txt"]) {
      fs.writeFileSync(path.join(RUN_DIR, "requirements.txt"), files["requirements.txt"])
    } else {
      fs.writeFileSync(path.join(RUN_DIR, "requirements.txt"), "openai\nrequests\npython-dotenv\ngoogle-api-python-client\ngoogle-auth\ngoogle-auth-oauthlib\ngoogle-auth-httplib2\nbeautifulsoup4\n")
    }

    // 3. Write environment variables (.env)
    const finalEnv = { ...(env || {}) }
    const googleToken = finalEnv.GOOGLE_ACCESS_TOKEN || finalEnv.GMAIL_API_KEY || finalEnv.GOOGLE_API_KEY || finalEnv.GOOGLE_CALENDAR_API_KEY || ""
    if (googleToken) {
      if (!finalEnv.GMAIL_API_KEY) finalEnv.GMAIL_API_KEY = googleToken
      if (!finalEnv.GOOGLE_API_KEY) finalEnv.GOOGLE_API_KEY = googleToken
      if (!finalEnv.GOOGLE_CALENDAR_API_KEY) finalEnv.GOOGLE_CALENDAR_API_KEY = googleToken
      if (!finalEnv.GOOGLE_ACCESS_TOKEN) finalEnv.GOOGLE_ACCESS_TOKEN = googleToken
    }
    if (!finalEnv.GOOGLE_CALENDAR_ID) {
      finalEnv.GOOGLE_CALENDAR_ID = "primary"
    }

    const envContent = Object.entries(finalEnv)
      .map(([key, val]) => `${key}=${val}`)
      .join("\n")
    fs.writeFileSync(path.join(RUN_DIR, ".env"), envContent)

    // 3.5 Write history file if provided
    const historyFile = path.join(RUN_DIR, "history.json")
    if (history && Array.isArray(history)) {
      const formattedHistory = history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      }))
      fs.writeFileSync(historyFile, JSON.stringify(formattedHistory))
    } else {
      if (fs.existsSync(historyFile)) {
        fs.unlinkSync(historyFile)
      }
    }

    // 4. Write runner script
    const runnerCode = `import os
import sys
import json
import io
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import agent
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    from agent import root_agent
except Exception as e:
    import traceback
    print(json.dumps({"success": False, "error": f"Import Error: {str(e)}", "traceback": traceback.format_exc()}))
    sys.exit(1)

def main():
    prompt = sys.argv[1] if len(sys.argv) > 1 else ""
    if not prompt:
        print(json.dumps({"success": False, "error": "No prompt provided"}))
        sys.exit(1)
        
    # Redirect stdout to capture agent execution logs
    old_stdout = sys.stdout
    sys.stdout = io.StringIO()
    
    try:
        # Load history if present
        messages = None
        history_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "history.json")
        if os.path.exists(history_path):
            try:
                with open(history_path, "r") as f:
                    history_data = json.load(f)
                messages = [{"role": "system", "content": root_agent.instruction}]
                for msg in history_data:
                    # Skip client-side welcome message to keep agent context clean
                    if msg.get("role") == "assistant" and "Hello! I'm your newly created" in msg.get("content", ""):
                        continue
                    if msg.get("role") in ("user", "assistant") and msg.get("content"):
                        messages.append({"role": msg["role"], "content": msg["content"]})
            except Exception:
                pass

        # Run agent
        final_output = root_agent.run(prompt, messages=messages)
        
        # Get logs and restore stdout
        captured_logs = sys.stdout.getvalue()
        sys.stdout = old_stdout
        
        print(json.dumps({
            "success": True, 
            "output": final_output, 
            "logs": captured_logs
        }))
    except Exception as e:
        import traceback
        captured_logs = sys.stdout.getvalue()
        sys.stdout = old_stdout
        print(json.dumps({
            "success": False, 
            "error": str(e), 
            "traceback": traceback.format_exc(),
            "logs": captured_logs
        }))

if __name__ == "__main__":
    main()
`
    fs.writeFileSync(path.join(RUN_DIR, "runner.py"), runnerCode)

    // 5. Ensure virtual environment exists and is populated
    let needsInstall = !fs.existsSync(PYTHON_EXE)
    if (!needsInstall) {
      // Test if core dependencies (openai, googleapiclient, google_auth_oauthlib) can be imported
      const testRes = await executeCommand(PYTHON_EXE, ["-c", "\"import openai, googleapiclient, google_auth_oauthlib\""], RUN_DIR)
      if (testRes.code !== 0) {
        needsInstall = true
      }
    }

    if (needsInstall) {
      if (!fs.existsSync(PYTHON_EXE)) {
        const venvRes = await executeCommand("python", ["-m", "venv", ".venv"], RUN_DIR)
        if (venvRes.code !== 0) {
          return NextResponse.json({
            error: "Failed to create python virtual environment",
            details: venvRes.stderr || venvRes.stdout
          }, { status: 500 })
        }
      }

      // Install dependencies including requests, python-dotenv, and openai
      const pipRes = await executeCommand(PIP_EXE, ["install", "-r", "requirements.txt"], RUN_DIR)
      if (pipRes.code !== 0) {
        return NextResponse.json({
          error: "Failed to install agent python requirements",
          details: pipRes.stderr || pipRes.stdout
        }, { status: 500 })
      }
    }

    // 6. Execute the runner with user's prompt
    const runRes = await executeCommand(PYTHON_EXE, ["runner.py", `"${prompt.replace(/"/g, '\\"')}"`], RUN_DIR)
    
    // Parse the JSON output from the script
    let result
    try {
      // Find the first line containing JSON output
      const jsonLine = runRes.stdout.trim().split("\n").find(line => line.startsWith('{"success"'))
      if (jsonLine) {
        result = JSON.parse(jsonLine)
      } else {
        throw new Error("Invalid output format from Python script")
      }
    } catch (e) {
      return NextResponse.json({
        error: "Failed to execute or parse agent run output",
        stdout: runRes.stdout,
        stderr: runRes.stderr
      }, { status: 500 })
    }

    if (!result.success) {
      return NextResponse.json({
        error: result.error,
        traceback: result.traceback
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      output: result.output,
      logs: {
        stdout: result.logs || runRes.stdout,
        stderr: runRes.stderr
      }
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
