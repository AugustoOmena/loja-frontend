import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShoppingCart,
  Star,
  Loader2,
  Image as ImageIcon,
  Ruler,
  Eye,
  X,
} from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import { SizeGuideDrawer } from "../../../components/SizeGuideDrawer";
import type { Product } from "../../../types";
import { useProductDetails, SIZE_GUIDE_MODA_PRAIA } from "./useProductDetails";
import { createProductDetailsStyles } from "./ProductDetails.styles";

export interface ProductDetailsProps {
  previewProduct?: Product;
  onClosePreview?: () => void;
}

export const ProductDetails = ({
  previewProduct,
  onClosePreview,
}: ProductDetailsProps = {}) => {
  const { colors, theme } = useTheme();
  const styles = createProductDetailsStyles(colors, theme);

  const {
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
  } = useProductDetails({ previewProduct });

  if (isLoading) {
    return (
      <div style={styles.loaderWrapper}>
        <Loader2
          className="animate-spin"
          size={40}
          color={colors.accent || "#f4d636"}
        />
      </div>
    );
  }

  if (!product && (isError || !id)) {
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
  }

  return (
    <div style={styles.wrapper}>
      {/* Banner de Rascunho / Pré-visualização */}
      {previewProduct && (
        <div style={styles.previewBanner}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Eye size={18} />
            <span>
              MODO DE PRÉ-VISUALIZAÇÃO (Como o cliente verá seu produto)
            </span>
          </div>
          {onClosePreview && (
            <button
              onClick={onClosePreview}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: "600",
              }}
            >
              <X size={16} /> Voltar à Edição
            </button>
          )}
        </div>
      )}

      <div style={styles.container}>
        <button
          onClick={() => (onClosePreview ? onClosePreview() : navigate(-1))}
          style={styles.backButton}
        >
          <ChevronLeft size={20} />{" "}
          {onClosePreview ? "Fechar Prévia" : "Voltar"}
        </button>

        <div style={styles.grid}>
          {/* --- COLUNA 1: GALERIA --- */}
          <div>
            <div style={{ position: "relative" }}>
              <div style={styles.mainImageContainer}>
                {mainImage ? (
                  <img
                    src={mainImage}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    alt={product?.name || "Produto"}
                  />
                ) : (
                  <ImageIcon size={60} color={colors.muted} />
                )}
              </div>

              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Imagem anterior"
                    style={{
                      position: "absolute",
                      left: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "none",
                      backgroundColor:
                        theme === "dark"
                          ? "rgba(0,0,0,0.5)"
                          : "rgba(255,255,255,0.9)",
                      color: theme === "dark" ? "#fafafa" : colors.text,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Próxima imagem"
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "none",
                      backgroundColor:
                        theme === "dark"
                          ? "rgba(0,0,0,0.5)"
                          : "rgba(255,255,255,0.9)",
                      color: theme === "dark" ? "#fafafa" : colors.text,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {images.length > 0 && (
              <div style={styles.thumbnailScroll}>
                {images.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img}
                    onClick={() => setUserSelectedImage(img)}
                    style={styles.thumbnail(mainImage === img)}
                    alt={`Thumbnail ${i}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* --- COLUNA 2: INFORMAÇÕES DO PRODUTO --- */}
          <div>
            <h1 style={styles.title}>
              {product?.name || "Sem nome informado"}
            </h1>

            <div style={styles.rating}>
              <Star
                fill={colors.accent || "#f4d636"}
                color={colors.accent || "#f4d636"}
                size={16}
              />{" "}
              <span>4.8 (120 avaliações)</span>
            </div>

            <div style={styles.price}>
              R$ {(product?.price || 0).toFixed(2)}
              <div style={styles.installments}>
                Em até 3x de R$ {((product?.price || 0) / 3).toFixed(2)} sem
                juros
              </div>
            </div>

            {/* Seleção de Cor */}
            {hasColors && (
              <div style={{ margin: "25px 0" }}>
                <span style={styles.label}>Cor</span>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {availableColors.map((color) => {
                    const isActive = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleSelectColor(color)}
                        style={styles.sizeButton(isActive, false)}
                      >
                        <span style={styles.sizeButtonLine(isActive)} />
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seleção de Tamanho */}
            {(hasStockBySize || hasColors) && (
              <div style={{ margin: "25px 0" }}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {(hasColors ? availableSizes : Object.keys(stockBySize)).map(
                    (size) => {
                      const isActive = selectedSize === size;
                      const qty = stockBySize[size] ?? 0;
                      const isDisabled = qty === 0;
                      return (
                        <button
                          key={size}
                          onClick={() => !isDisabled && handleSelectSize(size)}
                          disabled={isDisabled}
                          style={styles.sizeButton(isActive, isDisabled)}
                        >
                          <span style={styles.sizeButtonLine(isActive)} />
                          {size}
                          {!isDisabled && qty <= 3 && (
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
                    },
                  )}
                </div>

                {(selectedSize || (hasColors && selectedColor)) &&
                  (() => {
                    const qty = getAvailableQuantity();
                    if (qty > 3) return null;
                    return (
                      <div
                        style={{
                          marginTop: "10px",
                          fontSize: "13px",
                          color:
                            theme === "dark"
                              ? colors.accent || "#f4d636"
                              : "#b45309",
                          fontWeight: "600",
                        }}
                      >
                        Últimas {qty} peças! Não vai ficar de bobeira, hein?
                      </div>
                    );
                  })()}
              </div>
            )}

            {/* Tabela de Medidas */}
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

            {/* Botão de Compra */}
            <div style={{ marginTop: "30px" }}>
              {hasAvailableStock &&
              !needsSizeSelection &&
              !needsColorSelection ? (
                <button onClick={handleAddToCart} style={styles.addToCartBtn}>
                  <ShoppingCart size={20} /> Adicionar ao Carrinho
                </button>
              ) : (
                <button disabled style={styles.disabledBtn}>
                  Produto Indisponível
                </button>
              )}
            </div>

            {/* Acordeão: Descrição */}
            {product?.description && product.description.trim() !== "" && (
              <div style={styles.accordionContainer}>
                <button
                  type="button"
                  onClick={() => setDescAccordionOpen((o) => !o)}
                  style={styles.accordionHeader}
                >
                  Descrição
                  <ChevronDown
                    size={20}
                    color={colors.muted}
                    style={{
                      transform: descAccordionOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>
                {descAccordionOpen && (
                  <div style={styles.accordionContent}>
                    {product.description}
                  </div>
                )}
              </div>
            )}

            {/* Acordeão: Material */}
            {product?.material && product.material.trim() !== "" && (
              <div style={styles.accordionContainer}>
                <button
                  type="button"
                  onClick={() => setMaterialAccordionOpen((o) => !o)}
                  style={styles.accordionHeader}
                >
                  Material
                  <ChevronDown
                    size={20}
                    color={colors.muted}
                    style={{
                      transform: materialAccordionOpen
                        ? "rotate(180deg)"
                        : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>
                {materialAccordionOpen && (
                  <div style={styles.accordionContent}>{product.material}</div>
                )}
              </div>
            )}

            {/* Acordeão: Estampa */}
            {product?.pattern && product.pattern.trim() !== "" && (
              <div style={styles.accordionContainer}>
                <button
                  type="button"
                  onClick={() => setEstampaAccordionOpen((o) => !o)}
                  style={styles.accordionHeader}
                >
                  Estampa
                  <ChevronDown
                    size={20}
                    color={colors.muted}
                    style={{
                      transform: estampaAccordionOpen
                        ? "rotate(180deg)"
                        : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>
                {estampaAccordionOpen && (
                  <div style={styles.accordionContent}>{product.pattern}</div>
                )}
              </div>
            )}
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
