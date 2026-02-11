import { useState, useEffect, type RefObject } from "react";
import { useTheme } from "../contexts/ThemeContext";
import {
  ProductSearchAndCategories,
  type CategoryOption,
} from "./ProductSearchAndCategories";

interface RevealOnScrollProductSearchBarProps {
  /** Ref do elemento que marca o início da seção de produtos (ex.: wrapper de RecommendedProducts). A barra aparece quando essa seção começa a tomar a tela. */
  anchorRef: RefObject<HTMLElement | null>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  categories: CategoryOption[];
  /** Conteúdo opcional acima da barra (ex.: botão voltar + título). Renderizado logo abaixo do topo quando a barra está visível. */
  topSlot?: React.ReactNode;
  /** Se true, a barra aparece quando o anchor SAI do viewport (ex.: quando "Você vai adorar" some no topo). Se false, aparece quando o anchor entra no viewport. */
  showWhenAnchorOutOfView?: boolean;
  /** IntersectionObserver rootMargin. */
  rootMargin?: string;
}

/**
 * Versão da barra de pesquisa + categorias que só aparece quando o usuário rola até a seção ancorada.
 * Use em páginas que exibem RecommendedProducts: passe um ref no wrapper da seção e esta barra ficará fixa no topo quando o usuário chegar lá.
 */
export function RevealOnScrollProductSearchBar({
  anchorRef,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  categoryId,
  onCategoryChange,
  categories,
  topSlot,
  showWhenAnchorOutOfView = false,
  rootMargin = "0px",
}: RevealOnScrollProductSearchBarProps) {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (showWhenAnchorOutOfView) {
          // Barra só aparece quando o anchor já passou do topo (ex.: "Você vai adorar" sumiu)
          setVisible(entry.boundingClientRect.top < 0);
        } else {
          setVisible(entry.isIntersecting);
        }
      },
      { rootMargin, threshold: 0 }
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchorRef, rootMargin, showWhenAnchorOutOfView]);

  return (
    <>
      <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99,
          width: "100%",
          backgroundColor: colors.card,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          borderBottom: `1px solid ${colors.border}`,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-12px)",
          pointerEvents: visible ? "auto" : "none",
          transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {topSlot}
          <div style={{ padding: "10px 15px" }}>
            <ProductSearchAndCategories
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onSearchSubmit={onSearchSubmit}
            categoryId={categoryId}
            onCategoryChange={onCategoryChange}
            categories={categories}
          />
          </div>
        </div>
      </div>
    </>
  );
}
