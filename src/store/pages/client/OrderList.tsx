import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  listByUser,
  getByIdForUser,
  type OrderApi,
} from "../../../services/orderService";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { ChevronLeft, Package, Clock, X, MapPin } from "lucide-react";
import { RecommendedProducts } from "../../../components/RecommendedProducts";

// Tipos de lista baseados na rota
const SCREEN_CONFIG: Record<
  string,
  { title: string; statuses: string[]; emptyMsg: string }
> = {
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
  },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando Pagamento",
  approved: "Aprovado",
  in_process: "Em processamento",
  shipped: "Enviado",
  delivered: "Entregue",
  completed: "Concluído",
  returned: "Devolução",
};

const contentWidth = { maxWidth: "1000px", margin: "0 auto", padding: "0 20px" };

export const OrderList = () => {
  const { type } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [orders, setOrders] = useState<OrderApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOrder, setModalOrder] = useState<OrderApi | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const config = type ? SCREEN_CONFIG[type] : SCREEN_CONFIG.pagamento;

  useEffect(() => {
    if (!user) return;
    const screenConfig = type ? SCREEN_CONFIG[type] : SCREEN_CONFIG.pagamento;
    if (!screenConfig) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        if (["enviados", "avaliar", "devolucao"].includes(type || "")) {
          setOrders([]);
          return;
        }
        const data = await listByUser({ userId: user.id });
        const filtered = data.filter((o) =>
          screenConfig.statuses.includes(o.status)
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

  const openDetail = useCallback(
    async (order: OrderApi) => {
      if (!user) return;
      setModalOrder(order);
      setDetailLoading(true);
      try {
        const full = await getByIdForUser(order.id, user.id);
        setModalOrder(full);
      } catch {
        setModalOrder(order);
      } finally {
        setDetailLoading(false);
      }
    },
    [user]
  );

  const closeModal = useCallback(() => setModalOrder(null), []);

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: colors.bg,
      fontFamily: "sans-serif",
    },
    header: {
      backgroundColor: colors.card,
      padding: "15px 20px",
      display: "flex",
      alignItems: "center",
      gap: "15px",
      borderBottom: `1px solid ${colors.border}`,
      position: "sticky" as const,
      top: 0,
      zIndex: 10,
    },
    headerInner: {
      ...contentWidth,
      display: "flex",
      alignItems: "center",
      gap: "15px",
      width: "100%",
    },
    backBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: colors.text,
    },
    title: { fontSize: "18px", fontWeight: "bold", color: colors.text },
    list: { ...contentWidth, padding: "15px 20px" },
    orderCard: {
      backgroundColor: colors.card,
      borderRadius: "8px",
      padding: "15px",
      marginBottom: "15px",
      border: `1px solid ${colors.border}`,
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      cursor: "pointer" as const,
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

  const addr = modalOrder?.shipping_address;
  const hasAddress =
    addr &&
    (addr.street_name || addr.city || addr.zip_code || addr.neighborhood);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <button
            onClick={() => navigate("/minha-conta")}
            style={styles.backBtn}
            type="button"
          >
            <ChevronLeft size={24} />
          </button>
          <span style={styles.title}>{config?.title || "Pedidos"}</span>
        </div>
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
            <div
              key={order.id}
              style={styles.orderCard}
              onClick={() => openDetail(order)}
              onKeyDown={(e) => e.key === "Enter" && openDetail(order)}
              role="button"
              tabIndex={0}
            >
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

      {modalOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={closeModal}
          onKeyDown={(e) => e.key === "Escape" && closeModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-modal-title"
        >
          <div
            style={{
              backgroundColor: colors.card,
              borderRadius: "12px",
              maxWidth: "480px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              border: `1px solid ${colors.border}`,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                id="order-modal-title"
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: colors.text,
                }}
              >
                Pedido #{modalOrder.id}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                style={{ ...styles.backBtn, padding: "4px" }}
                aria-label="Fechar"
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              {detailLoading ? (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: colors.muted,
                  }}
                >
                  Carregando detalhes...
                </div>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: "12px",
                      color: colors.muted,
                      marginBottom: "16px",
                    }}
                  >
                    {new Date(modalOrder.created_at).toLocaleDateString(
                      "pt-BR",
                      { dateStyle: "long" }
                    )}
                    {" · "}
                    {STATUS_LABEL[modalOrder.status] || modalOrder.status}
                  </div>

                  {hasAddress && (
                    <div
                      style={{
                        marginBottom: "20px",
                        padding: "12px",
                        backgroundColor: colors.bg,
                        borderRadius: "8px",
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "8px",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: colors.text,
                        }}
                      >
                        <MapPin size={16} />
                        Endereço de entrega
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: colors.text,
                          lineHeight: 1.5,
                        }}
                      >
                        {[
                          addr!.street_name &&
                            (addr!.street_number
                              ? `${addr.street_name}, ${addr.street_number}`
                              : addr.street_name),
                          addr!.neighborhood,
                          addr!.city &&
                            (addr!.federal_unit
                              ? `${addr.city} - ${addr.federal_unit}`
                              : addr.city),
                          addr!.zip_code && `CEP ${addr.zip_code}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: colors.text,
                      marginBottom: "10px",
                    }}
                  >
                    Produtos
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                      marginBottom: "16px",
                    }}
                  >
                    {(modalOrder.items && modalOrder.items.length > 0
                      ? modalOrder.items
                      : []
                    ).map((item) => (
                      <li
                        key={item.id}
                        style={{
                          padding: "10px 0",
                          borderBottom: `1px solid ${colors.border}`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            color: colors.text,
                            flex: 1,
                          }}
                        >
                          {item.product_name || item.name || "Produto"} x{" "}
                          {item.quantity}
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: colors.text,
                          }}
                        >
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div
                    style={{
                      paddingTop: "12px",
                      borderTop: `2px solid ${colors.border}`,
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: colors.text,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Total</span>
                    <span>R$ {modalOrder.total_amount.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={contentWidth}>
        <RecommendedProducts />
      </div>
    </div>
  );
};
