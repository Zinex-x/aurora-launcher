import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";
export type AccentColor = "cyan" | "green" | "purple" | "red" | "orange";

type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  accentColor: AccentColor;
  setAccentColor: (c: AccentColor) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<Ctx | null>(null);

const ACCENTS: Record<AccentColor, { l: string; c: string; h: string }> = {
  cyan: { l: "0.75", c: "0.15", h: "200" },
  green: { l: "0.78", c: "0.18", h: "145" },
  purple: { l: "0.70", c: "0.20", h: "300" },
  red: { l: "0.65", c: "0.25", h: "25" },
  orange: { l: "0.75", c: "0.20", h: "60" },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [accentColor, setAccentColorState] = useState<AccentColor>("cyan");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const savedAccent = localStorage.getItem("accentColor") as AccentColor | null;

    if (savedTheme === "dark" || savedTheme === "light") setThemeState(savedTheme);
    if (savedAccent && ACCENTS[savedAccent]) setAccentColorState(savedAccent);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");

    const accent = ACCENTS[accentColor];
    const isDark = theme === "dark";

    // Adjust lightness based on theme
    const l = isDark ? accent.l : (parseFloat(accent.l) - 0.15).toString();
    const primary = `oklch(${l} ${accent.c} ${accent.h})`;
    const foreground = isDark ? `oklch(0.15 0.04 ${accent.h})` : `oklch(0.98 0.01 ${accent.h})`;
    const glow = `oklch(${parseFloat(l) + 0.07} ${parseFloat(accent.c) + 0.04} ${accent.h})`;

    root.style.setProperty("--primary", primary);
    root.style.setProperty("--primary-foreground", foreground);
    root.style.setProperty("--ring", primary);
    root.style.setProperty("--grass", primary);
    root.style.setProperty("--grass-glow", glow);
  }, [theme, accentColor]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
  };

  const setAccentColor = (c: AccentColor) => {
    setAccentColorState(c);
    localStorage.setItem("accentColor", c);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        accentColor,
        setAccentColor,
        toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
