import { useNavigate, useLocation } from "react-router-dom";
import { Home, ShoppingCart, User } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useTheme } from "../contexts/ThemeContext";

// 1. Definimos a interface para aceitar a prop
interface MobileBottomNavProps {
  onProfileClick?: () => void;
}

// 2. Recebemos a prop no componente
export const MobileBottomNav = ({ onProfileClick }: MobileBottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsCartOpen, cartCount } = useCart();
  const { colors } = useTheme();

  // Função auxiliar para lidar com o clique no perfil
  const handleUserClick = () => {
    if (onProfileClick) {
      // Se a função foi passada pelo pai (StoreHome), usa ela (que tem a lógica de login)
      onProfileClick();
    } else {
      // Fallback: tenta ir direto para conta se não tiver função passada
      navigate("/minha-conta");
    }
  };

  const styles = {
    nav: {
      position: "fixed" as const,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      borderTop: `1px solid ${colors.border}`,
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      padding: "10px 0",
      zIndex: 1000,
      height: "60px",
      // Esconde em telas grandes (acima de 768px)
      "@media (min-width: 768px)": {
        display: "none",
      },
    },
    button: (isActive: boolean) => ({
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      background: "none",
      border: "none",
      color: isActive ? "#ff4747" : colors.muted,
      fontSize: "10px",
      gap: "4px",
      cursor: "pointer",
      flex: 1,
    }),
    cartBadge: {
      position: "absolute" as const,
      top: "-5px",
      right: "-5px",
      backgroundColor: "#ff4747",
      color: "white",
      fontSize: "10px",
      fontWeight: "bold",
      width: "16px",
      height: "16px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  };

  return (
    <>
      {/* CSS Inline para garantir que suma no desktop */}
      <style>{`
        .mobile-nav-container { display: flex; }
        @media (min-width: 768px) { .mobile-nav-container { display: none !important; } }
      `}</style>

      <div style={styles.nav} className="mobile-nav-container">
        {/* HOME */}
        <button
          onClick={() => navigate("/")}
          style={styles.button(location.pathname === "/")}
        >
          <Home size={22} />
          <span>Início</span>
        </button>

        {/* CARRINHO */}
        <button
          onClick={() => setIsCartOpen(true)}
          style={{ ...styles.button(false), position: "relative" }}
        >
          <div style={{ position: "relative" }}>
            <ShoppingCart size={22} />
            {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
          </div>
          <span>Cesta</span>
        </button>

        {/* PERFIL (Usa a nova lógica) */}
        <button
          onClick={handleUserClick}
          style={styles.button(location.pathname === "/minha-conta")}
        >
          <User size={22} />
          <span>Perfil</span>
        </button>
      </div>
    </>
  );
};
