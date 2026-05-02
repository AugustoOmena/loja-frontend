import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

export const StoreFooter = () => {
  const { colors } = useTheme();

  return (
    <>
      <style>{`
        .store-footer-nav { flex-direction: row; }
        @media (max-width: 480px) { .store-footer-nav { flex-direction: column; gap: 8px !important; } }
        /* Extra space so footer content isn't hidden behind the mobile bottom nav */
        @media (max-width: 767px) { .store-footer { padding-bottom: 76px !important; } }
      `}</style>

      <footer
        className="store-footer"
        style={{
          borderTop: `1px solid ${colors.border}`,
          backgroundColor: colors.card,
          padding: "24px 20px",
          textAlign: "center",
          fontFamily: "sans-serif",
        }}
      >
        <nav
          className="store-footer-nav"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "24px",
            marginBottom: "12px",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/politica-de-reembolso"
            style={{
              fontSize: "13px",
              color: colors.muted,
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Reembolso e Devoluções
          </Link>
          <span style={{ color: colors.border, fontSize: "13px" }}>·</span>
          <Link
            to="/termos-de-uso"
            style={{
              fontSize: "13px",
              color: colors.muted,
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Termos de Uso e Privacidade
          </Link>
        </nav>

        <p style={{ fontSize: "12px", color: colors.border, margin: 0 }}>
          © {new Date().getFullYear()} Todos os direitos reservados.
        </p>
      </footer>
    </>
  );
};
