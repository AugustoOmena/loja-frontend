import type {
  ItemFrete,
  OpcaoFrete,
  FreteRequest,
  FreteResponse,
  FreteErrorBody,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL;
const REQUEST_TIMEOUT_MS = 15000;

/** Normaliza CEP: só dígitos (8 caracteres) */
export function normalizarCep(cep: string): string {
  return cep.replace(/\D/g, "").slice(0, 8);
}

/** Valida CEP (8 dígitos) */
export function validarCep(cep: string): boolean {
  const digits = normalizarCep(cep);
  return digits.length === 8 && /^\d{8}$/.test(digits);
}

/**
 * Calcula frete via API Melhor Envio.
 * @throws Error em caso de rede, timeout, ou resposta 4xx/5xx
 */
export async function calcularFrete(
  cep: string,
  itens: ItemFrete[]
): Promise<OpcaoFrete[]> {
  const baseUrl = API_URL?.replace(/\/$/, "") || "";
  if (!baseUrl) {
    throw new Error("VITE_API_URL não configurada.");
  }

  const cepNorm = normalizarCep(cep);
  if (!validarCep(cepNorm)) {
    throw new Error("CEP inválido. Informe 8 dígitos.");
  }

  if (!itens.length) {
    throw new Error("Nenhum item para calcular frete.");
  }

  const body: FreteRequest = {
    cep_destino: cepNorm,
    itens: itens.map((item) => ({
      width: item.width,
      height: item.height,
      length: item.length,
      weight: item.weight,
      quantity: item.quantity ?? 1,
      insurance_value: item.insurance_value ?? 0,
    })),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/frete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err = data as FreteErrorBody;
      const msg =
        err?.error ||
        err?.details ||
        `Erro ${response.status}: Não foi possível calcular o frete.`;
      throw new Error(msg);
    }

    const res = data as FreteResponse;
    if (!Array.isArray(res.opcoes)) {
      throw new Error("Resposta inválida da API de frete.");
    }

    return res.opcoes;
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error("Tempo esgotado. Tente novamente.");
      }
      throw err;
    }
    throw new Error("Erro de rede. Verifique sua conexão e tente novamente.");
  } finally {
    clearTimeout(timeoutId);
  }
}
