// src/services/firebaseProductService.ts
import { ref, onValue, get, query, orderByKey, limitToFirst, startAfter, type DataSnapshot } from "firebase/database";
import { db } from "./firebase";
import type { Product } from "../types";

/**
 * CQRS - READ LAYER (Query)
 * 
 * Este serviço é responsável por LEITURA em tempo real de produtos
 * usando Firebase Realtime Database.
 * 
 * Para ESCRITA (Create, Update, Delete), use `productService.ts` (API REST).
 */

/**
 * Subscreve às mudanças em tempo real da lista de produtos no Firebase.
 * 
 * @param callback - Função chamada sempre que os dados mudarem
 * @returns Função de unsubscribe para cancelar a escuta
 * 
 * @example
 * ```tsx
 * useEffect(() => {
 *   const unsubscribe = subscribeToProducts((products) => {
 *     setProducts(products);
 *   });
 *   return () => unsubscribe();
 * }, []);
 * ```
 */
export function subscribeToProducts(
  callback: (products: Product[]) => void
): () => void {
  try {
    // Referência para o nó 'products' no Firebase
    const productsRef = ref(db, "products");

    // onValue escuta mudanças em tempo real
    const unsubscribe = onValue(
      productsRef,
      (snapshot: DataSnapshot) => {
        try {
          const data = snapshot.val();

          // Se não houver dados, retorna array vazio
          if (!data) {
            console.warn("⚠️ Nenhum produto encontrado no Firebase");
            callback([]);
            return;
          }

          // Firebase retorna um objeto: { "id1": {...}, "id2": {...} }
          // Precisamos converter para array: [{id: "id1", ...}, {id: "id2", ...}]
          const productsArray: Product[] = Object.entries(data).map(
            ([id, productData]) => ({
              ...(productData as Omit<Product, "id">),
              id: Number(id), // Converte o ID para número (se for numérico)
            })
          );

          console.log(`✅ ${productsArray.length} produtos carregados do Firebase`);
          callback(productsArray);
        } catch (error) {
          console.error("❌ Erro ao processar dados do Firebase:", error);
          callback([]);
        }
      },
      (error) => {
        // Callback de erro do onValue
        console.error("❌ Erro ao escutar produtos no Firebase:", error);
        console.error("Detalhes:", {
          code: (error as { code?: string }).code || "unknown",
          message: error.message || "Erro desconhecido",
        });
        
        // Retorna array vazio em caso de erro
        callback([]);
      }
    );

    console.log("🔥 Listener Firebase iniciado para produtos");

    // Retorna função de cleanup
    return unsubscribe;
  } catch (error) {
    console.error("❌ Erro ao inicializar subscription do Firebase:", error);
    
    // Retorna função vazia como fallback
    return () => {};
  }
}

/**
 * Busca produtos uma única vez (snapshot), sem escutar mudanças.
 * 
 * @returns Promise com array de produtos
 * 
 * @example
 * ```tsx
 * const products = await getProductsOnce();
 * ```
 */
export async function getProductsOnce(): Promise<Product[]> {
  return new Promise((resolve, reject) => {
    try {
      const productsRef = ref(db, "products");

      // get() seria mais semântico, mas onValue com unsubscribe imediato funciona
      const unsubscribe = onValue(
        productsRef,
        (snapshot: DataSnapshot) => {
          unsubscribe(); // Cancela escuta após primeira leitura

          const data = snapshot.val();
          if (!data) {
            resolve([]);
            return;
          }

          const productsArray: Product[] = Object.entries(data).map(
            ([id, productData]) => ({
              ...(productData as Omit<Product, "id">),
              id: Number(id),
            })
          );

          resolve(productsArray);
        },
        (error) => {
          unsubscribe();
          console.error("❌ Erro ao buscar produtos (once):", error);
          reject(error);
        }
      );
    } catch (error) {
      console.error("❌ Erro ao inicializar busca de produtos:", error);
      reject(error);
    }
  });
}

/**
 * Busca um produto específico por ID no Firebase.
 * Usa get() para snapshot único - mais rápido.
 * 
 * @param id - ID do produto
 * @returns Promise com o produto ou null se não encontrado
 * 
 * @example
 * ```tsx
 * const product = await getProductById(123);
 * ```
 */
export async function getProductById(id: number): Promise<Product | null> {
  try {
    const productRef = ref(db, `products/${id}`);
    const snapshot = await get(productRef);

    const data = snapshot.val();
    if (!data) {
      console.warn(`⚠️ Produto ${id} não encontrado no Firebase`);
      return null;
    }

    const product: Product = {
      ...(data as Omit<Product, "id">),
      id: id,
    };

    console.log(`✅ Produto ${id} carregado`);
    return product;
  } catch (error) {
    console.error(`❌ Erro ao buscar produto ${id}:`, error);
    throw error;
  }
}

/**
 * Busca produtos paginados do Firebase.
 * Usa get() para snapshot único - mais rápido que onValue().
 * 
 * @param limit - Número de produtos por página
 * @param lastKey - Chave do último produto da página anterior (para paginação)
 * @returns Promise com array de produtos e chave do último item
 * 
 * @example
 * ```tsx
 * // Primeira página
 * const { products, lastKey } = await getProductsPaginated(40);
 * 
 * // Próxima página
 * const { products: nextProducts } = await getProductsPaginated(40, lastKey);
 * ```
 */
export async function getProductsPaginated(
  limit: number = 40,
  lastKey?: string
): Promise<{ products: Product[]; lastKey: string | null; hasMore: boolean }> {
  try {
    const productsRef = ref(db, "products");
    
    let productsQuery;
    if (lastKey) {
      // Próximas páginas: começa depois da última chave
      productsQuery = query(
        productsRef,
        orderByKey(),
        startAfter(lastKey),
        limitToFirst(limit)
      );
    } else {
      // Primeira página
      productsQuery = query(
        productsRef,
        orderByKey(),
        limitToFirst(limit)
      );
    }

    // Usa get() ao invés de onValue() - mais rápido para snapshot único
    const snapshot = await get(productsQuery);

    const data = snapshot.val();
    if (!data) {
      return { products: [], lastKey: null, hasMore: false };
    }

    const productsArray: Product[] = Object.entries(data).map(
      ([id, productData]) => ({
        ...(productData as Omit<Product, "id">),
        id: Number(id),
      })
    );

    // Última chave é o ID do último produto (ordem lexicográfica do Firebase)
    const keys = Object.keys(data);
    const newLastKey = keys.length > 0 ? keys[keys.length - 1] : null;

    // Regra simples: página cheia = pode ter mais; página incompleta = fim
    // Evita query extra que pode falhar com ordem lexicográfica das chaves.
    const hasMore = productsArray.length >= limit;

    return {
      products: productsArray,
      lastKey: newLastKey,
      hasMore,
    };
  } catch (error) {
    console.error("❌ Erro ao buscar produtos paginados:", error);
    throw error;
  }
}
