import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";
import { authService } from "../../../services/authService";
import { ChevronLeft, LogOut, Moon, Sun } from "lucide-react";

export const Settings = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme, colors } = useTheme();

  const handleLogout = async () => {
    try {
      // 2. Executa o logout real no Supabase
      await authService.signOut();

      // 3. Redireciona para a Home da Loja (StoreHome)
      navigate("/");
    } catch (error) {
      console.error("Erro ao tentar sair:", error);
      // Mesmo com erro, força a ida para home
      navigate("/");
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: colors.bg,
      fontFamily: "sans-serif",
    },
    header: {
      backgroundColor: colors.card,
      padding: "15px",
      display: "flex",
      alignItems: "center",
      gap: "15px",
      borderBottom: `1px solid ${colors.border}`,
    },
    backBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: colors.text,
    },
    title: { fontSize: "18px", fontWeight: "bold", color: colors.text },
    section: { padding: "20px" },
    item: {
      backgroundColor: colors.card,
      padding: "15px",
      borderRadius: "8px",
      marginBottom: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      border: `1px solid ${colors.border}`,
      cursor: "pointer",
      color: colors.text,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate("/minha-conta")} style={styles.backBtn}>
          <ChevronLeft size={24} />
        </button>
        <span style={styles.title}>Configurações</span>
      </div>

      <div style={styles.section}>
        <div style={styles.item} onClick={toggleTheme}>
          <span>Tema do App</span>
          {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
        </div>

        <div
          style={{ ...styles.item, color: "#ef4444", borderColor: "#ef4444" }}
          onClick={handleLogout}
        >
          <span>Sair da Conta</span>
          <LogOut size={20} />
        </div>
      </div>
    </div>
  );
};
