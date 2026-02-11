import type { OrderApi } from "../services/orderService";

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
  return (order.status ?? "").toLowerCase() === "pending";
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
