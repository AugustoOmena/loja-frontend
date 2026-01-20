import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../services/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  Settings,
  Wallet,
  Package,
  Truck,
  MessageSquare,
  RotateCcw,
  UserCircle,
  Home,
} from "lucide-react";
import { RecommendedProducts } from "../../../components/RecommendedProducts";
import { MobileBottomNav } from "../../../components/MobileBottomNav";

export const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { colors, theme } = useTheme();

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
      const { count: paymentCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      const { count: shippingCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["approved", "in_process"]);

      setCounts({
        payment: paymentCount || 0,
        shipping: shippingCount || 0,
        shipped: 0,
        review: 0,
        returns: 0,
      });
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
    {
      label: "Devolução",
      icon: <RotateCcw size={24} />,
      count: counts.returns,
      route: "/pedidos/devolucao",
    },
  ];

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: colors.bg,
      fontFamily: "sans-serif",
      paddingBottom: "80px",
    },
    header: {
      backgroundColor: theme === "dark" ? "#1e293b" : "#0f172a",
      padding: "30px 20px 60px 20px",
      color: "white",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
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

    // Header Actions
    headerActions: {
      display: "flex",
      gap: "15px",
      alignItems: "center",
    },
    // Estilo base do botão (a visibilidade é controlada pelo CSS injetado abaixo)
    headerBtn: {
      background: "transparent",
      border: "none",
      color: "white",
      cursor: "pointer",
      alignItems: "center",
      gap: "4px",
      fontSize: "10px",
      opacity: 0.9,
      transition: "opacity 0.2s",
    },

    statusCard: {
      backgroundColor: colors.card,
      margin: "-40px 15px 0 15px",
      borderRadius: "12px",
      padding: "20px 10px",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
      display: "flex",
      justifyContent: "space-between",
      border: `1px solid ${colors.border}`,
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
      backgroundColor: "#ef4444",
      color: "white",
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
      {/* INJEÇÃO DE CSS PARA RESPONSIVIDADE DO BOTÃO HOME
        - Por padrão (.desktop-only) é display: none (Mobile First)
        - Em telas >= 768px (Tablet/Desktop), vira display: flex
      */}
      <style>{`
        .desktop-only { display: none; }
        @media (min-width: 768px) {
          .desktop-only { display: flex !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={styles.header}>
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
          {/* BOTÃO HOME (Inverso do Menu Bottom) */}
          {/* Apliquei a classe 'desktop-only' aqui */}
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
            style={{ ...styles.headerBtn, display: "flex" }} // Configurações aparece sempre
            title="Configurações"
          >
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* MEUS PEDIDOS STATUS */}
      <div style={styles.statusCard}>
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

      {/* ÁREA FUTURA */}
      <div style={styles.placeholderArea}></div>

      {/* PRODUTOS RECOMENDADOS */}
      <RecommendedProducts />

      {/* MENU INFERIOR (O CSS dele já cuida de sumir no Desktop) */}
      <MobileBottomNav />
    </div>
  );
};
