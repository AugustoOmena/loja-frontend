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

/** Garante que a redirect_uri enviada ao backend termina com /backoffice/integrations/melhorenvio/callback */
export function getMelhorEnvioRedirectUri(): string {
  let redirectUri = import.meta.env.VITE_MELHORENVIO_REDIRECT_URI || "";
  if (!redirectUri) {
    throw new Error("VITE_MELHORENVIO_REDIRECT_URI não configurada.");
  }
  redirectUri = redirectUri.trim().replace(/\/$/, "");
  if (!redirectUri.endsWith("/backoffice/integrations/melhorenvio/callback")) {
    redirectUri = `${redirectUri}/backoffice/integrations/melhorenvio/callback`;
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

  const cacheBuster = `&t=${Date.now()}`;
  const requestUrl = `${baseUrl}/integrations/melhorenvio/authorize-url?${search.toString()}${cacheBuster}`;
  const response = await fetch(requestUrl, { 
    method: "GET",
    mode: "cors", 
    cache: "no-store",
    headers: {
      "Pragma": "no-cache",
      "Cache-Control": "no-cache"
    }
  });

  const text = await response.text();
  console.log("[Melhor Envio authorize-url] response.text() (corpo bruto para debug):", text);

  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    console.warn("[Melhor Envio authorize-url] JSON.parse falhou, corpo:", text);
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      (data as { error?: string }).error ??
        "Erro ao obter URL de autorização do Melhor Envio."
    );
  }
  return data as MelhorEnvioAuthorizeUrlResponse;
}

export async function melhorEnvioCallback(params: {
  code: string;
  state: string;
  redirect_uri: string;
}): Promise<MelhorEnvioCallbackResponse> {
  const baseUrl = getApiGatewayBaseUrl();
  const search = new URLSearchParams();
  search.set("code", params.code);
  search.set("state", params.state);
  search.set("redirect_uri", params.redirect_uri);

  const requestUrl = `${baseUrl}/integrations/melhorenvio/callback?${search.toString()}`;
  const response = await fetch(requestUrl, { method: "GET" });

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

