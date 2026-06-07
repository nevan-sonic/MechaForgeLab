import JSZip from "jszip"
import { AgentProjectConfig, AgentConfig, ToolConfig } from "@/types/agent-config"

const RUNTIME_BOILERPLATE = `import inspect
import json
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_client_and_model():
    provider = os.environ.get("LLM_PROVIDER", "oxlo").lower()
    api_key = os.environ.get("API_KEY", "")
    
    if provider == "oxlo":
        client = OpenAI(
            base_url="https://api.oxlo.ai/v1",
            api_key=api_key or os.environ.get("OXLO_API_KEY", "")
        )
        model = os.environ.get("MODEL_NAME", "deepseek-v4-flash")
    elif provider == "groq":
        client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=api_key or os.environ.get("GROQ_API_KEY", "")
        )
        model = os.environ.get("MODEL_NAME", "llama-3.3-70b-versatile")
    elif provider == "gemini":
        client = OpenAI(
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key=api_key or os.environ.get("GEMINI_API_KEY", "")
        )
        model = os.environ.get("MODEL_NAME", "gemini-2.0-flash")
    else:
        client = OpenAI(
            api_key=api_key or os.environ.get("OPENAI_API_KEY", "")
        )
        model = os.environ.get("MODEL_NAME", "gpt-4o-mini")
        
    return client, model

def function_to_schema(func, custom_description=None):
    sig = inspect.signature(func)
    doc = func.__doc__ or ""
    description = doc.strip().split("\\n")[0] if doc else (custom_description or f"Call {func.__name__}")
    
    properties = {}
    required = []
    
    for param_name, param in sig.parameters.items():
        if param_name in ('self', 'cls', 'context'):
            continue
            
        param_type = "string"
        if param.annotation != inspect.Parameter.empty:
            if param.annotation == int:
                param_type = "integer"
            elif param.annotation == float:
                param_type = "number"
            elif param.annotation == bool:
                param_type = "boolean"
            elif param.annotation == list:
                param_type = "array"
            elif param.annotation == dict:
                param_type = "object"
                
        properties[param_name] = {
            "type": param_type,
            "description": f"The {param_name} parameter."
        }
        
        if param.default == inspect.Parameter.empty:
            required.append(param_name)
            
    return {
        "type": "function",
        "function": {
            "name": func.__name__,
            "description": description,
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": required
            }
        }
    }

class Agent:
    def __init__(self, name, instruction, tools=None, sub_agents=None, description=""):
        self.name = name
        self.instruction = instruction
        self.description = description or instruction
        self.tools_map = {}
        self.tools_schema = []
        
        if tools:
            for t in tools:
                if callable(t):
                    self.tools_map[t.__name__] = t
                    self.tools_schema.append(function_to_schema(t))
                elif isinstance(t, Agent):
                    self._register_sub_agent(t)
                    
        if sub_agents:
            for sa in sub_agents:
                self._register_sub_agent(sa)

    def _register_sub_agent(self, agent):
        def delegate_to_agent(**kwargs):
            query = kwargs.get("query") or kwargs.get("prompt") or ""
            return agent.run(query)
            
        delegate_to_agent.__name__ = f"transfer_to_{agent.name}"
        delegate_to_agent.__doc__ = f"Transfer control or delegate the task to {agent.name}. Description: {agent.description}"
        
        self.tools_map[delegate_to_agent.__name__] = delegate_to_agent
        self.tools_schema.append(function_to_schema(delegate_to_agent))

    def run(self, prompt, client=None, model=None, messages=None):
        if not client or not model:
            client, model = get_client_and_model()
            
        if messages is None:
            messages = [
                {"role": "system", "content": self.instruction},
                {"role": "user", "content": prompt}
            ]
        else:
            messages.append({"role": "user", "content": prompt})
            
        max_iterations = 10
        for i in range(max_iterations):
            kwargs = {
                "model": model,
                "messages": messages
            }
            if self.tools_schema:
                kwargs["tools"] = self.tools_schema
                
            response = client.chat.completions.create(**kwargs)
            message = response.choices[0].message
            messages.append(message)
            
            if message.content:
                print(f"[{self.name}] Response: {message.content}")
                
            if not message.tool_calls:
                return message.content or ""
                
            for tool_call in message.tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)
                
                print(f"[{self.name}] Calling tool: {func_name}({json.dumps(func_args)})")
                
                if func_name in self.tools_map:
                    try:
                        tool_result = self.tools_map[func_name](**func_args)
                        print(f"[{self.name}] Tool result: {tool_result}")
                    except Exception as e:
                        tool_result = f"Error executing tool: {str(e)}"
                        print(f"[{self.name}] Tool error: {tool_result}")
                else:
                    tool_result = f"Error: Tool {func_name} not found."
                    print(f"[{self.name}] Tool error: {tool_result}")
                    
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": func_name,
                    "content": str(tool_result)
                })
                
        return "Error: Maximum tool call iterations reached."

class SequentialAgent(Agent):
    def __init__(self, name, description, sub_agents):
        super().__init__(name, f"Sequential agent executor for: {name}", description=description)
        self.sub_agents = sub_agents
        
    def run(self, prompt, client=None, model=None, messages=None):
        current_input = prompt
        for agent in self.sub_agents:
            current_input = agent.run(current_input, client, model)
        return current_input

class ParallelAgent(Agent):
    def __init__(self, name, description, sub_agents):
        super().__init__(name, f"Parallel agent executor for: {name}", description=description)
        self.sub_agents = sub_agents
        
    def run(self, prompt, client=None, model=None, messages=None):
        results = []
        for agent in self.sub_agents:
            res = agent.run(prompt, client, model)
            results.append(f"[{agent.name}]: {res}")
        return "\\n\\n".join(results)

class LoopAgent(Agent):
    def __init__(self, name, description, sub_agents):
        super().__init__(name, f"Loop agent executor for: {name}", description=description)
        self.sub_agent = sub_agents[0] if isinstance(sub_agents, list) else sub_agents
        
    def run(self, prompt, client=None, model=None, messages=None):
        current_input = prompt
        for _ in range(3):
            current_input = self.sub_agent.run(current_input, client, model)
        return current_input
`

