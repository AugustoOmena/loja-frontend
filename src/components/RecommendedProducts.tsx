import { useTheme } from "../contexts/ThemeContext";
import { Loader2, Heart, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFirebaseProductsInfinite } from "../hooks/useFirebaseProductsInfinite";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";

export const RecommendedProducts = () => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();

  // --- FIREBASE REALTIME DATABASE COM PAGINAÇÃO ---
  const {
    products,
    loading: isLoading,
    error,
    loadMore,
    hasMore,
    isLoadingMore,
  } = useFirebaseProductsInfinite(20); // 20 produtos por página para produtos recomendados

  // --- SCROLL INFINITO ---
  const observerEnabled = hasMore && !isLoading;

  const loadMoreRef = useIntersectionObserver(
    () => {
      if (hasMore && !isLoading) {
        loadMore();
      }
    },
    observerEnabled,
    isLoadingMore,
  );

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

      {/* Estado de Loading */}
      {isLoading && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: colors.muted,
          }}
        >
          <Loader2
            className="animate-spin"
            style={{ margin: "0 auto 10px" }}
            size={32}
          />
          <p style={{ fontSize: "14px", marginTop: "10px" }}>
            Carregando produtos recomendados...
          </p>
        </div>
      )}

      {/* Estado de Erro */}
      {error && !isLoading && (
        <div
          style={{
            padding: "30px",
            textAlign: "center",
            backgroundColor: theme === "dark" ? "#7f1d1d" : "#fee2e2",
            border: `1px solid ${theme === "dark" ? "#991b1b" : "#fecaca"}`,
            borderRadius: "8px",
            margin: "20px 0",
          }}
        >
          <AlertCircle
            size={40}
            color={theme === "dark" ? "#fca5a5" : "#dc2626"}
            style={{ margin: "0 auto 15px" }}
          />
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: theme === "dark" ? "#fca5a5" : "#dc2626",
              marginBottom: "8px",
            }}
          >
            Erro ao carregar produtos
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: theme === "dark" ? "#fca5a5" : "#dc2626",
            }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Grid de Produtos */}
      {!isLoading && !error && (
        <>
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

          {/* Empty State */}
          {products.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: colors.muted,
              }}
            >
              <Heart
                size={48}
                color={colors.muted}
                style={{ margin: "0 auto 15px", opacity: 0.5 }}
              />
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "5px",
                }}
              >
                Nenhum produto recomendado encontrado
              </p>
            </div>
          )}

          {/* Loading More Indicator */}
          {products.length > 0 && (
            <div
              ref={loadMoreRef}
              style={{
                minHeight: "200px",
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.muted,
                fontSize: "13px",
                padding: "20px",
                marginTop: "20px",
                width: "100%",
                backgroundColor: "transparent",
              }}
              data-testid="load-more-trigger"
            >
              {isLoadingMore ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <Loader2 className="animate-spin" size={20} />
                  <span>Carregando mais produtos...</span>
                </div>
              ) : hasMore ? (
                <span style={{ opacity: 0.3, fontSize: "12px" }}>
                  Role para carregar mais
                </span>
              ) : (
                <span style={{ opacity: 0.5 }}>Você chegou ao fim!</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
