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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { useCart } from "../../contexts/CartContext";

// --- INTERFACES ---
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

export const Checkout = () => {
  const navigate = useNavigate();
  const { cartTotal, clearCart } = useCart();

  // Garante valor válido
  const transactionAmount = cartTotal > 0 ? cartTotal : 100;

  // Refs para valores mutáveis
  const amountRef = useRef(transactionAmount);
  useEffect(() => {
    amountRef.current = transactionAmount;
  }, [transactionAmount]);

  const [loading, setLoading] = useState(false);
  const [docTypes, setDocTypes] = useState<IdentificationType[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [installments, setInstallments] = useState<PayerCost[]>([]);
  const [formError, setFormError] = useState("");
  const [isMpLoaded, setIsMpLoaded] = useState(false); // Estado para controlar carregamento do script

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
    if (cartTotal <= 0) {
      const timer = setTimeout(() => {
        alert("Seu carrinho está vazio!");
        navigate("/");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cartTotal, navigate]);

  // --- FUNÇÃO AUXILIAR DE BUSCA (Agora dentro do componente para acessar os States) ---
  const fetchPaymentMethodInfo = async (mp: any, bin: string) => {
    try {
      console.log("🔍 Buscando dados para BIN:", bin);
      const { results } = await mp.getPaymentMethods({ bin });

      if (results.length > 0) {
        const method = results[0];
        setPaymentMethodId(method.id);
        console.log("✅ Bandeira Detectada:", method.id);

        // Busca Emissores
        const issuersRes = await mp.getIssuers({
          paymentMethodId: method.id,
          bin,
        });
        setIssuers(issuersRes);
        if (issuersRes.length > 0) {
          setFormData((p) => ({ ...p, issuer: issuersRes[0].id }));
        }

        // Busca Parcelas
        const installmentsRes = await mp.getInstallments({
          amount: amountRef.current.toString(),
          bin,
          paymentTypeId: "credit_card",
        });

        if (installmentsRes.length > 0) {
          setInstallments(installmentsRes[0].payer_costs);
          // Pré-seleciona a primeira opção
          setFormData((p) => ({
            ...p,
            installments:
              installmentsRes[0].payer_costs[0].installments.toString(),
          }));
        }

        return method.id;
      } else {
        console.warn("⚠️ Nenhuma bandeira encontrada para este BIN");
      }
    } catch (error) {
      console.error("❌ Erro ao buscar detalhes do meio de pagamento:", error);
    }
    return null;
  };

  // --- INICIALIZAÇÃO DO MERCADO PAGO ---
  useEffect(() => {
    const init = async () => {
      await loadMercadoPago();

      // @ts-ignore
      const mp = new window.MercadoPago(
        "TEST-33d77029-c5e0-425f-b848-606ac9a9264f",
      );
      mpRef.current = mp;

      // 1. Criação dos Campos
      const cardNumberElement = mp.fields.create("cardNumber", {
        placeholder: "0000 0000 0000 0000",
        style: { fontSize: "14px", color: "#333" },
      });

      const expirationDateElement = mp.fields.create("expirationDate", {
        placeholder: "MM/AA",
        style: { fontSize: "14px", color: "#333" },
      });

      const securityCodeElement = mp.fields.create("securityCode", {
        placeholder: "123",
        style: { fontSize: "14px", color: "#333" },
      });

      // 2. Função de Espera (Resolve o erro "Container not found")
      const waitForContainers = () => {
        const c1 = document.getElementById("cardNumber-mount");
        const c2 = document.getElementById("expirationDate-mount");
        const c3 = document.getElementById("securityCode-mount");
        return c1 && c2 && c3;
      };

      const mountFields = async () => {
        let attempts = 0;
        while (!waitForContainers() && attempts < 20) {
          await new Promise((r) => setTimeout(r, 100)); // Espera 100ms
          attempts++;
        }

        if (!waitForContainers()) {
          console.error("❌ Erro: Containers do MP não encontrados no DOM.");
          return;
        }

        try {
          await cardNumberElement.mount("cardNumber-mount");
          await expirationDateElement.mount("expirationDate-mount");
          await securityCodeElement.mount("securityCode-mount");
          setIsMpLoaded(true); // Libera o form visualmente
        } catch (e) {
          console.error("Erro ao montar campos:", e);
        }
      };

      // 3. Listener de BIN (Detecta digitação/colagem)
      cardNumberElement.on("binChange", async (data: any) => {
        const { bin } = data;
        setFormError("");

        if (bin) {
          await fetchPaymentMethodInfo(mp, bin);
        } else {
          setPaymentMethodId("");
          setIssuers([]);
          setInstallments([]);
        }
      });

      // Inicia montagem
      mountFields();

      // 4. Docs
      try {
        const types = await mp.getIdentificationTypes();
        setDocTypes(types);
        if (types.length > 0)
          setFormData((p) => ({ ...p, docType: types[0].id }));
      } catch (e) {
        console.error(e);
      }
    };

    init();

    return () => {
      mpRef.current = null;
    };
  }, []);

  // --- HANDLER DE PAGAMENTO ---
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setLoading(true);

    try {
      // --- CORREÇÃO AQUI ---
      // Trocamos getUser() por getSession() para evitar o erro de "Sessão Expirada"
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !session.user) {
        alert("Sessão não encontrada. Por favor, faça login novamente.");
        // Salva a intenção de ir pro checkout (opcional, mas boa prática)
        navigate("/login");
        return;
      }

      const user = session.user; // Pegamos o usuário da sessão
      // ---------------------

      if (!formData.email || !formData.docNumber || !formData.cardholderName) {
        throw new Error("Preencha todos os campos (Nome, Email e CPF).");
      }

      // 2. Tokenização
      const token = await mpRef.current.fields.createCardToken({
        cardholderName: formData.cardholderName,
        identificationType: formData.docType,
        identificationNumber: formData.docNumber,
      });

      console.log("Token Gerado:", token.id);

      // --- FALLBACK MÁGICO ---
      let finalPaymentMethodId = paymentMethodId;

      if (!finalPaymentMethodId) {
        console.log(
          "⚠️ Bandeira não detectada automaticamente. Tentando recuperar pelo Token...",
        );
        const firstSix = token.first_six_digits;
        if (firstSix) {
          const detectedId = await fetchPaymentMethodInfo(
            mpRef.current,
            firstSix,
          );
          if (detectedId) finalPaymentMethodId = detectedId;
        }
      }

      if (!finalPaymentMethodId) {
        throw new Error(
          "Não foi possível identificar a bandeira do cartão. Verifique o número.",
        );
      }

      // 3. Payload Final
      const payload = {
        token: token.id,
        transaction_amount: transactionAmount,
        payment_method_id: finalPaymentMethodId,
        installments: Number(formData.installments) || 1,
        issuer_id: formData.issuer,
        payer: { email: formData.email },
        user_id: user.id,
      };

      // 4. Envio Backend
      const API_URL = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${API_URL}/pagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (
        response.ok &&
        (result.status === "approved" || result.status === "in_process")
      ) {
        clearCart();
        alert(`Pagamento Aprovado! ID: ${result.id}`);
        navigate("/minha-conta/pedidos");
      } else {
        setFormError(
          result.status_detail || result.error || "Pagamento recusado.",
        );
      }
    } catch (error: any) {
      console.error(error);
      setFormError(error.message || "Erro ao processar pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        padding: "20px 0",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "0 15px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "30px",
        }}
      >
        {/* --- FORMULÁRIO --- */}
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "20px",
              color: "#1e293b",
            }}
          >
            Pagamento Seguro
          </h1>
          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
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
                <AlertCircle size={18} />
                {formError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              <Lock size={16} /> Suas informações estão criptografadas
            </div>

            <form
              onSubmit={handlePay}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div>
                <label style={styles.label}>Número do Cartão</label>
                <div id="cardNumber-mount" className="mp-input-container"></div>

                {/* Debug Visual */}
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
                  <User size={18} color="#94a3b8" />
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
                  <Mail size={18} color="#94a3b8" />
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
                    <Hash size={18} color="#94a3b8" />
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

              {/* PARCELAMENTO (Só mostra se tiver opções carregadas) */}
              {installments.length > 0 && (
                <div>
                  <label style={styles.label}>Parcelamento</label>
                  <div style={styles.inputWrapper}>
                    <Calendar size={18} color="#94a3b8" />
                    <select
                      style={{
                        ...styles.input,
                        border: "none",
                        paddingLeft: 0,
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
                        <option key={i.installments} value={i.installments}>
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
                {loading
                  ? "Processando..."
                  : `Pagar R$ ${transactionAmount.toFixed(2)}`}
                {!loading && <ShieldCheck size={20} />}
              </button>
            </form>
          </div>
        </div>

        {/* --- RESUMO --- */}
        <div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "20px",
              color: "#1e293b",
            }}
          >
            Resumo do Pedido
          </h2>
          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
                fontSize: "14px",
                color: "#64748b",
              }}
            >
              <span>Subtotal</span>
              <span>R$ {transactionAmount.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
                fontSize: "14px",
                color: "#64748b",
              }}
            >
              <span>Frete</span>
              <span>Grátis</span>
            </div>
            <div
              style={{ borderTop: "1px solid #e2e8f0", margin: "15px 0" }}
            ></div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "18px",
                fontWeight: "bold",
                color: "#1e293b",
              }}
            >
              <span>Total</span>
              <span>R$ {transactionAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "6px",
    display: "block",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 12px",
    height: "45px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "white",
  },
  input: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "14px",
    color: "#333",
  },
  select: {
    width: "100%",
    height: "45px",
    padding: "0 10px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "white",
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
};
