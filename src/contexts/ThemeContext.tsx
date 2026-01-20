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
  // 1. Tenta pegar do localStorage ou usa a preferência do sistema
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("@loja-omena:theme");
    if (saved) return saved as Theme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    localStorage.setItem("@loja-omena:theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // 2. Definição das Cores para facilitar o uso nos estilos inline
  const colors =
    theme === "light"
      ? {
          bg: "#f1f5f9", // Fundo Claro (Slate 100)
          card: "#ffffff", // Card Branco
          text: "#1e293b", // Texto Escuro
          muted: "#64748b", // Texto Cinza
          border: "#e2e8f0", // Borda Clara
        }
      : {
          bg: "#0f172a", // Fundo Escuro (Slate 900)
          card: "#1e293b", // Card Escuro (Slate 800)
          text: "#f8fafc", // Texto Claro
          muted: "#94a3b8", // Texto Cinza Claro
          border: "#334155", // Borda Escura
        };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
