import { useQuery } from "@tanstack/react-query";
import { productService } from "../services/productService";
import { useTheme } from "../contexts/ThemeContext";
import { Loader2, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RecommendedProducts = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ["recommended"],
    queryFn: () =>
      productService.getAll({ page: 1, limit: 10, sort: "newest" }),
  });

  const products = data?.data || [];

  const styles = {
    // AQUI ESTÁ A MUDANÇA: padding lateral de 15px
    container: {
      marginTop: "30px",
      padding: "0 15px 20px 15px", // Cima | Direita | Baixo | Esquerda
    },
    title: {
      fontSize: "18px",
      fontWeight: "bold",
      color: colors.text,
      marginBottom: "15px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: "8px",
      overflow: "hidden",
      border: `1px solid ${colors.border}`,
      display: "flex",
      flexDirection: "column" as const,
      transition: "transform 0.2s",
    },
    image: {
      width: "100%",
      aspectRatio: "1/1",
      objectFit: "cover" as const,
      backgroundColor: colors.bg,
    },
    info: { padding: "10px" },
    name: {
      fontSize: "13px",
      color: colors.text,
      marginBottom: "5px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap" as const,
    },
    price: { fontSize: "16px", fontWeight: "bold", color: colors.text },
    installments: { fontSize: "10px", color: colors.muted },
  };

  if (isLoading)
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div style={styles.container}>
      <style>{`
        .rec-grid {
          display: grid;
          gap: 10px;
          /* MOBILE: 2 colunas */
          grid-template-columns: repeat(2, 1fr);
        }

        /* DESKTOP: Responsivo */
        @media (min-width: 768px) {
          .rec-grid {
            gap: 20px;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          }
        }
      `}</style>

      <h3 style={styles.title}>
        <Heart size={20} fill="#ef4444" color="#ef4444" />
        Você vai adorar
      </h3>

      <div className="rec-grid">
        {products.map((product) => (
          <div
            key={product.id}
            style={styles.card}
            onClick={() => navigate(`/produto/${product.id}`)}
          >
            <img
              src={product.images?.[0] || "https://placehold.co/150"}
              alt={product.name}
              style={styles.image}
            />
            <div style={styles.info}>
              <div style={styles.name}>{product.name}</div>
              <div style={styles.price}>R$ {product.price.toFixed(2)}</div>
              <div style={styles.installments}>
                6x R$ {(product.price / 6).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
