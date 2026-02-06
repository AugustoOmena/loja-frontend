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
    accent: string;
    accentText: string;
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
          bg: "#ffffff", // Predominância branco
          card: "#ffffff",
          text: "#0f0f0f", // Preto suave
          muted: "#525252", // Neutro 600
          border: "#e5e5e5", // Neutro 200
          accent: "#F4D636", // Amarelo loja praia
          accentText: "#0f0f0f", // Preto sobre amarelo
        }
      : {
          bg: "#0a0a0a", // Preto suave
          card: "#171717", // Neutro 900
          text: "#fafafa", // Quase branco
          muted: "#a3a3a3", // Neutro 400
          border: "#262626", // Neutro 800
          accent: "#F4D636",
          accentText: "#0f0f0f",
        };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
