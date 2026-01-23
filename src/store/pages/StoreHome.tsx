import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Search,
  ShoppingCart,
  User,
  Star,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { productService } from "../../services/productService";
import type { Product } from "../../types";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import { supabase } from "../../services/supabaseClient";
import { useCart } from "../../contexts/CartContext";
import { MobileBottomNav } from "../../components/MobileBottomNav";
import { useTheme } from "../../contexts/ThemeContext";

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

  // --- REACT QUERY ---
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
      getNextPageParam: (lastPage) => {
        return lastPage.meta.nextPage;
      },
    });

  const loadMoreRef = useIntersectionObserver(() => {
    if (hasNextPage) fetchNextPage();
  }, !!hasNextPage);

  const allProducts = data?.pages.flatMap((page) => page.data) || [];

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
      WebkitBoxOrient: "vertical" as any,
      overflow: "hidden",
      lineHeight: "1.4",
      height: "36px",
    } as CSSProperties,
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
                fontWeight: "900",
                color: "#ff4747",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              LOJA
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
          {isLoading ? (
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
              />
              Carregando vitrine...
            </div>
          ) : (
            <>
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

              {allProducts.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: colors.muted,
                  }}
                >
                  Nenhum produto encontrado.
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
              color: colors.muted,
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

      {/* --- CORREÇÃO AQUI: Passando a função que contém a lógica de login/perfil --- */}
      <MobileBottomNav onProfileClick={handleProfileClick} />
    </div>
  );
};