function sanitizeVarName(name: string): string {
  return name.replace(/[-\s]+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
}

function extractFunctionName(code: string, fallback: string): string {
  const match = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/)
  return match ? match[1] : sanitizeVarName(fallback)
}

class AgentCodeGenerator {
  generateAndDownload = async (config: AgentProjectConfig) => {
    const zip = new JSZip()
    
    // Generate agent.py
    const agentPy = this.generateAgentFile(config)
    zip.file("agent.py", agentPy)
    
    // Generate __init__.py
    zip.file("__init__.py", "# Generated agent package\n")
    
    // Generate requirements.txt
    const requirements = this.generateRequirementsFile(config)
    zip.file("requirements.txt", requirements)
    
    // Generate README.md
    const readme = this.generateReadmeFile(config)
    zip.file("README.md", readme)
    
    // Generate .env.example
    const envExample = this.generateEnvExampleFile(config)
    zip.file(".env.example", envExample)
    
    // Generate blob and download
    const content = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(content)
    const link = document.createElement("a")
    link.href = url
    link.download = `${config.project_name || "agent"}-project.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  public generateAgentFile(config: AgentProjectConfig): string {
    const imports = this.collectImports(config)
    const customFunctions = this.generateCustomFunctions(config)
    const agentDefinitions = this.generateAgentDefinitions(config)

    return `# Generated by MechaForge Lab
"""
${config.project_name}: ${config.description}
"""

${imports.join("\n")}

# --- Model-Agnostic Agent Runtime ---
${RUNTIME_BOILERPLATE}

# --- Custom Tools ---
${customFunctions}

# --- Agent Definitions ---
${agentDefinitions}

# Main agent (entry point)
root_agent = ${sanitizeVarName(config.main_agent)}
`
  }

  private collectImports(config: AgentProjectConfig): string[] {
    const imports = new Set<string>()

    let hasCustomFunctions = false
    for (const tool of Object.values(config.tools)) {
      if (tool.type === "custom_function") {
        hasCustomFunctions = true
        if (tool.imports) {
          tool.imports.forEach((imp) => {
            const trimmed = imp.trim()
            if (trimmed.startsWith("import ") || trimmed.startsWith("from ")) {
              imports.add(trimmed)
            } else {
              imports.add(`import ${trimmed}`)
            }
          })
        }
      }
    }

    if (hasCustomFunctions) {
      imports.add("from typing import List, Dict, Any, Optional")
    }

    return Array.from(imports).sort()
  }

  private generateCustomFunctions(config: AgentProjectConfig): string {
    const customFunctions: string[] = []
    for (const tool of Object.values(config.tools)) {
      if (tool.type === "custom_function" && tool.function_code) {
        customFunctions.push(`# Tool: ${tool.description}`)
        customFunctions.push(tool.function_code.trim())
        customFunctions.push("")
      }
    }
    return customFunctions.join("\n")
  }

  private generateAgentDefinitions(config: AgentProjectConfig): string {
    const agentDefinitions: string[] = []
    const sortedAgentNames = this.sortAgentsByDependency(config)

    for (const name of sortedAgentNames) {
      const agent = config.agents[name]
      if (!agent) continue
      
      let code = ""
      if (agent.type === "llm_agent") {
        const toolsList = agent.tools
          .map((t) => {
            const tool = config.tools[t]
            if (!tool) return null
            if (tool.type === "builtin") {
              return null
            } else {
              return extractFunctionName(tool.function_code || "", t)
            }
          })
          .filter(Boolean)
          .join(", ")

        const subAgentsList = agent.sub_agents.length > 0 ? agent.sub_agents.map(sanitizeVarName).join(", ") : ""

        code = `# ${agent.description}
${sanitizeVarName(name)} = Agent(
    name="${name}",
    instruction="""
    ${agent.instruction || 'You are a helpful AI assistant.'}
    """,
    description="""
    ${agent.description}
    """`
        if (toolsList) code += `,\n    tools=[${toolsList}]`
        if (subAgentsList) code += `,\n    sub_agents=[${subAgentsList}]`
        code += "\n)"
      } else if (agent.type === "sequential_agent") {
        code = `# ${agent.description}
${sanitizeVarName(name)} = SequentialAgent(
    name="${name}",
    description="""
    ${agent.description}
    """,
    sub_agents=[${agent.sub_agents.map(sanitizeVarName).join(", ")}]
)`
      } else if (agent.type === "parallel_agent") {
        code = `# ${agent.description}
${sanitizeVarName(name)} = ParallelAgent(
    name="${name}",
    description="""
    ${agent.description}
    """,
    sub_agents=[${agent.sub_agents.map(sanitizeVarName).join(", ")}]
)`
      } else if (agent.type === "loop_agent") {
        const sub = agent.sub_agents[0] ? sanitizeVarName(agent.sub_agents[0]) : "None"
        code = `# ${agent.description}
${sanitizeVarName(name)} = LoopAgent(
    name="${name}",
    description="""
    ${agent.description}
    """,
    sub_agents=[${sub}]
)`
      }
      agentDefinitions.push(code)
      agentDefinitions.push("")
    }
    return agentDefinitions.join("\n")
  }

  private sortAgentsByDependency(config: AgentProjectConfig): string[] {
    const sorted: string[] = []
    const remaining = new Set(Object.keys(config.agents))

    while (remaining.size > 0) {
      let ready: string[] = []
      for (const name of remaining) {
        const agent = config.agents[name]
        if (agent.sub_agents.every((sub) => sorted.includes(sub))) {
          ready.push(name)
        }
      }
      if (ready.length === 0) {
        ready = Array.from(remaining)
      }
      ready.forEach((name) => {
        sorted.push(name)
        remaining.delete(name)
      })
    }
    return sorted
  }

  public generateRequirementsFile(config: AgentProjectConfig): string {
    const requirements = new Set<string>()
    requirements.add("openai")
    requirements.add("python-dotenv")
    requirements.add("google-api-python-client")
    requirements.add("google-auth")
    requirements.add("google-auth-oauthlib")
    requirements.add("google-auth-httplib2")
    requirements.add("requests")
    if (config.requirements) {
      config.requirements.forEach((req) => {
        if (!req.startsWith("google-adk")) {
          requirements.add(req)
        }
      })
    }
    for (const tool of Object.values(config.tools)) {
      if (tool.type === "custom_function" && tool.dependencies) {
        tool.dependencies.forEach((dep) => requirements.add(dep))
      }
    }
    return Array.from(requirements).sort().join("\n")
  }

  private generateReadmeFile(config: AgentProjectConfig): string {
    const agentDocs = Object.entries(config.agents)
      .map(([name, agent]) => `- **${name}** (${agent.type}): ${agent.description}`)
      .join("\n")
    const toolDocs = Object.entries(config.tools)
      .map(([name, tool]) => `- **${name}** (${tool.type}): ${tool.description}`)
      .join("\n")

    return `# ${config.project_name.toUpperCase()}

${config.description}

## Overview
This agent was automatically generated using MechaForge Lab.

**Main Agent**: ${config.main_agent}
**Version**: ${config.version}

## Setup
1. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`
2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your values
   \`\`\`
3. Run the agent:
   \`\`\`bash
   python agent.py "Your prompt here"
   \`\`\`

## Architecture
### Agents
${agentDocs}

### Tools
${toolDocs}
`
  }

  public generateEnvExampleFile(config: AgentProjectConfig): string {
    const lines = [
      "# Environment variables for the agent",
      "# Copy this file to .env and fill in actual values",
      "",
      "# LLM configuration",
      "LLM_PROVIDER=oxlo",
      "MODEL_NAME=deepseek-v4-flash",
      "API_KEY=sk_your_oxlo_api_key_here",
      "OXLO_API_KEY=sk_your_oxlo_api_key_here",
      "GROQ_API_KEY=gsk_your_groq_api_key_here",
      "GEMINI_API_KEY=AIzaSy_your_gemini_api_key_here",
      "",
      "# Google credentials for tool execution",
      "GOOGLE_ACCESS_TOKEN=ya29.your_google_token_here",
      ""
    ]
    return lines.join("\n")
  }
}

export const codeGenerator = new AgentCodeGenerator()
