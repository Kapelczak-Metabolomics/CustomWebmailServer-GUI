import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import type { Theme } from "./types"

export const DARK = {
  appBg: "#070B14",
  sidebarBg: "#070B14",
  sidebarBorder: "#1C2540",
  listBg: "#0A0F1A",
  listBorder: "#1C2540",
  readBg: "#070B14",
  readMain: "#070B14",
  readLeftBg: "#0A0F1A",
  readTopBg: "#0A0F1A",
  card: "#0E1420",
  cardBorder: "#1C2540",
  inputBg: "#111827",
  inputBorder: "#1C2540",
  composeBg: "#0E1420",
  composeHead: "#1C2540",
  text: "#E8EDF5",
  textSub: "#8B96B0",
  textMuted: "#6B7A96",
  textFaint: "#4A5A7A",
  textGhost: "#3A4A6A",
  textGhost2: "#2D3A5C",
  divider: "#1C2540",
  rowHover: "#ffffff04",
  rowSelected: "#2896E810",
  navActive: "#2896E820",
  navHover: "#ffffff08",
  pill: "#111827",
  pillBorder: "#1C2540",
  pillText: "#6B7A96",
  badgeBg: "#1C2540",
  badgeText: "#8B96B0",
  unreadDot: "#2896E8",
  accent: "#2896E8",
  accentGrad: "linear-gradient(135deg, #2896E8 0%, #1565C0 100%)",
  accentGlow: "0 4px 16px rgba(40,150,232,0.35)",
  replyBorder: "#2896E840",
  btnSecBg: "#0E1420",
  btnSecBorder: "#1C2540",
  btnSecText: "#8B96B0",
  btnSecHover: "#151C2C",
  starActive: "#F59E0B",
  starInactive: "#4A5A7A",
  attachColor: "#4A5A7A",
  composeComposeBorder: "#2D3A5C",
  scrollThumb: "#1C2540",
  shadow: "0 20px 60px rgba(0,0,0,0.6)",
}

export const LIGHT = {
  appBg: "#F0F4FA",
  sidebarBg: "#FFFFFF",
  sidebarBorder: "#E2E8F4",
  listBg: "#F7F9FD",
  listBorder: "#E2E8F4",
  readBg: "#F0F4FA",
  readMain: "#F0F4FA",
  readLeftBg: "#FFFFFF",
  readTopBg: "#FFFFFF",
  card: "#FFFFFF",
  cardBorder: "#E2E8F4",
  inputBg: "#EEF2FA",
  inputBorder: "#D8E0F0",
  composeBg: "#FFFFFF",
  composeHead: "#F0F4FA",
  composeComposeBorder: "#D0D8EC",
  text: "#0F1729",
  textSub: "#374163",
  textMuted: "#5A6480",
  textFaint: "#8894B0",
  textGhost: "#A0AACC",
  textGhost2: "#BCC5DF",
  divider: "#E2E8F4",
  rowHover: "#EEF2FA",
  rowSelected: "#EBF5FF",
  navActive: "#E8F2FD",
  navHover: "#F5F8FF",
  pill: "#EEF2FA",
  pillBorder: "#D8E0F0",
  pillText: "#5A6480",
  badgeBg: "#EEF2FA",
  badgeText: "#5A6480",
  unreadDot: "#2896E8",
  accent: "#2896E8",
  accentGrad: "linear-gradient(135deg, #2896E8 0%, #1565C0 100%)",
  accentGlow: "0 4px 16px rgba(40,150,232,0.28)",
  replyBorder: "#2896E840",
  btnSecBg: "#FFFFFF",
  btnSecBorder: "#D8E0F0",
  btnSecText: "#374163",
  btnSecHover: "#F0F4FA",
  starActive: "#F59E0B",
  starInactive: "#A0AACC",
  attachColor: "#8894B0",
  scrollThumb: "#CBD5E8",
  shadow: "0 20px 60px rgba(0,0,0,0.12)",
}

export type Tokens = typeof DARK

export const THEMES: Record<Theme, Tokens> = { dark: DARK, light: LIGHT }

export const ThemeContext = createContext<{
  theme: Theme
  tokens: Tokens
  toggle: () => void
  setTheme: (theme: Theme) => void
}>({ theme: "dark", tokens: DARK, toggle: () => {}, setTheme: () => {} })

export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    const saved = localStorage.getItem("isotopiq-theme") as Theme | null
    if (saved === "dark" || saved === "light") {
      setTheme(saved)
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      setTheme("light")
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("isotopiq-theme", theme)
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        tokens: THEMES[theme],
        toggle: () => setTheme((th) => (th === "dark" ? "light" : "dark")),
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
