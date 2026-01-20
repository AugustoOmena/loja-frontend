import { useNavigate, useLocation } from "react-router-dom";
import { Home, Grid, ShoppingCart, User } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useCart } from "../contexts/CartContext";

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, theme } = useTheme();
  const { cartCount, setIsCartOpen } = useCart();

  const isActive = (path: string) => location.pathname === path;

  // Cores dinâmicas baseadas no tema e estado ativo
  const getColor = (path: string) => {
    const activeColor = theme === "dark" ? "#6366f1" : "#0f172a"; // Indigo ou Slate Dark
    return isActive(path) ? activeColor : colors.muted;
  };

  const styles = {
    nav: {
      position: "fixed" as const,
      bottom: 0,
      left: 0,
      width: "100%",
      height: "65px",
      backgroundColor: colors.card,
      borderTop: `1px solid ${colors.border}`,
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      zIndex: 50,
      boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
    },
    button: {
      background: "none",
      border: "none",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      flex: 1,
      height: "100%",
      cursor: "pointer",
      position: "relative" as const,
    },
    label: {
      fontSize: "10px",
      fontWeight: 500,
    },
    badge: {
      position: "absolute" as const,
      top: "6px",
      right: "25%",
      backgroundColor: "#ef4444",
      color: "white",
      fontSize: "10px",
      fontWeight: "bold",
      minWidth: "16px",
      height: "16px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: `2px solid ${colors.card}`,
    },
  };

  return (
    <>
      {/* CSS para esconder no Desktop (min-width: 768px) */}
      <style>{`
        .mobile-nav-container { display: flex; }
        @media (min-width: 768px) {
          .mobile-nav-container { display: none !important; }
        }
      `}</style>

      <div style={styles.nav} className="mobile-nav-container">
        {/* 1. INÍCIO */}
        <button style={styles.button} onClick={() => navigate("/")}>
          <Home
            size={22}
            color={getColor("/")}
            strokeWidth={isActive("/") ? 2.5 : 2}
          />
          <span style={{ ...styles.label, color: getColor("/") }}>Início</span>
        </button>

        {/* 2. CATEGORIAS (Placeholder por enquanto) */}
        <button style={styles.button} onClick={() => navigate("/")}>
          <Grid size={22} color={getColor("/categorias")} />
          <span style={{ ...styles.label, color: getColor("/categorias") }}>
            Categorias
          </span>
        </button>

        {/* 3. CARRINHO */}
        <button style={styles.button} onClick={() => setIsCartOpen(true)}>
          <div style={{ position: "relative" }}>
            <ShoppingCart size={22} color={colors.muted} />
            {cartCount > 0 && <span style={styles.badge}>{cartCount}</span>}
          </div>
          <span style={{ ...styles.label, color: colors.muted }}>Carrinho</span>
        </button>

        {/* 4. CONTA */}
        <button style={styles.button} onClick={() => navigate("/minha-conta")}>
          <User
            size={22}
            color={getColor("/minha-conta")}
            strokeWidth={isActive("/minha-conta") ? 2.5 : 2}
          />
          <span style={{ ...styles.label, color: getColor("/minha-conta") }}>
            Conta
          </span>
        </button>
      </div>
    </>
  );
};
