# 🛠️ MechaForge Lab

**MechaForge Lab** is a visual Meta-Agent builder and local execution studio. It allows you to design complex AI agent architectures (including Sequential, Parallel, and Loop structures) using natural language, configure customized Python tools, and execute them locally in a secure sandbox.

---

## 🌟 Key Features

*   **🗣️ Natural Language to Agent Code**: Describe your agent's objective in plain English and automatically compile it into structured, executable Python code.
*   **🔌 Triple LLM Provider Support**: Toggle seamlessly between **Oxlo (DeepSeek)**, **Groq (Llama 3)**, and **Gemini** to power your agent creation and execution loops.
*   **🛠️ Pre-Authenticated Google Integration**: Connect your Google Account in the settings menu once. Gmail and Google Calendar tools will automatically authenticate using secure, short-lived tokens, completely bypassing complex local credential configurations (`credentials.json`).
*   **🧠 Persistent Session Memory**: Automatically maintains full multi-turn conversational history across stateless Python process executions.
*   **📊 Interactive Agent visualizer**: Graphically view your multi-agent architecture and customize individual agent instructions, parameters, and tools.

---

## 🏗️ Folder Structure

```text
MechaForgeLab/
├── frontend/                  # Next.js Frontend App
│   ├── app/                   # App Router (UI Pages & Server APIs)
│   ├── components/            # React Components (Agent Chat, config, ReactFlow Graph)
│   ├── lib/                   # API bindings & Code Generator logic
│   └── package.json           # Frontend package dependencies
└── README.md                  # This file
```

---

## 🚀 Getting Started & Local Testing

### Prerequisites
*   **Node.js 18+**
*   **Python 3.9+**

### 1. Setup and Launch the Web Studio
Clone the repository, navigate to the `frontend` folder, and start the Next.js server:

```bash
cd frontend
npm install
npm run build
npm run start
```
Now, open your browser and navigate to **`http://localhost:3000`**.

### 2. Configure Your API Keys & Google Account
1.  Click the **Key Icon (🔑)** in the top-right header.
2.  Input your **Oxlo Key**, **Groq Key**, or **Gemini Key**.
3.  Under **Google Integration**, click **`🔐 Connect Google Account`** to securely authorize Gmail & Calendar access.
4.  Click **Save Keys**.

### 3. Build Your First Agent
1.  In the left sidebar, type:
    > *Create a multi-agent system containing a meeting scheduler agent that can schedule meetings on Google Calendar and send confirmation emails using Gmail.*
2.  Click **Build Agent** and watch the structural graph generate.
3.  Switch the chat pane toggle (top-right of the chat window) from **`Simulated Chat`** to **`Live (Python)`** to execute the Python runtime.
4.  Test the agent live:
    > *Schedule a 30-minute meeting called "Project Review" for tomorrow at 2 PM, and send a confirmation email to recipient@example.com summarizing the details.*
