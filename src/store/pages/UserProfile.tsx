import { User, Package, LogOut } from "lucide-react";

export const UserProfile = () => {
  // Mock de dados (Depois pegaremos do Contexto de Auth)
  const user = { name: "Visitante", email: "cliente@exemplo.com" };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "20px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "30px" }}>Minha Conta</h1>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
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
            backgroundColor: "#eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <User size={30} color="#666" />
        </div>
        <div>
          <div style={{ fontWeight: "bold", fontSize: "18px" }}>
            {user.name}
          </div>
          <div style={{ color: "#666", fontSize: "14px" }}>{user.email}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button style={styles.menuItem}>
          <Package size={20} /> Meus Pedidos
        </button>
        <button style={{ ...styles.menuItem, color: "#ef4444" }}>
          <LogOut size={20} /> Sair da conta
        </button>
      </div>
    </div>
  );
};

const styles = {
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    width: "100%",
    padding: "15px",
    backgroundColor: "white",
    border: "1px solid #eee",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    textAlign: "left" as const,
  },
};
