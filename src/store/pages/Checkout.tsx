import { useCart, type CartItem } from "../../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  QrCode,
  FileText,
  ChevronRight,
  ShieldCheck,
  Lock,
  Star,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useFrete, cartItemsToFreteItens } from "../../hooks/useFrete";
import { ShippingSection } from "../../components/ShippingSection";

export const Checkout = () => {
  const {
    items,
    cartTotal,
    selectedShipping,
    setSelectedShipping,
    cep,
    setCep,
  } = useCart();
  const { opcoes, loading, error, calcular, clearError } = useFrete();
  const navigate = useNavigate();
  const { colors, theme } = useTheme();

  // Proteção contra carrinho vazio
  if (!items || items.length === 0) {
    return (
      <div
        style={{
          padding: "50px",
          textAlign: "center",
          color: colors.text,
          backgroundColor: colors.bg,
          minHeight: "100vh",
        }}
      >
        <h2>Seu carrinho está vazio 🛒</h2>
        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Voltar a Loja
        </button>
      </div>
    );
  }

  const handleCalcularFrete = () => {
    clearError();
    setSelectedShipping(null);
    const itens = cartItemsToFreteItens(items);
    calcular(cep, itens);
  };

  const shippingCost = selectedShipping?.preco ?? 0;
  const totalComFrete = cartTotal + shippingCost;
  const selectedId = selectedShipping
    ? `${selectedShipping.transportadora}-${selectedShipping.preco}`
    : null;

  // --- NAVEGAÇÃO ---
  const handleSelection = (method: string) => {
    if (method === "credit") {
      navigate("/checkout/credit");
    } else if (method === "pix") {
      navigate("/checkout/pix-boleto", { state: { defaultMethod: "pix" } });
    } else if (method === "boleto") {
      navigate("/checkout/pix-boleto", { state: { defaultMethod: "boleto" } });
    }
  };

  const styles = {
    // WRAPPER NOVO: Garante que o fundo da página respeite o tema (Claro/Escuro)
    pageWrapper: {
      backgroundColor: colors.bg,
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      justifyContent: "center",
    },
    container: {
      maxWidth: "1100px",
      width: "100%",
      padding: "40px 20px",
      fontFamily: "sans-serif",
      color: colors.text,
    },
    grid: { display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "40px" },

    // Títulos
    title: {
      fontSize: "28px",
      fontWeight: "800",
      marginBottom: "30px",
      display: "flex",
      alignItems: "center",
      gap: 10,
    },
    subtitle: {
      fontSize: "16px",
      fontWeight: "600",
      marginBottom: "15px",
      color: colors.muted,
    },

    // Cartões de Opção
    optionCard: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "25px",
      marginBottom: "15px",
      borderRadius: "12px",
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.card, // Agora contrasta com colors.bg do wrapper
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
      position: "relative" as const,
    },
    iconBox: {
      width: 50,
      height: 50,
      borderRadius: 10,
      backgroundColor: theme === "dark" ? "#1e293b" : "#f3f4f6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 20,
    },
    badge: {
      position: "absolute" as const,
      top: -10,
      right: 20,
      background: "#10b981",
      color: "white",
      fontSize: 10,
      fontWeight: "bold",
      padding: "4px 8px",
      borderRadius: 20,
    },

    // Resumo
    summaryBox: {
      position: "sticky" as const,
      top: 20,
      backgroundColor: colors.card,
      padding: "30px",
      borderRadius: "16px",
      border: `1px solid ${colors.border}`,
      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)",
    },
    summaryRow: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "15px",
      fontSize: "14px",
      color: colors.muted,
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "20px",
      paddingTop: "20px",
      borderTop: `1px solid ${colors.border}`,
      fontSize: "22px",
      fontWeight: "bold",
      color: "#10b981",
    },
    itemRow: {
      display: "flex",
      gap: 12,
      marginBottom: 15,
      borderBottom: `1px dashed ${colors.border}`,
      paddingBottom: 15,
    },
  };

  return (
    <div style={styles.pageWrapper}>
      {" "}
      {/* Adicionei este Wrapper */}
      <div style={styles.container}>
        {/* Título Principal */}
        <h1 style={styles.title}>
          <Lock size={28} color="#10b981" /> Finalizar Compra
        </h1>

        <div className="checkout-grid" style={styles.grid as React.CSSProperties}>
          <style>{`
            @media (max-width: 900px) { .checkout-grid { grid-template-columns: 1fr !important; } }
            .hover-card:hover { border-color: #10b981 !important; transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.15) !important; }
          `}</style>

          {/* --- COLUNA ESQUERDA (OPÇÕES) --- */}
          <div>
            <ShippingSection
              cep={cep}
              onCepChange={(v) => setCep(v.replace(/\D/g, "").slice(0, 8))}
              opcoes={opcoes}
              loading={loading}
              error={error}
              selectedId={selectedId}
              onSelect={setSelectedShipping}
              onCalcular={handleCalcularFrete}
              colors={colors}
            />

            <div style={styles.subtitle}>Escolha o método de pagamento</div>

            {/* Opção 1: Cartão */}
            <div
              style={styles.optionCard}
              className="hover-card"
              onClick={() => handleSelection("credit")}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={styles.iconBox}>
                  <CreditCard size={24} color={colors.text} />
                </div>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 18 }}>
                    Cartão de Crédito
                  </div>
                  <div
                    style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}
                  >
                    Parcelamento em até 12x
                  </div>
                </div>
              </div>
              <ChevronRight color={colors.muted} />
            </div>

            {/* Opção 2: Pix (Destaque) */}
            <div
              style={{
                ...styles.optionCard,
                border: `2px solid #10b981`,
                background:
                  theme === "dark" ? "rgba(16,185,129,0.05)" : "#f0fdf4",
              }}
              className="hover-card"
              onClick={() => handleSelection("pix")}
            >
              <div style={styles.badge}>MAIS RÁPIDO</div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ ...styles.iconBox, backgroundColor: "#10b981" }}>
                  <QrCode size={24} color="white" />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: 18,
                      color: "#10b981",
                    }}
                  >
                    Pix
                  </div>
                  <div
                    style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}
                  >
                    Aprovação imediata + 5% OFF
                  </div>
                </div>
              </div>
              <ChevronRight color="#10b981" />
            </div>

            {/* Opção 3: Boleto */}
            <div
              style={styles.optionCard}
              className="hover-card"
              onClick={() => handleSelection("boleto")}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={styles.iconBox}>
                  <FileText size={24} color={colors.text} />
                </div>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 18 }}>
                    Boleto Bancário
                  </div>
                  <div
                    style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}
                  >
                    Vencimento em 3 dias úteis
                  </div>
                </div>
              </div>
              <ChevronRight color={colors.muted} />
            </div>

            <div
              style={{
                marginTop: 30,
                display: "flex",
                gap: 20,
                color: colors.muted,
                fontSize: 12,
                justifyContent: "center",
                opacity: 0.7,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <ShieldCheck size={14} /> Pagamento Seguro
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Star size={14} /> Garantia de Satisfação
              </span>
            </div>
          </div>

          {/* --- COLUNA DIREITA (RESUMO) --- */}
          <div>
            <div style={styles.summaryBox}>
              <h3
                style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}
              >
                Resumo do Pedido
              </h3>

              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  marginBottom: 20,
                }}
              >
                {items.map((item: CartItem) => (
                  <div key={item.id} style={styles.itemRow}>
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 8,
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          lineHeight: "1.2",
                        }}
                      >
                        {item.name}
                      </div>
                      <div style={{ fontSize: 12, color: colors.muted }}>
                        Qtd: {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: "bold" }}>
                      R${" "}
                      {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </div>
              <div style={styles.summaryRow}>
                <span>Frete</span>
                <span
                  style={{
                    color: selectedShipping ? "#10b981" : colors.muted,
                    fontWeight: "bold",
                  }}
                >
                  {selectedShipping
                    ? `R$ ${shippingCost.toFixed(2)}`
                    : "Calcule o CEP acima"}
                </span>
              </div>

              <div style={styles.totalRow}>
                <span>Total a pagar</span>
                <span>R$ {totalComFrete.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
