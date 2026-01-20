import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useNavigate } from "react-router-dom";

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

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  return (
    <div style={styles.overlay}>
      {/* Fecha ao clicar fora */}
      <div style={styles.backdrop} onClick={() => setIsCartOpen(false)} />

      <div style={styles.drawer}>
        <div style={styles.header}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <ShoppingBag size={24} /> Seu Carrinho
          </h2>
          <button onClick={() => setIsCartOpen(false)} style={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        <div style={styles.content}>
          {items.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}
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
              {items.map((item, idx) => (
                <div key={`${item.id}-${idx}`} style={styles.cartItem}>
                  <div style={styles.imageWrapper}>
                    {item.image ? (
                      <img src={item.image} style={styles.img} />
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
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        marginBottom: "8px",
                      }}
                    >
                      {item.size && `Tamanho: ${item.size}`}
                    </div>
                    <div style={{ fontWeight: "bold", color: "#ff4747" }}>
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
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        border: "none",
                        background: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={18} />
                    </button>

                    <div style={styles.qtyControl}>
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        style={styles.qtyBtn}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontSize: "13px", fontWeight: "bold" }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        style={styles.qtyBtn}
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
              }}
            >
              <span>Total</span>
              <span>R$ {cartTotal.toFixed(2)}</span>
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

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    display: "flex",
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawer: {
    position: "relative",
    width: "100%",
    maxWidth: "400px",
    height: "100%",
    backgroundColor: "white",
    display: "flex",
    flexDirection: "column",
    boxShadow: "-5px 0 15px rgba(0,0,0,0.1)",
    animation: "slideIn 0.3s ease-out",
  },
  header: {
    padding: "20px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: { flex: 1, overflowY: "auto", padding: "20px" },
  footer: {
    padding: "20px",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },

  cartItem: {
    display: "flex",
    gap: "15px",
    paddingBottom: "15px",
    borderBottom: "1px solid #f1f5f9",
  },
  imageWrapper: {
    width: "70px",
    height: "70px",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  placeholderImg: {
    width: "100%",
    height: "100%",
    backgroundColor: "#eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
  },

  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "5px",
  },
  qtyControl: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#f1f5f9",
    borderRadius: "6px",
    padding: "2px",
  },
  qtyBtn: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    backgroundColor: "white",
    borderRadius: "4px",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },

  checkoutBtn: {
    width: "100%",
    padding: "15px",
    backgroundColor: "#10b981",
    color: "white",
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
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
