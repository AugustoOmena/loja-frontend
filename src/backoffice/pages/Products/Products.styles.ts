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

export interface ProductsStyles {
  container: CSSProperties;
  header: CSSProperties;
  title: CSSProperties;
  primaryButton: CSSProperties;
  excelButton: CSSProperties;
  iconButton: CSSProperties;
  closeButton: CSSProperties;
  filterContainer: CSSProperties;
  filterRow: CSSProperties;
  searchWrapper: CSSProperties;
  searchInput: CSSProperties;
  inputGroupRow: CSSProperties;
  filterInput: CSSProperties;
  filterSelect: CSSProperties;
  tableContainer: CSSProperties;
  table: CSSProperties;
  tableHeadRow: CSSProperties;
  th: CSSProperties;
  thAction: CSSProperties;
  tableRow: CSSProperties;
  td: CSSProperties;
  tdCenter: CSSProperties;
  tdAction: CSSProperties;
  pagination: CSSProperties;
  pageButton: CSSProperties;
  pageButtonDisabled: CSSProperties;
  modalOverlay: CSSProperties;
  modalContent: CSSProperties;
  modalHeader: CSSProperties;
  modalTitle: CSSProperties;
  form: CSSProperties;
  formGroup: CSSProperties;
  label: CSSProperties;
  input: CSSProperties;
  modalFooter: CSSProperties;
  secondaryButton: CSSProperties;
  uploadButton: CSSProperties;
  removeImageBtn: CSSProperties;
  variantImageThumbnail: CSSProperties;
  variantImageRemoveBtn: CSSProperties;
  variantAddImageBtn: CSSProperties;
}

export function createProductsStyles(
  colors: ThemePalette,
  theme: ThemeMode
): ProductsStyles {
  return {
    container: {
      padding: "20px",
      maxWidth: "1200px",
      margin: "0 auto",
      fontFamily: "sans-serif",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "25px",
    },
    title: { fontSize: "24px", fontWeight: "bold", color: colors.text },
    primaryButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      backgroundColor: theme === "dark" ? "#6366f1" : "#0f172a",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
    },
    excelButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      backgroundColor: "#107569",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
    },
    iconButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "5px",
    },
    closeButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: colors.muted,
    },
    filterContainer: {
      marginBottom: "20px",
      backgroundColor: colors.card,
      padding: "15px",
      borderRadius: "8px",
      border: `1px solid ${colors.border}`,
    },
    filterRow: {
      display: "flex",
      gap: "15px",
      flexWrap: "wrap",
      alignItems: "center",
    },
    searchWrapper: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      backgroundColor: theme === "dark" ? "#0f172a" : "#f8fafc",
      padding: "10px 15px",
      borderRadius: "6px",
      border: `1px solid ${colors.border}`,
      flex: 2,
      minWidth: "200px",
    },
    searchInput: {
      border: "none",
      outline: "none",
      width: "100%",
      background: "transparent",
      fontSize: "14px",
      color: colors.text,
    },
    inputGroupRow: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      flex: 1,
      minWidth: "150px",
    },
    filterInput: {
      padding: "10px",
      borderRadius: "6px",
      border: `1px solid ${colors.border}`,
      width: "100%",
      fontSize: "14px",
      backgroundColor: theme === "dark" ? "#0f172a" : "white",
      color: colors.text,
    },
    filterSelect: {
      padding: "10px",
      borderRadius: "6px",
      border: `1px solid ${colors.border}`,
      minWidth: "120px",
      fontSize: "14px",
      backgroundColor: theme === "dark" ? "#0f172a" : "white",
      color: colors.text,
    },
    tableContainer: {
      backgroundColor: colors.card,
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      overflow: "hidden",
      border: `1px solid ${colors.border}`,
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      textAlign: "left",
    },
    tableHeadRow: {
      backgroundColor: theme === "dark" ? "#1e293b" : "#f8fafc",
      borderBottom: `1px solid ${colors.border}`,
    },
    th: {
      padding: "15px",
      fontSize: "14px",
      fontWeight: "600",
      color: colors.muted,
    },
    thAction: {
      padding: "15px",
      fontSize: "14px",
      fontWeight: "600",
      color: colors.muted,
      textAlign: "right",
    },
    tableRow: { borderBottom: `1px solid ${colors.border}` },
    td: { padding: "15px", fontSize: "15px", color: colors.text },
    tdCenter: {
      padding: "30px",
      textAlign: "center",
      color: colors.muted,
    },
    tdAction: {
      padding: "15px",
      textAlign: "right",
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
    },
    pagination: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "20px",
    },
    pageButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "36px",
      height: "36px",
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.card,
      borderRadius: "6px",
      cursor: "pointer",
      color: colors.text,
    },
    pageButtonDisabled: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "36px",
      height: "36px",
      border: `1px solid ${colors.border}`,
      backgroundColor: theme === "dark" ? "#1e293b" : "#f8fafc",
      borderRadius: "6px",
      cursor: "not-allowed",
      color: colors.muted,
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: colors.card,
      padding: "30px",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "750px",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
      border: `1px solid ${colors.border}`,
      color: colors.text,
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    modalTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: colors.text,
      margin: 0,
    },
    form: { display: "flex", flexDirection: "column", gap: "20px" },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    label: { fontSize: "14px", fontWeight: "500", color: colors.text },
    input: {
      padding: "10px",
      border: `1px solid ${colors.border}`,
      borderRadius: "6px",
      fontSize: "15px",
      outline: "none",
      backgroundColor: theme === "dark" ? "#0f172a" : "white",
      color: colors.text,
    },
    modalFooter: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "10px",
    },
    secondaryButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      backgroundColor: colors.card,
      color: colors.muted,
      border: `1px solid ${colors.border}`,
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
    },
    uploadButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      border: `1px dashed ${colors.border}`,
      borderRadius: "6px",
      cursor: "pointer",
      color: colors.muted,
      fontSize: "14px",
      backgroundColor: theme === "dark" ? "#1e293b" : "#f8fafc",
    },
    removeImageBtn: {
      position: "absolute",
      top: -5,
      right: -5,
      background: "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "50%",
      width: "20px",
      height: "20px",
      fontSize: "12px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    },
    variantImageThumbnail: {
      position: "relative",
      width: "36px",
      height: "36px",
      flexShrink: 0,
    },
    variantImageRemoveBtn: {
      position: "absolute",
      top: -4,
      right: -4,
      background: "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "50%",
      width: "15px",
      height: "15px",
      fontSize: "9px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      lineHeight: 1,
    },
    variantAddImageBtn: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      padding: "4px 8px",
      fontSize: "11px",
      border: `1px dashed ${colors.border}`,
      borderRadius: "4px",
      cursor: "pointer",
      color: colors.muted,
      backgroundColor: theme === "dark" ? "#1e293b" : "#f8fafc",
      height: "36px",
      boxSizing: "border-box",
      flexShrink: 0,
    },
  };
}