<div align="center">

<!-- LOGO / BANNER -->


![MechaForge Lab](https://capsule-render.vercel.app/api?type=waving&color=gradient&text=MechaForge%20Lab&height=200)

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

<br/>

> **Translate natural language into production-ready AI agent architectures.**  
> Visualize. Compile. Execute. Download.

<br/>

</div>

---

## 📺 Demo & Walkthrough

<div align="center">

<!-- 🎬 REPLACE THIS with your actual YouTube thumbnail URL and video link -->
[![MechaForge Lab Demo](https://img.youtube.com/vi/-TBdpMjnUQU/maxresdefault.jpg)](https://youtu.be/-TBdpMjnUQU)

*▶ Click to watch the full demo on YouTube*

</div>

---

## ✨ What is MechaForge Lab?

**MechaForge Lab** is a visual Meta-Agent builder and local execution studio. It empowers developers and workflow engineers to translate natural language descriptions into fully functional, production-ready AI agent architectures — visualize their structures, and execute them safely inside a local sandbox using real-world integrations.

```
You describe your agent in plain English.
MechaForge compiles, runs, and lets you download a complete standalone Python package.
```

---

## 🌟 The Problem It Solves

Building multi-agent systems today is painful:

- 🔧 **Endless boilerplate** — wiring tools, credentials, and orchestration by hand
- 🧩 **Framework complexity** — LangChain, AutoGen, ADK all require deep expertise
- 🔐 **Credential hell** — manually setting up OAuth, env vars, and API keys
- 🕳️ **Prototype-to-execution gap** — your visual idea never makes it to running code

**MechaForge Lab bridges all of this** in a single studio: describe → visualize → compile → run → download.

---

## 🎯 Who Is It For?

| Persona | Use Case |
|---------|----------|
| 🧑‍💻 **AI Developers & Prototypers** | Quickly scaffold and test multi-agent setups without boilerplate |
| ⚙️ **Workflow Engineers** | Automate tasks across Google Sheets, Drive, search engines, and email |
| 🚀 **Enthusiasts & Learners** | Explore agentic workflows without getting bogged down in framework code |

---

## ⚖️ How Is This Different from n8n, Make, or Zapier?

> MechaForge Lab is **not** a deterministic flowchart tool.

| Feature | n8n / Make / Zapier | **MechaForge Lab** |
|---|---|---|
| Execution model | Pre-defined node A → node B | **LLM-driven autonomous reasoning** |
| Tool selection | Hardcoded per flow | **Dynamic — agent decides at runtime** |
| Orchestration | Linear / branching flows | **Sequential, Parallel, Loop ADK schemas** |
| Output | Hosted runtime lock-in | **100% standalone local Python package** |
| Sub-agent control | Not supported | **Sub-agents collaborate & transfer control** |

---

## 🏗️ System Architecture & Workflow

<div align="center">

![MechaForge Lab Architecture](./architecture.png)

</div>

The pipeline flows through five stages:

```
User Prompt
    │
    ▼
Next.js Web UI Studio
    │
    ▼
Meta-Agent Orchestrator  (Oxlo / DeepSeek / Groq / Gemini)
    │
    ▼
AgentProjectConfig JSON
    ├──────────────────────────┐
    ▼                          ▼
Visual ReactFlow Graph    Python Code Generator
                               │
                               ▼
                          agent.py / runner.py
                               │
                               ▼
                     Local Python Sandbox (.venv)
                               │
                               ▼
                          Runner Process
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       Google Sheets      Google Drive    DuckDuckGo / Wikipedia
              └────────────────┼────────────────┘
                               ▼
                        Active LLM (Groq / Oxlo / Gemini)
```

### Pipeline Stages

1. **Orchestration** — The frontend sends the builder prompt to the Meta-Agent Orchestrator (powered by Oxlo/DeepSeek, Groq, or Gemini).
2. **Structural Visualizer** — The LLM returns an `AgentProjectConfig` JSON block that ReactFlow parses to render an interactive node graph.
3. **Local Compilation** — The code generator writes a self-contained Python agent bundle (`agent.py`, `runner.py`, `requirements.txt`, `.env`) to a local execution directory (`.agent_run`).
4. **Sandbox Execution** — The backend runs the Python script inside a virtual environment (`.venv`), queries the selected LLM, and streams tool results and logs back to the web console.

---

## 💻 Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| **Frontend** | Next.js (React 19, TypeScript), TailwindCSS, Radix UI, Lucide Icons |
| **Visualization** | ReactFlow — node maps, parameters, instructions, tools |
| **Agent Sandbox** | Local Python 3.9+ via `child_process.spawn` |
| **LLMs** | Oxlo.ai (DeepSeek-V4/V3), Groq (Llama 3), Google Gemini (2.0/3.0) |

</div>

---

## 🔧 Google ADK: Model-Agnostic Evolution

Originally built around the **Google Agent Development Kit (ADK)** — designed exclusively for Gemini — MechaForge Lab modifies this schema into a **model-agnostic runtime**.

- **Unified OpenAI-Compatible Client** — A wrapper in the generated Python runtime binds different API signatures (Groq, Gemini, Oxlo) into standard OpenAI SDK completions.
- **Flexible Config Mapping** — System instructions, schemas, and completion parameters are dynamically normalized in the backend, allowing a Llama or DeepSeek model to plan and execute with the same accuracy as a native Gemini model.

---

## 🛠️ Sandbox Tools

MechaForge Lab provides **six pre-authenticated, ready-to-use** core tools out of the box:

| Category | Tool | Behavior |
|---|---|---|
| 🔍 **Search** | `web_search` | Routes queries to DuckDuckGo (news/docs) or Wikipedia (facts) with progressive fallback. No API keys required. |
| 🌐 **Scraper** | `scrape_web_page` | Fetches a URL and strips HTML, returning clean text. |
| 📊 **Google Sheets** | `read_google_sheet` | Reads cell ranges using the active Google access token. |
| 📊 **Google Sheets** | `append_to_google_sheet` | Appends data rows using the user's active access token. |
| 📁 **Google Drive** | `list_drive_files` | Searches and lists documents in your connected Drive. |
| 📁 **Google Drive** | `upload_to_drive` | Uploads Markdown or plain-text files directly to Drive. |

---

## 🔒 Security & Privacy

Your credentials are never stored or leaked.

- **Short-Lived Access Tokens** — OAuth 2.0 authorization stores only ephemeral Google Access Tokens in cookie stores and session state. No refresh tokens or `credentials.json` are ever written to disk.
- **Secure Environment Variables** — Tokens are fed directly to the spawned sandbox Python process via memory-isolated env vars (`GOOGLE_ACCESS_TOKEN`), keeping them safe from log dumps.
- **No Codebase Leakage** — The credential config file `frontend/lib/api-key.ts` is tracked with Git's `--assume-unchanged` index flag. Your API keys and local secrets are never pushed to public repositories.

---

## 🚀 Local Setup & Testing

### Prerequisites

- Node.js 18+
- Python 3.9+ (ensure `python` is in your system `PATH`)

### 1. Launch the Studio

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 2. Configure Google Cloud Console Credentials

> Required for Google Sheets, Drive, and login integration.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable these APIs:
   - Google Sheets API
   - Google Drive API
   - Gmail API
   - Google Calendar API
3. Go to **APIs & Services → OAuth consent screen**, configure an external app, and add your email as a test user.
4. Go to **Credentials → Create Credentials → OAuth Client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy your **Client ID** and **Client Secret** into `frontend/.env.local`:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

6. Restart the dev server: `npm run dev`

---

### 3. Verification Prompts

#### 🏗️ Agent Creation Prompt

Enter this in the prompt box on the landing page:

```
Create an agent that can read and write data to Google Sheets
and upload text or markdown files to Google Drive.
```

#### ▶️ Tool Action Prompt

1. Click **🔐 Connect Google Account** in the top header.
2. Toggle to **Live (Python) mode** in the chat interface.
3. Run this execution command:

```
Write the values ["Test Row", "Testing Google Sheets Tool", "Success"]
to the spreadsheet 1TTrBCX9G...
```

---

## 📁 Project Structure

```
mechaforge-lab/
├── frontend/                  # Next.js web studio
│   ├── app/                   # App router pages
│   ├── components/            # React components + ReactFlow nodes
│   ├── lib/                   # API clients, auth, utilities
│   └── .env.local             # 🔐 Your local credentials (git-ignored)
├── .agent_run/                # 🤖 Generated agent bundles (auto-created)
│   ├── agent.py               # LLM-powered agent logic
│   ├── runner.py              # Venv bootstrapper + executor
│   ├── requirements.txt       # Agent dependencies
│   └── .env                   # Runtime environment variables
└── README.md
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer" width="100%"/>

**Built with ❤️ by the MechaForge Team**

⭐ Star this repo if you find it useful!

</div>
