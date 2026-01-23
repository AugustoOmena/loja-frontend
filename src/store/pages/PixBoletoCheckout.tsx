import { useState, useEffect } from "react";
import { useCart } from "../../contexts/CartContext";
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
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

// --- MODAL DE SUCESSO ---
const SuccessModal = ({ data, onClose, colors }: any) => {
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
        backgroundColor: "rgba(0,0,0,0.9)",
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
          borderRadius: "12px",
          width: "100%",
          maxWidth: "500px",
          textAlign: "center",
          color: colors.text,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CheckCircle size={60} color="#10b981" />
        </div>
        <h2
          style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}
        >
          {isPix ? "Pix Gerado!" : "Boleto Gerado!"}
        </h2>

        {isPix ? (
          <div style={{ marginTop: "20px" }}>
            {data.qr_code_base64 && (
              <div
                style={{
                  background: "white",
                  padding: "10px",
                  display: "inline-block",
                  borderRadius: "8px",
                  margin: "15px 0",
                }}
              >
                <img
                  src={`data:image/png;base64,${data.qr_code_base64}`}
                  alt="QR Code"
                  style={{ width: "200px", height: "200px" }}
                />
              </div>
            )}
            <textarea
              readOnly
              value={data.qr_code}
              style={{
                width: "100%",
                height: "80px",
                fontSize: "12px",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: 10,
                color: "#333",
              }}
            />
            <button
              onClick={handleCopyPix}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Copiar Código Pix
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            <p style={{ marginBottom: 15, color: colors.muted }}>
              O boleto pode levar alguns minutos para ser registrado.
            </p>
            <a
              href={data.ticket_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                width: "100%",
                padding: "15px",
                backgroundColor: "#0f172a",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              <FileText
                size={18}
                style={{ verticalAlign: "middle", marginRight: 8 }}
              />{" "}
              Baixar Boleto PDF
            </a>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: "30px",
            width: "100%",
            padding: "12px",
            backgroundColor: "transparent",
            border: `1px solid ${colors.border}`,
            color: colors.text,
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Ir para Meus Pedidos
        </button>
      </div>
    </div>
  );
};

export const PixBoletoCheckout = () => {
  const { items, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { colors, theme } = useTheme();

  const [method, setMethod] = useState<"pix" | "boleto">(
    (location.state as any)?.defaultMethod || "pix",
  );

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

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
        transaction_amount: cartTotal > 0 ? cartTotal : 0.1,
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
        })),
      };

      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/pagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || result.message || "Erro no processamento",
        );

      clearCart();
      setSuccessData(result);
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    // NOVO: Wrapper para garantir fundo responsivo
    pageWrapper: {
      backgroundColor: colors.bg,
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start", // Evita centralizar vertical se for muito alto
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
      borderRadius: "10px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
      border: `1px solid ${colors.border}`,
      marginBottom: 20,
    },
    input: {
      width: "100%",
      padding: "12px",
      borderRadius: "6px",
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.bg,
      color: colors.text,
      marginBottom: "15px",
      fontSize: "14px",
    },
    label: {
      fontSize: "12px",
      fontWeight: "bold",
      marginBottom: "5px",
      display: "block",
      color: colors.muted,
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
    },
    tabRow: { display: "flex", gap: 10, marginBottom: 20 },
    tab: (active: boolean) => ({
      flex: 1,
      padding: 15,
      borderRadius: 8,
      border: active ? "2px solid #10b981" : `1px solid ${colors.border}`,
      background: active
        ? theme === "dark"
          ? "rgba(16,185,129,0.1)"
          : "#ecfdf5"
        : colors.card,
      cursor: "pointer",
      textAlign: "center" as const,
      fontWeight: "bold",
    }),
  };

  return (
    // Adicionei o pageWrapper aqui
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {successData && (
          <SuccessModal
            data={successData}
            colors={colors}
            onClose={() => navigate("/meus-pedidos")}
          />
        )}

        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: colors.text,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        <h1 style={{ fontSize: 24, marginBottom: 30 }}>
          Pagamento via Pix ou Boleto
        </h1>

        <div style={styles.tabRow}>
          <div
            style={styles.tab(method === "pix")}
            onClick={() => setMethod("pix")}
          >
            <QrCode
              size={24}
              style={{
                marginBottom: 5,
                display: "block",
                margin: "0 auto 5px",
              }}
            />{" "}
            Pix
          </div>
          <div
            style={styles.tab(method === "boleto")}
            onClick={() => setMethod("boleto")}
          >
            <FileText
              size={24}
              style={{
                marginBottom: 5,
                display: "block",
                margin: "0 auto 5px",
              }}
            />{" "}
            Boleto
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
                color: colors.muted,
              }}
            >
              <User size={18} /> Dados Pessoais
            </div>

            <label style={styles.label}>Nome Completo</label>
            <input
              style={styles.input}
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />

            <div style={{ display: "flex", gap: 10 }}>
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
                />
              </div>
            </div>

            {/* Endereço */}
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
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 20,
                  color: colors.muted,
                }}
              >
                <MapPin size={18} /> Endereço{" "}
                {method === "boleto" && (
                  <span style={{ color: "red", fontSize: 12 }}>
                    *Obrigatório
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  style={{ ...styles.input, width: 120 }}
                  placeholder="CEP"
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipCode: e.target.value })
                  }
                />
                <input
                  style={{ ...styles.input, flex: 1 }}
                  placeholder="Rua"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  style={{ ...styles.input, width: 80 }}
                  placeholder="Nº (ou S/N)"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                />
                <input
                  style={{ ...styles.input, flex: 1 }}
                  placeholder="Bairro"
                  value={formData.neighborhood}
                  onChange={(e) =>
                    setFormData({ ...formData, neighborhood: e.target.value })
                  }
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  style={{ ...styles.input, flex: 1 }}
                  placeholder="Cidade"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
                <input
                  style={{ ...styles.input, width: 60 }}
                  placeholder="UF"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                paddingTop: 20,
                borderTop: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              <span>Total:</span>
              <span style={{ color: "#10b981" }}>
                R$ {cartTotal.toFixed(2)}
              </span>
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
