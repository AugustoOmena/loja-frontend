import type { CSSProperties } from "react";

export interface ThemePalette {
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent?: string;
  accentText?: string;
  [key: string]: string | undefined;
}

export type ThemeMode = "light" | "dark" | string;

export interface ProductDetailsStyles {
  wrapper: CSSProperties;
  previewBanner: CSSProperties;
  container: CSSProperties;
  backButton: CSSProperties;
  loaderWrapper: CSSProperties;
  errorWrapper: CSSProperties;
  grid: CSSProperties;
  mainImageContainer: CSSProperties;
  thumbnailScroll: CSSProperties;
  thumbnail: (isActive: boolean) => CSSProperties;
  title: CSSProperties;
  rating: CSSProperties;
  price: CSSProperties;
  installments: CSSProperties;
  label: CSSProperties;
  sizeButton: (isActive: boolean, isDisabled: boolean) => CSSProperties;
  sizeButtonLine: (active: boolean) => CSSProperties;
  addToCartBtn: CSSProperties;
  disabledBtn: CSSProperties;
  sizeGuideBtn: CSSProperties;
  sizeGuideBtnLine: (hovered: boolean) => CSSProperties;
  accordionContainer: CSSProperties;
  accordionHeader: CSSProperties;
  accordionContent: CSSProperties;
}

export function createProductDetailsStyles(
  colors: ThemePalette,
  theme: ThemeMode
): ProductDetailsStyles {
  const isLight = theme === "light";
  const borderColor = isLight ? "#1a1a1a" : colors.border;

  return {
    wrapper: {
      minHeight: "100vh",
      backgroundColor: colors.bg,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
    },
    previewBanner: {
      width: "100%",
      backgroundColor: "#6366f1",
      color: "white",
      padding: "10px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "14px",
      fontWeight: "600",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      zIndex: 110,
    },
    container: {
      width: "100%",
      maxWidth: "1000px",
      padding: "20px",
      fontFamily: "sans-serif",
    },
    backButton: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      border: "none",
      background: "none",
      cursor: "pointer",
      marginBottom: "20px",
      color: colors.muted,
      fontSize: "14px",
    },
    loaderWrapper: {
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },
    errorWrapper: {
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
      color: colors.text,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "40px",
    },
    mainImageContainer: {
      aspectRatio: "1/1",
      backgroundColor: colors.card,
      borderRadius: "10px",
      overflow: "hidden",
      marginBottom: "15px",
      border: `1px solid ${colors.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    thumbnailScroll: {
      display: "flex",
      gap: "10px",
      overflowX: "auto",
      paddingBottom: "5px",
    },
    thumbnail: (isActive: boolean): CSSProperties => ({
      width: "70px",
      height: "70px",
      objectFit: "cover",
      borderRadius: "8px",
      cursor: "pointer",
      border: isActive ? `2px solid ${colors.accent || "#f4d636"}` : `1px solid ${colors.border}`,
      backgroundColor: colors.card,
      opacity: isActive ? 1 : 0.7,
    }),
    title: {
      fontSize: "26px",
      color: colors.text,
      marginBottom: "10px",
      lineHeight: "1.3",
      fontWeight: "bold",
    },
    rating: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      margin: "10px 0",
      color: colors.accent || "#f4d636",
      fontSize: "14px",
    },
    price: {
      fontSize: "32px",
      fontWeight: "bold",
      color: theme === "dark" ? (colors.accent || "#f4d636") : colors.text,
      margin: "20px 0",
    },
    installments: {
      fontSize: "12px",
      color: colors.muted,
      fontWeight: "normal",
      marginTop: "5px",
    },
    label: {
      fontWeight: "600",
      display: "block",
      marginBottom: "10px",
      color: colors.text,
    },
    sizeButton: (isActive: boolean, isDisabled: boolean): CSSProperties => ({
      position: "relative",
      overflow: "hidden",
      padding: "10px 20px",
      border: `1px solid ${borderColor}`,
      backgroundColor:
        isActive && !isLight
          ? "rgba(244, 214, 54, 0.2)"
          : isDisabled
          ? theme === "dark"
            ? colors.card
            : "#f0efe9"
          : colors.card,
      borderRadius: "6px",
      fontWeight: isActive ? "bold" : "normal",
      color: isDisabled
        ? colors.muted
        : isLight
        ? colors.text
        : isActive
        ? (colors.accent || "#f4d636")
        : colors.text,
      cursor: isDisabled ? "not-allowed" : "pointer",
      transition: "0.2s",
      opacity: isDisabled ? 0.5 : 1,
    }),
    sizeButtonLine: (active: boolean): CSSProperties => ({
      position: "absolute",
      bottom: 0,
      left: 0,
      height: "2px",
      width: active ? "100%" : "0%",
      backgroundColor: theme === "dark" ? (colors.accent || "#f4d636") : "#1a1a1a",
      transition: "width 0.2s ease-out",
    }),
    addToCartBtn: {
      width: "100%",
      backgroundColor: colors.accent || "#f4d636",
      color: colors.accentText || "#000",
      border: "none",
      padding: "16px",
      borderRadius: "30px",
      fontSize: "16px",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      cursor: "pointer",
      boxShadow:
        theme === "dark"
          ? "0 4px 15px rgba(244, 214, 54, 0.25)"
          : "0 4px 15px rgba(244, 214, 54, 0.3)",
      transition: "transform 0.1s",
    },
    disabledBtn: {
      width: "100%",
      backgroundColor: theme === "dark" ? colors.card : "#e5e5e5",
      color: colors.muted,
      border: "none",
      padding: "16px",
      borderRadius: "30px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "not-allowed",
    },
    sizeGuideBtn: {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 18px",
      marginTop: "12px",
      border: `1px solid ${colors.border}`,
      borderRadius: "12px",
      backgroundColor: colors.card,
      color: colors.text,
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      overflow: "hidden",
    },
    sizeGuideBtnLine: (hovered: boolean): CSSProperties => ({
      position: "absolute",
      bottom: 0,
      left: 0,
      height: "2px",
      width: hovered ? "100%" : "0%",
      backgroundColor: colors.accent || "#f4d636",
      transition: "width 0.25s ease-out",
    }),
    accordionContainer: {
      marginTop: "10px",
      border: `1px solid ${colors.border}`,
      borderRadius: "10px",
      overflow: "hidden",
    },
    accordionHeader: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 16px",
      border: "none",
      background: colors.card,
      color: colors.text,
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      textAlign: "left",
    },
    accordionContent: {
      padding: "16px",
      borderTop: `1px solid ${colors.border}`,
      backgroundColor: colors.bg,
      color: colors.text,
      fontSize: "14px",
      lineHeight: 1.6,
      whiteSpace: "pre-line",
    },
  };
}