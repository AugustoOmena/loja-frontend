import { useState, useEffect } from "react";
import { useCart } from "../../contexts/CartContext";
import { useAddress } from "../../contexts/AddressContext";
import { cartItemsToFreteItens } from "../../hooks/useFrete";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import {
  QrCode,
  FileText,
  Loader2,
  CheckCircle,
  MapPin,
  User,
  ArrowLeft,
  Copy,
  Download,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { CheckoutErrorModal } from "../../components/CheckoutErrorModal";

// --- MODAL DE SUCESSO ---
const SuccessModal = ({ data, onClose, colors, theme }: any) => {
  const isPix = data.payment_method_id === "pix";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(data.qr_code);
    alert("Código copiado!");
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.85)", // Um pouco mais transparente para modernidade
        backdropFilter: "blur(5px)", // Efeito de desfoque no fundo
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: colors.card,
          padding: "30px",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "480px",
          textAlign: "center",
          color: colors.text,
          border: `1px solid ${colors.border}`,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CheckCircle
            size={64}
            color="#10b981"
            fill={theme === "dark" ? "rgba(16, 185, 129, 0.2)" : "transparent"}
          />
        </div>
        <h2
          style={{ fontSize: "24px", fontWeight: "800", marginBottom: "10px" }}
        >
          {isPix ? "Pix Gerado!" : "Boleto Emitido!"}
        </h2>

        {isPix ? (
          <div style={{ marginTop: "20px" }}>
            <p style={{ fontSize: 14, color: colors.muted, marginBottom: 15 }}>
              Escaneie o QR Code ou copie o código abaixo:
            </p>

            {data.qr_code_base64 && (
              <div
                style={{
                  background: "white", // QR Code PRECISA de fundo branco para contraste
                  padding: "15px",
                  display: "inline-block",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <img
                  src={`data:image/png;base64,${data.qr_code_base64}`}
                  alt="QR Code"
                  style={{ width: "180px", height: "180px", display: "block" }}
                />
              </div>
            )}

            <div style={{ position: "relative" }}>
              <textarea
                readOnly
                value={data.qr_code}
                style={{
                  width: "100%",
                  height: "80px",
                  fontSize: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: 10,
                  // CORRIGIDO: Cores responsivas ao tema
                  backgroundColor: colors.bg,
                  color: colors.muted,
                  border: `1px solid ${colors.border}`,
                  resize: "none",
                  fontFamily: "monospace",
                }}
              />
            </div>

            <button
              onClick={handleCopyPix}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 15,
              }}
            >
              <Copy size={18} /> Copiar Código Pix
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            <p
              style={{
                marginBottom: 20,
                color: colors.muted,
                lineHeight: "1.5",
              }}
            >
              O boleto foi gerado com sucesso. Ele pode levar alguns minutos
              para ser registrado pelo banco.
            </p>
            <a
              href={data.ticket_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                padding: "16px",
                // CORRIGIDO: Fundo escuro mas com borda para contraste no Dark Mode
                backgroundColor: theme === "dark" ? "#1e293b" : "#0f172a",
                border: theme === "dark" ? "1px solid #334155" : "none",
                color: "white",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                gap: 10,
                fontSize: 16,
              }}
            >
              <Download size={20} />
              Baixar Boleto PDF
            </a>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "12px",
            backgroundColor: "transparent",
            border: "none",
            color: colors.muted,
            cursor: "pointer",
            fontWeight: "500",
            textDecoration: "underline",
          }}
        >
          Voltar para Meus Pedidos
        </button>
      </div>
    </div>
  );
};

