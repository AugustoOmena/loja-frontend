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
  name: string;
  /** CPF ou CNPJ: apenas dígitos. */
  document?: string;
  postal_code: string;
  address: string;
  number?: string;
  complement?: string;
  district?: string;
  city: string;
  state_abbr: string;
  country_id?: "BR";
}

/** Remove caracteres não numéricos (para postal_code e document). */
export function digitsOnly(value: string | number | undefined | null): string {
  return String(value ?? "").replace(/\D/g, "");
}

/** Um volume (pacote) — API exige array "volumes". */
export interface MelhorEnvioCartVolume {
  weight: number;
  width: number;
  height: number;
  length: number;
}

/** Produto no formato da API: quantity e unitary_value como string. */
export interface MelhorEnvioCartProduct {
  name: string;
  quantity: string;
  unitary_value: string;
}

/**
 * Payload para POST /cart conforme doc Melhor Envio (Campos obrigatórios).
 * - service: ID do serviço de frete
 * - from: remetente (dados da loja)
 * - to: destinatário
 * - products: array de produtos (quantity/unitary_value em string)
 * - volumes: array de pacotes (obrigatório)
 */
export interface MelhorEnvioAddToCartRequest {
  order_id: string;
  /** ID do serviço de frete (número inteiro). */
  service: number;
  from: MelhorEnvioCartAddress;
  to: MelhorEnvioCartAddress;
  products: MelhorEnvioCartProduct[];
  volumes: MelhorEnvioCartVolume[];
}

export type MelhorEnvioAddToCartResponse = Record<string, unknown>;

/** Erro retornado pela API quando upstream (ex.: Melhor Envio) falha (CPF, endereços iguais, etc.). */
export interface MelhorEnvioCartUpstreamError extends Error {
  detail: string;
}

function createMelhorEnvioCartUpstreamError(message: string, detail: string): MelhorEnvioCartUpstreamError {
  const err = new Error(message) as MelhorEnvioCartUpstreamError;
  err.detail = detail;
  return err;
}

export function isMelhorEnvioCartUpstreamError(
  e: unknown
): e is MelhorEnvioCartUpstreamError {
  return (
    e instanceof Error &&
    "detail" in e &&
    typeof (e as MelhorEnvioCartUpstreamError).detail === "string"
  );
}

function getApiGatewayBaseUrl(): string {
  const raw =
    import.meta.env.VITE_API_MELHOR_ENVIO_MICRO_SERVICO_URL || import.meta.env.VITE_API_URL || "";
  const baseUrl = raw.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error(
      "VITE_API_MELHOR_ENVIO_MICRO_SERVICO_URL não configurada (ou VITE_API_URL ausente)."
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

/**
 * Retorna o endereço do remetente (loja) para o payload "from" do carrinho.
 * Usa variáveis de ambiente VITE_MELHORENVIO_FROM_* (dados da loja).
 * No Vite, essas variáveis são definidas no momento do build — no Vercel, é necessário
 * um novo deploy após cadastrar ou alterar as variáveis.
 */
export function getMelhorEnvioFromAddress(): MelhorEnvioCartAddress {
  const name = (import.meta.env.VITE_MELHORENVIO_FROM_NAME ?? "").trim();
  const postal_code = digitsOnly(
    import.meta.env.VITE_MELHORENVIO_FROM_POSTAL_CODE
  ).slice(0, 8);
  const document = digitsOnly(import.meta.env.VITE_MELHORENVIO_FROM_DOCUMENT);
  const address = (import.meta.env.VITE_MELHORENVIO_FROM_ADDRESS ?? "").trim();
  const city = (import.meta.env.VITE_MELHORENVIO_FROM_CITY ?? "").trim();
  const state_abbr = (import.meta.env.VITE_MELHORENVIO_FROM_STATE ?? "").trim();

  const missing: string[] = [];
  if (!name) missing.push("VITE_MELHORENVIO_FROM_NAME");
  if (!postal_code || postal_code.length !== 8) {
    throw new Error(
      "Remetente: VITE_MELHORENVIO_FROM_POSTAL_CODE deve ser um CEP válido (8 dígitos). No Vercel, cadastre a variável e faça um novo deploy (as variáveis Vite são definidas no build)."
    );
  }
  if (!document) missing.push("VITE_MELHORENVIO_FROM_DOCUMENT");
  if (!address) missing.push("VITE_MELHORENVIO_FROM_ADDRESS");
  if (!city) missing.push("VITE_MELHORENVIO_FROM_CITY");
  if (!state_abbr) missing.push("VITE_MELHORENVIO_FROM_STATE");
  if (missing.length > 0) {
    throw new Error(
      `Remetente: faltam ${missing.join(", ")}. No Vercel: cadastre essas variáveis para o ambiente correto (Produção ou Preview), faça um novo deploy e, se precisar, "Redeploy" com opção de limpar cache.`
    );
  }
  const number = (import.meta.env.VITE_MELHORENVIO_FROM_NUMBER ?? "").trim() || undefined;
  const complement = (import.meta.env.VITE_MELHORENVIO_FROM_COMPLEMENT ?? "").trim() || undefined;
  const district = (import.meta.env.VITE_MELHORENVIO_FROM_DISTRICT ?? "").trim() || undefined;
  return {
    name,
    document,
    postal_code,
    address,
    number,
    complement,
    district,
    city,
    state_abbr,
    country_id: "BR",
  };
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

interface CartErrorResponse {
  error?: string;
  upstream_error?: boolean;
  details?: { error?: string };
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
  const data = (await response.json().catch(() => ({}))) as CartErrorResponse;
  if (!response.ok) {
    const detail = data.details?.error?.trim();
    if (data.upstream_error && detail) {
      throw createMelhorEnvioCartUpstreamError(
        "Erro ao inserir frete no carrinho do Melhor Envio.",
        detail
      );
    }
    throw new Error(
      data.error ?? "Erro ao inserir frete no carrinho do Melhor Envio."
    );
  }
  return data as MelhorEnvioAddToCartResponse;
}

