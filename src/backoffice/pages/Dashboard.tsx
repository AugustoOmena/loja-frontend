import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

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
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Buscar Produtos (Contagem)
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // 2. Buscar Perfis (Contagem de Clientes)
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // 3. Buscar Pedidos (Para calcular receita e pegar os recentes)
      // Limitamos a 1000 para cálculo de receita simples (em produção ideal usar RPC/Function)
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at, user_id")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calcular Receita (Soma de pedidos aprovados)
      const totalRevenue =
        orders
          ?.filter((o) => o.status === "approved")
          .reduce((acc, curr) => acc + curr.total_amount, 0) || 0;

      // Pegar os 5 mais recentes
      const recent = orders?.slice(0, 5) || [];

      setStats({
        revenue: totalRevenue,
        totalOrders: orders?.length || 0,
        totalProducts: productCount || 0,
        totalCustomers: userCount || 0,
      });

      setRecentOrders(recent);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#10b981"; // Verde
      case "pending":
        return "#f59e0b"; // Laranja
      case "rejected":
        return "#ef4444"; // Vermelho
      default:
        return "#64748b";
    }
  };

  const translateStatus = (status: string) => {
    const map: Record<string, string> = {
      approved: "Aprovado",
      pending: "Pendente",
      in_process: "Em Análise",
      rejected: "Recusado",
      cancelled: "Cancelado",
    };
    return map[status] || status;
  };

  if (loading) {
    return (
      <div style={{ padding: 40, color: "#64748b" }}>
        Carregando dados do painel...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Visão Geral</h1>

      {/* CARDS DE ESTATÍSTICAS */}
      <div style={styles.grid}>
        {/* Card Receita */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
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
                ...styles.iconBox,
                backgroundColor: "#dcfce7",
                color: "#166534",
              }}
            >
              <DollarSign size={24} />
            </div>
          </div>
          <div style={styles.cardFooter}>
            <TrendingUp size={14} color="#166534" />
            <span style={{ fontSize: "12px", color: "#166534" }}>
              Vendas aprovadas
            </span>
          </div>
        </div>

        {/* Card Pedidos */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <p style={styles.cardLabel}>Total Pedidos</p>
              <h3 style={styles.cardValue}>{stats.totalOrders}</h3>
            </div>
            <div
              style={{
                ...styles.iconBox,
                backgroundColor: "#dbeafe",
                color: "#1e40af",
              }}
            >
              <ShoppingBag size={24} />
            </div>
          </div>
          <div style={styles.cardFooter}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Todas as transações
            </span>
          </div>
        </div>

        {/* Card Produtos */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <p style={styles.cardLabel}>Produtos</p>
              <h3 style={styles.cardValue}>{stats.totalProducts}</h3>
            </div>
            <div
              style={{
                ...styles.iconBox,
                backgroundColor: "#f3e8ff",
                color: "#6b21a8",
              }}
            >
              <Package size={24} />
            </div>
          </div>
          <div style={styles.cardFooter}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Itens cadastrados
            </span>
          </div>
        </div>

        {/* Card Clientes */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <p style={styles.cardLabel}>Clientes</p>
              <h3 style={styles.cardValue}>{stats.totalCustomers}</h3>
            </div>
            <div
              style={{
                ...styles.iconBox,
                backgroundColor: "#ffedd5",
                color: "#9a3412",
              }}
            >
              <Users size={24} />
            </div>
          </div>
          <div style={styles.cardFooter}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Usuários registrados
            </span>
          </div>
        </div>
      </div>

      {/* LISTA DE PEDIDOS RECENTES */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Últimos Pedidos</h2>
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Valor</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    Nenhum pedido recente.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
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
                        <Clock size={14} color="#94a3b8" />
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
                          ...styles.badge,
                          backgroundColor: getStatusColor(order.status) + "20", // 20% opacidade
                          color: getStatusColor(order.status),
                          border: `1px solid ${getStatusColor(order.status)}`,
                        }}
                      >
                        {order.status === "approved" && (
                          <CheckCircle size={12} />
                        )}
                        {order.status === "rejected" && <XCircle size={12} />}
                        {translateStatus(order.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ESTILOS (CSS-in-JS)
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "sans-serif",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: "25px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  card: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "15px",
  },
  cardLabel: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "5px",
    fontWeight: "500",
  },
  cardValue: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#0f172a",
    margin: 0,
  },
  iconBox: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    paddingTop: "10px",
    borderTop: "1px solid #f1f5f9",
  },
  section: {
    marginTop: "20px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#334155",
    marginBottom: "15px",
  },
  tableCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  theadRow: {
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  th: {
    padding: "15px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "15px",
    fontSize: "14px",
    color: "#334155",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },
};