export const PixBoletoCheckout = () => {
  const { items, cartTotal, clearCart, selectedShipping } = useCart();
  const { address } = useAddress();
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, theme } = useTheme();

  const [method, setMethod] = useState<"pix" | "boleto">(
    (location.state as { defaultMethod?: "pix" | "boleto" })?.defaultMethod || "pix",
  );

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<Record<string, unknown> | null>(null);
  const [errorModal, setErrorModal] = useState<{ message: string; details?: string } | null>(null);

  const shippingCost = selectedShipping?.preco ?? 0;
  const totalComFrete = cartTotal + shippingCost;

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    cpf: "",
    zipCode: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "SP",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setFormData((prev) => ({ ...prev, email: data.user.email! }));
        const nameMeta =
          data.user.user_metadata?.full_name || data.user.user_metadata?.name;
        if (nameMeta) setFormData((prev) => ({ ...prev, fullName: nameMeta }));
      }
    });
  }, []);

  useEffect(() => {
    if (address.cep || address.street || address.city) {
      setFormData((prev) => ({
        ...prev,
        zipCode: address.cep || prev.zipCode,
        street: address.street || prev.street,
        number: address.number || prev.number,
        neighborhood: address.neighborhood || prev.neighborhood,
        city: address.city || prev.city,
        state: address.state || prev.state,
      }));
    }
  }, [address.cep, address.street, address.number, address.neighborhood, address.city, address.state]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim().includes(" ")) {
      alert("Digite Nome e Sobrenome.");
      return;
    }
    if (!formData.cpf) {
      alert("CPF Obrigatório.");
      return;
    }

    if (method === "boleto") {
      const missing = [];
      if (!formData.zipCode) missing.push("CEP");
      if (!formData.street) missing.push("Rua");
      if (!formData.city) missing.push("Cidade");

      if (missing.length > 0) {
        alert(`Para boleto, preencha: ${missing.join(", ")}`);
        return;
      }
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Faça login novamente.");

      const safeItems = items || [];
      if (safeItems.length === 0) throw new Error("Carrinho vazio.");

      const names = formData.fullName.trim().split(" ");
      const safeNumber = formData.number.trim() || "S/N";
      const safeNeighborhood = formData.neighborhood.trim() || "Centro";

      const payload = {
        transaction_amount: totalComFrete > 0 ? totalComFrete : 0.1,
        payment_method_id: method === "pix" ? "pix" : "bolbradesco",
        user_id: user.id,
        payer: {
          email: formData.email,
          first_name: names[0],
          last_name: names.slice(1).join(" "),
          identification: {
            type: "CPF",
            number: formData.cpf.replace(/\D/g, ""),
          },
          address: {
            zip_code: formData.zipCode.replace(/\D/g, ""),
            street_name: formData.street,
            street_number: safeNumber,
            neighborhood: safeNeighborhood,
            city: formData.city,
            federal_unit: formData.state,
          },
        },
        items: safeItems.map((i: any) => ({
          id: i.id,
          name: i.name,
          price: Number(i.price),
          quantity: Number(i.quantity),
          image: i.image || (i.images ? i.images[0] : null),
          size: i.size,
          color: i.color ?? null,
        })),
        frete: shippingCost,
        cep: formData.zipCode.replace(/\D/g, ""),
        frete_service: selectedShipping?.service ?? selectedShipping?.id ?? selectedShipping?.transportadora,
        frete_itens: cartItemsToFreteItens(safeItems),
      };

      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/pagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        setErrorModal({
          message: result.error || result.message || "Erro no processamento",
          details: result.details,
        });
        return;
      }

      clearCart();
      setSuccessData(result);
    } catch (error: any) {
      console.error(error);
      setErrorModal({
        message: error.message || "Erro no processamento",
        details: error.details,
      });
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    pageWrapper: {
      backgroundColor: colors.bg,
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      paddingTop: "20px",
    },
    container: {
      maxWidth: "600px",
      width: "100%",
      margin: "0 auto",
      padding: "20px",
      fontFamily: "sans-serif",
      color: colors.text,
    },
    card: {
      backgroundColor: colors.card,
      padding: "25px",
      borderRadius: "12px",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      border: `1px solid ${colors.border}`,
      marginBottom: 20,
    },
    input: {
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      border: `1px solid ${colors.border}`,
      // Fundo BG para dar contraste dentro do Card
      backgroundColor: colors.bg,
      color: colors.text,
      marginBottom: "15px",
      fontSize: "14px",
      outline: "none",
      transition: "border-color 0.2s",
    },
    label: {
      fontSize: "12px",
      fontWeight: "bold",
      marginBottom: "6px",
      display: "block",
      color: colors.muted,
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
    },
    btn: {
      width: "100%",
      padding: "16px",
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
      marginTop: 10,
      transition: "background 0.2s",
    },
    tabRow: { display: "flex", gap: 15, marginBottom: 25 },
    tab: (active: boolean) => ({
      flex: 1,
      padding: "15px",
      borderRadius: "10px",
      // Borda verde se ativo, borda padrão se inativo
      border: active ? "2px solid #10b981" : `1px solid ${colors.border}`,
      // Fundo levemente verde se ativo, ou cor do card
      background: active
        ? theme === "dark"
          ? "rgba(16,185,129,0.15)"
          : "#ecfdf5"
        : colors.card,
      // Texto verde se ativo, texto normal se inativo
      color: active ? "#10b981" : colors.text,
      cursor: "pointer",
      textAlign: "center" as const,
      fontWeight: "bold",
      transition: "all 0.2s ease",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      gap: 5,
    }),
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {successData && (
          <SuccessModal
            data={successData}
            colors={colors}
            theme={theme}
            onClose={() => navigate("/minha-conta")}
          />
        )}

        <CheckoutErrorModal
          open={!!errorModal}
          message={errorModal?.message ?? ""}
          details={errorModal?.details}
          onClose={() => setErrorModal(null)}
          colors={colors}
        />

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

        <h1 style={{ fontSize: 26, fontWeight: "800", marginBottom: 30 }}>
          Pagamento
        </h1>

        <div style={styles.tabRow}>
          <div
            style={styles.tab(method === "pix")}
            onClick={() => setMethod("pix")}
          >
            <QrCode
              size={24}
              color={method === "pix" ? "#10b981" : colors.muted}
            />
            <span>Pix</span>
          </div>
          <div
            style={styles.tab(method === "boleto")}
            onClick={() => setMethod("boleto")}
          >
            <FileText
              size={24}
              color={method === "boleto" ? "#10b981" : colors.muted}
            />
            <span>Boleto</span>
          </div>
        </div>

        <div style={styles.card}>
          <form onSubmit={handlePay}>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginBottom: 20,
                color: colors.text,
                fontWeight: "bold",
                paddingBottom: 15,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <User size={20} color={colors.muted} /> Dados do Pagador
            </div>

            <label style={styles.label}>Nome Completo</label>
            <input
              style={styles.input}
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="Ex: João da Silva"
            />

            <div style={{ display: "flex", gap: 15 }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>CPF</label>
                <input
                  style={styles.input}
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf: e.target.value })
                  }
                  placeholder="000.000.000-00"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Endereço */}
            <div style={{ marginTop: 25 }}>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 20,
                  color: colors.text,
                  fontWeight: "bold",
                  paddingBottom: 15,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <MapPin size={20} color={colors.muted} /> Endereço{" "}
                {method === "boleto" && (
                  <span
                    style={{
                      color: "#ef4444",
                      fontSize: 11,
                      fontWeight: "normal",
                      marginLeft: "auto",
                    }}
                  >
                    *Obrigatório para Boleto
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: 15 }}>
                <div style={{ width: "35%" }}>
                  <label style={styles.label}>CEP</label>
                  <input
                    style={styles.input}
                    placeholder="00000-000"
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Rua</label>
                  <input
                    style={styles.input}
                    placeholder="Nome da Rua"
                    value={formData.street}
                    onChange={(e) =>
                      setFormData({ ...formData, street: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 15 }}>
                <div style={{ width: "25%" }}>
                  <label style={styles.label}>Número</label>
                  <input
                    style={styles.input}
                    placeholder="Nº"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Bairro</label>
                  <input
                    style={styles.input}
                    placeholder="Bairro"
                    value={formData.neighborhood}
                    onChange={(e) =>
                      setFormData({ ...formData, neighborhood: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 15 }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Cidade</label>
                  <input
                    style={styles.input}
                    placeholder="Cidade"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div style={{ width: "20%" }}>
                  <label style={styles.label}>UF</label>
                  <input
                    style={styles.input}
                    placeholder="UF"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                paddingTop: 20,
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  fontSize: 14,
                  color: colors.muted,
                }}
              >
                <span>Subtotal</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  fontSize: 14,
                  color: colors.muted,
                }}
              >
                <span>Frete</span>
                <span>R$ {shippingCost.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 15,
                  fontSize: 20,
                  fontWeight: "800",
                }}
              >
                <span>Total a pagar</span>
                <span style={{ color: "#10b981" }}>
                  R$ {totalComFrete.toFixed(2)}
                </span>
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : method === "pix" ? (
                "Gerar Código Pix"
              ) : (
                "Emitir Boleto"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
