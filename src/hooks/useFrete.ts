import { useState, useCallback } from "react";
import {
  calcularFrete,
  pacoteUnicoFrete,
  FRETE_DIM_CM,
  FRETE_PESO_POR_UNIDADE_KG,
} from "../services/freteService";
import type { ItemFrete, OpcaoFrete } from "../types";

/** Cotação sem carrinho: 1 unidade → 0,3 kg no pacote padrão. */
function pacotePadraoUmaUnidade(): ItemFrete {
  return pacoteUnicoFrete([
    {
      ...FRETE_DIM_CM,
      weight: 0,
      quantity: 1,
      insurance_value: 0,
    },
  ]);
}

/**
 * Um único volume: 16×12×20 cm, peso = (soma das quantidades) × 0,3 kg, seguro 0.
 * `quantity` no objeto = total de unidades no carrinho (mín. 1), para o `calcularFrete`
 * aplicar a mesma regra via `pacoteUnicoFrete` sem perder o total.
 */
export function cartItemsToFreteItens(items: { quantity: number }[]): ItemFrete[] {
  const totalUnidades = Math.max(
    1,
    items.reduce((acc, i) => acc + i.quantity, 0)
  );
  return [
    {
      ...FRETE_DIM_CM,
      weight: totalUnidades * FRETE_PESO_POR_UNIDADE_KG,
      quantity: totalUnidades,
      insurance_value: 0,
    },
  ];
}

interface UseFreteResult {
  opcoes: OpcaoFrete[];
  loading: boolean;
  error: string | null;
  calcular: (cep: string, itens?: ItemFrete[]) => Promise<void>;
  clearError: () => void;
}

export function useFrete(): UseFreteResult {
  const [opcoes, setOpcoes] = useState<OpcaoFrete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calcular = useCallback(async (cep: string, itens?: ItemFrete[]) => {
    const freteItens = itens ?? [pacotePadraoUmaUnidade()];
    setLoading(true);
    setError(null);
    setOpcoes([]);

    try {
      const result = await calcularFrete(cep, freteItens);
      setOpcoes(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao calcular frete.");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { opcoes, loading, error, calcular, clearError };
}
