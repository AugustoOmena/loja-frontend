import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useTheme } from "../../contexts/ThemeContext"; // <--- Importe
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

// ... (Interfaces DashboardStats e RecentOrder mantêm iguais) ...
interface DashboardStats {
  revenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
}
interface RecentOrder {
  id: number;
  created_at: string;
  total_amount: number;
  status: string;
  user_id: string;
}

export const Dashboard = () => {
  const { colors, theme } = useTheme(); // <--- Usar as cores do contexto
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // ... (useEffect e fetchDashboardData mantêm IGUAIS ao anterior) ...
  useEffect(() => {
    // Simulação do fetch para economizar espaço na resposta,
    // MANTENHA O SEU FETCH ORIGINAL AQUI.
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at, user_id")
        .order("created_at", { ascending: false });

      const totalRevenue =
        orders
          ?.filter((o) => o.status === "approved")
          .reduce((acc, curr) => acc + curr.total_amount, 0) || 0;
      setStats({
        revenue: totalRevenue,
        totalOrders: orders?.length || 0,
        totalProducts: productCount || 0,
        totalCustomers: userCount || 0,
      });
      setRecentOrders(orders?.slice(0, 5) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "rejected":
        return "#ef4444";
      default:
        return colors.muted;
    }
  };

  if (loading)
    return (
      <div style={{ padding: 40, color: colors.muted }}>Carregando...</div>
    );

  // --- ESTILOS DINÂMICOS ---
  // Criamos o objeto de estilo aqui dentro para acessar 'colors'
  const styles = {
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: colors.text,
      marginBottom: "25px",
    },
    card: {
      backgroundColor: colors.card,
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      border: `1px solid ${colors.border}`,
    },
    cardLabel: {
      fontSize: "14px",
      color: colors.muted,
      marginBottom: "5px",
      fontWeight: "500",
    },
    cardValue: {
      fontSize: "24px",
      fontWeight: "bold",
      color: colors.text,
      margin: 0,
    },
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      color: colors.text,
      marginBottom: "15px",
    },
    tableCard: {
      backgroundColor: colors.card,
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      border: `1px solid ${colors.border}`,
      overflow: "hidden",
    },
    theadRow: {
      backgroundColor: theme === "dark" ? "#1e293b" : "#f8fafc",
      borderBottom: `1px solid ${colors.border}`,
    },
    th: {
      padding: "15px",
      fontSize: "13px",
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase" as const,
      textAlign: "left" as const,
    },
    tr: { borderBottom: `1px solid ${colors.border}` },
    td: { padding: "15px", fontSize: "14px", color: colors.text },
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={styles.title}>Visão Geral</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        {/* Card Receita */}
        <div style={styles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "15px",
            }}
          >
            <div>
              <p style={styles.cardLabel}>Receita Total</p>
              <h3 style={styles.cardValue}>
                {stats.revenue.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </h3>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  theme === "dark" ? "rgba(22, 101, 52, 0.2)" : "#dcfce7",
                color: "#166534",
              }}
            >
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        {/* Card Pedidos */}
        <div style={styles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "15px",
            }}
          >
            <div>
              <p style={styles.cardLabel}>Total Pedidos</p>
              <h3 style={styles.cardValue}>{stats.totalOrders}</h3>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  theme === "dark" ? "rgba(30, 64, 175, 0.2)" : "#dbeafe",
                color: "#1e40af",
              }}
            >
              <ShoppingBag size={24} />
            </div>
          </div>
        </div>

        {/* Card Produtos */}
        <div style={styles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "15px",
            }}
          >
            <div>
              <p style={styles.cardLabel}>Produtos</p>
              <h3 style={styles.cardValue}>{stats.totalProducts}</h3>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  theme === "dark" ? "rgba(107, 33, 168, 0.2)" : "#f3e8ff",
                color: "#6b21a8",
              }}
            >
              <Package size={24} />
            </div>
          </div>
        </div>

        {/* Card Clientes */}
        <div style={styles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "15px",
            }}
          >
            <div>
              <p style={styles.cardLabel}>Clientes</p>
              <h3 style={styles.cardValue}>{stats.totalCustomers}</h3>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  theme === "dark" ? "rgba(154, 52, 18, 0.2)" : "#ffedd5",
                color: "#9a3412",
              }}
            >
              <Users size={24} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2 style={styles.sectionTitle}>Últimos Pedidos</h2>
        <div style={styles.tableCard}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} style={styles.tr}>
                  <td style={styles.td}>#{order.id}</td>
                  <td style={styles.td}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Clock size={14} color={colors.muted} />
                      {new Date(order.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </td>
                  <td style={{ ...styles.td, fontWeight: "bold" }}>
                    {order.total_amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor: getStatusColor(order.status) + "20",
                        color: getStatusColor(order.status),
                        border: `1px solid ${getStatusColor(order.status)}`,
                      }}
                    >
                      {order.status === "approved" && <CheckCircle size={12} />}
                      {order.status === "rejected" && <XCircle size={12} />}
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
