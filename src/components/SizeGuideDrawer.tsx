import { useEffect } from "react";
import { Ruler, X } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export interface SizeGuideRow {
  tamanho: string;
  num: string;
  busto: string;
  cintura: string;
  quadril: string;
}

interface SizeGuideDrawerProps {
  open: boolean;
  onClose: () => void;
  rows: SizeGuideRow[];
  title?: string;
}

export const SizeGuideDrawer = ({
  open,
  onClose,
  rows,
  title = "Tabela de medidas",
}: SizeGuideDrawerProps) => {
  const { colors } = useTheme();

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open, onClose]);

  if (!open) return null;

  const styles = {
    overlay: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2000,
      display: "flex",
      justifyContent: "flex-end",
    },
    backdrop: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      cursor: "pointer",
    },
    drawer: {
      position: "relative" as const,
      width: "100%",
      maxWidth: "380px",
      height: "100%",
      backgroundColor: colors.card,
      color: colors.text,
      display: "flex",
      flexDirection: "column" as const,
      boxShadow: "-5px 0 20px rgba(0,0,0,0.15)",
    },
    header: {
      padding: "20px",
      borderBottom: `1px solid ${colors.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexShrink: 0,
    },
    headerTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: colors.text,
    },
    closeBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "6px",
      color: colors.muted,
      borderRadius: "8px",
    },
    content: {
      flex: 1,
      overflowY: "auto" as const,
      padding: "20px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
      fontSize: "13px",
    },
    th: {
      textAlign: "left" as const,
      padding: "10px 8px",
      borderBottom: `2px solid ${colors.border}`,
      color: colors.muted,
      fontWeight: "600",
      fontSize: "12px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
    },
    td: {
      padding: "12px 8px",
      borderBottom: `1px solid ${colors.border}`,
      color: colors.text,
    },
  };

  return (
    <div style={styles.overlay}>
      <div
        style={styles.backdrop}
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-label="Fechar tabela de medidas"
      />
      <div style={styles.drawer}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>
            <Ruler size={22} color={colors.accent} />
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={styles.closeBtn}
            aria-label="Fechar"
          >
            <X size={22} />
          </button>
        </div>
        <div style={styles.content}>
          <p
            style={{
              fontSize: "13px",
              color: colors.muted,
              marginBottom: "16px",
              lineHeight: 1.5,
            }}
          >
            Medidas em centímetros (cm). Consulte para escolher seu tamanho.
          </p>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Tamanho</th>
                <th style={styles.th}>Nº</th>
                <th style={styles.th}>Busto</th>
                <th style={styles.th}>Cintura</th>
                <th style={styles.th}>Quadril</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.tamanho}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{row.tamanho}</td>
                  <td style={styles.td}>{row.num}</td>
                  <td style={styles.td}>{row.busto}</td>
                  <td style={styles.td}>{row.cintura}</td>
                  <td style={styles.td}>{row.quadril}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
