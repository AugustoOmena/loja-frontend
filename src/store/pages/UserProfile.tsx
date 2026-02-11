import { User, Package, LogOut } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export const UserProfile = () => {
  const { colors } = useTheme();
  // Mock de dados (Depois pegaremos do Contexto de Auth)
  const user = { name: "Visitante", email: "cliente@exemplo.com" };

  const styles = {
    menuItem: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      width: "100%",
      padding: "15px",
      backgroundColor: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "16px",
      color: colors.text,
      textAlign: "left" as const,
    },
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "20px auto",
        padding: "20px",
        fontFamily: "sans-serif",
        backgroundColor: colors.bg,
        color: colors.text,
        minHeight: "100vh",
      }}
    >
      <h1 style={{ marginBottom: "30px", color: colors.text }}>Minha Conta</h1>

      <div
        style={{
          backgroundColor: colors.card,
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          border: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: colors.bg,
            border: `1px solid ${colors.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <User size={30} color={colors.muted} />
        </div>
        <div>
          <div style={{ fontWeight: "bold", fontSize: "18px", color: colors.text }}>
            {user.name}
          </div>
          <div style={{ color: colors.muted, fontSize: "14px" }}>{user.email}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button style={styles.menuItem}>
          <Package size={20} color={colors.text} /> Meus Pedidos
        </button>
        <button style={{ ...styles.menuItem, color: colors.muted }}>
          <LogOut size={20} color={colors.muted} /> Sair da conta
        </button>
      </div>
    </div>
  );
};
