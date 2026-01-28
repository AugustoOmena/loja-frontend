// src/hooks/useFirebaseProducts.ts
import { useEffect, useState } from "react";
import { subscribeToProducts } from "../services/firebaseProductService";
import type { Product } from "../types";

/**
 * Hook customizado para escutar produtos do Firebase Realtime Database.
 * 
 * Retorna o estado atual dos produtos e gerencia automaticamente
 * o ciclo de vida da subscription (cleanup no unmount).
 * 
 * @example
 * ```tsx
 * function StoreHome() {
 *   const { products, loading, error } = useFirebaseProducts();
 *   
 *   if (loading) return <p>Carregando...</p>;
 *   if (error) return <p>Erro: {error}</p>;
 *   
 *   return (
 *     <div>
 *       {products.map(product => (
 *         <ProductCard key={product.id} product={product} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFirebaseProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Flag para evitar race conditions
    let isMounted = true;

    try {
      // Inicia a subscription
      const unsubscribe = subscribeToProducts((newProducts) => {
        if (isMounted) {
          setProducts(newProducts);
          setLoading(false);
          setError(null);
        }
      });

      // Cleanup: cancela a subscription quando o componente desmontar
      return () => {
        isMounted = false;
        unsubscribe();
        console.log("🔥 Listener Firebase desconectado");
      };
    } catch (err) {
      if (isMounted) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setLoading(false);
      }
      return undefined;
    }
  }, []); // Array vazio = executa apenas no mount

  return { products, loading, error };
}
