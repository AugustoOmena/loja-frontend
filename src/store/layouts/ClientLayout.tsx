import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Package,
  User,
  LogOut,
  ChevronLeft,
  LayoutDashboard,
} from "lucide-react";
import { authService, supabase } from "../../services/authService";

export const ClientLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/login");
      else setUser(data.user);
      setLoading(false);
    });
  }, [navigate]);

  const handleLogout = async () => {
    await authService.signOut();
    navigate("/login");
  };

  const menuItems = [
    {
      label: "Início",
      icon: <LayoutDashboard size={20} />,
      path: "/minha-conta/dashboard",
    },
    {
      label: "Pedidos",
      icon: <Package size={20} />,
      path: "/minha-conta/pedidos",
    },
    { label: "Dados", icon: <User size={20} />, path: "/minha-conta/dados" },
  ];

  if (loading)
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>Carregando...</div>
    );

  return (
    <div style={styles.container}>
      {/* --- SIDEBAR (SÓ APARECE NO DESKTOP) --- */}
      {/* A classe desktop-only garante que suma no mobile */}
      <aside className="desktop-only" style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div
            style={{
              fontWeight: "900",
              color: "#ff4747",
              fontSize: "20px",
              marginBottom: "5px",
            }}
          >
            MINHA CONTA
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              wordBreak: "break-all",
            }}
          >
            {user?.email}
          </div>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            flex: 1,
          }}
        >
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={isActive ? styles.menuItemActive : styles.menuItem}
              >
                <span style={{ color: isActive ? "#0f172a" : "#94a3b8" }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div
          style={{
            borderTop: "1px solid #e2e8f0",
            paddingTop: "10px",
            marginTop: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          <button onClick={() => navigate("/")} style={styles.menuItem}>
            <ChevronLeft size={20} /> Voltar para Loja
          </button>
          <button
            onClick={handleLogout}
            style={{ ...styles.menuItem, color: "#ef4444", fontWeight: "bold" }}
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main style={styles.mainContent}>
        {/* Header Mobile (SÓ NO MOBILE) */}
        <div className="mobile-only" style={styles.mobileHeader}>
          <button
            onClick={() => navigate("/")}
            style={{
              border: "none",
              background: "none",
              display: "flex",
              alignItems: "center",
              color: "#64748b",
              padding: 0,
            }}
          >
            <ChevronLeft size={20} /> Loja
          </button>
          <h1 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>
            Minha Conta
          </h1>
          <button
            onClick={handleLogout}
            style={{
              border: "none",
              background: "none",
              color: "#ef4444",
              padding: 0,
            }}
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Card do Conteúdo */}
        <div style={styles.contentCard}>
          <Outlet />
        </div>
      </main>

      {/* --- BOTTOM NAV (SÓ NO MOBILE) --- */}
      <nav className="mobile-only" style={styles.bottomNav}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={styles.navItem}
            >
              <div style={{ color: isActive ? "#ff4747" : "#94a3b8" }}>
                {item.icon}
              </div>
              <span
                style={{
                  fontSize: "10px",
                  color: isActive ? "#ff4747" : "#64748b",
                  fontWeight: isActive ? "bold" : "normal",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    fontFamily: "sans-serif",
  },

  // Sidebar Desktop - Note que removemos 'position: sticky' daqui pois o CSS desktop-only vai controlar a exibição
  sidebar: {
    width: "260px",
    backgroundColor: "white",
    borderRight: "1px solid #e2e8f0",
    padding: "20px",
    flexDirection: "column",
    height: "100vh",
    position: "sticky",
    top: 0,
  },
  sidebarHeader: {
    marginBottom: "30px",
    paddingBottom: "20px",
    borderBottom: "1px solid #e2e8f0",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 15px",
    border: "none",
    backgroundColor: "transparent",
    color: "#64748b",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    width: "100%",
    textAlign: "left",
    transition: "0.2s",
  },
  menuItemActive: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 15px",
    border: "none",
    backgroundColor: "#f1f5f9",
    color: "#0f172a",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    width: "100%",
    textAlign: "left",
  },

  // Área Principal
  mainContent: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    paddingBottom: "80px",
  },
  contentCard: {
    maxWidth: "900px",
    margin: "0 auto",
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    minHeight: "80vh",
  },

  mobileHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "1px solid #e2e8f0",
  },

  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTop: "1px solid #eee",
    display: "flex",
    justifyContent: "space-around",
    padding: "10px 0",
    zIndex: 100,
  },
  navItem: {
    border: "none",
    background: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
};
