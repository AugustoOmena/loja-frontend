import { Search } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export interface CategoryOption {
  id: string;
  label: string;
}

/** Barra de pesquisa (input + ícone). Usado sozinho em StoreHome ou dentro de ProductSearchAndCategories. */
export function ProductSearchBar({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  style = {},
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  style?: React.CSSProperties;
}) {
  const { colors, theme } = useTheme();
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: theme === "dark" ? "#262626" : "#f5f5f5",
        borderRadius: "20px",
        display: "flex",
        alignItems: "center",
        padding: "8px 15px",
        gap: "10px",
        border: `1px solid ${colors.border}`,
        minWidth: 0,
        ...style,
      }}
    >
      <input
        type="search"
        placeholder="O que você procura?"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
        style={{
          border: "none",
          background: "transparent",
          width: "100%",
          outline: "none",
          fontSize: "14px",
          color: colors.text,
        }}
        aria-label="Buscar produtos"
      />
      <button
        type="button"
        onClick={onSearchSubmit}
        style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
        aria-label="Pesquisar"
      >
        <Search size={18} color={colors.muted} />
      </button>
    </div>
  );
}

/** Pills de categoria. Usado sozinho em StoreHome ou dentro de ProductSearchAndCategories. */
export function ProductCategoryPills({
  categoryId,
  onCategoryChange,
  categories,
  style = {},
}: {
  categoryId: string;
  onCategoryChange: (id: string) => void;
  categories: CategoryOption[];
  style?: React.CSSProperties;
}) {
  const { colors, theme } = useTheme();
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        overflowX: "auto",
        paddingBottom: "15px",
        paddingTop: "5px",
        whiteSpace: "nowrap",
        scrollbarWidth: "none",
        ...style,
      }}
      className="hide-scroll"
    >
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onCategoryChange(cat.id)}
          style={{
            border: `1px solid ${categoryId === cat.id ? "transparent" : colors.border}`,
            padding: "8px 16px",
            borderRadius: "20px",
            backgroundColor:
              categoryId === cat.id
                ? colors.accent
                : theme === "dark"
                  ? colors.card
                  : "#f5f5f5",
            color: categoryId === cat.id ? colors.accentText : colors.text,
            fontSize: "13px",
            fontWeight: categoryId === cat.id ? "bold" : "normal",
            cursor: "pointer",
            transition: "0.2s",
            flexShrink: 0,
          }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

interface ProductSearchAndCategoriesProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  categories: CategoryOption[];
}

/**
 * Barra de pesquisa + pills de categoria em coluna. Reutilizável acima de RecommendedProducts
 * ou em RevealOnScrollProductSearchBar. Para StoreHome use ProductSearchBar + ProductCategoryPills separados.
 */
export function ProductSearchAndCategories({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  categoryId,
  onCategoryChange,
  categories,
}: ProductSearchAndCategoriesProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
      <ProductSearchBar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
      />
      <ProductCategoryPills
        categoryId={categoryId}
        onCategoryChange={onCategoryChange}
        categories={categories}
      />
    </div>
  );
}
