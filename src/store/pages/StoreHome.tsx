import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
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
  ChevronDown,
} from "lucide-react";
import type { Product } from "../../types";
import { supabase } from "../../services/supabaseClient";
import { useCart } from "../../contexts/CartContext";
import { MobileBottomNav } from "../../components/MobileBottomNav";
import { useTheme } from "../../contexts/ThemeContext";
import { useFirebaseProductsInfinite } from "../../hooks/useFirebaseProductsInfinite";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import { getProductQuantity, getStockBySize, getAvailableColors } from "../../utils/productHelpers";

const STORE_HOME_STORAGE_KEY = "store-home-filters";
const STORE_HOME_SCROLL_KEY = "store-home-scroll";

const defaultFilters = {
  name: "",
  min_price: "",
  max_price: "",
  sort: "", // sem ordenação
  category: "",
  sizes: [] as string[],
  colors: [] as string[],
  patterns: [] as string[],
};

function loadStoredFilters() {
  try {
    const s = sessionStorage.getItem(STORE_HOME_STORAGE_KEY);
    if (s) {
      const parsed = JSON.parse(s) as Record<string, unknown>;
      return {
        ...defaultFilters,
        name: typeof parsed.name === "string" ? parsed.name : defaultFilters.name,
        min_price: typeof parsed.min_price === "string" ? parsed.min_price : defaultFilters.min_price,
        max_price: typeof parsed.max_price === "string" ? parsed.max_price : defaultFilters.max_price,
        sort: typeof parsed.sort === "string" && ["", "price_asc", "price_desc", "recommended"].includes(parsed.sort) ? parsed.sort : defaultFilters.sort,
        category: typeof parsed.category === "string" ? parsed.category : defaultFilters.category,
        sizes: Array.isArray(parsed.sizes) ? parsed.sizes.filter((x): x is string => typeof x === "string") : defaultFilters.sizes,
        colors: Array.isArray(parsed.colors) ? parsed.colors.filter((x): x is string => typeof x === "string") : defaultFilters.colors,
        patterns: Array.isArray(parsed.patterns) ? parsed.patterns.filter((x): x is string => typeof x === "string") : defaultFilters.patterns,
      };
    }
  } catch {
    // ignore
  }
  return defaultFilters;
}

