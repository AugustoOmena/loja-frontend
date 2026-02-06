const API_URL = import.meta.env.VITE_API_URL;

export interface OrderItemApi {
  id: string;
  order_id?: string;
  product_id?: number;
  product_name: string;
  name?: string;
  quantity: number;
  price: number;
  /** URL da imagem (campo retornado pela API no GET por id) */
  image_url?: string | null;
  image?: string | null;
  price_at_purchase?: number;
  color?: string | null;
  size?: string | null;
}

/** Endereço de entrega (quando retornado no detalhe do pedido) */
export interface OrderAddressApi {
  street_name?: string;
  street_number?: string;
  neighborhood?: string;
  city?: string;
  federal_unit?: string;
  zip_code?: string;
}

export interface OrderApi {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  payment_method?: string | null;
  payment_id?: string | null;
  created_at: string;
  updated_at?: string;
  payer?: Record<string, unknown>;
  installments?: number;
  mp_payment_id?: string | null;
  items?: OrderItemApi[];
  refund_requests?: unknown[];
  user_email?: string | null;
  /** Endereço de entrega (detalhe do pedido; pode ser null) */
  shipping_address?: OrderAddressApi | null;
  tracking_code?: string | null;
  shipping_service?: string | null;
}

const backofficeHeaders = {
  "Content-Type": "application/json",
  "X-Backoffice": "true",
};

export interface ListOrdersParams {
  userId: string;
  page?: number;
  limit?: number;
}

/**
 * CLIENTE: Lista pedidos do usuário (simplified list)
 * GET /pedidos?user_id=<uuid>&page=&limit=
 */
export const listByUser = async (
  params: ListOrdersParams
): Promise<OrderApi[]> => {
  const search = new URLSearchParams({ user_id: params.userId });
  if (params.page != null) search.set("page", String(params.page));
  if (params.limit != null) search.set("limit", String(params.limit));
  const response = await fetch(`${API_URL}/pedidos?${search.toString()}`);
  if (!response.ok) throw new Error("Erro ao buscar pedidos");
  const data = await response.json();
  return Array.isArray(data) ? data : data.data ?? data.orders ?? [];
};

/**
 * BACKOFFICE: Lista todos os pedidos (admin)
 * GET /pedidos?user_id=<uuid>&page=&limit= com X-Backoffice: true
 */
export const listAllBackoffice = async (
  userId: string,
  params?: { page?: number; limit?: number }
): Promise<OrderApi[]> => {
  const search = new URLSearchParams({ user_id: userId });
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.limit != null) search.set("limit", String(params.limit));
  const response = await fetch(`${API_URL}/pedidos?${search.toString()}`, {
    headers: backofficeHeaders,
  });
  if (!response.ok) throw new Error("Erro ao buscar pedidos");
  const data = await response.json();
  return Array.isArray(data) ? data : data.data ?? data.orders ?? [];
};

/**
 * CLIENTE: Detalhe de um pedido
 * GET /pedidos/<order_id>?user_id=<uuid>
 */
export const getByIdForUser = async (
  orderId: string,
  userId: string
): Promise<OrderApi> => {
  const params = new URLSearchParams({ user_id: userId });
  const response = await fetch(
    `${API_URL}/pedidos/${orderId}?${params.toString()}`
  );
  if (!response.ok) throw new Error("Erro ao buscar pedido");
  return response.json();
};

/**
 * CLIENTE: Solicitar cancelamento
 * POST /pedidos/<order_id>/solicitar-cancelamento
 * Body: { total: true } ou { order_item_ids: ["uuid1", "uuid2"] }
 */
export const requestCancellation = async (
  orderId: string,
  body: { total: true } | { order_item_ids: string[] }
): Promise<unknown> => {
  const response = await fetch(
    `${API_URL}/pedidos/${orderId}/solicitar-cancelamento`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) throw new Error("Erro ao solicitar cancelamento");
  return response.json();
};

/**
 * BACKOFFICE: Cancelamento total
 * PUT /pedidos/<order_id> com X-Backoffice: true
 * Body: { full_cancel: true, refund_method: "voucher" | "mp" }
 */
export const backofficeFullCancel = async (
  orderId: string,
  refundMethod: "voucher" | "mp"
): Promise<OrderApi> => {
  const response = await fetch(`${API_URL}/pedidos/${orderId}`, {
    method: "PUT",
    headers: backofficeHeaders,
    body: JSON.stringify({
      full_cancel: true,
      refund_method: refundMethod,
    }),
  });
  if (!response.ok) throw new Error("Erro ao cancelar pedido");
  return response.json();
};

/**
 * BACKOFFICE: Cancelamento parcial (itens)
 * PUT /pedidos/<order_id> com X-Backoffice: true
 * Body: { cancel_item_ids: ["uuid1"], refund_method: "voucher" | "mp" }
 */
export const backofficeCancelItems = async (
  orderId: string,
  cancelItemIds: string[],
  refundMethod: "voucher" | "mp"
): Promise<OrderApi> => {
  const response = await fetch(`${API_URL}/pedidos/${orderId}`, {
    method: "PUT",
    headers: backofficeHeaders,
    body: JSON.stringify({
      cancel_item_ids: cancelItemIds,
      refund_method: refundMethod,
    }),
  });
  if (!response.ok) throw new Error("Erro ao cancelar itens");
  return response.json();
};

/**
 * BACKOFFICE: Atualizar status (se o microserviço suportar)
 * PUT /pedidos/<order_id> com body { status }
 */
export const backofficeUpdateStatus = async (
  orderId: string,
  status: string
): Promise<OrderApi> => {
  const response = await fetch(`${API_URL}/pedidos/${orderId}`, {
    method: "PUT",
    headers: backofficeHeaders,
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Erro ao atualizar status");
  return response.json();
};
