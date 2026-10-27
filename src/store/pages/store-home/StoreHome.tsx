import {
  User,
  ShoppingCart,
  ChevronDown,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Star,
  Search,
} from "lucide-react";
import { MobileBottomNav } from "../../../components/MobileBottomNav";
import {
  ProductSearchBar,
  ProductCategoryPills,
} from "../../../components/ProductSearchAndCategories";
import { STORE_CATEGORIES } from "../../../constants/storeCategories";
import { useTheme } from "../../../contexts/ThemeContext";
import { useStoreHome } from "../../../hooks/useStoreHome";
import type { Product } from "../../../types";
import {
  getProductQuantity,
  getAvailableColors,
  getColorDotFill,
} from "../../../utils/productHelpers";
import { createStoreHomeStyles } from "./StoreHome.styles";

export const StoreHome = () => {
  const { colors, theme } = useTheme();
  const styles = createStoreHomeStyles(colors, theme);

  // Desestruturamos direto para não haver acesso de propriedades em cascata
  const {
    navigate,
    user,
    cartCount,
    setIsCartOpen,
    filters,
    setFilters,
    searchTermInput,
    setSearchTermInput,
    handleSearch,
    handleCategoryClick,
    handleProfileClick,
    handleProductClick,
    toggleSize,
    toggleColor,
    togglePattern,
    filteredProducts,
    availableSizes,
    availableColors,
    availablePatterns,
    isLoading,
    error,
    hasMore,
    isLoadingMore,
    loadMoreRef,
    sizeFilterOpen,
    setSizeFilterOpen,
    colorFilterOpen,
    setColorFilterOpen,
    patternFilterOpen,
    setPatternFilterOpen,
  } = useStoreHome();

  return (
    <div style={styles.pageWrapper}>
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .desktop-only { display: none; }
        @media (min-width: 768px) {
          .desktop-only { display: flex !important; }
        }
        .store-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        @media (min-width: 768px) {
          .store-grid {
            grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
            gap: 20px;
          }
        }
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          min-width: 180px;
          max-height: 280px;
          overflow-y: auto;
          background-color: ${colors.card};
          border: 1px solid ${colors.border};
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          z-index: 50;
          padding: 8px;
        }
      `}</style>

      {/* --- TOP BAR FIXA --- */}
      <header style={styles.topBar}>
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
              style={{ flexShrink: 0, display: "flex", alignItems: "center" }}
            >
              <img
                src="/casa-logo.png"
                alt="Logo da Loja"
                style={{ height: "40px", width: "auto", objectFit: "contain" }}
              />
            </div>

            <ProductSearchBar
              searchValue={searchTermInput}
              onSearchChange={setSearchTermInput}
              onSearchSubmit={handleSearch}
              style={{ margin: "0 15px" }}
            />

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

          <ProductCategoryPills
            categoryId={filters.category}
            onCategoryChange={handleCategoryClick}
            categories={STORE_CATEGORIES}
          />
        </div>
      </header>

      {/* --- CORPO PRINCIPAL --- */}
      <div
        style={{
          ...styles.container,
          paddingTop: "150px",
          paddingBottom: "80px",
        }}
      >
        {/* Filtros em Linha com Dropdown Nativo */}
        <div style={styles.sizeFilterRow} className="hide-scroll">
          {/* Menu de Cor */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                setColorFilterOpen((prev) => !prev);
                setSizeFilterOpen(false);
                setPatternFilterOpen(false);
              }}
              style={styles.sizeFilterTrigger(filters.colors.length > 0)}
            >
              Cor
              {filters.colors.length > 0 ? ` (${filters.colors.length})` : ""}
              <ChevronDown
                size={16}
                style={{
                  transform: colorFilterOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </button>
            {colorFilterOpen && availableColors.length > 0 && (
              <div className="dropdown-menu">
                {availableColors.map((color) => {
                  const selected = filters.colors.includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      style={styles.sizeFilterOption(selected)}
                      onClick={() => toggleColor(color)}
                    >
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "4px",
                          border: `2px solid ${selected ? colors.accent : colors.border}`,
                          backgroundColor: selected
                            ? colors.accent
                            : "transparent",
                          flexShrink: 0,
                        }}
                      />
                      {color}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Menu de Estampa */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                setPatternFilterOpen((prev) => !prev);
                setColorFilterOpen(false);
                setSizeFilterOpen(false);
              }}
              style={styles.sizeFilterTrigger(filters.patterns.length > 0)}
            >
              Estampa
              {filters.patterns.length > 0
                ? ` (${filters.patterns.length})`
                : ""}
              <ChevronDown
                size={16}
                style={{
                  transform: patternFilterOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </button>
            {patternFilterOpen && availablePatterns.length > 0 && (
              <div className="dropdown-menu">
                {availablePatterns.map((pattern) => {
                  const selected = filters.patterns.includes(pattern);
                  return (
                    <button
                      key={pattern}
                      type="button"
                      style={styles.sizeFilterOption(selected)}
                      onClick={() => togglePattern(pattern)}
                    >
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "4px",
                          border: `2px solid ${selected ? colors.accent : colors.border}`,
                          backgroundColor: selected
                            ? colors.accent
                            : "transparent",
                          flexShrink: 0,
                        }}
                      />
                      {pattern}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Menu de Tamanho */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                setSizeFilterOpen((prev) => !prev);
                setColorFilterOpen(false);
                setPatternFilterOpen(false);
              }}
              style={styles.sizeFilterTrigger(filters.sizes.length > 0)}
            >
              Tamanho
              {filters.sizes.length > 0 ? ` (${filters.sizes.length})` : ""}
              <ChevronDown
                size={16}
                style={{
                  transform: sizeFilterOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </button>
            {sizeFilterOpen && availableSizes.length > 0 && (
              <div className="dropdown-menu">
                {availableSizes.map((size) => {
                  const selected = filters.sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      style={styles.sizeFilterOption(selected)}
                      onClick={() => toggleSize(size)}
                    >
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "4px",
                          border: `2px solid ${selected ? colors.accent : colors.border}`,
                          backgroundColor: selected
                            ? colors.accent
                            : "transparent",
                          flexShrink: 0,
                        }}
                      />
                      {size}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ordenação */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select
              aria-label="Ordenar por"
              style={{
                ...styles.sizeFilterTrigger(false),
                appearance: "auto",
                minWidth: "140px",
              }}
              value={filters.sort}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, sort: e.target.value }))
              }
            >
              <option value="">Ordenar por</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="recommended">Recomendados</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px", flex: 1 }}>
          {/* Sidebar Desktop */}
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
                onChange={(e) =>
                  setFilters({ ...filters, sort: e.target.value })
                }
              >
                <option value="">Ordenar por</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="recommended">Recomendados</option>
              </select>
            </div>
          </aside>

          {/* Grid de Produtos */}
          <main style={{ flex: 1 }}>
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

            {error && !isLoading && (
              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  backgroundColor:
                    theme === "dark"
                      ? "rgba(244,214,54,0.15)"
                      : "rgba(244,214,54,0.12)",
                  border: `1px solid ${theme === "dark" ? "rgba(244,214,54,0.4)" : "rgba(244,214,54,0.35)"}`,
                  borderRadius: "8px",
                  margin: "20px 0",
                }}
              >
                <AlertCircle
                  size={40}
                  color={colors.accent}
                  style={{ margin: "0 auto 15px" }}
                />
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: colors.text,
                    marginBottom: "8px",
                  }}
                >
                  Erro ao carregar produtos
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: colors.muted,
                    marginBottom: "15px",
                  }}
                >
                  {error}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: colors.accent,
                    color: colors.accentText,
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

            {!isLoading && !error && (
              <>
                <div className="store-grid">
                  {filteredProducts.map((product: Product) => (
                    <article
                      key={product.id}
                      style={styles.productCard}
                      onClick={() =>
                        product.id != null && handleProductClick(product.id)
                      }
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
                        {getProductQuantity(product) <= 3 &&
                          getProductQuantity(product) > 0 && (
                            <span
                              style={{
                                position: "absolute",
                                bottom: "5px",
                                right: "5px",
                                left: "5px",
                                backgroundColor: "rgba(0,0,0,0.7)",
                                color: "white",
                                fontSize: "10px",
                                padding: "4px 6px",
                                borderRadius: "4px",
                                textAlign: "center",
                              }}
                            >
                              Últimas {getProductQuantity(product)} peças!
                            </span>
                          )}
                      </div>
                      <div style={styles.cardBody}>
                        <div style={styles.productTitle}>{product.name}</div>
                        <div style={styles.ratingRow}>
                          <Star
                            size={10}
                            fill={colors.accent}
                            color={colors.accent}
                          />
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
                        {getAvailableColors(product).length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "4px",
                              marginTop: "6px",
                              alignItems: "center",
                            }}
                          >
                            {getAvailableColors(product).map((color) => (
                              <span
                                key={color}
                                title={color}
                                style={{
                                  width: "9px",
                                  height: "9px",
                                  borderRadius: "50%",
                                  backgroundColor: getColorDotFill(color),
                                  border: `1px solid ${colors.border}`,
                                  flexShrink: 0,
                                }}
                              />
                            ))}
                          </div>
                        )}
                        <div style={styles.priceRow}>
                          <span
                            style={{ fontSize: "12px", marginRight: "2px" }}
                          >
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
                    </article>
                  ))}
                </div>

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
                    }}
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
      </div>

      <MobileBottomNav onProfileClick={handleProfileClick} />
    </div>
  );
};