export const StoreHome = () => {
  const navigate = useNavigate();
  const { setIsCartOpen, cartCount } = useCart();
  const { colors, theme } = useTheme();

  // --- ESTADOS (restaurados ao voltar da página do produto) ---
  const [filters, setFilters] = useState(loadStoredFilters);
  const [searchTermInput, setSearchTermInput] = useState(() => loadStoredFilters().name);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  const [sizeFilterOpen, setSizeFilterOpen] = useState(false);
  const sizeFilterRef = useRef<HTMLDivElement>(null);
  const sizeFilterDropdownRef = useRef<HTMLDivElement>(null);
  const sizeFilterTriggerRef = useRef<HTMLButtonElement>(null);
  const [sizeFilterDropdownRect, setSizeFilterDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const [colorFilterOpen, setColorFilterOpen] = useState(false);
  const colorFilterRef = useRef<HTMLDivElement>(null);
  const colorFilterDropdownRef = useRef<HTMLDivElement>(null);
  const colorFilterTriggerRef = useRef<HTMLButtonElement>(null);
  const [colorFilterDropdownRect, setColorFilterDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const [patternFilterOpen, setPatternFilterOpen] = useState(false);
  const patternFilterRef = useRef<HTMLDivElement>(null);
  const patternFilterDropdownRef = useRef<HTMLDivElement>(null);
  const patternFilterTriggerRef = useRef<HTMLButtonElement>(null);
  const [patternFilterDropdownRect, setPatternFilterDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const categories = [
    { id: "", label: "Todos" },
    { id: "biquinis", label: "Biquínis" },
    { id: "saidas", label: "Saídas de Praia" },
    { id: "acessorios", label: "Acessórios" },
    { id: "promocao", label: "Promoções" },
  ];

  // --- PERSISTIR FILTROS (para restaurar ao voltar do produto) ---
  useEffect(() => {
    sessionStorage.setItem(STORE_HOME_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  // Ref com a posição de scroll a restaurar (lida ao montar, aplicada quando a lista existir)
  const pendingScrollY = useRef<number | null>(null);
  useEffect(() => {
    try {
      const s = sessionStorage.getItem(STORE_HOME_SCROLL_KEY);
      if (s) {
        const y = Number(s);
        if (Number.isFinite(y) && y >= 0) {
          sessionStorage.removeItem(STORE_HOME_SCROLL_KEY);
          pendingScrollY.current = y;
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleProductClick = (productId: number) => {
    sessionStorage.setItem(STORE_HOME_SCROLL_KEY, String(window.scrollY));
    navigate(`/produto/${productId}`);
  };

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

  const toggleSize = (size: string) => {
    setFilters((prev) =>
      prev.sizes.includes(size)
        ? { ...prev, sizes: prev.sizes.filter((s) => s !== size) }
        : { ...prev, sizes: [...prev.sizes, size] }
    );
  };

  const toggleColor = (color: string) => {
    setFilters((prev) =>
      prev.colors.includes(color)
        ? { ...prev, colors: prev.colors.filter((c) => c !== color) }
        : { ...prev, colors: [...prev.colors, color] }
    );
  };

  const togglePattern = (pattern: string) => {
    setFilters((prev) =>
      prev.patterns.includes(pattern)
        ? { ...prev, patterns: prev.patterns.filter((p) => p !== pattern) }
        : { ...prev, patterns: [...prev.patterns, pattern] }
    );
  };

  // Fechar dropdown ao clicar fora (o dropdown está em portal, então considerar também o ref do próprio dropdown)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideSize = sizeFilterRef.current?.contains(target) || sizeFilterDropdownRef.current?.contains(target);
      const insideColor = colorFilterRef.current?.contains(target) || colorFilterDropdownRef.current?.contains(target);
      const insidePattern = patternFilterRef.current?.contains(target) || patternFilterDropdownRef.current?.contains(target);
      if (sizeFilterOpen && !insideSize) setSizeFilterOpen(false);
      if (colorFilterOpen && !insideColor) setColorFilterOpen(false);
      if (patternFilterOpen && !insidePattern) setPatternFilterOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sizeFilterOpen, colorFilterOpen, patternFilterOpen]);

  // Posição do dropdown (portal) — atualiza ao abrir e ao scroll/resize
  const updateSizeFilterDropdownRect = () => {
    if (sizeFilterTriggerRef.current) {
      const rect = sizeFilterTriggerRef.current.getBoundingClientRect();
      setSizeFilterDropdownRect({
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 180),
      });
    }
  };
  useEffect(() => {
    if (sizeFilterOpen) {
      updateSizeFilterDropdownRect();
      window.addEventListener("scroll", updateSizeFilterDropdownRect, true);
      window.addEventListener("resize", updateSizeFilterDropdownRect);
      return () => {
        window.removeEventListener("scroll", updateSizeFilterDropdownRect, true);
        window.removeEventListener("resize", updateSizeFilterDropdownRect);
      };
    }
    setSizeFilterDropdownRect(null);
  }, [sizeFilterOpen]);

  const updateColorFilterDropdownRect = () => {
    if (colorFilterTriggerRef.current) {
      const rect = colorFilterTriggerRef.current.getBoundingClientRect();
      setColorFilterDropdownRect({
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 180),
      });
    }
  };
  useEffect(() => {
    if (colorFilterOpen) {
      updateColorFilterDropdownRect();
      window.addEventListener("scroll", updateColorFilterDropdownRect, true);
      window.addEventListener("resize", updateColorFilterDropdownRect);
      return () => {
        window.removeEventListener("scroll", updateColorFilterDropdownRect, true);
        window.removeEventListener("resize", updateColorFilterDropdownRect);
      };
    }
    setColorFilterDropdownRect(null);
  }, [colorFilterOpen]);

  const updatePatternFilterDropdownRect = () => {
    if (patternFilterTriggerRef.current) {
      const rect = patternFilterTriggerRef.current.getBoundingClientRect();
      setPatternFilterDropdownRect({
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 180),
      });
    }
  };
  useEffect(() => {
    if (patternFilterOpen) {
      updatePatternFilterDropdownRect();
      window.addEventListener("scroll", updatePatternFilterDropdownRect, true);
      window.addEventListener("resize", updatePatternFilterDropdownRect);
      return () => {
        window.removeEventListener("scroll", updatePatternFilterDropdownRect, true);
        window.removeEventListener("resize", updatePatternFilterDropdownRect);
      };
    }
    setPatternFilterDropdownRect(null);
  }, [patternFilterOpen]);

  useEffect(() => {
    if (!sizeFilterOpen && !colorFilterOpen && !patternFilterOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSizeFilterOpen(false);
        setColorFilterOpen(false);
        setPatternFilterOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [sizeFilterOpen, colorFilterOpen, patternFilterOpen]);

  // Bloquear scroll da página enquanto um dropdown de filtro estiver aberto
  useEffect(() => {
    if (sizeFilterOpen || colorFilterOpen || patternFilterOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [sizeFilterOpen, colorFilterOpen, patternFilterOpen]);

  // --- FIREBASE REALTIME DATABASE COM PAGINAÇÃO ---
  const {
    products: allProducts,
    loading: isLoading,
    error,
    loadMore,
    hasMore,
    isLoadingMore,
  } = useFirebaseProductsInfinite(40); // 40 produtos por página

  // Tamanhos disponíveis (product.size + chaves de stock por variantes)
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => {
      if (p.size && p.size.trim()) set.add(p.size.trim());
      const stock = getStockBySize(p);
      Object.keys(stock).forEach((s) => s.trim() && set.add(s.trim()));
    });
    return Array.from(set).sort((a, b) => {
      const order = ["PP", "P", "M", "G", "GG", "XG", "XXG"];
      const ia = order.indexOf(a.toUpperCase());
      const ib = order.indexOf(b.toUpperCase());
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [allProducts]);

  // Cores disponíveis (variantes com estoque > 0)
  const availableColors = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => {
      getAvailableColors(p).forEach((c) => set.add(c));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allProducts]);

  // Estampas disponíveis (product.pattern)
  const availablePatterns = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => {
      if (p.pattern && p.pattern.trim()) set.add(p.pattern.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allProducts]);

  // --- FILTROS CLIENT-SIDE (Rápido e sem latência de rede) ---
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        // Busca por nome
        const matchesSearch = filters.name
          ? product.name.toLowerCase().includes(filters.name.toLowerCase())
          : true;

        // Filtra por categoria (comparação normalizada: trim + case-insensitive)
        const matchesCategory = filters.category
          ? (product.category ?? "").trim().toLowerCase() === filters.category.trim().toLowerCase()
          : true;

        // Filtra por tamanho (múltipla escolha: produto tem pelo menos um dos tamanhos)
        const matchesSizes =
          filters.sizes.length === 0
            ? true
            : filters.sizes.some((s) => {
                if (product.size && product.size.trim() === s) return true;
                const stock = getStockBySize(product);
                if ((stock[s] ?? 0) > 0) return true;
                return false;
              });

        // Filtra por cor da variante (produto tem pelo menos uma das cores com estoque)
        const productColors = getAvailableColors(product);
        const matchesColors =
          filters.colors.length === 0
            ? true
            : filters.colors.some((c) => productColors.includes(c));

        // Filtra por estampa (product.pattern)
        const productPattern = product.pattern?.trim() ?? "";
        const matchesPatterns =
          filters.patterns.length === 0
            ? true
            : filters.patterns.some((p) => productPattern === p);

        // Filtra por preço mínimo
        const matchesMinPrice = filters.min_price
          ? product.price >= Number(filters.min_price)
          : true;

        // Filtra por preço máximo
        const matchesMaxPrice = filters.max_price
          ? product.price <= Number(filters.max_price)
          : true;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesSizes &&
          matchesColors &&
          matchesPatterns &&
          matchesMinPrice &&
          matchesMaxPrice
        );
      })
      .sort((a, b) => {
        // Sem ordenação: mantém a ordem original
        if (filters.sort === "") return 0;
        if (filters.sort === "price_desc") return b.price - a.price; // Maior preço
        if (filters.sort === "price_asc") return a.price - b.price;  // Menor preço
        if (filters.sort === "recommended") return (b.id || 0) - (a.id || 0); // Recomendados / mais relevantes (mais recentes primeiro)
        return 0;
      });
  }, [allProducts, filters.name, filters.category, filters.sizes, filters.colors, filters.patterns, filters.min_price, filters.max_price, filters.sort]);

  // --- APLICAR SCROLL RESTAURADO quando a lista estiver renderizada ---
  useEffect(() => {
    const y = pendingScrollY.current;
    if (y === null) return;
    // Só aplica quando já temos produtos (lista montada) ou loading acabou (evita scroll em tela vazia)
    if (filteredProducts.length > 0 || !isLoading) {
      pendingScrollY.current = null;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, y);
        });
      });
    }
  }, [filteredProducts.length, isLoading]);

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
        filters.sizes.length ||
        filters.colors.length ||
        filters.patterns.length ||
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
    filters.sizes.length,
    filters.colors.length,
    filters.patterns.length,
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
      backgroundColor: theme === "dark" ? "#262626" : "#f5f5f5",
      borderRadius: "20px",
      display: "flex",
      alignItems: "center",
      padding: "8px 15px",
      gap: "10px",
      margin: "0 15px",
      border: `1px solid ${colors.border}`,
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
        ? colors.accent
        : theme === "dark"
          ? colors.card
          : "#f5f5f5",
      color: isActive ? colors.accentText : colors.text,
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
      color: theme === "dark" ? colors.accent : colors.text,
      fontWeight: "bold",
    },
    cartBadge: {
      position: "absolute" as const,
      top: "-8px",
      right: "-8px",
      backgroundColor: colors.accent,
      color: colors.accentText,
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
    // Filtro de tamanho (row abaixo do header, scroll horizontal no mobile)
    sizeFilterRow: {
      display: "flex",
      gap: "10px",
      overflowX: "auto" as const,
      paddingBottom: "12px",
      paddingTop: "12px",
      whiteSpace: "nowrap" as const,
      scrollbarWidth: "none" as const,
      marginBottom: "8px",
    },
    sizeFilterTrigger: (isActive: boolean) => ({
      border: `1px solid ${isActive ? "transparent" : colors.border}`,
      padding: "8px 14px",
      borderRadius: "20px",
      backgroundColor: isActive
        ? colors.accent
        : theme === "dark"
          ? colors.card
          : "#f5f5f5",
      color: isActive ? colors.accentText : colors.text,
      fontSize: "13px",
      fontWeight: isActive ? "bold" : "normal",
      cursor: "pointer",
      transition: "0.2s",
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
    }),
    sizeFilterDropdown: (rect: { top: number; left: number; width: number }) => ({
      position: "fixed" as const,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      minWidth: "180px",
      maxHeight: "min(280px, 50vh)",
      overflowY: "auto" as const,
      backgroundColor: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: "12px",
      boxShadow: "0 12px 40px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.08)",
      zIndex: 1000,
      padding: "8px",
    }),
    sizeFilterBackdrop: {
      position: "fixed" as const,
      inset: 0,
      zIndex: 999,
      backgroundColor: "rgba(0,0,0,0.15)",
    },
    sizeFilterOption: (selected: boolean) => ({
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 12px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "13px",
      backgroundColor: selected
        ? theme === "dark"
          ? "rgba(244,214,54,0.25)"
          : "rgba(244,214,54,0.2)"
        : "transparent",
      color: colors.text,
      border: "none",
      width: "100%",
      textAlign: "left" as const,
    }),
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
          paddingTop: "150px",
          paddingBottom: "80px",
        }}
      >
        {/* Filtros por tamanho, cor e estampa — logo abaixo do header, scroll horizontal no mobile */}
        <div
          style={styles.sizeFilterRow}
          className="hide-scroll"
        >
          <div style={{ position: "relative", flexShrink: 0 }} ref={colorFilterRef}>
            <button
              ref={colorFilterTriggerRef}
              type="button"
              onClick={() => setColorFilterOpen((o) => !o)}
              style={styles.sizeFilterTrigger(filters.colors.length > 0)}
              aria-expanded={colorFilterOpen}
              aria-haspopup="listbox"
            >
              Cor{filters.colors.length > 0 ? ` (${filters.colors.length})` : ""}
              <ChevronDown
                size={16}
                style={{
                  transform: colorFilterOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </button>
          </div>
          <div style={{ position: "relative", flexShrink: 0 }} ref={patternFilterRef}>
            <button
              ref={patternFilterTriggerRef}
              type="button"
              onClick={() => setPatternFilterOpen((o) => !o)}
              style={styles.sizeFilterTrigger(filters.patterns.length > 0)}
              aria-expanded={patternFilterOpen}
              aria-haspopup="listbox"
            >
              Estampa{filters.patterns.length > 0 ? ` (${filters.patterns.length})` : ""}
              <ChevronDown
                size={16}
                style={{
                  transform: patternFilterOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </button>
          </div>
          <div style={{ position: "relative", flexShrink: 0 }} ref={sizeFilterRef}>
            <button
              ref={sizeFilterTriggerRef}
              type="button"
              onClick={() => setSizeFilterOpen((o) => !o)}
              style={styles.sizeFilterTrigger(filters.sizes.length > 0)}
              aria-expanded={sizeFilterOpen}
              aria-haspopup="listbox"
            >
              Tamanho{filters.sizes.length > 0 ? ` (${filters.sizes.length})` : ""}
              <ChevronDown
                size={16}
                style={{
                  transform: sizeFilterOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </button>
          </div>
          {/* Ordenar por — visível em todos os viewports (no mobile o sidebar está oculto) */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <label htmlFor="store-sort" style={{ display: "none" }}>Ordenar por</label>
            <select
              id="store-sort"
              aria-label="Ordenar por"
              style={{
                ...styles.sizeFilterTrigger(false),
                appearance: "auto",
                minWidth: "140px",
              }}
              value={filters.sort}
              onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
            >
              <option value="">Ordenar por</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="recommended">Recomendados</option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
            flex: 1,
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
              <option value="">Ordenar por</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="recommended">Recomendados</option>
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
                backgroundColor: theme === "dark" ? "rgba(244,214,54,0.15)" : "rgba(244,214,54,0.12)",
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

          {/* Grid de Produtos */}
          {!isLoading && !error && (
            <>
              {/* Badge de Resultados */}
              {filters.name ||
              filters.category ||
              filters.sizes.length > 0 ||
              filters.colors.length > 0 ||
              filters.patterns.length > 0 ||
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
                    onClick={() => product.id != null && handleProductClick(product.id)}
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
                      {getProductQuantity(product) <= 3 && getProductQuantity(product) > 0 && (
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
                        <Star size={10} fill={colors.accent} color={colors.accent} />
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
      </div>

      {/* Dropdown de cor em portal */}
      {colorFilterOpen &&
        colorFilterDropdownRect &&
        availableColors.length > 0 &&
        createPortal(
          <>
            <div
              style={styles.sizeFilterBackdrop}
              onClick={() => setColorFilterOpen(false)}
              role="presentation"
              aria-hidden
            />
            <div
              ref={colorFilterDropdownRef}
              style={styles.sizeFilterDropdown(colorFilterDropdownRect)}
              role="listbox"
              aria-multiselectable="true"
              onClick={(e) => e.stopPropagation()}
            >
              {availableColors.map((color) => {
                const selected = filters.colors.includes(color);
                return (
                  <button
                    key={color}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    style={styles.sizeFilterOption(selected)}
                    onClick={() => toggleColor(color)}
                  >
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "4px",
                        border: `2px solid ${selected ? colors.accent : colors.border}`,
                        backgroundColor: selected ? colors.accent : "transparent",
                        flexShrink: 0,
                      }}
                    />
                    {color}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}

      {/* Dropdown de estampa em portal */}
      {patternFilterOpen &&
        patternFilterDropdownRect &&
        availablePatterns.length > 0 &&
        createPortal(
          <>
            <div
              style={styles.sizeFilterBackdrop}
              onClick={() => setPatternFilterOpen(false)}
              role="presentation"
              aria-hidden
            />
            <div
              ref={patternFilterDropdownRef}
              style={styles.sizeFilterDropdown(patternFilterDropdownRect)}
              role="listbox"
              aria-multiselectable="true"
              onClick={(e) => e.stopPropagation()}
            >
              {availablePatterns.map((pattern) => {
                const selected = filters.patterns.includes(pattern);
                return (
                  <button
                    key={pattern}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    style={styles.sizeFilterOption(selected)}
                    onClick={() => togglePattern(pattern)}
                  >
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "4px",
                        border: `2px solid ${selected ? colors.accent : colors.border}`,
                        backgroundColor: selected ? colors.accent : "transparent",
                        flexShrink: 0,
                      }}
                    />
                    {pattern}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}

      {/* Dropdown de tamanho em portal — flutua sobre o conteúdo (estilo SHEIN) */}
      {sizeFilterOpen &&
        sizeFilterDropdownRect &&
        availableSizes.length > 0 &&
        createPortal(
          <>
            <div
              style={styles.sizeFilterBackdrop}
              onClick={() => setSizeFilterOpen(false)}
              role="presentation"
              aria-hidden
            />
            <div
              ref={sizeFilterDropdownRef}
              style={styles.sizeFilterDropdown(sizeFilterDropdownRect)}
              role="listbox"
              aria-multiselectable="true"
              onClick={(e) => e.stopPropagation()}
            >
              {availableSizes.map((size) => {
                const selected = filters.sizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    style={styles.sizeFilterOption(selected)}
                    onClick={() => toggleSize(size)}
                  >
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "4px",
                        border: `2px solid ${selected ? colors.accent : colors.border}`,
                        backgroundColor: selected ? colors.accent : "transparent",
                        flexShrink: 0,
                      }}
                    />
                    {size}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}

      {/* --- CORREÇÃO AQUI: Passando a função que contém a lógica de login/perfil --- */}
      <MobileBottomNav onProfileClick={handleProfileClick} />
    </div>
  );
};
