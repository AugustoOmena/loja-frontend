import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ChevronLeft,
  ShoppingCart,
  Star,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { getProductById } from "../../services/firebaseProductService";
import { useCart } from "../../contexts/CartContext";
import { useTheme } from "../../contexts/ThemeContext";

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors, theme } = useTheme();

  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

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
      border: isActive ? "2px solid #ff4747" : `1px solid ${colors.border}`,
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
      color: "#facc15",
      fontSize: "14px",
    },
    price: {
      fontSize: "32px",
      fontWeight: "bold",
      color: "#ff4747",
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
    sizeButton: (isActive: boolean) => ({
      padding: "10px 20px",
      border: isActive ? "2px solid #ff4747" : `1px solid ${colors.border}`,
      backgroundColor: isActive
        ? theme === "dark"
          ? "rgba(255, 71, 71, 0.15)"
          : "#fff1f2"
        : colors.card,
      borderRadius: "6px",
      fontWeight: isActive ? "bold" : "normal",
      color: isActive ? "#ff4747" : colors.text,
      cursor: "pointer",
      transition: "0.2s",
    }),
    addToCartBtn: {
      width: "100%",
      backgroundColor: "#ff4747",
      color: "white",
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
      boxShadow: "0 4px 15px rgba(255, 71, 71, 0.3)",
      transition: "transform 0.1s",
    },
    disabledBtn: {
      width: "100%",
      backgroundColor: theme === "dark" ? "#1e293b" : "#e2e8f0",
      color: colors.muted,
      border: "none",
      padding: "16px",
      borderRadius: "30px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "not-allowed",
    },
  };

  if (isLoading)
    return (
      <div style={styles.loaderWrapper}>
        <Loader2 className="animate-spin" size={40} color="#ff4747" />
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
    (product.images && product.images.length > 0 ? product.images[0] : null);

  const handleAddToCart = () => {
    if (!product) return;
    const sizeToAdd = selectedSize || product.size || "Único";
    addToCart(product, sizeToAdd);
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
              <Star fill="#facc15" size={16} />{" "}
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
            <div style={{ margin: "25px 0" }}>
              <span style={styles.label}>
                Tamanho: {selectedSize || product.size || ""}
              </span>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {["P", "M", "G", "GG"].map((s) => {
                  const isActive = selectedSize === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      style={styles.sizeButton(isActive)}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BOTÃO DE AÇÃO */}
            <div style={{ marginTop: "30px" }}>
              {(product.quantity || 0) > 0 ? (
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
    </div>
  );
};
