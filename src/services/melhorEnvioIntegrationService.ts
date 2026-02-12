export interface MelhorEnvioStatusResponse {
  connected: boolean;
}

export interface MelhorEnvioAuthorizeUrlResponse {
  authorize_url: string;
}

export interface MelhorEnvioCallbackRequest {
  code: string;
  state: string;
  redirect_uri: string;
}

export type MelhorEnvioCallbackResponse = Record<string, unknown>;

export interface MelhorEnvioCartAddress {
  postal_code: string;
  address: string;
  number?: string;
  complement?: string;
  district?: string;
  city: string;
  state_abbr: string;
  country_id?: "BR";
}

export interface MelhorEnvioCartPackage {
  weight: number;
  width: number;
  height: number;
  length: number;
}

export interface MelhorEnvioCartItem {
  name: string;
  quantity: number;
  unitary_value: number;
}

/**
 * Payload mínimo para o microserviço inserir fretes no carrinho.
 * O microserviço pode completar `from/service` internamente com base no pedido.
 */
export interface MelhorEnvioAddToCartRequest {
  order_id: string;
  to: MelhorEnvioCartAddress;
  package: MelhorEnvioCartPackage;
  items: MelhorEnvioCartItem[];
}

export type MelhorEnvioAddToCartResponse = Record<string, unknown>;

function getApiGatewayBaseUrl(): string {
  const raw =
    import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_URL || "";
  const baseUrl = raw.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error(
      "VITE_API_GATEWAY_URL não configurada (ou VITE_API_URL ausente)."
    );
  }
  return baseUrl;
}

export function getMelhorEnvioRedirectUri(): string {
  const redirectUri = import.meta.env.VITE_MELHORENVIO_REDIRECT_URI || "";
  if (!redirectUri) {
    throw new Error("VITE_MELHORENVIO_REDIRECT_URI não configurada.");
  }
  return redirectUri;
}

export function getMelhorEnvioScopesCsv(): string {
  return (
    import.meta.env.VITE_MELHORENVIO_SCOPES || "cart,shipment,tracking"
  ).trim();
}

export async function melhorEnvioGetStatus(): Promise<MelhorEnvioStatusResponse> {
  const baseUrl = getApiGatewayBaseUrl();
  const response = await fetch(`${baseUrl}/integrations/melhorenvio/status`, {
    method: "GET",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data as { error?: string }).error ??
        "Erro ao consultar status do Melhor Envio."
    );
  }
  return data as MelhorEnvioStatusResponse;
}

export async function melhorEnvioGetAuthorizeUrl(params: {
  redirectUri: string;
  scopesCsv: string;
}): Promise<MelhorEnvioAuthorizeUrlResponse> {
  const baseUrl = getApiGatewayBaseUrl();
  const search = new URLSearchParams();
  search.set("redirect_uri", params.redirectUri);
  search.set("scopes", params.scopesCsv);

  const response = await fetch(
    `${baseUrl}/integrations/melhorenvio/authorize-url?${search.toString()}`,
    { method: "GET" }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data as { error?: string }).error ??
        "Erro ao obter URL de autorização do Melhor Envio."
    );
  }
  return data as MelhorEnvioAuthorizeUrlResponse;
}

export async function melhorEnvioCallback(
  body: MelhorEnvioCallbackRequest
): Promise<MelhorEnvioCallbackResponse> {
  const baseUrl = getApiGatewayBaseUrl();
  const response = await fetch(
    `${baseUrl}/integrations/melhorenvio/callback`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data as { error?: string }).error ??
        "Erro ao finalizar callback do Melhor Envio."
    );
  }
  return data as MelhorEnvioCallbackResponse;
}

export async function melhorEnvioAddToCart(
  body: MelhorEnvioAddToCartRequest
): Promise<MelhorEnvioAddToCartResponse> {
  const baseUrl = getApiGatewayBaseUrl();
  const response = await fetch(`${baseUrl}/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data as { error?: string }).error ??
        "Erro ao inserir frete no carrinho do Melhor Envio."
    );
  }
  return data as MelhorEnvioAddToCartResponse;
}

