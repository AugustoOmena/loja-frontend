import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  listAllBackoffice,
  getByIdBackoffice,
  backofficeFullCancel,
  backofficeCancelItems,
  backofficeUpdateStatus,
  type OrderApi,
} from "../../services/orderService";
import {
  getFulfillmentTracking,
  type FulfillmentTrackingResponse,
} from "../../services/fulfillmentService";
import {
  digitsOnly,
  getMelhorEnvioFromAddress,
  getMelhorEnvioRedirectUri,
  getMelhorEnvioScopesCsv,
  isMelhorEnvioCartUpstreamError,
  melhorEnvioAddToCart,
  melhorEnvioGetAuthorizeUrl,
  melhorEnvioGetStatus,
} from "../../services/melhorEnvioIntegrationService";
import { getShippingServiceDisplayName } from "../../utils/orderHelpers";
import { CheckoutErrorModal } from "../../components/CheckoutErrorModal";
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
  MapPin,
  Truck,
} from "lucide-react";

import type { OrderItem } from "../../types/index";

interface Order extends OrderApi {
  items: OrderItem[];
  user_email: string;
}

export const PedidosBackoffice = () => {
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // --- MELHOR ENVIO (OAUTH) ---
  const [melhorEnvioConnected, setMelhorEnvioConnected] = useState<
    boolean | null
  >(null);
  const [melhorEnvioStatusLoading, setMelhorEnvioStatusLoading] =
    useState(false);
  const [melhorEnvioStatusError, setMelhorEnvioStatusError] = useState<
    string | null
  >(null);

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
  const [envioLoading, setEnvioLoading] = useState(false);
  const [envioError, setEnvioError] = useState<string | null>(null);
  const [envioSuccess, setEnvioSuccess] = useState<string | null>(null);
  const [envioUpstreamError, setEnvioUpstreamError] = useState<string | null>(null);
  const [modalDetailLoading, setModalDetailLoading] = useState(false);
  const [trackingData, setTrackingData] =
    useState<FulfillmentTrackingResponse | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const safeFormat = (value: string | number) => {
    const num = Number(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const mapApiOrderToOrder = (o: OrderApi): Order => {
    const rawItems = o.items || [];
    const items: OrderItem[] = rawItems.map((i) => ({
      id: i.id,
      product_name: i.product_name,
      name: i.product_name,
      quantity: i.quantity,
      price: i.price,
    }));
    return {
      ...o,
      items,
      user_email: o.user_email || "Email não encontrado",
    };
  };

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await listAllBackoffice(user.id);
      setOrders(data.map(mapApiOrderToOrder));
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchMelhorEnvioStatus = useCallback(async () => {
    setMelhorEnvioStatusLoading(true);
    setMelhorEnvioStatusError(null);
    try {
      const res = await melhorEnvioGetStatus();
      setMelhorEnvioConnected(Boolean(res.connected));
    } catch (e) {
      setMelhorEnvioConnected(null);
      setMelhorEnvioStatusError(
        e instanceof Error
          ? e.message
          : "Erro ao consultar status do Melhor Envio."
      );
    } finally {
      setMelhorEnvioStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMelhorEnvioStatus();
  }, [fetchMelhorEnvioStatus]);

  const handleConnectMelhorEnvio = useCallback(async () => {
    setMelhorEnvioStatusError(null);
    try {
      const redirectUri = getMelhorEnvioRedirectUri();
      const scopesCsv = getMelhorEnvioScopesCsv();
      const { authorize_url } = await melhorEnvioGetAuthorizeUrl({
        redirectUri,
        scopesCsv,
      });
      window.location.href = authorize_url;
    } catch (e) {
      setMelhorEnvioStatusError(
        e instanceof Error ? e.message : "Erro ao iniciar conexão."
      );
    }
  }, []);

  // Ao abrir o modal, busca detalhe completo do pedido (com shipping_address)
  const [orderIdToDetail, setOrderIdToDetail] = useState<string | null>(null);
  useEffect(() => {
    if (!isModalOpen || !orderIdToDetail || !user?.id) return;
    setModalDetailLoading(true);
    setEnvioError(null);
    setEnvioSuccess(null);
    setTrackingData(null);
    getByIdBackoffice(orderIdToDetail, user.id)
      .then((api) => setSelectedOrder(mapApiOrderToOrder(api)))
      .catch(() => {})
      .finally(() => setModalDetailLoading(false));
  }, [isModalOpen, orderIdToDetail, user?.id]);

  // Busca rastreio quando o pedido tem tracking_code ou status shipped
  useEffect(() => {
    if (!selectedOrder?.id || !isModalOpen) return;
    const hasTracking =
      selectedOrder.tracking_code || selectedOrder.status === "shipped";
    if (!hasTracking) return;
    setTrackingLoading(true);
    getFulfillmentTracking(selectedOrder.id)
      .then(setTrackingData)
      .catch(() => setTrackingData(null))
      .finally(() => setTrackingLoading(false));
  }, [selectedOrder?.id, selectedOrder?.tracking_code, selectedOrder?.status, isModalOpen]);

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
    try {
      const updatedApi = await backofficeUpdateStatus(
        selectedOrder.id,
        statusToConfirm
      );
      const updated = mapApiOrderToOrder(updatedApi);
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setIsStatusConfirmOpen(false);
    } catch {
      alert("Erro ao atualizar status.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleFullCancel = async () => {
    if (!selectedOrder) return;
    if (!confirm("ATENÇÃO: Cancelar pedido?")) return;
    setProcessingAction(true);
    try {
      const updatedApi = await backofficeFullCancel(
        selectedOrder.id,
        "voucher"
      );
      const updated = mapApiOrderToOrder(updatedApi);
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      alert("Erro ao cancelar pedido.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleAddShippingToCart = async () => {
    if (!selectedOrder) return;
    setEnvioError(null);
    setEnvioSuccess(null);
    setEnvioUpstreamError(null);
    setEnvioLoading(true);
    try {
      if (!melhorEnvioConnected) {
        throw new Error("Melhor Envio não conectado. Conecte para continuar.");
      }

      const payer = selectedOrder.payer as {
        first_name?: string;
        last_name?: string;
        identification?: { number?: string };
        address?: {
          street_name?: string;
          street_number?: string;
          zip_code?: string;
          city?: string;
          federal_unit?: string;
          complement?: string;
          neighborhood?: string;
        };
      } | undefined;

      if (!payer) {
        throw new Error("Dados do pagador (payer) não disponíveis neste pedido.");
      }

      const toName = [payer.first_name, payer.last_name]
        .filter(Boolean)
        .map((s) => String(s).trim())
        .join(" ")
        .trim();
      if (!toName) {
        throw new Error(
          "Nome do destinatário não encontrado no payer (first_name e last_name)."
        );
      }

      const toDocument = digitsOnly(payer.identification?.number ?? "");
      if (!toDocument) {
        throw new Error(
          "Documento do destinatário não encontrado no payer (identification.number)."
        );
      }

      const addr = payer.address ?? selectedOrder.shipping_address;
      if (!addr) {
        throw new Error(
          "Endereço do destinatário não disponível (payer.address ou shipping_address)."
        );
      }

      const postal_code = digitsOnly(addr.zip_code).slice(0, 8);
      const city = (addr.city ?? "").trim();
      const stateAbbr = (addr.federal_unit ?? "").trim();
      const street = (addr.street_name ?? "").trim();

      if (!postal_code || postal_code.length !== 8) {
        throw new Error("CEP inválido no pedido. Verifique o endereço.");
      }
      if (!city || !stateAbbr || !street) {
        throw new Error("Endereço incompleto no pedido. Verifique os campos.");
      }

      const fromAddress = getMelhorEnvioFromAddress();
      if (!fromAddress.name?.trim()) {
        throw new Error(
          "Remetente: configure VITE_MELHORENVIO_FROM_NAME no ambiente e faça um novo deploy."
        );
      }

      const serviceIdRaw =
        selectedOrder.shipping_service != null &&
        String(selectedOrder.shipping_service).trim() !== ""
          ? String(selectedOrder.shipping_service).trim()
          : "1";
      const service = parseInt(serviceIdRaw, 10);
      if (Number.isNaN(service)) {
        throw new Error("ID do serviço de frete inválido.");
      }

      const fixedVolume = {
        weight: 0.3,
        width: 11,
        height: 2,
        length: 16,
      };
      const volumes = [fixedVolume];

      const products = selectedOrder.items.map((it) => ({
        name: it.product_name || "Produto",
        quantity: String(Number(it.quantity) || 1),
        unitary_value: (Number(it.price) || 0).toFixed(2),
      }));

      await melhorEnvioAddToCart({
        order_id: selectedOrder.id,
        service,
        from: fromAddress,
        to: {
          name: toName,
          document: toDocument,
          postal_code,
          address: street,
          number: addr.street_number?.trim() || undefined,
          complement: addr.complement?.trim() || undefined,
          district: addr.neighborhood?.trim() || undefined,
          city,
          state_abbr: stateAbbr,
          country_id: "BR",
        },
        products,
        volumes,
      });

      setEnvioSuccess("Frete inserido no carrinho do Melhor Envio.");
    } catch (e) {
      if (isMelhorEnvioCartUpstreamError(e)) {
        setEnvioUpstreamError(e.detail);
        setEnvioError(null);
      } else {
        setEnvioError(
          e instanceof Error
            ? e.message
            : "Erro ao inserir frete no carrinho do Melhor Envio."
        );
      }
    } finally {
      setEnvioLoading(false);
    }
  };

  const handleRemoveItemConfirm = async () => {
    if (!selectedOrder || !itemToRemove || !compensationType) return;
    setProcessingAction(true);
    try {
      const refundMethod = compensationType === "voucher" ? "voucher" : "mp";
      const updatedApi = await backofficeCancelItems(
        selectedOrder.id,
        [itemToRemove.id],
        refundMethod
      );
      const updated = mapApiOrderToOrder(updatedApi);
      setSelectedOrder(updated);
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
      alert(
        compensationType === "voucher"
          ? "Item removido. Voucher gerado."
          : "Item removido. Reembolso solicitado."
      );
      setItemToRemove(null);
      setCompensationType(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao remover item.");
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
    const map: Record<string, string> = {
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
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "12px", color: colors.muted }}>
              Melhor Envio:{" "}
              {melhorEnvioStatusLoading
                ? "verificando..."
                : melhorEnvioConnected === true
                  ? "conectado"
                  : melhorEnvioConnected === false
                    ? "desconectado"
                    : "indisponível"}
            </div>
            {melhorEnvioStatusError && (
              <div style={{ fontSize: "12px", color: "#ef4444" }}>
                {melhorEnvioStatusError}
              </div>
            )}
          </div>

          {melhorEnvioConnected === false && (
            <button
              onClick={handleConnectMelhorEnvio}
              style={{
                ...styles.actionBtn,
                backgroundColor: "#111827",
                color: "white",
                border: "none",
              }}
            >
              Conectar Melhor Envio
            </button>
          )}

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
                        setOrderIdToDetail(order.id);
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
                onClick={() => {
                  setIsModalOpen(false);
                  setOrderIdToDetail(null);
                  setEnvioError(null);
                }}
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

            {/* Endereço de entrega */}
            <h3 style={styles.sectionTitle}>
              <MapPin size={18} /> Endereço de entrega
            </h3>
            {modalDetailLoading ? (
              <div style={{ padding: "12px", color: colors.muted, fontSize: "14px" }}>
                Carregando...
              </div>
            ) : selectedOrder.shipping_address ? (
              <div
                style={{
                  padding: "14px 16px",
                  backgroundColor: theme === "dark" ? "#0f172a" : "#f8fafc",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  marginBottom: "12px",
                  fontSize: "14px",
                  color: colors.text,
                  lineHeight: 1.6,
                }}
              >
                {[
                  ["CEP", selectedOrder.shipping_address.zip_code],
                  ["Logradouro", selectedOrder.shipping_address.street_name],
                  ["Número", selectedOrder.shipping_address.street_number],
                  ["Complemento", selectedOrder.shipping_address.complement],
                  ["Bairro", selectedOrder.shipping_address.neighborhood],
                  ["Cidade", selectedOrder.shipping_address.city],
                  ["Estado", selectedOrder.shipping_address.federal_unit],
                ].map(
                  ([label, value]) =>
                    value != null &&
                    String(value).trim() !== "" && (
                      <div key={label} style={{ marginBottom: "4px" }}>
                        <span style={{ fontWeight: "600", color: colors.muted, marginRight: "8px" }}>
                          {label}:
                        </span>
                        {String(value).trim()}
                      </div>
                    )
                )}
                {(selectedOrder.shipping_amount != null ||
                  selectedOrder.shipping_service) && (
                  <div
                    style={{
                      marginTop: "12px",
                      paddingTop: "12px",
                      borderTop: `1px solid ${colors.border}`,
                      fontSize: "13px",
                      color: colors.text,
                    }}
                  >
                    {selectedOrder.shipping_amount != null && (
                      <div style={{ marginBottom: "4px" }}>
                        <span style={{ fontWeight: "600", color: colors.muted, marginRight: "8px" }}>
                          Frete:
                        </span>
                        R$ {Number(selectedOrder.shipping_amount).toFixed(2)}
                      </div>
                    )}
                    {selectedOrder.shipping_service && (
                      <div>
                        <span style={{ fontWeight: "600", color: colors.muted, marginRight: "8px" }}>
                          Transportadora:
                        </span>
                        {getShippingServiceDisplayName(
                          selectedOrder.shipping_service
                        )}
                      </div>
                    )}
                  </div>
                )}
                {selectedOrder.status !== "cancelled" && (
                  <>
                    <button
                      type="button"
                      onClick={handleAddShippingToCart}
                      disabled={envioLoading || melhorEnvioConnected !== true}
                      style={{
                        marginTop: "14px",
                        width: "100%",
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        cursor: envioLoading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        opacity: melhorEnvioConnected === true ? 1 : 0.6,
                      }}
                    >
                      {envioLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Truck size={18} />
                      )}
                      {envioLoading
                        ? "Inserindo no carrinho..."
                        : "Inserir fretes no carrinho"}
                    </button>
                    {melhorEnvioConnected === false && (
                      <button
                        type="button"
                        onClick={handleConnectMelhorEnvio}
                        style={{
                          marginTop: "10px",
                          width: "100%",
                          padding: "10px",
                          borderRadius: "8px",
                          border: `1px solid ${colors.border}`,
                          background: "transparent",
                          color: colors.text,
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Conectar Melhor Envio
                      </button>
                    )}
                  </>
                )}
                {envioSuccess && (
                  <p
                    style={{
                      marginTop: "10px",
                      fontSize: "13px",
                      color: "#047857",
                      fontWeight: "500",
                    }}
                  >
                    {envioSuccess} Acesse o painel Melhor Envio para pagar e
                    imprimir.
                  </p>
                )}
                {envioError && (
                  <p
                    style={{
                      marginTop: "10px",
                      fontSize: "13px",
                      color: "#ef4444",
                    }}
                  >
                    {envioError}
                  </p>
                )}
                {/* Rastreio: exibido quando o pedido tem tracking ou status shipped */}
                {(trackingLoading || trackingData) && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "12px",
                      backgroundColor:
                        theme === "dark" ? "#0f172a" : "#f0fdf4",
                      borderRadius: "8px",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: colors.muted,
                        marginBottom: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Truck size={14} />
                      Rastreio
                    </h4>
                    {trackingLoading ? (
                      <p style={{ margin: 0, fontSize: "13px", color: colors.muted }}>
                        Carregando...
                      </p>
                    ) : trackingData ? (
                      <>
                        {trackingData.tracking_code && (
                          <p
                            style={{
                              margin: "0 0 8px",
                              fontFamily: "monospace",
                              fontWeight: "600",
                              fontSize: "13px",
                              color: colors.text,
                            }}
                          >
                            {trackingData.tracking_code}
                          </p>
                        )}
                        <span
                          style={{
                            fontSize: "12px",
                            color: colors.muted,
                            textTransform: "capitalize",
                          }}
                        >
                          Status: {trackingData.status}
                        </span>
                        {trackingData.tracking_events?.length > 0 && (
                          <ul
                            style={{
                              margin: "10px 0 0",
                              paddingLeft: "18px",
                              fontSize: "13px",
                              color: colors.text,
                              lineHeight: 1.6,
                            }}
                          >
                            {trackingData.tracking_events.map((ev, i) => (
                              <li key={i}>
                                <strong>{ev.date}</strong> — {ev.description}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "12px", color: colors.muted, fontSize: "14px", marginBottom: "12px" }}>
                Endereço não disponível para este pedido.
              </div>
            )}

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

      <CheckoutErrorModal
        open={!!envioUpstreamError}
        title="Erro ao inserir no carrinho"
        message={envioUpstreamError ?? ""}
        onClose={() => setEnvioUpstreamError(null)}
        colors={colors}
      />
    </div>
  );
};
