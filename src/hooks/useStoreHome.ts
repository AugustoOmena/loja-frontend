import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useCart } from "../contexts/CartContext";
import { supabase } from "../services/supabaseClient";
import { getStockBySize, getAvailableColors } from "../utils/productHelpers";
import { useFirebaseProductsInfinite } from "./useFirebaseProductsInfinite";
import { useIntersectionObserver } from "./useIntersectionObserver";

const STORE_HOME_STORAGE_KEY = "store-home-filters";
const STORE_HOME_SCROLL_KEY = "store-home-scroll";

export const defaultFilters = {
  name: "",
  min_price: "",
  max_price: "",
  sort: "",
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

export function useStoreHome() {
  const navigate = useNavigate();
  const { setIsCartOpen, cartCount } = useCart();

  const [filters, setFilters] = useState(loadStoredFilters);
  const [searchTermInput, setSearchTermInput] = useState(() => loadStoredFilters().name);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  // Estados dos menus de filtro (aberto / fechado)
  const [sizeFilterOpen, setSizeFilterOpen] = useState(false);
  const [colorFilterOpen, setColorFilterOpen] = useState(false);
  const [patternFilterOpen, setPatternFilterOpen] = useState(false);

  // 1. Sessão segura
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // 2. Persistência de filtros
  useEffect(() => {
    sessionStorage.setItem(STORE_HOME_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  // 3. Scroll restoration
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

  // 4. Catálogo Firebase
  const {
    products: allProducts,
    loading: isLoading,
    error,
    loadMore,
    hasMore,
    isLoadingMore,
  } = useFirebaseProductsInfinite(40);

  // 5. Opções disponíveis calculadas
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

  const availableColors = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => {
      getAvailableColors(p).forEach((c) => set.add(c));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allProducts]);

  const availablePatterns = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => {
      if (p.pattern && p.pattern.trim()) set.add(p.pattern.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allProducts]);

  // 6. Filtros em memória
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        const matchesSearch = filters.name
          ? product.name.toLowerCase().includes(filters.name.toLowerCase())
          : true;

        const matchesCategory = filters.category
          ? (product.category ?? "").trim().toLowerCase() === filters.category.trim().toLowerCase()
          : true;

        const matchesSizes =
          filters.sizes.length === 0
            ? true
            : filters.sizes.some((s) => {
                if (product.size && product.size.trim() === s) return true;
                const stock = getStockBySize(product);
                return (stock[s] ?? 0) > 0;
              });

        const productColors = getAvailableColors(product);
        const matchesColors =
          filters.colors.length === 0
            ? true
            : filters.colors.some((c) => productColors.includes(c));

        const productPattern = product.pattern?.trim() ?? "";
        const matchesPatterns =
          filters.patterns.length === 0
            ? true
            : filters.patterns.some((p) => productPattern === p);

        const matchesMinPrice = filters.min_price
          ? product.price >= Number(filters.min_price)
          : true;

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
        if (filters.sort === "") return 0;
        if (filters.sort === "price_desc") return b.price - a.price;
        if (filters.sort === "price_asc") return a.price - b.price;
        if (filters.sort === "recommended") return (b.id || 0) - (a.id || 0);
        return 0;
      });
  }, [allProducts, filters]);

  // 7. Scroll automático
  useEffect(() => {
    const y = pendingScrollY.current;
    if (y === null) return;
    if (filteredProducts.length > 0 || !isLoading) {
      pendingScrollY.current = null;
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
      });
    }
  }, [filteredProducts.length, isLoading]);

  // 8. Observer de rolagem infinita
  const observerEnabled = hasMore && !isLoading;
  const loadMoreRef = useIntersectionObserver(() => loadMore(), observerEnabled, false);

  // 9. Fechar dropdowns com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSizeFilterOpen(false);
        setColorFilterOpen(false);
        setPatternFilterOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleProductClick = (productId: number) => {
    sessionStorage.setItem(STORE_HOME_SCROLL_KEY, String(window.scrollY));
    navigate(`/produto/${productId}`);
  };

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

  return {
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
  };
}