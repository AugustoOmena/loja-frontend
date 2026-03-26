import type {
  ItemFrete,
  OpcaoFrete,
  FreteRequest,
  FreteResponse,
  FreteErrorBody,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL;
const REQUEST_TIMEOUT_MS = 15000;

/** Pacote padrão (cm) — cotação sempre com um único volume nestas dimensões. */
export const FRETE_DIM_CM = { width: 16, height: 12, length: 20 } as const;
/** Peso por unidade de produto no carrinho (kg). */
export const FRETE_PESO_POR_UNIDADE_KG = 0.3;

/**
 * Consolida qualquer lista de linhas em um único volume: 16×12×20 cm,
 * peso = soma das quantidades × 0,3 kg, quantity 1, seguro 0.
 * Ignora width/height/length/weight dos itens de entrada; usa só as quantidades.
 */
export function pacoteUnicoFrete(itens: ItemFrete[]): ItemFrete {
  const totalUnidades = itens.reduce((acc, i) => acc + (i.quantity ?? 1), 0);
  const unidades = Math.max(1, totalUnidades);
  return {
    ...FRETE_DIM_CM,
    weight: unidades * FRETE_PESO_POR_UNIDADE_KG,
    quantity: 1,
    insurance_value: 0,
  };
}

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
 * Calcula frete via API (backend /frete). O corpo envia sempre **um** item:
 * `pacoteUnicoFrete(itens)` — dimensões fixas, peso pela soma das quantidades × 0,3 kg, seguro 0.
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

  const consolidado = pacoteUnicoFrete(itens);
  const body: FreteRequest = {
    cep_destino: cepNorm,
    itens: [
      {
        width: consolidado.width,
        height: consolidado.height,
        length: consolidado.length,
        weight: consolidado.weight,
        quantity: consolidado.quantity ?? 1,
        insurance_value: 0,
      },
    ],
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
