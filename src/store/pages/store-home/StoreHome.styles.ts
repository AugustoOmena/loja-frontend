import type { CSSProperties } from "react";

// Tipagem exata da paleta injetada pelo ThemeContext
export interface ThemePalette {
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  [key: string]: string | undefined;
}

export type ThemeMode = "light" | "dark" | string;

export interface StoreHomeStyles {
  pageWrapper: CSSProperties;
  topBar: CSSProperties;
  container: CSSProperties;
  sidebar: CSSProperties;
  filterLabel: CSSProperties;
  filterInput: CSSProperties;
  filterSelect: CSSProperties;
  productCard: CSSProperties;
  imagePlaceholder: CSSProperties;
  cardBody: CSSProperties;
  productTitle: CSSProperties;
  priceRow: CSSProperties;
  cartBadge: CSSProperties;
  ratingRow: CSSProperties;
  sizeFilterRow: CSSProperties;
  sizeFilterTrigger: (isActive: boolean) => CSSProperties;
  sizeFilterOption: (selected: boolean) => CSSProperties;
}

export function createStoreHomeStyles(
  colors: ThemePalette,
  theme: ThemeMode
): StoreHomeStyles {
  return {
    pageWrapper: {
      backgroundColor: colors.bg,
      minHeight: "100vh",
      fontFamily: "sans-serif",
      color: colors.text,
      width: "100%",
    },
    topBar: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      zIndex: 100,
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      borderBottom: `1px solid ${colors.border}`,
    },
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 15px",
    },
    sidebar: {
      width: "240px",
      backgroundColor: colors.card,
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      position: "sticky",
      top: "160px",
      alignSelf: "start",
      height: "fit-content",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      border: `1px solid ${colors.border}`,
    },
    filterLabel: {
      fontSize: "13px",
      fontWeight: "bold",
      display: "block",
      marginBottom: "8px",
      color: colors.muted,
    },
    filterInput: {
      width: "100%",
      padding: "8px",
      borderRadius: "4px",
      border: `1px solid ${colors.border}`,
      fontSize: "13px",
      backgroundColor: colors.bg,
      color: colors.text,
      marginBottom: "5px",
    },
    filterSelect: {
      width: "100%",
      padding: "8px",
      borderRadius: "4px",
      border: `1px solid ${colors.border}`,
      fontSize: "13px",
      backgroundColor: colors.bg,
      color: colors.text,
    },
    productCard: {
      backgroundColor: colors.card,
      borderRadius: "8px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      cursor: "pointer",
      transition: "transform 0.2s",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      border: `1px solid ${colors.border}`,
    },
    imagePlaceholder: {
      height: "180px",
      backgroundColor: colors.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    cardBody: {
      padding: "10px",
    },
    productTitle: {
      fontSize: "13px",
      color: colors.text,
      marginBottom: "4px",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      lineHeight: "1.4",
      height: "36px",
    },
    priceRow: {
      display: "flex",
      alignItems: "baseline",
      color: theme === "dark" ? colors.accent : colors.text,
      fontWeight: "bold",
    },
    cartBadge: {
      position: "absolute",
      top: "-8px",
      right: "-8px",
      backgroundColor: colors.accent,
      color: colors.accentText,
      fontSize: "10px",
      width: "18px",
      height: "18px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: `2px solid ${colors.card}`,
    },
    ratingRow: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      marginBottom: "4px",
    },
    sizeFilterRow: {
      display: "flex",
      gap: "10px",
      overflowX: "auto",
      paddingBottom: "12px",
      paddingTop: "12px",
      whiteSpace: "nowrap",
      scrollbarWidth: "none",
      marginBottom: "8px",
    },
    sizeFilterTrigger: (isActive: boolean): CSSProperties => ({
      border: `1px solid ${isActive ? "transparent" : colors.border}`,
      padding: "8px 14px",
      borderRadius: "20px",
      backgroundColor: isActive
        ? colors.accent
        : theme === "dark"
          ? colors.card
          : "#f5f5f5",
      color: isActive ? colors.accentText : colors.text,
      fontSize: "13px",
      fontWeight: isActive ? "bold" : "normal",
      cursor: "pointer",
      transition: "0.2s",
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
    }),
    sizeFilterOption: (selected: boolean): CSSProperties => ({
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 12px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "13px",
      backgroundColor: selected
        ? theme === "dark"
          ? "rgba(244,214,54,0.25)"
          : "rgba(244,214,54,0.2)"
        : "transparent",
      color: colors.text,
      border: "none",
      width: "100%",
      textAlign: "left",
    }),
  };
}