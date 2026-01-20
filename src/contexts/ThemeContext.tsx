import { createContext, useContext, useEffect, useState } from "react";

import type { ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    bg: string;
    card: string;
    text: string;
    muted: string;
    border: string;
  };
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("@loja-omena:theme");
    if (saved) return saved as Theme;

    // MUDANÇA AQUI: Ignoramos o window.matchMedia e retornamos 'light' fixo
    // return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    return "light";
  });

  useEffect(() => {
    localStorage.setItem("@loja-omena:theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const colors =
    theme === "light"
      ? {
          bg: "#f8fafc", // Fundo Claro (Slate 50) - Mais moderno que fff
          card: "#ffffff", // Branco puro
          text: "#1e293b", // Slate 800
          muted: "#64748b", // Slate 500
          border: "#e2e8f0", // Slate 200
        }
      : {
          bg: "#0f172a", // Slate 900
          card: "#1e293b", // Slate 800
          text: "#f8fafc", // Slate 50
          muted: "#94a3b8", // Slate 400
          border: "#334155", // Slate 700
        };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
