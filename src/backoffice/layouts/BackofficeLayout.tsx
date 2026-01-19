import { useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  LogOut,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/authService"; // <--- Importante!

export const BackofficeLayout = () => {
  // O hook novo retorna isAdmin (booleano) e NÃO retorna signOut
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  // Proteção de Rota
  useEffect(() => {
    // Só verifica quando terminar de carregar
    if (!loading) {
      if (!user) {
        navigate("/backoffice/login");
      } else if (!isAdmin) {
        alert("Acesso negado. Apenas administradores.");
        // Usamos o serviço para deslogar
        authService.signOut().then(() => {
          navigate("/backoffice/login");
        });
      }
    }
  }, [user, isAdmin, loading, navigate]);

  // Tela de Loading (Essencial para não dar "falso negativo" na permissão)
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
        <span style={{ marginLeft: 10 }}>Verificando permissões...</span>
      </div>
    );
  }

  // Se passou do loading e não é admin/user, o useEffect vai redirecionar.
  // Retornamos null para não piscar a tela.
  if (!user || !isAdmin) return null;

  return (
    <div
      style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: "250px",
          background: "#1e293b",
          color: "white",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2
          style={{
            marginBottom: "30px",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          Admin Loja
        </h2>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            flex: 1,
          }}
        >
          <Link to="/backoffice/dashboard" style={linkStyle}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/backoffice/produtos" style={linkStyle}>
            <ShoppingBag size={20} /> Produtos
          </Link>
          <Link to="/backoffice/usuarios" style={linkStyle}>
            <Users size={20} /> Usuários
          </Link>
        </nav>

        <div
          style={{
            marginTop: "auto",
            paddingTop: "20px",
            borderTop: "1px solid #334155",
          }}
        >
          <button
            onClick={async () => {
              await authService.signOut();
              navigate("/backoffice/login");
            }}
            style={{
              ...linkStyle,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#f87171",
              width: "100%",
            }}
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <main style={{ flex: 1, padding: "40px", background: "#f1f5f9" }}>
        <Outlet />
      </main>
    </div>
  );
};

const linkStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "#cbd5e1",
  textDecoration: "none",
  padding: "10px",
  borderRadius: "5px",
  fontSize: "14px",
};
