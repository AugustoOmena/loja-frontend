import type { Product } from "../types";

/** Produto legado pode ter stock no nível raiz (backend antigo). */
type ProductWithLegacy = Product & { stock?: Record<string, number> };

/**
 * Quantidade total do produto: vinda do backend ou soma das variantes (ou legado stock).
 */
export function getProductQuantity(product: Product | undefined | null): number {
  if (!product) return 0;
  if ((product as ProductWithLegacy).quantity != null) return (product as ProductWithLegacy).quantity as number;
  if (product.variants?.length)
    return product.variants.reduce(
      (s, v) => s + (v.stock_quantity ?? (v as { stock?: number }).stock ?? 0),
      0
    );
  const legacy = (product as ProductWithLegacy).stock;
  if (legacy && typeof legacy === "object")
    return Object.values(legacy).reduce((a, b) => a + (Number(b) || 0), 0);
  return 0;
}

/**
 * Estoque por tamanho: mapa size -> quantidade disponível.
 * Derivado de variants ou legado product.stock.
 */
export function getStockBySize(
  product: Product | undefined | null
): Record<string, number> {
  if (!product) return {};
  if (product.variants?.length) {
    const map: Record<string, number> = {};
    for (const v of product.variants) {
      const size = v.size || "Único";
      const qty = v.stock_quantity ?? (v as { stock?: number }).stock ?? 0;
      map[size] = (map[size] || 0) + qty;
    }
    return map;
  }
  const legacy = (product as ProductWithLegacy).stock;
  if (legacy && typeof legacy === "object") return { ...legacy };
  return {};
}

/**
 * Indica se o produto tem estoque discriminado por tamanho (via variants ou legado stock).
 */
export function hasStockBySize(product: Product | undefined | null): boolean {
  if (product?.variants?.length) return true;
  const legacy = product && (product as ProductWithLegacy).stock;
  return !!(legacy && typeof legacy === "object" && Object.keys(legacy).length > 0);
}

/** Chave única para variante (cor + tamanho). */
export function variantKey(color: string, size: string): string {
  return `${color}|${size}`;
}

/**
 * Estoque por variante: chave "color|size" -> quantidade.
 * Útil para detalhe do produto (seleção cor + tamanho) e carrinho.
 */
export function getStockByColorAndSize(
  product: Product | undefined | null
): Record<string, number> {
  if (!product?.variants?.length) return {};
  const map: Record<string, number> = {};
  for (const v of product.variants) {
    const color = v.color?.trim() || "Único";
    const size = v.size?.trim() || "Único";
    const qty = v.stock_quantity ?? (v as { stock?: number }).stock ?? 0;
    const key = variantKey(color, size);
    map[key] = (map[key] ?? 0) + qty;
  }
  return map;
}

/** Cores distintas com estoque > 0. */
export function getAvailableColors(product: Product | undefined | null): string[] {
  if (!product?.variants?.length) return [];
  const set = new Set<string>();
  for (const v of product.variants) {
    const qty = v.stock_quantity ?? (v as { stock?: number }).stock ?? 0;
    if (qty > 0 && v.color?.trim()) set.add(v.color.trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Tamanhos disponíveis para uma cor (com estoque > 0). */
export function getSizesForColor(
  product: Product | undefined | null,
  color: string
): string[] {
  if (!product?.variants?.length) return [];
  const order = ["PP", "P", "M", "G", "GG", "XG", "XXG", "Único"];
  const sizes: string[] = [];
  for (const v of product.variants) {
    const c = v.color?.trim() || "Único";
    if (c !== color) continue;
    const qty = v.stock_quantity ?? (v as { stock?: number }).stock ?? 0;
    if (qty > 0 && v.size?.trim()) sizes.push(v.size.trim());
  }
  const uniq = Array.from(new Set(sizes));
  return uniq.sort((a, b) => {
    const ia = order.indexOf(a.toUpperCase());
    const ib = order.indexOf(b.toUpperCase());
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}

/** Estoque para uma variante específica (cor + tamanho). */
export function getVariantStock(
  product: Product | undefined | null,
  color: string,
  size: string
): number {
  if (!product?.variants?.length) return 0;
  const key = variantKey(color.trim() || "Único", size.trim() || "Único");
  return getStockByColorAndSize(product)[key] ?? 0;
}

/** Cor de fundo da bolinha no card (nome em português → hex). Usado em StoreHome e RecommendedProducts. */
export function getColorDotFill(colorName: string): string {
  const c = colorName.toLowerCase().trim();
  const map: Record<string, string> = {
    azul: "#2563EB",
    "azul marinho": "#1E3A8A",
    "azul médio": "#60A5FA",
    bege: "#D4C4A8",
    cereja: "#9F1239",
    coral: "#FF7F50",
    laranja: "#F97316",
    manteiga: "#FEF3C7",
    "off-white": "#F8FAFC",
    preto: "#000000",
    "rosa escuro": "#BE185D",
    verde: "#22C55E",
    "verde militar": "#4D5906",
  };
  for (const [key, hex] of Object.entries(map)) {
    if (c.includes(key)) return hex;
  }
  return "#b0a090";
}
