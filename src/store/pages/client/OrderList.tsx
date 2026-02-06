import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  listByUser,
  getByIdForUser,
  type OrderApi,
} from "../../../services/orderService";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { ChevronLeft, Package, Clock, X } from "lucide-react";
import { RecommendedProducts } from "../../../components/RecommendedProducts";
import { RevealOnScrollProductSearchBar } from "../../../components/RevealOnScrollProductSearchBar";
import { OrderDetails } from "../../../components/OrderDetails";
import { STORE_CATEGORIES } from "../../../constants/storeCategories";

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
    statuses: ["shipped"],
    emptyMsg: "Nenhum pedido em trânsito.",
  },
  avaliar: {
    title: "Para Avaliar",
    statuses: ["delivered"],
    emptyMsg: "Nenhum pedido para avaliar.",
  },
  devolucao: {
    title: "Devoluções",
    statuses: ["returned"],
    emptyMsg: "Nenhuma devolução ativa.",
  },
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
  const recommendedSectionRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [categoryId, setCategoryId] = useState("");

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
          className="order-detail-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={closeModal}
          onKeyDown={(e) => e.key === "Escape" && closeModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-modal-title"
        >
          <div
            className="order-detail-modal"
            style={{
              backgroundColor: colors.card,
              borderRadius: "20px",
              maxWidth: "480px",
              width: "100%",
              maxHeight: "92dvh",
              minHeight: "280px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${colors.border}`,
              boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "18px 20px",
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <h2
                id="order-modal-title"
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: "700",
                  color: colors.text,
                  letterSpacing: "-0.02em",
                }}
              >
                Pedido #{modalOrder.id}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  ...styles.backBtn,
                  padding: "8px",
                  borderRadius: "10px",
                  backgroundColor: colors.bg,
                }}
                aria-label="Fechar"
              >
                <X size={22} />
              </button>
            </div>
            <div style={{ overflow: "auto", flex: 1 }}>
              <OrderDetails order={modalOrder} loading={detailLoading} />
            </div>
          </div>
        </div>
      )}

      <div style={contentWidth}>
        <RevealOnScrollProductSearchBar
          anchorRef={recommendedSectionRef}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearchSubmit={() => {}}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          categories={STORE_CATEGORIES}
          showWhenAnchorOutOfView
          topSlot={
            <div
              style={{
                ...contentWidth,
                display: "flex",
                alignItems: "center",
                gap: "15px",
                padding: "12px 20px",
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <button
                onClick={() => navigate("/minha-conta")}
                style={styles.backBtn}
                type="button"
                aria-label="Voltar"
              >
                <ChevronLeft size={24} />
              </button>
              <span style={styles.title}>{config?.title || "Pedidos"}</span>
            </div>
          }
        />
        <RecommendedProducts
          scrollAnchorRef={recommendedSectionRef}
          searchQuery={searchValue}
          categoryId={categoryId}
          scrollStorageKey="orderlist-recommended-scroll"
        />
      </div>
    </div>
  );
};
