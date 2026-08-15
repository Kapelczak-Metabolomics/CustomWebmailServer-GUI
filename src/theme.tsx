import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { Theme } from "./types";
import { api, type ApiBrand } from "./lib/api";

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
};

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
};

export type Tokens = typeof DARK;

export const THEMES: Record<Theme, Tokens> = { dark: DARK, light: LIGHT };

function hexToRgba(hex: string, alpha: string | number) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyBrand(base: Tokens, primaryColor?: string | null): Tokens {
  if (!primaryColor || primaryColor === "#2896E8") return base;
  const dark = primaryColor
    .replace("#", "")
    .match(/../g)
    ?.map((c) => Math.max(0, parseInt(c, 16) - 40))
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("");
  const darkHex = dark ? `#${dark}` : "#1565C0";
  return {
    ...base,
    unreadDot: primaryColor,
    accent: primaryColor,
    accentGrad: `linear-gradient(135deg, ${primaryColor} 0%, ${darkHex} 100%)`,
    accentGlow: `0 4px 16px ${hexToRgba(primaryColor, 0.35)}`,
    replyBorder: `${hexToRgba(primaryColor, 0.25)}`,
    rowSelected: `${hexToRgba(primaryColor, 0.06)}`,
    navActive: `${hexToRgba(primaryColor, 0.13)}`,
  };
}

export const ThemeContext = createContext<{
  theme: Theme;
  tokens: Tokens;
  brand: ApiBrand | null;
  appName: string;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
  refreshBrand: () => Promise<void>;
}>({
  theme: "dark",
  tokens: DARK,
  brand: null,
  appName: "Isotopiq Mail",
  toggle: () => {},
  setTheme: () => {},
  refreshBrand: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [brand, setBrand] = useState<ApiBrand | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("isotopiq-theme") as Theme | null;
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      setTheme("light");
    }
    api
      .getBrand()
      .then((b) => setBrand(b))
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("isotopiq-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (brand?.companyName) {
      document.title = brand.companyName;
    }
  }, [brand]);

  const tokens = useMemo(
    () => applyBrand(THEMES[theme], brand?.primaryColor),
    [theme, brand],
  );

  async function refreshBrand() {
    try {
      const b = await api.getBrand();
      setBrand(b);
    } catch {
      /* ignore */
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        tokens,
        brand,
        appName: brand?.companyName || "Isotopiq Mail",
        toggle: () => setTheme((th) => (th === "dark" ? "light" : "dark")),
        setTheme,
        refreshBrand,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
