import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { getProductById } from "../services/firebaseProductService";
import {
  getProductQuantity,
  getStockBySize,
  getVariantStock,
} from "../utils/productHelpers";
import { useState } from "react";

export const CartDrawer = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    items,
    removeFromCart,
    updateQuantity,
    cartTotal,
  } = useCart();

  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(
    new Set(),
  );
  const [maxQuantities, setMaxQuantities] = useState<Map<string, number>>(
    new Map(),
  );

  /** Chave única do item: id + size + color (para variantes). */
  const getItemKey = (
    id: number,
    size: string | null,
    color?: string | null
  ) => `${id}-${size || "Único"}-${color ?? "Único"}`;

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  // Busca a quantidade máxima: por variante (cor + tamanho) ou por tamanho/total
  const getMaxQuantity = async (
    itemId: number,
    size: string | null,
    color?: string | null,
  ): Promise<number | undefined> => {
    try {
      const product = await getProductById(itemId);
      if (!product) return undefined;
      const colorNorm = color?.trim() || null;
      if (colorNorm && product.variants?.length) {
        const stock = getVariantStock(product, colorNorm, size || "Único");
        return stock;
      }
      const stockBySize = getStockBySize(product);
      if (Object.keys(stockBySize).length > 0) {
        const sizeKey = size || "Único";
        return stockBySize[sizeKey] ?? 0;
      }
      return getProductQuantity(product);
    } catch (error) {
      console.error("Erro ao buscar produto para validação:", error);
      return undefined;
    }
  };

  const handleIncreaseQuantity = async (
    itemId: number,
    size: string | null,
    color?: string | null,
  ) => {
    const itemKey = getItemKey(itemId, size, color);
    if (loadingProducts.has(itemKey)) return;

    setLoadingProducts((prev) => new Set(prev).add(itemKey));
    try {
      const maxQty = await getMaxQuantity(itemId, size, color);
      if (maxQty !== undefined) {
        setMaxQuantities((prev) => new Map(prev).set(itemKey, maxQty));
      }
      updateQuantity(itemId, size, 1, maxQty, color);
    } finally {
      setLoadingProducts((prev) => {
        const next = new Set(prev);
        next.delete(itemKey);
        return next;
      });
    }
  };

  const isAtMaxQuantity = (item: {
    id: number;
    size: string | null;
    quantity: number;
    color?: string | null;
  }) => {
    const itemKey = getItemKey(item.id, item.size, item.color);
    const maxQty = maxQuantities.get(itemKey);
    return maxQty !== undefined && item.quantity >= maxQty;
  };

  // --- 3. ESTILOS DINÂMICOS (Dentro do componente) ---
  const styles = {
    overlay: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2000,
      display: "flex",
      justifyContent: "flex-end",
    },
    backdrop: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      cursor: "pointer",
    },
    drawer: {
      position: "relative" as const,
      width: "100%",
      maxWidth: "400px",
      height: "100%",
      backgroundColor: colors.card, // Cor do Card (Branco ou Slate Escuro)
      color: colors.text, // Texto automático
      display: "flex",
      flexDirection: "column" as const,
      boxShadow: "-5px 0 15px rgba(0,0,0,0.2)",
      animation: "slideIn 0.3s ease-out",
    },
    header: {
      padding: "20px",
      borderBottom: `1px solid ${colors.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.card,
    },
    title: {
      fontSize: "20px",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: colors.text,
    },
    content: {
      flex: 1,
      overflowY: "auto" as const,
      padding: "20px",
      backgroundColor: colors.card,
    },
    footer: {
      padding: "20px",
      borderTop: `1px solid ${colors.border}`,
      backgroundColor: colors.bg, // Levemente diferente do card para contraste
    },

    // Itens
    cartItem: {
      display: "flex",
      gap: "15px",
      paddingBottom: "15px",
      borderBottom: `1px solid ${colors.border}`,
    },
    imageWrapper: {
      width: "70px",
      height: "70px",
      borderRadius: "8px",
      overflow: "hidden",
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.bg,
    },
    img: { width: "100%", height: "100%", objectFit: "cover" as const },
    placeholderImg: {
      width: "100%",
      height: "100%",
      backgroundColor: colors.bg,
      color: colors.muted,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "10px",
    },

    // Botões
    closeBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "5px",
      color: colors.muted,
      transition: "color 0.2s",
    },
    qtyControl: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      backgroundColor: colors.bg, // Fundo do controle
      borderRadius: "6px",
      padding: "2px",
      border: `1px solid ${colors.border}`,
    },
    qtyBtn: {
      width: "24px",
      height: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      backgroundColor: colors.card, // Botão destaca do fundo do controle
      color: colors.text,
      borderRadius: "4px",
      cursor: "pointer",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    },
    checkoutBtn: {
      width: "100%",
      padding: "15px",
      backgroundColor: colors.accent,
      color: colors.accentText,
      border: "none",
      borderRadius: "8px",
      fontWeight: "bold",
      fontSize: "16px",
      cursor: "pointer",
    },
    secondaryBtn: {
      marginTop: "20px",
      padding: "10px 20px",
      backgroundColor: "transparent",
      border: `1px solid ${colors.border}`,
      color: colors.text,
      borderRadius: "6px",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.overlay}>
      {/* Keyframes para animação */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      <div style={styles.backdrop} onClick={() => setIsCartOpen(false)} />

      <div style={styles.drawer}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            <ShoppingBag size={24} /> Seu Carrinho
          </h2>
          <button onClick={() => setIsCartOpen(false)} style={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        <div style={styles.content}>
          {items.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: colors.muted,
              }}
            >
              <ShoppingBag
                size={48}
                style={{ margin: "0 auto 20px", opacity: 0.5 }}
              />
              <p>Seu carrinho está vazio.</p>
              <button
                onClick={() => setIsCartOpen(false)}
                style={styles.secondaryBtn}
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              {items.map((item) => (
                <div
                  key={getItemKey(item.id, item.size, item.color)}
                  style={styles.cartItem}
                >
                  <div style={styles.imageWrapper}>
                    {item.image ? (
                      <img
                        src={item.image}
                        style={styles.img}
                        alt={item.name}
                      />
                    ) : (
                      <div style={styles.placeholderImg}>IMG</div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        marginBottom: "4px",
                        color: colors.text,
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: colors.muted,
                        marginBottom: "8px",
                      }}
                    >
                      {item.color && item.size
                        ? `Cor: ${item.color} · Tamanho: ${item.size}`
                        : item.color
                          ? `Cor: ${item.color}`
                          : item.size
                            ? `Tamanho: ${item.size}`
                            : "—"}
                    </div>
                    <div
                      style={{
                        fontWeight: "bold",
                        color: theme === "dark" ? colors.accent : colors.text,
                      }}
                    >
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                    }}
                  >
                    <button
                      onClick={() =>
                        removeFromCart(item.id, item.size, item.color)
                      }
                      style={{
                        border: "none",
                        background: "none",
                        color: colors.muted,
                        cursor: "pointer",
                      }}
                      aria-label="Remover do carrinho"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div style={styles.qtyControl}>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.size,
                            -1,
                            undefined,
                            item.color
                          )
                        }
                        style={styles.qtyBtn}
                      >
                        <Minus size={14} />
                      </button>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "bold",
                          color: colors.text,
                          padding: "0 5px",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleIncreaseQuantity(
                            item.id,
                            item.size,
                            item.color
                          )
                        }
                        disabled={
                          loadingProducts.has(
                            getItemKey(item.id, item.size, item.color)
                          ) || isAtMaxQuantity(item)
                        }
                        title={
                          isAtMaxQuantity(item) ? "Estoque máximo atingido" : ""
                        }
                        style={{
                          ...styles.qtyBtn,
                          opacity:
                            loadingProducts.has(
                              getItemKey(item.id, item.size, item.color)
                            ) || isAtMaxQuantity(item)
                              ? 0.5
                              : 1,
                          cursor:
                            loadingProducts.has(
                              getItemKey(item.id, item.size, item.color)
                            ) || isAtMaxQuantity(item)
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div style={styles.footer}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
                fontWeight: "bold",
                fontSize: "18px",
                color: colors.text,
              }}
            >
              <span>Total</span>
              <span
                style={{
                  color: theme === "dark" ? colors.accent : colors.text,
                }}
              >
                R$ {cartTotal.toFixed(2)}
              </span>
            </div>
            <button onClick={handleCheckout} style={styles.checkoutBtn}>
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
