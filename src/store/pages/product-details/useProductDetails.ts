import { useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productService } from "../../../services/productService";
import { getProductById } from "../../../services/firebaseProductService";
import { useCart } from "../../../contexts/CartContext";
import type { Product, ProductVariant } from "../../../types";
import {
  getProductQuantity,
  getStockBySize,
  hasStockBySize as hasStockBySizeHelper,
  getAvailableColors,
  getSizesForColor,
  getVariantStock,
} from "../../../utils/productHelpers";

export const SIZE_GUIDE_MODA_PRAIA = [
  { tamanho: "P", num: "36-38", busto: "80-88", cintura: "60-69", quadril: "88-98" },
  { tamanho: "M", num: "40-42", busto: "89-96", cintura: "70-79", quadril: "99-109" },
  { tamanho: "G", num: "44-46", busto: "97-105", cintura: "80-89", quadril: "110-120" },
  { tamanho: "GG", num: "48-50", busto: "106-114", cintura: "90-99", quadril: "121-131" },
];

const EMPTY_IMAGES: string[] = [];

type RawProductPayload = Partial<Product> & {
  image?: string;
  images?: unknown;
  variants?: unknown;
};

// Normalização que consolida tanto 'image' (singular) quanto 'images' (array)
function normalizeProduct(raw?: RawProductPayload | null): Product | null {
  if (!raw) return null;

  // 1. Extração garantida das imagens gerais do produto
  let generalImages: string[] = [];
  if (Array.isArray(raw.images)) {
    generalImages = (raw.images as string[]).filter(Boolean);
  } else if (raw.images && typeof raw.images === "object") {
    generalImages = Object.values(raw.images as Record<string, string>).filter(Boolean);
  }

  // Se images[] veio vazio mas image existe, garante a URL da capa
  if (typeof raw.image === "string" && raw.image) {
    if (!generalImages.includes(raw.image)) {
      generalImages.unshift(raw.image);
    }
  }

  // 2. Normalização das variantes
  let rawVariants: unknown[] = [];
  if (Array.isArray(raw.variants)) {
    rawVariants = raw.variants;
  } else if (raw.variants && typeof raw.variants === "object") {
    rawVariants = Object.values(raw.variants as Record<string, unknown>);
  }

  const variants: ProductVariant[] = rawVariants.map((item) => {
    const v = item as Record<string, unknown>;

    let variantImages: string[] = [];
    if (Array.isArray(v.images)) {
      variantImages = (v.images as string[]).filter(Boolean);
    } else if (v.images && typeof v.images === "object") {
      variantImages = Object.values(v.images as Record<string, string>).filter(Boolean);
    }

    const singleImage = typeof v.image === "string" && v.image ? v.image : undefined;
    if (singleImage && !variantImages.includes(singleImage)) {
      variantImages.unshift(singleImage);
    }

    const qty = Number(v.stock_quantity ?? v.stock ?? 0);

    return {
      color: String(v.color || "").trim(),
      size: String(v.size || "").trim(),
      stock_quantity: qty,
      sku: typeof v.sku === "string" ? v.sku : undefined,
      image: variantImages[0] || singleImage,
      images: variantImages,
    };
  });

  return {
    ...(raw as Product),
    name: raw.name ?? "",
    price: Number(raw.price ?? 0),
    size: raw.size ?? null,
    category: raw.category ?? "",
    images: generalImages,
    variants,
  };
}

export interface UseProductDetailsProps {
  previewProduct?: Product;
}

