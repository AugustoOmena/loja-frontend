// src/hooks/useFirebaseProductsInfinite.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { getProductsPaginated } from "../services/firebaseProductService";
import type { Product } from "../types";

/**
 * Hook customizado para scroll infinito com Firebase Realtime Database.
 * 
 * Carrega produtos paginados (40 por vez) conforme o usuário faz scroll.
 * 
 * @param pageSize - Número de produtos por página (padrão: 40)
 * 
 * @example
 * ```tsx
 * function StoreHome() {
 *   const { products, loading, error, loadMore, hasMore, isLoadingMore } = useFirebaseProductsInfinite(40);
 *   
 *   return (
 *     <div>
 *       {products.map(product => <ProductCard key={product.id} product={product} />)}
 *       {hasMore && <button onClick={loadMore}>Carregar mais</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFirebaseProductsInfinite(pageSize: number = 40) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Refs para evitar múltiplas chamadas simultâneas e manter valores atualizados
  const isLoadingMoreRef = useRef(false);
  const lastKeyRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);

  // Sincroniza refs com estado
  useEffect(() => {
    lastKeyRef.current = lastKey;
    hasMoreRef.current = hasMore;
  }, [lastKey, hasMore]);

  // Carrega primeira página
  useEffect(() => {
    let isMounted = true;

    async function loadInitialProducts() {
      try {
        setLoading(true);
        setError(null);
        const result = await getProductsPaginated(pageSize);

        if (isMounted) {
          setProducts(result.products);
          setLastKey(result.lastKey);
          setHasMore(result.hasMore);
          lastKeyRef.current = result.lastKey;
          hasMoreRef.current = result.hasMore;
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Erro desconhecido");
          setLoading(false);
        }
      }
    }

    loadInitialProducts();

    return () => {
      isMounted = false;
    };
  }, [pageSize]);

  // Função para carregar mais produtos - usa refs para evitar closure stale
  const loadMore = useCallback(async () => {
    const currentHasMore = hasMoreRef.current;
    const currentLastKey = lastKeyRef.current;
    const currentIsLoading = isLoadingMoreRef.current;

    // Proteção contra múltiplas chamadas simultâneas
    if (!currentHasMore || currentIsLoading) {
      return;
    }

    try {
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      setError(null);

      const result = await getProductsPaginated(pageSize, currentLastKey || undefined);

      // Adiciona novos produtos ao final da lista existente
      setProducts((prev) => {
        // Evita duplicatas
        const existingIds = new Set(prev.map(p => p.id));
        const newProducts = result.products.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProducts];
      });
      
      setLastKey(result.lastKey);
      setHasMore(result.hasMore);
      lastKeyRef.current = result.lastKey;
      hasMoreRef.current = result.hasMore;
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [pageSize]);

  return {
    products,
    loading,
    error,
    loadMore,
    hasMore,
    isLoadingMore,
  };
}
