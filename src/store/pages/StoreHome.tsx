// CORREÇÃO AQUI: Adicionado useEffect na importação
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Search,
  ShoppingCart,
  User,
  Home,
  Filter,
  Star,
  Image as ImageIcon,
} from "lucide-react";
import { productService } from "../../services/productService";
import type { Product } from "../../types";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import { supabase } from "../../services/supabaseClient";
import { useCart } from "../../contexts/CartContext";

export const StoreHome = () => {
  // --- ESTADOS ---
  const navigate = useNavigate();

  const { setIsCartOpen, cartCount } = useCart(); // 2. Pegue as funções

  // 1. Estado do Input (O que o usuário está digitando agora)
  const [searchTermInput, setSearchTermInput] = useState("");

  const [user, setUser] = useState<SupabaseUser | null>(null);

  // 2. Filtros Ativos (O que realmente está sendo buscado na API)
  const [filters, setFilters] = useState({
    name: "",
    min_price: "",
    max_price: "",
    sort: "newest",
    category: "",
  });

  // --- AÇÕES ---

  useEffect(() => {
    // Verifica usuário atual ao carregar a tela
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Escuta mudanças (Login/Logout em outras abas ou redirecionamentos)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Função centralizada de navegação do perfil
  const handleProfileClick = () => {
    if (user) {
      navigate("/minha-conta/pedidos"); // Vai para o Dashboard
    } else {
      navigate("/login"); // Vai para Login
    }
  };

  // Dispara a busca quando clica na lupa ou dá Enter
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, name: searchTermInput }));
  };

  // --- REACT QUERY (INFINITE SCROLL) ---
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["store_products", filters],
      queryFn: ({ pageParam = 1 }) => {
        return productService.getInfinite({
          pageParam,
          filters: {
            search: filters.name,
            min_price: filters.min_price,
            max_price: filters.max_price,
            sort: filters.sort,
            category: filters.category,
          },
        });
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        const currentCount = lastPage.data.length;
        // Se retornou menos que o limite (10), significa que acabou a lista
        return currentCount < 10 ? undefined : allPages.length + 1;
      },
    });

  // Hook para detectar quando chegou no fim da página
  const loadMoreRef = useIntersectionObserver(() => {
    if (hasNextPage) fetchNextPage();
  }, !!hasNextPage);

  const allProducts = data?.pages.flatMap((page) => page.data) || [];

  return (
    <div
      style={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      {/* --- TOP BAR --- */}
      <div style={styles.topBar}>
        <div style={styles.container}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 0",
            }}
          >
            {/* Logo */}
            <div
              style={{
                fontWeight: "900",
                color: "#ff4747",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              LOJA
            </div>

            {/* Barra de Pesquisa (Flex 1 para ocupar o espaço disponível) */}
            <div style={styles.searchContainer}>
              <input
                placeholder="O que você procura?"
                value={searchTermInput}
                onChange={(e) => setSearchTermInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                style={styles.searchInput}
              />
              <button
                onClick={handleSearch}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <Search size={18} color="#666" />
              </button>
            </div>

            {/* --- BLOCO DIREITO: PERFIL + CARRINHO (SÓ DESKTOP) --- */}
            {/* Ao agrupar tudo aqui dentro com 'desktop-only', garantimos que no mobile
          TUDO ISSO SOME e não quebra o layout. O carrinho no mobile fica no menu de baixo. */}
            <div
              className="desktop-only"
              style={{ alignItems: "center", gap: "15px", marginLeft: "10px" }}
            >
              {user ? (
                // PERFIL LOGADO
                <div
                  onClick={handleProfileClick}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    padding: "5px 10px",
                    borderRadius: "8px",
                    backgroundColor: "transparent",
                    transition: "0.2s",
                  }}
                >
                  <div
                    style={{
                      textAlign: "right",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        color: "#666",
                        fontSize: "11px",
                        lineHeight: "1",
                      }}
                    >
                      Olá,
                    </span>
                    <span
                      style={{
                        fontWeight: "bold",
                        fontSize: "13px",
                        maxWidth: "100px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "#333",
                      }}
                    >
                      {user.user_metadata?.name || user.email?.split("@")[0]}
                    </span>
                  </div>
                  <div
                    style={{
                      width: "35px",
                      height: "35px",
                      borderRadius: "50%",
                      backgroundColor: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #e2e8f0",
                      flexShrink: 0,
                    }}
                  >
                    <User size={18} color="#333" />
                  </div>
                </div>
              ) : (
                // BOTÃO ENTRAR
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 20px",
                    borderRadius: "20px",
                    border: "1px solid #e2e8f0",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    color: "#333",
                    whiteSpace: "nowrap",
                  }}
                >
                  <User size={16} /> Entrar
                </button>
              )}

              {/* CARRINHO (DESKTOP) - Fica ao lado do perfil */}
              <div
                className="desktop-only"
                style={{
                  marginLeft: "15px",
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart size={24} color="#333" />
                {cartCount > 0 && (
                  <span style={styles.cartBadge}>{cartCount}</span>
                )}
              </div>
            </div>
            {/* FIM DO BLOCO DIREITO */}
          </div>

          {/* Categorias (Scroll Horizontal) */}
          {/* ... código das categorias continua igual ... */}
        </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div
        style={{
          ...styles.container,
          display: "flex",
          gap: "20px",
          marginTop: "110px",
        }}
      >
        {/* --- SIDEBAR FILTROS (Desktop) --- */}
        <aside className="desktop-only" style={styles.sidebar}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "15px",
            }}
          >
            Filtros
          </h3>

          <div style={{ marginBottom: "20px" }}>
            <label style={styles.filterLabel}>Preço</label>
            <div style={{ display: "flex", gap: "5px" }}>
              <input
                placeholder="Min"
                type="number"
                value={filters.min_price}
                onChange={(e) =>
                  setFilters({ ...filters, min_price: e.target.value })
                }
                style={styles.filterInput}
              />
              <input
                placeholder="Max"
                type="number"
                value={filters.max_price}
                onChange={(e) =>
                  setFilters({ ...filters, max_price: e.target.value })
                }
                style={styles.filterInput}
              />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={styles.filterLabel}>Ordenar por</label>
            <select
              style={styles.filterSelect}
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            >
              <option value="newest">Mais Recentes</option>
              <option value="qty_asc">Menor Estoque</option>
            </select>
          </div>
        </aside>

        {/* --- GRID DE PRODUTOS --- */}
        <main style={{ flex: 1 }}>
          {isLoading ? (
            <div
              style={{ padding: "40px", textAlign: "center", color: "#666" }}
            >
              Carregando vitrine...
            </div>
          ) : (
            <>
              <div className="store-grid">
                {allProducts.map((product: Product) => (
                  <div
                    key={product.id}
                    style={styles.productCard}
                    onClick={() => navigate(`/produto/${product.id}`)}
                  >
                    <div style={styles.imagePlaceholder}>
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            color: "#ccc",
                          }}
                        >
                          <ImageIcon size={30} />
                        </div>
                      )}
                      {(product.quantity || 0) < 5 && (
                        <span style={styles.badgeLowStock}>
                          Restam {product.quantity}
                        </span>
                      )}
                    </div>

                    <div style={styles.cardBody}>
                      <div style={styles.productTitle}>{product.name}</div>

                      <div style={styles.ratingRow}>
                        <Star size={10} fill="#facc15" color="#facc15" />
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#777",
                            marginLeft: "3px",
                          }}
                        >
                          4.8 (Novo)
                        </span>
                      </div>

                      <div style={styles.priceRow}>
                        <span style={styles.currency}>R$</span>
                        <span style={styles.price}>
                          {Math.floor(product.price)}
                        </span>
                        <span style={styles.cents}>
                          ,{(product.price % 1).toFixed(2).split(".")[1]}
                        </span>
                      </div>

                      <div style={styles.installment}>
                        3x de R$ {(product.price / 3).toFixed(2)} sem juros
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {allProducts.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#888",
                  }}
                >
                  Nenhum produto encontrado com estes filtros.
                </div>
              )}
            </>
          )}

          <div
            ref={loadMoreRef}
            style={{
              height: "40px",
              textAlign: "center",
              padding: "20px",
              color: "#999",
              fontSize: "12px",
            }}
          >
            {isFetchingNextPage
              ? "Carregando mais..."
              : !hasNextPage && allProducts.length > 0
                ? "Você chegou ao fim!"
                : ""}
          </div>
        </main>
      </div>

      {/* --- BOTTOM NAV (Mobile) --- */}
      <nav className="mobile-only" style={styles.bottomNav}>
        <button style={styles.navItemActive}>
          <Home size={22} />
          <span>Início</span>
        </button>
        <button style={styles.navItem}>
          <Filter size={22} />
          <span>Categorias</span>
        </button>
        <button style={styles.navItem} onClick={() => setIsCartOpen(true)}>
          <div style={{ position: "relative" }}>
            <ShoppingCart size={22} color="#888" />
            {cartCount > 0 && (
              <span style={styles.cartBadgeMobile}>{cartCount}</span>
            )}
          </div>
          <span>Carrinho</span>
        </button>
        <button style={styles.navItem} onClick={handleProfileClick}>
          <User size={22} color={user ? "#0f172a" : "#888"} />
          <span>{user ? "Minha Conta" : "Entrar"}</span>
        </button>
      </nav>
    </div>
  );
};

