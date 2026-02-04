import { useState, useCallback } from "react";
import { calcularFrete } from "../services/freteService";
import type { ItemFrete, OpcaoFrete } from "../types";

const DEFAULTS: ItemFrete = {
  width: 16,
  height: 12,
  length: 20,
  weight: 0.5,
  quantity: 1,
  insurance_value: 0,
};

/**
 * Converte itens do carrinho em um pacote único com dimensões padrão.
 * Quando produtos tiverem width/height/length/weight, usar; senão, agrupar em um pacote.
 */
export function cartItemsToFreteItens(
  items: { quantity: number }[],
  defaults: Partial<ItemFrete> = {}
): ItemFrete[] {
  const base = { ...DEFAULTS, ...defaults };
  const totalQty = Math.max(1, items.reduce((acc, i) => acc + i.quantity, 0));
  return [
    {
      ...base,
      quantity: totalQty,
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
    const freteItens = itens ?? [DEFAULTS];
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
