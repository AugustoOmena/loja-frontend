// src/hooks/useFirebaseProductsInfinite.ts
import { useState, useEffect, useCallback } from "react";
import { getAllProductsSorted } from "../services/firebaseProductService";
import type { Product } from "../types";

const DEFAULT_PAGE_SIZE = 40;

/**
 * Scroll infinito robusto: carrega todos os produtos do Firebase uma vez
 * e revela em blocos (visibleCount). Evita problemas de cursor/ordem do Firebase.
 *
 * @param pageSize - Quantos produtos revelar por "página" (padrão: 40)
 */
export function useFirebaseProductsInfinite(pageSize: number = DEFAULT_PAGE_SIZE) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega todos os produtos uma vez no mount
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const list = await getAllProductsSorted();
        if (isMounted) {
          setAllProducts(list);
          setVisibleCount(pageSize);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Erro desconhecido");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [pageSize]);

  // Produtos visíveis = slice do array completo (sem duplicatas, ordem estável)
  const products = allProducts.slice(0, visibleCount);
  const hasMore = visibleCount < allProducts.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + pageSize, allProducts.length));
  }, [pageSize, allProducts.length]);

  return {
    products,
    loading,
    error,
    loadMore,
    hasMore,
    isLoadingMore: false, // Não há request em andamento ao "carregar mais"
  };
}