// --- ESTILOS ---
// --- ESTILOS CORRIGIDOS ---
const styles: { [key: string]: React.CSSProperties } = {
  topBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    zIndex: 100,
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },

  // Aumentei um pouco a margem superior para garantir que não corte nada
  container: { maxWidth: "1200px", margin: "0 auto", padding: "0 15px" },

  searchContainer: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    padding: "8px 15px",
    gap: "10px",
    margin: "0 15px",
  },
  searchInput: {
    border: "none",
    background: "transparent",
    width: "100%",
    outline: "none",
    fontSize: "14px",
  },
  categoriesRow: {
    display: "flex",
    gap: "10px",
    overflowX: "auto",
    paddingBottom: "10px",
    whiteSpace: "nowrap",
  },
  categoryPill: {
    border: "none",
    padding: "6px 14px",
    borderRadius: "15px",
    backgroundColor: "#f5f5f5",
    color: "#333",
    fontSize: "13px",
    cursor: "pointer",
    transition: "0.2s",
  },
  categoryPillActive: {
    border: "none",
    padding: "6px 14px",
    borderRadius: "15px",
    backgroundColor: "#ff4747",
    color: "white",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.2s",
  },

  // --- CORREÇÃO DA SIDEBAR ---
  sidebar: {
    width: "240px", // Largura fixa
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",

    // Configuração Sticky
    position: "sticky",
    top: "140px",
    alignSelf: "start",
    height: "fit-content",

    // Configuração de Layout (Correção da quebra)
    flexShrink: 0,
    flexDirection: "column",
    gap: "10px",
  },

  filterLabel: {
    fontSize: "13px",
    fontWeight: "bold",
    display: "block",
    marginBottom: "8px",
    color: "#555",
  },
  filterInput: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    fontSize: "13px",
    marginBottom: "5px",
  },
  filterSelect: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    fontSize: "13px",
  },

  // Product Card
  productCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    cursor: "pointer",
    transition: "transform 0.2s",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  imagePlaceholder: {
    height: "180px",
    backgroundColor: "#f9f9f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeLowStock: {
    position: "absolute",
    bottom: "5px",
    right: "5px",
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "white",
    fontSize: "10px",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  cardBody: { padding: "10px" },
  productTitle: {
    fontSize: "13px",
    color: "#333",
    marginBottom: "4px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: "1.4",
    height: "36px",
  },
  ratingRow: { display: "flex", alignItems: "center", marginBottom: "8px" },
  priceRow: {
    display: "flex",
    alignItems: "baseline",
    color: "#ff4747",
    fontWeight: "bold",
  },
  currency: { fontSize: "12px", marginRight: "2px" },
  price: { fontSize: "18px" },
  cents: { fontSize: "12px" },
  installment: { fontSize: "10px", color: "#999", marginTop: "4px" },

  // Bottom Nav
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTop: "1px solid #eee",
    display: "flex",
    justifyContent: "space-around",
    padding: "10px 0",
    zIndex: 100,
  },
  navItem: {
    border: "none",
    background: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: "10px",
    color: "#888",
    gap: "4px",
    position: "relative",
  },
  navItemActive: {
    border: "none",
    background: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: "10px",
    color: "#ff4747",
    gap: "4px",
    fontWeight: "bold",
  },
  cartBadge: {
    position: "absolute",
    top: "-5px",
    right: "5px",
    backgroundColor: "#ff4747",
    color: "white",
    fontSize: "9px",
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
