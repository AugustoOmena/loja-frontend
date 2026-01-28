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
  
  // Ref para evitar múltiplas chamadas simultâneas
  const isLoadingMoreRef = useRef(false);

  // Carrega primeira página
  useEffect(() => {
    let isMounted = true;
    console.log('🔄 Hook useFirebaseProductsInfinite montado');

    async function loadInitialProducts() {
      try {
        setLoading(true);
        setError(null);

        console.log('🚀 Carregando produtos iniciais...', { pageSize, isMounted });
        const result = await getProductsPaginated(pageSize);
        console.log('✅ Produtos iniciais carregados:', {
          produtos: result.products.length,
          lastKey: result.lastKey,
          hasMore: result.hasMore,
          pageSize,
          isMounted
        });

        if (isMounted) {
          console.log('📦 Atualizando estado com produtos:', {
            count: result.products.length,
            hasMore: result.hasMore,
            lastKey: result.lastKey,
            pageSize,
            isMounted
          });
          setProducts(result.products);
          setLastKey(result.lastKey);
          setHasMore(result.hasMore);
          setLoading(false);
          console.log('✅ Estado atualizado com sucesso - hasMore:', result.hasMore);
        } else {
          console.warn('⚠️ Componente desmontado durante carregamento, ignorando resultado');
        }
      } catch (err) {
        console.error('❌ Erro ao carregar produtos iniciais:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Erro desconhecido");
          setLoading(false);
        }
      }
    }

    loadInitialProducts();

    return () => {
      console.log('🧹 Hook useFirebaseProductsInfinite desmontado');
      isMounted = false;
    };
  }, [pageSize]);

  // Função para carregar mais produtos
  const loadMore = useCallback(async () => {
    console.log('📞 loadMore chamado:', {
      hasMore,
      isLoadingMore,
      isLoadingMoreRef: isLoadingMoreRef.current,
      lastKey,
      currentProductsCount: products.length
    });

    // Proteção contra múltiplas chamadas simultâneas
    if (!hasMore || isLoadingMore || isLoadingMoreRef.current) {
      console.log('⏸️ loadMore bloqueado:', {
        hasMore,
        isLoadingMore,
        isLoadingMoreRef: isLoadingMoreRef.current
      });
      return;
    }

    try {
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      setError(null);

      console.log('🔄 Carregando mais produtos...');
      const result = await getProductsPaginated(pageSize, lastKey || undefined);
      console.log('✅ Produtos carregados:', {
        novosProdutos: result.products.length,
        lastKey: result.lastKey,
        hasMore: result.hasMore
      });

      // Adiciona novos produtos ao final da lista existente
      setProducts((prev) => {
        // Evita duplicatas
        const existingIds = new Set(prev.map(p => p.id));
        const newProducts = result.products.filter(p => !existingIds.has(p.id));
        console.log(`📦 Adicionando ${newProducts.length} novos produtos (${prev.length} → ${prev.length + newProducts.length})`);
        return [...prev, ...newProducts];
      });
      
      setLastKey(result.lastKey);
      setHasMore(result.hasMore);
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    } catch (err) {
      console.error('❌ Erro ao carregar mais produtos:', err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [hasMore, isLoadingMore, lastKey, pageSize, products.length]);

  return {
    products,
    loading,
    error,
    loadMore,
    hasMore,
    isLoadingMore,
  };
}
