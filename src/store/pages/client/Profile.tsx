import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { listByUser } from "../../../services/orderService";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  Settings,
  Wallet,
  Package,
  Truck,
  MessageSquare,
  // RotateCcw, // devoluções comentado
  UserCircle,
  Home,
} from "lucide-react";
import { RecommendedProducts } from "../../../components/RecommendedProducts";
import { RevealOnScrollProductSearchBar } from "../../../components/RevealOnScrollProductSearchBar";
import { MobileBottomNav } from "../../../components/MobileBottomNav";
import { STORE_CATEGORIES } from "../../../constants/storeCategories";

export const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { colors, theme } = useTheme();

  const recommendedSectionRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [counts, setCounts] = useState({
    payment: 0,
    shipping: 0,
    shipped: 0,
    review: 0,
    returns: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        const orders = await listByUser({ userId: user.id });
        const paymentCount = orders.filter(
          (o) => o.status === "pending"
        ).length;
        const shippingCount = orders.filter((o) =>
          ["approved", "in_process"].includes(o.status)
        ).length;
        const shippedCount = orders.filter((o) =>
          ["shipped", "delivered"].includes(o.status)
        ).length;

        setCounts({
          payment: paymentCount,
          shipping: shippingCount,
          shipped: shippedCount,
          review: 0,
          returns: 0,
        });
      } catch {
        setCounts({
          payment: 0,
          shipping: 0,
          shipped: 0,
          review: 0,
          returns: 0,
        });
      }
    };

    fetchCounts();
  }, [user]);

  const menuItems = [
    {
      label: "Pagamento",
      icon: <Wallet size={24} />,
      count: counts.payment,
      route: "/pedidos/pagamento",
    },
    {
      label: "A Enviar",
      icon: <Package size={24} />,
      count: counts.shipping,
      route: "/pedidos/envio",
    },
    {
      label: "Enviado",
      icon: <Truck size={24} />,
      count: counts.shipped,
      route: "/pedidos/enviados",
    },
    {
      label: "Avaliar",
      icon: <MessageSquare size={24} />,
      count: counts.review,
      route: "/pedidos/avaliar",
    },
    // {
    //   label: "Devolução",
    //   icon: <RotateCcw size={24} />,
    //   count: counts.returns,
    //   route: "/pedidos/devolucao",
    // },
  ];

  const styles = {
    // Container Principal (Fundo da página)
    container: {
      minHeight: "100vh",
      backgroundColor: colors.bg,
      fontFamily: "sans-serif",
      paddingBottom: "80px",
    },

    // Header Wrapper
    headerWrapper: {
      backgroundColor: theme === "dark" ? colors.card : "#171717",
      width: "100%",
      display: "flex",
      justifyContent: "center",
    },
    // Header Conteúdo (Limitado a 1000px)
    headerContent: {
      width: "100%",
      maxWidth: "1000px",
      padding: "30px 20px 60px 20px",
      color: theme === "dark" ? colors.text : "#fafafa",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },

    // Container do Corpo (Limitado a 1000px para centralizar no Desktop)
    bodyContainer: {
      width: "100%",
      maxWidth: "1000px",
      margin: "0 auto", // Centraliza na tela
      padding: "0 15px", // Padding lateral para mobile não colar na borda
    },

    userInfo: { display: "flex", alignItems: "center", gap: "15px" },
    avatar: {
      width: "60px",
      height: "60px",
      borderRadius: "50%",
      backgroundColor: "rgba(255,255,255,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    userName: { fontSize: "18px", fontWeight: "bold" },
    userEmail: { fontSize: "12px", opacity: 0.8 },

    headerActions: {
      display: "flex",
      gap: "15px",
      alignItems: "center",
    },
    headerBtn: {
      background: "transparent",
      border: "none",
      color: theme === "dark" ? colors.text : "#fafafa",
      cursor: "pointer",
      alignItems: "center",
      gap: "4px",
      fontSize: "10px",
      opacity: 0.9,
      transition: "opacity 0.2s",
    },

    statusCard: {
      backgroundColor: colors.card,
      marginTop: "-40px",
      borderRadius: "12px",
      padding: "20px 10px",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
      border: `1px solid ${colors.border}`,
      width: "100%",
    },
    statusCardTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: colors.text,
      marginBottom: "16px",
      paddingLeft: "4px",
    },
    statusCardRow: {
      display: "flex",
      justifyContent: "space-between",
      width: "100%",
    },
    menuItem: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
      position: "relative" as const,
      flex: 1,
    },
    menuLabel: {
      fontSize: "11px",
      color: colors.text,
      textAlign: "center" as const,
    },
    badge: {
      position: "absolute" as const,
      top: "-5px",
      right: "5px",
      backgroundColor: colors.accent,
      color: colors.accentText,
      fontSize: "10px",
      fontWeight: "bold",
      width: "16px",
      height: "16px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: `1px solid ${colors.card}`,
    },
    placeholderArea: {
      padding: "20px",
      color: colors.muted,
      fontSize: "14px",
      textAlign: "center" as const,
      marginTop: "20px",
    },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .desktop-only { display: none; }
        @media (min-width: 768px) {
          .desktop-only { display: flex !important; }
        }
      `}</style>

      {/* HEADER (WRAPPER + CONTENT) */}
      <div style={styles.headerWrapper}>
        <div style={styles.headerContent}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              <UserCircle size={40} />
            </div>
            <div>
              <div style={styles.userName}>
                {user?.email?.split("@")[0] || "Visitante"}
              </div>
              <div style={styles.userEmail}>{user?.email}</div>
            </div>
          </div>

          <div style={styles.headerActions}>
            <button
              onClick={() => navigate("/")}
              style={styles.headerBtn}
              className="desktop-only"
              title="Voltar para a Loja"
            >
              <Home size={24} />
            </button>

            <button
              onClick={() => navigate("/configuracoes")}
              style={{ ...styles.headerBtn, display: "flex" }}
              title="Configurações"
            >
              <Settings size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* CORPO CENTRALIZADO */}
      <div style={styles.bodyContainer}>
        {/* MEUS PEDIDOS STATUS */}
        <div style={styles.statusCard}>
          <div style={styles.statusCardTitle}>Meus pedidos</div>
          <div style={styles.statusCardRow}>
          {menuItems.map((item, index) => (
            <div
              key={index}
              style={styles.menuItem}
              onClick={() => navigate(item.route)}
            >
              <div style={{ color: colors.text }}>{item.icon}</div>
              <span style={styles.menuLabel}>{item.label}</span>
              {item.count > 0 && (
                <div style={styles.badge}>
                  {item.count > 9 ? "9+" : item.count}
                </div>
              )}
            </div>
          ))}
          </div>
        </div>

        {/* ÁREA FUTURA */}
        <div style={styles.placeholderArea}></div>

        {/* PRODUTOS RECOMENDADOS — barra aparece quando "Você vai adorar" sai do topo */}
        <RevealOnScrollProductSearchBar
          anchorRef={recommendedSectionRef}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearchSubmit={() => {}}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          categories={STORE_CATEGORIES}
          showWhenAnchorOutOfView
        />
        <RecommendedProducts
          scrollAnchorRef={recommendedSectionRef}
          searchQuery={searchValue}
          categoryId={categoryId}
          scrollStorageKey="profile-recommended-scroll"
        />
      </div>

      {/* MENU INFERIOR */}
      <MobileBottomNav />
    </div>
  );
};
