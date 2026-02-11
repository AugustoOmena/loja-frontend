const API_URL = import.meta.env.VITE_API_URL;

const backofficeHeaders = {
  "Content-Type": "application/json",
  "X-Backoffice": "true",
};

/** Resposta de sucesso ao criar etiqueta no Melhor Envio */
export interface CreateShipmentResponse {
  melhor_envio_order_id: string;
  message: string;
}

/** Evento de rastreio retornado por GET /fulfillment/{order_id}/tracking */
export interface TrackingEvent {
  date: string;
  description: string;
}

/** Resposta de GET /fulfillment/{order_id}/tracking */
export interface FulfillmentTrackingResponse {
  order_id: string;
  tracking_code: string | null;
  status: string;
  tracking_events: TrackingEvent[];
}

/**
 * BACKOFFICE: Cria etiqueta no carrinho do Melhor Envio.
 * POST /fulfillment/{order_id}/create-shipment (sem body).
 * O backend usa o shipping_service já gravado no pedido no pagamento.
 * Admin deve acessar o painel Melhor Envio para pagar e imprimir.
 */
export const createShipment = async (
  orderId: string,
  userId: string
): Promise<CreateShipmentResponse> => {
  const response = await fetch(
    `${API_URL}/fulfillment/${orderId}/create-shipment`,
    {
      method: "POST",
      headers: {
        ...backofficeHeaders,
        "X-User-Id": userId,
      },
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data as { error?: string }).error ??
        "Erro ao criar etiqueta no Melhor Envio"
    );
  }
  return data as CreateShipmentResponse;
};

/**
 * CLIENTE ou BACKOFFICE: Consulta rastreamento do pedido.
 * GET /fulfillment/{order_id}/tracking
 */
export const getFulfillmentTracking = async (
  orderId: string
): Promise<FulfillmentTrackingResponse> => {
  const response = await fetch(`${API_URL}/fulfillment/${orderId}/tracking`);
  if (!response.ok) throw new Error("Erro ao buscar rastreio");
  return response.json();
};
