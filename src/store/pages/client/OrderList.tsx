import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listByUser } from "../../../services/orderService";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { ChevronLeft, Package, Clock } from "lucide-react";
import { RecommendedProducts } from "../../../components/RecommendedProducts";

// Tipos de lista baseados na rota
const SCREEN_CONFIG: any = {
  pagamento: {
    title: "Aguardando Pagamento",
    statuses: ["pending"],
    emptyMsg: "Nenhum pagamento pendente.",
  },
  envio: {
    title: "Aguardando Envio",
    statuses: ["approved", "in_process"],
    emptyMsg: "Tudo pronto! Aguardando despacho.",
  },
  enviados: {
    title: "Enviados",
    statuses: ["shipped", "delivered"],
    emptyMsg: "Nenhum pedido em trânsito.",
  }, // Mock
  avaliar: {
    title: "Para Avaliar",
    statuses: ["completed"],
    emptyMsg: "Nenhum pedido para avaliar.",
  }, // Mock
  devolucao: {
    title: "Devoluções",
    statuses: ["returned"],
    emptyMsg: "Nenhuma devolução ativa.",
  }, // Mock
};

export const OrderList = () => {
  const { type } = useParams(); // Pega o parametro da URL (pagamento, envio, etc)
  const { user } = useAuth();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const config = SCREEN_CONFIG[type || "pagamento"];

  useEffect(() => {
    if (!user || !config) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        if (["enviados", "avaliar", "devolucao"].includes(type || "")) {
          setOrders([]);
          return;
        }
        const data = await listByUser({ userId: user.id });
        const filtered = data.filter((o) =>
          config.statuses.includes(o.status)
        );
        setOrders(filtered);
      } catch (err) {
        console.error("Erro ao buscar pedidos:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, type]);

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
      position: "sticky" as const,
      top: 0,
      zIndex: 10,
    },
    backBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: colors.text,
    },
    title: { fontSize: "18px", fontWeight: "bold", color: colors.text },
    list: { padding: "15px" },
    orderCard: {
      backgroundColor: colors.card,
      borderRadius: "8px",
      padding: "15px",
      marginBottom: "15px",
      border: `1px solid ${colors.border}`,
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    },
    orderHeader: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "10px",
      fontSize: "12px",
      color: colors.muted,
    },
    orderAmount: { fontSize: "16px", fontWeight: "bold", color: colors.text },
    statusBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "bold",
      marginTop: "10px",
      backgroundColor: type === "pagamento" ? "#fff7ed" : "#ecfdf5",
      color: type === "pagamento" ? "#c2410c" : "#047857",
    },
  };

  return (
    <div style={styles.container}>
      {/* HEADER FIXO */}
      <div style={styles.header}>
        <button onClick={() => navigate("/minha-conta")} style={styles.backBtn}>
          <ChevronLeft size={24} />
        </button>
        <span style={styles.title}>{config?.title || "Pedidos"}</span>
      </div>

      <div style={styles.list}>
        {loading ? (
          <div
            style={{ padding: 20, textAlign: "center", color: colors.muted }}
          >
            Carregando...
          </div>
        ) : orders.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: colors.muted,
            }}
          >
            <Package
              size={48}
              style={{ margin: "0 auto 15px", opacity: 0.5 }}
            />
            <p>{config?.emptyMsg}</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} style={styles.orderCard}>
              <div style={styles.orderHeader}>
                <span>Pedido #{order.id}</span>
                <span>
                  {new Date(order.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div style={styles.orderAmount}>
                R$ {order.total_amount.toFixed(2)}
              </div>
              <div style={styles.statusBadge}>
                {type === "pagamento" ? (
                  <Clock size={14} />
                ) : (
                  <Package size={14} />
                )}
                {type === "pagamento"
                  ? "Aguardando Pagamento"
                  : "Pronto para Envio"}
              </div>
            </div>
          ))
        )}
      </div>

      {/* VOCÊ VAI ADORAR (Infinito) */}
      <RecommendedProducts />
    </div>
  );
};
