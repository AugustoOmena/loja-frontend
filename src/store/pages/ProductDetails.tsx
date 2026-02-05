import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ShoppingCart,
  Star,
  Loader2,
  Image as ImageIcon,
  Ruler,
} from "lucide-react";
import { getProductById } from "../../services/firebaseProductService";
import { useCart } from "../../contexts/CartContext";
import { useTheme } from "../../contexts/ThemeContext";
import { SizeGuideDrawer } from "../../components/SizeGuideDrawer";

const SIZE_GUIDE_MODA_PRAIA = [
  { tamanho: "P", num: "36-38", busto: "80-88", cintura: "60-69", quadril: "88-98" },
  { tamanho: "M", num: "40-42", busto: "89-96", cintura: "70-79", quadril: "99-109" },
  { tamanho: "G", num: "44-46", busto: "97-105", cintura: "80-89", quadril: "110-120" },
  { tamanho: "GG", num: "48-50", busto: "106-114", cintura: "90-99", quadril: "121-131" },
];

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors, theme } = useTheme();

  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isSizeGuideHovered, setIsSizeGuideHovered] = useState(false);

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("ID inválido");
      const result = await getProductById(Number(id));
      if (!result) throw new Error("Produto não encontrado");
      return result;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  // Verifica se o produto tem estoque por tamanho (usando useMemo para estabilizar)
  const hasStockBySize = useMemo(() => {
    return product?.stock && Object.keys(product.stock).length > 0;
  }, [product?.stock]);

  // Obtém tamanhos disponíveis (com estoque > 0) - usando useMemo
  const availableSizes = useMemo(() => {
    if (!hasStockBySize || !product?.stock) return [];
    return Object.entries(product.stock)
      .filter(([_, qty]) => qty > 0)
      .map(([size]) => size);
  }, [hasStockBySize, product?.stock]);

  // Verifica se há estoque disponível
  const hasAvailableStock = useMemo(() => {
    return hasStockBySize
      ? availableSizes.length > 0
      : (product?.quantity || 0) > 0;
  }, [hasStockBySize, availableSizes.length, product?.quantity]);

  // Pré-seleciona o primeiro tamanho disponível por padrão
  useEffect(() => {
    if (!product || !hasStockBySize || availableSizes.length === 0) return;
    const currentValid = selectedSize && availableSizes.includes(selectedSize);
    if (!currentValid) setSelectedSize(availableSizes[0]);
  }, [product, hasStockBySize, availableSizes, selectedSize]);

  // Log do produto para debug
  useEffect(() => {
    if (product) {
      console.log("📦 Produto carregado:", {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        stock: product.stock,
        size: product.size,
        category: product.category,
        images: product.images,
        description: product.description,
        hasStockBySize,
        availableSizes,
        selectedSize,
      });
    }
  }, [product, hasStockBySize, availableSizes, selectedSize]);

  const styles = {
    // --- NOVO: WRAPPER EXTERNO (Cobre a tela toda com a cor do tema) ---
    wrapper: {
      minHeight: "100vh",
      backgroundColor: colors.bg, // A cor de fundo vai aqui agora!
      width: "100%",
      display: "flex",
      justifyContent: "center", // Centraliza o container filho
    },
    // --- CONTAINER INTERNO (Limita a largura do conteúdo) ---
    container: {
      width: "100%",
      maxWidth: "1000px",
      padding: "20px",
      fontFamily: "sans-serif",
    },

    backButton: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      border: "none",
      background: "none",
      cursor: "pointer",
      marginBottom: "20px",
      color: colors.muted,
      fontSize: "14px",
    },
    // Ajuste no loader para usar o wrapper
    loaderWrapper: {
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },
    errorWrapper: {
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center", // Centraliza erro no meio da tela
      backgroundColor: colors.bg,
      color: colors.text,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "40px",
    },
    mainImageContainer: {
      aspectRatio: "1/1",
      backgroundColor: colors.card,
      borderRadius: "10px",
      overflow: "hidden",
      marginBottom: "15px",
      border: `1px solid ${colors.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    thumbnailScroll: {
      display: "flex",
      gap: "10px",
      overflowX: "auto" as const,
      paddingBottom: "5px",
    },
    thumbnail: (isActive: boolean) => ({
      width: "70px",
      height: "70px",
      objectFit: "cover" as const,
      borderRadius: "8px",
      cursor: "pointer",
      border: isActive ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
      backgroundColor: colors.card,
      opacity: isActive ? 1 : 0.7,
    }),
    title: {
      fontSize: "26px",
      color: colors.text,
      marginBottom: "10px",
      lineHeight: "1.3",
      fontWeight: "bold",
    },
    rating: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      margin: "10px 0",
      color: colors.accent,
      fontSize: "14px",
    },
    price: {
      fontSize: "32px",
      fontWeight: "bold",
      color: theme === "dark" ? colors.accent : colors.text,
      margin: "20px 0",
    },
    installments: {
      fontSize: "12px",
      color: colors.muted,
      fontWeight: "normal",
      marginTop: "5px",
    },
    description: {
      marginBottom: "20px",
      lineHeight: "1.6",
      color: colors.text,
      fontSize: "15px",
      opacity: 0.9,
    },
    label: {
      fontWeight: "600",
      display: "block",
      marginBottom: "10px",
      color: colors.text,
    },
    sizeButton: (isActive: boolean, isDisabled: boolean) => {
      const isLight = theme === "light";
      const borderColor = isLight ? "#1a1a1a" : colors.border;
      return {
        position: "relative" as const,
        overflow: "hidden",
        padding: "10px 20px",
        border: `1px solid ${borderColor}`,
        backgroundColor: isActive && !isLight
          ? "rgba(244, 214, 54, 0.2)"
          : isDisabled
            ? theme === "dark"
              ? colors.card
              : "#f0efe9"
            : colors.card,
        borderRadius: "6px",
        fontWeight: isActive ? "bold" : "normal",
        color: isDisabled ? colors.muted : isLight ? colors.text : isActive ? colors.accent : colors.text,
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "0.2s",
        opacity: isDisabled ? 0.5 : 1,
      };
    },
    sizeButtonLine: (active: boolean) => ({
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      height: "2px",
      width: active ? "100%" : "0%",
      backgroundColor: theme === "dark" ? colors.accent : "#1a1a1a",
      transition: "width 0.2s ease-out",
    }),
    addToCartBtn: {
      width: "100%",
      backgroundColor: colors.accent,
      color: colors.accentText,
      border: "none",
      padding: "16px",
      borderRadius: "30px",
      fontSize: "16px",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      cursor: "pointer",
      boxShadow: theme === "dark" ? "0 4px 15px rgba(244, 214, 54, 0.25)" : "0 4px 15px rgba(244, 214, 54, 0.3)",
      transition: "transform 0.1s",
    },
    disabledBtn: {
      width: "100%",
      backgroundColor: theme === "dark" ? colors.card : "#e5e5e5",
      color: colors.muted,
      border: "none",
      padding: "16px",
      borderRadius: "30px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "not-allowed",
    },
    sizeGuideBtn: {
      position: "relative" as const,
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 18px",
      marginTop: "12px",
      border: `1px solid ${colors.border}`,
      borderRadius: "12px",
      backgroundColor: colors.card,
      color: colors.text,
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      overflow: "hidden",
    },
    sizeGuideBtnLine: (hovered: boolean) => ({
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      height: "2px",
      width: hovered ? "100%" : "0%",
      backgroundColor: colors.accent,
      transition: "width 0.25s ease-out",
    }),
  };

  if (isLoading)
    return (
      <div style={styles.loaderWrapper}>
        <Loader2 className="animate-spin" size={40} color={colors.accent} />
      </div>
    );

  if (isError || !product)
    return (
      <div style={styles.errorWrapper}>
        <h2>Produto não encontrado</h2>
        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            cursor: "pointer",
            backgroundColor: colors.card,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: "6px",
          }}
        >
          Voltar para Loja
        </button>
      </div>
    );

  const mainImage =
    selectedImage ||
    (product?.images && product.images.length > 0 ? product.images[0] : null);

  // Obtém quantidade disponível para o tamanho selecionado ou quantidade geral
  const getAvailableQuantity = (): number => {
    if (!product) return 0;
    if (hasStockBySize && selectedSize && product.stock) {
      return product.stock[selectedSize] || 0;
    }
    return product.quantity || 0;
  };

  // Verifica se precisa selecionar tamanho antes de adicionar
  // Precisa selecionar se:
  // - Tem stock por tamanho E
  // - Não é o caso especial de só ter "Único" (que já é pré-selecionado) E
  // - Ainda não selecionou um tamanho
  const needsSizeSelection =
    hasStockBySize &&
    !(availableSizes.length === 1 && availableSizes[0] === "Único") &&
    !selectedSize;

  // Obtém a quantidade máxima disponível para o tamanho selecionado
  const getMaxQuantityForSize = (): number | undefined => {
    if (!product) return undefined;

    if (hasStockBySize && product.stock) {
      const sizeKey = selectedSize || product.size || "Único";
      return product.stock[sizeKey] || 0;
    }

    return product.quantity || 0;
  };

  const handleAddToCart = () => {
    if (!product || !hasAvailableStock) return;

    // Se precisa selecionar tamanho e não selecionou, não adiciona
    if (needsSizeSelection && !selectedSize) {
      return;
    }

    const sizeToAdd = selectedSize || product.size || "Único";
    const maxQuantity = getMaxQuantityForSize();

    // Valida se há estoque disponível antes de adicionar
    if (maxQuantity !== undefined && maxQuantity <= 0) {
      return; // Não adiciona se não há estoque
    }

    addToCart(product, sizeToAdd, maxQuantity);
  };

  return (
    // WRAPPER EXTERNO (Cor de fundo total)
    <div style={styles.wrapper}>
      {/* CONTAINER INTERNO (Conteúdo centralizado) */}
      <div style={styles.container}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ChevronLeft size={20} /> Voltar
        </button>

        <div style={styles.grid}>
          {/* --- COLUNA 1: GALERIA --- */}
          <div>
            <div style={styles.mainImageContainer}>
              {mainImage ? (
                <img
                  src={mainImage}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  alt={product.name}
                />
              ) : (
                <ImageIcon size={60} color={colors.muted} />
              )}
            </div>

            {product.images && product.images.length > 0 && (
              <div style={styles.thumbnailScroll}>
                {product.images.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img}
                    onClick={() => setSelectedImage(img)}
                    style={styles.thumbnail(mainImage === img)}
                    alt={`Thumbnail ${i}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* --- COLUNA 2: INFO --- */}
          <div>
            <h1 style={styles.title}>{product.name}</h1>

            <div style={styles.rating}>
              <Star fill={colors.accent} color={colors.accent} size={16} />{" "}
              <span>4.8 (120 avaliações)</span>
            </div>

            <div style={styles.price}>
              R$ {product.price.toFixed(2)}
              <div style={styles.installments}>
                Em até 3x de R$ {(product.price / 3).toFixed(2)} sem juros
              </div>
            </div>

            <div style={styles.description}>
              {product.description || "Sem descrição detalhada."}
            </div>

            {/* SELEÇÃO DE TAMANHO */}
            {hasStockBySize ? (
              <div style={{ margin: "25px 0" }}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {Object.keys(product.stock || {}).map((size) => {
                    const isActive = selectedSize === size;
                    const qty = product.stock?.[size] || 0;
                    const isDisabled = qty === 0;
                    return (
                      <button
                        key={size}
                        onClick={() => !isDisabled && setSelectedSize(size)}
                        disabled={isDisabled}
                        style={styles.sizeButton(isActive, isDisabled)}
                        title={
                          isDisabled ? "Indisponível" : `${qty} em estoque`
                        }
                      >
                        <span style={styles.sizeButtonLine(isActive)} />
                        {size}
                        {!isDisabled && (
                          <span
                            style={{
                              fontSize: "10px",
                              marginLeft: "4px",
                              opacity: 0.7,
                            }}
                          >
                            ({qty})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedSize && (
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "13px",
                      color: colors.muted,
                    }}
                  >
                    {getAvailableQuantity()} unidades disponíveis
                  </div>
                )}
              </div>
            ) : (
              <div style={{ margin: "25px 0" }}>
                <div
                  style={{
                    fontSize: "14px",
                    color: colors.text,
                    marginBottom: "10px",
                  }}
                >
                  <span style={styles.label}>Estoque:</span>{" "}
                  <span style={{ fontWeight: "bold", color: theme === "dark" ? colors.accent : colors.text }}>
                    {product.quantity || 0} unidades disponíveis
                  </span>
                </div>
              </div>
            )}

            {/* TABELA DE MEDIDAS */}
            <button
              type="button"
              onClick={() => setIsSizeGuideOpen(true)}
              style={styles.sizeGuideBtn}
              onMouseEnter={() => setIsSizeGuideHovered(true)}
              onMouseLeave={() => setIsSizeGuideHovered(false)}
            >
              <span style={styles.sizeGuideBtnLine(isSizeGuideHovered)} />
              <Ruler size={18} strokeWidth={2} />
              Tabela de medidas
            </button>

            {/* BOTÃO DE AÇÃO */}
            <div style={{ marginTop: "30px" }}>
              {hasAvailableStock && !needsSizeSelection ? (
                <button
                  onClick={handleAddToCart}
                  style={styles.addToCartBtn}
                  onMouseDown={(e) =>
                    (e.currentTarget.style.transform = "scale(0.98)")
                  }
                  onMouseUp={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <ShoppingCart size={20} /> Adicionar ao Carrinho
                </button>
              ) : (
                <button disabled style={styles.disabledBtn}>
                  Produto Indisponível
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <SizeGuideDrawer
        open={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        rows={SIZE_GUIDE_MODA_PRAIA}
      />
    </div>
  );
};
