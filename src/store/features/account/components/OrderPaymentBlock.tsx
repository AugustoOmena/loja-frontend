import { useState, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Copy, QrCode, FileDown, Calendar } from "lucide-react";
import { formatPaymentExpiration } from "@/utils/orderHelpers";

export interface OrderPaymentBlockProps {
  /** Código PIX (copiar e colar) – quando preenchido, exibe UI de PIX */
  paymentCode: string;
  /** URL do PDF do boleto – quando preenchido, exibe botão de download */
  paymentUrl: string;
  /** Data/hora de vencimento (ISO) – exibida com destaque de urgência */
  paymentExpiration: string | null;
}

/**
 * Bloco de pagamento pendente (PIX ou Boleto).
 * Componente presentacional: recebe dados já normalizados e exibe card com código/link e vencimento.
 */
export function OrderPaymentBlock({
  paymentCode,
  paymentUrl,
  paymentExpiration,
}: OrderPaymentBlockProps) {
  const { colors } = useTheme();
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleCopyCode = useCallback(() => {
    if (!paymentCode) return;
    navigator.clipboard.writeText(paymentCode).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  }, [paymentCode]);

  const isPix = !!paymentCode;

  return (
    <section
      style={{
        marginBottom: "24px",
        padding: "16px",
        backgroundColor: colors.bg,
        borderRadius: "12px",
        border: `1px solid ${colors.border}`,
        borderLeft: "4px solid #c2410c",
      }}
    >
      <h3
        style={{
          fontSize: "14px",
          fontWeight: "600",
          color: colors.muted,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {isPix ? (
          <>
            <QrCode size={16} />
            Pagamento PIX
          </>
        ) : (
          <>
            <FileDown size={16} />
            Boleto
          </>
        )}
      </h3>

      {isPix && (
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "12px",
              color: colors.muted,
              marginBottom: "6px",
            }}
          >
            Código PIX (copie e cole no app do seu banco)
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <code
              style={{
                flex: "1 1 100%",
                minWidth: 0,
                padding: "10px 12px",
                backgroundColor: colors.card,
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "12px",
                wordBreak: "break-all",
                border: `1px solid ${colors.border}`,
              }}
            >
              {paymentCode}
            </code>
            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.card,
                color: colors.text,
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <Copy size={16} />
              {copyFeedback ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
      )}

      {!isPix && paymentUrl && (
        <div style={{ marginBottom: "12px" }}>
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: "#c2410c",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            <FileDown size={18} />
            Baixar PDF do Boleto
          </a>
        </div>
      )}

      {paymentExpiration && (
        <div
          style={{
            fontSize: "13px",
            color: "#c2410c",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Calendar size={14} />
          Vencimento: {formatPaymentExpiration(paymentExpiration)}
        </div>
      )}
    </section>
  );
}
