import { useCallback, useEffect, useState } from "react";
import { listAllBackoffice } from "../../services/orderService";
import {
  getEffectiveDeliveryStatus,
  getEffectivePaymentStatus,
} from "../../utils/orderHelpers";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Interfaces DashboardStats
interface DashboardStats {
  revenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
}
interface RecentOrder {
  id: string;
  created_at: string;
  total_amount: number;
  payment_status: string;
  delivery_status: string;
  user_id: string;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect e fetchDashboardData
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [productCountRes, userCountRes, ordersPage] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        listAllBackoffice(user.id, { page: 1, limit: 5000 }),
      ]);

      const orders = ordersPage.orders;
      const totalRevenue =
        orders
          .filter((o) => getEffectivePaymentStatus(o) === "approved")
          .reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;
      setStats({
        revenue: totalRevenue,
        totalOrders: ordersPage.total ?? orders.length,
        totalProducts: productCountRes.count || 0,
        totalCustomers: userCountRes.count || 0,
      });
      setRecentOrders(
        orders.slice(0, 5).map((o) => ({
          id: o.id,
          created_at: o.created_at,
          total_amount: o.total_amount,
          payment_status: getEffectivePaymentStatus(o),
          delivery_status: getEffectiveDeliveryStatus(o),
          user_id: o.user_id,
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "rejected":
      case "cancelled":
        return "#ef4444";
      default:
        return colors.muted;
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "#10b981";
      case "shipped":
      case "in_process":
        return "#6366f1";
      case "pending":
        return "#f59e0b";
      case "cancelled":
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
                <th style={styles.th}>Pagamento</th>
                <th style={styles.th}>Entrega</th>
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
                        backgroundColor:
                          getPaymentStatusColor(order.payment_status) + "20",
                        color: getPaymentStatusColor(order.payment_status),
                        border: `1px solid ${getPaymentStatusColor(order.payment_status)}`,
                      }}
                    >
                      {order.payment_status === "approved" && (
                        <CheckCircle size={12} />
                      )}
                      {order.payment_status === "rejected" && (
                        <XCircle size={12} />
                      )}
                      {order.payment_status}
                    </span>
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
                        backgroundColor:
                          getDeliveryStatusColor(order.delivery_status) + "20",
                        color: getDeliveryStatusColor(order.delivery_status),
                        border: `1px solid ${getDeliveryStatusColor(order.delivery_status)}`,
                      }}
                    >
                      {order.delivery_status}
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
