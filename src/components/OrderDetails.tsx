import { useTheme } from "../contexts/ThemeContext";
import type { OrderApi } from "../services/orderService";
import { MapPin, Package, Truck, Calendar } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando Pagamento",
  approved: "Aprovado",
  in_process: "Em processamento",
  shipped: "Enviado",
  delivered: "Entregue",
  completed: "Concluído",
  returned: "Devolução",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#fff7ed", text: "#c2410c" },
  approved: { bg: "#ecfdf5", text: "#047857" },
  in_process: { bg: "#eff6ff", text: "#1d4ed8" },
  shipped: { bg: "#f0f9ff", text: "#0369a1" },
  delivered: { bg: "#ecfdf5", text: "#047857" },
  completed: { bg: "#f0fdf4", text: "#15803d" },
  returned: { bg: "#fef2f2", text: "#b91c1c" },
  cancelled: { bg: "#f5f5f5", text: "#737373" },
};

export interface OrderDetailsProps {
  order: OrderApi;
  loading?: boolean;
}

export function OrderDetails({ order, loading = false }: OrderDetailsProps) {
  const { colors } = useTheme();
  const items = order.items ?? [];
  const subtotalProducts = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
  const frete = Math.max(0, order.total_amount - subtotalProducts);
  const addr = order.shipping_address;
  const hasAddress =
    addr &&
    (addr.street_name || addr.city || addr.zip_code || addr.neighborhood);
  const statusStyle = STATUS_COLOR[order.status] ?? {
    bg: colors.border,
    text: colors.text,
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "32px 20px",
          textAlign: "center",
          color: colors.muted,
          minHeight: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>
          <Package size={40} style={{ margin: "0 auto 12px", opacity: 0.6 }} />
          <p style={{ margin: 0, fontSize: "15px" }}>Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "0 20px 24px",
        fontSize: "15px",
      }}
    >
      {/* Status + data */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "10px 16px",
          marginBottom: "20px",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "600",
            backgroundColor: statusStyle.bg,
            color: statusStyle.text,
          }}
        >
          <Package size={14} />
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: colors.muted,
            fontSize: "14px",
          }}
        >
          <Calendar size={14} />
          {new Date(order.created_at).toLocaleDateString("pt-BR", {
            dateStyle: "long",
          })}
        </span>
      </div>

      {/* Itens */}
      <section
        style={{
          marginBottom: "24px",
        }}
      >
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: colors.muted,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: "12px",
          }}
        >
          Produtos
        </h3>
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {items.length === 0 ? (
            <li
              style={{
                padding: "16px",
                backgroundColor: colors.bg,
                borderRadius: "12px",
                color: colors.muted,
                fontSize: "14px",
              }}
            >
              Nenhum item listado.
            </li>
          ) : (
            items.map((item) => (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  gap: "14px",
                  padding: "12px",
                  backgroundColor: colors.bg,
                  borderRadius: "12px",
                  border: `1px solid ${colors.border}`,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 64,
                    minWidth: 64,
                    height: 64,
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: colors.border,
                  }}
                >
                  {(item.image_url ?? item.image) ? (
                    <img
                      src={item.image_url ?? item.image ?? ""}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: colors.muted,
                      }}
                    >
                      <Package size={24} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: "600",
                      color: colors.text,
                      fontSize: "14px",
                      marginBottom: "2px",
                    }}
                  >
                    {item.product_name || item.name || "Produto"}
                  </div>
                  {(item.size || item.color) && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: colors.muted,
                        marginBottom: "2px",
                      }}
                    >
                      {[item.size, item.color].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "13px",
                      color: colors.muted,
                    }}
                  >
                    {item.quantity} × R$ {item.price.toFixed(2)}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: "600",
                    color: colors.text,
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  }}
                >
                  R$ {(item.price * item.quantity).toFixed(2)}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Resumo: subtotal, frete, total */}
      <section
        style={{
          marginBottom: "24px",
          padding: "16px",
          backgroundColor: colors.bg,
          borderRadius: "12px",
          border: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
            fontSize: "14px",
            color: colors.text,
          }}
        >
          <span>Subtotal (produtos)</span>
          <span>R$ {subtotalProducts.toFixed(2)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "12px",
            fontSize: "14px",
            color: colors.text,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Truck size={14} />
            Frete
          </span>
          <span>R$ {frete.toFixed(2)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: "12px",
            borderTop: `2px solid ${colors.border}`,
            fontSize: "16px",
            fontWeight: "700",
            color: colors.text,
          }}
        >
          <span>Total</span>
          <span>R$ {order.total_amount.toFixed(2)}</span>
        </div>
      </section>

      {/* Endereço de entrega */}
      {hasAddress && (
        <section style={{ marginBottom: "24px" }}>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: colors.muted,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <MapPin size={16} />
            Endereço de entrega
          </h3>
          <div
            style={{
              padding: "14px 16px",
              backgroundColor: colors.bg,
              borderRadius: "12px",
              border: `1px solid ${colors.border}`,
              fontSize: "14px",
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
        </section>
      )}

      {/* Detalhes do envio + rastreio (placeholder) */}
      <section>
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: colors.muted,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Truck size={16} />
          Envio e rastreio
        </h3>
        <div
          style={{
            padding: "14px 16px",
            backgroundColor: colors.bg,
            borderRadius: "12px",
            border: `1px solid ${colors.border}`,
            fontSize: "14px",
            color: colors.text,
          }}
        >
          {order.shipping_service && (
            <div
              style={{
                marginBottom: order.tracking_code ? "10px" : 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Truck size={16} style={{ color: colors.muted }} />
              <span>{order.shipping_service}</span>
            </div>
          )}
          {order.tracking_code ? (
            <div
              style={{
                padding: "10px 12px",
                backgroundColor: colors.card,
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              {order.tracking_code}
            </div>
          ) : (
            <p
              style={{
                margin: 0,
                color: colors.muted,
                fontSize: "13px",
              }}
            >
              Informações de rastreio aparecerão aqui quando o pedido for
              despachado.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
