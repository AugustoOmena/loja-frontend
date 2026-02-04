import { useEffect, useRef, useState } from "react";
import { loadMercadoPago } from "@mercadopago/sdk-js";
import {
  Lock,
  ShieldCheck,
  User,
  Mail,
  Calendar,
  Hash,
  AlertCircle,
  CheckCircle,
  Truck,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { useCart } from "../../contexts/CartContext";
import { useAddress } from "../../contexts/AddressContext";
import { useTheme } from "../../contexts/ThemeContext";
import { cartItemsToFreteItens } from "../../hooks/useFrete";

interface IdentificationType {
  id: string;
  name: string;
}
interface Issuer {
  id: string;
  name: string;
}
interface PayerCost {
  installments: number;
  recommended_message: string;
}

export const CreditCardCheckout = () => {
  const navigate = useNavigate();

  // CORREÇÃO 1: Adicionei 'items' aqui para poder enviar para a Lambda
  const { cartTotal, clearCart, items, selectedShipping } = useCart();
  const { address } = useAddress();

  const { colors, theme } = useTheme();

  const shippingCost = selectedShipping?.preco ?? 0;
  const totalComFrete = cartTotal + shippingCost;
  const transactionAmount = totalComFrete > 0 ? totalComFrete : 100;

  const amountRef = useRef(transactionAmount);
  useEffect(() => {
    amountRef.current = transactionAmount;
  }, [transactionAmount]);

  const [loading, setLoading] = useState(false);
  const [docTypes, setDocTypes] = useState<IdentificationType[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [, setIssuers] = useState<Issuer[]>([]);
  const [installments, setInstallments] = useState<PayerCost[]>([]);
  const [formError, setFormError] = useState("");
  const [isMpLoaded, setIsMpLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    cardholderName: "",
    email: "",
    docType: "",
    docNumber: "",
    issuer: "",
    installments: "",
  });

  const mpRef = useRef<any>(null);

  // Redireciona se carrinho vazio
  useEffect(() => {
    if (cartTotal <= 0 && !showSuccess) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cartTotal, navigate, showSuccess]);

  // Carrega Email do Usuário automaticamente (Melhoria de UX)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        setFormData((prev) => ({ ...prev, email: data.session!.user.email! }));
      }
    });
  }, []);

  // Busca dados do cartão (Bandeira, Parcelas)
  const fetchPaymentMethodInfo = async (mp: any, bin: string) => {
    try {
      const { results } = await mp.getPaymentMethods({ bin });

      if (results.length > 0) {
        const method = results[0];
        setPaymentMethodId(method.id);

        const issuersRes = await mp.getIssuers({
          paymentMethodId: method.id,
          bin,
        });
        setIssuers(issuersRes);
        if (issuersRes.length > 0) {
          setFormData((p) => ({ ...p, issuer: issuersRes[0].id }));
        }

        const installmentsRes = await mp.getInstallments({
          amount: amountRef.current.toString(),
          bin,
          paymentTypeId: "credit_card",
        });

        if (installmentsRes.length > 0) {
          setInstallments(installmentsRes[0].payer_costs);
          setFormData((p) => ({
            ...p,
            installments:
              installmentsRes[0].payer_costs[0].installments.toString(),
          }));
        }
        return method.id;
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
    }
    return null;
  };

  // Inicializa Mercado Pago
  useEffect(() => {
    const cleanupMounts = () => {
      [
        "cardNumber-mount",
        "expirationDate-mount",
        "securityCode-mount",
      ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = "";
      });
    };

    const init = async () => {
      cleanupMounts();
      await loadMercadoPago();

      // @ts-ignore
      const mp = new window.MercadoPago(
        "TEST-33d77029-c5e0-425f-b848-606ac9a9264f"
      );
      mpRef.current = mp;

      const inputColor = theme === "dark" ? "#fff" : "#333";

      const cardNumberElement = mp.fields.create("cardNumber", {
        placeholder: "0000 0000 0000 0000",
        style: { fontSize: "14px", color: inputColor },
      });
      const expirationDateElement = mp.fields.create("expirationDate", {
        placeholder: "MM/AA",
        style: { fontSize: "14px", color: inputColor },
      });
      const securityCodeElement = mp.fields.create("securityCode", {
        placeholder: "123",
        style: { fontSize: "14px", color: inputColor },
      });

      const waitForContainers = () =>
        document.getElementById("cardNumber-mount");

      const mountFields = async () => {
        let attempts = 0;
        while (!waitForContainers() && attempts < 20) {
          await new Promise((r) => setTimeout(r, 100));
          attempts++;
        }
        if (!waitForContainers()) return;

        try {
          await cardNumberElement.mount("cardNumber-mount");
          await expirationDateElement.mount("expirationDate-mount");
          await securityCodeElement.mount("securityCode-mount");
          setIsMpLoaded(true);
        } catch (e) {
          console.error(e);
        }
      };

      cardNumberElement.on("binChange", async (data: any) => {
        const { bin } = data;
        setFormError("");
        if (bin) {
          await fetchPaymentMethodInfo(mp, bin);
        } else {
          setPaymentMethodId("");
        }
      });

      mountFields();

      try {
        const types = await mp.getIdentificationTypes();
        setDocTypes(types || []);
        if (types && types.length > 0)
          setFormData((p) => ({ ...p, docType: types[0].id }));
      } catch (e) {
        console.error(e);
      }
    };

    init();
    return () => {
      mpRef.current = null;
    };
  }, [theme]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setLoading(true);

    const cleanDoc = formData.docNumber.replace(/\D/g, "");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !session.user) {
        alert("Sessão expirada.");
        navigate("/login");
        return;
      }

      const user = session.user;

      if (!formData.email || !cleanDoc || !formData.cardholderName) {
        throw new Error("Preencha todos os campos.");
      }

      const token = await mpRef.current.fields.createCardToken({
        cardholderName: formData.cardholderName,
        identificationType: formData.docType,
        identificationNumber: cleanDoc,
      });

      let finalPaymentMethodId = paymentMethodId;
      if (!finalPaymentMethodId) {
        const firstSix = token.first_six_digits;
        if (firstSix) {
          const detectedId = await fetchPaymentMethodInfo(
            mpRef.current,
            firstSix
          );
          if (detectedId) finalPaymentMethodId = detectedId;
        }
      }

      if (!finalPaymentMethodId) {
        // Fallback básico se a API não retornar a tempo
        finalPaymentMethodId = "credit_card";
      }

      // Envia itens + frete separado para o backend calcular corretamente
      const payload = {
        token: token.id,
        transaction_amount: transactionAmount,
        payment_method_id: finalPaymentMethodId,
        installments: Number(formData.installments) || 1,
        issuer_id: formData.issuer,
        payer: {
          email: formData.email,
          identification: {
            type: formData.docType,
            number: cleanDoc,
          },
        },
        user_id: user.id,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        frete: shippingCost,
        cep: address.cep.replace(/\D/g, ""),
        frete_service:
          selectedShipping?.service ??
          selectedShipping?.id ??
          selectedShipping?.transportadora,
        frete_itens: cartItemsToFreteItens(items),
      };

      const API_URL = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${API_URL}/pagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        clearCart();
        setShowSuccess(true);
        setTimeout(() => navigate("/minha-conta"), 3000);
      } else {
        // Se a validação da Lambda falhar (ex: items missing), mostramos aqui
        setFormError(
          result.error || result.status_detail || "Pagamento recusado."
        );
      }
    } catch (error: any) {
      console.error(error);
      setFormError(error.message || "Erro ao processar pagamento.");
    } finally {
      setLoading(false);
    }
  };

  // --- ESTILOS DINÂMICOS ---
  const styles = {
    page: {
      backgroundColor: colors.bg,
      minHeight: "100vh",
      padding: "20px 0",
      fontFamily: "sans-serif",
      color: colors.text,
    },
    grid: {
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "0 15px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
      gap: "30px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "20px",
      color: colors.text,
    },
    card: {
      backgroundColor: colors.card,
      padding: "25px",
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      border: `1px solid ${colors.border}`,
    },
    label: {
      fontSize: "13px",
      fontWeight: "600",
      color: colors.muted,
      marginBottom: "6px",
      display: "block",
    },
    inputWrapper: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "0 12px",
      height: "45px",
      border: `1px solid ${colors.border}`,
      borderRadius: "6px",
      backgroundColor: theme === "dark" ? "#0f172a" : "white",
    },
    input: {
      border: "none",
      outline: "none",
      width: "100%",
      fontSize: "14px",
      backgroundColor: "transparent",
      color: colors.text,
    },
    select: {
      width: "100%",
      height: "45px",
      padding: "0 10px",
      border: `1px solid ${colors.border}`,
      borderRadius: "6px",
      backgroundColor: theme === "dark" ? "#0f172a" : "white",
      color: colors.text,
      fontSize: "14px",
      outline: "none",
    },
    payButton: {
      marginTop: "10px",
      backgroundColor: "#10b981",
      color: "white",
      fontWeight: "bold",
      padding: "15px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontSize: "16px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "10px",
      width: "100%",
      opacity: 1,
      transition: "0.2s",
    },
    summaryRow: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "10px",
      fontSize: "14px",
      color: colors.muted,
    },
    summaryTotal: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "18px",
      fontWeight: "bold",
      color: colors.text,
    },

    // Tela de Sucesso
    successContainer: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      width: "100%",
      height: "100vh",
      backgroundColor: colors.bg,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column" as const,
      fontFamily: "sans-serif",
    },
    successContent: {
      textAlign: "center" as const,
      padding: "40px",
      maxWidth: "400px",
      width: "100%",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      gap: "20px",
    },
    successTitle: {
      fontSize: "28px",
      fontWeight: "800",
      color: colors.text,
      margin: 0,
    },
    successText: {
      fontSize: "16px",
      color: colors.muted,
      lineHeight: "1.5",
      margin: 0,
    },
    redirectBox: {
      marginTop: "20px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      color: "#10b981",
      fontWeight: "500",
      fontSize: "14px",
      backgroundColor: theme === "dark" ? "rgba(16, 185, 129, 0.2)" : "#ecfdf5",
      padding: "8px 16px",
      borderRadius: "20px",
    },
  };

  if (showSuccess) {
    return (
      <div style={styles.successContainer}>
        <style>{`
          @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
          @keyframes slideUp { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        `}</style>

        <div style={styles.successContent}>
          <div
            style={{
              animation:
                "popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
            }}
          >
            <CheckCircle
              size={80}
              color="#10b981"
              fill={theme === "dark" ? "#064e3b" : "#d1fae5"}
            />
          </div>
          <div
            style={{
              animation: "slideUp 0.8s ease forwards",
              animationDelay: "0.2s",
              opacity: 0,
            }}
          >
            <h1 style={styles.successTitle}>Pedido Realizado!</h1>
            <p style={styles.successText}>
              Seu pedido já está quase a caminho.
            </p>
            <div style={styles.redirectBox}>
              <Truck size={16} />
              <span>Redirecionando...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        .mp-input-container {
          height: 45px;
          border: 1px solid ${colors.border};
          border-radius: 6px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          background-color: ${theme === "dark" ? "#0f172a" : "white"};
        }
      `}</style>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 15px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: colors.muted,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          <ArrowLeft size={18} /> Voltar
        </button>
      </div>

      <div style={styles.grid}>
        {/* FORMULÁRIO */}
        <div>
          <h1 style={styles.title}>Pagamento Seguro</h1>

          <div style={styles.card}>
            {formError && (
              <div
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#b91c1c",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                }}
              >
                <AlertCircle size={18} /> {formError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
                color: colors.muted,
                fontSize: "14px",
              }}
            >
              <Lock size={16} /> Suas informações estão criptografadas
            </div>

            <form
              onSubmit={handlePay}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* --- CAMPOS DO CARTÃO --- */}
              <div>
                <label style={styles.label}>Número do Cartão</label>
                <div id="cardNumber-mount" className="mp-input-container"></div>
                {paymentMethodId && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#166534",
                      marginTop: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    Bandeira: {paymentMethodId.toUpperCase()}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Validade</label>
                  <div
                    id="expirationDate-mount"
                    className="mp-input-container"
                  ></div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>CVV</label>
                  <div
                    id="securityCode-mount"
                    className="mp-input-container"
                  ></div>
                </div>
              </div>

              <div>
                <label style={styles.label}>Nome no Cartão</label>
                <div style={styles.inputWrapper}>
                  <User size={18} color={colors.muted} />
                  <input
                    style={styles.input}
                    placeholder="Como impresso no cartão"
                    value={formData.cardholderName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cardholderName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>E-mail</label>
                <div style={styles.inputWrapper}>
                  <Mail size={18} color={colors.muted} />
                  <input
                    style={styles.input}
                    type="email"
                    placeholder="Para envio do comprovante"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ width: "120px" }}>
                  <label style={styles.label}>Doc.</label>
                  <select
                    style={styles.select}
                    value={formData.docType}
                    onChange={(e) =>
                      setFormData({ ...formData, docType: e.target.value })
                    }
                  >
                    {docTypes.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Número</label>
                  <div style={styles.inputWrapper}>
                    <Hash size={18} color={colors.muted} />
                    <input
                      style={styles.input}
                      placeholder="12345678909"
                      value={formData.docNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, docNumber: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {installments.length > 0 && (
                <div>
                  <label style={styles.label}>Parcelamento</label>
                  <div style={styles.inputWrapper}>
                    <Calendar size={18} color={colors.muted} />
                    <select
                      style={{
                        ...styles.input,
                        border: "none",
                        paddingLeft: 0,
                        backgroundColor: "transparent",
                      }}
                      value={formData.installments}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          installments: e.target.value,
                        })
                      }
                    >
                      {installments.map((i) => (
                        <option
                          key={i.installments}
                          value={i.installments}
                          style={{ color: "black" }}
                        >
                          {i.recommended_message}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isMpLoaded}
                style={styles.payButton}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  `Pagar R$ ${transactionAmount.toFixed(2)}`
                )}
                {!loading && <ShieldCheck size={20} />}
              </button>

              {/* --- RODAPÉ DE SEGURANÇA --- */}
              <div style={{ marginTop: "25px", textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "12px",
                    color: colors.muted,
                    marginBottom: "12px",
                  }}
                >
                  Pagamento processado por
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "15px",
                    alignItems: "center",
                    opacity: 0.8,
                  }}
                >
                  <img
                    src="https://img.icons8.com/color/48/mercado-pago.png"
                    alt="Mercado Pago"
                    style={{ height: "24px" }}
                  />
                  <div
                    style={{
                      width: "1px",
                      height: "20px",
                      backgroundColor: colors.border,
                    }}
                  ></div>
                  <img
                    src="https://img.icons8.com/color/48/visa.png"
                    alt="Visa"
                    style={{ height: "24px" }}
                  />
                  <img
                    src="https://img.icons8.com/color/48/mastercard.png"
                    alt="Mastercard"
                    style={{ height: "24px" }}
                  />
                  <img
                    src="https://img.icons8.com/color/48/amex.png"
                    alt="Amex"
                    style={{ height: "24px" }}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* RESUMO */}
        <div>
          <h2 style={styles.title}>Resumo do Pedido</h2>
          <div style={styles.card}>
            <div style={styles.summaryRow}>
              <span>Subtotal</span>
              <span>R$ {cartTotal.toFixed(2)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Frete</span>
              <span>R$ {shippingCost.toFixed(2)}</span>
            </div>
            <div
              style={{
                borderTop: `1px solid ${colors.border}`,
                margin: "15px 0",
              }}
            ></div>
            <div style={styles.summaryTotal}>
              <span>Total</span>
              <span>R$ {totalComFrete.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