export function useProductDetails({ previewProduct }: UseProductDetailsProps = {}) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [userSelectedImage, setUserSelectedImage] = useState<string | null>(null);
  const [userSelectedColor, setUserSelectedColor] = useState<string | null>(null);
  const [userSelectedSize, setUserSelectedSize] = useState<string | null>(null);

  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isSizeGuideHovered, setIsSizeGuideHovered] = useState(false);
  const [descAccordionOpen, setDescAccordionOpen] = useState(false);
  const [materialAccordionOpen, setMaterialAccordionOpen] = useState(false);
  const [estampaAccordionOpen, setEstampaAccordionOpen] = useState(false);

  // Busca do produto: chama a API REST prioritariamente, com fallback no Firebase
  const {
    data: fetchedProduct,
    isLoading: isQueryLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("ID inválido");
      const numericId = Number(id);

      try {
        const apiProduct = await productService.getById(numericId);
        if (apiProduct && apiProduct.id) {
          return apiProduct;
        }
      } catch (err) {
        console.warn("Falha na API REST, consultando Firebase como fallback:", err);
      }

      const fbProduct = await getProductById(numericId);
      if (!fbProduct) throw new Error("Produto não encontrado");
      return fbProduct;
    },
    enabled: !previewProduct && !!id,
    staleTime: 1000 * 60 * 5,
  });

  const product = useMemo(() => {
    return normalizeProduct(previewProduct || fetchedProduct);
  }, [previewProduct, fetchedProduct]);

  const isLoading = !previewProduct && isQueryLoading;

  const stockBySize = useMemo(() => getStockBySize(product), [product]);
  const hasStockBySize = useMemo(() => hasStockBySizeHelper(product), [product]);

  // Lista de cores disponíveis com fallback de segurança (nunca perde a cor cadastrada)
  const availableColors = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return [];
    
    // Coleta todas as cores cadastradas nas variantes
    const distinctColors = Array.from(
      new Set(
        product.variants
          .map((v) => (v.color ? v.color.trim() : ""))
          .filter(Boolean)
      )
    );
    if (distinctColors.length === 0) return [];

    // Tenta cores com estoque > 0; se nenhuma tiver estoque, usa todas as cadastradas
    const withStock = getAvailableColors(product);
    return withStock.length > 0 ? withStock : distinctColors;
  }, [product]);

  const hasColors = availableColors.length > 0;
  const colorFromUrl = searchParams.get("cor") || searchParams.get("color");

  // Cor ativa calculada
  const selectedColor = useMemo(() => {
    if (!hasColors || availableColors.length === 0) return null;

    if (userSelectedColor && availableColors.includes(userSelectedColor)) {
      return userSelectedColor;
    }
    if (colorFromUrl) {
      const match = availableColors.find(
        (c) => c.trim().toLowerCase() === colorFromUrl.trim().toLowerCase()
      );
      if (match) return match;
    }
    return availableColors[0] ?? null;
  }, [hasColors, availableColors, userSelectedColor, colorFromUrl]);

  // Tamanhos disponíveis
  const availableSizes = useMemo(() => {
    if (!product) return [];
    if (hasColors && selectedColor) {
      const sizes = getSizesForColor(product, selectedColor);
      if (sizes.length > 0) return sizes;
    }
    if (!hasStockBySize) {
      return product.variants
        ?.filter((v) => !selectedColor || v.color?.toLowerCase() === selectedColor.toLowerCase())
        .map((v) => v.size)
        .filter(Boolean) || [];
    }
    return Object.entries(stockBySize)
      .filter(([, qty]) => qty > 0)
      .map(([size]) => size);
  }, [product, hasColors, selectedColor, hasStockBySize, stockBySize]);

  const selectedSize = useMemo(() => {
    if (availableSizes.length === 0) return null;
    if (userSelectedSize && availableSizes.includes(userSelectedSize)) {
      return userSelectedSize;
    }
    return availableSizes[0] ?? null;
  }, [availableSizes, userSelectedSize]);

  // Galeria filtrada: Fotos da cor selecionada + Fotos da galeria geral
  const images = useMemo(() => {
    if (!product) return EMPTY_IMAGES;

    const colorImages: string[] = [];

    if (selectedColor && product.variants && product.variants.length > 0) {
      product.variants.forEach((v) => {
        const matches =
          v.color && v.color.trim().toLowerCase() === selectedColor.trim().toLowerCase();

        if (matches) {
          const vImgs = v.images && v.images.length > 0
            ? v.images
            : (v.image ? [v.image] : []);

          vImgs.forEach((img) => {
            if (img && !colorImages.includes(img)) colorImages.push(img);
          });
        }
      });
    }

    const generalImages = product.images || [];
    const combined = [...colorImages];
    generalImages.forEach((img) => {
      if (img && !combined.includes(img)) {
        combined.push(img);
      }
    });

    return combined.length > 0 ? combined : EMPTY_IMAGES;
  }, [product, selectedColor]);

  // Foto em destaque
  const mainImage = useMemo(() => {
    if (userSelectedImage && images.includes(userSelectedImage)) {
      return userSelectedImage;
    }
    return images.length > 0 ? images[0] : null;
  }, [images, userSelectedImage]);

  const totalQty = useMemo(() => getProductQuantity(product), [product]);
  const hasAvailableStock = useMemo(() => {
    return hasStockBySize ? availableSizes.length > 0 : totalQty > 0;
  }, [hasStockBySize, availableSizes.length, totalQty]);

  const currentIndex = mainImage ? Math.max(0, images.indexOf(mainImage)) : 0;
  const hasMultipleImages = images.length > 1;

  const goPrev = () => {
    if (!hasMultipleImages) return;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setUserSelectedImage(images[prevIndex]);
  };

  const goNext = () => {
    if (!hasMultipleImages) return;
    const nextIndex = (currentIndex + 1) % images.length;
    setUserSelectedImage(images[nextIndex]);
  };

  const getAvailableQuantity = (): number => {
    if (!product) return 0;
    if (hasColors && selectedColor && selectedSize) {
      return getVariantStock(product, selectedColor, selectedSize);
    }
    if (hasStockBySize && selectedSize) {
      return stockBySize[selectedSize] ?? 0;
    }
    return totalQty;
  };

  const needsSizeSelection =
    (hasStockBySize || hasColors) &&
    !(availableSizes.length === 1 && availableSizes[0] === "Único") &&
    !selectedSize;

  const needsColorSelection = hasColors && !selectedColor;

  const getMaxQuantityForSize = (): number | undefined => {
    if (!product) return undefined;
    if (hasColors && selectedColor && selectedSize) {
      return getVariantStock(product, selectedColor, selectedSize);
    }
    if (hasStockBySize) {
      const sizeKey = selectedSize || product.size || "Único";
      return stockBySize[sizeKey] ?? 0;
    }
    return totalQty;
  };

  const handleAddToCart = () => {
    if (previewProduct) {
      alert("Ação desabilitada no modo de pré-visualização.");
      return;
    }
    if (!product || !hasAvailableStock) return;
    if (needsSizeSelection && !selectedSize) return;
    if (needsColorSelection && !selectedColor) return;

    const sizeToAdd = selectedSize || product.size || "Único";
    const colorToAdd = selectedColor ?? null;
    const maxQuantity = getMaxQuantityForSize();

    if (maxQuantity !== undefined && maxQuantity <= 0) return;

    addToCart(product, sizeToAdd, maxQuantity, colorToAdd);
  };

  const handleSelectColor = (color: string) => {
    setUserSelectedColor(color);
    setUserSelectedSize(null);
    setUserSelectedImage(null);
  };

  const handleSelectSize = (size: string) => {
    setUserSelectedSize(size);
  };

  return {
    id,
    navigate,
    product,
    isLoading,
    isError,
    images,
    mainImage,
    hasMultipleImages,
    goPrev,
    goNext,
    setUserSelectedImage,
    hasColors,
    availableColors,
    selectedColor,
    handleSelectColor,
    hasStockBySize,
    stockBySize,
    availableSizes,
    selectedSize,
    handleSelectSize,
    getAvailableQuantity,
    hasAvailableStock,
    needsSizeSelection,
    needsColorSelection,
    handleAddToCart,
    isSizeGuideOpen,
    setIsSizeGuideOpen,
    isSizeGuideHovered,
    setIsSizeGuideHovered,
    descAccordionOpen,
    setDescAccordionOpen,
    materialAccordionOpen,
    setMaterialAccordionOpen,
    estampaAccordionOpen,
    setEstampaAccordionOpen,
  };
}