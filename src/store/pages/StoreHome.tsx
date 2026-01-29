import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Search,
  ShoppingCart,
  User,
  Star,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { Product } from "../../types";
import { supabase } from "../../services/supabaseClient";
import { useCart } from "../../contexts/CartContext";
import { MobileBottomNav } from "../../components/MobileBottomNav";
import { useTheme } from "../../contexts/ThemeContext";
import { useFirebaseProductsInfinite } from "../../hooks/useFirebaseProductsInfinite";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";

export const StoreHome = () => {
  const navigate = useNavigate();
  const { setIsCartOpen, cartCount } = useCart();
  const { colors, theme } = useTheme();

  // --- ESTADOS ---
  const [searchTermInput, setSearchTermInput] = useState("");
  const [user, setUser] = useState<SupabaseUser | null>(null);

  const [filters, setFilters] = useState({
    name: "",
    min_price: "",
    max_price: "",
    sort: "newest",
    category: "",
  });

  const categories = [
    { id: "", label: "Todos" },
    { id: "biquinis", label: "Biquínis" },
    { id: "saidas", label: "Saídas de Praia" },
    { id: "acessorios", label: "Acessórios" },
    { id: "promocao", label: "Promoções" },
  ];

  // --- AÇÕES ---
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );
    return () => authListener.subscription.unsubscribe();
  }, []);

  // Lógica centralizada: Se tiver user vai pro perfil, senão vai pro login
  const handleProfileClick = () => {
    if (user) navigate("/minha-conta");
    else navigate("/login");
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, name: searchTermInput }));
  };

  const handleCategoryClick = (catId: string) => {
    setFilters((prev) => ({ ...prev, category: catId }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- FIREBASE REALTIME DATABASE COM PAGINAÇÃO ---
  const {
    products: allProducts,
    loading: isLoading,
    error,
    loadMore,
    hasMore,
    isLoadingMore,
  } = useFirebaseProductsInfinite(40); // 40 produtos por página

  // --- FILTROS CLIENT-SIDE (Rápido e sem latência de rede) ---
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        // Busca por nome
        const matchesSearch = filters.name
          ? product.name.toLowerCase().includes(filters.name.toLowerCase())
          : true;

        // Filtra por categoria
        const matchesCategory = filters.category
          ? product.category === filters.category
          : true;

        // Filtra por preço mínimo
        const matchesMinPrice = filters.min_price
          ? product.price >= Number(filters.min_price)
          : true;

        // Filtra por preço máximo
        const matchesMaxPrice = filters.max_price
          ? product.price <= Number(filters.max_price)
          : true;

        return (
          matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice
        );
      })
      .sort((a, b) => {
        // Ordenação
        if (filters.sort === "qty_asc") {
          return (a.quantity || 0) - (b.quantity || 0);
        }
        // Default: mantém a ordem de carregamento (crescente por ID)
        // Os produtos mais recentes (IDs maiores) aparecem no final conforme são carregados
        return (a.id || 0) - (b.id || 0);
      });
  }, [allProducts, filters]);

  // --- SCROLL INFINITO ---
  // Hook carrega todos os produtos uma vez e revela em blocos; loadMore só aumenta visibleCount.
  const observerEnabled = hasMore && !isLoading;

  const loadMoreRef = useIntersectionObserver(
    () => loadMore(),
    observerEnabled,
    false, // não há carregamento assíncrono ao revelar mais
  );

  // Garante que o elemento de trigger tenha espaço suficiente quando há filtros
  // e força uma verificação do IntersectionObserver quando produtos são filtrados
  useEffect(() => {
    if (loadMoreRef.current && filteredProducts.length > 0) {
      // Se há filtros aplicados e poucos produtos, garante espaço mínimo
      const hasFilters = !!(
        filters.name ||
        filters.category ||
        filters.min_price ||
        filters.max_price
      );
      if (hasFilters && filteredProducts.length < 20) {
        // Aumenta o espaçamento quando há poucos produtos filtrados
        loadMoreRef.current.style.minHeight = "400px";
        loadMoreRef.current.style.marginTop = "60px";
      } else {
        // Espaçamento normal
        loadMoreRef.current.style.minHeight = "300px";
        loadMoreRef.current.style.marginTop = "40px";
      }

      // Se há filtros e mais produtos para carregar, força uma verificação após um delay
      if (hasFilters && hasMore) {
        setTimeout(() => window.dispatchEvent(new Event("scroll")), 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filteredProducts.length,
    filters.name,
    filters.category,
    filters.min_price,
    filters.max_price,
    hasMore,
  ]);

  // --- ESTILOS DINÂMICOS ---
  const styles = {
    // Wrapper Geral
    pageWrapper: {
      backgroundColor: colors.bg,
      minHeight: "100vh",
      fontFamily: "sans-serif",
      color: colors.text,
      width: "100%",
    },
    // Top Bar Fixa
    topBar: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      zIndex: 100,
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      borderBottom: `1px solid ${colors.border}`,
    },
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 15px",
    },
    // Barra de Pesquisa
    searchContainer: {
      flex: 1,
      backgroundColor: theme === "dark" ? "#0f172a" : "#f0f0f0",
      borderRadius: "20px",
      display: "flex",
      alignItems: "center",
      padding: "8px 15px",
      gap: "10px",
      margin: "0 15px",
      border: `1px solid ${theme === "dark" ? colors.border : "transparent"}`,
    },
    searchInput: {
      border: "none",
      background: "transparent",
      width: "100%",
      outline: "none",
      fontSize: "14px",
      color: colors.text,
    },
    // Categorias
    categoriesRow: {
      display: "flex",
      gap: "10px",
      overflowX: "auto" as const,
      paddingBottom: "15px",
      paddingTop: "5px",
      whiteSpace: "nowrap" as const,
      scrollbarWidth: "none" as const,
    },
    categoryPill: (isActive: boolean) => ({
      border: `1px solid ${isActive ? "transparent" : colors.border}`,
      padding: "8px 16px",
      borderRadius: "20px",
      backgroundColor: isActive
        ? "#ff4747"
        : theme === "dark"
          ? "#1e293b"
          : "#f5f5f5",
      color: isActive ? "white" : colors.text,
      fontSize: "13px",
      fontWeight: isActive ? "bold" : "normal",
      cursor: "pointer",
      transition: "0.2s",
      flexShrink: 0,
    }),

    // Sidebar
    sidebar: {
      width: "240px",
      backgroundColor: colors.card,
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      position: "sticky" as const,
      top: "160px",
      alignSelf: "start",
      height: "fit-content",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column" as const,
      gap: "10px",
      border: `1px solid ${colors.border}`,
    },
    filterLabel: {
      fontSize: "13px",
      fontWeight: "bold",
      display: "block",
      marginBottom: "8px",
      color: colors.muted,
    },
    filterInput: {
      width: "100%",
      padding: "8px",
      borderRadius: "4px",
      border: `1px solid ${colors.border}`,
      fontSize: "13px",
      backgroundColor: colors.bg,
      color: colors.text,
      marginBottom: "5px",
    },
    filterSelect: {
      width: "100%",
      padding: "8px",
      borderRadius: "4px",
      border: `1px solid ${colors.border}`,
      fontSize: "13px",
      backgroundColor: colors.bg,
      color: colors.text,
    },

    // Cards
    productCard: {
      backgroundColor: colors.card,
      borderRadius: "8px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column" as const,
      cursor: "pointer",
      transition: "transform 0.2s",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      border: `1px solid ${colors.border}`,
    },
    imagePlaceholder: {
      height: "180px",
      backgroundColor: colors.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative" as const,
    },
    cardBody: { padding: "10px" },
    productTitle: {
      fontSize: "13px",
      color: colors.text,
      marginBottom: "4px",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      lineHeight: "1.4",
      height: "36px",
    } as React.CSSProperties,
    priceRow: {
      display: "flex",
      alignItems: "baseline",
      color: "#ff4747",
      fontWeight: "bold",
    },
    cartBadge: {
      position: "absolute" as const,
      top: "-8px",
      right: "-8px",
      backgroundColor: "#ff4747",
      color: "white",
      fontSize: "10px",
      width: "18px",
      height: "18px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: `2px solid ${colors.card}`,
    },
    ratingRow: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      marginBottom: "4px",
    },
  };

  return (
    <div style={styles.pageWrapper}>
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .desktop-only { display: none; }
        @media (min-width: 768px) {
          .desktop-only { display: flex !important; }
        }
      `}</style>

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
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <img
                src="/casa-logo.png"
                alt="Logo da Loja"
                style={{
                  height: "40px",
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            </div>

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
                <Search size={18} color={colors.muted} />
              </button>
            </div>

            <div
              className="desktop-only"
              style={{ alignItems: "center", gap: "15px", marginLeft: "10px" }}
            >
              {user ? (
                <div
                  onClick={handleProfileClick}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    padding: "5px 10px",
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
                        color: colors.muted,
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
                        color: colors.text,
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
                      backgroundColor: colors.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${colors.border}`,
                      flexShrink: 0,
                    }}
                  >
                    <User size={18} color={colors.text} />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 20px",
                    borderRadius: "20px",
                    border: `1px solid ${colors.border}`,
                    background: colors.bg,
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    color: colors.text,
                  }}
                >
                  <User size={16} /> Entrar
                </button>
              )}

              <div
                className="desktop-only"
                style={{
                  marginLeft: "15px",
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart size={24} color={colors.text} />
                {cartCount > 0 && (
                  <span style={styles.cartBadge}>{cartCount}</span>
                )}
              </div>
            </div>
          </div>

          <div style={styles.categoriesRow} className="hide-scroll">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                style={styles.categoryPill(filters.category === cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          ...styles.container,
          display: "flex",
          gap: "20px",
          paddingTop: "150px",
          paddingBottom: "80px",
        }}
      >
        <aside className="desktop-only" style={styles.sidebar}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "15px",
              color: colors.text,
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

        <main style={{ flex: 1 }}>
          {/* Estado de Loading */}
          {isLoading && (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: colors.muted,
              }}
            >
              <Loader2
                className="animate-spin"
                style={{ margin: "0 auto 10px" }}
                size={32}
              />
              <p style={{ fontSize: "14px", marginTop: "10px" }}>
                Carregando vitrine...
              </p>
            </div>
          )}

          {/* Estado de Erro */}
          {error && !isLoading && (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
                backgroundColor: theme === "dark" ? "#7f1d1d" : "#fee2e2",
                border: `1px solid ${theme === "dark" ? "#991b1b" : "#fecaca"}`,
                borderRadius: "8px",
                margin: "20px 0",
              }}
            >
              <AlertCircle
                size={40}
                color={theme === "dark" ? "#fca5a5" : "#dc2626"}
                style={{ margin: "0 auto 15px" }}
              />
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: theme === "dark" ? "#fca5a5" : "#dc2626",
                  marginBottom: "8px",
                }}
              >
                Erro ao carregar produtos
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: theme === "dark" ? "#fca5a5" : "#dc2626",
                  marginBottom: "15px",
                }}
              >
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: theme === "dark" ? "#991b1b" : "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Grid de Produtos */}
          {!isLoading && !error && (
            <>
              {/* Badge de Resultados */}
              {filters.name ||
              filters.category ||
              filters.min_price ||
              filters.max_price ? (
                <div
                  style={{
                    padding: "10px 15px",
                    backgroundColor: colors.card,
                    borderRadius: "8px",
                    marginBottom: "15px",
                    fontSize: "13px",
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <strong>{filteredProducts.length}</strong>{" "}
                  {filteredProducts.length === 1
                    ? "produto encontrado"
                    : "produtos encontrados"}
                </div>
              ) : null}

              {/* Ajuste no GRID para permitir até 5 colunas */}
              <style>{`
                .store-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }
                @media (min-width: 768px) {
                    .store-grid {
                        /* Reduzi para 170px para caber 5 colunas no espaço disponível */
                        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
                        gap: 20px;
                    }
                }
              `}</style>

              <div className="store-grid">
                {filteredProducts.map((product: Product) => (
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
                        <ImageIcon size={30} color={colors.muted} />
                      )}
                      {(product.quantity || 0) < 5 && (
                        <span
                          style={{
                            position: "absolute",
                            bottom: "5px",
                            right: "5px",
                            backgroundColor: "rgba(0,0,0,0.6)",
                            color: "white",
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
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
                            color: colors.muted,
                            marginLeft: "3px",
                          }}
                        >
                          4.8 (Novo)
                        </span>
                      </div>
                      <div style={styles.priceRow}>
                        <span style={{ fontSize: "12px", marginRight: "2px" }}>
                          R$
                        </span>
                        <span style={{ fontSize: "18px" }}>
                          {Math.floor(product.price)}
                        </span>
                        <span style={{ fontSize: "12px" }}>
                          ,{(product.price % 1).toFixed(2).split(".")[1]}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: colors.muted,
                          marginTop: "4px",
                        }}
                      >
                        3x de R$ {(product.price / 3).toFixed(2)} sem juros
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {filteredProducts.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: colors.muted,
                  }}
                >
                  <Search
                    size={48}
                    color={colors.muted}
                    style={{ margin: "0 auto 15px", opacity: 0.5 }}
                  />
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      marginBottom: "5px",
                    }}
                  >
                    Nenhum produto encontrado
                  </p>
                  <p style={{ fontSize: "13px" }}>
                    Tente ajustar os filtros ou buscar por outro termo
                  </p>
                </div>
              )}

              {/* Loading More Indicator - Sempre renderiza quando há produtos para o IntersectionObserver funcionar */}
              {filteredProducts.length > 0 && (
                <div
                  ref={loadMoreRef}
                  style={{
                    minHeight: "300px",
                    height: "300px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.muted,
                    fontSize: "13px",
                    padding: "20px",
                    marginTop: "40px",
                    marginBottom: "40px",
                    width: "100%",
                    backgroundColor: "transparent",
                  }}
                  data-testid="load-more-trigger"
                >
                  {isLoadingMore ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <Loader2 className="animate-spin" size={20} />
                      <span>Carregando mais produtos...</span>
                    </div>
                  ) : hasMore ? (
                    <span style={{ opacity: 0.3, fontSize: "12px" }}>
                      Role para carregar mais
                    </span>
                  ) : (
                    <span style={{ opacity: 0.5 }}>Você chegou ao fim!</span>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* --- CORREÇÃO AQUI: Passando a função que contém a lógica de login/perfil --- */}
      <MobileBottomNav onProfileClick={handleProfileClick} />
    </div>
  );
};
