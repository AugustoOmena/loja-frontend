import { useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  LogOut,
  Loader2,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext"; // <--- Importe o tema
import { authService } from "../../services/authService";

export const BackofficeLayout = () => {
  const { user, isAdmin, loading } = useAuth();
  const { theme, toggleTheme, colors } = useTheme(); // Hook do tema
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/backoffice/login");
      } else if (!isAdmin) {
        alert("Acesso negado.");
        authService.signOut().then(() => navigate("/backoffice/login"));
      }
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1e293b",
          color: "white",
        }}
      >
        <Loader2 className="animate-spin" />
        <span style={{ marginLeft: 10 }}>Carregando...</span>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    // CONTAINER PRINCIPAL: Ocupa 100% da tela e não deixa rolar a página inteira
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "sans-serif",
      }}
    >
      {/* SIDEBAR: Fixa, cor escura sempre (como você pediu) */}
      <aside
        style={{
          width: "250px",
          background: "#0f172a", // Slate 900 Fixo
          color: "white",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0, // Garante que não encolha
        }}
      >
        <div style={{ padding: "20px", borderBottom: "1px solid #1e293b" }}>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              letterSpacing: "1px",
            }}
          >
            LOJA
          </h2>
          <p style={{ fontSize: "12px", color: "#64748b" }}>Admin Panel</p>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            flex: 1,
            padding: "20px 10px",
            overflowY: "auto",
          }}
        >
          <NavLink
            to="/backoffice/dashboard"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            currentPath={location.pathname}
          />
          <NavLink
            to="/backoffice/produtos"
            icon={<ShoppingBag size={20} />}
            label="Produtos"
            currentPath={location.pathname}
          />
          <NavLink
            to="/backoffice/usuarios"
            icon={<Users size={20} />}
            label="Usuários"
            currentPath={location.pathname}
          />
        </nav>

        {/* ÁREA INFERIOR: Botão Tema + Logout */}
        <div
          style={{
            padding: "20px",
            borderTop: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* Botão de Tema */}
          <button
            onClick={toggleTheme}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px",
              background: "#1e293b",
              border: "none",
              borderRadius: "8px",
              color: "#94a3b8",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            {theme === "dark" ? (
              <Sun size={18} color="#fbbf24" />
            ) : (
              <Moon size={18} />
            )}
            <span style={{ fontSize: "14px" }}>
              Modo {theme === "dark" ? "Claro" : "Escuro"}
            </span>
          </button>

          <button
            onClick={async () => {
              await authService.signOut();
              navigate("/backoffice/login");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#f87171",
              fontSize: "14px",
            }}
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL: Aqui acontece a mágica do scroll independente */}
      <main
        style={{
          flex: 1,
          background: colors.bg, // Usa a cor do tema dinâmico
          overflowY: "auto", // <--- SÓ ISSO AQUI ROLA AGORA
          padding: "30px",
          transition: "background-color 0.3s", // Transição suave
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

// Componente auxiliar para link ativo
const NavLink = ({ to, icon, label, currentPath }: any) => {
  const isActive = currentPath === to;
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        color: isActive ? "white" : "#94a3b8",
        textDecoration: "none",
        padding: "12px 15px",
        borderRadius: "8px",
        fontSize: "14px",
        background: isActive ? "#6366f1" : "transparent", // Indigo se ativo
        fontWeight: isActive ? "600" : "400",
        transition: "0.2s",
      }}
    >
      {icon}
      {label}
    </Link>
  );
};
