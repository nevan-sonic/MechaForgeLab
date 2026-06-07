export type Provider = "gemini" | "groq" | "oxlo"

const PROVIDER_KEY = "mechaforge_api_provider"
const GEMINI_KEY = "mechaforge_gemini_api_key"
const GROQ_KEY = "mechaforge_groq_api_key"
const OXLO_KEY = "mechaforge_oxlo_api_key"

// Migration logic for old keys
if (typeof window !== "undefined") {
  const oldProvider = localStorage.getItem("bleach_api_provider")
  if (oldProvider && !localStorage.getItem(PROVIDER_KEY)) {
    localStorage.setItem(PROVIDER_KEY, oldProvider)
    localStorage.removeItem("bleach_api_provider")
  }
  const oldGemini = localStorage.getItem("bleach_gemini_api_key")
  if (oldGemini && !localStorage.getItem(GEMINI_KEY)) {
    localStorage.setItem(GEMINI_KEY, oldGemini)
    localStorage.removeItem("bleach_gemini_api_key")
  }
  const oldGroq = localStorage.getItem("bleach_groq_api_key")
  if (oldGroq && !localStorage.getItem(GROQ_KEY)) {
    localStorage.setItem(GROQ_KEY, oldGroq)
    localStorage.removeItem("bleach_groq_api_key")
  }
  const oldOxlo = localStorage.getItem("bleach_oxlo_api_key")
  if (oldOxlo && !localStorage.getItem(OXLO_KEY)) {
    localStorage.setItem(OXLO_KEY, oldOxlo)
    localStorage.removeItem("bleach_oxlo_api_key")
  }
}

const DEFAULT_GEMINI_KEY = ""
const DEFAULT_GROQ_KEY = ""
const DEFAULT_OXLO_KEY = ""

export function getProvider(): Provider {
  if (typeof window === "undefined") return "oxlo"
  const provider = localStorage.getItem(PROVIDER_KEY) as Provider
  if (provider === "oxlo" || provider === "gemini" || provider === "groq") return provider
  
  localStorage.setItem(PROVIDER_KEY, "oxlo")
  return "oxlo"
}

export function setProvider(provider: Provider): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PROVIDER_KEY, provider)
}

export function getApiKey(provider?: Provider): string {
  if (typeof window === "undefined") return ""
  const activeProvider = provider || getProvider()
  
  if (activeProvider === "gemini") {
    const stored = localStorage.getItem(GEMINI_KEY)
    return stored || ""
  } else if (activeProvider === "groq") {
    const stored = localStorage.getItem(GROQ_KEY)
    return stored || ""
  } else {
    const stored = localStorage.getItem(OXLO_KEY)
    return stored || ""
  }
}

export function setApiKey(provider: Provider, key: string): void {
  if (typeof window === "undefined") return
  let storageKey = GROQ_KEY
  if (provider === "gemini") storageKey = GEMINI_KEY
  else if (provider === "oxlo") storageKey = OXLO_KEY
  localStorage.setItem(storageKey, key.trim())
}
