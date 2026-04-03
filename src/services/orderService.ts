import { getApiAuthHeaders } from "@/services/apiAuthHeaders";

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
  complement?: string;
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
  /** Valor do frete (quando retornado pela API) */
  shipping_amount?: number | null;
  /** ID interno do Melhor Envio (após gerar etiqueta) */
  melhor_envio_order_id?: string | null;
  /** PIX: código copia e cola; Boleto: linha digitável */
  payment_code?: string | null;
  /** URL do PDF do boleto (null para PIX) */
  payment_url?: string | null;
  /** Data/hora de vencimento do pagamento (ISO datetime) */
  payment_expiration?: string | null;
  /** Alternativa retornada por algumas APIs (ex.: Mercado Pago) */
  qr_code?: string | null;
  /** URL do boleto (alternativa a payment_url) */
  ticket_url?: string | null;
  /** Objeto aninhado (alguns backends retornam dados de pagamento aqui) */
  payment_info?: PaymentInfoApi | null;
  payment?: PaymentInfoApi | null;
}

export interface PaymentInfoApi {
  payment_code?: string | null;
  payment_url?: string | null;
  payment_expiration?: string | null;
  qr_code?: string | null;
  ticket_url?: string | null;
  payment_method?: string | null;
}

const backofficeHeaders = {
  "Content-Type": "application/json",
  "X-Backoffice": "true",
};

async function orderApiErrorMessage(response: Response): Promise<string> {
  try {
    const j = (await response.json()) as { error?: string; message?: string };
    if (typeof j.error === "string" && j.error) return j.error;
    if (typeof j.message === "string" && j.message) return j.message;
  } catch {
    /* ignore */
  }
  return `Erro HTTP ${response.status}`;
}

export interface ListOrdersParams {
  userId: string;
  page?: number;
  limit?: number;
  /** Token da sessão atual (evita corrida com getSession em alguns mounts) */
  accessToken?: string | null;
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
  const response = await fetch(`${API_URL}/pedidos?${search.toString()}`, {
    headers: await getApiAuthHeaders(params.accessToken),
  });
  if (!response.ok) {
    throw new Error(await orderApiErrorMessage(response));
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.data ?? data.orders ?? [];
};

/**
 * BACKOFFICE: Lista todos os pedidos (admin).
 * Não envia `user_id` na query: o UUID do admin era interpretado como filtro de cliente e zerava a lista.
 * GET /pedidos?page=&limit= com X-Backoffice: true + Bearer
 */
export const listAllBackoffice = async (params?: {
  page?: number;
  limit?: number;
}): Promise<OrderApi[]> => {
  const search = new URLSearchParams();
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.limit != null) search.set("limit", String(params.limit));
  const qs = search.toString();
  const url =
    qs.length > 0 ? `${API_URL}/pedidos?${qs}` : `${API_URL}/pedidos`;
  const response = await fetch(url, {
    headers: { ...backofficeHeaders, ...(await getApiAuthHeaders()) },
  });
  if (!response.ok) {
    throw new Error(await orderApiErrorMessage(response));
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.data ?? data.orders ?? [];
};

/**
 * CLIENTE: Detalhe de um pedido
 * GET /pedidos/<order_id>?user_id=<uuid>
 */
export const getByIdForUser = async (
  orderId: string,
  userId: string,
  accessToken?: string | null
): Promise<OrderApi> => {
  const params = new URLSearchParams({ user_id: userId });
  const response = await fetch(
    `${API_URL}/pedidos/${orderId}?${params.toString()}`,
    { headers: await getApiAuthHeaders(accessToken) }
  );
  if (!response.ok) {
    throw new Error(await orderApiErrorMessage(response));
  }
  return response.json();
};

/**
 * BACKOFFICE: Detalhe de um pedido (com shipping_address, etc.)
 * GET /pedidos/<order_id> com X-Backoffice: true (sem user_id na query — admin autenticado via JWT)
 */
export const getByIdBackoffice = async (
  orderId: string
): Promise<OrderApi> => {
  const response = await fetch(`${API_URL}/pedidos/${orderId}`, {
    headers: { ...backofficeHeaders, ...(await getApiAuthHeaders()) },
  });
  if (!response.ok) {
    throw new Error(await orderApiErrorMessage(response));
  }
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
      headers: {
        "Content-Type": "application/json",
        ...(await getApiAuthHeaders()),
      },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    throw new Error(await orderApiErrorMessage(response));
  }
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
    headers: { ...backofficeHeaders, ...(await getApiAuthHeaders()) },
    body: JSON.stringify({
      full_cancel: true,
      refund_method: refundMethod,
    }),
  });
  if (!response.ok) {
    throw new Error(await orderApiErrorMessage(response));
  }
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
    headers: { ...backofficeHeaders, ...(await getApiAuthHeaders()) },
    body: JSON.stringify({
      cancel_item_ids: cancelItemIds,
      refund_method: refundMethod,
    }),
  });
  if (!response.ok) {
    throw new Error(await orderApiErrorMessage(response));
  }
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
    headers: { ...backofficeHeaders, ...(await getApiAuthHeaders()) },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error(await orderApiErrorMessage(response));
  }
  return response.json();
};
