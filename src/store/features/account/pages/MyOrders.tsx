import { Package } from "lucide-react";

export const MyOrders = () => {
  return (
    <div>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "20px",
          color: "#1e293b",
        }}
      >
        Meus Pedidos
      </h2>

      {/* Mock de lista vazia ou com itens */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "40px",
          textAlign: "center",
          backgroundColor: "white",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "20px",
            backgroundColor: "#f1f5f9",
            borderRadius: "50%",
            marginBottom: "15px",
          }}
        >
          <Package size={40} color="#94a3b8" />
        </div>
        <h3 style={{ color: "#475569", marginBottom: "10px" }}>
          Nenhum pedido recente
        </h3>
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>
          Quando você fizer compras, elas aparecerão aqui.
        </p>
        <button
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#0f172a",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Ir para a Loja
        </button>
      </div>
    </div>
  );
};
