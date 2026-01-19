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
import { productService } from "../../services/productService";
import { useCart } from "../../contexts/CartContext";

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Hooks do Carrinho e Estado Local
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null); // Agora será usado!

  // --- REACT QUERY ---
  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => {
      if (!id) throw new Error("ID inválido");
      return productService.getById(Number(id));
    },
    enabled: !!id,
  });

  if (isLoading)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2 className="spin" size={40} color="#ff4747" />
      </div>
    );

  if (isError || !product)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h2>Produto não encontrado</h2>
        <button
          onClick={() => navigate("/")}
          style={{ marginTop: "20px", padding: "10px 20px", cursor: "pointer" }}
        >
          Voltar para Loja
        </button>
      </div>
    );

  // Lógica da imagem principal (Selecionada ou a primeira da lista)
  const mainImage =
    selectedImage ||
    (product.images && product.images.length > 0 ? product.images[0] : null);

  // --- FUNÇÃO ADICIONAR AO CARRINHO ---
  const handleAddToCart = () => {
    if (!product) return;

    // Prioriza o tamanho que o usuário clicou.
    // Se não clicou, tenta usar o do banco. Se não tiver, vai como "Único".
    const sizeToAdd = selectedSize || product.size || "Único";

    addToCart(product, sizeToAdd);
  };

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          border: "none",
          background: "none",
          cursor: "pointer",
          marginBottom: "20px",
          color: "#666",
        }}
      >
        <ChevronLeft size={20} /> Voltar
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "40px",
        }}
      >
        {/* --- COLUNA 1: GALERIA DE IMAGENS --- */}
        <div>
          {/* Imagem Grande */}
          <div
            style={{
              aspectRatio: "1/1",
              backgroundColor: "#f9f9f9",
              borderRadius: "10px",
              overflow: "hidden",
              marginBottom: "15px",
              border: "1px solid #eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {mainImage ? (
              <img
                src={mainImage}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt={product.name}
              />
            ) : (
              <ImageIcon size={60} color="#ccc" />
            )}
          </div>

          {/* Carrossel de Miniaturas */}
          {product.images && product.images.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                overflowX: "auto",
                paddingBottom: "5px",
              }}
            >
              {product.images.map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  onClick={() => setSelectedImage(img)}
                  style={{
                    width: "70px",
                    height: "70px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border:
                      mainImage === img
                        ? "2px solid #ff4747"
                        : "2px solid transparent",
                    backgroundColor: "#f9f9f9",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* --- COLUNA 2: INFORMAÇÕES DO PRODUTO --- */}
        <div>
          <h1
            style={{
              fontSize: "26px",
              color: "#1e293b",
              marginBottom: "10px",
              lineHeight: "1.3",
            }}
          >
            {product.name}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              margin: "10px 0",
              color: "#facc15",
              fontSize: "14px",
            }}
          >
            <Star fill="#facc15" size={16} /> <span>4.8 (120 avaliações)</span>
          </div>

          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#ff4747",
              margin: "20px 0",
            }}
          >
            R$ {product.price.toFixed(2)}
            <div
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                fontWeight: "normal",
              }}
            >
              Em até 3x de R$ {(product.price / 3).toFixed(2)} sem juros
            </div>
          </div>

          <div
            style={{
              marginBottom: "20px",
              lineHeight: "1.6",
              color: "#475569",
              fontSize: "15px",
            }}
          >
            {product.description || "Sem descrição detalhada."}
          </div>

          {/* SELEÇÃO DE TAMANHO */}
          <div style={{ margin: "25px 0" }}>
            <span
              style={{
                fontWeight: "600",
                display: "block",
                marginBottom: "10px",
                color: "#334155",
              }}
            >
              Tamanho: {selectedSize || product.size || ""}
            </span>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {/* Opções de Tamanho Interativas */}
              {["P", "M", "G", "GG"].map((s) => {
                const isActive = selectedSize === s;
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    style={{
                      padding: "10px 20px",
                      border: isActive ? "2px solid #ff4747" : "1px solid #ddd",
                      backgroundColor: isActive ? "#fff1f2" : "white",
                      borderRadius: "6px",
                      fontWeight: isActive ? "bold" : "normal",
                      color: isActive ? "#ff4747" : "#333",
                      cursor: "pointer",
                      transition: "0.2s",
                    }}
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
                style={{
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
                }}
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
              <button
                disabled
                style={{
                  width: "100%",
                  backgroundColor: "#e2e8f0",
                  color: "#94a3b8",
                  border: "none",
                  padding: "16px",
                  borderRadius: "30px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "not-allowed",
                }}
              >
                Produto Indisponível
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
