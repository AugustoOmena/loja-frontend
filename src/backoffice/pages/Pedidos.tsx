import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../services/supabaseClient";
import {
  Eye,
  XCircle,
  AlertTriangle,
  Package,
  Trash2,
  Ticket,
  CreditCard,
  Loader2,
  X,
  Search,
  Filter,
  User,
} from "lucide-react";

import type { OrderItem } from "../../types/index";

interface Order {
  id: string; // uuid
  created_at: string;
  status: string;
  total_amount: number;
  user_id: string;
  payment_id?: string;

  // Campos trazidos via JOIN (Relacionamento)
  items: OrderItem[];
  user_email: string;
}

export const PedidosBackoffice = () => {
  const { colors, theme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FILTROS ---
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState("");

  // --- ESTADOS DOS MODAIS ---
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // --- ESTADOS DE AÇÃO ---
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [statusToConfirm, setStatusToConfirm] = useState<string>("");
  const [itemToRemove, setItemToRemove] = useState<OrderItem | null>(null);
  const [compensationType, setCompensationType] = useState<
    "refund" | "voucher" | null
  >(null);

  const safeFormat = (value: any) => {
    const num = Number(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // --- BUSCAR PEDIDOS (COM JOINS DE PERFIL E ITENS) ---
  const fetchOrders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        profiles (
          email
        ),
        order_items (
          id,
          product_name,
          quantity,
          price
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (!error && data) {
      const formattedData: Order[] = data.map((o: any) => {
        // 1. Trata o Email (Vem da tabela profiles)
        let email = "Email não encontrado";
        if (o.profiles) {
          // O Supabase pode retornar array ou objeto dependendo da relação
          email = Array.isArray(o.profiles)
            ? o.profiles[0]?.email
            : o.profiles.email;
        }

        // 2. Trata os Itens (Vem da tabela order_items)
        // Mapeamos para garantir que o front receba o formato certo
        const rawItems = o.order_items || [];
        const items: OrderItem[] = Array.isArray(rawItems)
          ? rawItems.map((i: any) => ({
              id: i.id,
              // AQUI O PULO DO GATO: Sua tabela usa 'product_name', mas a interface pode esperar 'name'
              // Vamos normalizar para 'product_name' conforme sua interface OrderItem
              product_name: i.product_name,
              name: i.product_name, // Fallback se algum lugar usar .name
              quantity: i.quantity,
              price: i.price,
            }))
          : [];

        return {
          id: o.id,
          created_at: o.created_at,
          status: o.status,
          total_amount: o.total_amount,
          user_id: o.user_id,
          payment_id: o.payment_id,
          items: items, // Agora temos os itens reais do banco!
          user_email: email || "Desconhecido",
        };
      });
      setOrders(formattedData);
    } else {
      console.error("Erro ao buscar pedidos:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- FILTRAGEM ---
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const idMatch = order.id.toLowerCase().includes(searchLower);
      const emailMatch = order.user_email.toLowerCase().includes(searchLower);
      return idMatch || emailMatch;
    }
    return true;
  });

  // --- ALTERAR STATUS ---
  const handleStatusSelect = (newStatus: string) => {
    setStatusToConfirm(newStatus);
    setIsStatusConfirmOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedOrder || !statusToConfirm) return;
    setProcessingAction(true);

    const { error } = await supabase
      .from("orders")
      .update({ status: statusToConfirm })
      .eq("id", selectedOrder.id);

    if (!error) {
      const updated = { ...selectedOrder, status: statusToConfirm };
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setIsStatusConfirmOpen(false);
    } else {
      alert("Erro ao atualizar status.");
    }
    setProcessingAction(false);
  };

  // --- CANCELAR TOTALMENTE ---
  const handleFullCancel = async () => {
    if (!selectedOrder) return;
    if (!confirm("ATENÇÃO: Cancelar pedido?")) return;
    setProcessingAction(true);

    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", selectedOrder.id);

    if (!error) {
      const updated = { ...selectedOrder, status: "cancelled" };
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    }
    setProcessingAction(false);
  };

  // --- REMOVER ITEM (AGORA COM DELETE NA TABELA CERTA) ---
  const handleRemoveItemConfirm = async () => {
    if (!selectedOrder || !itemToRemove || !compensationType) return;
    setProcessingAction(true);

    try {
      const amountToCompensate =
        (Number(itemToRemove.price) || 0) *
        (Number(itemToRemove.quantity) || 1);

      // 1. DELETE REAL NA TABELA order_items
      const { error: deleteError } = await supabase
        .from("order_items")
        .delete()
        .eq("id", itemToRemove.id);

      if (deleteError) throw deleteError;

      // 2. ATUALIZA O TOTAL NA TABELA orders
      const newTotal =
        (Number(selectedOrder.total_amount) || 0) - amountToCompensate;

      const { error: updateError } = await supabase
        .from("orders")
        .update({ total_amount: newTotal })
        .eq("id", selectedOrder.id);

      if (updateError) throw updateError;

      // 3. ATUALIZA A UI
      const newItems = selectedOrder.items.filter(
        (i) => i.id !== itemToRemove.id,
      );
      const updatedOrder = {
        ...selectedOrder,
        items: newItems,
        total_amount: newTotal,
      };

      setSelectedOrder(updatedOrder);
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
      );

      alert(
        compensationType === "voucher"
          ? "Item removido. Voucher gerado (Simulado)."
          : "Item removido. Reembolso solicitado.",
      );
      setItemToRemove(null);
      setCompensationType(null);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao remover item: " + e.message);
    } finally {
      setProcessingAction(false);
    }
  };

  // --- HELPERS VISUAIS ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return { bg: "#dcfce7", color: "#166534" };
      case "pending":
        return { bg: "#fef9c3", color: "#854d0e" };
      case "in_process":
        return { bg: "#dbeafe", color: "#1e40af" };
      case "shipped":
        return { bg: "#f3e8ff", color: "#6b21a8" };
      case "cancelled":
        return { bg: "#fee2e2", color: "#991b1b" };
      default:
        return { bg: "#f3f4f6", color: "#374151" };
    }
  };
  const getStatusLabel = (status: string) => {
    const map: any = {
      pending: "Pendente",
      approved: "Pago",
      in_process: "Processando",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return map[status] || status;
  };

  const styles = {
    container: {
      padding: "20px",
      backgroundColor: colors.bg,
      minHeight: "100vh",
      color: colors.text,
      fontFamily: "sans-serif",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    toolbar: {
      display: "flex",
      gap: "15px",
      marginBottom: "20px",
      flexWrap: "wrap" as const,
    },
    searchWrapper: {
      flex: 1,
      minWidth: "250px",
      display: "flex",
      alignItems: "center",
      backgroundColor: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: "6px",
      padding: "0 10px",
    },
    searchInput: {
      flex: 1,
      padding: "10px",
      border: "none",
      outline: "none",
      backgroundColor: "transparent",
      color: colors.text,
    },
    filterWrapper: {
      display: "flex",
      alignItems: "center",
      backgroundColor: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: "6px",
      padding: "0 10px",
      minWidth: "180px",
    },
    filterSelect: {
      flex: 1,
      padding: "10px",
      border: "none",
      outline: "none",
      backgroundColor: "transparent",
      color: colors.text,
      cursor: "pointer",
    },
    tableContainer: {
      backgroundColor: colors.card,
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      overflowX: "auto" as const,
      border: `1px solid ${colors.border}`,
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
      fontSize: "14px",
    },
    th: {
      textAlign: "left" as const,
      padding: "15px",
      borderBottom: `1px solid ${colors.border}`,
      color: colors.muted,
      fontWeight: "600",
    },
    td: {
      padding: "15px",
      borderBottom: `1px solid ${colors.border}`,
      color: colors.text,
    },
    badge: (status: string) => {
      const style = getStatusColor(status);
      return {
        backgroundColor: style.bg,
        color: style.color,
        padding: "4px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "bold",
        display: "inline-block",
      };
    },
    actionBtn: {
      backgroundColor: "transparent",
      border: `1px solid ${colors.border}`,
      color: colors.text,
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "12px",
    },
    overlay: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modal: {
      backgroundColor: colors.card,
      width: "100%",
      maxWidth: "600px",
      maxHeight: "90vh",
      overflowY: "auto" as const,
      borderRadius: "12px",
      padding: "25px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    },
    confirmModal: {
      backgroundColor: colors.card,
      width: "90%",
      maxWidth: "400px",
      borderRadius: "12px",
      padding: "25px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
      zIndex: 1100,
      border: `1px solid ${colors.border}`,
      textAlign: "center" as const,
    },
    confirmOverlay: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1100,
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      borderBottom: `1px solid ${colors.border}`,
      paddingBottom: "15px",
    },
    sectionTitle: {
      fontSize: "16px",
      fontWeight: "bold",
      margin: "20px 0 10px 0",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    itemRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px",
      backgroundColor: theme === "dark" ? "#0f172a" : "#f8fafc",
      borderRadius: "8px",
      marginBottom: "8px",
      border: `1px solid ${colors.border}`,
    },
    cancelBtn: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      border: "1px solid #fecaca",
      borderRadius: "8px",
      fontWeight: "bold",
      cursor: "pointer",
      marginTop: "30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
    confirmBtn: {
      flex: 1,
      padding: "10px",
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontWeight: "bold",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "5px",
    },
    abortBtn: {
      flex: 1,
      padding: "10px",
      backgroundColor: "transparent",
      border: `1px solid ${colors.border}`,
      color: colors.text,
      borderRadius: "6px",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
          Gestão de Pedidos
        </h1>
        <button
          onClick={fetchOrders}
          style={{
            ...styles.actionBtn,
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
          }}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            "Atualizar Lista"
          )}
        </button>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color={colors.muted} />
          <input
            style={styles.searchInput}
            placeholder="Buscar por ID ou Email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button
              onClick={() => setSearchText("")}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                color: colors.muted,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div style={styles.filterWrapper}>
          <Filter size={18} color={colors.muted} />
          <select
            style={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="approved">Pago</option>
            <option value="in_process">Processando</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregue</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Cliente</th>
              <th style={styles.th}>Data</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td style={styles.td} title={order.id}>
                    #{order.id.substring(0, 8)}...
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {order.user_email}
                      </span>
                      <span style={{ fontSize: "11px", color: colors.muted }}>
                        ID: {order.user_id.substring(0, 6)}...
                      </span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge(order.status)}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td style={styles.td}>R$ {safeFormat(order.total_amount)}</td>
                  <td style={styles.td}>
                    <button
                      style={styles.actionBtn}
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsModalOpen(true);
                      }}
                    >
                      <Eye size={16} /> Detalhes
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: colors.muted,
                  }}
                >
                  {loading ? "Carregando..." : "Nenhum pedido encontrado."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedOrder && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>
                  Pedido #{selectedOrder.id.substring(0, 8)}
                </h2>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    color: colors.muted,
                    fontSize: "13px",
                    marginTop: "4px",
                  }}
                >
                  <User size={14} /> {selectedOrder.user_email}
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: colors.text,
                }}
              >
                <XCircle size={28} />
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: colors.muted,
                }}
              >
                Alterar Status
              </label>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleStatusSelect(e.target.value)}
                disabled={processingAction}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.bg,
                  color: colors.text,
                  fontSize: "14px",
                }}
              >
                <option value="pending">Pendente</option>
                <option value="approved">Pago</option>
                <option value="in_process">Em Processamento</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <h3 style={styles.sectionTitle}>
              <Package size={18} /> Itens do Pedido
            </h3>
            <div>
              {selectedOrder.items.length === 0 ? (
                <p
                  style={{
                    color: colors.muted,
                    fontStyle: "italic",
                    padding: "10px",
                  }}
                >
                  Nenhum item listado (Tabela order_items vazia para este ID).
                </p>
              ) : (
                selectedOrder.items.map((item, index) => (
                  <div key={`${item.id}-${index}`} style={styles.itemRow}>
                    <div>
                      {/* --- USANDO product_name CONFORME SUA TABELA --- */}
                      <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                        {item.product_name}
                      </div>
                      <div style={{ fontSize: "12px", color: colors.muted }}>
                        {item.quantity}x R$ {safeFormat(item.price)}
                      </div>
                    </div>
                    {selectedOrder.status !== "cancelled" && (
                      <button
                        onClick={() => setItemToRemove(item)}
                        disabled={processingAction}
                        style={{
                          background: "none",
                          border: "none",
                          color: colors.muted,
                          cursor: "pointer",
                          padding: "5px",
                        }}
                      >
                        <Trash2 size={18} color="#ef4444" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {itemToRemove && (
              <div
                style={{
                  backgroundColor: theme === "dark" ? "#334155" : "#f1f5f9",
                  padding: "15px",
                  borderRadius: "8px",
                  marginTop: "15px",
                  border: "1px solid #ef4444",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "10px",
                    color: colors.text,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <AlertTriangle size={16} color="#ef4444" /> Removendo:{" "}
                  {itemToRemove.product_name}
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    marginBottom: "10px",
                    color: colors.muted,
                  }}
                >
                  Compensar: R${" "}
                  {safeFormat(
                    (Number(itemToRemove.price) || 0) *
                      (Number(itemToRemove.quantity) || 1),
                  )}
                  ?
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setCompensationType("voucher")}
                    style={{
                      ...styles.actionBtn,
                      backgroundColor:
                        compensationType === "voucher"
                          ? colors.text
                          : "transparent",
                      color:
                        compensationType === "voucher"
                          ? colors.bg
                          : colors.text,
                    }}
                  >
                    <Ticket size={16} /> Voucher
                  </button>
                  <button
                    onClick={() => setCompensationType("refund")}
                    style={{
                      ...styles.actionBtn,
                      backgroundColor:
                        compensationType === "refund"
                          ? colors.text
                          : "transparent",
                      color:
                        compensationType === "refund" ? colors.bg : colors.text,
                    }}
                  >
                    <CreditCard size={16} /> Estornar
                  </button>
                </div>
                {compensationType && (
                  <button
                    onClick={handleRemoveItemConfirm}
                    disabled={processingAction}
                    style={{
                      width: "100%",
                      marginTop: "15px",
                      padding: "10px",
                      backgroundColor: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {processingAction ? "Processando..." : "Confirmar Remoção"}
                  </button>
                )}
                <button
                  onClick={() => {
                    setItemToRemove(null);
                    setCompensationType(null);
                  }}
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    border: "none",
                    background: "none",
                    fontSize: "12px",
                    cursor: "pointer",
                    color: colors.muted,
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}

            {selectedOrder.status !== "cancelled" && (
              <button
                onClick={handleFullCancel}
                disabled={processingAction}
                style={styles.cancelBtn}
              >
                <XCircle size={20} /> Cancelar Pedido Totalmente
              </button>
            )}
          </div>
        </div>
      )}

      {isStatusConfirmOpen && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmModal}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "10px",
                color: colors.text,
              }}
            >
              Confirmar alteração?
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: colors.muted,
                marginBottom: "25px",
              }}
            >
              Para <strong>{getStatusLabel(statusToConfirm)}</strong>?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setIsStatusConfirmOpen(false)}
                style={styles.abortBtn}
              >
                Cancelar
              </button>
              <button onClick={confirmStatusChange} style={styles.confirmBtn}>
                {processingAction ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Confirmar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
