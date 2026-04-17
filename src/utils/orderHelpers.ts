import type { OrderApi } from "../services/orderService";

const LEGACY_DELIVERY_ONLY = new Set([
  "in_process",
  "shipped",
  "delivered",
]);

const LEGACY_PAYMENT_LIKE = new Set([
  "pending",
  "approved",
  "rejected",
  "refunded",
  "charged_back",
  "in_mediation",
]);

/**
 * Status de entrega efetivo (Melhor Envio), com fallback para respostas que ainda
 * expõem apenas `status` (modelo antigo misturado).
 */
export function getEffectiveDeliveryStatus(order: OrderApi): string {
  const d = order.delivery_status?.trim();
  if (d) return d;
  const s = (order.status ?? "").trim();
  if (s === "cancelled") return s;
  if (LEGACY_DELIVERY_ONLY.has(s)) return s;
  if (LEGACY_PAYMENT_LIKE.has(s)) return "pending";
  return s || "pending";
}

/**
 * Status de pagamento efetivo (ex.: Mercado Pago), com fallback para `status` legado.
 */
export function getEffectivePaymentStatus(order: OrderApi): string {
  const p = order.payment_status?.trim();
  if (p) return p;
  const s = (order.status ?? "").trim();
  if (LEGACY_DELIVERY_ONLY.has(s)) return "approved";
  if (LEGACY_PAYMENT_LIKE.has(s)) return s;
  if (s === "cancelled") return "cancelled";
  return s || "pending";
}

/**
 * Token de status para UI da loja (badge único), alinhado ao modelo
 * payment + delivery sem coluna `status`.
 */
export function getClientOrderDisplayStatusKey(order: OrderApi): string {
  const pay = getEffectivePaymentStatus(order);
  const del = getEffectiveDeliveryStatus(order);
  if (pay === "pending") return "pending";
  if (del === "cancelled") return "cancelled";
  if (del === "delivered") return "delivered";
  if (del === "shipped") return "shipped";
  if (del === "in_process") return "in_process";
  if (pay === "approved" && del === "pending") return "approved";
  return (order.status ?? "").trim() || pay;
}

/** Filtro das listas "pagamento" / "envio" / "enviados" (tokens do modelo antigo). */
export function matchesClientOrderStatusToken(
  order: OrderApi,
  legacyToken: string
): boolean {
  if ((order.status ?? "") === legacyToken) return true;
  const pay = getEffectivePaymentStatus(order);
  const del = getEffectiveDeliveryStatus(order);
  switch (legacyToken) {
    case "pending":
      return pay === "pending";
    case "approved":
      return pay === "approved" && del === "pending";
    case "in_process":
      return pay === "approved" && del === "in_process";
    case "shipped":
      return del === "shipped";
    case "delivered":
      return del === "delivered";
    case "returned":
      return pay === "returned" || del === "returned";
    default:
      return pay === legacyToken || del === legacyToken;
  }
}

/** Dados normalizados de pagamento extraídos do pedido (PIX ou boleto) */
export interface OrderPaymentFields {
  paymentCode: string;
  paymentUrl: string;
  paymentExpiration: string | null;
}

/**
 * Extrai e normaliza campos de pagamento do pedido.
 * Suporta dados na raiz do pedido ou em payment_info / payment (backends variados).
 */
export function getOrderPaymentFields(order: OrderApi): OrderPaymentFields {
  const pi = order.payment_info ?? order.payment;
  return {
    paymentCode:
      order.payment_code ??
      order.qr_code ??
      pi?.payment_code ??
      pi?.qr_code ??
      "",
    paymentUrl:
      order.payment_url ??
      order.ticket_url ??
      pi?.payment_url ??
      pi?.ticket_url ??
      "",
    paymentExpiration:
      order.payment_expiration ?? pi?.payment_expiration ?? null,
  };
}

/** Indica se o pedido está com status "pendente" (aguardando pagamento) */
export function isOrderPending(order: OrderApi): boolean {
  return getEffectivePaymentStatus(order).toLowerCase() === "pending";
}

/**
 * Retorna true se deve exibir o bloco de pagamento (pedido pendente com PIX ou boleto).
 */
export function shouldShowPaymentBlock(
  order: OrderApi,
  fields: OrderPaymentFields
): boolean {
  return (
    isOrderPending(order) && (!!fields.paymentCode || !!fields.paymentUrl)
  );
}

export function formatPaymentExpiration(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** Mapeamento service_id (Melhor Envio) → nome para exibição */
const SHIPPING_SERVICE_NAMES: Record<string, string> = {
  "1": "PAC (Correios)",
  "2": "SEDEX (Correios)",
  "3": "Jadlog",
  "4": "Loggi",
  "5": "Braspress",
  "6": "Latam Cargo",
  "7": "Azul Cargo",
  "8": "Correios",
};

/**
 * Retorna o nome legível do serviço de envio (transportadora).
 * Aceita service_id numérico ("1", "2") ou nome já vindo do backend.
 */
export function getShippingServiceDisplayName(
  service: string | null | undefined
): string {
  if (service == null || String(service).trim() === "") return "";
  const s = String(service).trim();
  return SHIPPING_SERVICE_NAMES[s] ?? s;
}
